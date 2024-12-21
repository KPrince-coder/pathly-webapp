'use client';

import { useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  FiPlus,
  FiClock,
  FiTrash2,
  FiEdit2,
  FiMoreVertical,
  FiChevronRight,
} from 'react-icons/fi';
import { colors } from '@/styles/colors';

interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: 'Todo' | 'In Progress' | 'Done';
  priority: 'High' | 'Medium' | 'Low';
  dependencies?: string[];
}

interface VisionTaskListProps {
  milestoneId: string;
  tasks: Task[];
  onUpdate?: () => void;
}

export function VisionTaskList({ milestoneId, tasks: initialTasks, onUpdate }: VisionTaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [showNewTask, setShowNewTask] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Todo',
  });
  const supabase = useSupabase();

  const handleAddTask = async () => {
    try {
      const { error } = await supabase.from('vision_tasks').insert([
        {
          milestone_id: milestoneId,
          title: newTask.title,
          description: newTask.description,
          due_date: newTask.due_date,
          priority: newTask.priority,
          status: 'Todo',
        },
      ]);

      if (error) throw error;
      setShowNewTask(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'Todo',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('vision_tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setEditingTask(null);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vision_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting task:', error);
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

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-700">Tasks</h4>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowNewTask(true)}
          className="flex items-center space-x-1"
        >
          <FiPlus className="h-4 w-4" />
          <span>Add Task</span>
        </Button>
      </div>

      <AnimatePresence mode="popLayout">
        {showNewTask && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-4 space-y-4">
              <Input
                label="Task Title"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter task title"
              />

              <Input
                label="Description"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe this task"
              />

              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  label="Due Date"
                  date={newTask.due_date ? new Date(newTask.due_date) : null}
                  onDateChange={(date) =>
                    setNewTask((prev) => ({
                      ...prev,
                      due_date: date?.toISOString(),
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
                          newTask.priority === priority ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() =>
                          setNewTask((prev) => ({
                            ...prev,
                            priority: priority as Task['priority'],
                          }))
                        }
                        style={{
                          borderColor:
                            newTask.priority === priority
                              ? getPriorityColor(priority)
                              : undefined,
                          backgroundColor:
                            newTask.priority === priority
                              ? getPriorityColor(priority)
                              : undefined,
                          color:
                            newTask.priority === priority ? 'white' : undefined,
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
                  size="sm"
                  onClick={() => setShowNewTask(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddTask}>
                  Add Task
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        <div className="space-y-2">
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <Card className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={task.status === 'Done'}
                      onCheckedChange={(checked) =>
                        handleUpdateTask(task.id, {
                          status: checked ? 'Done' : 'Todo',
                        })
                      }
                    />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-sm font-medium ${
                            task.status === 'Done'
                              ? 'text-gray-400 line-through'
                              : 'text-gray-900'
                          }`}
                        >
                          {task.title}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: getPriorityColor(task.priority),
                            color: getPriorityColor(task.priority),
                          }}
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600">
                          {task.description}
                        </p>
                      )}
                      {task.due_date && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <FiClock className="h-3 w-3" />
                          <span>
                            Due {format(new Date(task.due_date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTask(task.id)}
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <FiTrash2 className="h-4 w-4 text-red-500" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <FiMoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
