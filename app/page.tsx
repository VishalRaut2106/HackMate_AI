"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import LandingPage from "@/components/landing-page"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is authenticated and has selected user type, redirect to dashboard
    if (!loading && user && user.userType) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If user is authenticated but hasn't selected user type, let AuthPage handle it
  if (user && !user.userType) {
    return null // AuthPage will be shown by the auth flow
  }

  // If user is fully authenticated, redirect is handled by useEffect
  if (user && user.userType) {
    return null
  }

  return <LandingPage />
}
