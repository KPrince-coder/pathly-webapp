'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center z-50">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.5,
            ease: [0, 0.71, 0.2, 1.01],
            scale: {
              type: "spring",
              damping: 10,
              stiffness: 100,
            }
          }}
        >
          <Image
            src="/logo.svg"
            alt="Pathly"
            width={64}
            height={64}
            className="mx-auto mb-8"
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-4"
        >
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
          </div>
          
          <p className="text-neutral-600 mt-4 text-sm font-medium">
            {message}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
