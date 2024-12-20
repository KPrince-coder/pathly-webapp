'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FiHome, 
  FiTarget, 
  FiCalendar, 
  FiList,
  FiBarChart2,
  FiSettings,
  FiMail,
  FiUsers,
  FiMessageSquare,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { icon: FiHome, label: 'Dashboard', href: '/dashboard' },
    { icon: FiTarget, label: 'Goals', href: '/dashboard/goals' },
    { icon: FiList, label: 'Tasks', href: '/dashboard/tasks' },
    { icon: FiCalendar, label: 'Calendar', href: '/dashboard/calendar' },
    { icon: FiUsers, label: 'Team', href: '/dashboard/team' },
    { icon: FiMessageSquare, label: 'Chat', href: '/dashboard/chat' },
    { icon: FiBarChart2, label: 'Analytics', href: '/dashboard/analytics' },
    { icon: FiMail, label: 'Messages', href: '/dashboard/messages' },
  ];

  const bottomMenuItems = [
    { icon: FiSettings, label: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? '5rem' : '16rem' }}
      className={cn(
        "h-screen bg-gray-900 text-gray-100 flex flex-col border-r border-gray-800 relative",
        isCollapsed ? "items-center" : ""
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-gray-900 border border-gray-800 rounded-full p-1.5 hover:bg-gray-800"
      >
        {isCollapsed ? (
          <FiChevronRight className="w-4 h-4" />
        ) : (
          <FiChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Logo */}
      <div className={cn(
        "h-16 flex items-center",
        isCollapsed ? "justify-center px-2" : "px-6"
      )}>
        <Link href="/dashboard" className="text-2xl font-bold text-primary-500">
          {isCollapsed ? "P" : "Pathly"}
        </Link>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 mt-6">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center py-3 text-sm transition-colors",
                    isCollapsed ? "justify-center px-2" : "px-6",
                    isActive
                      ? "text-white bg-primary-900/50 border-r-2 border-primary-500"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5",
                    !isCollapsed && "mr-3"
                  )} />
                  {!isCollapsed && item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Menu */}
      <div className="mb-6">
        <ul className="space-y-1">
          {bottomMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center py-3 text-sm transition-colors",
                    isCollapsed ? "justify-center px-2" : "px-6",
                    isActive
                      ? "text-white bg-primary-900/50 border-r-2 border-primary-500"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5",
                    !isCollapsed && "mr-3"
                  )} />
                  {!isCollapsed && item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.div>
  );
}
