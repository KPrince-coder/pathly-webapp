'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTask } from '@/contexts/TaskContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Target,
  Trophy,
  Star,
  Heart,
  Zap,
  Award,
  Smile,
  ThumbsUp
} from 'lucide-react';
import { Task } from '@/types/task';
import {
  differenceInDays,
  differenceInHours,
  format,
  startOfWeek,
  endOfWeek,
  isSameDay
} from 'date-fns';

interface CoachMessage {
  id: string;
  type: 'motivation' | 'suggestion' | 'celebration' | 'reminder';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: Date;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  icon: React.ReactNode;
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  reward: string;
  progress: number;
  maxProgress: number;
  deadline: Date;
}

export function TaskVirtualCoach() {
  const { state, actions } = useTask();
  const { tasks, settings, stats } = state;
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [selectedCoach, setSelectedCoach] = useState('productivity');

  const coachProfiles = {
    productivity: {
      name: 'Alex',
      role: 'Productivity Coach',
      avatar: '/coaches/productivity.jpg',
      style: 'Focused and goal-oriented'
    },
    wellness: {
      name: 'Sarah',
      role: 'Wellness Coach',
      avatar: '/coaches/wellness.jpg',
      style: 'Supportive and balanced'
    },
    motivation: {
      name: 'Mike',
      role: 'Motivation Coach',
      avatar: '/coaches/motivation.jpg',
      style: 'Energetic and inspiring'
    }
  };

  const coachAnalytics = useMemo(() => {
    // Analyze task patterns
    const analyzePatterns = () => {
      const completedTasks = tasks.filter(t => t.status === 'completed');
      const productiveHours = completedTasks.reduce((acc, task) => {
        if (task.completedAt) {
          const hour = new Date(task.completedAt).getHours();
          acc[hour] = (acc[hour] || 0) + 1;
        }
        return acc;
      }, {} as Record<number, number>);

      const bestHour = Object.entries(productiveHours)
        .sort(([, a], [, b]) => b - a)[0];

      return {
        bestHour: bestHour ? parseInt(bestHour[0]) : null,
        completionRate: completedTasks.length / (tasks.length || 1) * 100,
        averageTasksPerDay: completedTasks.length / 7
      };
    };

    // Generate personalized achievements
    const generateAchievements = (): Achievement[] => [
      {
        id: 'focus-master',
        title: 'Focus Master',
        description: 'Complete 5 tasks without interruption',
        progress: stats.focusStreak,
        maxProgress: 5,
        icon: <Zap className="w-6 h-6 text-yellow-500" />
      },
      {
        id: 'consistency-king',
        title: 'Consistency King',
        description: 'Maintain a 7-day task completion streak',
        progress: stats.streakDays,
        maxProgress: 7,
        icon: <Trophy className="w-6 h-6 text-purple-500" />
      },
      {
        id: 'early-bird',
        title: 'Early Bird',
        description: 'Complete 3 tasks before 10 AM',
        progress: stats.earlyTasks,
        maxProgress: 3,
        icon: <Star className="w-6 h-6 text-blue-500" />
      }
    ];

    // Generate daily challenges
    const generateChallenges = (): DailyChallenge[] => {
      const today = new Date();
      return [
        {
          id: 'quick-wins',
          title: 'Quick Wins',
          description: 'Complete 3 small tasks under 30 minutes',
          reward: 'Unlock "Efficiency Expert" badge',
          progress: tasks.filter(t =>
            t.status === 'completed' &&
            t.completedAt &&
            isSameDay(new Date(t.completedAt), today) &&
            t.estimatedDuration && t.estimatedDuration <= 30
          ).length,
          maxProgress: 3,
          deadline: new Date(today.setHours(23, 59, 59))
        },
        {
          id: 'deep-work',
          title: 'Deep Work Session',
          description: 'Complete a 2-hour focused work session',
          reward: 'Unlock "Deep Focus" achievement',
          progress: Math.min(stats.dailyFocusTime, 120),
          maxProgress: 120,
          deadline: new Date(today.setHours(23, 59, 59))
        }
      ];
    };

    return {
      patterns: analyzePatterns(),
      achievements: generateAchievements(),
      challenges: generateChallenges()
    };
  }, [tasks, stats]);

  useEffect(() => {
    // Generate coach messages based on analysis
    const generateMessages = () => {
      const newMessages: CoachMessage[] = [];

      // Productivity tips
      if (coachAnalytics.patterns.bestHour !== null) {
        newMessages.push({
          id: 'productivity-1',
          type: 'suggestion',
          message: `I notice you're most productive at ${format(
            new Date().setHours(coachAnalytics.patterns.bestHour),
            'ha'
          )}. Try scheduling important tasks during this time!`,
          timestamp: new Date()
        });
      }

      // Achievement celebrations
      coachAnalytics.achievements
        .filter(a => a.progress === a.maxProgress)
        .forEach(achievement => {
          newMessages.push({
            id: `celebration-${achievement.id}`,
            type: 'celebration',
            message: `Congratulations! You've earned the "${achievement.title}" achievement! 🎉`,
            timestamp: new Date()
          });
        });

      // Challenge reminders
      coachAnalytics.challenges
        .filter(c => c.progress < c.maxProgress)
        .forEach(challenge => {
          const hoursLeft = differenceInHours(challenge.deadline, new Date());
          if (hoursLeft <= 4) {
            newMessages.push({
              id: `reminder-${challenge.id}`,
              type: 'reminder',
              message: `Only ${hoursLeft} hours left to complete the "${challenge.title}" challenge!`,
              action: {
                label: 'View Challenge',
                onClick: () => actions.setView({ selectedChallenge: challenge.id })
              },
              timestamp: new Date()
            });
          }
        });

      // Motivation messages
      if (coachAnalytics.patterns.completionRate < 50) {
        newMessages.push({
          id: 'motivation-1',
          type: 'motivation',
          message: "Remember, every small step counts! Let's break down your tasks into manageable chunks.",
          timestamp: new Date()
        });
      }

      setMessages(prev => [...newMessages, ...prev].slice(0, 10));
    };

    const interval = setInterval(generateMessages, 30000);
    generateMessages();

    return () => clearInterval(interval);
  }, [coachAnalytics]);

  const renderMessageIcon = (type: CoachMessage['type']) => {
    switch (type) {
      case 'motivation':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'suggestion':
        return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'celebration':
        return <Trophy className="w-5 h-5 text-purple-500" />;
      case 'reminder':
        return <Target className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-center space-x-4 mb-6">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={coachProfiles[selectedCoach].avatar}
              alt={coachProfiles[selectedCoach].name}
            />
            <AvatarFallback>
              {coachProfiles[selectedCoach].name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-medium">
              {coachProfiles[selectedCoach].name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {coachProfiles[selectedCoach].role}
            </p>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          <AnimatePresence>
            {messages.map(message => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-4"
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-1">{renderMessageIcon(message.type)}</div>
                  <div className="flex-1">
                    <p className="text-sm">{message.message}</p>
                    {message.action && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={message.action.onClick}
                        className="mt-2"
                      >
                        {message.action.label}
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(message.timestamp, 'h:mm a')}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </ScrollArea>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Daily Challenges</h3>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {coachAnalytics.challenges.map(challenge => (
                <div
                  key={challenge.id}
                  className="p-4 rounded-lg border bg-secondary/50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{challenge.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {challenge.description}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {differenceInHours(challenge.deadline, new Date())}h left
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <Progress
                      value={(challenge.progress / challenge.maxProgress) * 100}
                      className="h-2"
                    />
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <span>
                        {challenge.progress} / {challenge.maxProgress}
                      </span>
                      <span className="text-muted-foreground">
                        {challenge.reward}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Achievements</h3>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {coachAnalytics.achievements.map(achievement => (
                <div
                  key={achievement.id}
                  className={cn(
                    'p-4 rounded-lg border',
                    achievement.progress === achievement.maxProgress
                      ? 'bg-primary/10 border-primary/50'
                      : 'bg-secondary/50'
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <div className="shrink-0">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium">{achievement.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                      <div className="mt-2">
                        <Progress
                          value={
                            (achievement.progress / achievement.maxProgress) * 100
                          }
                          className="h-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {achievement.progress} / {achievement.maxProgress}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
