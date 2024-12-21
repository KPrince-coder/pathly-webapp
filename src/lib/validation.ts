import { z } from 'zod';

// User validation schemas
export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .optional(),
});

// Task validation schemas
export const taskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['todo', 'in-progress', 'completed']),
  deadline: z
    .string()
    .datetime()
    .refine((date) => new Date(date) > new Date(), {
      message: 'Deadline must be in the future',
    })
    .optional(),
  estimatedDuration: z
    .number()
    .min(5, 'Duration must be at least 5 minutes')
    .max(480, 'Duration must be less than 8 hours')
    .optional(),
  tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed').optional(),
  dependencies: z.array(z.string()).optional(),
});

// Time block validation schemas
export const timeBlockSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime()
}).superRefine((data, ctx) => {
  const parsedEnd = new Date(data.endTime);
  const parsedStart = new Date(data.startTime);
  
  if (parsedEnd <= parsedStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'End time must be after start time',
      path: ['endTime']
    });
  }
});

// Settings validation schemas
export const workingHoursSchema = z.object({
  start: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  end: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
}).refine((data) => {
  const [startHour, startMinute] = data.start.split(':').map(Number);
  const [endHour, endMinute] = data.end.split(':').map(Number);
  return endHour > startHour || (endHour === startHour && endMinute > startMinute);
}, {
  message: 'End time must be after start time',
  path: ['end']
});

export const userSettingsSchema = z.object({
  workingHours: workingHoursSchema,
  defaultTaskDuration: z.number().min(5).max(480),
  pomodoroSettings: z.object({
    workDuration: z.number().min(1).max(60),
    shortBreakDuration: z.number().min(1).max(30),
    longBreakDuration: z.number().min(1).max(60),
    cyclesBeforeLongBreak: z.number().min(1).max(10),
  }),
  notifications: z.object({
    enabled: z.boolean(),
    sound: z.boolean(),
    taskReminders: z.boolean(),
    pomodoroAlerts: z.boolean(),
  }),
  theme: z.enum(['light', 'dark', 'system']),
  language: z.string().min(2).max(5),
});

// Helper functions
export function validateForm<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

export function getFormErrors(zodError: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  zodError.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });
  return errors;
}

// Signup form validation
export const validateSignupForm = (formData: {
  name: string;
  email: string;
  password: string;
}): { success: true; data: z.infer<typeof userSchema> } | { success: false; errors: z.ZodError } => {
  return validateForm(userSchema.pick({ name: true, email: true, password: true }), formData);
};

// Export interfaces
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
