"use client";

import { Stats } from "@/components/dashboard/Stats";
import { GoalCard } from "@/components/goals/GoalCard";
import { TaskCard } from "@/components/tasks/TaskCard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import { GoalForm } from "@/components/goals/GoalForm";
import { TaskForm } from "@/components/tasks/TaskForm";

// Temporary mock data
const mockGoals = [
  {
    id: "1",
    user_id: "1",
    title: "Learn Next.js",
    description: "Master Next.js and build modern web applications",
    category: "Education",
    priority: "High",
    deadline: "2024-12-31T00:00:00.000Z",
    progress: 45,
    status: "In Progress",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    user_id: "1",
    title: "Exercise Regularly",
    description: "Work out at least 3 times a week",
    category: "Health",
    priority: "Medium",
    deadline: "2024-12-31T00:00:00.000Z",
    progress: 75,
    status: "In Progress",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  },
];

const mockTasks = [
  {
    id: "1",
    goal_id: "1",
    user_id: "1",
    title: "Complete Next.js Tutorial",
    description: "Go through the official Next.js documentation",
    priority: "High",
    deadline: "2024-01-01T00:00:00.000Z",
    status: "Todo",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    goal_id: "2",
    user_id: "1",
    title: "Morning Jog",
    description: "30 minutes jogging in the park",
    priority: "Medium",
    deadline: "2024-01-01T00:00:00.000Z",
    status: "Todo",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  },
];

export default function DashboardPage() {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Stats goals={mockGoals} tasks={mockTasks} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Goals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Goals</CardTitle>
            <Button size="sm" onClick={() => setIsGoalModalOpen(true)}>
              <FiPlus className="w-4 h-4 mr-1" />
              Add Goal
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today's Tasks</CardTitle>
            <Button size="sm" onClick={() => setIsTaskModalOpen(true)}>
              <FiPlus className="w-4 h-4 mr-1" />
              Add Task
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Add Goal Modal */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title="Add New Goal"
      >
        <GoalForm
          onSubmit={(data) => {
            console.log("New goal:", data);
            setIsGoalModalOpen(false);
          }}
        />
      </Modal>

      {/* Add Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Add New Task"
      >
        <TaskForm
          onSubmit={(data) => {
            console.log("New task:", data);
            setIsTaskModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
