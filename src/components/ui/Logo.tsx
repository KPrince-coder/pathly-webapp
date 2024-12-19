'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const sizes = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

const textSizes = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
};

export function Logo({ className = '', showText = true, size = 'md', onClick }: LogoProps) {
  const logoContent = (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center ${className}`}
      onClick={onClick}
    >
      <svg
        className={`${sizes[size]}`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L2 7L12 12L22 7L12 2Z"
          className="fill-primary-600 dark:fill-primary-400"
        />
        <path
          d="M2 17L12 22L22 17"
          className="fill-primary-500 dark:fill-primary-500"
        />
        <path
          d="M2 12L12 17L22 12"
          className="fill-primary-400 dark:fill-primary-600"
        />
      </svg>
      {showText && (
        <span className={`ml-2 font-bold ${textSizes[size]}`}>
          Pathly
        </span>
      )}
    </motion.div>
  );

  return onClick ? logoContent : <Link href="/">{logoContent}</Link>;
}

export function LogoIcon({ className = '', size = 'md' }: Omit<LogoProps, 'showText'>) {
  return (
    <svg
      className={`${sizes[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L2 7L12 12L22 7L12 2Z"
        className="fill-primary-600 dark:fill-primary-400"
      />
      <path
        d="M2 17L12 22L22 17"
        className="fill-primary-500 dark:fill-primary-500"
      />
      <path
        d="M2 12L12 17L22 12"
        className="fill-primary-400 dark:fill-primary-600"
      />
    </svg>
  );
}
