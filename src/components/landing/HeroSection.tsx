'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export const HeroSection = () => {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-gray-900">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="w-[500px] h-[500px] rounded-full bg-gradient-to-r from-primary-300 to-primary-500"
        />
      </div>
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.1 }}
          transition={{ duration: 1.5, delay: 0.2, ease: 'easeOut' }}
          className="w-[500px] h-[500px] rounded-full bg-gradient-to-r from-secondary-300 to-secondary-500"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left column - Text content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center md:text-left"
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
              Your Path to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500">
                Productivity
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-300">
              Take control of your workflow with connected tools that manage writing, research, and tasks management.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-[200px]"
              >
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center w-full px-6 py-3 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium shadow-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-300"
                >
                  Get Started
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-[200px]"
              >
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center w-full px-6 py-3 rounded-lg bg-white text-primary-600 font-medium border-2 border-primary-600 hover:bg-primary-50 transition-all duration-300"
                >
                  Sign In
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Right column - Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative w-full h-[400px]">
              <Image
                src="/landing/hero-illustration.svg"
                alt="Productivity Illustration"
                fill
                className="object-contain"
                priority
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
