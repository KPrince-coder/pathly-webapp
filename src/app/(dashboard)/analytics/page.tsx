'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useAuth } from '@/hooks/useAuth';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function AnalyticsPage() {
  const { user, isLoading } = useAuth();
  const [timeRange, setTimeRange] = useState('week');

  if (isLoading) {
    return <LoadingScreen message="Loading analytics..." />;
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Analytics"
        text="Track your productivity and progress over time."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <h3 className="text-lg font-medium">Focus Time</h3>
          <p className="mt-2 text-3xl font-bold">12.5 hrs</p>
          <p className="text-sm text-muted-foreground">This week</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium">Tasks Completed</h3>
          <p className="mt-2 text-3xl font-bold">24</p>
          <p className="text-sm text-muted-foreground">This week</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium">Productivity Score</h3>
          <p className="mt-2 text-3xl font-bold">85%</p>
          <p className="text-sm text-muted-foreground">Average this week</p>
        </Card>
      </div>

      <div className="mt-8">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Activity Timeline</h3>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Activity chart will be implemented here
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
