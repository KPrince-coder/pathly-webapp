'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode
} from 'react';
import { Task, TimeBlock, TaskDependency } from '@/types/task';

interface TaskState {
  tasks: Task[];
  timeBlocks: TimeBlock[];
  dependencies: TaskDependency[];
  settings: {
    workingHours: {
      start: string;
      end: string;
    };
    defaultTaskDuration: number;
    pomodoroSettings: {
      workDuration: number;
      shortBreakDuration: number;
      longBreakDuration: number;
      cyclesBeforeLongBreak: number;
    };
    notifications: {
      enabled: boolean;
      sound: boolean;
      taskReminders: boolean;
      pomodoroAlerts: boolean;
    };
    autoScheduling: {
      enabled: boolean;
      priorityWeight: number;
      deadlineWeight: number;
      energyLevelWeight: number;
    };
    theme: {
      taskColors: {
        high: string;
        medium: string;
        low: string;
      };
      calendarView: 'minimal' | 'detailed';
    };
  };
  filters: {
    status: string[];
    priority: string[];
    tags: string[];
    dateRange: {
      start: Date | null;
      end: Date | null;
    };
  };
  view: {
    currentView: 'board' | 'calendar' | 'timeline' | 'analytics';
    calendarView: 'day' | 'week' | 'month';
    selectedTask: string | null;
    focusMode: boolean;
  };
}

type TaskAction =
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_TIME_BLOCK'; payload: { taskId: string; timeBlock: TimeBlock } }
  | { type: 'ADD_DEPENDENCY'; payload: TaskDependency }
  | { type: 'REMOVE_DEPENDENCY'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<TaskState['settings']> }
  | { type: 'SET_FILTERS'; payload: Partial<TaskState['filters']> }
  | { type: 'SET_VIEW'; payload: Partial<TaskState['view']> }
  | { type: 'TOGGLE_FOCUS_MODE' }
  | { type: 'BULK_UPDATE_TASKS'; payload: Task[] };

const initialState: TaskState = {
  tasks: [],
  timeBlocks: [],
  dependencies: [],
  settings: {
    workingHours: {
      start: '09:00',
      end: '17:00'
    },
    defaultTaskDuration: 30,
    pomodoroSettings: {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      cyclesBeforeLongBreak: 4
    },
    notifications: {
      enabled: true,
      sound: true,
      taskReminders: true,
      pomodoroAlerts: true
    },
    autoScheduling: {
      enabled: true,
      priorityWeight: 0.4,
      deadlineWeight: 0.4,
      energyLevelWeight: 0.2
    },
    theme: {
      taskColors: {
        high: '#ef4444',
        medium: '#f59e0b',
        low: '#3b82f6'
      },
      calendarView: 'detailed'
    }
  },
  filters: {
    status: [],
    priority: [],
    tags: [],
    dateRange: {
      start: null,
      end: null
    }
  },
  view: {
    currentView: 'board',
    calendarView: 'week',
    selectedTask: null,
    focusMode: false
  }
};

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload]
      };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        )
      };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
        dependencies: state.dependencies.filter(
          dep => dep.taskId !== action.payload && dep.dependsOnTaskId !== action.payload
        )
      };

    case 'SET_TIME_BLOCK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? { ...task, timeBlock: action.payload.timeBlock }
            : task
        )
      };

    case 'ADD_DEPENDENCY':
      return {
        ...state,
        dependencies: [...state.dependencies, action.payload]
      };

    case 'REMOVE_DEPENDENCY':
      return {
        ...state,
        dependencies: state.dependencies.filter(dep => dep.id !== action.payload)
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };

    case 'SET_VIEW':
      return {
        ...state,
        view: {
          ...state.view,
          ...action.payload
        }
      };

    case 'TOGGLE_FOCUS_MODE':
      return {
        ...state,
        view: {
          ...state.view,
          focusMode: !state.view.focusMode
        }
      };

    case 'BULK_UPDATE_TASKS':
      return {
        ...state,
        tasks: action.payload
      };

    default:
      return state;
  }
}

const TaskContext = createContext<{
  state: TaskState;
  dispatch: React.Dispatch<TaskAction>;
  actions: {
    addTask: (task: Task) => void;
    updateTask: (task: Task) => void;
    deleteTask: (taskId: string) => void;
    setTimeBlock: (taskId: string, timeBlock: TimeBlock) => void;
    addDependency: (dependency: TaskDependency) => void;
    removeDependency: (dependencyId: string) => void;
    updateSettings: (settings: Partial<TaskState['settings']>) => void;
    setFilters: (filters: Partial<TaskState['filters']>) => void;
    setView: (view: Partial<TaskState['view']>) => void;
    toggleFocusMode: () => void;
    bulkUpdateTasks: (tasks: Task[]) => void;
  };
} | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  const actions = {
    addTask: useCallback((task: Task) => {
      dispatch({ type: 'ADD_TASK', payload: task });
    }, []),

    updateTask: useCallback((task: Task) => {
      dispatch({ type: 'UPDATE_TASK', payload: task });
    }, []),

    deleteTask: useCallback((taskId: string) => {
      dispatch({ type: 'DELETE_TASK', payload: taskId });
    }, []),

    setTimeBlock: useCallback((taskId: string, timeBlock: TimeBlock) => {
      dispatch({ type: 'SET_TIME_BLOCK', payload: { taskId, timeBlock } });
    }, []),

    addDependency: useCallback((dependency: TaskDependency) => {
      dispatch({ type: 'ADD_DEPENDENCY', payload: dependency });
    }, []),

    removeDependency: useCallback((dependencyId: string) => {
      dispatch({ type: 'REMOVE_DEPENDENCY', payload: dependencyId });
    }, []),

    updateSettings: useCallback((settings: Partial<TaskState['settings']>) => {
      dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
    }, []),

    setFilters: useCallback((filters: Partial<TaskState['filters']>) => {
      dispatch({ type: 'SET_FILTERS', payload: filters });
    }, []),

    setView: useCallback((view: Partial<TaskState['view']>) => {
      dispatch({ type: 'SET_VIEW', payload: view });
    }, []),

    toggleFocusMode: useCallback(() => {
      dispatch({ type: 'TOGGLE_FOCUS_MODE' });
    }, []),

    bulkUpdateTasks: useCallback((tasks: Task[]) => {
      dispatch({ type: 'BULK_UPDATE_TASKS', payload: tasks });
    }, [])
  };

  return (
    <TaskContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTask() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
}
