import { motion } from 'framer-motion';
import { visionTheme } from '@/styles/vision-theme';
import { progressBarAnimation } from './VisionAnimations';

interface VisionProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'info';
  className?: string;
  animated?: boolean;
}

export function VisionProgress({
  value,
  max = 100,
  showLabel = false,
  size = 'md',
  color = 'primary',
  className = '',
  animated = true,
}: VisionProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const baseClasses = `
    w-full
    bg-gray-200
    rounded-full
    overflow-hidden
    ${heights[size]}
    ${className}
  `;

  const barClasses = `
    h-full
    rounded-full
    bg-gradient-to-r
    ${
      color === 'primary'
        ? 'from-primary-500 to-primary-600'
        : color === 'success'
        ? 'from-success-500 to-success-600'
        : color === 'warning'
        ? 'from-warning-500 to-warning-600'
        : 'from-info-500 to-info-600'
    }
  `;

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="text-gray-900 font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={baseClasses}>
        <motion.div
          className={barClasses}
          initial="initial"
          animate="animate"
          variants={animated ? progressBarAnimation : undefined}
          custom={percentage}
        />
      </div>
    </div>
  );
}

interface VisionCircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: 'primary' | 'success' | 'warning' | 'info';
  showLabel?: boolean;
  className?: string;
  animated?: boolean;
}

export function VisionCircularProgress({
  value,
  max = 100,
  size = 40,
  strokeWidth = 4,
  color = 'primary',
  showLabel = false,
  className = '',
  animated = true,
}: VisionCircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const colors = {
    primary: visionTheme.colors.primary[500],
    success: visionTheme.colors.success[500],
    warning: visionTheme.colors.warning[500],
    info: visionTheme.colors.info[500],
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          className={`text-${color}-500`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={colors[color]}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={
            animated
              ? { duration: 1, ease: 'easeInOut' }
              : { duration: 0 }
          }
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {showLabel && (
        <div
          className="absolute inset-0 flex items-center justify-center text-sm font-medium"
          style={{ color: colors[color] }}
        >
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}

interface VisionProgressRingProps {
  steps: {
    label: string;
    completed: boolean;
    current?: boolean;
  }[];
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'info';
  className?: string;
}

export function VisionProgressRing({
  steps,
  size = 'md',
  color = 'primary',
  className = '',
}: VisionProgressRingProps) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const lineHeights = {
    sm: 'h-0.5',
    md: 'h-1',
    lg: 'h-1.5',
  };

  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center">
          <div className="relative">
            <div
              className={`
                ${sizes[size]}
                rounded-full
                flex
                items-center
                justify-center
                ${
                  step.completed
                    ? `bg-${color}-500 text-white`
                    : step.current
                    ? `bg-${color}-100 text-${color}-600 border-2 border-${color}-500`
                    : 'bg-gray-100 text-gray-500'
                }
              `}
            >
              {step.completed ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <span className="text-sm font-medium">
                  {index + 1}
                </span>
              )}
            </div>
            {step.current && (
              <motion.div
                className={`absolute -inset-1 rounded-full border-2 border-${color}-500`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              />
            )}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`
                ${lineHeights[size]}
                w-16
                mx-2
                ${
                  step.completed
                    ? `bg-${color}-500`
                    : 'bg-gray-200'
                }
              `}
            />
          )}
        </div>
      ))}
    </div>
  );
}
