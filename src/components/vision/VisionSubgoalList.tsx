'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { DatePicker } from '@/components/ui/DatePicker';
import { Draggable } from '@/components/ui/Draggable';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isAfter, isBefore } from 'date-fns';
import {
  FiPlus,
  FiCheck,
  FiClock,
  FiAlertCircle,
  FiTrash2,
  FiEdit2,
  FiMoreVertical,
} from 'react-icons/fi';
import { colors } from '@/styles/colors';

interface Subgoal {
  id: string;
  title: string;
  description?: string;
  target_date: string;
  progress: number;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  priority: 'High' | 'Medium' | 'Low';
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  due_date?: string;
  status: 'Todo' | 'In Progress' | 'Done';
  priority: 'High' | 'Medium' | 'Low';
}

interface VisionSubgoalListProps {
  goalId: string;
  onUpdate?: () => void;
}

export function VisionSubgoalList({ goalId, onUpdate }: VisionSubgoalListProps) {
  const [subgoals, setSubgoals] = useState<Subgoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSubgoal, setEditingSubgoal] = useState<string | null>(null);
  const [showNewSubgoal, setShowNewSubgoal] = useState(false);
  const [newSubgoal, setNewSubgoal] = useState<Partial<Subgoal>>({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Not Started',
    progress: 0,
  });
  const supabase = useSupabase();

  useEffect(() => {
    fetchSubgoals();
  }, [goalId]);

  const fetchSubgoals = async () => {
    try {
      const { data: subgoalData, error: subgoalError } = await supabase
        .from('vision_milestones')
        .select(`
          *,
          tasks:vision_tasks(*)
        `)
        .eq('vision_goal_id', goalId)
        .order('created_at', { ascending: true });

      if (subgoalError) throw subgoalError;
      setSubgoals(subgoalData || []);
    } catch (error) {
      console.error('Error fetching subgoals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubgoal = async () => {
    try {
      const { error } = await supabase.from('vision_milestones').insert([
        {
          vision_goal_id: goalId,
          title: newSubgoal.title,
          description: newSubgoal.description,
          target_date: newSubgoal.target_date,
          priority: newSubgoal.priority,
          status: 'Not Started',
          progress: 0,
        },
      ]);

      if (error) throw error;
      setShowNewSubgoal(false);
      setNewSubgoal({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'Not Started',
        progress: 0,
      });
      fetchSubgoals();
      onUpdate?.();
    } catch (error) {
      console.error('Error adding subgoal:', error);
    }
  };

  const handleUpdateSubgoal = async (id: string, updates: Partial<Subgoal>) => {
    try {
      const { error } = await supabase
        .from('vision_milestones')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setEditingSubgoal(null);
      fetchSubgoals();
      onUpdate?.();
    } catch (error) {
      console.error('Error updating subgoal:', error);
    }
  };

  const handleDeleteSubgoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vision_milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchSubgoals();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting subgoal:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return colors.error[500];
      case 'Medium':
        return colors.warning[500];
      case 'Low':
        return colors.success[500];
      default:
        return colors.neutral[500];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return colors.success[500];
      case 'In Progress':
        return colors.primary[500];
      case 'On Hold':
        return colors.warning[500];
      default:
        return colors.neutral[500];
    }
  };

  if (loading) {
    return <div>Loading subgoals...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Milestones & Tasks</h3>
        <Button
          onClick={() => setShowNewSubgoal(true)}
          className="flex items-center space-x-2"
        >
          <FiPlus className="h-4 w-4" />
          <span>Add Milestone</span>
        </Button>
      </div>

      <AnimatePresence mode="popLayout">
        {showNewSubgoal && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6 space-y-4">
              <Input
                label="Milestone Title"
                value={newSubgoal.title}
                onChange={(e) =>
                  setNewSubgoal((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter milestone title"
              />

              <Input
                label="Description"
                value={newSubgoal.description}
                onChange={(e) =>
                  setNewSubgoal((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe this milestone"
              />

              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  label="Target Date"
                  date={newSubgoal.target_date ? new Date(newSubgoal.target_date) : null}
                  onDateChange={(date) =>
                    setNewSubgoal((prev) => ({
                      ...prev,
                      target_date: date?.toISOString(),
                    }))
                  }
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <div className="flex space-x-2">
                    {['High', 'Medium', 'Low'].map((priority) => (
                      <Button
                        key={priority}
                        type="button"
                        variant={
                          newSubgoal.priority === priority ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() =>
                          setNewSubgoal((prev) => ({
                            ...prev,
                            priority: priority as Subgoal['priority'],
                          }))
                        }
                        style={{
                          borderColor:
                            newSubgoal.priority === priority
                              ? getPriorityColor(priority)
                              : undefined,
                          backgroundColor:
                            newSubgoal.priority === priority
                              ? getPriorityColor(priority)
                              : undefined,
                          color:
                            newSubgoal.priority === priority ? 'white' : undefined,
                        }}
                      >
                        {priority}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowNewSubgoal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddSubgoal}>Add Milestone</Button>
              </div>
            </Card>
          </motion.div>
        )}

        <div className="space-y-4">
          {subgoals.map((subgoal, index) => (
            <Draggable key={subgoal.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-medium text-gray-900">
                          {subgoal.title}
                        </h4>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: getPriorityColor(subgoal.priority),
                            color: getPriorityColor(subgoal.priority),
                          }}
                        >
                          {subgoal.priority}
                        </Badge>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: getStatusColor(subgoal.status),
                            color: getStatusColor(subgoal.status),
                          }}
                        >
                          {subgoal.status}
                        </Badge>
                      </div>

                      {subgoal.description && (
                        <p className="text-sm text-gray-600">
                          {subgoal.description}
                        </p>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <FiClock className="h-4 w-4" />
                          <span>
                            Due {format(new Date(subgoal.target_date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FiCheck className="h-4 w-4" />
                          <span>
                            {subgoal.tasks.filter((t) => t.status === 'Done')
                              .length || 0}{' '}
                            / {subgoal.tasks.length} tasks
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSubgoal(subgoal.id)}
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSubgoal(subgoal.id)}
                      >
                        <FiTrash2 className="h-4 w-4 text-red-500" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <FiMoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Progress
                      </span>
                      <span className="text-sm text-gray-600">
                        {subgoal.progress}%
                      </span>
                    </div>
                    <Progress
                      value={subgoal.progress}
                      className="h-2"
                      indicatorClassName={`bg-${
                        subgoal.progress === 100
                          ? 'success'
                          : subgoal.progress >= 50
                          ? 'primary'
                          : 'warning'
                      }-500`}
                    />
                  </div>

                  {/* Tasks will be rendered here */}
                </Card>
              </motion.div>
            </Draggable>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
