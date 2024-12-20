'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { FiHome, FiCalendar, FiInbox, FiSettings, FiBell } from 'react-icons/fi';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: FiHome },
  { name: 'Calendar', href: '/calendar', icon: FiCalendar },
  { name: 'Tasks', href: '/tasks', icon: FiInbox },
];

export function Header() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <Logo className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                Pathly
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <button
              className="p-2 text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-white relative"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              <FiBell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary-600 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </button>
            <button className="p-2 text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-white">
              <FiSettings className="h-5 w-5" />
            </button>
            <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
              US
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
