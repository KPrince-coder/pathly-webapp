import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, variant = 'default', ...props }, ref) => {
    const percentage = (value / max) * 100;

    const variantStyles = {
      default: 'bg-blue-600',
      success: 'bg-green-600',
      warning: 'bg-yellow-600',
      danger: 'bg-red-600',
    };

    return (
      <div
        ref={ref}
        className={cn('w-full bg-gray-200 rounded-full h-2.5', className)}
        {...props}
      >
        <div
          className={cn(
            'h-2.5 rounded-full transition-all duration-300 ease-in-out',
            variantStyles[variant]
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };
