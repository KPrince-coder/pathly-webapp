import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { Header } from '@/components/layout/Header';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pathly - Goal Setting & Task Management',
  description: 'A comprehensive goal setting and task management application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50 transition-colors`}>
        <ThemeProvider>
          <NotificationProvider>
            <Header />
            <main className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
              {children}
            </main>
            <ToastContainer 
              position="bottom-right"
              theme="colored"
              className="dark:text-neutral-50"
            />
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
