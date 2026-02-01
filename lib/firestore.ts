import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  writeBatch,
  orderBy,
  limit as limitTo,
} from "firebase/firestore"
import { getFirebaseDb } from "./firebase"
import type { Project, Task, ChatMessage, ProjectMember, SharedResource, LiveActivity, TeamNotification, Milestone, HackathonEvent } from "./types"

function getDb() {
  const db = getFirebaseDb()
  if (!db) throw new Error("Database not available")
  return db
}

// Generate random join code
function generateJoinCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]).catch(
    () => fallback,
  )
}

// Projects
export interface CreateProjectParams {
  name: string;
  duration: "24h" | "48h";
  userId: string;
  techStack?: string[];
  category?: string;
  privacy?: "private" | "team" | "public";
}

export async function createProject(
  nameOrParams: string | CreateProjectParams, 
  duration?: "24h" | "48h", 
  userId?: string
): Promise<string> {
  const db = getDb()
  const projectRef = doc(collection(db, "projects"))

  let projectData: any;

  if (typeof nameOrParams === 'string') {
    // Legacy support
    projectData = {
      project_id: projectRef.id,
      name: nameOrParams,
      duration,
      created_by: userId,
      members: [userId],
      join_code: generateJoinCode(),
      demo_mode: false,
      created_at: serverTimestamp(),
      status: "planning",
      github_repo: null,
      demo_url: null,
      pitch_deck_url: null,
      submission_deadline: null,
      hackathon_event: null,
    };
  } else {
    // New object-based params
    const { name, duration, userId, techStack, category, privacy } = nameOrParams;
    projectData = {
      project_id: projectRef.id,
      name,
      duration,
      created_by: userId,
      members: [userId!],
      join_code: generateJoinCode(),
      demo_mode: false,
      created_at: serverTimestamp(),
      status: "planning",
      techStack: techStack || [],
      category: category || "General",
      privacy: privacy || "private",
      github_repo: null,
      demo_url: null,
      pitch_deck_url: null,
      submission_deadline: null,
      hackathon_event: null,
    };
  }

  await setDoc(projectRef, projectData)

  const uid = typeof nameOrParams === 'string' ? userId! : nameOrParams.userId;

  // Set role in background - don't wait
  setDoc(doc(db, "project_roles", `${projectRef.id}_${uid}`), {
    project_id: projectRef.id,
    user_id: uid,
    role: "admin",
  }).catch(() => {})

  // Create default milestones in background
  createDefaultMilestones(projectRef.id, projectData.duration).catch(() => {})

  return projectRef.id
}

export async function getProject(projectId: string): Promise<Project | null> {
  try {
    const db = getDb()
    const projectDoc = await withTimeout(getDoc(doc(db, "projects", projectId)), 3000, null as any)
    if (!projectDoc || !projectDoc.exists?.()) return null
    const data = projectDoc.data()
    return {
      ...data,
      id: projectDoc.id, // Ensure the document ID is included
      createdAt: data.created_at?.toDate?.() || new Date(),
    } as Project
  } catch (error) {
    console.error("Error getting project:", error)
    return null
  }
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  try {
    const db = getDb()
    const q = query(collection(db, "projects"), where("members", "array-contains", userId))
    const snapshot = await withTimeout(getDocs(q), 3000, { docs: [] } as any)

    if (!snapshot.docs) return []

    const projects = snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id, // Add the document ID as the project ID
        createdAt: data.created_at?.toDate?.() || new Date(),
      } as Project
    })

    return projects.sort((a: Project, b: Project) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (error) {
    console.error("Error getting user projects:", error)
    return []
  }
}

export async function joinProjectByCode(joinCode: string, userId: string): Promise<string | null> {
  try {
    const db = getDb()
    const q = query(collection(db, "projects"), where("join_code", "==", joinCode))
    const snapshot = await withTimeout(getDocs(q), 5000, { empty: true, docs: [] } as any)
    if (snapshot.empty || !snapshot.docs?.length) return null

    const projectDoc = snapshot.docs[0]
    const batch = writeBatch(db)

    batch.update(doc(db, "projects", projectDoc.id), {
      members: arrayUnion(userId),
    })

    batch.set(doc(db, "project_roles", `${projectDoc.id}_${userId}`), {
      project_id: projectDoc.id,
      user_id: userId,
      role: "member",
    })

    await batch.commit()

    return projectDoc.id
  } catch (error) {
    console.error("Error joining project:", error)
    throw error
  }
}

