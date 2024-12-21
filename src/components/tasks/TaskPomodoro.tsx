'use client';

import { useState, useEffect, useRef } from 'react';
import { useTask } from '@/contexts/TaskContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Clock,
  Bell,
  Settings,
  Volume2,
  VolumeX,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Task } from '@/types/task';
import { format, addMinutes, differenceInSeconds } from 'date-fns';

interface PomodoroSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  type: 'work' | 'break';
  taskId?: string;
  completed: boolean;
}

interface PomodoroStats {
  totalSessions: number;
  totalWorkTime: number;
  totalBreakTime: number;
  completedTasks: number;
  longestStreak: number;
}

export function TaskPomodoro() {
  const { state, actions } = useTask();
  const { tasks } = state;
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [sessionType, setSessionType] = useState<'work' | 'break'>('work');
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [settings, setSettings] = useState({
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreaks: true,
    autoStartPomodoros: false,
    notifications: true,
    sound: true,
    volume: 0.7
  });

  const timerRef = useRef<number>();
  const audioRef = useRef<HTMLAudioElement>();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/timer-end.mp3');
      audioRef.current.volume = settings.volume;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const stats = useMemo(() => {
    const calculateStats = (): PomodoroStats => {
      const completedSessions = sessions.filter(s => s.completed);
      let currentStreak = 0;
      let maxStreak = 0;

      completedSessions.forEach((session, index) => {
        if (session.type === 'work' && session.completed) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      });

      return {
        totalSessions: completedSessions.length,
        totalWorkTime: completedSessions
          .filter(s => s.type === 'work')
          .reduce((acc, s) => {
            return acc + (s.endTime
              ? differenceInSeconds(s.endTime, s.startTime)
              : 0);
          }, 0),
        totalBreakTime: completedSessions
          .filter(s => s.type === 'break')
          .reduce((acc, s) => {
            return acc + (s.endTime
              ? differenceInSeconds(s.endTime, s.startTime)
              : 0);
          }, 0),
        completedTasks: new Set(
          completedSessions
            .filter(s => s.taskId)
            .map(s => s.taskId)
        ).size,
        longestStreak: maxStreak
      };
    };

    return calculateStats();
  }, [sessions]);

  const startTimer = () => {
    if (!isRunning) {
      setIsRunning(true);
      const newSession: PomodoroSession = {
        id: Math.random().toString(36).substr(2, 9),
        startTime: new Date(),
        type: sessionType,
        taskId: currentTask?.id,
        completed: false
      };
      setSessions(prev => [...prev, newSession]);

      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const pauseTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resetTimer = () => {
    pauseTimer();
    setTimeLeft(
      sessionType === 'work'
        ? settings.workDuration * 60
        : settings.breakDuration * 60
    );
  };

  const handleTimerComplete = () => {
    pauseTimer();

    // Play sound if enabled
    if (settings.sound && audioRef.current) {
      audioRef.current.play();
    }

    // Show notification if enabled
    if (settings.notifications) {
      new Notification('Pomodoro Timer', {
        body: `${sessionType === 'work' ? 'Work session' : 'Break'} completed!`,
        icon: '/logo.png'
      });
    }

    // Update session
    setSessions(prev =>
      prev.map((session, index) =>
        index === prev.length - 1
          ? { ...session, endTime: new Date(), completed: true }
          : session
      )
    );

    // Switch session type
    const newType = sessionType === 'work' ? 'break' : 'work';
    setSessionType(newType);
    setTimeLeft(
      newType === 'work'
        ? settings.workDuration * 60
        : shouldTakeLongBreak()
        ? settings.longBreakDuration * 60
        : settings.breakDuration * 60
    );

    // Auto-start next session if enabled
    if (
      (newType === 'break' && settings.autoStartBreaks) ||
      (newType === 'work' && settings.autoStartPomodoros)
    ) {
      startTimer();
    }
  };

  const shouldTakeLongBreak = () => {
    const completedWorkSessions = sessions.filter(
      s => s.type === 'work' && s.completed
    ).length;
    return completedWorkSessions % settings.sessionsBeforeLongBreak === 0;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col items-center">
          <div className="text-6xl font-bold mb-8">{formatTime(timeLeft)}</div>
          <div className="flex items-center space-x-4 mb-8">
            <Button
              variant={isRunning ? 'outline' : 'default'}
              size="lg"
              onClick={isRunning ? pauseTimer : startTimer}
            >
              {isRunning ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={resetTimer}
              disabled={isRunning}
            >
              <RotateCcw className="w-6 h-6" />
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <Badge variant={sessionType === 'work' ? 'default' : 'outline'}>
              Work
            </Badge>
            <Badge variant={sessionType === 'break' ? 'default' : 'outline'}>
              Break
            </Badge>
          </div>

          {currentTask && (
            <div className="mt-4 p-4 rounded-lg bg-secondary/50 w-full">
              <h3 className="font-medium mb-2">Current Task</h3>
              <p className="text-sm text-muted-foreground">
                {currentTask.title}
              </p>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Today's Sessions</h3>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {sessions
                .filter(session =>
                  isSameDay(new Date(session.startTime), new Date())
                )
                .map(session => (
                  <div
                    key={session.id}
                    className={cn(
                      'p-4 rounded-lg border',
                      session.completed
                        ? 'bg-primary/10 border-primary/50'
                        : 'bg-secondary/50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {session.type === 'work' ? (
                          <Clock className="w-4 h-4" />
                        ) : (
                          <Coffee className="w-4 h-4" />
                        )}
                        <span className="font-medium capitalize">
                          {session.type} Session
                        </span>
                      </div>
                      {session.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {format(new Date(session.startTime), 'h:mm a')} -{' '}
                      {session.endTime
                        ? format(new Date(session.endTime), 'h:mm a')
                        : 'In Progress'}
                    </div>
                    {session.taskId && (
                      <div className="mt-2 text-sm">
                        Task:{' '}
                        {tasks.find(t => t.id === session.taskId)?.title}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </ScrollArea>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Statistics</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Longest Streak</p>
                <p className="text-2xl font-bold">{stats.longestStreak}</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Work Time</p>
                <p className="text-2xl font-bold">
                  {Math.round(stats.totalWorkTime / 60)}m
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Break Time</p>
                <p className="text-2xl font-bold">
                  {Math.round(stats.totalBreakTime / 60)}m
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Daily Goal Progress</p>
                <span className="text-sm text-muted-foreground">
                  {stats.totalSessions}/8 sessions
                </span>
              </div>
              <Progress
                value={(stats.totalSessions / 8) * 100}
                className="h-2"
              />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Settings</h3>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Customize
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Work Duration</label>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[settings.workDuration]}
                  min={1}
                  max={60}
                  step={1}
                  onValueChange={([value]) =>
                    setSettings(prev => ({ ...prev, workDuration: value }))
                  }
                />
                <span className="text-sm text-muted-foreground w-12">
                  {settings.workDuration}m
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Break Duration</label>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[settings.breakDuration]}
                  min={1}
                  max={30}
                  step={1}
                  onValueChange={([value]) =>
                    setSettings(prev => ({ ...prev, breakDuration: value }))
                  }
                />
                <span className="text-sm text-muted-foreground w-12">
                  {settings.breakDuration}m
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Auto-start Breaks</label>
              <Switch
                checked={settings.autoStartBreaks}
                onCheckedChange={checked =>
                  setSettings(prev => ({ ...prev, autoStartBreaks: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Sound</label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSettings(prev => ({ ...prev, sound: !prev.sound }))
                  }
                >
                  {settings.sound ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </Button>
                {settings.sound && (
                  <Slider
                    value={[settings.volume * 100]}
                    min={0}
                    max={100}
                    step={1}
                    className="w-24"
                    onValueChange={([value]) =>
                      setSettings(prev => ({
                        ...prev,
                        volume: value / 100
                      }))
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
