'use client';

import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { colors } from '@/styles/colors';
import { format, differenceInDays, addDays } from 'date-fns';
import Chart from 'chart.js/auto';

interface DataPoint {
  date: string;
  progress: number;
}

interface VisionProgressChartProps {
  goalId: string;
  startDate: string;
  targetDate: string;
  progressData: DataPoint[];
  milestones: Array<{
    title: string;
    target_date: string;
    progress: number;
  }>;
}

export function VisionProgressChart({
  goalId,
  startDate,
  targetDate,
  progressData,
  milestones,
}: VisionProgressChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Calculate ideal progress line
    const totalDays = differenceInDays(new Date(targetDate), new Date(startDate));
    const idealProgressLine = Array.from({ length: totalDays + 1 }, (_, i) => ({
      date: format(addDays(new Date(startDate), i), 'yyyy-MM-dd'),
      progress: (i / totalDays) * 100,
    }));

    // Create the chart
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Actual Progress',
            data: progressData.map((point) => ({
              x: point.date,
              y: point.progress,
            })),
            borderColor: colors.primary[500],
            backgroundColor: colors.primary[100],
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Ideal Progress',
            data: idealProgressLine.map((point) => ({
              x: point.date,
              y: point.progress,
            })),
            borderColor: colors.neutral[300],
            borderDash: [5, 5],
            fill: false,
          },
          {
            label: 'Milestones',
            data: milestones.map((milestone) => ({
              x: milestone.target_date,
              y: milestone.progress,
            })),
            backgroundColor: colors.warning[500],
            borderColor: colors.warning[600],
            pointStyle: 'star',
            pointRadius: 8,
            showLine: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const datasetLabel = context.dataset.label || '';
                const value = context.parsed.y;
                if (context.datasetIndex === 2) {
                  // Milestone tooltip
                  const milestone = milestones[context.dataIndex];
                  return `${milestone.title}: ${value.toFixed(1)}%`;
                }
                return `${datasetLabel}: ${value.toFixed(1)}%`;
              },
            },
          },
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'MMM d',
              },
            },
            title: {
              display: true,
              text: 'Date',
            },
          },
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Progress (%)',
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [progressData, milestones, startDate, targetDate]);

  return (
    <Card className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-[400px]"
      >
        <canvas ref={chartRef} />
      </motion.div>
    </Card>
  );
}