export async function updateProjectIdea(projectId: string, idea: Project["idea"]): Promise<void> {
  const db = getDb()
  await updateDoc(doc(db, "projects", projectId), { idea })
}

export async function toggleDemoMode(projectId: string, enabled: boolean): Promise<void> {
  const db = getDb()
  await updateDoc(doc(db, "projects", projectId), { demo_mode: enabled })
}

export async function updateDemoMode(projectId: string, enabled: boolean): Promise<void> {
  const db = getDb()
  await updateDoc(doc(db, "projects", projectId), { demo_mode: enabled })
}

export async function updateProjectUrls(projectId: string, urls: { github_repo?: string; demo_url?: string; pitch_deck_url?: string }): Promise<void> {
  const db = getDb()
  await updateDoc(doc(db, "projects", projectId), urls)
}

export async function updateProjectStatus(projectId: string, status: Project["status"]): Promise<void> {
  const db = getDb()
  await updateDoc(doc(db, "projects", projectId), { status })
}

export async function deleteProject(projectId: string): Promise<void> {
  const db = getDb()
  const batch = writeBatch(db)

  // Delete all tasks
  try {
    const tasksQuery = query(collection(db, "tasks"), where("project_id", "==", projectId))
    const tasksSnapshot = await getDocs(tasksQuery)
    tasksSnapshot.docs.forEach((taskDoc) => {
      batch.delete(taskDoc.ref)
    })
  } catch (e) {
    console.error("Error deleting tasks:", e)
  }

  // Delete all chat messages
  try {
    const messagesQuery = query(collection(db, "messages"), where("project_id", "==", projectId))
    const messagesSnapshot = await getDocs(messagesQuery)
    messagesSnapshot.docs.forEach((msgDoc) => {
      batch.delete(msgDoc.ref)
    })
  } catch (e) {
    console.error("Error deleting messages:", e)
  }

  // Delete project
  batch.delete(doc(db, "projects", projectId))

  await batch.commit()
}

export async function archiveProject(projectId: string): Promise<void> {
  const db = getDb()
  await updateDoc(doc(db, "projects", projectId), { status: "archived" })
}

export async function restoreProject(projectId: string): Promise<void> {
  const db = getDb()
  await updateDoc(doc(db, "projects", projectId), { status: "active" })
}

// Subscribe to project updates with error handling
export function subscribeToProject(projectId: string, callback: (project: Project | null) => void) {
  try {
    const db = getDb()
    return onSnapshot(
      doc(db, "projects", projectId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data()
          callback({
            ...data,
            createdAt: data.created_at?.toDate?.() || new Date(),
          } as Project)
        } else {
          callback(null)
        }
      },
      (error) => {
        console.error("Error subscribing to project:", error)
        callback(null)
      },
    )
  } catch {
    callback(null)
    return () => {}
  }
}

// Tasks
export async function createTask(task: Omit<Task, "task_id" | "last_updated">): Promise<string> {
  const db = getDb()
  const taskRef = doc(collection(db, "tasks"))
  
  // Filter out undefined values to avoid Firestore errors
  const cleanTask = Object.fromEntries(
    Object.entries({
      ...task,
      task_id: taskRef.id,
      last_updated: serverTimestamp(),
    }).filter(([_, value]) => value !== undefined)
  )
  
  await setDoc(taskRef, cleanTask)
  return taskRef.id
}

export async function addTask(task: Omit<Task, "task_id" | "last_updated">): Promise<Task | null> {
  try {
    const db = getDb()
    const taskRef = doc(collection(db, "tasks"))
    
    // Create the task data without undefined fields
    const taskData = {
      ...task,
      task_id: taskRef.id,
      last_updated: serverTimestamp(),
      created_at: serverTimestamp(),
      priority: task.priority || "Medium",
      time_spent: 0,
      dependencies: [],
      tags: [],
    }
    
    // Only add due_date if it's defined
    if (task.due_date !== undefined) {
      taskData.due_date = task.due_date
    }
    
    await setDoc(taskRef, taskData)
    
    // Return the task with client-side dates for immediate UI update
    const newTask = {
      ...task,
      task_id: taskRef.id,
      last_updated: new Date(),
      created_at: new Date(),
      priority: task.priority || "Medium",
      time_spent: 0,
      dependencies: [],
      tags: [],
    }
    
    return newTask as Task
  } catch (error) {
    console.error("Error adding task:", error)
    return null
  }
}

