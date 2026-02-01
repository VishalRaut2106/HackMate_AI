import React, { memo, useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, User, Clock } from 'lucide-react'
import type { Task, ProjectMember } from '@/lib/types'
import { TASK_PRIORITIES, TASK_EFFORTS } from '@/lib/constants'

interface OptimizedTaskCardProps {
  task: Task
  members: ProjectMember[]
  onUpdateStatus: (taskId: string, status: Task['status']) => void
  onAssignTask: (taskId: string, assignedTo: string | null) => void
  onDeleteTask: (taskId: string) => void
  onUpdatePriority: (taskId: string, priority: Task['priority']) => void
  isDragging?: boolean
}

// Memoized task card to prevent unnecessary re-renders
const OptimizedTaskCard = memo<OptimizedTaskCardProps>(({
  task,
  members,
  onUpdateStatus,
  onAssignTask,
  onDeleteTask,
  onUpdatePriority,
  isDragging = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.task_id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  }

  // Memoized handlers to prevent re-creation
  const handleAssigneeChange = useCallback((value: string) => {
    onAssignTask(task.task_id, value === 'unassigned' ? null : value)
  }, [task.task_id, onAssignTask])

  const handlePriorityChange = useCallback((value: string) => {
    onUpdatePriority(task.task_id, value as Task['priority'])
  }, [task.task_id, onUpdatePriority])

  const handleDelete = useCallback(() => {
    onDeleteTask(task.task_id)
  }, [task.task_id, onDeleteTask])

  // Find assigned member
  const assignedMember = task.assigned_to 
    ? members.find(m => m.user_id === task.assigned_to)
    : null

  // Priority color mapping
  const priorityColors = {
    Low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    High: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    Critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  }

  // Effort color mapping
  const effortColors = {
    Low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    Medium: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    High: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md ${
        isDragging || isSortableDragging ? 'shadow-lg scale-105' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium line-clamp-2">
            {task.title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1">
          <Badge 
            variant="secondary" 
            className={`text-xs ${priorityColors[task.priority || 'Medium']}`}
          >
            {task.priority || 'Medium'}
          </Badge>
          <Badge 
            variant="outline" 
            className={`text-xs ${effortColors[task.effort]}`}
          >
            {task.effort}
          </Badge>
        </div>

        <div className="space-y-2">
          {/* Priority Selector */}
          <Select value={task.priority || 'Medium'} onValueChange={handlePriorityChange}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map(priority => (
                <SelectItem key={priority} value={priority} className="text-xs">
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Assignee Selector */}
          <Select 
            value={task.assigned_to || 'unassigned'} 
            onValueChange={handleAssigneeChange}
          >
            <SelectTrigger className="h-7 text-xs">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <SelectValue placeholder="Unassigned" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned" className="text-xs">
                Unassigned
              </SelectItem>
              {members.map(member => (
                <SelectItem key={member.user_id} value={member.user_id} className="text-xs">
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Task metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {task.time_spent ? `${Math.round(task.time_spent / 60)}h` : '0h'}
          </div>
          {assignedMember && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              {assignedMember.name.split(' ')[0]}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  return (
    prevProps.task.task_id === nextProps.task.task_id &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.description === nextProps.task.description &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.priority === nextProps.task.priority &&
    prevProps.task.effort === nextProps.task.effort &&
    prevProps.task.assigned_to === nextProps.task.assigned_to &&
    prevProps.task.time_spent === nextProps.task.time_spent &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.members.length === nextProps.members.length
  )
})

OptimizedTaskCard.displayName = 'OptimizedTaskCard'

export default OptimizedTaskCard