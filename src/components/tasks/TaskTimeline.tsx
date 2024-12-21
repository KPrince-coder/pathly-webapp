'use client';

import { useState, useRef, useEffect } from 'react';
import { Task } from '@/types/task';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskTimelineProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskDrop: (task: Task, startTime: Date) => void;
}

export function TaskTimeline({ tasks, onTaskClick, onTaskDrop }: TaskTimelineProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  const startDate = startOfWeek(currentDate);
  const endDate = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getTaskPosition = (task: Task) => {
    if (!task.timeBlock) return null;

    const startTime = new Date(task.timeBlock.startTime);
    const endTime = new Date(task.timeBlock.endTime);
    const dayIndex = days.findIndex(day => 
      format(day, 'yyyy-MM-dd') === format(startTime, 'yyyy-MM-dd')
    );

    if (dayIndex === -1) return null;

    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    return {
      left: `${(dayIndex * 24 + startHour) * zoom * 60}px`,
      width: `${duration * zoom * 60}px`,
      top: '0px'
    };
  };

  const handleDragStart = (task: Task) => {
    setDraggingTask(task);
  };

  const handleDragEnd = (e: React.DragEvent, task: Task) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const totalHours = x / (zoom * 60);
    const dayIndex = Math.floor(totalHours / 24);
    const hour = totalHours % 24;

    const newStartTime = addDays(startDate, dayIndex);
    newStartTime.setHours(Math.floor(hour));
    newStartTime.setMinutes((hour % 1) * 60);

    onTaskDrop(task, newStartTime);
    setDraggingTask(null);
  };

  return (
    <div className="h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentDate(addDays(currentDate, -7))}
            className="p-2 rounded hover:bg-secondary/10"
          >
            ←
          </button>
          <h3 className="text-lg font-semibold">
            {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
          </h3>
          <button
            onClick={() => setCurrentDate(addDays(currentDate, 7))}
            className="p-2 rounded hover:bg-secondary/10"
          >
            →
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="p-2 rounded hover:bg-secondary/10"
          >
            -
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            className="p-2 rounded hover:bg-secondary/10"
          >
            +
          </button>
        </div>
      </div>

      <div 
        className="relative overflow-x-auto"
        style={{ height: 'calc(100% - 4rem)' }}
      >
        <div className="sticky top-0 z-10 flex border-b bg-background">
          {days.map(day => (
            <div
              key={day.toISOString()}
              className="flex-none border-r"
              style={{ width: `${24 * zoom * 60}px` }}
            >
              <div className="px-2 py-1 text-sm font-medium">
                {format(day, 'EEE, MMM d')}
              </div>
              <div className="flex">
                {hours.map(hour => (
                  <div
                    key={hour}
                    className="flex-none border-r text-xs text-muted-foreground"
                    style={{ width: `${zoom * 60}px` }}
                  >
                    {format(new Date().setHours(hour, 0), 'ha')}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          ref={timelineRef}
          className="relative"
          style={{ height: 'calc(100% - 4rem)' }}
        >
          {/* Time grid */}
          <div className="absolute inset-0">
            {days.map((day, dayIndex) => (
              <div
                key={day.toISOString()}
                className="absolute top-0 bottom-0 border-r"
                style={{ left: `${dayIndex * 24 * zoom * 60}px` }}
              >
                {hours.map(hour => (
                  <div
                    key={hour}
                    className="absolute top-0 bottom-0 border-r border-secondary/20"
                    style={{ left: `${hour * zoom * 60}px` }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Tasks */}
          <AnimatePresence>
            {tasks.map(task => {
              const position = getTaskPosition(task);
              if (!position) return null;

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={position}
                  className={cn(
                    'absolute p-2 rounded-lg cursor-pointer',
                    'hover:shadow-lg transition-shadow duration-200',
                    task.priority === 'high' && 'bg-red-100 text-red-900',
                    task.priority === 'medium' && 'bg-yellow-100 text-yellow-900',
                    task.priority === 'low' && 'bg-green-100 text-green-900',
                    draggingTask?.id === task.id && 'opacity-50'
                  )}
                  draggable
                  onDragStart={() => handleDragStart(task)}
                  onDragEnd={e => handleDragEnd(e, task)}
                  onClick={() => onTaskClick(task)}
                >
                  <div className="text-sm font-medium truncate">{task.title}</div>
                  {task.timeBlock && (
                    <div className="text-xs opacity-75">
                      {format(task.timeBlock.startTime, 'h:mma')} - 
                      {format(task.timeBlock.endTime, 'h:mma')}
                    </div>
                  )}
                  {task.progress !== undefined && (
                    <div className="mt-1 h-1 bg-black/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-current transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Current time indicator */}
          <div
            className="absolute top-0 bottom-0 w-px bg-blue-500 z-20"
            style={{
              left: `${(
                (new Date().getHours() + new Date().getMinutes() / 60) * zoom * 60
              )}px`
            }}
          >
            <div className="absolute top-0 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
