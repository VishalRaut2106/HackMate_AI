import { Task, Project, ProjectMember } from './types';

export interface ConflictEvent {
  id: string;
  type: 'task_update' | 'task_assignment' | 'project_settings' | 'member_action';
  resourceId: string;
  userId: string;
  timestamp: Date;
  data: any;
  version: number;
}

export interface ConflictResolution {
  id: string;
  conflictType: 'concurrent_edit' | 'assignment_conflict' | 'permission_conflict' | 'data_inconsistency';
  events: ConflictEvent[];
  resolution: 'merge' | 'override' | 'manual' | 'rollback';
  resolvedBy?: string;
  resolvedAt?: Date;
  mergedData?: any;
}

export class ConflictResolver {
  private static conflicts: Map<string, ConflictResolution> = new Map();
  private static eventLog: ConflictEvent[] = [];

  // Log an event for conflict detection
  static logEvent(event: Omit<ConflictEvent, 'id' | 'timestamp' | 'version'>): ConflictEvent {
    const fullEvent: ConflictEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      version: this.getNextVersion(event.resourceId)
    };

    this.eventLog.push(fullEvent);
    this.detectConflicts(fullEvent);
    
    return fullEvent;
  }

  // Detect potential conflicts
  private static detectConflicts(newEvent: ConflictEvent) {
    const recentEvents = this.eventLog.filter(event => 
      event.resourceId === newEvent.resourceId &&
      event.id !== newEvent.id &&
      (newEvent.timestamp.getTime() - event.timestamp.getTime()) < 30000 // 30 seconds
    );

    if (recentEvents.length > 0) {
      const conflictType = this.determineConflictType(newEvent, recentEvents);
      if (conflictType) {
        this.createConflict(conflictType, [newEvent, ...recentEvents]);
      }
    }
  }

  // Determine the type of conflict
  private static determineConflictType(
    newEvent: ConflictEvent, 
    recentEvents: ConflictEvent[]
  ): ConflictResolution['conflictType'] | null {
    // Concurrent edits on the same resource
    if (recentEvents.some(event => 
      event.type === newEvent.type && 
      event.userId !== newEvent.userId
    )) {
      return 'concurrent_edit';
    }

    // Assignment conflicts
    if (newEvent.type === 'task_assignment' && 
        recentEvents.some(event => event.type === 'task_assignment')) {
      return 'assignment_conflict';
    }

    // Permission conflicts
    if (newEvent.type === 'member_action' && 
        recentEvents.some(event => event.type === 'member_action')) {
      return 'permission_conflict';
    }

    return null;
  }

  // Create a conflict resolution entry
  private static createConflict(
    conflictType: ConflictResolution['conflictType'],
    events: ConflictEvent[]
  ) {
    const conflict: ConflictResolution = {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conflictType,
      events,
      resolution: this.determineAutoResolution(conflictType, events)
    };

    this.conflicts.set(conflict.id, conflict);

    // Auto-resolve if possible
    if (conflict.resolution !== 'manual') {
      this.resolveConflict(conflict.id, conflict.resolution);
    }
  }

  // Determine if conflict can be auto-resolved
  private static determineAutoResolution(
    conflictType: ConflictResolution['conflictType'],
    events: ConflictEvent[]
  ): ConflictResolution['resolution'] {
    switch (conflictType) {
      case 'concurrent_edit':
        // Try to merge if changes are to different fields
        if (this.canMergeChanges(events)) {
          return 'merge';
        }
        return 'manual';

      case 'assignment_conflict':
        // Last assignment wins
        return 'override';

      case 'permission_conflict':
        // Require manual resolution for permission conflicts
        return 'manual';

      case 'data_inconsistency':
        // Try to merge data
        return 'merge';

      default:
        return 'manual';
    }
  }

  // Check if changes can be automatically merged
  private static canMergeChanges(events: ConflictEvent[]): boolean {
    if (events.length !== 2) return false;

    const [event1, event2] = events;
    
    // For task updates, check if different fields were modified
    if (event1.type === 'task_update' && event2.type === 'task_update') {
      const fields1 = Object.keys(event1.data);
      const fields2 = Object.keys(event2.data);
      
      // No overlapping fields = can merge
      return !fields1.some(field => fields2.includes(field));
    }

    return false;
  }

  // Resolve a conflict
  static resolveConflict(
    conflictId: string, 
    resolution: ConflictResolution['resolution'],
    userId?: string
  ): any {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return null;

    let mergedData: any = null;

    switch (resolution) {
      case 'merge':
        mergedData = this.mergeEventData(conflict.events);
        break;

      case 'override':
        // Use the latest event's data
        const latestEvent = conflict.events.reduce((latest, event) => 
          event.timestamp > latest.timestamp ? event : latest
        );
        mergedData = latestEvent.data;
        break;

      case 'rollback':
        // Revert to state before conflict
        mergedData = this.getRollbackData(conflict.events);
        break;

      case 'manual':
        // Manual resolution - return conflict for user decision
        return conflict;
    }

    // Update conflict resolution
    conflict.resolution = resolution;
    conflict.resolvedBy = userId;
    conflict.resolvedAt = new Date();
    conflict.mergedData = mergedData;

    this.conflicts.set(conflictId, conflict);

    return mergedData;
  }

  // Merge data from conflicting events
  private static mergeEventData(events: ConflictEvent[]): any {
    const merged = {};
    
    // Merge in chronological order
    events
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .forEach(event => {
        Object.assign(merged, event.data);
      });

    return merged;
  }

  // Get rollback data (state before conflict)
  private static getRollbackData(events: ConflictEvent[]): any {
    // Find the earliest event and return its previous state
    const earliestEvent = events.reduce((earliest, event) => 
      event.timestamp < earliest.timestamp ? event : earliest
    );

    // In a real implementation, this would fetch the previous state
    // For now, return empty object to indicate rollback
    return { _rollback: true, resourceId: earliestEvent.resourceId };
  }

  // Get next version number for a resource
  private static getNextVersion(resourceId: string): number {
    const resourceEvents = this.eventLog.filter(event => event.resourceId === resourceId);
    return resourceEvents.length > 0 ? 
      Math.max(...resourceEvents.map(e => e.version)) + 1 : 1;
  }

  // Get all unresolved conflicts
  static getUnresolvedConflicts(): ConflictResolution[] {
    return Array.from(this.conflicts.values()).filter(conflict => 
      conflict.resolution === 'manual' && !conflict.resolvedAt
    );
  }

  // Get conflicts for a specific resource
  static getResourceConflicts(resourceId: string): ConflictResolution[] {
    return Array.from(this.conflicts.values()).filter(conflict =>
      conflict.events.some(event => event.resourceId === resourceId)
    );
  }

  // Clear resolved conflicts older than specified time
  static cleanupResolvedConflicts(olderThanHours: number = 24) {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    
    for (const [id, conflict] of this.conflicts.entries()) {
      if (conflict.resolvedAt && conflict.resolvedAt < cutoffTime) {
        this.conflicts.delete(id);
      }
    }

    // Also cleanup old events
    this.eventLog = this.eventLog.filter(event => 
      event.timestamp > cutoffTime
    );
  }

  // Task-specific conflict resolution
  static resolveTaskConflict(
    taskId: string,
    conflictingUpdates: Partial<Task>[],
    userId: string
  ): Task {
    // Log the conflict resolution attempt
    this.logEvent({
      type: 'task_update',
      resourceId: taskId,
      userId,
      data: { action: 'resolve_conflict', updates: conflictingUpdates }
    });

    // Merge strategy for task conflicts
    const merged: Partial<Task> = {};

    // Priority: Critical > High > Medium > Low
    const priorities = ['Critical', 'High', 'Medium', 'Low'];
    const highestPriority = conflictingUpdates
      .map(update => update.priority)
      .filter(Boolean)
      .sort((a, b) => priorities.indexOf(a!) - priorities.indexOf(b!))[0];

    if (highestPriority) merged.priority = highestPriority;

    // Status: Done > InProgress > ToDo (most advanced wins)
    const statuses = ['Done', 'InProgress', 'ToDo'];
    const mostAdvancedStatus = conflictingUpdates
      .map(update => update.status)
      .filter(Boolean)
      .sort((a, b) => statuses.indexOf(a!) - statuses.indexOf(b!))[0];

    if (mostAdvancedStatus) merged.status = mostAdvancedStatus;

    // Assignment: Last assignment wins
    const assignments = conflictingUpdates
      .map(update => update.assigned_to)
      .filter(assignment => assignment !== undefined);
    
    if (assignments.length > 0) {
      merged.assigned_to = assignments[assignments.length - 1];
    }

    // Description: Merge if different, otherwise take longest
    const descriptions = conflictingUpdates
      .map(update => update.description)
      .filter(Boolean);
    
    if (descriptions.length > 0) {
      merged.description = descriptions.reduce((longest, current) => 
        current!.length > longest!.length ? current : longest
      );
    }

    // Effort: Take highest effort estimate
    const efforts = ['High', 'Medium', 'Low'];
    const highestEffort = conflictingUpdates
      .map(update => update.effort)
      .filter(Boolean)
      .sort((a, b) => efforts.indexOf(a!) - efforts.indexOf(b!))[0];

    if (highestEffort) merged.effort = highestEffort;

    return merged as Task;
  }

  // Project-specific conflict resolution
  static resolveProjectConflict(
    projectId: string,
    conflictingUpdates: Partial<Project>[],
    userId: string
  ): Project {
    this.logEvent({
      type: 'project_settings',
      resourceId: projectId,
      userId,
      data: { action: 'resolve_conflict', updates: conflictingUpdates }
    });

    const merged: Partial<Project> = {};

    // Name: Take the most recent non-empty name
    const names = conflictingUpdates
      .map(update => update.name)
      .filter(Boolean);
    if (names.length > 0) merged.name = names[names.length - 1];

    // Demo mode: True wins (more permissive)
    const demoModes = conflictingUpdates
      .map(update => update.demo_mode)
      .filter(mode => mode !== undefined);
    if (demoModes.length > 0) {
      merged.demo_mode = demoModes.some(mode => mode === true);
    }

    // URLs: Merge all non-empty URLs
    const githubRepos = conflictingUpdates
      .map(update => update.github_repo)
      .filter(Boolean);
    if (githubRepos.length > 0) merged.github_repo = githubRepos[githubRepos.length - 1];

    const demoUrls = conflictingUpdates
      .map(update => update.demo_url)
      .filter(Boolean);
    if (demoUrls.length > 0) merged.demo_url = demoUrls[demoUrls.length - 1];

    return merged as Project;
  }

  // Get conflict statistics
  static getConflictStats() {
    const conflicts = Array.from(this.conflicts.values());
    
    return {
      total: conflicts.length,
      resolved: conflicts.filter(c => c.resolvedAt).length,
      pending: conflicts.filter(c => !c.resolvedAt).length,
      byType: {
        concurrent_edit: conflicts.filter(c => c.conflictType === 'concurrent_edit').length,
        assignment_conflict: conflicts.filter(c => c.conflictType === 'assignment_conflict').length,
        permission_conflict: conflicts.filter(c => c.conflictType === 'permission_conflict').length,
        data_inconsistency: conflicts.filter(c => c.conflictType === 'data_inconsistency').length
      },
      autoResolved: conflicts.filter(c => c.resolution !== 'manual' && c.resolvedAt).length,
      manualResolved: conflicts.filter(c => c.resolution === 'manual' && c.resolvedAt).length
    };
  }
}