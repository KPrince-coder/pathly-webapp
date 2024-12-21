import { Task, TimeBlock, TaskPriority } from '@/types/task';
import { supabase } from '@/lib/supabase';

interface AvailabilitySlot {
  startTime: Date;
  endTime: Date;
  isRecurring?: boolean;
}

interface WorkingHours {
  start: string;
  end: string;
  daysOfWeek: number[];
}

export class TaskScheduler {
  private async getUserAvailability(userId: string, date: Date): Promise<AvailabilitySlot[]> {
    try {
      // Get user's working hours
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('working_hours')
        .eq('user_id', userId)
        .single();

      if (settingsError) throw settingsError;

      const workingHours: WorkingHours = settings.working_hours;
      
      // Get existing time blocks for the date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: timeBlocks, error: timeBlocksError } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', startOfDay.toISOString())
        .lte('end_time', endOfDay.toISOString());

      if (timeBlocksError) throw timeBlocksError;

      // Convert working hours to availability slots
      const slots: AvailabilitySlot[] = [];
      if (workingHours.daysOfWeek.includes(date.getDay())) {
        const [startHour, startMinute] = workingHours.start.split(':').map(Number);
        const [endHour, endMinute] = workingHours.end.split(':').map(Number);

        const slotStart = new Date(date);
        slotStart.setHours(startHour, startMinute, 0, 0);
        const slotEnd = new Date(date);
        slotEnd.setHours(endHour, endMinute, 0, 0);

        // Remove booked time blocks from availability
        const availableSlots = this.subtractTimeBlocks(
          [{ startTime: slotStart, endTime: slotEnd }],
          timeBlocks.map(block => ({
            startTime: new Date(block.start_time),
            endTime: new Date(block.end_time)
          }))
        );

        slots.push(...availableSlots);
      }

      return slots;
    } catch (error) {
      console.error('Error fetching user availability:', error);
      return [];
    }
  }

  private subtractTimeBlocks(
    availableSlots: AvailabilitySlot[],
    bookedSlots: AvailabilitySlot[]
  ): AvailabilitySlot[] {
    const result: AvailabilitySlot[] = [];

    for (const available of availableSlots) {
      let current = new Date(available.startTime);
      const slots: AvailabilitySlot[] = [];

      // Sort booked slots that overlap with the available slot
      const relevantBookings = bookedSlots
        .filter(
          booked =>
            booked.startTime < available.endTime &&
            booked.endTime > available.startTime
        )
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      // Create available slots between bookings
      for (const booking of relevantBookings) {
        if (booking.startTime > current) {
          slots.push({
            startTime: new Date(current),
            endTime: new Date(booking.startTime)
          });
        }
        current = new Date(booking.endTime);
      }

      // Add remaining time after last booking
      if (current < available.endTime) {
        slots.push({
          startTime: new Date(current),
          endTime: new Date(available.endTime)
        });
      }

      result.push(...slots);
    }

    return result;
  }

  private calculateTaskPriorityScore(task: Task): number {
    const now = new Date();
    const deadline = task.deadline ? new Date(task.deadline) : null;
    let score = 0;

    // Priority base score
    switch (task.priority) {
      case 'high':
        score += 100;
        break;
      case 'medium':
        score += 50;
        break;
      case 'low':
        score += 25;
        break;
    }

    // Deadline factor
    if (deadline) {
      const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntilDeadline <= 24) {
        score += 100;
      } else if (hoursUntilDeadline <= 72) {
        score += 50;
      } else if (hoursUntilDeadline <= 168) {
        score += 25;
      }
    }

    // Dependencies factor
    if (task.dependencies?.length) {
      score += 25;
    }

    // Duration factor (prefer shorter tasks when score is similar)
    if (task.estimatedDuration) {
      score += (1 / task.estimatedDuration) * 10;
    }

    return score;
  }

  async scheduleTask(
    userId: string,
    task: Task,
    preferredDate?: Date
  ): Promise<TimeBlock | null> {
    try {
      const date = preferredDate || new Date();
      const availableSlots = await this.getUserAvailability(userId, date);

      if (!availableSlots.length) {
        throw new Error('No available time slots found');
      }

      // Find best slot based on task duration and priority
      const taskDuration = task.estimatedDuration || 30; // Default 30 minutes
      const suitableSlots = availableSlots.filter(
        slot =>
          (slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60) >=
          taskDuration
      );

      if (!suitableSlots.length) {
        throw new Error('No suitable time slots found for task duration');
      }

      // Choose the earliest suitable slot
      const selectedSlot = suitableSlots[0];
      const endTime = new Date(selectedSlot.startTime);
      endTime.setMinutes(endTime.getMinutes() + taskDuration);

      const timeBlock: TimeBlock = {
        taskId: task.id,
        userId,
        startTime: selectedSlot.startTime,
        endTime,
        status: 'scheduled'
      };

      // Save time block to database
      const { error } = await supabase
        .from('time_blocks')
        .insert([timeBlock]);

      if (error) throw error;

      return timeBlock;
    } catch (error) {
      console.error('Error scheduling task:', error);
      return null;
    }
  }

  async rescheduleTask(
    userId: string,
    taskId: string,
    newDate: Date
  ): Promise<TimeBlock | null> {
    try {
      // Get task details
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;

      // Delete existing time block
      await supabase
        .from('time_blocks')
        .delete()
        .eq('task_id', taskId);

      // Schedule new time block
      return await this.scheduleTask(userId, task, newDate);
    } catch (error) {
      console.error('Error rescheduling task:', error);
      return null;
    }
  }
}
