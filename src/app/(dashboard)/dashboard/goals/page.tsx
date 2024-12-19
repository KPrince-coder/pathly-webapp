import { useState } from 'react';
import { Goal } from '@/types';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalForm } from '@/components/goals/GoalForm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Select, SelectOption } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus } from 'react-icons/fi';

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
  // Add more mock goals here
];

const categoryOptions: SelectOption[] = [
  { value: 'All', label: 'All Categories' },
  { value: 'Personal', label: 'Personal' },
  { value: 'Work', label: 'Work' },
  { value: 'Health', label: 'Health' },
  { value: 'Education', label: 'Education' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Social', label: 'Social' },
  { value: 'Other', label: 'Other' },
];

const statusOptions: SelectOption[] = [
  { value: 'All', label: 'All Status' },
  { value: 'Not Started', label: 'Not Started' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
];

export default function GoalsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categoryOptions[0]);
  const [selectedStatus, setSelectedStatus] = useState(statusOptions[0]);

  const filteredGoals = mockGoals.filter((goal) => {
    const categoryMatch =
      selectedCategory.value === 'All' ||
      goal.category === selectedCategory.value;
    const statusMatch =
      selectedStatus.value === 'All' || goal.status === selectedStatus.value;
    return categoryMatch && statusMatch;
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
        <h1 className="text-2xl font-semibold">Goals</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <FiPlus className="w-4 h-4 mr-2" />
          Add Goal
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-64">
            <Select
              label="Category"
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categoryOptions}
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
        {filteredGoals.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredGoals.map((goal) => (
              <motion.div key={goal.id} variants={itemVariants}>
                <GoalCard
                  goal={goal}
                  onClick={() => {
                    // Handle goal click
                    console.log('Goal clicked:', goal);
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
              title="No goals found"
              description={
                selectedCategory.value === 'All' && selectedStatus.value === 'All'
                  ? "You haven't created any goals yet. Start by creating your first goal!"
                  : 'No goals match your current filters. Try adjusting your filters or create a new goal.'
              }
              image="goals"
              action={{
                label: 'Create Goal',
                onClick: () => setIsModalOpen(true),
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Goal"
      >
        <GoalForm
          onSubmit={(data) => {
            console.log('New goal:', data);
            setIsModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
