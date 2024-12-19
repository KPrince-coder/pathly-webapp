import { useState } from 'react';
import { Task } from '@/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
} from 'date-fns';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Button } from '../ui/Button';

interface CalendarProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export function Calendar({ tasks, onTaskClick }: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getTasksForDay = (date: Date) => {
    return tasks.filter((task) => isSameDay(new Date(task.deadline), date));
  };

  const previousWeek = () => {
    setSelectedDate((date) => {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() - 7);
      return newDate;
    });
  };

  const nextWeek = () => {
    setSelectedDate((date) => {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() + 7);
      return newDate;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Week of {format(weekStart, 'MMM d, yyyy')}
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={previousWeek}>
            <FiChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={nextWeek}>
            <FiChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {days.map((day) => (
          <div key={day.toString()}>
            <div
              className={`text-center p-2 rounded-t-lg ${
                isToday(day)
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <div className="text-xs font-medium">
                {format(day, 'EEE')}
              </div>
              <div className="text-lg font-semibold">
                {format(day, 'd')}
              </div>
            </div>
            <Card className="h-48 overflow-y-auto rounded-t-none">
              <div className="p-2 space-y-2">
                {getTasksForDay(day).map((task) => (
                  <div
                    key={task.id}
                    className="p-2 bg-white rounded border cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => onTaskClick?.(task)}
                  >
                    <div className="text-sm font-medium truncate">
                      {task.title}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs text-gray-500">
                        {format(new Date(task.deadline), 'h:mm a')}
                      </div>
                      <Badge
                        variant={
                          task.priority === 'High'
                            ? 'danger'
                            : task.priority === 'Medium'
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
