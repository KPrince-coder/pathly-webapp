import { useState, useEffect } from 'react';
import { Timer } from './Timer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';

interface PomodoroTimerProps {
  pomodoroMinutes?: number;
  shortBreakMinutes?: number;
  longBreakMinutes?: number;
  pomodorosUntilLongBreak?: number;
  onTimeUpdate?: (seconds: number) => void;
  onPomodoroComplete?: () => void;
}

type TimerPhase = 'pomodoro' | 'shortBreak' | 'longBreak';

export function PomodoroTimer({
  pomodoroMinutes = 25,
  shortBreakMinutes = 5,
  longBreakMinutes = 15,
  pomodorosUntilLongBreak = 4,
  onTimeUpdate,
  onPomodoroComplete,
}: PomodoroTimerProps) {
  const [phase, setPhase] = useState<TimerPhase>('pomodoro');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);

  const handlePomodoroComplete = () => {
    const newCompletedPomodoros = completedPomodoros + 1;
    setCompletedPomodoros(newCompletedPomodoros);
    onPomodoroComplete?.();

    if (newCompletedPomodoros % pomodorosUntilLongBreak === 0) {
      setPhase('longBreak');
    } else {
      setPhase('shortBreak');
    }
  };

  const handleBreakComplete = () => {
    setPhase('pomodoro');
  };

  const getTimerDuration = () => {
    switch (phase) {
      case 'pomodoro':
        return pomodoroMinutes * 60;
      case 'shortBreak':
        return shortBreakMinutes * 60;
      case 'longBreak':
        return longBreakMinutes * 60;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Pomodoro Timer</span>
          <Badge variant="secondary">
            {completedPomodoros} / {pomodorosUntilLongBreak} Pomodoros
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Progress</span>
            <span>
              {Math.round((completedPomodoros % pomodorosUntilLongBreak) * 100 / pomodorosUntilLongBreak)}%
            </span>
          </div>
          <Progress
            value={(completedPomodoros % pomodorosUntilLongBreak) * 100 / pomodorosUntilLongBreak}
          />
        </div>

        <Timer
          key={phase} // Reset timer when phase changes
          initialSeconds={getTimerDuration()}
          onComplete={
            phase === 'pomodoro' ? handlePomodoroComplete : handleBreakComplete
          }
          onTimeUpdate={onTimeUpdate}
          isPomodoroTimer={phase === 'pomodoro'}
          isBreakTimer={phase === 'shortBreak' || phase === 'longBreak'}
        />

        <div className="flex justify-between text-sm">
          <div>
            <p className="font-medium">Focus Time</p>
            <p className="text-gray-500">{pomodoroMinutes} minutes</p>
          </div>
          <div>
            <p className="font-medium">Short Break</p>
            <p className="text-gray-500">{shortBreakMinutes} minutes</p>
          </div>
          <div>
            <p className="font-medium">Long Break</p>
            <p className="text-gray-500">{longBreakMinutes} minutes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
