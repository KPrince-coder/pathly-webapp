'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TaskLayoutProps {
  children: ReactNode;
  className?: string;
}

export function TaskLayout({ children, className }: TaskLayoutProps) {
  return (
    <div className={cn(
      'min-h-screen bg-background',
      'p-4 md:p-6 lg:p-8',
      'max-w-7xl mx-auto',
      className
    )}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        {children}
      </div>
    </div>
  );
}

export function TaskMainContent({ children, className }: TaskLayoutProps) {
  return (
    <main className={cn(
      'col-span-1 md:col-span-8 lg:col-span-9',
      'space-y-4',
      className
    )}>
      {children}
    </main>
  );
}

export function TaskSidebar({ children, className }: TaskLayoutProps) {
  return (
    <aside className={cn(
      'col-span-1 md:col-span-4 lg:col-span-3',
      'space-y-4',
      className
    )}>
      {children}
    </aside>
  );
}

export function TaskSection({ children, className }: TaskLayoutProps) {
  return (
    <section className={cn(
      'bg-card rounded-lg shadow-sm',
      'p-4 md:p-6',
      'border border-border',
      className
    )}>
      {children}
    </section>
  );
}
