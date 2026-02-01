import { type NextRequest, NextResponse } from "next/server"

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!

/**
 * Stable FREE models (order matters)
 * Gemini free is LAST because it rate-limits a lot
 */
const FREE_MODELS = [
  "meta-llama/llama-3.2-3b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "huggingfaceh4/zephyr-7b-beta:free",
  "google/gemini-2.0-flash-exp:free",
]

/**
 * Optimized caching with longer TTL and request deduplication
 */
const responseCache = new Map<string, { result: string; timestamp: number }>()
const pendingRequests = new Map<string, Promise<string>>() // Request deduplication

// Optimized cache TTL based on content type
const CACHE_TTL = {
  analyze_idea: 24 * 60 * 60 * 1000,    // 24 hours - analysis doesn't change
  generate_tasks: 12 * 60 * 60 * 1000,  // 12 hours - tasks are fairly stable
  mentor_chat: 60 * 60 * 1000,          // 1 hour - chat can be cached briefly
}

interface GeminiRequest {
  action: "analyze_idea" | "generate_tasks" | "mentor_chat"
  data: {
    idea?: string
    features?: string[]
    question?: string
    context?: string
    projectName?: string
    duration?: string
    persona?: string
  }
}

/**
 * Clean and validate JSON response from AI
 */
function cleanAndParseJSON(text: string, expectedType: 'object' | 'array'): any {
  try {
    // Remove markdown code blocks if present
    let cleaned = text.replace(/```json\s*|\s*```/g, '').trim()
    
    // Extract JSON from text
    if (expectedType === 'object') {
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (match) cleaned = match[0]
    } else {
      const match = cleaned.match(/\[[\s\S]*\]/)
      if (match) cleaned = match[0]
    }
    
    // Fix common JSON issues
    cleaned = cleaned
      .replace(/'/g, '"')  // Replace single quotes with double quotes
      .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
      .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Quote unquoted keys
    
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('JSON parsing failed:', error, 'Text:', text)
    throw new Error('Invalid JSON response from AI')
  }
}

/**
 * Generate fallback responses when AI fails
 */
function getFallbackResponse(action: string, data: any): any {
  switch (action) {
    case "analyze_idea":
      return {
        problem_statement: `This project aims to solve a specific problem during the hackathon timeframe. The idea focuses on ${data.idea?.slice(0, 100) || 'innovative solutions'}.`,
        target_users: ["Hackathon participants", "General users", "Tech enthusiasts"],
        features: ["Core functionality", "User interface", "Basic features", "Integration capabilities"],
        risks: ["Time constraints", "Technical complexity", "Scope creep"],
        tech_stack_suggestions: ["JavaScript", "React", "Node.js", "Firebase"]
      }
    
    case "generate_tasks":
      return [
        { title: "Set up project structure", description: "Initialize the project with basic folder structure and dependencies", effort: "Low" },
        { title: "Design user interface", description: "Create wireframes and basic UI components for the application", effort: "Medium" },
        { title: "Implement core functionality", description: "Build the main features and business logic of the application", effort: "High" },
        { title: "Add styling and polish", description: "Improve the visual design and user experience", effort: "Medium" },
        { title: "Test and debug", description: "Fix bugs and ensure everything works properly", effort: "Medium" },
        { title: "Prepare presentation", description: "Create demo materials and presentation for judges", effort: "Low" },
        { title: "Deploy application", description: "Set up hosting and deploy the final version", effort: "Low" },
        { title: "Documentation", description: "Write README and basic documentation", effort: "Low" }
      ]
    
    default:
      return null
  }
}

function getCacheKey(action: string, data: any): string {
  return `${action}:${JSON.stringify(data)}`
}

async function callAI(prompt: string): Promise<string> {
  let lastError: Error | null = null

  for (const model of FREE_MODELS) {
    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://hackmate.vercel.app",
            "X-Title": "HackMate AI",
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt.slice(0, 2000) }], // token safety
            temperature: 0.7, // Optimize for consistency
            max_tokens: 1000, // Limit response size
          }),
        }
      )

      // Handle rate limit with exponential backoff
      if (response.status === 429) {
        console.warn(`⚠️ ${model} rate-limited. Waiting...`)
        const retryAfter = parseInt(response.headers.get('retry-after') || '2')
        await new Promise((res) => setTimeout(res, retryAfter * 1000))
        continue
      }

      if (!response.ok) {
        const errorText = await response.text()
        lastError = new Error(errorText)
        continue
      }

      const data = await response.json()
      const content = data?.choices?.[0]?.message?.content

      if (content) return content
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Unknown error")
      continue
    }
  }

  throw lastError || new Error("All AI models failed")
}

