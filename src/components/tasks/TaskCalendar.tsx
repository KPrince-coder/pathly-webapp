'use client';

import { useState } from 'react';
import { useTask } from '@/contexts/TaskContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Flag,
  Clock,
  Tag,
  User
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  getDay,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { Task } from '@/types/task';
import { cn } from '@/lib/utils';

export function TaskCalendar() {
  const { state, actions } = useTask();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getTasksForDate = (date: Date) =>
    state.tasks.filter(task => {
      if (!task.deadline) return false;
      return isSameDay(new Date(task.deadline), date);
    });

  const renderTaskPreview = (task: Task) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="group relative"
      key={task.id}
    >
      <div
        className={cn(
          'px-2 py-1 rounded-md text-xs mb-1',
          'hover:bg-secondary/20 cursor-pointer',
          'transition-colors duration-200',
          task.priority === 'high' && 'bg-red-100 text-red-900',
          task.priority === 'medium' && 'bg-yellow-100 text-yellow-900',
          task.priority === 'low' && 'bg-green-100 text-green-900'
        )}
        onClick={() => actions.setView({ selectedTask: task.id })}
      >
        <div className="font-medium truncate">{task.title}</div>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1 -translate-y-1/2 opacity-0 group-hover:opacity-100 h-6 w-6"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <div className="space-y-2">
            <div className="font-medium">{task.title}</div>
            {task.description && (
              <p className="text-sm text-muted-foreground">{task.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={cn(
                  'flex items-center space-x-1',
                  task.priority === 'high' && 'text-red-500 border-red-500'
                )}
              >
                <Flag className="w-3 h-3" />
                <span>{task.priority}</span>
              </Badge>
              {task.estimatedDuration && (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{task.estimatedDuration}m</span>
                </Badge>
              )}
              {task.assignedTo && (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>{task.assignedTo}</span>
                </Badge>
              )}
            </div>
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs flex items-center space-x-1"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{tag}</span>
                  </Badge>
                ))}
              </div>
            )}
            {task.progress !== undefined && (
              <div className="flex items-center space-x-2">
                <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      task.progress >= 100
                        ? 'bg-green-500'
                        : task.progress >= 50
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                    )}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {task.progress}%
                </span>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </motion.div>
  );

  const renderDateCell = (date: Date) => {
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const isCurrentMonth = isSameMonth(date, currentDate);
    const tasks = getTasksForDate(date);
    const hasHighPriorityTask = tasks.some(task => task.priority === 'high');

    return (
      <div
        key={date.toISOString()}
        className={cn(
          'h-32 p-2 border border-border',
          !isCurrentMonth && 'bg-muted/50',
          isSelected && 'ring-2 ring-primary',
          'transition-all duration-200'
        )}
        onClick={() => setSelectedDate(date)}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className={cn(
              'text-sm font-medium',
              !isCurrentMonth && 'text-muted-foreground',
              isToday(date) && 'text-primary'
            )}
          >
            {format(date, 'd')}
          </span>
          {tasks.length > 0 && (
            <Badge
              variant="outline"
              className={cn(
                hasHighPriorityTask && 'border-red-500 text-red-500'
              )}
            >
              {tasks.length}
            </Badge>
          )}
        </div>
        <ScrollArea className="h-24">
          <AnimatePresence>
            {tasks.map(task => renderTaskPreview(task))}
          </AnimatePresence>
        </ScrollArea>
      </div>
    );
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <CalendarIcon className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="text-sm font-medium text-center text-muted-foreground p-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {days.map(renderDateCell)}
      </div>
    </Card>
  );
}
