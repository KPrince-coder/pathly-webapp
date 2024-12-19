'use client';

import React, { createContext, useContext } from 'react';
import { toast, ToastOptions } from 'react-toastify';
import { FiCheck, FiX, FiInfo, FiAlertTriangle } from 'react-icons/fi';

interface NotificationContextType {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const defaultOptions: ToastOptions = {
  position: 'bottom-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'colored',
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const success = (message: string, options?: ToastOptions) => {
    toast.success(
      <div className="flex items-center gap-2">
        <FiCheck className="h-5 w-5" />
        <span>{message}</span>
      </div>,
      {
        ...defaultOptions,
        className: 'bg-success-500 dark:bg-success-600',
        ...options,
      }
    );
  };

  const error = (message: string, options?: ToastOptions) => {
    toast.error(
      <div className="flex items-center gap-2">
        <FiX className="h-5 w-5" />
        <span>{message}</span>
      </div>,
      {
        ...defaultOptions,
        className: 'bg-error-500 dark:bg-error-600',
        ...options,
      }
    );
  };

  const info = (message: string, options?: ToastOptions) => {
    toast.info(
      <div className="flex items-center gap-2">
        <FiInfo className="h-5 w-5" />
        <span>{message}</span>
      </div>,
      {
        ...defaultOptions,
        className: 'bg-info-500 dark:bg-info-600',
        ...options,
      }
    );
  };

  const warning = (message: string, options?: ToastOptions) => {
    toast.warning(
      <div className="flex items-center gap-2">
        <FiAlertTriangle className="h-5 w-5" />
        <span>{message}</span>
      </div>,
      {
        ...defaultOptions,
        className: 'bg-warning-500 dark:bg-warning-600',
        ...options,
      }
    );
  };

  return (
    <NotificationContext.Provider value={{ success, error, info, warning }}>
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
