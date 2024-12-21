import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { visionTheme } from '@/styles/vision-theme';
import { AnimatedContainer } from './VisionAnimations';

interface VisionLayoutProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
  fullWidth?: boolean;
  noPadding?: boolean;
}

export function VisionLayout({
  children,
  className = '',
  animate = true,
  fullWidth = false,
  noPadding = false,
}: VisionLayoutProps) {
  const baseClasses = `
    ${fullWidth ? 'w-full' : 'max-w-7xl mx-auto'}
    ${noPadding ? '' : 'px-4 sm:px-6 lg:px-8'}
    ${className}
  `;

  if (!animate) {
    return <div className={baseClasses}>{children}</div>;
  }

  return (
    <AnimatedContainer animation="fade" className={baseClasses}>
      {children}
    </AnimatedContainer>
  );
}

interface VisionGridProps {
  children: ReactNode;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export function VisionGrid({
  children,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 6,
  className = '',
}: VisionGridProps) {
  const gridClasses = `
    grid
    grid-cols-${columns.sm || 1}
    md:grid-cols-${columns.md || columns.sm || 1}
    lg:grid-cols-${columns.lg || columns.md || columns.sm || 1}
    xl:grid-cols-${columns.xl || columns.lg || columns.md || columns.sm || 1}
    gap-${gap}
    ${className}
  `;

  return <div className={gridClasses}>{children}</div>;
}

interface VisionSectionProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function VisionSection({
  children,
  title,
  description,
  className = '',
  titleClassName = '',
  descriptionClassName = '',
}: VisionSectionProps) {
  return (
    <section className={`space-y-6 ${className}`}>
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h2
              className={`text-2xl font-semibold text-gray-900 ${titleClassName}`}
            >
              {title}
            </h2>
          )}
          {description && (
            <p
              className={`text-base text-gray-600 ${descriptionClassName}`}
            >
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

interface VisionCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

export function VisionCard({
  children,
  className = '',
  hover = false,
  interactive = false,
  onClick,
}: VisionCardProps) {
  const cardClasses = `
    bg-white
    rounded-lg
    shadow-sm
    border border-gray-200
    ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
    ${interactive ? 'cursor-pointer active:scale-[0.98] transition-transform duration-100' : ''}
    ${className}
  `;

  return (
    <motion.div
      className={cardClasses}
      onClick={onClick}
      whileHover={hover ? { scale: 1.02 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
    >
      {children}
    </motion.div>
  );
}

interface VisionDividerProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function VisionDivider({
  className = '',
  orientation = 'horizontal',
}: VisionDividerProps) {
  const dividerClasses = `
    ${orientation === 'horizontal' ? 'w-full h-px' : 'h-full w-px'}
    bg-gray-200
    ${className}
  `;

  return <div className={dividerClasses} />;
}

interface VisionStackProps {
  children: ReactNode;
  className?: string;
  space?: number;
  direction?: 'row' | 'col';
}

export function VisionStack({
  children,
  className = '',
  space = 4,
  direction = 'col',
}: VisionStackProps) {
  const stackClasses = `
    flex
    ${direction === 'col' ? 'flex-col' : 'flex-row'}
    ${direction === 'col' ? `space-y-${space}` : `space-x-${space}`}
    ${className}
  `;

  return <div className={stackClasses}>{children}</div>;
}
