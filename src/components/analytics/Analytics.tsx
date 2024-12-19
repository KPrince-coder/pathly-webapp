import { Goal, Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { format, subDays } from 'date-fns';

interface AnalyticsProps {
  goals: Goal[];
  tasks: Task[];
}

export function Analytics({ goals, tasks }: AnalyticsProps) {
  // Calculate goal completion rate over time
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), i);
    const completedGoals = goals.filter(
      (goal) =>
        goal.status === 'Completed' &&
        new Date(goal.updated_at).toDateString() === date.toDateString()
    ).length;

    return {
      x: format(date, 'MMM dd'),
      y: completedGoals,
    };
  }).reverse();

  // Calculate task status distribution
  const taskStatusData = [
    {
      id: 'Todo',
      label: 'Todo',
      value: tasks.filter((task) => task.status === 'Todo').length,
    },
    {
      id: 'In Progress',
      label: 'In Progress',
      value: tasks.filter((task) => task.status === 'In Progress').length,
    },
    {
      id: 'Done',
      label: 'Done',
      value: tasks.filter((task) => task.status === 'Done').length,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Goal Completion Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveLine
              data={[
                {
                  id: 'completed goals',
                  data: last30Days,
                },
              ]}
              margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
              xScale={{ type: 'point' }}
              yScale={{
                type: 'linear',
                min: 0,
                max: 'auto',
              }}
              curve="monotoneX"
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
              }}
              pointSize={10}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              pointLabelYOffset={-12}
              enableArea={true}
              areaOpacity={0.15}
              useMesh={true}
              colors={['#2563eb']}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsivePie
              data={taskStatusData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              borderWidth={1}
              borderColor={{
                from: 'color',
                modifiers: [['darker', 0.2]],
              }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#333333"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{
                from: 'color',
                modifiers: [['darker', 2]],
              }}
              colors={['#94a3b8', '#2563eb', '#22c55e']}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Goal Categories Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Personal', 'Work', 'Health', 'Education'].map((category) => {
              const categoryGoals = goals.filter(
                (goal) => goal.category === category
              );
              const completed = categoryGoals.filter(
                (goal) => goal.status === 'Completed'
              ).length;
              const total = categoryGoals.length;
              const percentage = total > 0 ? (completed / total) * 100 : 0;

              return (
                <div
                  key={category}
                  className="bg-gray-50 p-4 rounded-lg text-center"
                >
                  <h4 className="font-medium text-gray-900">{category}</h4>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {percentage.toFixed(0)}%
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {completed} of {total} completed
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
