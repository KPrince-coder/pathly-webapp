'use client';

import { useState } from 'react';
import { Task, TimeBlock } from '@/types/task';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { cn } from '@/lib/utils';

interface TaskCalendarViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTimeBlockClick?: (timeBlock: TimeBlock) => void;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const TIME_BLOCK_HEIGHT = 60; // pixels per hour

export function TaskCalendarView({
  tasks,
  onTaskClick,
  onTimeBlockClick,
  className
}: TaskCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week'>('week');

  const startDate = startOfWeek(currentDate);
  const endDate = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getTasksForDay = (date: Date) =>
    tasks.filter(task =>
      task.timeBlock && isSameDay(new Date(task.timeBlock.startTime), date)
    );

  const getTimeBlockPosition = (timeBlock: TimeBlock) => {
    const start = new Date(timeBlock.startTime);
    const end = new Date(timeBlock.endTime);
    const top = (start.getHours() + start.getMinutes() / 60) * TIME_BLOCK_HEIGHT;
    const height = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * TIME_BLOCK_HEIGHT;
    return { top, height };
  };

  const getTimeBlockColor = (task: Task) => {
    switch (task.priority) {
      case 'high':
        return 'bg-red-500/20 border-red-500 hover:bg-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 border-yellow-500 hover:bg-yellow-500/30';
      default:
        return 'bg-blue-500/20 border-blue-500 hover:bg-blue-500/30';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(d => subWeeks(d, 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(d => addWeeks(d, 1))}
          >
            Next
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={view === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('day')}
          >
            Day
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('week')}
          >
            Week
          </Button>
        </div>
      </div>

      <div className={cn(
        'bg-card rounded-lg shadow-sm',
        'border border-border',
        'overflow-hidden'
      )}>
        <div className="grid grid-cols-8 border-b border-border">
          <div className="col-span-1 p-2 text-center text-sm text-muted-foreground">
            Time
          </div>
          {view === 'week' ? days.map(day => (
            <div
              key={day.toISOString()}
              className={cn(
                'col-span-1 p-2 text-center',
                'text-sm font-medium',
                isSameDay(day, new Date()) && 'bg-primary/10'
              )}
            >
              <div>{format(day, 'EEE')}</div>
              <div className="text-muted-foreground">{format(day, 'd')}</div>
            </div>
          )) : (
            <div className="col-span-7 p-2 text-center">
              <div className="text-sm font-medium">
                {format(currentDate, 'EEEE')}
              </div>
              <div className="text-sm text-muted-foreground">
                {format(currentDate, 'MMMM d, yyyy')}
              </div>
            </div>
          )}
        </div>

        <ScrollArea className="h-[600px]">
          <div className="relative grid grid-cols-8">
            <div className="col-span-1 border-r border-border">
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className={cn(
                    'h-[60px] p-2',
                    'text-xs text-muted-foreground',
                    'border-b border-border'
                  )}
                >
                  {format(new Date().setHours(hour), 'ha')}
                </div>
              ))}
            </div>

            {view === 'week' ? days.map(day => (
              <div
                key={day.toISOString()}
                className={cn(
                  'col-span-1 relative',
                  'border-r border-border',
                  isSameDay(day, new Date()) && 'bg-primary/5'
                )}
              >
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    className="h-[60px] border-b border-border"
                  />
                ))}

                <AnimatePresence>
                  {getTasksForDay(day).map(task => {
                    if (!task.timeBlock) return null;
                    const { top, height } = getTimeBlockPosition(task.timeBlock);
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={cn(
                          'absolute left-0 right-0 mx-1',
                          'rounded border',
                          'cursor-pointer transition-colors',
                          getTimeBlockColor(task)
                        )}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        onClick={() => onTaskClick?.(task)}
                      >
                        <div className="p-1 text-xs truncate">
                          {task.title}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )) : (
              <div className="col-span-7 relative">
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    className="h-[60px] border-b border-border"
                  />
                ))}

                <AnimatePresence>
                  {getTasksForDay(currentDate).map(task => {
                    if (!task.timeBlock) return null;
                    const { top, height } = getTimeBlockPosition(task.timeBlock);
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={cn(
                          'absolute left-0 right-0 mx-2',
                          'rounded border',
                          'cursor-pointer transition-colors',
                          getTimeBlockColor(task)
                        )}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        onClick={() => onTaskClick?.(task)}
                      >
                        <div className="p-2">
                          <div className="font-medium">{task.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(task.timeBlock.startTime), 'h:mm a')} - 
                            {format(new Date(task.timeBlock.endTime), 'h:mm a')}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
