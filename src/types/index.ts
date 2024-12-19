import { Database } from '@/lib/database.types';

export type Tables = Database['public']['Tables'];
export type Enums = Database['public']['Enums'];

export interface User extends Tables['profiles']['Row'] {}

export interface Goal extends Omit<Tables['goals']['Row'], 'deadline' | 'created_at' | 'updated_at'> {
  deadline: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Task extends Omit<Tables['tasks']['Row'], 'deadline' | 'created_at' | 'updated_at'> {
  deadline: Date;
  created_at: Date;
  updated_at: Date;
}

export type GoalCategory = Enums['goal_category'];
export type Priority = Enums['priority_level'];
export type GoalStatus = Enums['goal_status'];
export type TaskStatus = Enums['task_status'];

export interface Notification extends Tables['notifications']['Row'] {
  created_at: Date;
}

export interface UserSettings extends Tables['user_settings']['Row'] {
  created_at: Date;
  updated_at: Date;
}
