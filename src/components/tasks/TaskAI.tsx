'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTask } from '@/contexts/TaskContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Badge } from '@/components/ui/Badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Sparkles,
  MessageSquare,
  Clock,
  Calendar,
  Tag,
  Users,
  BarChart
} from 'lucide-react';
import { Task } from '@/types/task';
import { differenceInMinutes, format, addDays } from 'date-fns';

interface AIInsight {
  type: 'optimization' | 'prediction' | 'suggestion' | 'analysis';
  title: string;
  description: string;
  confidence: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface AIRecommendation {
  task: Partial<Task>;
  reason: string;
  confidence: number;
}

export function TaskAI() {
  const { state, actions } = useTask();
  const { tasks, settings, stats } = state;
  const [aiQuery, setAiQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const aiAnalysis = useMemo(() => {
    // Task optimization suggestions
    const optimizeSchedule = () => {
      const tasksByPriority = tasks.reduce((acc, task) => {
        if (task.status !== 'completed') {
          acc[task.priority || 'low'].push(task);
        }
        return acc;
      }, { high: [], medium: [], low: [] } as Record<string, Task[]>);

      const suggestions: AIInsight[] = [];

      // Check for task conflicts
      const timeBlocks = tasks
        .filter(t => t.timeBlock)
        .sort((a, b) => 
          new Date(a.timeBlock!.startTime).getTime() - 
          new Date(b.timeBlock!.startTime).getTime()
        );

      for (let i = 0; i < timeBlocks.length - 1; i++) {
        const current = timeBlocks[i];
        const next = timeBlocks[i + 1];
        
        if (
          new Date(current.timeBlock!.endTime) >
          new Date(next.timeBlock!.startTime)
        ) {
          suggestions.push({
            type: 'optimization',
            title: 'Schedule Conflict Detected',
            description: `Tasks "${current.title}" and "${next.title}" have overlapping time blocks.`,
            confidence: 0.95,
            action: {
              label: 'Resolve Conflict',
              onClick: () => actions.resolveScheduleConflict(current.id, next.id)
            }
          });
        }
      }

      // Suggest task regrouping
      const similarTasks = tasks
        .filter(t => t.status !== 'completed' && t.tags?.length)
        .reduce((acc, task) => {
          task.tags?.forEach(tag => {
            if (!acc[tag]) acc[tag] = [];
            acc[tag].push(task);
          });
          return acc;
        }, {} as Record<string, Task[]>);

      Object.entries(similarTasks)
        .filter(([, tasks]) => tasks.length > 2)
        .forEach(([tag, tasks]) => {
          suggestions.push({
            type: 'suggestion',
            title: 'Task Grouping Opportunity',
            description: `Consider grouping ${tasks.length} tasks with tag "${tag}" for better efficiency.`,
            confidence: 0.85,
            action: {
              label: 'Group Tasks',
              onClick: () => actions.groupTasks(tasks.map(t => t.id))
            }
          });
        });

      return suggestions;
    };

    // Predict task completion times
    const predictCompletionTimes = () => {
      const predictions: AIInsight[] = [];
      const incompleteTasks = tasks.filter(t => t.status !== 'completed');

      incompleteTasks.forEach(task => {
        const similarCompletedTasks = tasks.filter(t =>
          t.status === 'completed' &&
          t.completedAt &&
          t.priority === task.priority &&
          Math.abs((t.estimatedDuration || 60) - (task.estimatedDuration || 60)) < 30
        );

        if (similarCompletedTasks.length > 0) {
          const avgCompletionTime = similarCompletedTasks.reduce((acc, t) =>
            acc + differenceInMinutes(
              new Date(t.completedAt!),
              new Date(t.timeBlock?.startTime || t.createdAt)
            ), 0) / similarCompletedTasks.length;

          const predictedDuration = Math.round(avgCompletionTime);
          const confidence = Math.min(similarCompletedTasks.length / 10, 0.95);

          predictions.push({
            type: 'prediction',
            title: `Completion Time Prediction: ${task.title}`,
            description: `Based on similar tasks, this will likely take ${predictedDuration} minutes to complete.`,
            confidence,
            action: {
              label: 'Update Estimate',
              onClick: () => actions.updateTaskDuration(task.id, predictedDuration)
            }
          });
        }
      });

      return predictions;
    };

    // Generate task recommendations
    const generateRecommendations = (): AIRecommendation[] => {
      const recommendations: AIRecommendation[] = [];
      const taskPatterns = tasks
        .filter(t => t.status === 'completed' && t.completedAt)
        .reduce((acc, task) => {
          const hour = new Date(task.completedAt!).getHours();
          if (!acc[hour]) acc[hour] = [];
          acc[hour].push(task);
          return acc;
        }, {} as Record<number, Task[]>);

      // Find most productive hours
      const productiveHours = Object.entries(taskPatterns)
        .map(([hour, tasks]) => ({
          hour: parseInt(hour),
          count: tasks.length,
          efficiency: tasks.reduce((acc, t) =>
            acc + (t.estimatedDuration || 60) / differenceInMinutes(
              new Date(t.completedAt!),
              new Date(t.timeBlock?.startTime || t.createdAt)
            ), 0) / tasks.length
        }))
        .sort((a, b) => b.efficiency - a.efficiency);

      if (productiveHours.length > 0) {
        const bestHour = productiveHours[0];
        recommendations.push({
          task: {
            title: 'High-Priority Task Block',
            description: 'Schedule important tasks during your most productive hour',
            priority: 'high',
            timeBlock: {
              startTime: new Date().setHours(bestHour.hour, 0, 0, 0),
              endTime: new Date().setHours(bestHour.hour + 1, 0, 0, 0)
            }
          },
          reason: `You're most productive at ${format(new Date().setHours(bestHour.hour), 'ha')} with ${Math.round(bestHour.efficiency * 100)}% efficiency`,
          confidence: 0.9
        });
      }

      // Suggest breaks based on work patterns
      const workStreaks = tasks
        .filter(t => t.status === 'completed' && t.completedAt)
        .reduce((acc, task) => {
          const date = format(new Date(task.completedAt!), 'yyyy-MM-dd');
          if (!acc[date]) acc[date] = [];
          acc[date].push(task);
          return acc;
        }, {} as Record<string, Task[]>);

      const avgTasksPerDay = Object.values(workStreaks)
        .reduce((acc, tasks) => acc + tasks.length, 0) / Object.keys(workStreaks).length;

      if (avgTasksPerDay > 8) {
        recommendations.push({
          task: {
            title: 'Schedule Break',
            description: 'Take regular breaks to maintain productivity',
            priority: 'medium',
            recurring: true,
            timeBlock: {
              startTime: new Date().setHours(12, 0, 0, 0),
              endTime: new Date().setHours(12, 30, 0, 0)
            }
          },
          reason: 'You\'re handling a high workload. Regular breaks can improve focus and prevent burnout.',
          confidence: 0.85
        });
      }

      return recommendations;
    };

    return {
      insights: [...optimizeSchedule(), ...predictCompletionTimes()],
      recommendations: generateRecommendations()
    };
  }, [tasks, settings, stats]);

  const handleAIQuery = async () => {
    setIsProcessing(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessing(false);
    setAiQuery('');
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-center space-x-4 mb-4">
          <Brain className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-medium">AI Assistant</h2>
        </div>
        <div className="flex space-x-2">
          <Input
            value={aiQuery}
            onChange={e => setAiQuery(e.target.value)}
            placeholder="Ask anything about your tasks..."
            className="flex-1"
          />
          <Button
            onClick={handleAIQuery}
            disabled={!aiQuery || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Ask AI'}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">AI Insights</h3>
          <ScrollArea className="h-[400px]">
            <AnimatePresence>
              {aiAnalysis.insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-4"
                >
                  <div className="p-4 rounded-lg border bg-secondary/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {insight.type === 'optimization' && (
                            <Sparkles className="w-5 h-5 text-yellow-500" />
                          )}
                          {insight.type === 'prediction' && (
                            <Brain className="w-5 h-5 text-purple-500" />
                          )}
                          {insight.type === 'suggestion' && (
                            <MessageSquare className="w-5 h-5 text-blue-500" />
                          )}
                          {insight.type === 'analysis' && (
                            <BarChart className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{insight.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline">
                            {Math.round(insight.confidence * 100)}%
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          Confidence score
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {insight.action && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={insight.action.onClick}
                        className="mt-3"
                      >
                        {insight.action.label}
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </ScrollArea>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Smart Recommendations</h3>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {aiAnalysis.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border bg-primary/10"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">
                        {recommendation.task.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {recommendation.task.description}
                      </p>
                      <div className="flex items-center space-x-3 mt-2">
                        {recommendation.task.priority && (
                          <div className="flex items-center space-x-1">
                            <Tag className="w-4 h-4" />
                            <span className="text-xs capitalize">
                              {recommendation.task.priority}
                            </span>
                          </div>
                        )}
                        {recommendation.task.timeBlock && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs">
                              {format(new Date(recommendation.task.timeBlock.startTime), 'h:mm a')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline">
                          {Math.round(recommendation.confidence * 100)}%
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        Confidence score
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    {recommendation.reason}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => actions.createTask(recommendation.task)}
                    className="mt-3"
                  >
                    Add Task
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
