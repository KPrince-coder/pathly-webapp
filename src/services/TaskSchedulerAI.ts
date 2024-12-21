import { Task, TimeBlock } from '@/types/task';
import { addMinutes, isSameDay, parse, format } from 'date-fns';

interface ProductivityPattern {
  hour: number;
  productivity: number; // 0-1 score
  taskTypes: {
    [key: string]: number; // task type to success rate mapping
  };
}

interface TaskCompletion {
  taskId: string;
  estimatedDuration: number;
  actualDuration: number;
  startTime: Date;
  endTime: Date;
  taskType: string;
  success: boolean;
}

export class TaskSchedulerAI {
  private productivityPatterns: ProductivityPattern[] = [];
  private taskCompletionHistory: TaskCompletion[] = [];

  private async loadProductivityPatterns(userId: string): Promise<void> {
    // TODO: Load from database
    // For now, using mock data
    this.productivityPatterns = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      productivity: Math.sin((hour - 6) * Math.PI / 12) * 0.5 + 0.5, // Peak at 12 PM
      taskTypes: {
        coding: hour >= 9 && hour <= 17 ? 0.8 : 0.4,
        meeting: hour >= 10 && hour <= 16 ? 0.9 : 0.3,
        planning: hour >= 8 && hour <= 11 ? 0.9 : 0.5,
        design: hour >= 13 && hour <= 18 ? 0.85 : 0.6
      }
    }));
  }

  private async loadTaskCompletionHistory(userId: string): Promise<void> {
    // TODO: Load from database
    // For now, using mock data
    this.taskCompletionHistory = [];
  }

  private calculateTaskTypeSuccessRate(
    taskType: string,
    hour: number,
    duration: number
  ): number {
    const pattern = this.productivityPatterns[hour];
    if (!pattern) return 0.5;

    const baseRate = pattern.taskTypes[taskType] || 0.5;
    const productivityFactor = pattern.productivity;

    // Adjust for task duration
    const durationFactor = Math.exp(-duration / 120); // Longer tasks have lower success rates

    return baseRate * productivityFactor * durationFactor;
  }

  private analyzeTaskPatterns(task: Task): {
    optimalHour: number;
    expectedDuration: number;
    confidence: number;
  } {
    const taskType = task.category || 'default';
    const similarTasks = this.taskCompletionHistory.filter(
      t => t.taskType === taskType
    );

    // Find optimal hour
    let bestHour = 9; // Default to 9 AM
    let maxScore = 0;
    
    for (let hour = 0; hour < 24; hour++) {
      const score = this.calculateTaskTypeSuccessRate(
        taskType,
        hour,
        task.estimatedDuration
      );
      
      if (score > maxScore) {
        maxScore = score;
        bestHour = hour;
      }
    }

    // Calculate expected duration based on history
    const durationRatios = similarTasks.map(
      t => t.actualDuration / t.estimatedDuration
    );
    const avgDurationRatio = durationRatios.length
      ? durationRatios.reduce((a, b) => a + b) / durationRatios.length
      : 1;
    
    const expectedDuration = task.estimatedDuration * avgDurationRatio;

    // Calculate confidence based on amount of historical data
    const confidence = Math.min(similarTasks.length / 10, 1); // Max confidence at 10 similar tasks

    return {
      optimalHour: bestHour,
      expectedDuration,
      confidence
    };
  }

  public async suggestTimeBlock(task: Task): Promise<{
    suggestedBlock: TimeBlock;
    explanation: string;
    confidence: number;
  }> {
    await this.loadProductivityPatterns(task.createdBy);
    await this.loadTaskCompletionHistory(task.createdBy);

    const { optimalHour, expectedDuration, confidence } = this.analyzeTaskPatterns(task);

    const suggestedDate = new Date();
    suggestedDate.setHours(optimalHour, 0, 0, 0);

    // If the suggested time is in the past, move to next day
    if (suggestedDate < new Date()) {
      suggestedDate.setDate(suggestedDate.getDate() + 1);
    }

    const endTime = addMinutes(suggestedDate, expectedDuration);

    const suggestedBlock: TimeBlock = {
      id: crypto.randomUUID(),
      startTime: suggestedDate,
      endTime,
      taskId: task.id,
      userId: task.createdBy,
      isFocusTime: task.priority === 'high'
    };

    const timeFormat = 'h:mm a';
    const explanation = `
      Based on your productivity patterns, you're most effective at ${format(suggestedDate, timeFormat)} 
      for ${task.category || 'this type of'} tasks.
      ${confidence > 0.7 ? 'This suggestion is based on strong historical data.' : 
        'This is an initial suggestion that will improve as you complete more tasks.'}
      ${expectedDuration > task.estimatedDuration ? 
        `Note: Similar tasks typically take ${Math.round((expectedDuration - task.estimatedDuration) / 60)} hours longer than estimated.` :
        ''}
    `.trim();

    return {
      suggestedBlock,
      explanation,
      confidence
    };
  }

  public async recordTaskCompletion(
    task: Task,
    actualStartTime: Date,
    actualEndTime: Date,
    success: boolean
  ): Promise<void> {
    const completion: TaskCompletion = {
      taskId: task.id,
      estimatedDuration: task.estimatedDuration,
      actualDuration: (actualEndTime.getTime() - actualStartTime.getTime()) / (1000 * 60),
      startTime: actualStartTime,
      endTime: actualEndTime,
      taskType: task.category || 'default',
      success
    };

    this.taskCompletionHistory.push(completion);
    // TODO: Save to database
  }
}
