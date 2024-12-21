'use client';

import { useState, useRef, useEffect } from 'react';
import { useTask } from '@/contexts/TaskContext';
import { Task, TaskStatus, TaskFilters } from '@/types/task';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from '@/components/ui/ContextMenu';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { format, isWithinInterval, isAfter, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';
import { TaskFilter } from './TaskFilter';
import { TaskBulkActions } from './TaskBulkActions';
import { Checkbox } from '@/components/ui/Checkbox';

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' }
];

export function TaskBoard() {
  const { state, actions } = useTask();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(state.tasks);
  const newTaskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingTask && newTaskInputRef.current) {
      newTaskInputRef.current.focus();
    }
  }, [isAddingTask]);

  const handleFilterChange = (filters: TaskFilters) => {
    let filtered = state.tasks;

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply priority filter
    if (filters.priority.length > 0) {
      filtered = filtered.filter(task =>
        filters.priority.includes(task.priority)
      );
    }

    // Apply tag filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(task =>
        task.tags?.some(tag => filters.tags.includes(tag))
      );
    }

    // Apply date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(task => {
        const taskDate = task.deadline || task.createdAt;
        if (filters.dateRange.from && filters.dateRange.to) {
          return isWithinInterval(new Date(taskDate), {
            start: filters.dateRange.from,
            end: filters.dateRange.to
          });
        } else if (filters.dateRange.from) {
          return isAfter(new Date(taskDate), filters.dateRange.from);
        } else if (filters.dateRange.to) {
          return isBefore(new Date(taskDate), filters.dateRange.to);
        }
        return true;
      });
    }

    // Apply assignee filter
    if (filters.assignees.length > 0) {
      filtered = filtered.filter(task =>
        task.assignedTo && filters.assignees.includes(task.assignedTo)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return filters.sortOrder === 'asc'
            ? priorityOrder[a.priority] - priorityOrder[b.priority]
            : priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'dueDate':
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return filters.sortOrder === 'asc'
            ? new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
            : new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
        case 'createdAt':
          return filters.sortOrder === 'asc'
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'title':
          return filters.sortOrder === 'asc'
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    setFilteredTasks(filtered);
  };

  const getTasksByStatus = (status: TaskStatus) =>
    filteredTasks.filter(task => task.status === status);

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragEnd = (task: Task, newStatus: TaskStatus) => {
    if (task.status !== newStatus) {
      actions.updateTask({
        ...task,
        status: newStatus,
        updatedAt: new Date()
      });
    }
    setDraggedTask(null);
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: newTaskTitle.trim(),
        status: 'todo',
        priority: 'medium',
        estimatedDuration: state.settings.defaultTaskDuration,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'current-user', // TODO: Get from auth context
        progress: 0
      };
      actions.addTask(newTask);
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  const handleTaskClick = (task: Task) => {
    actions.setView({ selectedTask: task.id });
  };

  const getTaskPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-700 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
      case 'low':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
    }
  };

  const renderTask = (task: Task) => (
    <ContextMenu>
      <ContextMenuTrigger>
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'group cursor-pointer',
            draggedTask?.id === task.id && 'opacity-50'
          )}
          draggable
          onDragStart={() => handleDragStart(task)}
        >
          <Card
            className={cn(
              'p-4 space-y-2',
              'hover:border-primary/50',
              'transition-colors duration-200',
              selectedTasks.includes(task.id) && 'border-primary'
            )}
            onClick={() => handleTaskClick(task)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedTasks.includes(task.id)}
                  onCheckedChange={() => toggleTaskSelection(task.id)}
                  onClick={e => e.stopPropagation()}
                />
                <h3 className="font-medium line-clamp-2">{task.title}</h3>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  'ml-2 shrink-0',
                  getTaskPriorityColor(task.priority)
                )}
              >
                {task.priority}
              </Badge>
            </div>

            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <span>{format(new Date(task.createdAt), 'MMM d')}</span>
                {task.deadline && (
                  <span className="text-red-500">
                    Due {format(new Date(task.deadline), 'MMM d')}
                  </span>
                )}
              </div>
              {task.progress !== undefined && (
                <div className="flex items-center space-x-1">
                  <div className="w-20 h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <span>{task.progress}%</span>
                </div>
              )}
            </div>

            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => actions.updateTask({
          ...task,
          priority: 'high'
        })}>
          Set High Priority
        </ContextMenuItem>
        <ContextMenuItem onClick={() => actions.deleteTask(task.id)}>
          Delete Task
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );

  return (
    <div className="space-y-4">
      <TaskFilter onFilterChange={handleFilterChange} />
      <TaskBulkActions
        selectedTasks={selectedTasks}
        onSelectionChange={setSelectedTasks}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map(column => (
          <div
            key={column.id}
            className={cn(
              'p-4 rounded-lg',
              'bg-background/50 backdrop-blur-sm',
              'border border-border'
            )}
            onDragOver={e => e.preventDefault()}
            onDrop={() => draggedTask && handleDragEnd(draggedTask, column.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{column.label}</h2>
              <Badge variant="secondary">
                {getTasksByStatus(column.id).length}
              </Badge>
            </div>

            <ScrollArea className="h-[calc(100vh-20rem)]">
              <AnimatePresence>
                <Reorder.Group
                  axis="y"
                  values={getTasksByStatus(column.id)}
                  onReorder={tasks => {
                    actions.bulkUpdateTasks([
                      ...state.tasks.filter(t => t.status !== column.id),
                      ...tasks
                    ]);
                  }}
                  className="space-y-2"
                >
                  {getTasksByStatus(column.id).map(task => (
                    <Reorder.Item key={task.id} value={task}>
                      {renderTask(task)}
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </AnimatePresence>

              {column.id === 'todo' && (
                <div className="mt-2">
                  {isAddingTask ? (
                    <Card className="p-2">
                      <Input
                        ref={newTaskInputRef}
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleAddTask();
                          } else if (e.key === 'Escape') {
                            setIsAddingTask(false);
                            setNewTaskTitle('');
                          }
                        }}
                        placeholder="Enter task title..."
                        className="mb-2"
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsAddingTask(false);
                            setNewTaskTitle('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleAddTask}
                          disabled={!newTaskTitle.trim()}
                        >
                          Add Task
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setIsAddingTask(true)}
                    >
                      + Add Task
                    </Button>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        ))}
      </div>
    </div>
  );
}
