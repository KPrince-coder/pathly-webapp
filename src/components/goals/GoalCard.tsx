import { Goal } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { Badge } from '../ui/Badge';
import { formatDate } from '@/lib/utils';
import { FiCalendar, FiFlag } from 'react-icons/fi';

interface GoalCardProps {
  goal: Goal;
  onClick?: () => void;
}

const priorityColors = {
  Low: 'secondary',
  Medium: 'warning',
  High: 'danger',
} as const;

const statusColors = {
  'Not Started': 'secondary',
  'In Progress': 'default',
  Completed: 'success',
} as const;

export function GoalCard({ goal, onClick }: GoalCardProps) {
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{goal.title}</CardTitle>
          <Badge variant={priorityColors[goal.priority]}>
            <FiFlag className="w-3 h-3 mr-1" />
            {goal.priority}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-4">{goal.description}</p>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-500">
              <FiCalendar className="w-4 h-4 mr-1" />
              Due {formatDate(goal.deadline)}
            </div>
            <Badge variant={statusColors[goal.status]}>{goal.status}</Badge>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Progress</span>
              <span>{goal.progress}%</span>
            </div>
            <Progress value={goal.progress} variant="default" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
