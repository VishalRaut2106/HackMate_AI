import { SubscriptionTier, UserType } from './types';

export interface SubscriptionLimits {
  maxProjects: number;
  maxTeamSize: number;
  aiCreditsPerMonth: number;
  exportFormats: string[];
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  apiAccess: boolean;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    maxProjects: 1,
    maxTeamSize: 3,
    aiCreditsPerMonth: 0,
    exportFormats: [],
    advancedAnalytics: false,
    prioritySupport: false,
    customBranding: false,
    apiAccess: false,
  },
  student_pro: {
    maxProjects: -1, // unlimited
    maxTeamSize: 5,
    aiCreditsPerMonth: 500,
    exportFormats: ['pdf', 'json', 'csv'],
    advancedAnalytics: true,
    prioritySupport: false,
    customBranding: false,
    apiAccess: false,
  },
  hackathon_free: {
    maxProjects: 3,
    maxTeamSize: 6,
    aiCreditsPerMonth: 100,
    exportFormats: ['pdf'],
    advancedAnalytics: false,
    prioritySupport: false,
    customBranding: false,
    apiAccess: false,
  },
  hackathon_pro: {
    maxProjects: -1,
    maxTeamSize: 10,
    aiCreditsPerMonth: 1000,
    exportFormats: ['pdf', 'json', 'csv'],
    advancedAnalytics: true,
    prioritySupport: true,
    customBranding: false,
    apiAccess: false,
  },
  organizer: {
    maxProjects: -1,
    maxTeamSize: -1, // unlimited
    aiCreditsPerMonth: 2000,
    exportFormats: ['pdf', 'json', 'csv'],
    advancedAnalytics: true,
    prioritySupport: true,
    customBranding: true,
    apiAccess: true,
  },
  corporate: {
    maxProjects: -1,
    maxTeamSize: -1,
    aiCreditsPerMonth: 5000,
    exportFormats: ['pdf', 'json', 'csv'],
    advancedAnalytics: true,
    prioritySupport: true,
    customBranding: true,
    apiAccess: true,
  },
};

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  popular?: boolean;
  userTypes: UserType[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    tier: 'free',
    name: 'Free',
    description: 'Perfect for trying out HackMate AI',
    price: { monthly: 0, yearly: 0 },
    features: [
      '1 project',
      'Up to 3 team members',
      'Basic task management',
      'Community support'
    ],
    userTypes: ['student', 'hackathon_team']
  },
  {
    tier: 'student_pro',
    name: 'Student Pro',
    description: 'Ideal for students and academic projects',
    price: { monthly: 9, yearly: 90 },
    features: [
      'Unlimited projects',
      'Up to 5 team members',
      '500 AI credits/month',
      'Advanced analytics',
      'Export to PDF/JSON/CSV',
      'Email support'
    ],
    popular: true,
    userTypes: ['student']
  },
  {
    tier: 'hackathon_free',
    name: 'Hackathon Free',
    description: 'Free tier for hackathon participants',
    price: { monthly: 0, yearly: 0 },
    features: [
      '3 projects',
      'Up to 6 team members',
      '100 AI credits/month',
      'PDF export',
      'Community support'
    ],
    userTypes: ['hackathon_team']
  },
  {
    tier: 'hackathon_pro',
    name: 'Hackathon Pro',
    description: 'Enhanced features for serious hackathon teams',
    price: { monthly: 19, yearly: 190 },
    features: [
      'Unlimited projects',
      'Up to 10 team members',
      '1000 AI credits/month',
      'Advanced analytics',
      'All export formats',
      'Priority support',
      'Demo mode for judges'
    ],
    popular: true,
    userTypes: ['hackathon_team']
  },
  {
    tier: 'organizer',
    name: 'Event Organizer',
    description: 'Comprehensive tools for event management',
    price: { monthly: 49, yearly: 490 },
    features: [
      'Unlimited projects & teams',
      '2000 AI credits/month',
      'Multi-event management',
      'Judge dashboard',
      'Custom branding',
      'API access',
      'Priority support'
    ],
    userTypes: ['organizer']
  },
  {
    tier: 'corporate',
    name: 'Corporate',
    description: 'Enterprise-grade features for organizations',
    price: { monthly: 99, yearly: 990 },
    features: [
      'Everything in Organizer',
      '5000 AI credits/month',
      'Advanced security',
      'SSO integration',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee'
    ],
    userTypes: ['corporate_manager']
  }
];

