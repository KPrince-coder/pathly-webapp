'use client';

import { useState, useMemo } from 'react';
import { useTask } from '@/contexts/TaskContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Clock,
  Calendar,
  Tag,
  Users,
  Settings,
  Zap,
  RefreshCw,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Task } from '@/types/task';
import {
  addDays,
  addWeeks,
  addMonths,
  format,
  parseISO,
  isAfter,
  isBefore,
  isSameDay
} from 'date-fns';

interface Automation {
  id: string;
  name: string;
  trigger: {
    type: 'schedule' | 'condition' | 'webhook';
    config: any;
  };
  actions: {
    type: 'create' | 'update' | 'delete' | 'notify';
    config: any;
  }[];
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  stats: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
  };
}

export function TaskAutomation() {
  const { state, actions } = useTask();
  const { tasks, settings } = state;
  const [automations, setAutomations] = useState<Automation[]>([
    {
      id: '1',
      name: 'Daily Task Cleanup',
      trigger: {
        type: 'schedule',
        config: {
          frequency: 'daily',
          time: '00:00'
        }
      },
      actions: [
        {
          type: 'update',
          config: {
            condition: 'overdue',
            update: {
              status: 'archived'
            }
          }
        }
      ],
      enabled: true,
      lastRun: new Date(),
      nextRun: addDays(new Date(), 1),
      stats: {
        totalRuns: 45,
        successfulRuns: 43,
        failedRuns: 2
      }
    },
    {
      id: '2',
      name: 'Weekly Task Generation',
      trigger: {
        type: 'schedule',
        config: {
          frequency: 'weekly',
          day: 'monday',
          time: '09:00'
        }
      },
      actions: [
        {
          type: 'create',
          config: {
            tasks: [
              {
                title: 'Weekly Planning',
                priority: 'high',
                estimatedDuration: 60
              },
              {
                title: 'Team Sync',
                priority: 'medium',
                estimatedDuration: 30
              }
            ]
          }
        }
      ],
      enabled: true,
      lastRun: addDays(new Date(), -7),
      nextRun: addDays(new Date(), 7),
      stats: {
        totalRuns: 12,
        successfulRuns: 12,
        failedRuns: 0
      }
    }
  ]);

  const automationStats = useMemo(() => {
    return {
      total: automations.length,
      active: automations.filter(a => a.enabled).length,
      runsToday: automations.filter(a =>
        a.lastRun && isSameDay(a.lastRun, new Date())
      ).length,
      successRate: Math.round(
        (automations.reduce((acc, a) => acc + a.stats.successfulRuns, 0) /
          automations.reduce((acc, a) => acc + a.stats.totalRuns, 0)) *
          100
      )
    };
  }, [automations]);

  const toggleAutomation = (id: string) => {
    setAutomations(prev =>
      prev.map(automation =>
        automation.id === id
          ? { ...automation, enabled: !automation.enabled }
          : automation
      )
    );
  };

  const runAutomation = async (automation: Automation) => {
    try {
      switch (automation.trigger.type) {
        case 'schedule':
          for (const action of automation.actions) {
            switch (action.type) {
              case 'create':
                for (const taskConfig of action.config.tasks) {
                  await actions.createTask({
                    ...taskConfig,
                    status: 'todo',
                    createdAt: new Date()
                  });
                }
                break;
              case 'update':
                const tasksToUpdate = tasks.filter(task => {
                  if (action.config.condition === 'overdue') {
                    return (
                      task.deadline &&
                      isBefore(new Date(task.deadline), new Date()) &&
                      task.status !== 'completed'
                    );
                  }
                  return false;
                });

                for (const task of tasksToUpdate) {
                  await actions.updateTask({
                    ...task,
                    ...action.config.update
                  });
                }
                break;
            }
          }
          break;
      }

      setAutomations(prev =>
        prev.map(a =>
          a.id === automation.id
            ? {
                ...a,
                lastRun: new Date(),
                stats: {
                  ...a.stats,
                  totalRuns: a.stats.totalRuns + 1,
                  successfulRuns: a.stats.successfulRuns + 1
                }
              }
            : a
        )
    );
    } catch (error) {
      console.error('Automation error:', error);
      setAutomations(prev =>
        prev.map(a =>
          a.id === automation.id
            ? {
                ...a,
                stats: {
                  ...a.stats,
                  totalRuns: a.stats.totalRuns + 1,
                  failedRuns: a.stats.failedRuns + 1
                }
              }
            : a
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Total Automations
          </h3>
          <p className="text-2xl font-bold mt-2">{automationStats.total}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Active Automations
          </h3>
          <p className="text-2xl font-bold mt-2">{automationStats.active}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Runs Today
          </h3>
          <p className="text-2xl font-bold mt-2">{automationStats.runsToday}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Success Rate
          </h3>
          <p className="text-2xl font-bold mt-2">{automationStats.successRate}%</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Active Automations</h2>
          <Button variant="outline" size="sm">
            <Zap className="w-4 h-4 mr-2" />
            New Automation
          </Button>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {automations.map(automation => (
              <div
                key={automation.id}
                className={cn(
                  'p-4 rounded-lg border',
                  automation.enabled
                    ? 'bg-primary/10 border-primary/50'
                    : 'bg-secondary/50'
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{automation.name}</h3>
                      <Badge
                        variant="outline"
                        className={automation.enabled ? 'text-green-500' : ''}
                      >
                        {automation.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {automation.trigger.type === 'schedule' &&
                            `${automation.trigger.config.frequency} at ${automation.trigger.config.time}`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Next run: {format(automation.nextRun!, 'MMM d, h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={automation.enabled}
                      onCheckedChange={() => toggleAutomation(automation.id)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runAutomation(automation)}
                      disabled={!automation.enabled}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <RefreshCw className="w-4 h-4" />
                    <span>{automation.stats.totalRuns} runs</span>
                  </div>
                  <div className="flex items-center space-x-1 text-green-500">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{automation.stats.successfulRuns} successful</span>
                  </div>
                  <div className="flex items-center space-x-1 text-red-500">
                    <XCircle className="w-4 h-4" />
                    <span>{automation.stats.failedRuns} failed</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {automation.actions.map((action, index) => (
                    <div
                      key={index}
                      className="text-sm bg-secondary/30 p-2 rounded"
                    >
                      <span className="font-medium">
                        {action.type.charAt(0).toUpperCase() + action.type.slice(1)}:
                      </span>{' '}
                      {action.type === 'create' &&
                        `Create ${action.config.tasks.length} tasks`}
                      {action.type === 'update' &&
                        `Update tasks matching "${action.config.condition}"`}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
