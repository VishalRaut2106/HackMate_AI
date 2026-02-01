import { useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'
import {
  updateTask,
  deleteTask,
  addTask,
  sendMessage,
  updateProjectIdea,
  updateDemoMode,
  addActivity,
} from '@/lib/firestore'
import type { Task, IdeaAnalysis } from '@/lib/types'

// Optimized handlers with useCallback to prevent re-renders
export function useProjectHandlers(projectId: string) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Request deduplication
  const pendingRequests = useRef<Set<string>>(new Set())

  // Optimistic task status update with rollback
  const handleUpdateTaskStatus = useCallback(async (
    taskId: string, 
    newStatus: Task['status'],
    currentTasks: Task[],
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  ) => {
    const requestKey = `task-status-${taskId}-${newStatus}`
    
    // Prevent duplicate requests
    if (pendingRequests.current.has(requestKey)) return
    pendingRequests.current.add(requestKey)

    // Find original task for rollback
    const originalTask = currentTasks.find(t => t.task_id === taskId)
    if (!originalTask) return

    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.task_id === taskId 
        ? { ...t, status: newStatus, last_updated: new Date() }
        : t
    ))

    try {
      await updateTask(taskId, { status: newStatus })
      
      // Add activity log
      if (user) {
        addActivity({
          project_id: projectId,
          user_id: user.uid,
          type: 'task_update',
          description: `moved "${originalTask.title}" to ${newStatus}`,
        }).catch(console.error)
      }
    } catch (error) {
      // Rollback on error
      setTasks(prev => prev.map(t => 
        t.task_id === taskId ? originalTask : t
      ))
      
      toast({
        title: "Failed to update task",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      pendingRequests.current.delete(requestKey)
    }
  }, [projectId, user, toast])

  // Optimistic task assignment
  const handleAssignTask = useCallback(async (
    taskId: string,
    assignedTo: string | null,
    currentTasks: Task[],
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  ) => {
    const requestKey = `task-assign-${taskId}-${assignedTo}`
    
    if (pendingRequests.current.has(requestKey)) return
    pendingRequests.current.add(requestKey)

    const originalTask = currentTasks.find(t => t.task_id === taskId)
    if (!originalTask) return

    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.task_id === taskId 
        ? { ...t, assigned_to: assignedTo, last_updated: new Date() }
        : t
    ))

    try {
      await updateTask(taskId, { assigned_to: assignedTo })
      toast({ 
        title: assignedTo ? "Task assigned!" : "Task unassigned!",
        duration: 2000 
      })
    } catch (error) {
      // Rollback
      setTasks(prev => prev.map(t => 
        t.task_id === taskId ? originalTask : t
      ))
      
      toast({
        title: "Failed to update assignment",
        variant: "destructive",
      })
    } finally {
      pendingRequests.current.delete(requestKey)
    }
  }, [toast])

  // Optimistic task deletion
  const handleDeleteTask = useCallback(async (
    taskId: string,
    currentTasks: Task[],
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  ) => {
    const requestKey = `task-delete-${taskId}`
    
    if (pendingRequests.current.has(requestKey)) return
    pendingRequests.current.add(requestKey)

    const taskToDelete = currentTasks.find(t => t.task_id === taskId)
    if (!taskToDelete) return

    // Optimistic removal
    setTasks(prev => prev.filter(t => t.task_id !== taskId))

    try {
      await deleteTask(taskId)
      toast({ title: "Task deleted!", duration: 2000 })
    } catch (error) {
      // Rollback - add task back
      setTasks(prev => [...prev, taskToDelete].sort((a, b) => 
        new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
      ))
      
      toast({
        title: "Failed to delete task",
        variant: "destructive",
      })
    } finally {
      pendingRequests.current.delete(requestKey)
    }
  }, [toast])

  // Optimized task creation
  const handleAddTask = useCallback(async (
    taskData: Omit<Task, 'task_id' | 'last_updated'>,
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
    resetForm: () => void
  ) => {
    const requestKey = `task-add-${Date.now()}`
    
    if (pendingRequests.current.has(requestKey)) return
    pendingRequests.current.add(requestKey)

    try {
      const newTask = await addTask(taskData)
      if (newTask) {
        // Task is already added optimistically by the addTask function
        toast({ title: "Task added!", duration: 2000 })
        resetForm()
      }
    } catch (error) {
      toast({
        title: "Failed to add task",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      pendingRequests.current.delete(requestKey)
    }
  }, [toast])

  // Optimized message sending
  const handleSendMessage = useCallback(async (
    content: string,
    senderType: 'user' | 'ai' = 'user',
    setChatInput?: (value: string) => void,
    setIsSending?: (value: boolean) => void
  ) => {
    if (!user || !content.trim()) return

    const requestKey = `message-${Date.now()}`
    
    if (pendingRequests.current.has(requestKey)) return
    pendingRequests.current.add(requestKey)

    if (setIsSending) setIsSending(true)
    if (setChatInput) setChatInput('')

    try {
      await sendMessage({
        project_id: projectId,
        sender: user.uid,
        sender_type: senderType,
        content: content.trim(),
      })
    } catch (error) {
      toast({
        title: "Failed to send message",
        variant: "destructive",
      })
      
      // Restore input on error
      if (setChatInput) setChatInput(content)
    } finally {
      if (setIsSending) setIsSending(false)
      pendingRequests.current.delete(requestKey)
    }
  }, [projectId, user, toast])

  // Optimized idea analysis
  const handleAnalyzeIdea = useCallback(async (
    idea: string,
    duration: string,
    setProject: React.Dispatch<React.SetStateAction<any>>,
    setIsAnalyzing: (value: boolean) => void
  ) => {
    if (!idea.trim()) return

    const requestKey = `analyze-idea-${projectId}`
    
    if (pendingRequests.current.has(requestKey)) return
    pendingRequests.current.add(requestKey)

    setIsAnalyzing(true)

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_idea',
          data: { idea, duration }
        })
      })

      if (!response.ok) throw new Error('Analysis failed')

      const { result } = await response.json()
      const analysis: IdeaAnalysis = JSON.parse(result)

      // Update project with analysis
      await updateProjectIdea(projectId, analysis)
      setProject((prev: any) => prev ? { ...prev, idea: analysis } : prev)

      toast({
        title: "Idea analyzed!",
        description: "Your project plan is ready.",
      })
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Please try again or continue manually.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
      pendingRequests.current.delete(requestKey)
    }
  }, [projectId, toast])

  // Optimized demo mode toggle
  const handleToggleDemoMode = useCallback(async (
    enabled: boolean,
    setProject: React.Dispatch<React.SetStateAction<any>>
  ) => {
    const requestKey = `demo-mode-${projectId}-${enabled}`
    
    if (pendingRequests.current.has(requestKey)) return
    pendingRequests.current.add(requestKey)

    // Optimistic update
    setProject((prev: any) => prev ? { ...prev, demo_mode: enabled } : prev)

    try {
      await updateDemoMode(projectId, enabled)
      toast({
        title: enabled ? "Demo mode enabled" : "Demo mode disabled",
        description: enabled 
          ? "Anyone with the link can view this project" 
          : "Project is now private",
        duration: 3000,
      })
    } catch (error) {
      // Rollback
      setProject((prev: any) => prev ? { ...prev, demo_mode: !enabled } : prev)
      
      toast({
        title: "Failed to update demo mode",
        variant: "destructive",
      })
    } finally {
      pendingRequests.current.delete(requestKey)
    }
  }, [projectId, toast])

  return {
    handleUpdateTaskStatus,
    handleAssignTask,
    handleDeleteTask,
    handleAddTask,
    handleSendMessage,
    handleAnalyzeIdea,
    handleToggleDemoMode,
  }
}