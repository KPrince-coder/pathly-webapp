'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Input } from './Input';
import { FiAlertCircle } from 'react-icons/fi';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export function FormInput({ 
  label, 
  error, 
  icon, 
  className = '', 
  ...props 
}: FormInputProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700" htmlFor={props.id}>
        {label}
      </label>
      <div className="relative">
        <Input
          {...props}
          className={`${className} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
          icon={icon}
        />
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              <FiAlertCircle className="h-5 w-5 text-red-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-red-500 mt-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
