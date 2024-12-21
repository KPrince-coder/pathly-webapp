'use client';

import { useState, useEffect } from 'react';
import { Task, TimeBlock } from '@/types/task';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addMinutes } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';

interface TimeBlockManagerProps {
  task: Task;
  onTimeBlockUpdate: (taskId: string, timeBlock: TimeBlock) => void;
  onTaskComplete: (taskId: string) => void;
}

interface PomodoroState {
  isActive: boolean;
  isPause: boolean;
  timeLeft: number;
  totalTime: number;
  cycles: number;
}

const POMODORO_WORK_TIME = 25 * 60; // 25 minutes in seconds
const POMODORO_BREAK_TIME = 5 * 60; // 5 minutes in seconds
const POMODORO_LONG_BREAK_TIME = 15 * 60; // 15 minutes in seconds
const POMODORO_CYCLES_BEFORE_LONG_BREAK = 4;

export function TimeBlockManager({ 
  task, 
  onTimeBlockUpdate, 
  onTaskComplete 
}: TimeBlockManagerProps) {
  const [pomodoro, setPomodoro] = useState<PomodoroState>({
    isActive: false,
    isPause: false,
    timeLeft: POMODORO_WORK_TIME,
    totalTime: POMODORO_WORK_TIME,
    cycles: 0
  });

  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (pomodoro.isActive && !pomodoro.isPause) {
      interval = setInterval(() => {
        setPomodoro(prev => {
          if (prev.timeLeft <= 1) {
            // Time's up
            const cycles = isBreak ? prev.cycles : prev.cycles + 1;
            const shouldTakeLongBreak = cycles % POMODORO_CYCLES_BEFORE_LONG_BREAK === 0;
            const nextIsBreak = !isBreak;
            const nextTotalTime = nextIsBreak
              ? shouldTakeLongBreak
                ? POMODORO_LONG_BREAK_TIME
                : POMODORO_BREAK_TIME
              : POMODORO_WORK_TIME;

            // Play sound notification
            new Audio('/sounds/timer-end.mp3').play().catch(() => {});

            // Show browser notification
            if (Notification.permission === 'granted') {
              new Notification(
                isBreak ? 'Break time is over!' : 'Time for a break!',
                {
                  body: isBreak
                    ? 'Ready to get back to work?'
                    : `Great work! Take a ${shouldTakeLongBreak ? 'long' : 'short'} break.`,
                  icon: '/icons/timer.png'
                }
              );
            }

            setIsBreak(nextIsBreak);
            return {
              ...prev,
              isPause: true,
              timeLeft: nextTotalTime,
              totalTime: nextTotalTime,
              cycles
            };
          }

          return {
            ...prev,
            timeLeft: prev.timeLeft - 1
          };
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [pomodoro.isActive, pomodoro.isPause, isBreak]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    if (!pomodoro.isActive) {
      // Request notification permission if not granted
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    setPomodoro(prev => ({
      ...prev,
      isActive: true,
      isPause: !prev.isPause
    }));
  };

  const handleReset = () => {
    setPomodoro({
      isActive: false,
      isPause: false,
      timeLeft: POMODORO_WORK_TIME,
      totalTime: POMODORO_WORK_TIME,
      cycles: 0
    });
    setIsBreak(false);
  };

  const handleAddNote = (note: string) => {
    const timestamp = new Date().toISOString();
    setNotes(prev => [...prev, `[${format(new Date(), 'HH:mm')}] ${note}`]);
  };

  const progress = (pomodoro.timeLeft / pomodoro.totalTime) * 100;

  return (
    <div className={cn(
      'p-4 bg-card rounded-lg shadow-sm',
      'border border-border',
      'transition-colors duration-200'
    )}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={cn(
            'text-lg font-semibold',
            'text-foreground'
          )}>
            {isBreak ? 'Break Time' : 'Focus Time'}
          </h3>
          <div className={cn(
            'text-sm',
            'text-muted-foreground'
          )}>
            Cycle {Math.floor(pomodoro.cycles / 2) + 1}/
            {POMODORO_CYCLES_BEFORE_LONG_BREAK}
          </div>
        </div>

        <div className="relative">
          <Progress
            value={progress}
            className={cn(
              'h-2',
              isBreak ? 'bg-secondary' : 'bg-primary'
            )}
          />
          <div className={cn(
            'absolute inset-0 flex items-center justify-center',
            'text-2xl font-bold text-foreground'
          )}>
            {formatTime(pomodoro.timeLeft)}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            onClick={handleStartPause}
            variant={pomodoro.isPause ? 'default' : 'outline'}
            size="sm"
            className="min-w-[80px]"
          >
            {!pomodoro.isActive || pomodoro.isPause ? 'Start' : 'Pause'}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="min-w-[80px]"
          >
            Reset
          </Button>
          <Button
            onClick={() => setShowNotes(!showNotes)}
            variant="outline"
            size="sm"
            className="min-w-[80px]"
          >
            Notes
          </Button>
        </div>

        <AnimatePresence>
          {showNotes && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <textarea
                className={cn(
                  'w-full p-2 text-sm rounded resize-none',
                  'bg-background text-foreground',
                  'border border-input',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                  'placeholder:text-muted-foreground'
                )}
                placeholder="Add a note about your progress..."
                rows={3}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const note = e.currentTarget.value.trim();
                    if (note) {
                      handleAddNote(note);
                      e.currentTarget.value = '';
                    }
                  }
                }}
              />
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {notes.map((note, index) => (
                  <div
                    key={index}
                    className={cn(
                      'text-sm p-2 rounded',
                      'bg-secondary/10',
                      'text-secondary-foreground'
                    )}
                  >
                    {note}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {task.progress !== undefined && (
          <div className={cn(
            'pt-4',
            'border-t border-border'
          )}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">Overall Progress</span>
              <span className="text-muted-foreground">{task.progress}%</span>
            </div>
            <Progress
              value={task.progress}
              className="mt-2 bg-secondary"
            />
          </div>
        )}
      </div>
    </div>
  );
}
