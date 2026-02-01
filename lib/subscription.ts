import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"
import { getFirebaseDb } from "./firebase"

export interface SubscriptionPlan {
  id: "free" | "pro" | "team" | "enterprise"
  name: string
  price: number
  interval: "month" | "year"
  features: SubscriptionFeatures
  stripe_price_id?: string
}

export interface SubscriptionFeatures {
  max_projects: number
  max_team_members: number
  ai_calls_per_month: number
  advanced_analytics: boolean
  priority_support: boolean
  custom_branding: boolean
  integrations: string[]
  storage_gb: number
  video_calls: boolean
  white_label: boolean
}

export interface UserSubscription {
  subscription_id: string
  user_id: string
  plan: SubscriptionPlan["id"]
  status: "active" | "canceled" | "past_due" | "trialing" | "incomplete"
  current_period_start: Date
  current_period_end: Date
  stripe_subscription_id?: string
  stripe_customer_id?: string
  trial_end?: Date
  created_at: Date
  updated_at: Date
}

export interface UsageMetrics {
  user_id: string
  month: string // YYYY-MM format
  ai_calls_used: number
  projects_created: number
  team_members_added: number
  storage_used_mb: number
  last_updated: Date
}

// Subscription plans configuration
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan["id"], SubscriptionPlan> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    interval: "month",
    features: {
      max_projects: 1,
      max_team_members: 5,
      ai_calls_per_month: 50,
      advanced_analytics: false,
      priority_support: false,
      custom_branding: false,
      integrations: [],
      storage_gb: 1,
      video_calls: false,
      white_label: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 9,
    interval: "month",
    stripe_price_id: process.env.STRIPE_PRO_PRICE_ID,
    features: {
      max_projects: 10,
      max_team_members: 15,
      ai_calls_per_month: 500,
      advanced_analytics: true,
      priority_support: true,
      custom_branding: false,
      integrations: ["github", "slack"],
      storage_gb: 10,
      video_calls: true,
      white_label: false,
    },
  },
  team: {
    id: "team",
    name: "Team",
    price: 19,
    interval: "month",
    stripe_price_id: process.env.STRIPE_TEAM_PRICE_ID,
    features: {
      max_projects: -1, // unlimited
      max_team_members: -1, // unlimited
      ai_calls_per_month: 2000,
      advanced_analytics: true,
      priority_support: true,
      custom_branding: true,
      integrations: ["github", "slack", "figma", "discord"],
      storage_gb: 50,
      video_calls: true,
      white_label: false,
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    interval: "month",
    stripe_price_id: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    features: {
      max_projects: -1,
      max_team_members: -1,
      ai_calls_per_month: -1, // unlimited
      advanced_analytics: true,
      priority_support: true,
      custom_branding: true,
      integrations: ["github", "slack", "figma", "discord", "jira", "notion"],
      storage_gb: -1, // unlimited
      video_calls: true,
      white_label: true,
    },
  },
}

function getDb() {
  const db = getFirebaseDb()
  if (!db) throw new Error("Database not available")
  return db
}

// Get user's current subscription
export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  try {
    const db = getDb()
    const subscriptionDoc = await getDoc(doc(db, "subscriptions", userId))
    
    if (subscriptionDoc.exists()) {
      const data = subscriptionDoc.data()
      return {
        ...data,
        current_period_start: data.current_period_start?.toDate() || new Date(),
        current_period_end: data.current_period_end?.toDate() || new Date(),
        trial_end: data.trial_end?.toDate(),
        created_at: data.created_at?.toDate() || new Date(),
        updated_at: data.updated_at?.toDate() || new Date(),
      } as UserSubscription
    }
    
    // Return default free subscription
    const freeSubscription: UserSubscription = {
      subscription_id: userId,
      user_id: userId,
      plan: "free",
      status: "active",
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      created_at: new Date(),
      updated_at: new Date(),
    }
    
    // Save the default subscription
    await setDoc(doc(db, "subscriptions", userId), {
      ...freeSubscription,
      current_period_start: freeSubscription.current_period_start,
      current_period_end: freeSubscription.current_period_end,
    })
    
    return freeSubscription
  } catch (error) {
    console.error("Error getting user subscription:", error)
    // Return free plan as fallback
    return {
      subscription_id: userId,
      user_id: userId,
      plan: "free",
      status: "active",
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      created_at: new Date(),
      updated_at: new Date(),
    }
  }
}

