import { motion } from 'framer-motion';
import { visionTheme } from '@/styles/vision-theme';

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

export const slideIn = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -20, opacity: 0 },
  transition: { duration: 0.3 },
};

export const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
  transition: { type: 'spring', stiffness: 300, damping: 30 },
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const pulseAnimation = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const progressBarAnimation = {
  initial: { width: 0 },
  animate: (width: number) => ({
    width: `${width}%`,
    transition: { duration: 0.8, ease: 'easeOut' },
  }),
};

export const achievementUnlock = {
  initial: { scale: 0.5, opacity: 0, y: 50 },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 25,
    },
  },
  exit: {
    scale: 0.5,
    opacity: 0,
    y: -50,
    transition: {
      duration: 0.3,
    },
  },
};

export const levelUpAnimation = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.2, 1],
    rotate: [0, 360, 360],
    transition: {
      duration: 1,
      ease: 'easeInOut',
    },
  },
};

export const MotionCard = motion.div;
export const MotionButton = motion.button;
export const MotionDiv = motion.div;

interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade' | 'slide' | 'scale';
  delay?: number;
}

export function AnimatedContainer({
  children,
  className = '',
  animation = 'fade',
  delay = 0,
}: AnimatedContainerProps) {
  const animations = {
    fade: fadeIn,
    slide: slideIn,
    scale: scaleIn,
  };

  return (
    <MotionDiv
      {...animations[animation]}
      transition={{ delay, ...animations[animation].transition }}
      className={className}
    >
      {children}
    </MotionDiv>
  );
}

interface StaggeredListProps {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
  staggerDelay?: number;
}

export function StaggeredList({
  children,
  className = '',
  itemClassName = '',
  staggerDelay = 0.1,
}: StaggeredListProps) {
  return (
    <MotionDiv
      className={className}
      initial="initial"
      animate="animate"
      variants={{
        animate: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {React.Children.map(children, (child) => (
        <MotionDiv
          className={itemClassName}
          variants={{
            initial: { opacity: 0, y: 20 },
            animate: {
              opacity: 1,
              y: 0,
              transition: {
                type: 'spring',
                stiffness: 300,
                damping: 30,
              },
            },
          }}
        >
          {child}
        </MotionDiv>
      ))}
    </MotionDiv>
  );
}
