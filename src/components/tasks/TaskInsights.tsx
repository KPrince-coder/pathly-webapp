'use client';

import { useMemo } from 'react';
import { useTask } from '@/contexts/TaskContext';
import { Task } from '@/types/task';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import { motion, AnimatePresence } from 'framer-motion';
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
  isAfter,
  isBefore,
  isPast,
  addDays
} from 'date-fns';
import { cn } from '@/lib/utils';

interface InsightType {
  type: 'warning' | 'suggestion' | 'achievement';
  title: string;
  description: string;
  priority: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function TaskInsights() {
  const { state, actions } = useTask();
  const { tasks, settings } = state;

  const insights = useMemo(() => {
    const insightsList: InsightType[] = [];

    // Analyze overdue tasks
    const overdueTasks = tasks.filter(
      task => task.deadline && isPast(new Date(task.deadline)) && task.status !== 'completed'
    );
    if (overdueTasks.length > 0) {
      insightsList.push({
        type: 'warning',
        title: 'Overdue Tasks',
        description: `You have ${overdueTasks.length} overdue task${
          overdueTasks.length === 1 ? '' : 's'
        }. Consider rescheduling or prioritizing them.`,
        priority: 1,
        action: {
          label: 'View Overdue Tasks',
          onClick: () => actions.setFilters({ status: ['todo', 'in-progress'], overdue: true })
        }
      });
    }

    // Analyze task completion patterns
    const completedTasks = tasks.filter(task => task.status === 'completed' && task.completedAt);
    if (completedTasks.length >= 5) {
      const avgCompletionTime = completedTasks.reduce((acc, task) => {
        const start = new Date(task.createdAt);
        const end = new Date(task.completedAt!);
        return acc + differenceInHours(end, start);
      }, 0) / completedTasks.length;

      const optimalTasks = completedTasks.filter(task => {
        const duration = differenceInHours(
          new Date(task.completedAt!),
          new Date(task.createdAt)
        );
        return duration <= avgCompletionTime;
      });

      const productiveTimeSlots = optimalTasks.reduce((acc, task) => {
        if (task.timeBlock) {
          const hour = new Date(task.timeBlock.startTime).getHours();
          acc[hour] = (acc[hour] || 0) + 1;
        }
        return acc;
      }, {} as Record<number, number>);

      const mostProductiveHour = Object.entries(productiveTimeSlots).reduce(
        (a, b) => (b[1] > a[1] ? b : a),
        ['0', 0]
      );

      insightsList.push({
        type: 'suggestion',
        title: 'Optimal Work Time',
        description: `You're most productive around ${format(
          new Date().setHours(parseInt(mostProductiveHour[0])),
          'ha'
        )}. Consider scheduling important tasks during this time.`,
        priority: 2,
        action: {
          label: 'Optimize Schedule',
          onClick: () => actions.optimizeSchedule({ preferredHour: parseInt(mostProductiveHour[0]) })
        }
      });
    }

    // Analyze workload distribution
    const upcomingTasks = tasks.filter(
      task =>
        task.status !== 'completed' &&
        task.deadline &&
        isAfter(new Date(task.deadline), new Date()) &&
        isBefore(new Date(task.deadline), addDays(new Date(), 7))
    );

    const workloadByDay = upcomingTasks.reduce((acc, task) => {
      const day = format(new Date(task.deadline!), 'yyyy-MM-dd');
      acc[day] = (acc[day] || 0) + (task.estimatedDuration || 60);
      return acc;
    }, {} as Record<string, number>);

    const overloadedDays = Object.entries(workloadByDay).filter(
      ([_, duration]) => duration > settings.workingHours.maxDailyHours * 60
    );

    if (overloadedDays.length > 0) {
      insightsList.push({
        type: 'warning',
        title: 'High Workload Days',
        description: `You have ${overloadedDays.length} day${
          overloadedDays.length === 1 ? '' : 's'
        } with tasks exceeding your preferred working hours.`,
        priority: 1,
        action: {
          label: 'Balance Workload',
          onClick: () => actions.balanceWorkload()
        }
      });
    }

    // Analyze task dependencies
    const blockedTasks = tasks.filter(
      task =>
        task.status !== 'completed' &&
        task.dependencies?.some(depId => {
          const depTask = tasks.find(t => t.id === depId);
          return depTask && depTask.status !== 'completed';
        })
    );

    if (blockedTasks.length > 0) {
      insightsList.push({
        type: 'warning',
        title: 'Blocked Tasks',
        description: `${blockedTasks.length} task${
          blockedTasks.length === 1 ? ' is' : 's are'
        } waiting on dependencies. Focus on completing prerequisite tasks.`,
        priority: 2
      });
    }

    // Analyze achievements
    const recentCompletions = tasks.filter(
      task =>
        task.status === 'completed' &&
        task.completedAt &&
        differenceInDays(new Date(), new Date(task.completedAt)) <= 7
    );

    if (recentCompletions.length >= 5) {
      insightsList.push({
        type: 'achievement',
        title: 'Productive Week',
        description: `Great job! You've completed ${recentCompletions.length} tasks in the past week.`,
        priority: 3
      });
    }

    // Analyze focus time
    const focusTimeStats = tasks.reduce(
      (acc, task) => {
        if (task.focusTime) {
          acc.total += task.focusTime.totalMinutes;
          acc.sessions += task.focusTime.sessions;
        }
        return acc;
      },
      { total: 0, sessions: 0 }
    );

    if (focusTimeStats.sessions > 0) {
      const avgFocusTime = Math.round(focusTimeStats.total / focusTimeStats.sessions);
      if (avgFocusTime < 25) {
        insightsList.push({
          type: 'suggestion',
          title: 'Focus Time',
          description: 'Consider using the Pomodoro technique to improve focus and productivity.',
          priority: 2,
          action: {
            label: 'Start Pomodoro',
            onClick: () => actions.startPomodoro()
          }
        });
      }
    }

    return insightsList.sort((a, b) => a.priority - b.priority);
  }, [tasks, settings, actions]);

  const renderInsight = (insight: InsightType) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Alert
        className={cn(
          'mb-4',
          insight.type === 'warning' && 'border-red-500/50 bg-red-500/10',
          insight.type === 'suggestion' && 'border-blue-500/50 bg-blue-500/10',
          insight.type === 'achievement' && 'border-green-500/50 bg-green-500/10'
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <AlertTitle className="mb-2">{insight.title}</AlertTitle>
            <AlertDescription>{insight.description}</AlertDescription>
          </div>
          {insight.action && (
            <Button
              variant="outline"
              size="sm"
              onClick={insight.action.onClick}
              className="ml-4 shrink-0"
            >
              {insight.action.label}
            </Button>
          )}
        </div>
      </Alert>
    </motion.div>
  );

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Task Insights</h2>
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Warnings
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Issues that need immediate attention</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Suggestions
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Recommendations for improvement</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Achievements
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Recent accomplishments</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <AnimatePresence>
          {insights.length > 0 ? (
            insights.map((insight, index) => (
              <div key={`${insight.type}-${index}`}>{renderInsight(insight)}</div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-muted-foreground py-8"
            >
              No insights available at the moment.
              <br />
              Keep using the app to receive personalized recommendations!
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </Card>
  );
}
