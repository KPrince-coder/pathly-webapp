import { motion } from 'framer-motion';
import { Button } from './Button';
import Image from 'next/image';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  image: 'tasks' | 'goals' | 'calendar' | 'analytics' | 'timer';
}

export function EmptyState({ title, description, action, image }: EmptyStateProps) {
  const images = {
    tasks: '/illustrations/empty-tasks.svg',
    goals: '/illustrations/empty-goals.svg',
    calendar: '/illustrations/empty-calendar.svg',
    analytics: '/illustrations/empty-analytics.svg',
    timer: '/illustrations/empty-timer.svg',
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center p-8 text-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="relative w-64 h-64 mb-6"
        variants={itemVariants}
      >
        <Image
          src={images[image]}
          alt={title}
          layout="fill"
          objectFit="contain"
          className="drop-shadow-lg"
        />
      </motion.div>

      <motion.h3
        className="text-2xl font-semibold mb-2"
        variants={itemVariants}
      >
        {title}
      </motion.h3>

      <motion.p
        className="text-gray-500 mb-6 max-w-md"
        variants={itemVariants}
      >
        {description}
      </motion.p>

      {action && (
        <motion.div variants={itemVariants}>
          <Button
            onClick={action.onClick}
            className="inline-flex items-center px-4 py-2"
          >
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
