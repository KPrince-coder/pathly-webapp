'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiCalendar, FiInbox, FiSettings, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  href: string;
}

const mockResults: SearchResult[] = [
  {
    id: '1',
    title: 'Today\'s Tasks',
    description: 'View and manage your tasks for today',
    icon: <FiInbox className="h-5 w-5" />,
    href: '/tasks',
  },
  {
    id: '2',
    title: 'Calendar',
    description: 'Check your upcoming events',
    icon: <FiCalendar className="h-5 w-5" />,
    href: '/calendar',
  },
  {
    id: '3',
    title: 'Settings',
    description: 'Manage your account settings',
    icon: <FiSettings className="h-5 w-5" />,
    href: '/settings',
  },
  {
    id: '4',
    title: 'Profile',
    description: 'View and edit your profile',
    icon: <FiUser className="h-5 w-5" />,
    href: '/profile',
  },
];

export function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query) {
      // In a real app, this would be an API call
      const filtered = mockResults.filter(
        result =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.description.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setSelectedIndex(0);
    } else {
      setResults([]);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          router.push(results[selectedIndex].href);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-neutral-100 px-4 py-2 text-neutral-500 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
      >
        <FiSearch className="h-4 w-4" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="hidden rounded bg-white px-2 py-0.5 text-xs font-light text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400 md:inline">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="absolute left-0 right-0 z-50 mt-2 origin-top rounded-lg bg-white p-2 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-neutral-800 dark:ring-white/10 md:w-96"
            >
              <div className="flex items-center gap-2 rounded-md bg-neutral-100 px-3 dark:bg-neutral-700">
                <FiSearch className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                <input
                  type="text"
                  className="w-full bg-transparent py-2 text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none dark:text-white dark:placeholder-neutral-400"
                  placeholder="Search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                )}
              </div>

              {results.length > 0 && (
                <div className="mt-2 space-y-1">
                  {results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => {
                        router.push(result.href);
                        setIsOpen(false);
                      }}
                      className={`w-full rounded-md px-3 py-2 text-left transition-colors ${
                        index === selectedIndex
                          ? 'bg-primary-500 text-white'
                          : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {result.icon}
                        <div>
                          <div className="font-medium">{result.title}</div>
                          <div
                            className={`text-sm ${
                              index === selectedIndex
                                ? 'text-white/80'
                                : 'text-neutral-500 dark:text-neutral-400'
                            }`}
                          >
                            {result.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {query && results.length === 0 && (
                <div className="py-14 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  No results found for "{query}"
                </div>
              )}

              {!query && (
                <div className="py-14 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  Type to start searching...
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