export async function createTasks(tasks: Omit<Task, "task_id" | "last_updated">[]): Promise<void> {
  const db = getDb()
  const batch = writeBatch(db)

  for (const task of tasks) {
    const taskRef = doc(collection(db, "tasks"))
    
    // Filter out undefined values to avoid Firestore errors
    const cleanTask = Object.fromEntries(
      Object.entries({
        ...task,
        task_id: taskRef.id,
        last_updated: serverTimestamp(),
      }).filter(([_, value]) => value !== undefined)
    )
    
    batch.set(taskRef, cleanTask)
  }

  await batch.commit()
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
  const db = getDb()
  
  // Filter out undefined values to avoid Firestore errors
  const cleanUpdates = Object.fromEntries(
    Object.entries({
      ...updates,
      last_updated: serverTimestamp(),
    }).filter(([_, value]) => value !== undefined)
  )
  
  await updateDoc(doc(db, "tasks", taskId), cleanUpdates)
}

export async function deleteTask(taskId: string): Promise<void> {
  const db = getDb()
  await deleteDoc(doc(db, "tasks", taskId))
}

// Optimized: Add pagination and debouncing for tasks
export function subscribeToTasks(projectId: string, callback: (tasks: Task[]) => void, maxResults = 50) {
  try {
    const db = getDb()
    const q = query(
      collection(db, "tasks"), 
      where("project_id", "==", projectId),
      orderBy("last_updated", "desc"),
      limitTo(maxResults)
    )
    
    let debounceTimer: NodeJS.Timeout | null = null
    
    return onSnapshot(
      q,
      (snapshot) => {
        // Debounce rapid updates
        if (debounceTimer) clearTimeout(debounceTimer)
        
        debounceTimer = setTimeout(() => {
          const tasks = snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
              ...data,
              last_updated: data.last_updated?.toDate?.() || new Date(),
            } as Task
          })
          callback(tasks)
        }, 100) // 100ms debounce
      },
      (error) => {
        console.error("Error subscribing to tasks:", error)
        callback([])
      },
    )
  } catch {
    callback([])
    return () => {}
  }
}

// Chat Messages
export async function sendMessage(message: Omit<ChatMessage, "message_id" | "timestamp">): Promise<string> {
  const db = getDb()
  const msgRef = doc(collection(db, "messages"))
  await setDoc(msgRef, {
    ...message,
    message_id: msgRef.id,
    timestamp: serverTimestamp(),
  })
  return msgRef.id
}

// Optimized: Add pagination for messages
export function subscribeToMessages(projectId: string, callback: (messages: ChatMessage[]) => void, maxResults = 100) {
  try {
    const db = getDb()
    const q = query(
      collection(db, "messages"), 
      where("project_id", "==", projectId),
      orderBy("timestamp", "desc"),
      limitTo(maxResults)
    )
    
    return onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            ...data,
            timestamp: data.timestamp?.toDate?.() || new Date(),
          } as ChatMessage
        })
        // Reverse to show oldest first
        messages.reverse()
        callback(messages)
      },
      (error) => {
        console.error("Error subscribing to messages:", error)
        callback([])
      },
    )
  } catch {
    callback([])
    return () => {}
  }
}

// Project Members
export async function getProjectMembers(memberIds: string[]): Promise<ProjectMember[]> {
  try {
    const db = getDb()
    const members: ProjectMember[] = []
    for (const id of memberIds) {
      try {
        const userDoc = await getDoc(doc(db, "users", id))
        if (userDoc.exists()) {
          members.push(userDoc.data() as ProjectMember)
        }
      } catch (e) {
        console.error("Error getting member:", e)
      }
    }
    return members
  } catch {
    return []
  }
}

export async function getUserRole(projectId: string, userId: string): Promise<"admin" | "member" | "viewer"> {
  try {
    const db = getDb()
    const roleDoc = await getDoc(doc(db, "project_roles", `${projectId}_${userId}`))
    if (roleDoc.exists()) {
      return roleDoc.data().role
    }
  } catch (e) {
    console.error("Error getting user role:", e)
  }
  return "viewer"
}

