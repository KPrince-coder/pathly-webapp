'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { toast, type ToastT } from 'sonner';
import { FiCheck, FiX, FiInfo, FiAlertTriangle } from 'react-icons/fi';

interface NotificationContextType {
  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const options: Partial<ToastT> = {
      icon: type === 'success' ? <FiCheck className="text-green-500" /> :
            type === 'error' ? <FiX className="text-red-500" /> :
            type === 'warning' ? <FiAlertTriangle className="text-yellow-500" /> :
            <FiInfo className="text-blue-500" />,
      duration: 4000,
    };

    switch (type) {
      case 'success':
        toast.success(message, options);
        break;
      case 'error':
        toast.error(message, options);
        break;
      case 'warning':
        toast.warning(message, options);
        break;
      default:
        toast.info(message, options);
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
