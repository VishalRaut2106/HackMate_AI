/**
 * Environment validation utility
 * Helps debug environment variable issues
 */

export function validateEnvironment() {
  const requiredEnvVars = {
    // Firebase config
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    
    // OpenRouter API
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  }

  const missing: string[] = []
  const present: string[] = []

  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
      missing.push(key)
    } else {
      present.push(key)
    }
  })

  return {
    isValid: missing.length === 0,
    missing,
    present,
    summary: missing.length === 0 
      ? "✅ All environment variables are configured"
      : `❌ Missing ${missing.length} environment variables: ${missing.join(", ")}`
  }
}

// For debugging in development
if (process.env.NODE_ENV === "development") {
  const validation = validateEnvironment()
  console.log("Environment validation:", validation.summary)
  
  if (!validation.isValid) {
    console.warn("Missing environment variables:", validation.missing)
  }
}