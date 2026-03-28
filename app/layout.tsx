import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"

import { Providers } from "./providers"
import "./globals.css"

// Load Geist fonts and expose as CSS variables
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

// Global metadata (SEO + browser config)
export const metadata: Metadata = {
  title: "HackMate AI - Turn Hackathon Ideas into Execution",
  description:
    "AI-powered collaboration platform that helps hackathon teams clarify ideas, distribute tasks, manage time, and receive real-time mentorship.",
  icons: {
    icon: [
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

// Viewport config
export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
}

// Root layout
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        {/* Global providers */}
        <Providers>{children}</Providers>

        {/* Vercel analytics */}
        <Analytics />
      </body>
    </html>
  )
}