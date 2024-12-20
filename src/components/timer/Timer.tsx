import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FiPlay, FiPause, FiStop, FiSkipForward } from 'react-icons/fi/index';
import { cn } from '@/lib/utils';

interface TimerProps {
  initialSeconds?: number;
  onComplete?: () => void;
  onTimeUpdate?: (seconds: number) => void;
  isPomodoroTimer?: boolean;
  isBreakTimer?: boolean;
}

export function Timer({
  initialSeconds = 1500, // 25 minutes
  onComplete,
  onTimeUpdate,
  isPomodoroTimer = false,
  isBreakTimer = false,
}: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  const reset = useCallback(() => {
    setSeconds(initialSeconds);
    setIsRunning(false);
    setStartTime(null);
  }, [initialSeconds]);

  const start = useCallback(() => {
    setIsRunning(true);
    setStartTime(new Date());
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const skip = useCallback(() => {
    setSeconds(0);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => {
          const newSeconds = prevSeconds - 1;
          onTimeUpdate?.(newSeconds);
          return newSeconds;
        });
      }, 1000);
    } else if (seconds === 0) {
      setIsRunning(false);
      onComplete?.();
    }

    return () => clearInterval(interval);
  }, [isRunning, seconds, onComplete, onTimeUpdate]);

  const progress = ((initialSeconds - seconds) / initialSeconds) * 100;

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {isPomodoroTimer
              ? 'Focus Time'
              : isBreakTimer
              ? 'Break Time'
              : 'Timer'}
          </h3>
          <Badge
            variant={isPomodoroTimer ? 'default' : isBreakTimer ? 'success' : 'secondary'}
          >
            {isPomodoroTimer
              ? 'Pomodoro'
              : isBreakTimer
              ? 'Break'
              : 'Custom Timer'}
          </Badge>
        </div>

        <div className="relative flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(
                #3b82f6 ${progress}%,
                #e5e7eb ${progress}%
              )`,
            }}
          />
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-white">
            <span className="text-3xl font-bold">{formatTime(seconds)}</span>
          </div>
        </div>

        <div className="flex justify-center space-x-2">
          {!isRunning ? (
            <Button onClick={start}>
              <FiPlay className="mr-1 h-4 w-4" />
              Start
            </Button>
          ) : (
            <Button onClick={pause}>
              <FiPause className="mr-1 h-4 w-4" />
              Pause
            </Button>
          )}
          <Button variant="secondary" onClick={reset}>
            <FiStop className="mr-1 h-4 w-4" />
            Reset
          </Button>
          <Button variant="secondary" onClick={skip}>
            <FiSkipForward className="mr-1 h-4 w-4" />
            Skip
          </Button>
        </div>

        {startTime && (
          <p className="text-center text-sm text-gray-500">
            Started at: {startTime.toLocaleTimeString()}
          </p>
        )}
      </div>
    </Card>
  );
}
