export type VisionGoalCategory = 'Career' | 'Personal' | 'Relationships' | 'Financial' | 'Health' | 'Education' | 'Other';
export type VisionGoalStatus = 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
export type VisionMilestoneStatus = 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
export type VisionTaskStatus = 'Todo' | 'In Progress' | 'Done';
export type VisionTaskPriority = 'Low' | 'Medium' | 'High';
export type VisionReflectionMood = 'Positive' | 'Neutral' | 'Challenging';
export type MentorshipStatus = 'Pending' | 'Active' | 'Completed' | 'Declined';

export interface SmartGoalDetails {
  specific: string;
  measurable: {
    metric: string;
    targetValue: number;
    unit: string;
  };
  achievable: string[];
  relevant: string;
  timeBound: {
    startDate: string;
    endDate: string;
    checkpoints: string[];
  };
}

export interface VisionGoal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: VisionGoalCategory;
  targetDate: string;
  createdAt: string;
  updatedAt: string;
  status: VisionGoalStatus;
  isSmartGoal: boolean;
  smartDetails?: SmartGoalDetails;
  inspirationMedia: Array<{
    type: 'image' | 'quote' | 'video';
    url: string;
    caption?: string;
  }>;
  reflectionNotes: string[];
}

export interface VisionMilestone {
  id: string;
  visionGoalId: string;
  title: string;
  description?: string;
  targetDate: string;
  progress: number;
  status: VisionMilestoneStatus;
  createdAt: string;
  updatedAt: string;
}

export interface VisionTask {
  id: string;
  milestoneId: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: VisionTaskPriority;
  status: VisionTaskStatus;
  createdAt: string;
  updatedAt: string;
  recurringPattern?: {
    type: 'daily' | 'weekly' | 'monthly';
    frequency: number;
    endDate?: string;
  };
}

export interface VisionReflection {
  id: string;
  visionGoalId: string;
  reflectionDate: string;
  content: string;
  mood: VisionReflectionMood;
  createdAt: string;
}

export interface VisionMentorship {
  id: string;
  mentorId: string;
  menteeId: string;
  visionGoalId: string;
  status: MentorshipStatus;
  createdAt: string;
  updatedAt: string;
}
