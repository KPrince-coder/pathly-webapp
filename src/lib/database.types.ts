export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          avatar_url: string | null;
          timezone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          timezone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          timezone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string;
          priority: string;
          deadline: string;
          progress: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category: string;
          priority: string;
          deadline: string;
          progress?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          priority?: string;
          deadline?: string;
          progress?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          goal_id: string;
          user_id: string;
          title: string;
          description: string | null;
          priority: string;
          deadline: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          user_id: string;
          title: string;
          description?: string | null;
          priority: string;
          deadline: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          goal_id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          priority?: string;
          deadline?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          read?: boolean;
          created_at?: string;
        };
      };
      user_settings: {
        Row: {
          user_id: string;
          theme: string;
          email_notifications: boolean;
          push_notifications: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          theme?: string;
          email_notifications?: boolean;
          push_notifications?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          theme?: string;
          email_notifications?: boolean;
          push_notifications?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      time_entries: {
        Row: {
          id: string;
          user_id: string;
          task_id: string | null;
          goal_id: string | null;
          start_time: string;
          end_time: string | null;
          duration: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_id?: string | null;
          goal_id?: string | null;
          start_time: string;
          end_time?: string | null;
          duration?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_id?: string | null;
          goal_id?: string | null;
          start_time?: string;
          end_time?: string | null;
          duration?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      time_tracking_settings: {
        Row: {
          user_id: string;
          pomodoro_duration: number;
          short_break_duration: number;
          long_break_duration: number;
          pomodoros_until_long_break: number;
          auto_start_breaks: boolean;
          auto_start_pomodoros: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          pomodoro_duration?: number;
          short_break_duration?: number;
          long_break_duration?: number;
          pomodoros_until_long_break?: number;
          auto_start_breaks?: boolean;
          auto_start_pomodoros?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          pomodoro_duration?: number;
          short_break_duration?: number;
          long_break_duration?: number;
          pomodoros_until_long_break?: number;
          auto_start_breaks?: boolean;
          auto_start_pomodoros?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      goal_category: 'Personal' | 'Work' | 'Health' | 'Education' | 'Finance' | 'Social' | 'Other';
      priority_level: 'Low' | 'Medium' | 'High';
      goal_status: 'Not Started' | 'In Progress' | 'Completed';
      task_status: 'Todo' | 'In Progress' | 'Done';
    };
  };
}