// Update user subscription
export async function updateUserSubscription(
  userId: string,
  updates: Partial<UserSubscription>
): Promise<void> {
  const db = getDb()
  await updateDoc(doc(db, "subscriptions", userId), {
    ...updates,
    updated_at: new Date(),
  })
}

// Get current month's usage
export async function getCurrentUsage(userId: string): Promise<UsageMetrics> {
  try {
    const db = getDb()
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const usageDoc = await getDoc(doc(db, "usage_metrics", `${userId}_${currentMonth}`))
    
    if (usageDoc.exists()) {
      const data = usageDoc.data()
      return {
        ...data,
        last_updated: data.last_updated?.toDate() || new Date(),
      } as UsageMetrics
    }
    
    // Return default usage
    return {
      user_id: userId,
      month: currentMonth,
      ai_calls_used: 0,
      projects_created: 0,
      team_members_added: 0,
      storage_used_mb: 0,
      last_updated: new Date(),
    }
  } catch (error) {
    console.error("Error getting usage metrics:", error)
    return {
      user_id: userId,
      month: new Date().toISOString().slice(0, 7),
      ai_calls_used: 0,
      projects_created: 0,
      team_members_added: 0,
      storage_used_mb: 0,
      last_updated: new Date(),
    }
  }
}

// Increment usage counter
export async function incrementUsage(
  userId: string,
  metric: keyof Omit<UsageMetrics, "user_id" | "month" | "last_updated">,
  amount: number = 1
): Promise<void> {
  try {
    const db = getDb()
    const currentMonth = new Date().toISOString().slice(0, 7)
    const usageId = `${userId}_${currentMonth}`
    
    const currentUsage = await getCurrentUsage(userId)
    const updatedUsage = {
      ...currentUsage,
      [metric]: currentUsage[metric] + amount,
      last_updated: new Date(),
    }
    
    await setDoc(doc(db, "usage_metrics", usageId), updatedUsage)
  } catch (error) {
    console.error("Error incrementing usage:", error)
  }
}

// Check if user can perform action based on subscription limits
export async function canPerformAction(
  userId: string,
  action: "create_project" | "add_team_member" | "ai_call" | "upload_file"
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const subscription = await getUserSubscription(userId)
    const usage = await getCurrentUsage(userId)
    const plan = SUBSCRIPTION_PLANS[subscription.plan]
    
    switch (action) {
      case "create_project":
        if (plan.features.max_projects === -1) return { allowed: true }
        if (usage.projects_created >= plan.features.max_projects) {
          return {
            allowed: false,
            reason: `You've reached your project limit (${plan.features.max_projects}). Upgrade to create more projects.`,
          }
        }
        return { allowed: true }
        
      case "ai_call":
        if (plan.features.ai_calls_per_month === -1) return { allowed: true }
        if (usage.ai_calls_used >= plan.features.ai_calls_per_month) {
          return {
            allowed: false,
            reason: `You've reached your AI usage limit (${plan.features.ai_calls_per_month} calls/month). Upgrade for more AI assistance.`,
          }
        }
        return { allowed: true }
        
      case "add_team_member":
        if (plan.features.max_team_members === -1) return { allowed: true }
        if (usage.team_members_added >= plan.features.max_team_members) {
          return {
            allowed: false,
            reason: `You've reached your team member limit (${plan.features.max_team_members}). Upgrade to add more members.`,
          }
        }
        return { allowed: true }
        
      case "upload_file":
        const storageLimit = plan.features.storage_gb === -1 ? Infinity : plan.features.storage_gb * 1024 // Convert to MB
        if (usage.storage_used_mb >= storageLimit) {
          return {
            allowed: false,
            reason: `You've reached your storage limit (${plan.features.storage_gb}GB). Upgrade for more storage.`,
          }
        }
        return { allowed: true }
        
      default:
        return { allowed: true }
    }
  } catch (error) {
    console.error("Error checking action permission:", error)
    return { allowed: true } // Allow by default on error
  }
}

// Get subscription features for a user
export async function getUserFeatures(userId: string): Promise<SubscriptionFeatures> {
  const subscription = await getUserSubscription(userId)
  return SUBSCRIPTION_PLANS[subscription.plan].features
}

// Check if user has specific feature
export async function hasFeature(
  userId: string,
  feature: keyof SubscriptionFeatures
): Promise<boolean> {
  const features = await getUserFeatures(userId)
  return Boolean(features[feature])
}