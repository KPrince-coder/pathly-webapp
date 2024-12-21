'use client';

import { useMemo } from 'react';
import { useTask } from '@/contexts/TaskContext';
import { Task } from '@/types/task';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip';
import { Badge } from '@/components/ui/Badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  differenceInDays,
  differenceInHours,
  format,
  startOfWeek,
  endOfWeek
} from 'date-fns';

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  tasks: Task[];
}

interface TeamInsight {
  type: 'success' | 'warning' | 'info';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function TaskCollaboration() {
  const { state, actions } = useTask();
  const { tasks, team } = state;

  const teamAnalytics = useMemo(() => {
    // Calculate team workload distribution
    const workloadByMember = team.reduce((acc, member) => {
      const memberTasks = tasks.filter(task => task.assignedTo === member.id);
      const totalHours = memberTasks.reduce((sum, task) => 
        sum + (task.estimatedDuration || 0) / 60, 0);
      
      return {
        ...acc,
        [member.id]: {
          ...member,
          tasks: memberTasks,
          workload: totalHours,
          completion: memberTasks.filter(t => t.status === 'completed').length / 
            (memberTasks.length || 1) * 100
        }
      };
    }, {} as Record<string, TeamMember & { workload: number; completion: number }>);

    // Identify potential bottlenecks
    const bottlenecks = Object.values(workloadByMember)
      .filter(member => member.workload > 40) // More than 40 hours of work
      .map(member => ({
        member,
        overloadedTasks: member.tasks.filter(task => {
          const deadline = new Date(task.deadline || '');
          return task.status !== 'completed' && 
            differenceInDays(deadline, new Date()) < 3;
        })
      }));

    // Calculate team velocity
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    const weeklyCompletion = Object.values(workloadByMember).map(member => ({
      name: member.name,
      completed: member.tasks.filter(task => 
        task.status === 'completed' &&
        task.completedAt &&
        new Date(task.completedAt) >= weekStart &&
        new Date(task.completedAt) <= weekEnd
      ).length
    }));

    // Generate team insights
    const insights: TeamInsight[] = [];

    // Workload balance insight
    const workloads = Object.values(workloadByMember).map(m => m.workload);
    const avgWorkload = workloads.reduce((a, b) => a + b, 0) / workloads.length;
    const maxWorkload = Math.max(...workloads);
    if (maxWorkload > avgWorkload * 1.5) {
      insights.push({
        type: 'warning',
        message: 'Significant workload imbalance detected',
        action: {
          label: 'Redistribute Tasks',
          onClick: () => actions.redistributeTasks()
        }
      });
    }

    // Collaboration opportunities
    const similarTasks = tasks.reduce((acc, task) => {
      const similar = tasks.filter(t => 
        t.id !== task.id &&
        t.tags?.some(tag => task.tags?.includes(tag))
      );
      if (similar.length > 0) {
        acc.push({
          task,
          similar
        });
      }
      return acc;
    }, [] as { task: Task; similar: Task[] }[]);

    if (similarTasks.length > 0) {
      insights.push({
        type: 'info',
        message: 'Found potential collaboration opportunities',
        action: {
          label: 'View Similar Tasks',
          onClick: () => actions.showSimilarTasks(similarTasks)
        }
      });
    }

    // Success patterns
    const successfulMembers = Object.values(workloadByMember)
      .filter(member => member.completion > 90)
      .map(member => member.name)
      .join(', ');

    if (successfulMembers) {
      insights.push({
        type: 'success',
        message: `High performers this week: ${successfulMembers}`,
      });
    }

    return {
      memberStats: workloadByMember,
      bottlenecks,
      weeklyCompletion,
      insights
    };
  }, [tasks, team]);

  const renderInsightBadge = (type: TeamInsight['type']) => {
    switch (type) {
      case 'success':
        return <Badge className="bg-green-500">Success</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">Warning</Badge>;
      case 'info':
        return <Badge className="bg-blue-500">Info</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h2 className="text-lg font-medium mb-4">Team Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4">
              Weekly Task Completion
            </h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamAnalytics.weeklyCompletion}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="completed" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4">
              Workload Distribution
            </h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.values(teamAnalytics.memberStats).map(member => ({
                      name: member.name,
                      value: member.workload
                    }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {Object.values(teamAnalytics.memberStats).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Team Insights</h3>
          <ScrollArea className="h-[300px]">
            <AnimatePresence>
              {teamAnalytics.insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-4"
                >
                  <div className="flex items-start space-x-4">
                    <div className="mt-1">
                      {renderInsightBadge(insight.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{insight.message}</p>
                      {insight.action && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={insight.action.onClick}
                          className="mt-2"
                        >
                          {insight.action.label}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </ScrollArea>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Team Members</h3>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {Object.values(teamAnalytics.memberStats).map(member => (
                <div
                  key={member.id}
                  className="flex items-center space-x-4"
                >
                  <Avatar>
                    {member.avatar ? (
                      <AvatarImage src={member.avatar} alt={member.name} />
                    ) : (
                      <AvatarFallback>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge
                            variant="outline"
                            className={cn(
                              member.workload > 40
                                ? 'border-red-500 text-red-500'
                                : member.workload > 30
                                ? 'border-yellow-500 text-yellow-500'
                                : 'border-green-500 text-green-500'
                            )}
                          >
                            {Math.round(member.workload)}h
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          Weekly workload
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>{member.role}</span>
                      <span className="mx-2">•</span>
                      <span>{Math.round(member.completion)}% completion</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {teamAnalytics.bottlenecks.length > 0 && (
        <Card className="p-4 border-yellow-500/50 bg-yellow-500/10">
          <h3 className="text-lg font-medium mb-4">Attention Needed</h3>
          <div className="space-y-4">
            {teamAnalytics.bottlenecks.map(({ member, overloadedTasks }) => (
              <div key={member.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar>
                      {member.avatar ? (
                        <AvatarImage src={member.avatar} alt={member.name} />
                      ) : (
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="font-medium">{member.name}</span>
                  </div>
                  <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                    {overloadedTasks.length} urgent tasks
                  </Badge>
                </div>
                <div className="ml-10 space-y-1">
                  {overloadedTasks.map(task => (
                    <div
                      key={task.id}
                      className="text-sm text-muted-foreground flex items-center justify-between"
                    >
                      <span>{task.title}</span>
                      <span>
                        Due {format(new Date(task.deadline!), 'MMM d')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
