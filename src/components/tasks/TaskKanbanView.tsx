'use client';

import { useState, useRef } from 'react';
import { useTask } from '@/contexts/TaskContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Plus,
  MoreVertical,
  ChevronDown,
  Calendar,
  User,
  Tag,
  Flag,
  Edit3,
  Trash2,
  Copy,
  Share2,
  ArrowUpRight,
  BarChart2,
  Clock
} from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';
import { Task, TaskStatus } from '@/types/task';
import { cn } from '@/lib/utils';

interface KanbanColumn {
  id: TaskStatus;
  label: string;
  color: string;
  icon: React.ReactNode;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'todo',
    label: 'To Do',
    color: 'bg-blue-500/10 border-blue-500/20',
    icon: <Plus className="w-4 h-4 text-blue-500" />
  },
  {
    id: 'in-progress',
    label: 'In Progress',
    color: 'bg-yellow-500/10 border-yellow-500/20',
    icon: <BarChart2 className="w-4 h-4 text-yellow-500" />
  },
  {
    id: 'completed',
    label: 'Completed',
    color: 'bg-green-500/10 border-green-500/20',
    icon: <ArrowUpRight className="w-4 h-4 text-green-500" />
  }
];

export function TaskKanbanView() {
  const { state, actions } = useTask();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<TaskStatus | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority']
  });

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
    setHoveredColumn(null);
  };

  const handleAddTask = () => {
    if (newTaskData.title.trim()) {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: newTaskData.title.trim(),
        description: newTaskData.description.trim(),
        status: 'todo',
        priority: newTaskData.priority,
        estimatedDuration: state.settings.defaultTaskDuration,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'current-user',
        progress: 0
      };
      actions.addTask(newTask);
      setNewTaskData({
        title: '',
        description: '',
        priority: 'medium'
      });
      setIsAddingTask(false);
    }
  };

  const getTasksByStatus = (status: TaskStatus) =>
    state.tasks.filter(task => task.status === status);

  const getColumnMetrics = (status: TaskStatus) => {
    const tasks = getTasksByStatus(status);
    return {
      total: tasks.length,
      overdue: tasks.filter(task =>
        task.deadline && isBefore(new Date(task.deadline), new Date())
      ).length,
      highPriority: tasks.filter(task => task.priority === 'high').length,
      avgProgress: Math.round(
        tasks.reduce((acc, task) => acc + (task.progress || 0), 0) / tasks.length
      )
    };
  };

  const renderTaskCard = (task: Task) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragStart={() => handleDragStart(task)}
      className={cn(
        'group cursor-pointer',
        draggedTask?.id === task.id && 'opacity-50'
      )}
    >
      <Card
        className={cn(
          'p-4 space-y-3',
          'hover:border-primary/50',
          'transition-all duration-200',
          task.priority === 'high' && 'border-red-500/50',
          task.deadline &&
            isBefore(new Date(task.deadline), new Date()) &&
            'border-orange-500/50'
        )}
      >
        <div className="flex items-start justify-between">
          <h3 className="font-medium line-clamp-2">{task.title}</h3>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="end">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => actions.setView({ selectedTask: task.id })}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    const newTask: Task = {
                      ...task,
                      id: crypto.randomUUID(),
                      title: `${task.title} (Copy)`,
                      createdAt: new Date(),
                      updatedAt: new Date()
                    };
                    actions.addTask(newTask);
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-red-500 hover:text-red-600"
                  onClick={() => actions.deleteTask(task.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {task.deadline && (
            <Badge
              variant="outline"
              className={cn(
                'flex items-center space-x-1',
                isBefore(new Date(task.deadline), new Date()) &&
                  'text-red-500 border-red-500'
              )}
            >
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(task.deadline), 'MMM d')}</span>
            </Badge>
          )}

          {task.assignedTo && (
            <Badge variant="outline" className="flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>{task.assignedTo}</span>
            </Badge>
          )}

          {task.estimatedDuration && (
            <Badge variant="outline" className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{task.estimatedDuration}m</span>
            </Badge>
          )}

          <Badge
            variant="outline"
            className={cn(
              'flex items-center space-x-1',
              task.priority === 'high'
                ? 'text-red-500 border-red-500'
                : task.priority === 'medium'
                ? 'text-yellow-500 border-yellow-500'
                : 'text-blue-500 border-blue-500'
            )}
          >
            <Flag className="w-3 h-3" />
            <span>{task.priority}</span>
          </Badge>
        </div>

        {task.progress !== undefined && (
          <div className="flex items-center space-x-2">
            <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-300',
                  task.progress >= 100
                    ? 'bg-green-500'
                    : task.progress >= 50
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
                )}
                style={{ width: `${task.progress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {task.progress}%
            </span>
          </div>
        )}

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map(tag => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs flex items-center space-x-1"
              >
                <Tag className="w-3 h-3" />
                <span>{tag}</span>
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {KANBAN_COLUMNS.map(column => {
        const metrics = getColumnMetrics(column.id);
        return (
          <div
            key={column.id}
            className={cn(
              'rounded-lg p-4',
              column.color,
              hoveredColumn === column.id && 'ring-2 ring-primary',
              'transition-all duration-200'
            )}
            onDragOver={e => {
              e.preventDefault();
              setHoveredColumn(column.id);
            }}
            onDragLeave={() => setHoveredColumn(null)}
            onDrop={() => draggedTask && handleDragEnd(draggedTask, column.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {column.icon}
                <h2 className="font-semibold">{column.label}</h2>
                <Badge variant="secondary">{metrics.total}</Badge>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Tasks</span>
                      <span className="font-medium">{metrics.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Overdue</span>
                      <span className="font-medium text-red-500">
                        {metrics.overdue}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">High Priority</span>
                      <span className="font-medium text-orange-500">
                        {metrics.highPriority}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg Progress</span>
                      <span className="font-medium">{metrics.avgProgress}%</span>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
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
                  className="space-y-3"
                >
                  {getTasksByStatus(column.id).map(task => (
                    <Reorder.Item key={task.id} value={task}>
                      {renderTaskCard(task)}
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </AnimatePresence>

              {column.id === 'todo' && (
                <div className="mt-3">
                  {isAddingTask ? (
                    <Card className="p-4">
                      <Input
                        value={newTaskData.title}
                        onChange={e =>
                          setNewTaskData(prev => ({
                            ...prev,
                            title: e.target.value
                          }))
                        }
                        placeholder="Task title..."
                        className="mb-2"
                      />
                      <Input
                        value={newTaskData.description}
                        onChange={e =>
                          setNewTaskData(prev => ({
                            ...prev,
                            description: e.target.value
                          }))
                        }
                        placeholder="Description (optional)"
                        className="mb-2"
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setIsAddingTask(false);
                            setNewTaskData({
                              title: '',
                              description: '',
                              priority: 'medium'
                            });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddTask}
                          disabled={!newTaskData.title.trim()}
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
        );
      })}
    </div>
  );
}
