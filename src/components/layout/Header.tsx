import Link from 'next/link';
import { ThemeToggle } from '@/context/ThemeContext';
import { Search } from '@/components/ui/Search';
import { Logo } from '@/components/ui/Logo';
import { FiHome, FiCalendar, FiInbox, FiSettings, FiBell, FiPlus } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const navigation = [
  { name: 'Home', href: '/', icon: FiHome },
  { name: 'Calendar', href: '/calendar', icon: FiCalendar },
  { name: 'Tasks', href: '/tasks', icon: FiInbox },
];

const quickActions = [
  { name: 'New Task', icon: FiInbox, href: '/tasks/new' },
  { name: 'New Event', icon: FiCalendar, href: '/calendar/new' },
  { name: 'New Project', icon: FiHome, href: '/projects/new' },
];

export function Header() {
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-neutral-200 bg-white/80 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-8">
            <Logo className="text-primary-600 dark:text-primary-400" />

            <nav className="hidden md:flex">
              <ul className="flex items-center gap-6">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-2 text-neutral-600 transition-colors hover:text-primary-600 dark:text-neutral-300 dark:hover:text-primary-400"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Center Search */}
          <div className="flex-1 px-8">
            <Search />
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Quick Actions */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
                className="rounded-full bg-primary-500 p-2 text-white hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500"
              >
                <FiPlus className="h-5 w-5" />
              </motion.button>

              <AnimatePresence>
                {isQuickActionsOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40"
                      onClick={() => setIsQuickActionsOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-neutral-800 dark:ring-neutral-700"
                    >
                      {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <Link
                            key={action.name}
                            href={action.href}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
                            onClick={() => setIsQuickActionsOpen(false)}
                          >
                            <Icon className="h-4 w-4" />
                            {action.name}
                          </Link>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative rounded-full p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[10px] text-white">
                3
              </span>
              <FiBell className="h-5 w-5" />
            </motion.button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Settings */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-full p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <FiSettings className="h-5 w-5" />
            </motion.button>

            {/* Profile */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600 dark:bg-primary-900 dark:text-primary-400"
            >
              US
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
}
