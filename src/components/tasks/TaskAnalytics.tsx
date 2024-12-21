'use client';

import { useMemo } from 'react';
import { useTask } from '@/contexts/TaskContext';
import { Task } from '@/types/task';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Badge } from '@/components/ui/Badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isWithinInterval,
  differenceInMinutes,
  addDays,
  isSameDay
} from 'date-fns';
import { cn } from '@/lib/utils';
import { TaskInsights } from './TaskInsights';
import { TaskRecommendations } from './TaskRecommendations';

interface TaskAnalyticsProps {
  timeRange: 'week' | 'month' | 'year';
}

const COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  muted: 'hsl(var(--muted))',
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  completed: '#10B981',
  inProgress: '#F59E0B',
  todo: '#6B7280',
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#3B82F6'
};

export function TaskAnalytics({ timeRange = 'week' }: TaskAnalyticsProps) {
  const { state } = useTask();
  const { tasks } = state;

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (timeRange) {
      case 'week':
        return {
          start: startOfWeek(now),
          end: endOfWeek(now)
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      default:
        return {
          start: startOfWeek(now),
          end: endOfWeek(now)
        };
    }
  }, [timeRange]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task =>
      isWithinInterval(new Date(task.createdAt), dateRange)
    );
  }, [tasks, dateRange]);

  const tasksByStatus = useMemo(() => {
    const statusCount = {
      todo: 0,
      'in-progress': 0,
      completed: 0
    };

    filteredTasks.forEach(task => {
      statusCount[task.status]++;
    });

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status,
      value: count
    }));
  }, [filteredTasks]);

  const tasksByPriority = useMemo(() => {
    const priorityCount = {
      high: 0,
      medium: 0,
      low: 0
    };

    filteredTasks.forEach(task => {
      if (task.priority) {
        priorityCount[task.priority]++;
      }
    });

    return Object.entries(priorityCount).map(([priority, count]) => ({
      name: priority,
      value: count
    }));
  }, [filteredTasks]);

  const completionTrend = useMemo(() => {
    const days = eachDayOfInterval(dateRange);
    return days.map(day => {
      const dayTasks = filteredTasks.filter(task =>
        isSameDay(new Date(task.completedAt || task.createdAt), day)
      );

      return {
        date: format(day, 'MMM dd'),
        completed: dayTasks.filter(t => t.status === 'completed').length,
        created: dayTasks.length
      };
    });
  }, [filteredTasks, dateRange]);

  const productivityByHour = useMemo(() => {
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      tasks: 0,
      focusTime: 0
    }));

    filteredTasks.forEach(task => {
      if (task.timeBlock) {
        const startHour = new Date(task.timeBlock.startTime).getHours();
        const duration = differenceInMinutes(
          new Date(task.timeBlock.endTime),
          new Date(task.timeBlock.startTime)
        );

        hourlyData[startHour].tasks++;
        hourlyData[startHour].focusTime += duration;
      }
    });

    return hourlyData.map(data => ({
      ...data,
      hour: `${String(data.hour).padStart(2, '0')}:00`,
      focusTime: Math.round(data.focusTime / 60) // Convert to hours
    }));
  }, [filteredTasks]);

  const averageCompletionTime = useMemo(() => {
    const completedTasks = filteredTasks.filter(
      task => task.status === 'completed' && task.completedAt
    );

    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((acc, task) => {
      const start = new Date(task.createdAt);
      const end = new Date(task.completedAt!);
      return acc + differenceInMinutes(end, start);
    }, 0);

    return Math.round(totalTime / completedTasks.length / 60); // Convert to hours
  }, [filteredTasks]);

  const taskTags = useMemo(() => {
    const tagCount: Record<string, number> = {};
    filteredTasks.forEach(task => {
      task.tags?.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredTasks]);

  const taskVelocity = useMemo(() => {
    const days = eachDayOfInterval(dateRange);
    return days.map(day => {
      const dayTasks = filteredTasks.filter(task =>
        isSameDay(new Date(task.completedAt || task.createdAt), day)
      );

      const velocity = dayTasks.reduce((acc, task) => {
        if (task.status === 'completed' && task.completedAt) {
          const duration = differenceInMinutes(
            new Date(task.completedAt),
            new Date(task.createdAt)
          );
          return acc + (task.estimatedDuration ? task.estimatedDuration / duration : 0);
        }
        return acc;
      }, 0);

      return {
        date: format(day, 'MMM dd'),
        velocity: Math.round(velocity * 100) / 100
      };
    });
  }, [filteredTasks, dateRange]);

  const taskEfficiency = useMemo(() => {
    const completedTasks = filteredTasks.filter(
      task => task.status === 'completed' && task.completedAt && task.estimatedDuration
    );

    if (completedTasks.length === 0) return 0;

    const efficiency = completedTasks.reduce((acc, task) => {
      const actualDuration = differenceInMinutes(
        new Date(task.completedAt!),
        new Date(task.createdAt)
      );
      return acc + (task.estimatedDuration / actualDuration);
    }, 0);

    return Math.round((efficiency / completedTasks.length) * 100);
  }, [filteredTasks]);

  const workloadDistribution = useMemo(() => {
    const distribution = filteredTasks.reduce((acc, task) => {
      if (task.timeBlock) {
        const day = format(new Date(task.timeBlock.startTime), 'EEE');
        acc[day] = (acc[day] || 0) + (task.estimatedDuration || 60);
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([day, minutes]) => ({
      day,
      hours: Math.round(minutes / 60 * 10) / 10
    }));
  }, [filteredTasks]);

  const mlInsights = useMemo(() => {
    const predictCompletionLikelihood = (task: Task) => {
      let score = 0;
      
      const similarTasks = tasks.filter(t =>
        t.priority === task.priority &&
        Math.abs((t.estimatedDuration || 60) - (task.estimatedDuration || 60)) < 30 &&
        t.status === 'completed'
      );
      
      if (similarTasks.length > 0) {
        const avgCompletionTime = similarTasks.reduce((acc, t) => {
          if (t.completedAt) {
            return acc + differenceInMinutes(new Date(t.completedAt), new Date(t.createdAt));
          }
          return acc;
        }, 0) / similarTasks.length;
        
        score += avgCompletionTime <= task.estimatedDuration ? 20 : 10;
      }

      if (task.timeBlock) {
        const hour = new Date(task.timeBlock.startTime).getHours();
        const successfulTasks = tasks.filter(t =>
          t.status === 'completed' &&
          t.timeBlock &&
          new Date(t.timeBlock.startTime).getHours() === hour
        );
        
        score += (successfulTasks.length / tasks.length) * 30;
      }

      if (task.dependencies?.length) score -= task.dependencies.length * 5;
      if (task.subtasks?.length) score -= task.subtasks.length * 2;
      
      if (task.priority === 'high') score += 15;
      if (task.priority === 'medium') score += 10;
      
      return Math.min(Math.max(score, 0), 100);
    };

    const productivityPatterns = tasks
      .filter(task => task.status === 'completed' && task.completedAt && task.timeBlock)
      .reduce((acc, task) => {
        const hour = new Date(task.timeBlock!.startTime).getHours();
        const efficiency = task.estimatedDuration
          ? task.estimatedDuration / differenceInMinutes(new Date(task.completedAt!), new Date(task.timeBlock!.startTime))
          : 1;
        
        acc[hour] = acc[hour] || { count: 0, totalEfficiency: 0 };
        acc[hour].count++;
        acc[hour].totalEfficiency += efficiency;
        
        return acc;
      }, {} as Record<number, { count: number; totalEfficiency: number }>);

    const calculateBurnoutRisk = () => {
      let risk = 0;
      
      const dailyWorkload = tasks.reduce((acc, task) => {
        if (task.timeBlock) {
          const day = format(new Date(task.timeBlock.startTime), 'yyyy-MM-dd');
          acc[day] = (acc[day] || 0) + (task.estimatedDuration || 60);
        }
        return acc;
      }, {} as Record<string, number>);

      const avgDailyWorkload = Object.values(dailyWorkload).reduce((a, b) => a + b, 0) / 
        Object.keys(dailyWorkload).length;

      if (avgDailyWorkload > 480) risk += 30;
      
      const taskSwitches = tasks.filter(task =>
        task.status === 'completed' &&
        task.timeBlock &&
        differenceInMinutes(new Date(task.completedAt!), new Date(task.timeBlock.startTime)) < 30
      ).length;

      risk += taskSwitches * 5;
      
      const overtimeInstances = Object.entries(productivityPatterns).filter(([hour]) =>
        parseInt(hour) < 8 || parseInt(hour) > 17
      ).length;

      risk += overtimeInstances * 10;

      return Math.min(risk, 100);
    };

    return {
      taskPredictions: tasks
        .filter(task => task.status !== 'completed')
        .map(task => ({
          task,
          completionLikelihood: predictCompletionLikelihood(task)
        }))
        .sort((a, b) => b.completionLikelihood - a.completionLikelihood),
      
      productivityInsights: Object.entries(productivityPatterns).map(([hour, data]) => ({
        hour: parseInt(hour),
        efficiency: data.totalEfficiency / data.count,
        taskCount: data.count
      })),
      
      burnoutRisk: calculateBurnoutRisk()
    };
  }, [tasks]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total Tasks</h3>
          <p className="text-2xl font-bold">{filteredTasks.length}</p>
          <div className="mt-2 text-xs text-muted-foreground">
            In {timeRange}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Completion Rate</h3>
          <p className="text-2xl font-bold">
            {Math.round(
              (filteredTasks.filter(t => t.status === 'completed').length /
                filteredTasks.length) *
                100 || 0
            )}%
          </p>
          <div className="mt-2 text-xs text-muted-foreground">
            Average completion time: {averageCompletionTime}h
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Focus Time</h3>
          <p className="text-2xl font-bold">
            {Math.round(
              productivityByHour.reduce((acc, hour) => acc + hour.focusTime, 0)
            )}h
          </p>
          <div className="mt-2 text-xs text-muted-foreground">
            Total focused work time
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">High Priority</h3>
          <p className="text-2xl font-bold">
            {filteredTasks.filter(t => t.priority === 'high').length}
          </p>
          <div className="mt-2 text-xs text-muted-foreground">
            Tasks requiring attention
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Task Efficiency</h3>
          <p className="text-2xl font-bold">{taskEfficiency}%</p>
          <div className="mt-2 text-xs text-muted-foreground">
            Estimated vs actual time
          </div>
        </Card>
      </div>

      <TaskInsights />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Task Status Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tasksByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tasksByStatus.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={
                        entry.name === 'completed'
                          ? COLORS.completed
                          : entry.name === 'in-progress'
                          ? COLORS.inProgress
                          : COLORS.todo
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Priority Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tasksByPriority}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tasksByPriority.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={
                        entry.name === 'high'
                          ? COLORS.high
                          : entry.name === 'medium'
                          ? COLORS.medium
                          : COLORS.low
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Task Completion Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={completionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke={COLORS.completed}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke={COLORS.primary}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Productivity by Hour</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productivityByHour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tasks" fill={COLORS.primary} />
                <Bar dataKey="focusTime" fill={COLORS.accent} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Task Velocity</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={taskVelocity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="velocity"
                  stroke={COLORS.accent}
                  activeDot={{ r: 8 }}
                  name="Velocity Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Weekly Workload Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis unit="h" />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="hours"
                  fill={COLORS.primary}
                  name="Working Hours"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Popular Tags</h3>
        <ScrollArea className="h-[100px]">
          <div className="flex flex-wrap gap-2">
            {taskTags.map(({ tag, count }) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-sm"
              >
                #{tag}
                <span className="ml-1 text-muted-foreground">({count})</span>
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Task Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">By Priority</h4>
            <div className="space-y-2">
              {tasksByPriority.map(({ name, value }) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full mr-2',
                        name === 'high' && 'bg-red-500',
                        name === 'medium' && 'bg-yellow-500',
                        name === 'low' && 'bg-blue-500'
                      )}
                    />
                    <span className="capitalize">{name}</span>
                  </div>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">By Status</h4>
            <div className="space-y-2">
              {tasksByStatus.map(({ name, value }) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full mr-2',
                        name === 'completed' && 'bg-green-500',
                        name === 'in-progress' && 'bg-yellow-500',
                        name === 'todo' && 'bg-gray-500'
                      )}
                    />
                    <span className="capitalize">{name.replace('-', ' ')}</span>
                  </div>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Time Distribution</h4>
            <div className="space-y-2">
              {productivityByHour
                .filter(hour => hour.tasks > 0)
                .slice(0, 5)
                .map(hour => (
                  <div key={hour.hour} className="flex items-center justify-between">
                    <span>{hour.hour}</span>
                    <div className="flex items-center space-x-2">
                      <span>{hour.tasks} tasks</span>
                      <span className="text-muted-foreground">
                        ({hour.focusTime}h focus)
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Task Success Predictions</h3>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {mlInsights.taskPredictions.slice(0, 5).map(({ task, completionLikelihood }) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-medium">{task.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {task.estimatedDuration
                        ? `${task.estimatedDuration} min estimated`
                        : 'No duration set'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {Math.round(completionLikelihood)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Success Rate
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Productivity Analysis</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Peak Performance Hours
              </h4>
              <div className="space-y-2">
                {mlInsights.productivityInsights
                  .sort((a, b) => b.efficiency - a.efficiency)
                  .slice(0, 3)
                  .map(insight => (
                    <div
                      key={insight.hour}
                      className="flex items-center justify-between"
                    >
                      <span>
                        {format(new Date().setHours(insight.hour), 'ha')}
                      </span>
                      <div className="flex items-center space-x-4">
                        <span>{Math.round(insight.efficiency * 100)}% efficiency</span>
                        <span className="text-muted-foreground">
                          ({insight.taskCount} tasks)
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Burnout Risk Assessment
              </h4>
              <div className="relative pt-2">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-500',
                      mlInsights.burnoutRisk > 75
                        ? 'bg-red-500'
                        : mlInsights.burnoutRisk > 50
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    )}
                    style={{ width: `${mlInsights.burnoutRisk}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span>Low Risk</span>
                  <span className="font-medium">
                    {mlInsights.burnoutRisk}%
                  </span>
                  <span>High Risk</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <TaskRecommendations />
    </div>
  );
}
