'use client';

import { useState, useEffect } from 'react';
import { VisionGoal } from '@/types/vision';
import { useSupabase } from '@/hooks/useSupabase';
import { format, differenceInMonths } from 'date-fns';
import { Badge } from '@/components/ui/Badge';

export function VisionTimeline() {
  const [goals, setGoals] = useState<VisionGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useSupabase();

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('vision_goals')
        .select('*')
        .order('target_date', { ascending: true });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching vision goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTimelinePosition = (targetDate: string) => {
    const now = new Date();
    const months = differenceInMonths(new Date(targetDate), now);
    // Cap at 5 years (60 months) for visualization
    const position = Math.min(Math.max(months, 0), 60) / 60 * 100;
    return `${position}%`;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="relative">
      {/* Timeline axis */}
      <div className="absolute left-0 right-0 h-1 bg-gray-200 top-1/2 transform -translate-y-1/2">
        {/* Time markers */}
        {[0, 1, 2, 3, 4, 5].map((year) => (
          <div
            key={year}
            className="absolute transform -translate-x-1/2"
            style={{ left: `${(year / 5) * 100}%` }}
          >
            <div className="h-3 w-1 bg-gray-300 mb-2" />
            <span className="text-sm text-gray-500">
              {format(new Date().setFullYear(new Date().getFullYear() + year), 'yyyy')}
            </span>
          </div>
        ))}
      </div>

      {/* Goals */}
      <div className="relative pt-20 pb-20">
        {goals.map((goal, index) => {
          const position = calculateTimelinePosition(goal.targetDate);
          const isTop = index % 2 === 0;

          return (
            <div
              key={goal.id}
              className={`absolute transform -translate-x-1/2 ${
                isTop ? '-translate-y-full top-[45%]' : 'translate-y-0 top-[55%]'
              }`}
              style={{ left: position }}
            >
              <div
                className={`flex flex-col ${
                  isTop ? 'items-end mb-4' : 'items-start mt-4'
                }`}
              >
                <div className="w-64 bg-white rounded-lg shadow-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900 truncate">
                      {goal.title}
                    </h3>
                    <Badge variant={goal.status === 'Completed' ? 'success' : 'default'}>
                      {goal.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    {format(new Date(goal.targetDate), 'MMM dd, yyyy')}
                  </p>
                  <Badge variant="outline">{goal.category}</Badge>
                </div>
                <div
                  className={`h-[${isTop ? '20px' : '20px'}] w-px bg-gray-300 ${
                    isTop ? 'mt-0' : 'mb-0'
                  }`}
                />
                <div className="w-3 h-3 rounded-full bg-primary border-2 border-white shadow-sm" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
