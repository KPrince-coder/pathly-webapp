import { Goal, Task } from '@/types';
import { Card } from '../ui/Card';
import { FiTarget, FiCheckCircle, FiTrendingUp, FiClock } from 'react-icons/fi';

interface StatsProps {
  goals: Goal[];
  tasks: Task[];
}

export function Stats({ goals, tasks }: StatsProps) {
  const activeGoals = goals.filter((goal) => goal.status !== 'Completed').length;
  const completedGoals = goals.filter(
    (goal) => goal.status === 'Completed'
  ).length;
  const tasksToday = tasks.filter(
    (task) =>
      new Date(task.deadline).toDateString() === new Date().toDateString()
  ).length;
  const completedTasks = tasks.filter(
    (task) => task.status === 'Done'
  ).length;

  const stats = [
    {
      title: 'Active Goals',
      value: activeGoals,
      icon: FiTarget,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Completed Goals',
      value: completedGoals,
      icon: FiCheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: "Today's Tasks",
      value: tasksToday,
      icon: FiClock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Completed Tasks',
      value: completedTasks,
      icon: FiTrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <div className="p-6">
            <div className="flex items-center">
              <div
                className={`p-3 rounded-full ${stat.bgColor} ${stat.color}`}
              >
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {stat.title}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
