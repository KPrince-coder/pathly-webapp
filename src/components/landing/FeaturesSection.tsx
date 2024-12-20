'use client';

import { motion } from 'framer-motion';
import { IconType } from 'react-icons';
import { FiTarget, FiCpu, FiUsers, FiShield } from 'react-icons/fi';

interface FeatureCardProps {
  title: string;
  description: string;
  Icon: IconType;
  delay: number;
}

export const FeatureCard = ({ title, description, Icon, delay }: FeatureCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl"
  >
    <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
    <p className="text-gray-600 dark:text-gray-300">{description}</p>
  </motion.div>
);

const features = [
  {
    title: 'Goal Setting & Tracking',
    description: 'Set clear objectives and track your progress with intuitive tools and visual analytics.',
    Icon: FiTarget,
    delay: 0
  },
  {
    title: 'AI-Powered Insights',
    description: 'Get intelligent suggestions and insights to optimize your workflow and productivity.',
    Icon: FiCpu,
    delay: 0.1
  },
  {
    title: 'Collaborative Workspace',
    description: 'Work seamlessly with your team in real-time with powerful collaboration features.',
    Icon: FiUsers,
    delay: 0.2
  },
  {
    title: 'Secure & Private',
    description: 'Your data is protected with enterprise-grade security and encryption.',
    Icon: FiShield,
    delay: 0.3
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Everything you need to stay productive
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Powerful features to help you manage your work and achieve your goals
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              Icon={feature.Icon}
              delay={feature.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
