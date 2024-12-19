import { useState } from 'react';
import { Task } from '@/types';
import { Calendar } from '@/components/calendar/Calendar';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FiPlus } from 'react-icons/fi';

// Temporary mock data
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
  {
    id: '3',
    goal_id: '1',
    title: 'Project Meeting',
    description: 'Team sync-up for the new feature',
    priority: 'High',
    deadline: new Date(new Date().setHours(14, 0, 0, 0)),
    status: 'Todo',
    created_at: new Date(),
    updated_at: new Date(),
  },
];

export default function CalendarPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <FiPlus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <Calendar
          tasks={mockTasks}
          onTaskClick={(task) => {
            setSelectedTask(task);
            setIsModalOpen(true);
          }}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        title={selectedTask ? 'Edit Task' : 'Add New Task'}
      >
        <TaskForm
          initialData={selectedTask || undefined}
          onSubmit={(data) => {
            console.log(selectedTask ? 'Update task:' : 'New task:', data);
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
        />
      </Modal>
    </div>
  );
}
