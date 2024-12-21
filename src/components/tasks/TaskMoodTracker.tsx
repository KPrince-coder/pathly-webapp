'use client';

import { useState, useMemo } from 'react';
import { useTask } from '@/contexts/TaskContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Badge } from '@/components/ui/Badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smile,
  Frown,
  Meh,
  Sun,
  Moon,
  Battery,
  Coffee,
  Brain,
  TrendingUp
} from 'lucide-react';
import { Task } from '@/types/task';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  parseISO
} from 'date-fns';

interface MoodEntry {
  timestamp: Date;
  mood: number;
  energy: number;
  focus: number;
  note?: string;
  tags: string[];
}

interface ProductivityCorrelation {
  factor: string;
  correlation: number;
  confidence: number;
  insight: string;
}

export function TaskMoodTracker() {
  const { state } = useTask();
  const { tasks } = state;
  const [currentMood, setCurrentMood] = useState(5);
  const [currentEnergy, setCurrentEnergy] = useState(5);
  const [currentFocus, setCurrentFocus] = useState(5);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([
    {
      timestamp: new Date(),
      mood: 7,
      energy: 6,
      focus: 8,
      tags: ['morning', 'coffee']
    },
    {
      timestamp: new Date(Date.now() - 86400000),
      mood: 5,
      energy: 4,
      focus: 6,
      tags: ['afternoon', 'meeting']
    }
  ]);

  const moodAnalytics = useMemo(() => {
    // Calculate average mood metrics
    const averages = moodHistory.reduce(
      (acc, entry) => ({
        mood: acc.mood + entry.mood,
        energy: acc.energy + entry.energy,
        focus: acc.focus + entry.focus
      }),
      { mood: 0, energy: 0, focus: 0 }
    );

    const count = moodHistory.length || 1;
    
    // Analyze productivity correlations
    const analyzeCorrelations = (): ProductivityCorrelation[] => {
      const correlations: ProductivityCorrelation[] = [];

      // Mood correlation
      const highMoodTasks = tasks.filter(task => {
        const moodEntry = moodHistory.find(m =>
          isSameDay(new Date(m.timestamp), new Date(task.completedAt || task.createdAt))
        );
        return moodEntry && moodEntry.mood > 7 && task.status === 'completed';
      });

      if (highMoodTasks.length > 0) {
        correlations.push({
          factor: 'Mood',
          correlation: highMoodTasks.length / tasks.length,
          confidence: 0.85,
          insight: 'Higher mood correlates with increased task completion'
        });
      }

      // Energy level correlation
      const highEnergyTasks = tasks.filter(task => {
        const moodEntry = moodHistory.find(m =>
          isSameDay(new Date(m.timestamp), new Date(task.completedAt || task.createdAt))
        );
        return moodEntry && moodEntry.energy > 7 && task.status === 'completed';
      });

      if (highEnergyTasks.length > 0) {
        correlations.push({
          factor: 'Energy',
          correlation: highEnergyTasks.length / tasks.length,
          confidence: 0.9,
          insight: 'Higher energy levels lead to better task completion rates'
        });
      }

      // Focus correlation
      const highFocusTasks = tasks.filter(task => {
        const moodEntry = moodHistory.find(m =>
          isSameDay(new Date(m.timestamp), new Date(task.completedAt || task.createdAt))
        );
        return moodEntry && moodEntry.focus > 7 && task.status === 'completed';
      });

      if (highFocusTasks.length > 0) {
        correlations.push({
          factor: 'Focus',
          correlation: highFocusTasks.length / tasks.length,
          confidence: 0.88,
          insight: 'Better focus results in more efficient task completion'
        });
      }

      return correlations;
    };

    // Generate mood insights
    const generateInsights = () => {
      const insights = [];

      // Peak performance times
      const morningEntries = moodHistory.filter(
        entry => new Date(entry.timestamp).getHours() < 12
      );
      const afternoonEntries = moodHistory.filter(
        entry =>
          new Date(entry.timestamp).getHours() >= 12 &&
          new Date(entry.timestamp).getHours() < 17
      );
      const eveningEntries = moodHistory.filter(
        entry => new Date(entry.timestamp).getHours() >= 17
      );

      const timeAverages = {
        morning: morningEntries.reduce((acc, entry) => acc + entry.focus, 0) /
          (morningEntries.length || 1),
        afternoon: afternoonEntries.reduce((acc, entry) => acc + entry.focus, 0) /
          (afternoonEntries.length || 1),
        evening: eveningEntries.reduce((acc, entry) => acc + entry.focus, 0) /
          (eveningEntries.length || 1)
      };

      const bestTime = Object.entries(timeAverages).sort(
        ([, a], [, b]) => b - a
      )[0][0];

      insights.push({
        type: 'performance',
        message: `Your focus peaks during ${bestTime} hours`,
        icon: <Sun className="w-5 h-5" />
      });

      // Mood patterns
      const moodTrend = moodHistory
        .slice()
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .map(entry => entry.mood);

      const moodTrendPositive =
        moodTrend.length > 1 && moodTrend[moodTrend.length - 1] > moodTrend[0];

      insights.push({
        type: moodTrendPositive ? 'positive' : 'neutral',
        message: moodTrendPositive
          ? 'Your mood is trending upward'
          : 'Your mood has been stable',
        icon: moodTrendPositive ? (
          <TrendingUp className="w-5 h-5" />
        ) : (
          <Meh className="w-5 h-5" />
        )
      });

      return insights;
    };

    return {
      averages: {
        mood: averages.mood / count,
        energy: averages.energy / count,
        focus: averages.focus / count
      },
      correlations: analyzeCorrelations(),
      insights: generateInsights(),
      weeklyData: eachDayOfInterval({
        start: startOfWeek(new Date()),
        end: endOfWeek(new Date())
      }).map(date => {
        const entries = moodHistory.filter(entry =>
          isSameDay(new Date(entry.timestamp), date)
        );
        return {
          date: format(date, 'EEE'),
          mood: entries.reduce((acc, entry) => acc + entry.mood, 0) /
            (entries.length || 1),
          energy: entries.reduce((acc, entry) => acc + entry.energy, 0) /
            (entries.length || 1),
          focus: entries.reduce((acc, entry) => acc + entry.focus, 0) /
            (entries.length || 1)
        };
      })
    };
  }, [moodHistory, tasks]);

  const logMood = () => {
    setMoodHistory(prev => [
      ...prev,
      {
        timestamp: new Date(),
        mood: currentMood,
        energy: currentEnergy,
        focus: currentFocus,
        tags: []
      }
    ]);
  };

  const renderMoodIcon = (value: number) => {
    if (value >= 7) return <Smile className="w-6 h-6 text-green-500" />;
    if (value <= 4) return <Frown className="w-6 h-6 text-red-500" />;
    return <Meh className="w-6 h-6 text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h2 className="text-lg font-medium mb-4">Current Mood</h2>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Mood</label>
              {renderMoodIcon(currentMood)}
            </div>
            <Slider
              value={[currentMood]}
              min={1}
              max={10}
              step={1}
              onValueChange={([value]) => setCurrentMood(value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Energy</label>
              <Battery className="w-6 h-6" />
            </div>
            <Slider
              value={[currentEnergy]}
              min={1}
              max={10}
              step={1}
              onValueChange={([value]) => setCurrentEnergy(value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Focus</label>
              <Brain className="w-6 h-6" />
            </div>
            <Slider
              value={[currentFocus]}
              min={1}
              max={10}
              step={1}
              onValueChange={([value]) => setCurrentFocus(value)}
            />
          </div>

          <Button onClick={logMood} className="w-full">
            Log Mood
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Weekly Trends</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodAnalytics.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="#10b981"
                  name="Mood"
                />
                <Line
                  type="monotone"
                  dataKey="energy"
                  stroke="#3b82f6"
                  name="Energy"
                />
                <Line
                  type="monotone"
                  dataKey="focus"
                  stroke="#8b5cf6"
                  name="Focus"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Productivity Correlations</h3>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {moodAnalytics.correlations.map((correlation, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border bg-secondary/50"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{correlation.factor}</h4>
                    <Badge variant="outline">
                      {Math.round(correlation.correlation * 100)}% correlation
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {correlation.insight}
                  </p>
                  <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${correlation.confidence * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(correlation.confidence * 100)}% confidence
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Mood Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {moodAnalytics.insights.map((insight, index) => (
            <div
              key={index}
              className={cn(
                'p-4 rounded-lg border',
                insight.type === 'positive'
                  ? 'bg-green-500/10 border-green-500/50'
                  : insight.type === 'negative'
                  ? 'bg-red-500/10 border-red-500/50'
                  : 'bg-secondary/50'
              )}
            >
              <div className="flex items-start space-x-3">
                <div className="shrink-0">{insight.icon}</div>
                <p className="text-sm">{insight.message}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
