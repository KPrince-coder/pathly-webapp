'use client';

import { useState } from 'react';
import { Task, TaskPriority, RecurrencePattern } from '@/types/task';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { DatePicker } from '@/components/ui/DatePicker';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/utils';

interface TaskModalProps {
  task: Partial<Task>;
  onClose: () => void;
  onSave: (task: Task) => void;
  availableTasks?: Task[]; // For dependency selection
}

export function TaskModal({ task, onClose, onSave, availableTasks = [] }: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: task.title || '',
    description: task.description || '',
    priority: task.priority || 'medium' as TaskPriority,
    estimatedDuration: task.estimatedDuration || 60,
    deadline: task.deadline,
    recurrence: task.recurrence?.pattern || null as RecurrencePattern | null,
    dependencies: task.dependencies || [],
    enablePomodoro: task.timeBlock?.pomodoroEnabled || false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedTask: Task = {
      ...task,
      ...formData,
      id: task.id || crypto.randomUUID(),
      status: task.status || 'todo',
      createdBy: task.createdBy || 'current-user', // Replace with actual user ID
      createdAt: task.createdAt || new Date(),
      updatedAt: new Date(),
      assignedTo: task.assignedTo || ['current-user'] // Replace with actual user ID
    };

    onSave(updatedTask);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{task.id ? 'Edit Task' : 'Create Task'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Input
                label="Title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task title"
                required
              />
            </div>

            <div>
              <Textarea
                label="Description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Select
                  label="Priority"
                  value={formData.priority}
                  onChange={value => setFormData({ ...formData, priority: value as TaskPriority })}
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' }
                  ]}
                />
              </div>

              <div>
                <Input
                  label="Estimated Duration (minutes)"
                  type="number"
                  min={1}
                  value={formData.estimatedDuration}
                  onChange={e => setFormData({ 
                    ...formData, 
                    estimatedDuration: parseInt(e.target.value) 
                  })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <DatePicker
                  label="Deadline"
                  value={formData.deadline}
                  onChange={date => setFormData({ ...formData, deadline: date })}
                />
              </div>

              <div>
                <Select
                  label="Recurrence"
                  value={formData.recurrence || ''}
                  onChange={value => setFormData({ 
                    ...formData, 
                    recurrence: value as RecurrencePattern 
                  })}
                  options={[
                    { value: '', label: 'No recurrence' },
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'custom', label: 'Custom' }
                  ]}
                />
              </div>
            </div>

            {availableTasks.length > 0 && (
              <div>
                <Select
                  label="Dependencies"
                  value={formData.dependencies}
                  onChange={value => setFormData({ ...formData, dependencies: value })}
                  options={availableTasks.map(t => ({
                    value: t.id,
                    label: t.title
                  }))}
                  multiple
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.enablePomodoro}
                onCheckedChange={checked => setFormData({ 
                  ...formData, 
                  enablePomodoro: checked 
                })}
              />
              <span>Enable Pomodoro Timer</span>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {task.id ? 'Update' : 'Create'} Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