// Optimized: Batch member queries instead of N individual listeners
export function subscribeToProjectMembers(memberIds: string[], callback: (members: ProjectMember[]) => void) {
  if (memberIds.length === 0) {
    callback([])
    return () => {}
  }

  try {
    const db = getDb()
    
    // Batch query up to 10 members at once (Firestore 'in' limit)
    const batches = []
    for (let i = 0; i < memberIds.length; i += 10) {
      batches.push(memberIds.slice(i, i + 10))
    }

    const unsubscribes: (() => void)[] = []
    const membersMap = new Map<string, ProjectMember>()

    batches.forEach((batch) => {
      const q = query(collection(db, "users"), where("user_id", "in", batch))
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          snapshot.docs.forEach((doc) => {
            membersMap.set(doc.id, doc.data() as ProjectMember)
          })
          callback(Array.from(membersMap.values()))
        },
        (error) => {
          console.error("Error subscribing to members batch:", error)
        }
      )
      unsubscribes.push(unsub)
    })

    return () => unsubscribes.forEach((unsub) => unsub())
  } catch {
    callback([])
    return () => {}
  }
}

// Milestones
export async function createMilestone(milestone: Omit<Milestone, "milestone_id" | "created_at">): Promise<string> {
  const db = getDb()
  const milestoneRef = doc(collection(db, "milestones"))
  await setDoc(milestoneRef, {
    ...milestone,
    milestone_id: milestoneRef.id,
    created_at: serverTimestamp(),
  })
  return milestoneRef.id
}

export async function updateMilestone(milestoneId: string, updates: Partial<Milestone>): Promise<void> {
  const db = getDb()
  await updateDoc(doc(db, "milestones", milestoneId), updates)
}

export async function deleteMilestone(milestoneId: string): Promise<void> {
  const db = getDb()
  await deleteDoc(doc(db, "milestones", milestoneId))
}

export function subscribeToMilestones(projectId: string, callback: (milestones: Milestone[]) => void) {
  try {
    const db = getDb()
    const q = query(collection(db, "milestones"), where("project_id", "==", projectId))
    return onSnapshot(
      q,
      (snapshot) => {
        const milestones = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            ...data,
            deadline: data.deadline?.toDate?.() || new Date(),
            created_at: data.created_at?.toDate?.() || new Date(),
          } as Milestone
        })
        milestones.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
        callback(milestones)
      },
      (error) => {
        console.error("Error subscribing to milestones:", error)
        callback([])
      },
    )
  } catch {
    callback([])
    return () => {}
  }
}

// Helper function to create default milestones for a project
export async function createDefaultMilestones(projectId: string, duration: "24h" | "48h"): Promise<void> {
  const db = getDb()
  const batch = writeBatch(db)
  const now = new Date()
  const durationHours = duration === "24h" ? 24 : 48

  const milestones = [
    {
      name: "Idea Finalization",
      description: "Complete idea analysis and feature planning",
      type: "idea_submission" as const,
      deadline: new Date(now.getTime() + (durationHours * 0.2) * 60 * 60 * 1000), // 20% through
    },
    {
      name: "Prototype Development",
      description: "Build working prototype with core features",
      type: "prototype" as const,
      deadline: new Date(now.getTime() + (durationHours * 0.7) * 60 * 60 * 1000), // 70% through
    },
    {
      name: "Final Presentation",
      description: "Complete project and prepare final presentation",
      type: "final_presentation" as const,
      deadline: new Date(now.getTime() + durationHours * 60 * 60 * 1000), // End of hackathon
    },
  ]

  for (const milestone of milestones) {
    const milestoneRef = doc(collection(db, "milestones"))
    batch.set(milestoneRef, {
      ...milestone,
      milestone_id: milestoneRef.id,
      project_id: projectId,
      status: "upcoming",
      created_at: serverTimestamp(),
    })
  }

  await batch.commit()
}

// Shared Resources
export async function uploadResource(resource: Omit<SharedResource, "resource_id" | "created_at">): Promise<string> {
  const db = getDb()
  const resourceRef = doc(collection(db, "shared_resources"))
  
  // Filter out undefined values to avoid Firestore errors
  const cleanResource = Object.fromEntries(
    Object.entries({
      ...resource,
      resource_id: resourceRef.id,
      created_at: serverTimestamp(),
    }).filter(([_, value]) => value !== undefined)
  )
  
  await setDoc(resourceRef, cleanResource)
  return resourceRef.id
}

