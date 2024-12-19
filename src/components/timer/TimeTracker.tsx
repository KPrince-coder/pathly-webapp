import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FiPlay, FiPause, FiStop, FiClock } from 'react-icons/fi';
import { supabase } from '@/lib/db';

interface TimeTrackerProps {
  taskId?: string;
  goalId?: string;
  title: string;
  onTimeUpdate?: (seconds: number) => void;
}

export function TimeTracker({
  taskId,
  goalId,
  title,
  onTimeUpdate,
}: TimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [todayTotal, setTodayTotal] = useState(0);

  useEffect(() => {
    // Load today's total time
    const loadTodayTotal = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('time_entries')
        .select('duration')
        .match(taskId ? { task_id: taskId } : { goal_id: goalId })
        .gte('start_time', today.toISOString())
        .not('duration', 'is', null);

      if (!error && data) {
        const total = data.reduce((sum, entry) => sum + (entry.duration || 0), 0);
        setTodayTotal(total);
      }
    };

    loadTodayTotal();
  }, [taskId, goalId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
        onTimeUpdate?.(elapsed);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, startTime, onTimeUpdate]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startTimer = async () => {
    const now = new Date();
    setStartTime(now);
    setIsRunning(true);

    // Create new time entry
    await supabase.from('time_entries').insert({
      task_id: taskId,
      goal_id: goalId,
      start_time: now.toISOString(),
    });
  };

  const pauseTimer = async () => {
    if (!startTime) return;

    const now = new Date();
    const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);

    // Update time entry
    await supabase
      .from('time_entries')
      .update({
        end_time: now.toISOString(),
        duration,
      })
      .match({
        task_id: taskId,
        goal_id: goalId,
        end_time: null,
      });

    setIsRunning(false);
    setStartTime(null);
    setElapsedTime(0);
    setTodayTotal((prev) => prev + duration);
  };

  const stopTimer = async () => {
    await pauseTimer();
    setElapsedTime(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <FiClock className="mr-2" />
            {title}
          </span>
          <Badge variant="secondary">
            Today: {formatTime(todayTotal)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <span className="text-4xl font-bold">
              {formatTime(elapsedTime)}
            </span>
          </div>

          <div className="flex justify-center space-x-2">
            {!isRunning ? (
              <Button onClick={startTimer}>
                <FiPlay className="mr-1 h-4 w-4" />
                Start
              </Button>
            ) : (
              <>
                <Button onClick={pauseTimer}>
                  <FiPause className="mr-1 h-4 w-4" />
                  Pause
                </Button>
                <Button variant="secondary" onClick={stopTimer}>
                  <FiStop className="mr-1 h-4 w-4" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
