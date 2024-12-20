'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { VisionMilestoneList } from './VisionMilestoneList';
import { VisionReflectionJournal } from './VisionReflectionJournal';
import { VisionMentorship } from './VisionMentorship';
import { colors } from '@/styles/colors';
import { format, differenceInDays } from 'date-fns';
import {
  FiCalendar,
  FiClock,
  FiFlag,
  FiTrendingUp,
  FiUsers,
  FiEdit3,
  FiTrash2,
} from 'react-icons/fi';
import { VisionGoal } from '@/types/vision';
import confetti from 'canvas-confetti';

interface VisionGoalDetailProps {
  goalId: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function VisionGoalDetail({
  goalId,
  onEdit,
  onDelete,
}: VisionGoalDetailProps) {
  const [goal, setGoal] = useState<VisionGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const supabase = useSupabase();

  useEffect(() => {
    fetchGoal();
  }, [goalId]);

  const fetchGoal = async () => {
    try {
      const { data, error } = await supabase
        .from('vision_goals')
        .select(
          `
          *,
          vision_milestones (
            id,
            title,
            progress,
            status
          ),
          vision_reflections (
            id,
            content,
            mood,
            reflection_date
          )
        `
        )
        .eq('id', goalId)
        .single();

      if (error) throw error;
      setGoal(data);

      // Trigger confetti if goal is completed
      if (data.status === 'Completed') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (error) {
      console.error('Error fetching goal:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    if (!goal?.vision_milestones?.length) return 0;
    const totalProgress = goal.vision_milestones.reduce(
      (sum, milestone) => sum + milestone.progress,
      0
    );
    return Math.round(totalProgress / goal.vision_milestones.length);
  };

  const calculateTimeRemaining = () => {
    if (!goal) return '';
    const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());
    if (daysLeft < 0) return 'Overdue';
    if (daysLeft === 0) return 'Due today';
    if (daysLeft < 30) return `${daysLeft} days left`;
    const months = Math.floor(daysLeft / 30);
    return `${months} months left`;
  };

  const getCategoryColor = () => {
    if (!goal) return colors.neutral[500];
    return colors[goal.category.toLowerCase() as keyof typeof colors] || colors.other;
  };

  if (loading) {
    return <div>Loading goal details...</div>;
  }

  if (!goal) {
    return <div>Goal not found</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-white to-gray-50">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900">{goal.title}</h2>
              <Badge
                style={{ backgroundColor: getCategoryColor(), color: 'white' }}
              >
                {goal.category}
              </Badge>
            </div>
            <p className="text-gray-600 mt-2">{goal.description}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" onClick={onEdit}>
              <FiEdit3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={onDelete}>
              <FiTrash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card className="p-4 bg-white">
            <div className="flex items-center space-x-2 text-gray-600">
              <FiFlag className="h-4 w-4" />
              <span>Status</span>
            </div>
            <Badge
              className="mt-2"
              variant={goal.status === 'Completed' ? 'success' : 'default'}
            >
              {goal.status}
            </Badge>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center space-x-2 text-gray-600">
              <FiCalendar className="h-4 w-4" />
              <span>Target Date</span>
            </div>
            <p className="mt-2 font-medium">
              {format(new Date(goal.targetDate), 'MMM dd, yyyy')}
            </p>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center space-x-2 text-gray-600">
              <FiClock className="h-4 w-4" />
              <span>Time Remaining</span>
            </div>
            <p className="mt-2 font-medium">{calculateTimeRemaining()}</p>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center space-x-2 text-gray-600">
              <FiTrendingUp className="h-4 w-4" />
              <span>Progress</span>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>{calculateProgress()}%</span>
              </div>
              <Progress value={calculateProgress()} />
            </div>
          </Card>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="reflections">Journal</TabsTrigger>
          <TabsTrigger value="mentorship">Mentorship</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="p-6">
            {goal.isSmartGoal && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  SMART Goal Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700">Specific</h4>
                    <p className="text-gray-600 mt-1">
                      {goal.smartDetails?.specific}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Measurable</h4>
                    <p className="text-gray-600 mt-1">
                      Target: {goal.smartDetails?.measurable?.targetValue}{' '}
                      {goal.smartDetails?.measurable?.unit}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Achievable Steps</h4>
                    <ul className="list-disc list-inside text-gray-600 mt-1">
                      {goal.smartDetails?.achievable?.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Relevant</h4>
                    <p className="text-gray-600 mt-1">
                      {goal.smartDetails?.relevant}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {goal.inspirationMedia?.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Vision Board
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {goal.inspirationMedia.map((media, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden"
                    >
                      {media.type === 'image' ? (
                        <img
                          src={media.url}
                          alt={media.caption || ''}
                          className="object-cover w-full h-full"
                        />
                      ) : media.type === 'quote' ? (
                        <div className="flex items-center justify-center h-full p-4 bg-gradient-to-br from-primary-100 to-primary-50">
                          <p className="text-sm text-center font-medium text-primary-900">
                            {media.caption}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="milestones">
          <VisionMilestoneList goalId={goalId} onUpdate={fetchGoal} />
        </TabsContent>

        <TabsContent value="reflections">
          <VisionReflectionJournal goalId={goalId} />
        </TabsContent>

        <TabsContent value="mentorship">
          <VisionMentorship goalId={goalId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
