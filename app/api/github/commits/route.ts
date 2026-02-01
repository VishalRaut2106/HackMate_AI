import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const repoUrl = searchParams.get("url")

  if (!repoUrl) {
    return NextResponse.json({ error: "Repository URL is required" }, { status: 400 })
  }

  try {
    // Parse URL to get owner and repo
    // Handles formats like:
    // https://github.com/owner/repo
    // https://github.com/owner/repo.git
    const urlParts = repoUrl.replace(/\.git$/, "").split("/")
    const repoIndex = urlParts.indexOf("github.com")
    
    if (repoIndex === -1 || urlParts.length < repoIndex + 3) {
      return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 })
    }

    const owner = urlParts[repoIndex + 1]
    const repo = urlParts[repoIndex + 2]

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`
    
    const headers: HeadersInit = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "HackMate-AI-Project",
    }

    // Add token if available
    if (process.env.GITHUB_ACCESS_TOKEN) {
      headers["Authorization"] = `token ${process.env.GITHUB_ACCESS_TOKEN}`
    }

    const response = await fetch(apiUrl, { headers })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      if (response.status === 403 && errorData.message?.includes("API rate limit exceeded")) {
         return NextResponse.json(
          { error: "GitHub API rate limit exceeded. Please try again later or add a token." },
          { status: 429 }
        )
      }

      if (response.status === 404) {
        return NextResponse.json(
          { error: "Repository not found or is private." },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: errorData.message || "Failed to fetch commits" },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Transform to simpler format
    const commits = data.map((commit: any) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        name: commit.commit.author.name,
        date: commit.commit.author.date,
        avatar_url: commit.author?.avatar_url
      },
      html_url: commit.html_url
    }))

    return NextResponse.json({ commits })
  } catch (error: any) {
    console.error("GitHub API Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}