export class SubscriptionService {
  static getLimits(tier: SubscriptionTier): SubscriptionLimits {
    return SUBSCRIPTION_LIMITS[tier];
  }

  static getAvailablePlans(userType: UserType): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS.filter(plan => 
      plan.userTypes.includes(userType)
    );
  }

  static canCreateProject(currentProjectCount: number, tier: SubscriptionTier): boolean {
    const limits = this.getLimits(tier);
    return limits.maxProjects === -1 || currentProjectCount < limits.maxProjects;
  }

  static canAddTeamMember(currentTeamSize: number, tier: SubscriptionTier): boolean {
    const limits = this.getLimits(tier);
    return limits.maxTeamSize === -1 || currentTeamSize < limits.maxTeamSize;
  }

  static canUseAI(creditsUsed: number, tier: SubscriptionTier): boolean {
    const limits = this.getLimits(tier);
    return limits.aiCreditsPerMonth === -1 || creditsUsed < limits.aiCreditsPerMonth;
  }

  static canExport(format: string, tier: SubscriptionTier): boolean {
    const limits = this.getLimits(tier);
    return limits.exportFormats.includes(format);
  }

  static hasAdvancedAnalytics(tier: SubscriptionTier): boolean {
    return this.getLimits(tier).advancedAnalytics;
  }

  static getUpgradeRecommendation(userType: UserType, currentTier: SubscriptionTier): SubscriptionPlan | null {
    const availablePlans = this.getAvailablePlans(userType);
    const currentPlanIndex = availablePlans.findIndex(plan => plan.tier === currentTier);
    
    if (currentPlanIndex === -1 || currentPlanIndex === availablePlans.length - 1) {
      return null; // Already on highest tier or tier not found
    }

    return availablePlans[currentPlanIndex + 1];
  }

  static formatPrice(price: number, period: 'monthly' | 'yearly'): string {
    if (price === 0) return 'Free';
    
    const monthlyPrice = period === 'yearly' ? price / 12 : price;
    const formatted = `$${monthlyPrice.toFixed(monthlyPrice % 1 === 0 ? 0 : 2)}`;
    
    return period === 'yearly' ? `${formatted}/mo (billed yearly)` : `${formatted}/mo`;
  }
}

// Usage tracking interface
export interface UsageStats {
  projectsCreated: number;
  aiCreditsUsed: number;
  teamMembersAdded: number;
  exportsGenerated: number;
  lastResetDate: Date;
}

export class UsageTracker {
  private static STORAGE_KEY = 'hackmate_usage_stats';

  static getUsage(userId: string): UsageStats {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          lastResetDate: new Date(parsed.lastResetDate)
        };
      }
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }

    // Return default stats
    return {
      projectsCreated: 0,
      aiCreditsUsed: 0,
      teamMembersAdded: 0,
      exportsGenerated: 0,
      lastResetDate: new Date()
    };
  }

  static updateUsage(userId: string, updates: Partial<UsageStats>): void {
    try {
      const current = this.getUsage(userId);
      const updated = { ...current, ...updates };
      
      localStorage.setItem(
        `${this.STORAGE_KEY}_${userId}`,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error('Failed to update usage stats:', error);
    }
  }

  static incrementProjectCount(userId: string): void {
    const current = this.getUsage(userId);
    this.updateUsage(userId, {
      projectsCreated: current.projectsCreated + 1
    });
  }

  static incrementAICredits(userId: string, credits: number = 1): void {
    const current = this.getUsage(userId);
    this.updateUsage(userId, {
      aiCreditsUsed: current.aiCreditsUsed + credits
    });
  }

  static incrementTeamMembers(userId: string): void {
    const current = this.getUsage(userId);
    this.updateUsage(userId, {
      teamMembersAdded: current.teamMembersAdded + 1
    });
  }

  static incrementExports(userId: string): void {
    const current = this.getUsage(userId);
    this.updateUsage(userId, {
      exportsGenerated: current.exportsGenerated + 1
    });
  }

  static resetMonthlyUsage(userId: string): void {
    const current = this.getUsage(userId);
    this.updateUsage(userId, {
      aiCreditsUsed: 0,
      exportsGenerated: 0,
      lastResetDate: new Date()
    });
  }

  static shouldResetUsage(userId: string): boolean {
    const usage = this.getUsage(userId);
    const now = new Date();
    const lastReset = usage.lastResetDate;
    
    // Reset if it's been more than 30 days
    const daysSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceReset >= 30;
  }
}