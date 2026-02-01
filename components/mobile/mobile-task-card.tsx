'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task, ProjectMember } from '@/lib/types';
import { 
  MoreVertical, 
  User, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Circle,
  Play,
  Trash2
} from 'lucide-react';

interface MobileTaskCardProps {
  task: Task;
  members: ProjectMember[];
  onStatusChange: (taskId: string, status: Task['status']) => void;
  onAssign: (taskId: string, assignedTo: string | null) => void;
  onDelete: (taskId: string) => void;
}

export function MobileTaskCard({ 
  task, 
  members, 
  onStatusChange, 
  onAssign, 
  onDelete 
}: MobileTaskCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const assignedMember = members.find(m => m.user_id === task.assigned_to);

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'ToDo': return <Circle className="h-4 w-4 text-muted-foreground" />;
      case 'InProgress': return <Play className="h-4 w-4 text-blue-500" />;
      case 'Done': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'ToDo': return 'bg-muted text-muted-foreground';
      case 'InProgress': return 'bg-blue-100 text-blue-800';
      case 'Done': return 'bg-green-100 text-green-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEffortColor = (effort: Task['effort']) => {
    switch (effort) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Card className="mb-3 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getStatusIcon(task.status)}
                <h3 className="font-medium text-sm truncate">{task.title}</h3>
              </div>
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {task.description}
                </p>
              )}
            </div>
            <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                  <SheetTitle className="text-left">{task.title}</SheetTitle>
                  <SheetDescription className="text-left">
                    Task details and actions
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mt-6 space-y-6">
                  {/* Description */}
                  {task.description && (
                    <div>
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <h4 className="font-medium mb-2">Status</h4>
                    <Select 
                      value={task.status} 
                      onValueChange={(value: Task['status']) => onStatusChange(task.task_id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ToDo">To Do</SelectItem>
                        <SelectItem value="InProgress">In Progress</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assignment */}
                  <div>
                    <h4 className="font-medium mb-2">Assigned To</h4>
                    <Select 
                      value={task.assigned_to || "unassigned"} 
                      onValueChange={(value) => onAssign(task.task_id, value === "unassigned" ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {assignedMember ? (
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                {assignedMember.name.charAt(0).toUpperCase()}
                              </div>
                              <span>{assignedMember.name}</span>
                            </div>
                          ) : (
                            "Unassigned"
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">
                          <span className="text-muted-foreground">Unassigned</span>
                        </SelectItem>
                        {members.map((member) => (
                          <SelectItem key={member.user_id} value={member.user_id}>
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <span>{member.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Properties */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Priority</h4>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Effort</h4>
                      <Badge className={getEffortColor(task.effort)}>
                        {task.effort}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-4 border-t">
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        onDelete(task.task_id);
                        setDetailsOpen(false);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Task
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(task.status)} variant="secondary">
                {task.status === 'ToDo' ? 'To Do' : 
                 task.status === 'InProgress' ? 'In Progress' : 'Done'}
              </Badge>
              <Badge className={getPriorityColor(task.priority)} variant="outline">
                {task.priority}
              </Badge>
            </div>
            
            {assignedMember && (
              <div className="flex items-center gap-1">
                <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {assignedMember.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-muted-foreground truncate max-w-16">
                  {assignedMember.name}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}