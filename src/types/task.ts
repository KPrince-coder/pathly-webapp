export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in-progress' | 'completed';
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface TimeBlock {
  id: string;
  startTime: Date;
  endTime: Date;
  taskId: string;
  userId: string;
  isFocusTime: boolean;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  type: 'blocks' | 'required' | 'optional';
}

export interface TaskRecurrence {
  pattern: RecurrencePattern;
  interval?: number;
  unit?: 'days' | 'weeks' | 'months';
  weekDays?: number[];
  monthDay?: number;
  endDate?: Date;
  exceptions?: Date[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: string;
  estimatedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  createdBy: string;
  assignedTo?: string;
  timeBlock?: TimeBlock;
  recurrence?: TaskRecurrence;
  dependencies?: TaskDependency[];
  progress?: number; // 0-100
  tags?: string[];
  notes?: string[];
  focusTime?: {
    pomodorosCompleted: number;
    totalPomodoros: number;
    lastPomodoroDate?: Date;
  };
  analytics?: {
    estimationAccuracy?: number; // ratio of actual/estimated duration
    completionRate?: number; // percentage of times completed on time
    productivityScore?: number; // 0-100 based on focus time and completion
  };
}
