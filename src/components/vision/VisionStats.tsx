'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card } from '@/components/ui/Card';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { VisionGoalCategory, VisionGoalStatus } from '@/types/vision';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Stats {
  totalGoals: number;
  completedGoals: number;
  inProgressGoals: number;
  categoryBreakdown: Record<VisionGoalCategory, number>;
  statusBreakdown: Record<VisionGoalStatus, number>;
  averageProgress: number;
}

interface VisionStatsProps {
  className?: string;
}

export function VisionStats({ className = '' }: VisionStatsProps) {
  const [stats, setStats] = useState<Stats>({
    totalGoals: 0,
    completedGoals: 0,
    inProgressGoals: 0,
    categoryBreakdown: {
      Career: 0,
      Personal: 0,
      Relationships: 0,
      Financial: 0,
      Health: 0,
      Education: 0,
      Other: 0,
    },
    statusBreakdown: {
      'Not Started': 0,
      'In Progress': 0,
      Completed: 0,
      'On Hold': 0,
    },
    averageProgress: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = useSupabase();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: goals, error } = await supabase
        .from('vision_goals')
        .select(`
          *,
          vision_milestones (
            progress
          )
        `);

      if (error) throw error;

      if (goals) {
        const newStats = {
          totalGoals: goals.length,
          completedGoals: goals.filter((g) => g.status === 'Completed').length,
          inProgressGoals: goals.filter((g) => g.status === 'In Progress').length,
          categoryBreakdown: goals.reduce((acc, goal) => {
            acc[goal.category as VisionGoalCategory] = (acc[goal.category as VisionGoalCategory] || 0) + 1;
            return acc;
          }, {} as Record<VisionGoalCategory, number>),
          statusBreakdown: goals.reduce((acc, goal) => {
            acc[goal.status as VisionGoalStatus] = (acc[goal.status as VisionGoalStatus] || 0) + 1;
            return acc;
          }, {} as Record<VisionGoalStatus, number>),
          averageProgress: goals.reduce((sum, goal) => {
            const milestoneProgress = goal.vision_milestones?.reduce((acc, m) => acc + m.progress, 0) || 0;
            const avgProgress = goal.vision_milestones?.length
              ? milestoneProgress / goal.vision_milestones.length
              : 0;
            return sum + avgProgress;
          }, 0) / (goals.length || 1),
        };

        setStats(newStats);
      }
    } catch (error) {
      console.error('Error fetching vision stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryChartData = {
    labels: Object.keys(stats.categoryBreakdown),
    datasets: [
      {
        data: Object.values(stats.categoryBreakdown),
        backgroundColor: [
          '#4F46E5', // Career
          '#10B981', // Personal
          '#F59E0B', // Relationships
          '#3B82F6', // Financial
          '#EC4899', // Health
          '#8B5CF6', // Education
          '#6B7280', // Other
        ],
        borderWidth: 1,
      },
    ],
  };

  const statusChartData = {
    labels: Object.keys(stats.statusBreakdown),
    datasets: [
      {
        label: 'Goals by Status',
        data: Object.values(stats.statusBreakdown),
        backgroundColor: [
          '#D1D5DB', // Not Started
          '#60A5FA', // In Progress
          '#34D399', // Completed
          '#F59E0B', // On Hold
        ],
      },
    ],
  };

  if (loading) {
    return <div>Loading stats...</div>;
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Overview</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Total Goals</p>
            <p className="text-2xl font-semibold">{stats.totalGoals}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-semibold text-green-600">
              {stats.completedGoals}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-semibold text-blue-600">
              {stats.inProgressGoals}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Average Progress
        </h3>
        <div className="flex items-center justify-center h-[200px]">
          <div className="relative">
            <Doughnut
              data={{
                labels: ['Progress', 'Remaining'],
                datasets: [
                  {
                    data: [stats.averageProgress, 100 - stats.averageProgress],
                    backgroundColor: ['#10B981', '#E5E7EB'],
                    borderWidth: 0,
                  },
                ],
              }}
              options={{
                cutout: '70%',
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-3xl font-semibold">
                {Math.round(stats.averageProgress)}%
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Goals by Category
        </h3>
        <div className="h-[200px]">
          <Doughnut
            data={categoryChartData}
            options={{
              plugins: {
                legend: {
                  position: 'right' as const,
                  labels: {
                    boxWidth: 12,
                  },
                },
              },
            }}
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Goals by Status
        </h3>
        <div className="h-[200px]">
          <Bar
            data={statusChartData}
            options={{
              indexAxis: 'y' as const,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                x: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>
      </Card>
    </div>
  );
}
