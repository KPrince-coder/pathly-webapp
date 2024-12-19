import { useState } from 'react';
import { Task } from '@/types';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Select, SelectOption } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
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
  // Add more mock tasks here
];

const priorityOptions: SelectOption[] = [
  { value: 'All', label: 'All Priorities' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];

const statusOptions: SelectOption[] = [
  { value: 'All', label: 'All Status' },
  { value: 'Todo', label: 'Todo' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Done', label: 'Done' },
];

export default function TasksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState(priorityOptions[0]);
  const [selectedStatus, setSelectedStatus] = useState(statusOptions[0]);

  const filteredTasks = mockTasks.filter((task) => {
    const priorityMatch =
      selectedPriority.value === 'All' ||
      task.priority === selectedPriority.value;
    const statusMatch =
      selectedStatus.value === 'All' || task.status === selectedStatus.value;
    return priorityMatch && statusMatch;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <FiPlus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-64">
            <Select
              label="Priority"
              value={selectedPriority}
              onChange={setSelectedPriority}
              options={priorityOptions}
            />
          </div>
          <div className="w-full md:w-64">
            <Select
              label="Status"
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={statusOptions}
            />
          </div>
        </div>
      </Card>

      <AnimatePresence mode="wait">
        {filteredTasks.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredTasks.map((task) => (
              <motion.div key={task.id} variants={itemVariants}>
                <TaskCard
                  task={task}
                  onClick={() => {
                    // Handle task click
                    console.log('Task clicked:', task);
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <EmptyState
              title="No tasks found"
              description={
                selectedPriority.value === 'All' && selectedStatus.value === 'All'
                  ? "You haven't created any tasks yet. Start by creating your first task!"
                  : 'No tasks match your current filters. Try adjusting your filters or create a new task.'
              }
              image="tasks"
              action={{
                label: 'Create Task',
                onClick: () => setIsModalOpen(true),
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Task"
      >
        <TaskForm
          onSubmit={(data) => {
            console.log('New task:', data);
            setIsModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
