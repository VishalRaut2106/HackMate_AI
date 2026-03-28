"use client"

import type React from "react"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"

// Centralized global providers wrapper
// Add future providers here (Theme, QueryClient, etc.)
export function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
  <ThemeProvider>
    <QueryClientProvider>
      {children}
      <Toaster />
    </QueryClientProvider>
  </ThemeProvider>
</AuthProvider>
  )
}