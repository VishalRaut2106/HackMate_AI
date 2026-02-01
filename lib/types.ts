// User Types
export type UserType = 'student' | 'hackathon_team' | 'organizer' | 'corporate_manager';
export type SubscriptionTier = 'free' | 'student_pro' | 'hackathon_free' | 'hackathon_pro' | 'organizer' | 'corporate';

export interface User {
  id: string;
  uid: string; // Add uid for backward compatibility with old firestore functions
  email: string;
  displayName: string;
  photoURL?: string;
  userType: UserType;
  subscriptionTier: SubscriptionTier;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  bio?: string;
  skills: string[];
  // Student specific
  university?: string;
  graduationYear?: number;
  major?: string;
  // Organizer specific
  organization?: string;
  contactInfo?: string;
  // Corporate specific
  department?: string;
  role?: string;
}

// Team Types
export type TeamRole = 'lead' | 'member' | 'viewer';

export interface Team {
  id: string;
  name: string;
  description?: string;
  leadId: string;
  members: TeamMember[];
  projectId?: string;
  hackathonId?: string;
  maxSize: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  userId: string;
  role: TeamRole;
  joinedAt: Date;
  permissions: TeamPermissions;
}

export interface TeamPermissions {
  canEditProject: boolean;
  canManageMembers: boolean;
  canAccessAI: boolean;
  canExport: boolean;
}

// Project Types
export type ProjectType = 'private' | 'hackathon' | 'corporate';

export interface Project {
  id: string; // Changed from project_id for consistency
  name: string;
  description: string;
  type: ProjectType;
  status: 'planning' | 'active' | 'completed' | 'archived';
  teamId: string;
  hackathonId?: string;
  techStack: string[];
  category?: string;
  privacy: 'private' | 'team' | 'public';
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  // Legacy fields for backward compatibility
  duration?: "24h" | "48h";
  created_by?: string;
  members?: string[];
  join_code?: string;
  demo_mode?: boolean;
  idea?: IdeaAnalysis;
  hackathon_event?: string;
  submission_deadline?: Date;
  github_repo?: string;
  demo_url?: string;
  pitch_deck_url?: string;
  github_access_token?: string;
  github_connected?: boolean;
  github_last_sync?: Date;
}

// Updated Hackathon interface
export interface Hackathon {
  id: string; // Changed from event_id for consistency
  name: string;
  description: string;
  organizerId: string;
  joinCode: string;
  startDate: Date; // Changed from start_date
  endDate: Date; // Changed from end_date
  maxTeamSize: number; // Changed from max_team_size
  isActive: boolean;
  settings: HackathonSettings;
  createdAt: Date;
  // Legacy fields for backward compatibility
  event_id?: string;
  theme?: string;
  prizes?: string[];
  rules?: string[];
  organizer?: string;
  status?: "upcoming" | "active" | "judging" | "completed";
}