export async function getProjectResources(projectId: string): Promise<SharedResource[]> {
  try {
    const db = getDb()
    const q = query(collection(db, "shared_resources"), where("project_id", "==", projectId))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.() || new Date(),
    } as SharedResource))
  } catch (error) {
    console.error("Error getting resources:", error)
    return []
  }
}

export function subscribeToResources(projectId: string, callback: (resources: SharedResource[]) => void) {
  try {
    const db = getDb()
    const q = query(collection(db, "shared_resources"), where("project_id", "==", projectId))
    return onSnapshot(q, (snapshot) => {
      const resources = snapshot.docs.map(doc => ({
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.() || new Date(),
      } as SharedResource))
      callback(resources)
    })
  } catch {
    callback([])
    return () => {}
  }
}

// Live Activity Feed
export async function addActivity(activity: Omit<LiveActivity, "activity_id" | "timestamp">): Promise<void> {
  const db = getDb()
  const activityRef = doc(collection(db, "live_activities"))
  
  // Filter out undefined values
  const cleanActivity = Object.fromEntries(
    Object.entries({
      ...activity,
      activity_id: activityRef.id,
      timestamp: serverTimestamp(),
    }).filter(([_, value]) => value !== undefined)
  )
  
  await setDoc(activityRef, cleanActivity)
}

export function subscribeToActivities(projectId: string, callback: (activities: LiveActivity[]) => void) {
  try {
    const db = getDb()
    const q = query(
      collection(db, "live_activities"), 
      where("project_id", "==", projectId)
    )
    return onSnapshot(q, (snapshot) => {
      const activities = snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
      } as LiveActivity))
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      callback(activities.slice(0, 50)) // Limit to 50 recent activities
    })
  } catch {
    callback([])
    return () => {}
  }
}

// Team Notifications
export async function createNotification(notification: Omit<TeamNotification, "notification_id" | "created_at">): Promise<void> {
  const db = getDb()
  const notificationRef = doc(collection(db, "team_notifications"))
  
  // Filter out undefined values
  const cleanNotification = Object.fromEntries(
    Object.entries({
      ...notification,
      notification_id: notificationRef.id,
      created_at: serverTimestamp(),
    }).filter(([_, value]) => value !== undefined)
  )
  
  await setDoc(notificationRef, cleanNotification)
}

export function subscribeToNotifications(projectId: string, userId: string, callback: (notifications: TeamNotification[]) => void) {
  try {
    const db = getDb()
    const q = query(
      collection(db, "team_notifications"), 
      where("project_id", "==", projectId),
      where("user_id", "==", userId)
    )
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.() || new Date(),
      } as TeamNotification))
      notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      callback(notifications)
    })
  } catch {
    callback([])
    return () => {}
  }
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const db = getDb()
  await updateDoc(doc(db, "team_notifications", notificationId), { read: true })
}

export async function deleteResource(resourceId: string): Promise<void> {
  const db = getDb()
  await deleteDoc(doc(db, "shared_resources", resourceId))
}

export async function removeMemberFromProject(projectId: string, userId: string): Promise<void> {
  const db = getDb()
  const batch = writeBatch(db)

  // Remove user from project members array
  const projectRef = doc(db, "projects", projectId)
  const projectDoc = await getDoc(projectRef)
  
  if (projectDoc.exists()) {
    const currentMembers = projectDoc.data().members || []
    const updatedMembers = currentMembers.filter((memberId: string) => memberId !== userId)
    
    batch.update(projectRef, { members: updatedMembers })
  }

  // Remove user's project role
  const roleRef = doc(db, "project_roles", `${projectId}_${userId}`)
  batch.delete(roleRef)

  await batch.commit()
}

// Hackathon Management Functions
export async function createHackathon(hackathon: Omit<HackathonEvent, "event_id">): Promise<HackathonEvent> {
  const db = getDb()
  const hackathonRef = doc(collection(db, "hackathons"))
  
  const hackathonData = {
    ...hackathon,
    event_id: hackathonRef.id,
  }

  await setDoc(hackathonRef, hackathonData)
  return hackathonData as HackathonEvent
}

