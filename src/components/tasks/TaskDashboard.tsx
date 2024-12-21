'use client';

import { useState, useEffect } from 'react';
import { useTask } from '@/contexts/TaskContext';
import { TaskLayout, TaskMainContent, TaskSidebar } from './TaskLayout';
import { TaskFilterBar } from './TaskFilterBar';
import { TaskBoard } from './TaskBoard';
import { TaskCalendarView } from './TaskCalendarView';
import { TaskTimeline } from './TaskTimeline';
import { TaskAnalytics } from './TaskAnalytics';
import { TimeBlockManager } from './TimeBlockManager';
import { TaskDependencyGraph } from './TaskDependencyGraph';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import { cn } from '@/lib/utils';

export function TaskDashboard() {
  const { state, actions } = useTask();
  const [isLoading, setIsLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);

  // Setup keyboard shortcuts
  useHotkeys('ctrl+b', () => setShowSidebar(prev => !prev));
  useHotkeys('ctrl+f', () => actions.toggleFocusMode());
  useHotkeys('ctrl+1', () => actions.setView({ currentView: 'board' }));
  useHotkeys('ctrl+2', () => actions.setView({ currentView: 'calendar' }));
  useHotkeys('ctrl+3', () => actions.setView({ currentView: 'timeline' }));
  useHotkeys('ctrl+4', () => actions.setView({ currentView: 'analytics' }));

  useEffect(() => {
    // Simulate loading state
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const renderMainContent = () => {
    if (isLoading) {
      return <TaskLoadingSkeleton />;
    }

    switch (state.view.currentView) {
      case 'board':
        return <TaskBoard />;
      case 'calendar':
        return <TaskCalendarView tasks={state.tasks} />;
      case 'timeline':
        return <TaskTimeline />;
      case 'analytics':
        return <TaskAnalytics tasks={state.tasks} timeRange="week" />;
      default:
        return <TaskBoard />;
    }
  };

  const renderSidebarContent = () => {
    if (state.view.selectedTask) {
      const selectedTask = state.tasks.find(t => t.id === state.view.selectedTask);
      if (selectedTask?.timeBlock) {
        return (
          <TimeBlockManager
            task={selectedTask}
            onTimeBlockUpdate={(taskId, timeBlock) => {
              actions.setTimeBlock(taskId, timeBlock);
            }}
            onTaskComplete={taskId => {
              actions.updateTask({
                ...selectedTask,
                status: 'completed',
                completedAt: new Date()
              });
              toast({
                title: 'Task Completed',
                description: `"${selectedTask.title}" has been marked as complete.`
              });
            }}
          />
        );
      }
    }

    return (
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-2">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
              <div className="text-2xl font-bold">{state.tasks.length}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Completed</div>
              <div className="text-2xl font-bold">
                {state.tasks.filter(t => t.status === 'completed').length}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">In Progress</div>
              <div className="text-2xl font-bold">
                {state.tasks.filter(t => t.status === 'in-progress').length}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Focus Time</div>
              <div className="text-2xl font-bold">
                {Math.round(
                  state.tasks.reduce((acc, task) => {
                    if (task.focusTime) {
                      return acc + (task.focusTime.pomodorosCompleted * 25);
                    }
                    return acc;
                  }, 0) / 60
                )}h
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-medium mb-2">Dependencies</h3>
          <TaskDependencyGraph
            tasks={state.tasks}
            dependencies={state.dependencies}
            className="h-[300px]"
          />
        </Card>

        {state.view.focusMode && (
          <Card className="p-4 bg-primary text-primary-foreground">
            <h3 className="text-lg font-medium mb-2">Focus Mode</h3>
            <p className="text-sm mb-4">
              Focus mode is active. Notifications are muted and only essential information is shown.
            </p>
            <Button
              variant="secondary"
              onClick={actions.toggleFocusMode}
            >
              Exit Focus Mode
            </Button>
          </Card>
        )}
      </div>
    );
  };

  return (
    <TaskLayout>
      <div className="col-span-full mb-4">
        <TaskFilterBar />
      </div>

      <TaskMainContent className={cn(
        'transition-all duration-300',
        !showSidebar && 'md:col-span-12'
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(prev => !prev)}
              className="md:hidden"
            >
              ≡
            </Button>
            <h1 className="text-2xl font-bold">Tasks</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={state.view.currentView === 'board' ? 'default' : 'outline'}
              size="sm"
              onClick={() => actions.setView({ currentView: 'board' })}
            >
              Board
            </Button>
            <Button
              variant={state.view.currentView === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => actions.setView({ currentView: 'calendar' })}
            >
              Calendar
            </Button>
            <Button
              variant={state.view.currentView === 'timeline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => actions.setView({ currentView: 'timeline' })}
            >
              Timeline
            </Button>
            <Button
              variant={state.view.currentView === 'analytics' ? 'default' : 'outline'}
              size="sm"
              onClick={() => actions.setView({ currentView: 'analytics' })}
            >
              Analytics
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={state.view.currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderMainContent()}
          </motion.div>
        </AnimatePresence>
      </TaskMainContent>

      <AnimatePresence>
        {showSidebar && (
          <TaskSidebar
            as={motion.aside}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {renderSidebarContent()}
          </TaskSidebar>
        )}
      </AnimatePresence>
    </TaskLayout>
  );
}

function TaskLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-8 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
