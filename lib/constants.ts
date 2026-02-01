// Optimized constants extracted outside components to prevent re-creation
export const STATUS_MAP: Record<string, "ToDo" | "InProgress" | "Done"> = {
  "todo-column": "ToDo",
  "inprogress-column": "InProgress", 
  "done-column": "Done"
}

export const COLUMN_MAP: Record<"ToDo" | "InProgress" | "Done", string> = {
  "ToDo": "todo-column",
  "InProgress": "inprogress-column",
  "Done": "done-column"
}

export const TASK_PRIORITIES = ["Low", "Medium", "High", "Critical"] as const
export const TASK_EFFORTS = ["Low", "Medium", "High"] as const
export const USER_ROLES = ["lead", "developer", "designer", "researcher"] as const
export const AVAILABILITY_OPTIONS = ["available", "busy", "offline"] as const

export const DRAG_ACTIVATION_DISTANCE = 8 // Increased from 1px to prevent accidental drags

// Cache durations for different operations
export const CACHE_DURATIONS = {
  PROJECT_MEMBERS: 5 * 60 * 1000, // 5 minutes
  USER_PROFILE: 10 * 60 * 1000,   // 10 minutes
  RESOURCES: 2 * 60 * 1000,       // 2 minutes
} as const

// HackMate AI Constants
export const USER_TYPES = ['student', 'hackathon_team', 'organizer', 'corporate_manager'] as const;
export const SUBSCRIPTION_TIERS = ['free', 'student_pro', 'hackathon_free', 'hackathon_pro', 'organizer', 'corporate'] as const;
export const TEAM_ROLES = ['lead', 'member', 'viewer'] as const;
export const PROJECT_TYPES = ['private', 'hackathon', 'corporate'] as const;
export const PROJECT_STATUSES = ['planning', 'active', 'completed', 'archived'] as const;
export const TASK_STATUSES = ['todo', 'in_progress', 'done', 'blocked'] as const;

// Subscription Tier Display Names
export const TIER_DISPLAY_NAMES: Record<string, string> = {
  free: 'Free - Student Mode',
  student_pro: 'Student Pro',
  hackathon_free: 'Hackathon Team (Free)',
  hackathon_pro: 'Hackathon Team Pro',
  organizer: 'Organizer/Manager Mode',
  corporate: 'Corporate Enterprise'
};

// User Type Display Names
export const USER_TYPE_DISPLAY_NAMES: Record<string, string> = {
  student: 'Student',
  hackathon_team: 'Hackathon Team Member',
  organizer: 'Event Organizer',
  corporate_manager: 'Corporate Manager'
};

// Default permissions for team roles
export const DEFAULT_TEAM_PERMISSIONS = {
  lead: {
    canEditProject: true,
    canManageMembers: true,
    canAccessAI: true,
    canExport: true,
  },
  member: {
    canEditProject: true,
    canManageMembers: false,
    canAccessAI: true,
    canExport: false,
  },
  viewer: {
    canEditProject: false,
    canManageMembers: false,
    canAccessAI: false,
    canExport: false,
  },
};

// AI Credit costs for different operations
export const AI_CREDIT_COSTS = {
  idea_analysis: 10,
  task_breakdown: 5,
  mentor_message: 2,
  feature_suggestion: 8,
  task_regeneration: 3,
} as const;

// Invitation expiry duration (7 days)
export const INVITATION_EXPIRY_DURATION = 7 * 24 * 60 * 60 * 1000;

// Maximum team sizes by subscription tier
export const MAX_TEAM_SIZES = {
  free: 3,
  student_pro: 5,
  hackathon_free: 6,
  hackathon_pro: 8,
  organizer: 50,
  corporate: 100,
} as const;