export async function getOrganizerHackathons(organizerId: string): Promise<HackathonEvent[]> {
  try {
    const db = getDb()
    const q = query(collection(db, "hackathons"), where("organizerId", "==", organizerId))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        event_id: doc.id,
        name: data.name || '',
        description: data.description || '',
        start_date: data.startDate?.toDate() || data.start_date?.toDate() || new Date(),
        end_date: data.endDate?.toDate() || data.end_date?.toDate() || new Date(),
        theme: data.theme || '',
        max_team_size: data.max_team_size || 5,
        prizes: data.prizes || [],
        rules: data.rules || [],
        organizer: data.organizer || data.organizer_id || organizerId,
        status: data.status || 'upcoming',
      } as HackathonEvent
    })
  } catch (error) {
    console.error("Error fetching organizer hackathons:", error)
    return []
  }
}

export async function getHackathonByJoinCode(joinCode: string): Promise<HackathonEvent | null> {
  try {
    const db = getDb()
    const q = query(collection(db, "hackathons"), where("joinCode", "==", joinCode))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) return null
    
    const doc = querySnapshot.docs[0]
    const data = doc.data()
    
    return {
      event_id: doc.id,
      name: data.name || '',
      description: data.description || '',
      start_date: data.startDate?.toDate() || data.start_date?.toDate() || new Date(),
      end_date: data.endDate?.toDate() || data.end_date?.toDate() || new Date(),
      theme: data.theme || '',
      max_team_size: data.max_team_size || 5,
      prizes: data.prizes || [],
      rules: data.rules || [],
      organizer: data.organizer || data.organizer_id || '',
      status: data.status || 'upcoming',
    } as HackathonEvent
  } catch (error) {
    console.error("Error fetching hackathon by join code:", error)
    return null
  }
}

export async function getHackathonTeams(hackathonId: string): Promise<Project[]> {
  try {
    const db = getDb()
    const q = query(collection(db, "projects"), where("hackathon_event", "==", hackathonId))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name || '',
        description: data.description || '',
        type: data.type || 'hackathon',
        status: data.status || 'planning',
        teamId: data.teamId || data.team_id || '',
        hackathonId: data.hackathonId || data.hackathon_event || hackathonId,
        techStack: data.techStack || data.tech_stack || [],
        category: data.category,
        privacy: data.privacy || 'team',
        createdAt: data.created_at?.toDate() || data.createdAt?.toDate() || new Date(),
        updatedAt: data.updated_at?.toDate() || data.updatedAt?.toDate() || new Date(),
        dueDate: data.due_date?.toDate() || data.dueDate?.toDate(),
        // Legacy fields
        duration: data.duration,
        created_by: data.created_by,
        members: data.members || [],
        join_code: data.join_code,
        demo_mode: data.demo_mode,
        idea: data.idea,
        hackathon_event: data.hackathon_event,
        submission_deadline: data.submission_deadline?.toDate(),
        github_repo: data.github_repo,
        demo_url: data.demo_url,
        pitch_deck_url: data.pitch_deck_url,
        github_access_token: data.github_access_token,
      } as Project
    })
  } catch (error) {
    console.error("Error fetching hackathon teams:", error)
    return []
  }
}

export async function getHackathonStats(hackathonId: string): Promise<{
  totalParticipants: number;
  totalTeams: number;
  activeProjects: number;
  completedProjects: number;
}> {
  try {
    const teams = await getHackathonTeams(hackathonId)
    
    let totalParticipants = 0
    let activeProjects = 0
    let completedProjects = 0
    
    for (const team of teams) {
      totalParticipants += team.members?.length || 0
      if (team.status === 'active' || team.status === 'planning') {
        activeProjects++
      } else if (team.status === 'completed') {
        completedProjects++
      }
    }
    
    return {
      totalParticipants,
      totalTeams: teams.length,
      activeProjects,
      completedProjects
    }
  } catch (error) {
    console.error("Error fetching hackathon stats:", error)
    return {
      totalParticipants: 0,
      totalTeams: 0,
      activeProjects: 0,
      completedProjects: 0
    }
  }
}

export async function updateHackathonStatus(hackathonId: string, status: HackathonEvent['status']): Promise<void> {
  const db = getDb()
  await updateDoc(doc(db, "hackathons", hackathonId), { status })
}

export async function joinHackathon(hackathonId: string, projectId: string): Promise<void> {
  const db = getDb()
  await updateDoc(doc(db, "projects", projectId), { hackathon_event: hackathonId })
}

export async function leaveHackathon(projectId: string): Promise<void> {
  const db = getDb()
  await updateDoc(doc(db, "projects", projectId), { hackathon_event: null })
}