'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useNotification } from '@/context/NotificationContext';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { success, error: showError } = useNotification();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      });

      if (error) {
        showError(error.message);
      } else {
        success('Check your email for the confirmation link!');
        router.push('/login?message=check-email');
      }
    } catch (error) {
      showError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-8 dark:bg-neutral-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white px-8 py-12 shadow dark:bg-neutral-800 sm:px-10">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Create your account
          </h2>

          <form className="space-y-6" onSubmit={handleSignUp}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-200"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-neutral-300 px-3 py-2 shadow-sm placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder:text-neutral-400 sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-200"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-neutral-300 px-3 py-2 shadow-sm placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder:text-neutral-400 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-primary-500 dark:hover:bg-primary-400"
              >
                {loading ? 'Creating account...' : 'Sign up'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Already have an account?{' '}
            <a
              href="/login"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
