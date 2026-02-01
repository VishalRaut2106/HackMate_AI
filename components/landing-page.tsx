"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Rocket,
  Users,
  Brain,
  Clock,
  Zap,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Target,
  ListTodo,
  Presentation,
} from "lucide-react"

export default function LandingPage() {
  const router = useRouter()

  const handleGetStarted = () => {
    router.push("/auth")
  }

  const features = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "AI-Powered Idea Analysis",
      description:
        "Transform raw ideas into structured project plans with problem statements, features, and risk analysis.",
    },
    {
      icon: <ListTodo className="h-6 w-6" />,
      title: "Smart Task Generation",
      description: "Automatically break down features into actionable tasks with effort estimates and priorities.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Real-Time Collaboration",
      description: "Work together seamlessly with live updates, team chat, and shared resources.",
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "AI Mentor Chat",
      description: "Get instant guidance on task priorities, scope reduction, debugging, and pitch preparation.",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Time Management",
      description: "Built-in countdown timers and milestone tracking to keep your team on schedule.",
    },
    {
      icon: <Presentation className="h-6 w-6" />,
      title: "Demo & Pitch Tools",
      description: "Present your project with demo mode and export professional pitch decks.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                AI-Powered Hackathon Platform
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                Turn Ideas Into
                <span className="text-primary block">Winning Projects</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
                HackMate AI transforms chaotic hackathon ideas into structured execution plans. 
                Get AI-powered analysis, smart task generation, and real-time collaboration 
                to build amazing projects in record time.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  onClick={handleGetStarted} 
                  size="lg" 
                  className="text-lg px-8 py-6"
                >
                  Start Building Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-6"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Learn More
                </Button>
              </div>
              
              <div className="flex items-center gap-6 mt-8 justify-center lg:justify-start text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Free to start
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  No credit card
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  2-minute setup
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2">
              <Card className="shadow-xl border-2">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Get Started</CardTitle>
                  <CardDescription>Join your team and start building amazing projects</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleGetStarted} 
                    className="w-full text-lg py-6"
                    size="lg"
                  >
                    Start Building Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  
                  <div className="text-center text-sm text-muted-foreground">
                    <p>✨ Free to get started</p>
                    <p>🚀 No credit card required</p>
                    <p>⚡ Set up in under 2 minutes</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Win</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From idea to demo, HackMate AI guides your team through every step of the hackathon journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get from zero to demo in four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Create Project",
                description: "Start a new project and invite your team with a join code",
                icon: <Rocket />,
              },
              {
                step: "2",
                title: "Submit Idea",
                description: "Describe your idea and let AI analyze and structure it",
                icon: <Brain />,
              },
              {
                step: "3",
                title: "Generate Tasks",
                description: "AI breaks down features into actionable, assignable tasks",
                icon: <Target />,
              },
              {
                step: "4",
                title: "Build & Present",
                description: "Collaborate in real-time and present with demo mode",
                icon: <Presentation />,
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Build Something Amazing?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of developers who are already using HackMate AI to turn their ideas into winning projects.
          </p>
          <Button 
            onClick={handleGetStarted} 
            size="lg" 
            className="text-lg px-8 py-6"
          >
            Get Started for Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Rocket className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">HackMate AI</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2026 HackMate AI. Built for hackathon teams worldwide.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}