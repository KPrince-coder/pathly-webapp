'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { Toaster } from 'sonner';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <NotificationProvider>
        {children}
        <Toaster />
      </NotificationProvider>
    </ThemeProvider>
  );
}
