import { useState } from 'react';
import { Task } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { TimeTracker } from '../timer/TimeTracker';
import { PomodoroTimer } from '../timer/PomodoroTimer';
import { FiClock, FiCheckCircle, FiRotateCcw } from 'react-icons/fi';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const [showTimeTracker, setShowTimeTracker] = useState(false);
  const [showPomodoroTimer, setShowPomodoroTimer] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-500 bg-red-50';
      case 'medium':
        return 'text-yellow-500 bg-yellow-50';
      case 'low':
        return 'text-green-500 bg-green-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done':
        return 'text-green-500 bg-green-50';
      case 'in progress':
        return 'text-blue-500 bg-blue-50';
      case 'todo':
        return 'text-gray-500 bg-gray-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{task.title}</CardTitle>
          <div className="flex space-x-2">
            <Badge className={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
            <Badge className={getStatusColor(task.status)}>
              {task.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-gray-500">{task.description}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
        </div>

        {showTimeTracker && (
          <TimeTracker
            taskId={task.id}
            title="Time Tracked"
            onTimeUpdate={(seconds) => {
              console.log('Time tracked:', seconds);
            }}
          />
        )}

        {showPomodoroTimer && (
          <PomodoroTimer
            onPomodoroComplete={() => {
              console.log('Pomodoro completed for task:', task.title);
            }}
          />
        )}
      </CardContent>

      <CardFooter className="flex justify-end space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowTimeTracker(!showTimeTracker);
            setShowPomodoroTimer(false);
          }}
        >
          <FiClock className="mr-1" />
          {showTimeTracker ? 'Hide Timer' : 'Track Time'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowPomodoroTimer(!showPomodoroTimer);
            setShowTimeTracker(false);
          }}
        >
          <FiRotateCcw className="mr-1" />
          {showPomodoroTimer ? 'Hide Pomodoro' : 'Pomodoro'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            // Handle task completion
            console.log('Complete task:', task.id);
          }}
        >
          <FiCheckCircle className="mr-1" />
          Complete
        </Button>
      </CardFooter>
    </Card>
  );
}
