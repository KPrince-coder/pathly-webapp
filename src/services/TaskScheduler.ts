import { Task, TimeBlock, TaskPriority } from '@/types/task';

interface AvailabilitySlot {
  startTime: Date;
  endTime: Date;
}

export class TaskScheduler {
  private getUserAvailability(userId: string, date: Date): AvailabilitySlot[] {
    // TODO: Fetch user's availability from database
    return [];
  }

  private calculateTaskPriorityScore(task: Task): number {
    const now = new Date();
    const deadline = task.deadline ? new Date(task.deadline) : null;
    let score = 0;

    // Priority score
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

    // Deadline score
    if (deadline) {
      const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      score += Math.max(0, 100 - daysUntilDeadline * 2); // Higher score for closer deadlines
    }

    // Dependencies score
    if (task.dependencies && task.dependencies.length > 0) {
      score += 25; // Prioritize tasks with dependencies to unblock other tasks
    }

    return score;
  }

  private findOptimalTimeSlot(
    task: Task,
    availableSlots: AvailabilitySlot[],
    existingTasks: Task[]
  ): TimeBlock | null {
    for (const slot of availableSlots) {
      const slotDuration = (slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60);
      
      if (slotDuration >= task.estimatedDuration) {
        // Check for conflicts with existing tasks
        const hasConflict = existingTasks.some(existingTask => {
          if (!existingTask.timeBlock) return false;
          
          return (
            (slot.startTime >= existingTask.timeBlock.startTime && 
             slot.startTime < existingTask.timeBlock.endTime) ||
            (slot.endTime > existingTask.timeBlock.startTime && 
             slot.endTime <= existingTask.timeBlock.endTime)
          );
        });

        if (!hasConflict) {
          return {
            id: crypto.randomUUID(),
            startTime: slot.startTime,
            endTime: new Date(slot.startTime.getTime() + task.estimatedDuration * 60 * 1000),
            taskId: task.id,
            userId: task.createdBy,
            isFocusTime: task.priority === 'high'
          };
        }
      }
    }

    return null;
  }

  public async scheduleTask(task: Task, existingTasks: Task[]): Promise<TimeBlock | null> {
    if (task.dependencies?.length) {
      const uncompletedDependencies = existingTasks.filter(
        t => task.dependencies?.includes(t.id) && t.status !== 'completed'
      );

      if (uncompletedDependencies.length > 0) {
        throw new Error('Cannot schedule task: dependencies not completed');
      }
    }

    const availability = this.getUserAvailability(task.createdBy, new Date());
    return this.findOptimalTimeSlot(task, availability, existingTasks);
  }

  public async rescheduleTask(task: Task, existingTasks: Task[]): Promise<TimeBlock | null> {
    // Remove the current task from existing tasks to avoid self-conflict
    const otherTasks = existingTasks.filter(t => t.id !== task.id);
    return this.scheduleTask(task, otherTasks);
  }

  public async scheduleBatch(tasks: Task[]): Promise<Map<string, TimeBlock>> {
    const scheduledTasks = new Map<string, TimeBlock>();
    
    // Sort tasks by priority score
    const sortedTasks = [...tasks].sort(
      (a, b) => this.calculateTaskPriorityScore(b) - this.calculateTaskPriorityScore(a)
    );

    for (const task of sortedTasks) {
      const timeBlock = await this.scheduleTask(
        task,
        tasks.filter(t => scheduledTasks.has(t.id))
      );

      if (timeBlock) {
        scheduledTasks.set(task.id, timeBlock);
      }
    }

    return scheduledTasks;
  }
}
