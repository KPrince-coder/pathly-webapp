'use client';

import { useMemo } from 'react';
import { useTask } from '@/contexts/TaskContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  subDays,
  differenceInDays,
  isAfter,
  isBefore,
  startOfDay
} from 'date-fns';
import {
  Activity,
  TrendingUp,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Task } from '@/types/task';
import { cn } from '@/lib/utils';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1'];

export function TaskMetrics() {
  const { state } = useTask();
  const today = new Date();

  // Calculate completion rate over time
  const completionTrend = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, i))
      .reverse();

    return last7Days.map(date => {
      const dayTasks = state.tasks.filter(
        task => task.createdAt && isSameDay(new Date(task.createdAt), date)
      );
      const completed = dayTasks.filter(task => task.status === 'completed').length;
      const total = dayTasks.length;

      return {
        date: format(date, 'MMM d'),
        rate: total ? Math.round((completed / total) * 100) : 0
      };
    });
  }, [state.tasks]);

  // Calculate task distribution by priority
  const priorityDistribution = useMemo(() => {
    const distribution = state.tasks.reduce(
      (acc, task) => {
        acc[task.priority]++;
        return acc;
      },
      { high: 0, medium: 0, low: 0 }
    );

    return Object.entries(distribution).map(([priority, count]) => ({
      name: priority,
      value: count
    }));
  }, [state.tasks]);

  // Calculate task completion by day of week
  const weeklyCompletion = useMemo(() => {
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return weekDays.map(date => {
      const completed = state.tasks.filter(
        task =>
          task.status === 'completed' &&
          task.updatedAt &&
          isSameDay(new Date(task.updatedAt), date)
      ).length;

      return {
        day: format(date, 'EEE'),
        completed
      };
    });
  }, [state.tasks]);

  // Calculate average completion time
  const averageCompletionTime = useMemo(() => {
    const completedTasks = state.tasks.filter(
      task => task.status === 'completed' && task.createdAt && task.updatedAt
    );

    if (completedTasks.length === 0) return 0;

    const totalDays = completedTasks.reduce((acc, task) => {
      const created = new Date(task.createdAt);
      const completed = new Date(task.updatedAt!);
      return acc + differenceInDays(completed, created);
    }, 0);

    return Math.round(totalDays / completedTasks.length);
  }, [state.tasks]);

  // Calculate overdue tasks
  const overdueCount = useMemo(
    () =>
      state.tasks.filter(
        task =>
          task.deadline &&
          task.status !== 'completed' &&
          isBefore(new Date(task.deadline), startOfDay(today))
      ).length,
    [state.tasks]
  );

  // Calculate productivity score
  const productivityScore = useMemo(() => {
    const totalTasks = state.tasks.length;
    if (totalTasks === 0) return 0;

    const completedOnTime = state.tasks.filter(
      task =>
        task.status === 'completed' &&
        (!task.deadline ||
          isBefore(new Date(task.updatedAt!), new Date(task.deadline)))
    ).length;

    const highPriorityCompleted = state.tasks.filter(
      task => task.status === 'completed' && task.priority === 'high'
    ).length;

    return Math.round(
      ((completedOnTime / totalTasks) * 0.6 +
        (highPriorityCompleted / totalTasks) * 0.4) *
        100
    );
  }, [state.tasks]);

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    trend,
    className
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: { value: number; label: string };
    className?: string;
  }) => (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {trend && (
            <p
              className={cn(
                'text-xs mt-1 flex items-center',
                trend.value >= 0 ? 'text-green-500' : 'text-red-500'
              )}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div
          className={cn(
            'p-2 rounded-full',
            'bg-primary/10 text-primary'
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Productivity Score"
          value={`${productivityScore}%`}
          icon={Activity}
          trend={{ value: 12, label: 'vs last week' }}
        />
        <MetricCard
          title="Avg. Completion Time"
          value={`${averageCompletionTime} days`}
          icon={Clock}
        />
        <MetricCard
          title="Overdue Tasks"
          value={overdueCount}
          icon={AlertCircle}
          className={overdueCount > 0 ? 'border-red-500' : undefined}
        />
        <MetricCard
          title="Completion Rate"
          value={`${
            completionTrend[completionTrend.length - 1]?.rate || 0
          }%`}
          icon={CheckCircle2}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center">
              <BarChart2 className="w-4 h-4 mr-2" />
              Weekly Task Completion
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyCompletion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="completed"
                  fill="#6366F1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center">
              <PieChartIcon className="w-4 h-4 mr-2" />
              Task Priority Distribution
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityDistribution}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {priorityDistribution.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Task Completion Trend
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={completionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#6366F1"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
