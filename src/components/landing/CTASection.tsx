'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export const CTASection = () => {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-secondary-600 opacity-90" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Ready to transform your productivity?
        </h2>
        <p className="text-xl text-white opacity-90 mb-10 max-w-2xl mx-auto">
          Join thousands of users who have already improved their workflow with our platform.
        </p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-block"
        >
          <Link
            href="/signup"
            className="inline-flex items-center px-8 py-4 rounded-lg bg-white text-primary-600 font-semibold text-lg shadow-lg hover:bg-gray-50 transition-colors"
          >
            Get Started for Free
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
};