export async function POST(request: NextRequest) {
  try {
    const body: GeminiRequest = await request.json()
    const { action, data } = body

    const cacheKey = getCacheKey(action, data)
    const cacheTTL = CACHE_TTL[action] || CACHE_TTL.mentor_chat
    const cached = responseCache.get(cacheKey)

    // ✅ Check cache with action-specific TTL
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      return NextResponse.json({ result: cached.result, cached: true })
    }

    // ✅ Request deduplication - check if same request is already in flight
    const existingRequest = pendingRequests.get(cacheKey)
    if (existingRequest) {
      try {
        const result = await existingRequest
        return NextResponse.json({ result, deduped: true })
      } catch (error) {
        // If pending request failed, continue with new request
        pendingRequests.delete(cacheKey)
      }
    }

    let result = ""
    let parsedResult: any = null

    // ✅ Create promise for request deduplication
    const requestPromise = (async () => {
      try {
        switch (action) {
          case "analyze_idea": {
            const prompt = `You are a hackathon project analyzer. Analyze this idea and return ONLY valid JSON.

Idea: ${data.idea}
Duration: ${data.duration || "24h"}

Return this EXACT JSON structure with NO extra text:
{
  "problem_statement": "Clear 2-3 sentence description of the problem",
  "target_users": ["specific user group 1", "specific user group 2"],
  "features": ["feature 1", "feature 2", "feature 3", "feature 4"],
  "risks": ["risk 1", "risk 2", "risk 3"],
  "tech_stack_suggestions": ["technology 1", "technology 2", "technology 3"]
}`

            result = await callAI(prompt)
            parsedResult = cleanAndParseJSON(result, 'object')
            
            // Validate required fields
            if (!parsedResult.problem_statement || !Array.isArray(parsedResult.target_users)) {
              throw new Error('Invalid response structure')
            }
            
            result = JSON.stringify(parsedResult)
            break
          }

          case "generate_tasks": {
            const prompt = `You are a hackathon task generator. Create tasks for this project and return ONLY valid JSON.

Project: ${data.projectName}
Features: ${data.features?.join(", ") || "Basic functionality"}
Duration: ${data.duration}

Return this EXACT JSON array with NO extra text:
[
  {"title": "Task name", "description": "Brief description", "effort": "Low"},
  {"title": "Task name", "description": "Brief description", "effort": "Medium"},
  {"title": "Task name", "description": "Brief description", "effort": "High"}
]

Generate 6-8 realistic tasks. Use only "Low", "Medium", or "High" for effort.`

            result = await callAI(prompt)
            parsedResult = cleanAndParseJSON(result, 'array')
            
            // Validate array structure
            if (!Array.isArray(parsedResult) || parsedResult.length === 0) {
              throw new Error('Invalid task array')
            }
            
            // Validate each task
            parsedResult = parsedResult.map((task: any) => ({
              title: task.title || "Untitled Task",
              description: task.description || "No description provided",
              effort: ["Low", "Medium", "High"].includes(task.effort) ? task.effort : "Medium"
            }))
            
            result = JSON.stringify(parsedResult)
            break
          }

          case "mentor_chat": {
            const persona = data.persona || "general";
            const projectContext = typeof data.context === 'string' ? data.context : JSON.stringify(data.context);
            
            let systemInstruction = "";
            switch (persona) {
              case "technical":
                systemInstruction = "You are a Senior Chief Technology Officer (CTO) mentor. Focus on architecture, code quality, best practices, scalability, and solving specific bugs. Provide code snippets where helpful.";
                break;
              case "product":
                systemInstruction = "You are a Lead Product Manager mentor. Focus on user value, MVP definition, feature prioritization, 'jobs to be done', and user experience. Helps cut scope to meet deadlines.";
                break;
              case "pitch":
                systemInstruction = "You are a Pitch Deck Coach and Venture Capitalist. Focus on storytelling, the 'hook', business model, market size, and presentation delivery. Critique the pitch.";
                break;
              default:
                systemInstruction = "You are an experienced Hackathon Guide. You provide balanced advice on teamwork, time management, stress reduction, and overall project success.";
            }

            const prompt = `${systemInstruction}

You are helping a team at a hackathon. Time is critical.
Be encouraging but direct. Use Markdown formatting.

Project Context:
${projectContext}

User Question: ${data.question}

Response:`;

            result = await callAI(prompt)
            break
          }

          default:
            throw new Error("Invalid action")
        }

        return result
      } catch (aiError) {
        console.warn(`AI failed for ${action}, using fallback:`, aiError)
        
        // Use fallback responses for structured data
        if (action === "analyze_idea" || action === "generate_tasks") {
          const fallback = getFallbackResponse(action, data)
          if (fallback) {
            return JSON.stringify(fallback)
          }
        }
        throw aiError
      }
    })()

    // Store pending request for deduplication
    pendingRequests.set(cacheKey, requestPromise)

    try {
      result = await requestPromise
    } finally {
      // Clean up pending request
      pendingRequests.delete(cacheKey)
    }

    // ✅ Cache response with action-specific TTL
    responseCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    })

    return NextResponse.json({ result })
  } catch (error) {
    console.error("AI API Error:", error)
    return NextResponse.json(
      { error: "AI is temporarily busy. Please try again." },
      { status: 503 }
    )
  }
}