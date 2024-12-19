import Link from 'next/link';
import { ThemeToggle } from '@/context/ThemeContext';
import { FiHome, FiCalendar, FiInbox, FiSettings, FiBell } from 'react-icons/fi';
import { motion } from 'framer-motion';

const navigation = [
  { name: 'Home', href: '/', icon: FiHome },
  { name: 'Calendar', href: '/calendar', icon: FiCalendar },
  { name: 'Tasks', href: '/tasks', icon: FiInbox },
];

export function Header() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-neutral-200 bg-white/80 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-8">
            <Link 
              href="/"
              className="flex items-center gap-2 text-primary-600 dark:text-primary-400"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center"
              >
                <svg
                  className="h-8 w-8"
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
                <span className="ml-2 text-xl font-bold">Pathly</span>
              </motion.div>
            </Link>

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

          {/* Right side actions */}
          <div className="flex items-center gap-4">
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