export interface HackathonSettings {
  allowPublicDemo: boolean;
  requireJudgeApproval: boolean;
  customBranding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

// Legacy HackathonEvent interface for backward compatibility
export interface HackathonEvent {
  event_id: string
  name: string
  description: string
  start_date: Date
  end_date: Date
  theme: string
  max_team_size: number
  prizes: string[]
  rules: string[]
  organizer: string
  status: "upcoming" | "active" | "judging" | "completed"
}

export interface TeamAnalytics {
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  overdue_tasks: number
  total_hours_worked: number
  average_task_completion_time: number
  velocity: number // tasks completed per day
  burnout_risk: "low" | "medium" | "high"
  completion_prediction: number // percentage chance of finishing on time
}

export interface SharedResource {
  resource_id: string
  project_id: string
  name: string
  type: "file" | "link" | "note" | "image" | "document"
  uploaded_by: string
  created_at: Date
  tags: string[]
  url?: string
  content?: string
  size?: number
  file_type?: string
  original_name?: string
}

export interface LiveActivity {
  activity_id: string
  project_id: string
  user_id: string
  type: "task_update" | "file_upload" | "message" | "code_commit" | "status_change" | "github_sync" | "conflict_resolved"
  description: string
  timestamp: Date
  metadata?: any
}

export interface TeamNotification {
  notification_id: string
  project_id: string
  user_id: string
  type: "task_assigned" | "deadline_reminder" | "blocker_alert" | "team_update"
  title: string
  message: string
  read: boolean
  created_at: Date
  action_url?: string
}

export interface Milestone {
  milestone_id: string
  project_id: string
  name: string
  description: string
  deadline: Date
  status: "upcoming" | "active" | "completed" | "overdue"
  type: "idea_submission" | "prototype" | "final_presentation" | "custom"
  created_at: Date
}

export interface Task {
  task_id: string
  project_id: string
  title: string
  description: string
  effort: "Low" | "Medium" | "High"
  status: "ToDo" | "InProgress" | "Done"
  assigned_to: string | null
  last_updated: Date
  created_at?: Date
  due_date?: Date
  priority: "Low" | "Medium" | "High" | "Critical"
  time_spent?: number // in minutes
  dependencies?: string[] // task_ids that must be completed first
  tags?: string[]
}

export interface ChatMessage {
  message_id: string
  project_id: string
  sender: string
  sender_type: "user" | "ai"
  content: string
  timestamp: Date
}

export interface IdeaAnalysis {
  problem_statement: string
  target_users: string[]
  features: string[]
  risks: string[]
  tech_stack_suggestions: string[]
}

export interface ProjectMember {
  user_id: string
  name: string
  email: string
  role: "lead" | "developer" | "designer" | "researcher" | "admin"
  skills: string[]
  online_status: boolean
  availability: "available" | "busy" | "offline"
  timezone?: string
  github_username?: string
  hours_worked?: number
  tasks_completed?: number
}
// AI Types
export interface AICredit {
  userId: string;
  totalCredits: number;
  usedCredits: number;
  resetDate: Date;
  tier: SubscriptionTier;
}

export interface AIAnalysis {
  id: string;
  projectId: string;
  type: 'idea' | 'task_breakdown' | 'feature_suggestion';
  input: string;
  output: string;
  creditsUsed: number;
  createdAt: Date;
}

// Invitation Types
export interface Invitation {
  id: string;
  teamId: string;
  invitedBy: string;
  invitedEmail: string;
  role: TeamRole;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Date;
  createdAt: Date;
}

// Authentication Types
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Subscription & Pricing Types
export interface SubscriptionLimits {
  maxProjects: number;
  maxTeamSize: number;
  aiCreditsPerMonth: number;
  canExport: boolean;
  canUseAdvancedAnalytics: boolean;
  canCreateHackathons: boolean;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    maxProjects: 1,
    maxTeamSize: 3,
    aiCreditsPerMonth: 0,
    canExport: false,
    canUseAdvancedAnalytics: false,
    canCreateHackathons: false,
  },
  student_pro: {
    maxProjects: -1, // unlimited
    maxTeamSize: 5,
    aiCreditsPerMonth: 200,
    canExport: true,
    canUseAdvancedAnalytics: true,
    canCreateHackathons: false,
  },
  hackathon_free: {
    maxProjects: 1,
    maxTeamSize: 6,
    aiCreditsPerMonth: 50,
    canExport: false,
    canUseAdvancedAnalytics: false,
    canCreateHackathons: false,
  },
  hackathon_pro: {
    maxProjects: 3,
    maxTeamSize: 8,
    aiCreditsPerMonth: 500,
    canExport: true,
    canUseAdvancedAnalytics: true,
    canCreateHackathons: false,
  },
  organizer: {
    maxProjects: -1,
    maxTeamSize: -1,
    aiCreditsPerMonth: 1000,
    canExport: true,
    canUseAdvancedAnalytics: true,
    canCreateHackathons: true,
  },
  corporate: {
    maxProjects: -1,
    maxTeamSize: -1,
    aiCreditsPerMonth: 2000,
    canExport: true,
    canUseAdvancedAnalytics: true,
    canCreateHackathons: true,
  },
};