import { useEffect, useRef, useCallback, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  subscribeToProject,
  subscribeToTasks,
  subscribeToMessages,
  subscribeToResources,
  subscribeToActivities,
  subscribeToNotifications,
  getProjectMembers,
} from '@/lib/firestore'
import type { Project, Task, ChatMessage, SharedResource, LiveActivity, TeamNotification, ProjectMember } from '@/lib/types'

interface SubscriptionData {
  project: Project | null
  tasks: Task[]
  messages: ChatMessage[]
  resources: SharedResource[]
  activities: LiveActivity[]
  notifications: TeamNotification[]
  members: ProjectMember[]
  loading: boolean
  error: string | null
}

// Optimized hook that manages all subscriptions with debouncing and selective updates
export function useOptimizedSubscriptions(projectId: string, activeTab: string = 'tasks') {
  const { user } = useAuth()
  const [data, setData] = useState<SubscriptionData>({
    project: null,
    tasks: [],
    messages: [],
    resources: [],
    activities: [],
    notifications: [],
    members: [],
    loading: true,
    error: null,
  })

  const unsubscribesRef = useRef<(() => void)[]>([])
  const mountedRef = useRef(true)
  const debounceTimersRef = useRef<Record<string, NodeJS.Timeout>>({})

  // Debounced update function to prevent cascading re-renders
  const debouncedUpdate = useCallback((key: keyof SubscriptionData, value: any, delay = 100) => {
    if (debounceTimersRef.current[key]) {
      clearTimeout(debounceTimersRef.current[key])
    }

    debounceTimersRef.current[key] = setTimeout(() => {
      if (mountedRef.current) {
        setData(prev => ({ ...prev, [key]: value }))
      }
    }, delay)
  }, [])

  // Optimized project subscription
  const subscribeToProjectData = useCallback(() => {
    if (!projectId || !user) return

    const unsubProject = subscribeToProject(projectId, (project) => {
      if (mountedRef.current && project) {
        debouncedUpdate('project', project, 50) // Faster update for project data
        
        // Load members when project loads
        if (project.members && project.members.length > 0) {
          getProjectMembers(project.members)
            .then(members => {
              if (mountedRef.current) {
                debouncedUpdate('members', members, 200)
              }
            })
            .catch(console.error)
        }
      }
    })

    unsubscribesRef.current.push(unsubProject)
  }, [projectId, user, debouncedUpdate])

  // Selective subscription based on active tab
  const subscribeToTabData = useCallback(() => {
    if (!projectId || !user) return

    // Always subscribe to tasks (core functionality)
    const unsubTasks = subscribeToTasks(projectId, (tasks) => {
      if (mountedRef.current) {
        debouncedUpdate('tasks', tasks, 150)
      }
    })
    unsubscribesRef.current.push(unsubTasks)

    // Subscribe to other data based on active tab
    switch (activeTab) {
      case 'chat':
        const unsubMessages = subscribeToMessages(projectId, (messages) => {
          if (mountedRef.current) {
            debouncedUpdate('messages', messages, 100)
          }
        })
        unsubscribesRef.current.push(unsubMessages)
        break

      case 'resources':
        const unsubResources = subscribeToResources(projectId, (resources) => {
          if (mountedRef.current) {
            debouncedUpdate('resources', resources, 200)
          }
        })
        unsubscribesRef.current.push(unsubResources)
        break

      case 'activity':
        const unsubActivities = subscribeToActivities(projectId, (activities) => {
          if (mountedRef.current) {
            debouncedUpdate('activities', activities, 300)
          }
        })
        unsubscribesRef.current.push(unsubActivities)
        break
    }

    // Always subscribe to notifications (lightweight)
    const unsubNotifications = subscribeToNotifications(projectId, user.uid, (notifications) => {
      if (mountedRef.current) {
        debouncedUpdate('notifications', notifications, 500)
      }
    })
    unsubscribesRef.current.push(unsubNotifications)

  }, [projectId, user, activeTab, debouncedUpdate])

  // Initialize subscriptions
  useEffect(() => {
    if (!projectId || !user) return

    setData(prev => ({ ...prev, loading: true, error: null }))

    // Clean up existing subscriptions
    unsubscribesRef.current.forEach(unsub => unsub())
    unsubscribesRef.current = []

    // Set up new subscriptions
    subscribeToProjectData()
    subscribeToTabData()

    // Mark as loaded after initial setup
    setTimeout(() => {
      if (mountedRef.current) {
        setData(prev => ({ ...prev, loading: false }))
      }
    }, 500)

    return () => {
      unsubscribesRef.current.forEach(unsub => unsub())
      unsubscribesRef.current = []
      
      // Clear debounce timers
      Object.values(debounceTimersRef.current).forEach(timer => clearTimeout(timer))
      debounceTimersRef.current = {}
    }
  }, [projectId, user, subscribeToProjectData, subscribeToTabData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return data
}