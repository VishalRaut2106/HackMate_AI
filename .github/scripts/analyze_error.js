const fs = require('fs');
const path = require('path');

async function analyzeError() {
  console.log('Starting analyzeError script...');
  console.log('Environment check:');
  console.log('- OPENROUTER_API_KEY present:', !!process.env.OPENROUTER_API_KEY);
  console.log('- GITHUB_TOKEN present:', !!process.env.GITHUB_TOKEN);
  console.log('- Repo:', process.env.GITHUB_REPOSITORY);
  console.log('- PR:', process.env.PR_NUMBER);

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN;
  const repoOwner = process.env.GITHUB_REPOSITORY_OWNER;
  const repoName = process.env.GITHUB_REPOSITORY.split('/')[1];
  const prNumber = process.env.PR_NUMBER;

  if (!openRouterKey) {
    console.log('Note: OPENROUTER_API_KEY is not set. Skipping AI analysis.');
    process.exit(0); // Exit successfully, just skip the analysis
  }

  if (!githubToken) {
    console.error('Missing GITHUB_TOKEN. Cannot comment on PR.');
    process.exit(1);
  }

  // Read the error log
  const logPath = path.join(process.cwd(), 'build_logs.txt');
  let errorLog = '';
  try {
    errorLog = fs.readFileSync(logPath, 'utf8');
  } catch (err) {
    console.error('Could not read build_logs.txt');
    process.exit(1);
  }

  // Truncate log to last 2000 chars to fit context window and focus on the error
  const truncatedLog = errorLog.slice(-3000);

  const prompt = `
    You are a senior software engineer. The following is a build/lint error log from a Next.js project.
    Analyze the error and provide a clear, concise explanation of what went wrong and how to fix it.
    
    Format your response in Markdown. Use headings and code blocks.
    
    Error Log:
    \`\`\`
    ${truncatedLog}
    \`\`\`
  `;

  try {
    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo', // Cost-effective and sufficient for error analysis
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      console.error('Invalid response from OpenRouter:', JSON.stringify(data));
      process.exit(1);
    }

    const aiAnalysis = data.choices[0].message.content;
    const finalComment = `### ❌ Build/Lint Failed\n\n**Here is an AI analysis of the error:**\n\n${aiAnalysis}`;

    // Post comment to GitHub PR
    const commentResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/issues/${prNumber}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'actions-script',
        'Accept': 'application/vnd.github.v3+json' 
      },
      body: JSON.stringify({ body: finalComment }),
    });

    if (!commentResponse.ok) {
      console.error('Failed to post comment to GitHub:', await commentResponse.text());
      process.exit(1);
    }

    console.log('Successfully posted analysis to PR.');

  } catch (error) {
    console.error('Error in analyze script:', error);
    process.exit(1);
  }
}

analyzeError();
