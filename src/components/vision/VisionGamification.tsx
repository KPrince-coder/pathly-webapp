'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  FiAward,
  FiTrendingUp,
  FiZap,
  FiStar,
  FiTarget,
  FiClock,
  FiFlag,
} from 'react-icons/fi';
import { colors } from '@/styles/colors';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  progress: number;
  total: number;
}

interface Streak {
  current: number;
  longest: number;
  lastUpdated: string;
}

interface VisionGamificationProps {
  userId: string;
  goalId: string;
}

export function VisionGamification({ userId, goalId }: VisionGamificationProps) {
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streak, setStreak] = useState<Streak>({
    current: 0,
    longest: 0,
    lastUpdated: new Date().toISOString(),
  });
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  const supabase = useSupabase();

  useEffect(() => {
    loadGamificationData();
    checkDailyStreak();
  }, [userId, goalId]);

  const loadGamificationData = async () => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('vision_gamification')
        .select('level, experience, achievements, streak')
        .eq('user_id', userId)
        .single();

      if (userError) throw userError;

      if (userData) {
        setLevel(userData.level);
        setExperience(userData.experience);
        setAchievements(userData.achievements);
        setStreak(userData.streak);
      }
    } catch (error) {
      console.error('Error loading gamification data:', error);
    }
  };

  const checkDailyStreak = async () => {
    const lastUpdate = new Date(streak.lastUpdated);
    const today = new Date();
    const diffDays = Math.floor(
      (today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      // Streak continues
      const newStreak = {
        current: streak.current + 1,
        longest: Math.max(streak.longest, streak.current + 1),
        lastUpdated: today.toISOString(),
      };
      await updateStreak(newStreak);
      if (newStreak.current % 7 === 0) {
        // Weekly streak achievement
        awardExperience(100);
        triggerConfetti();
      }
    } else if (diffDays > 1) {
      // Streak broken
      await updateStreak({
        current: 0,
        longest: streak.longest,
        lastUpdated: today.toISOString(),
      });
    }
  };

  const updateStreak = async (newStreak: Streak) => {
    try {
      const { error } = await supabase
        .from('vision_gamification')
        .update({ streak: newStreak })
        .eq('user_id', userId);

      if (error) throw error;
      setStreak(newStreak);
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const awardExperience = async (points: number) => {
    const newExperience = experience + points;
    const experienceToLevel = level * 1000;
    let newLevel = level;

    if (newExperience >= experienceToLevel) {
      newLevel = level + 1;
      triggerLevelUp();
    }

    try {
      const { error } = await supabase.from('vision_gamification').update({
        level: newLevel,
        experience: newExperience % experienceToLevel,
      });

      if (error) throw error;
      setLevel(newLevel);
      setExperience(newExperience % experienceToLevel);
    } catch (error) {
      console.error('Error awarding experience:', error);
    }
  };

  const triggerLevelUp = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 45,
      origin: { y: 0.7 },
    });
  };

  const unlockAchievement = async (achievementId: string) => {
    const achievement = achievements.find((a) => a.id === achievementId);
    if (!achievement || achievement.unlocked) return;

    try {
      const updatedAchievements = achievements.map((a) =>
        a.id === achievementId ? { ...a, unlocked: true } : a
      );

      const { error } = await supabase
        .from('vision_gamification')
        .update({ achievements: updatedAchievements })
        .eq('user_id', userId);

      if (error) throw error;

      setAchievements(updatedAchievements);
      setUnlockedAchievement(achievement);
      setShowUnlockAnimation(true);
      awardExperience(achievement.points);
      triggerConfetti();

      setTimeout(() => {
        setShowUnlockAnimation(false);
        setUnlockedAchievement(null);
      }, 3000);
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-xl font-bold text-primary-700">
                {level}
              </span>
            </div>
            <motion.div
              className="absolute -top-1 -right-1 w-6 h-6 bg-warning-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <FiStar className="h-4 w-4" />
            </motion.div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Level {level}</h3>
            <div className="flex items-center space-x-2">
              <Progress
                value={(experience / (level * 1000)) * 100}
                className="w-32 h-2"
              />
              <span className="text-sm text-gray-500">
                {experience}/{level * 1000} XP
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {streak.current}
            </div>
            <div className="text-sm text-gray-500">Day Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning-600">
              {streak.longest}
            </div>
            <div className="text-sm text-gray-500">Best Streak</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {achievements.map((achievement) => (
          <motion.div
            key={achievement.id}
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-lg border-2 ${
              achievement.unlocked
                ? 'border-success-500 bg-success-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    achievement.unlocked
                      ? 'bg-success-100'
                      : 'bg-gray-100'
                  }`}
                >
                  {achievement.icon === 'star' && (
                    <FiStar
                      className={`h-5 w-5 ${
                        achievement.unlocked
                          ? 'text-success-600'
                          : 'text-gray-400'
                      }`}
                    />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {achievement.title}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {achievement.description}
                  </p>
                </div>
              </div>
              <Badge
                variant={achievement.unlocked ? 'success' : 'secondary'}
                className="ml-2"
              >
                {achievement.points} XP
              </Badge>
            </div>
            {!achievement.unlocked && (
              <div className="mt-3">
                <Progress
                  value={(achievement.progress / achievement.total) * 100}
                  className="h-1"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    {achievement.progress}/{achievement.total}
                  </span>
                  <span className="text-xs text-gray-500">
                    {Math.round(
                      (achievement.progress / achievement.total) * 100
                    )}
                    %
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showUnlockAnimation && unlockedAchievement && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-lg border-2 border-success-500"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center">
                <FiAward className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <h4 className="font-medium text-success-900">
                  Achievement Unlocked!
                </h4>
                <p className="text-sm text-success-600">
                  {unlockedAchievement.title}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
