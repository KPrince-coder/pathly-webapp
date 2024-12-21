'use client';

import { useMemo } from 'react';
import { useTask } from '@/contexts/TaskContext';
import { Task } from '@/types/task';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip';
import { Alert } from '@/components/ui/Alert';
import { motion, AnimatePresence } from 'framer-motion';
import {
  differenceInMinutes,
  differenceInHours,
  format,
  isBefore,
  isAfter,
  addHours,
  parseISO
} from 'date-fns';
import { cn } from '@/lib/utils';

interface RecommendationType {
  type: 'next' | 'optimal' | 'blocked' | 'urgent';
  task: Task;
  score: number;
  reason: string;
  suggestedTime?: Date;
}

export function TaskRecommendations() {
  const { state, actions } = useTask();
  const { tasks, settings } = state;

  const recommendations = useMemo(() => {
    const now = new Date();
    const recommendationsList: RecommendationType[] = [];

    // Helper function to calculate task complexity
    const calculateComplexity = (task: Task) => {
      let score = 0;
      if (task.dependencies?.length) score += 2;
      if (task.priority === 'high') score += 3;
      if (task.priority === 'medium') score += 2;
      if (task.estimatedDuration && task.estimatedDuration > 120) score += 2;
      return score;
    };

    // Helper function to calculate optimal time
    const findOptimalTime = (task: Task) => {
      const completedTasks = tasks.filter(t => t.status === 'completed' && t.completedAt);
      const similarTasks = completedTasks.filter(t => 
        t.priority === task.priority &&
        Math.abs((t.estimatedDuration || 60) - (task.estimatedDuration || 60)) < 30
      );

      if (similarTasks.length === 0) return null;

      // Find most successful completion times
      const successfulTimes = similarTasks.map(t => new Date(t.completedAt!).getHours());
      const timeFrequency = successfulTimes.reduce((acc, hour) => {
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const optimalHour = Object.entries(timeFrequency)
        .sort(([, a], [, b]) => b - a)[0][0];

      return new Date().setHours(parseInt(optimalHour), 0, 0, 0);
    };

    // Next Task Recommendations
    const incompleteTasks = tasks.filter(task => task.status !== 'completed');
    incompleteTasks.forEach(task => {
      let score = 0;
      const complexity = calculateComplexity(task);

      // Priority score
      if (task.priority === 'high') score += 5;
      if (task.priority === 'medium') score += 3;

      // Deadline score
      if (task.deadline) {
        const hoursUntilDeadline = differenceInHours(new Date(task.deadline), now);
        if (hoursUntilDeadline < 24) score += 5;
        else if (hoursUntilDeadline < 48) score += 3;
      }

      // Dependencies score
      const hasBlockedDependencies = task.dependencies?.some(depId => {
        const depTask = tasks.find(t => t.id === depId);
        return depTask && depTask.status !== 'completed';
      });
      if (!hasBlockedDependencies) score += 2;

      // Time block score
      if (task.timeBlock) {
        const isInTimeBlock = isAfter(now, new Date(task.timeBlock.startTime)) &&
          isBefore(now, new Date(task.timeBlock.endTime));
        if (isInTimeBlock) score += 4;
      }

      // User preference score
      const optimalTime = findOptimalTime(task);
      if (optimalTime) {
        const hourDiff = Math.abs(differenceInHours(new Date(optimalTime), now));
        if (hourDiff <= 1) score += 3;
      }

      // Add to recommendations based on type
      if (task.deadline && isBefore(new Date(task.deadline), addHours(now, 24))) {
        recommendationsList.push({
          type: 'urgent',
          task,
          score: score + 10,
          reason: 'Deadline approaching within 24 hours',
          suggestedTime: new Date()
        });
      } else if (!hasBlockedDependencies && complexity < 3) {
        recommendationsList.push({
          type: 'next',
          task,
          score: score + 5,
          reason: 'Quick win - can be completed immediately',
          suggestedTime: new Date()
        });
      } else if (optimalTime) {
        recommendationsList.push({
          type: 'optimal',
          task,
          score: score + 3,
          reason: `Best time to work based on your productivity patterns`,
          suggestedTime: new Date(optimalTime)
        });
      } else if (hasBlockedDependencies) {
        recommendationsList.push({
          type: 'blocked',
          task,
          score: score,
          reason: 'Blocked by dependent tasks'
        });
      }
    });

    return recommendationsList.sort((a, b) => b.score - a.score);
  }, [tasks, settings]);

  const handleTaskAction = (recommendation: RecommendationType) => {
    const { task } = recommendation;
    
    switch (recommendation.type) {
      case 'next':
      case 'urgent':
        actions.updateTask({
          ...task,
          status: 'in-progress',
          startedAt: new Date()
        });
        break;
      case 'optimal':
        if (recommendation.suggestedTime) {
          actions.scheduleTask(task.id, recommendation.suggestedTime);
        }
        break;
      case 'blocked':
        const dependencies = task.dependencies?.map(depId =>
          tasks.find(t => t.id === depId)
        ).filter(Boolean) as Task[];
        
        if (dependencies.length > 0) {
          actions.setView({
            selectedTask: dependencies[0].id
          });
        }
        break;
    }
  };

  const getRecommendationStyle = (type: RecommendationType['type']) => {
    switch (type) {
      case 'urgent':
        return 'border-red-500/50 bg-red-500/10';
      case 'next':
        return 'border-green-500/50 bg-green-500/10';
      case 'optimal':
        return 'border-blue-500/50 bg-blue-500/10';
      case 'blocked':
        return 'border-yellow-500/50 bg-yellow-500/10';
      default:
        return '';
    }
  };

  const renderRecommendation = (recommendation: RecommendationType) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-4"
    >
      <Alert className={cn('relative', getRecommendationStyle(recommendation.type))}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className={cn(
                  'uppercase text-xs',
                  recommendation.type === 'urgent' && 'text-red-700',
                  recommendation.type === 'next' && 'text-green-700',
                  recommendation.type === 'optimal' && 'text-blue-700',
                  recommendation.type === 'blocked' && 'text-yellow-700'
                )}
              >
                {recommendation.type}
              </Badge>
              <h4 className="font-medium">{recommendation.task.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
            {recommendation.suggestedTime && (
              <p className="text-sm">
                Suggested time: {format(recommendation.suggestedTime, 'h:mm a')}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTaskAction(recommendation)}
            className="ml-4 shrink-0"
          >
            {recommendation.type === 'next' || recommendation.type === 'urgent'
              ? 'Start Now'
              : recommendation.type === 'optimal'
              ? 'Schedule'
              : 'View Dependencies'}
          </Button>
        </div>
      </Alert>
    </motion.div>
  );

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Recommended Tasks</h2>
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Urgent
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Tasks that need immediate attention</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Next
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Recommended next tasks</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Optimal
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Best time to work on these tasks</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                Blocked
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Tasks waiting on dependencies</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <AnimatePresence>
          {recommendations.length > 0 ? (
            recommendations.map((recommendation, index) => (
              <div key={`${recommendation.task.id}-${index}`}>
                {renderRecommendation(recommendation)}
              </div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-muted-foreground py-8"
            >
              No task recommendations available.
              <br />
              Add more tasks or complete existing ones to get personalized suggestions!
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </Card>
  );
}
