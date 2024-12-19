import { Goal, Task } from '@/types';
import { Analytics } from '@/components/analytics/Analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';

// Temporary mock data
const mockGoals: Goal[] = [
  {
    id: '1',
    user_id: '1',
    title: 'Learn Next.js',
    description: 'Master Next.js and build modern web applications',
    category: 'Education',
    priority: 'High',
    deadline: new Date('2024-12-31'),
    progress: 45,
    status: 'In Progress',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '2',
    user_id: '1',
    title: 'Exercise Regularly',
    description: 'Work out at least 3 times a week',
    category: 'Health',
    priority: 'Medium',
    deadline: new Date('2024-12-31'),
    progress: 75,
    status: 'In Progress',
    created_at: new Date(),
    updated_at: new Date(),
  },
];

const mockTasks: Task[] = [
  {
    id: '1',
    goal_id: '1',
    title: 'Complete Next.js Tutorial',
    description: 'Go through the official Next.js documentation',
    priority: 'High',
    deadline: new Date(),
    status: 'Todo',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '2',
    goal_id: '2',
    title: 'Morning Jog',
    description: '30 minutes jogging in the park',
    priority: 'Medium',
    deadline: new Date(),
    status: 'Todo',
    created_at: new Date(),
    updated_at: new Date(),
  },
];

export default function AnalyticsPage() {
  // Calculate overall progress
  const totalGoals = mockGoals.length;
  const completedGoals = mockGoals.filter(
    (goal) => goal.status === 'Completed'
  ).length;
  const overallProgress = Math.round((completedGoals / totalGoals) * 100);

  // Calculate task completion rate
  const totalTasks = mockTasks.length;
  const completedTasks = mockTasks.filter(
    (task) => task.status === 'Done'
  ).length;
  const taskCompletionRate = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Progress</span>
                <span>{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Completed</span>
                <span>{taskCompletionRate}%</span>
              </div>
              <Progress value={taskCompletionRate} variant="success" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Analytics goals={mockGoals} tasks={mockTasks} />
    </div>
  );
}
