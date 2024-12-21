'use client';

import { useState } from 'react';
import { useTask } from '@/contexts/TaskContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Calendar } from '@/components/ui/Calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';
import {
  Calendar as CalendarIcon,
  Trash2,
  Copy,
  Share2,
  Tag,
  Flag,
  User,
  CheckSquare,
  Square
} from 'lucide-react';
import { format } from 'date-fns';
import { Task } from '@/types/task';

interface TaskBulkActionsProps {
  selectedTasks: string[];
  onSelectionChange: (taskIds: string[]) => void;
}

export function TaskBulkActions({
  selectedTasks,
  onSelectionChange
}: TaskBulkActionsProps) {
  const { state, actions } = useTask();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleSelectAll = () => {
    if (selectedTasks.length === state.tasks.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(state.tasks.map(task => task.id));
    }
  };

  const handleDeleteSelected = () => {
    selectedTasks.forEach(taskId => {
      actions.deleteTask(taskId);
    });
    onSelectionChange([]);
  };

  const handleDuplicateSelected = () => {
    const selectedTaskObjects = state.tasks.filter(task =>
      selectedTasks.includes(task.id)
    );
    selectedTaskObjects.forEach(task => {
      const newTask: Task = {
        ...task,
        id: crypto.randomUUID(),
        title: `${task.title} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      actions.addTask(newTask);
    });
  };

  const handleUpdatePriority = (priority: Task['priority']) => {
    selectedTasks.forEach(taskId => {
      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
        actions.updateTask({
          ...task,
          priority,
          updatedAt: new Date()
        });
      }
    });
  };

  const handleUpdateStatus = (status: Task['status']) => {
    selectedTasks.forEach(taskId => {
      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
        actions.updateTask({
          ...task,
          status,
          updatedAt: new Date()
        });
      }
    });
  };

  const handleUpdateDueDate = (date: Date | null) => {
    selectedTasks.forEach(taskId => {
      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
        actions.updateTask({
          ...task,
          deadline: date,
          updatedAt: new Date()
        });
      }
    });
    setIsDatePickerOpen(false);
  };

  const handleAddTag = (tag: string) => {
    selectedTasks.forEach(taskId => {
      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
        const newTags = [...(task.tags || [])];
        if (!newTags.includes(tag)) {
          newTags.push(tag);
          actions.updateTask({
            ...task,
            tags: newTags,
            updatedAt: new Date()
          });
        }
      }
    });
  };

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="space-x-2"
          >
            {selectedTasks.length === state.tasks.length ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            <span>
              {selectedTasks.length === state.tasks.length
                ? 'Deselect All'
                : 'Select All'}
            </span>
          </Button>
          <Badge variant="secondary">
            {selectedTasks.length} task{selectedTasks.length !== 1 && 's'} selected
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicateSelected}
            disabled={selectedTasks.length === 0}
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={selectedTasks.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {selectedTasks.length > 0 && (
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Flag className="w-4 h-4" />
            <Select
              onValueChange={value =>
                handleUpdatePriority(value as Task['priority'])
              }
              defaultValue=""
            >
              <option value="" disabled>
                Set Priority
              </option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <CheckSquare className="w-4 h-4" />
            <Select
              onValueChange={value => handleUpdateStatus(value as Task['status'])}
              defaultValue=""
            >
              <option value="" disabled>
                Set Status
              </option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4" />
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  Set Due Date
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={null}
                  onSelect={handleUpdateDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4" />
            <Select
              onValueChange={handleAddTag}
              defaultValue=""
            >
              <option value="" disabled>
                Add Tag
              </option>
              <option value="important">Important</option>
              <option value="urgent">Urgent</option>
              <option value="review">Review</option>
              <option value="bug">Bug</option>
              <option value="feature">Feature</option>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <Select
              onValueChange={value =>
                selectedTasks.forEach(taskId => {
                  const task = state.tasks.find(t => t.id === taskId);
                  if (task) {
                    actions.updateTask({
                      ...task,
                      assignedTo: value,
                      updatedAt: new Date()
                    });
                  }
                })
              }
              defaultValue=""
            >
              <option value="" disabled>
                Assign To
              </option>
              <option value="user1">User 1</option>
              <option value="user2">User 2</option>
              <option value="user3">User 3</option>
            </Select>
          </div>
        </div>
      )}
    </Card>
  );
}
