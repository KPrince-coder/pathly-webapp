'use client';

import { useMemo } from 'react';
import { useTask } from '@/contexts/TaskContext';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Star,
  Flame,
  Zap,
  Target,
  Award,
  Crown,
  Shield
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xp: number;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  maxProgress: number;
  deadline?: Date;
  type: 'daily' | 'weekly' | 'special';
}

interface Streak {
  current: number;
  best: number;
  lastActive: Date;
}

export function TaskGamification() {
  const { state } = useTask();
  const { tasks, settings, stats } = state;

  const gamificationState = useMemo(() => {
    // Calculate user level and XP
    const calculateLevel = (xp: number) => {
      const baseXP = 1000;
      const level = Math.floor(Math.log2(xp / baseXP + 1)) + 1;
      const currentLevelXP = baseXP * (Math.pow(2, level - 1) - 1);
      const nextLevelXP = baseXP * (Math.pow(2, level) - 1);
      const progress = (xp - currentLevelXP) / (nextLevelXP - currentLevelXP) * 100;
      
      return { level, progress, nextLevelXP: nextLevelXP - xp };
    };

    const totalXP = stats.completedTasks * 100 +
      stats.streakDays * 50 +
      stats.achievements.reduce((acc, a) => acc + a.xp, 0);
    
    const levelInfo = calculateLevel(totalXP);

    // Generate achievements
    const achievements: Achievement[] = [
      {
        id: 'task-master',
        title: 'Task Master',
        description: 'Complete 100 tasks',
        icon: <Trophy className="w-6 h-6 text-yellow-500" />,
        progress: stats.completedTasks,
        maxProgress: 100,
        unlocked: stats.completedTasks >= 100,
        rarity: 'legendary',
        xp: 1000
      },
      {
        id: 'streak-warrior',
        title: 'Streak Warrior',
        description: 'Maintain a 7-day streak',
        icon: <Flame className="w-6 h-6 text-orange-500" />,
        progress: stats.streakDays,
        maxProgress: 7,
        unlocked: stats.streakDays >= 7,
        rarity: 'epic',
        xp: 500
      },
      {
        id: 'focus-champion',
        title: 'Focus Champion',
        description: 'Complete 10 tasks without breaks',
        icon: <Zap className="w-6 h-6 text-purple-500" />,
        progress: stats.focusStreak,
        maxProgress: 10,
        unlocked: stats.focusStreak >= 10,
        rarity: 'rare',
        xp: 300
      },
      {
        id: 'early-bird',
        title: 'Early Bird',
        description: 'Complete 5 tasks before 9 AM',
        icon: <Star className="w-6 h-6 text-blue-500" />,
        progress: stats.earlyTasks,
        maxProgress: 5,
        unlocked: stats.earlyTasks >= 5,
        rarity: 'common',
        xp: 200
      }
    ];

    // Generate daily and weekly quests
    const generateQuests = (): Quest[] => {
      const quests: Quest[] = [
        {
          id: 'daily-1',
          title: 'Quick Wins',
          description: 'Complete 3 tasks today',
          reward: 100,
          progress: tasks.filter(t => 
            t.status === 'completed' &&
            t.completedAt &&
            new Date(t.completedAt).toDateString() === new Date().toDateString()
          ).length,
          maxProgress: 3,
          type: 'daily'
        },
        {
          id: 'daily-2',
          title: 'Focus Time',
          description: 'Accumulate 2 hours of focus time',
          reward: 150,
          progress: Math.min(stats.dailyFocusTime, 120),
          maxProgress: 120,
          type: 'daily'
        },
        {
          id: 'weekly-1',
          title: 'Productivity Master',
          description: 'Complete 15 tasks this week',
          reward: 300,
          progress: stats.weeklyCompletedTasks,
          maxProgress: 15,
          type: 'weekly'
        },
        {
          id: 'special-1',
          title: 'Challenge Accepted',
          description: 'Complete 3 high-priority tasks',
          reward: 500,
          progress: tasks.filter(t => 
            t.status === 'completed' && 
            t.priority === 'high'
          ).length,
          maxProgress: 3,
          type: 'special'
        }
      ];

      return quests;
    };

    // Calculate streaks
    const calculateStreak = (): Streak => {
      const today = new Date();
      const lastActive = new Date(stats.lastActiveDate);
      const daysSinceActive = differenceInDays(today, lastActive);

      return {
        current: daysSinceActive <= 1 ? stats.streakDays : 0,
        best: stats.bestStreak,
        lastActive
      };
    };

    return {
      level: levelInfo,
      achievements,
      quests: generateQuests(),
      streak: calculateStreak(),
      totalXP
    };
  }, [tasks, stats, settings]);

  const renderRarityBadge = (rarity: Achievement['rarity']) => {
    const colors = {
      common: 'bg-gray-500',
      rare: 'bg-blue-500',
      epic: 'bg-purple-500',
      legendary: 'bg-yellow-500'
    };

    return (
      <Badge className={cn('uppercase text-xs', colors[rarity])}>
        {rarity}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Level {gamificationState.level.level}</h2>
            <p className="text-sm text-muted-foreground">
              {gamificationState.nextLevelXP} XP to next level
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-medium">{gamificationState.totalXP} XP</p>
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm">
                {gamificationState.streak.current} day streak
              </span>
            </div>
          </div>
        </div>
        <Progress value={gamificationState.level.progress} className="h-2" />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Achievements</h3>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {gamificationState.achievements.map(achievement => (
                <div
                  key={achievement.id}
                  className={cn(
                    'p-4 rounded-lg border',
                    achievement.unlocked
                      ? 'bg-primary/10 border-primary/50'
                      : 'bg-secondary/50'
                  )}
                >
                  <div className="flex items-start space-x-4">
                    <div className="shrink-0">
                      {achievement.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate">
                          {achievement.title}
                        </h4>
                        {renderRarityBadge(achievement.rarity)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {achievement.description}
                      </p>
                      <div className="mt-2">
                        <Progress
                          value={(achievement.progress / achievement.maxProgress) * 100}
                          className="h-1"
                        />
                        <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                          <span>
                            {achievement.progress} / {achievement.maxProgress}
                          </span>
                          <span>{achievement.xp} XP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Active Quests</h3>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {gamificationState.quests.map(quest => (
                <div
                  key={quest.id}
                  className={cn(
                    'p-4 rounded-lg border',
                    quest.progress >= quest.maxProgress
                      ? 'bg-green-500/10 border-green-500/50'
                      : quest.type === 'daily'
                      ? 'bg-blue-500/10 border-blue-500/50'
                      : quest.type === 'weekly'
                      ? 'bg-purple-500/10 border-purple-500/50'
                      : 'bg-yellow-500/10 border-yellow-500/50'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{quest.title}</h4>
                        <Badge
                          variant="outline"
                          className={cn(
                            'uppercase text-xs',
                            quest.type === 'daily' && 'border-blue-500 text-blue-500',
                            quest.type === 'weekly' && 'border-purple-500 text-purple-500',
                            quest.type === 'special' && 'border-yellow-500 text-yellow-500'
                          )}
                        >
                          {quest.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {quest.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">
                        +{quest.reward} XP
                      </span>
                      {quest.deadline && (
                        <p className="text-xs text-muted-foreground">
                          Ends {format(quest.deadline, 'MMM d')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2">
                    <Progress
                      value={(quest.progress / quest.maxProgress) * 100}
                      className="h-1"
                    />
                    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                      <span>
                        {quest.progress} / {quest.maxProgress}
                      </span>
                      <span>
                        {Math.round((quest.progress / quest.maxProgress) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Leaderboard</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-secondary/50 rounded-lg">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <h4 className="font-medium">Most Tasks</h4>
            <p className="text-2xl font-bold mt-1">
              {stats.completedTasks}
            </p>
          </div>
          <div className="text-center p-4 bg-secondary/50 rounded-lg">
            <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <h4 className="font-medium">Best Streak</h4>
            <p className="text-2xl font-bold mt-1">
              {gamificationState.streak.best} days
            </p>
          </div>
          <div className="text-center p-4 bg-secondary/50 rounded-lg">
            <Star className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <h4 className="font-medium">Total XP</h4>
            <p className="text-2xl font-bold mt-1">
              {gamificationState.totalXP}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
