'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode, themes } from '@/styles/theme';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    let effectiveTheme = theme;

    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }

    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const value = { theme, setTheme };

  if (!mounted) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const options: { value: ThemeMode; icon: JSX.Element; label: string }[] = [
    { value: 'light', icon: <FiSun className="w-4 h-4" />, label: 'Light' },
    { value: 'dark', icon: <FiMoon className="w-4 h-4" />, label: 'Dark' },
    { value: 'system', icon: <FiMonitor className="w-4 h-4" />, label: 'System' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'light' && <FiSun className="w-5 h-5" />}
        {theme === 'dark' && <FiMoon className="w-5 h-5" />}
        {theme === 'system' && <FiMonitor className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
              className="absolute right-0 mt-2 w-48 rounded-lg bg-white dark:bg-neutral-800 shadow-lg ring-1 ring-black ring-opacity-5 z-50"
            >
              <div className="p-1">
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTheme(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors
                      ${
                        theme === option.value
                          ? 'bg-primary-500 text-white'
                          : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                      }
                    `}
                  >
                    {option.icon}
                    <span className="ml-2">{option.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
