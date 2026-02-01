"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { SUBSCRIPTION_PLANS } from "@/lib/subscription"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Check,
  Zap,
  Users,
  BarChart3,
  Shield,
  Palette,
  Plug,
  HardDrive,
  Video,
  Crown,
  ArrowLeft,
  Sparkles,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function PricingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isYearly, setIsYearly] = useState(false)
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleSubscribe = async (planId: keyof typeof SUBSCRIPTION_PLANS) => {
    if (!user) {
      router.push("/")
      return
    }

    if (planId === "free") {
      router.push("/dashboard")
      return
    }

    setIsLoading(planId)

    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          isYearly,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      })

      const { url, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      window.location.href = url
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start subscription",
        variant: "destructive",
      })
    } finally {
      setIsLoading(null)
    }
  }

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case "max_projects":
        return <Zap className="h-4 w-4" />
      case "max_team_members":
        return <Users className="h-4 w-4" />
      case "advanced_analytics":
        return <BarChart3 className="h-4 w-4" />
      case "priority_support":
        return <Shield className="h-4 w-4" />
      case "custom_branding":
        return <Palette className="h-4 w-4" />
      case "integrations":
        return <Plug className="h-4 w-4" />
      case "storage_gb":
        return <HardDrive className="h-4 w-4" />
      case "video_calls":
        return <Video className="h-4 w-4" />
      case "white_label":
        return <Crown className="h-4 w-4" />
      default:
        return <Check className="h-4 w-4" />
    }
  }

  const formatFeatureValue = (key: string, value: any) => {
    switch (key) {
      case "max_projects":
        return value === -1 ? "Unlimited projects" : `${value} project${value !== 1 ? "s" : ""}`
      case "max_team_members":
        return value === -1 ? "Unlimited team members" : `Up to ${value} team members`
      case "ai_calls_per_month":
        return value === -1 ? "Unlimited AI calls" : `${value} AI calls/month`
      case "storage_gb":
        return value === -1 ? "Unlimited storage" : `${value}GB storage`
      case "integrations":
        return Array.isArray(value) && value.length > 0
          ? `${value.length} integration${value.length !== 1 ? "s" : ""}`
          : "No integrations"
      case "advanced_analytics":
        return value ? "Advanced analytics" : null
      case "priority_support":
        return value ? "Priority support" : null
      case "custom_branding":
        return value ? "Custom branding" : null
      case "video_calls":
        return value ? "Video calls" : null
      case "white_label":
        return value ? "White-label solution" : null
      default:
        return null
    }
  }

  const getYearlyPrice = (monthlyPrice: number) => {
    return Math.floor(monthlyPrice * 12 * 0.8) // 20% discount for yearly
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">HackMate AI</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your <span className="text-primary">Hackathon</span> Plan
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            From solo hackers to enterprise teams, we have the perfect plan to supercharge your hackathon success.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <Label htmlFor="billing-toggle" className={!isYearly ? "font-semibold" : ""}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label htmlFor="billing-toggle" className={isYearly ? "font-semibold" : ""}>
              Yearly
            </Label>
            {isYearly && (
              <Badge variant="secondary" className="ml-2">
                Save 20%
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => {
              const price = isYearly && plan.price > 0 ? getYearlyPrice(plan.price) : plan.price
              const isPopular = planId === "pro"
              const isEnterprise = planId === "enterprise"

              return (
                <Card
                  key={planId}
                  className={`relative ${
                    isPopular ? "border-primary shadow-lg scale-105" : ""
                  } ${isEnterprise ? "border-2 border-gradient-to-r from-purple-500 to-pink-500" : ""}`}
                >
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  {isEnterprise && (
                    <Badge variant="secondary" className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      Enterprise
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">
                        ${price}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground">
                          /{isYearly ? "year" : "month"}
                        </span>
                      )}
                    </div>
                    {isYearly && plan.price > 0 && (
                      <p className="text-sm text-muted-foreground">
                        ${plan.price}/month billed annually
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Features List */}
                    <div className="space-y-3">
                      {Object.entries(plan.features).map(([key, value]) => {
                        const formattedValue = formatFeatureValue(key, value)
                        if (!formattedValue) return null

                        return (
                          <div key={key} className="flex items-center gap-3">
                            <div className="text-primary">
                              {getFeatureIcon(key)}
                            </div>
                            <span className="text-sm">{formattedValue}</span>
                          </div>
                        )
                      })}
                    </div>

                    {/* CTA Button */}
                    <Button
                      className="w-full mt-6"
                      variant={isPopular ? "default" : "outline"}
                      onClick={() => handleSubscribe(planId as keyof typeof SUBSCRIPTION_PLANS)}
                      disabled={isLoading === planId}
                    >
                      {isLoading === planId ? (
                        "Loading..."
                      ) : planId === "free" ? (
                        "Get Started Free"
                      ) : planId === "enterprise" ? (
                        "Contact Sales"
                      ) : (
                        `Start ${plan.name} Plan`
                      )}
                    </Button>

                    {planId === "pro" && (
                      <p className="text-xs text-center text-muted-foreground">
                        14-day free trial included
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
              <p className="text-muted-foreground text-sm">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What happens to my data if I cancel?</h3>
              <p className="text-muted-foreground text-sm">
                Your data is preserved for 30 days after cancellation. You can reactivate anytime during this period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do you offer student discounts?</h3>
              <p className="text-muted-foreground text-sm">
                Yes! Students get 50% off all paid plans. Contact support with your student email for verification.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground text-sm">
                The Pro plan includes a 14-day free trial. The Free plan is always available with no time limit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 HackMate AI. Built for hackathon enthusiasts everywhere.</p>
        </div>
      </footer>
    </div>
  )
}