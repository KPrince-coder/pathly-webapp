'use client';

import { useState, useEffect } from 'react';
import { VisionGoal, VisionGoalCategory } from '@/types/vision';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Select } from '@/components/ui/Select';
import { useSupabase } from '@/hooks/useSupabase';
import { format } from 'date-fns';

export function VisionGoalList() {
  const [goals, setGoals] = useState<VisionGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<VisionGoalCategory | 'All'>('All');
  const supabase = useSupabase();

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('vision_goals')
        .select(`
          *,
          vision_milestones (
            id,
            title,
            progress,
            status
          )
        `);

      if (error) throw error;

      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching vision goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (goal: VisionGoal) => {
    if (!goal.vision_milestones?.length) return 0;
    const totalProgress = goal.vision_milestones.reduce(
      (sum, milestone) => sum + milestone.progress,
      0
    );
    return Math.round(totalProgress / goal.vision_milestones.length);
  };

  const filteredGoals = filter === 'All'
    ? goals
    : goals.filter(goal => goal.category === filter);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Select
          value={filter}
          onChange={(value) => setFilter(value as VisionGoalCategory | 'All')}
          options={[
            { value: 'All', label: 'All Categories' },
            { value: 'Career', label: 'Career' },
            { value: 'Personal', label: 'Personal' },
            { value: 'Relationships', label: 'Relationships' },
            { value: 'Financial', label: 'Financial' },
            { value: 'Health', label: 'Health' },
            { value: 'Education', label: 'Education' },
            { value: 'Other', label: 'Other' },
          ]}
          className="w-48"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGoals.map((goal) => (
          <Card key={goal.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {goal.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Target: {format(new Date(goal.targetDate), 'MMM dd, yyyy')}
                </p>
              </div>
              <Badge variant={goal.status === 'Completed' ? 'success' : 'default'}>
                {goal.status}
              </Badge>
            </div>

            <p className="text-gray-600 text-sm mb-4">
              {goal.description}
            </p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{calculateProgress(goal)}%</span>
              </div>
              <Progress value={calculateProgress(goal)} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">{goal.category}</Badge>
              {goal.isSmartGoal && (
                <Badge variant="outline" className="bg-primary-50">
                  SMART Goal
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
