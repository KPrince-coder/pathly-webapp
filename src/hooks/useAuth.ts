'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useNotification } from '@/context/NotificationContext';

export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success: showSuccess, error: showError } = useNotification();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        router.push('/dashboard');
      } else if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const generateUsername = (email: string, name: string): string => {
    // First try: use the part before @ in email
    let username = email.split('@')[0].toLowerCase();
    
    // If that's too short, use the name
    if (username.length < 3) {
      username = name.toLowerCase().replace(/\s+/g, '');
    }
    
    // Add some random numbers to make it more unique
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${username}${randomSuffix}`;
  };

  const validatePassword = (password: string): boolean => {
    // Password must be at least 8 characters long and contain a mix of letters and numbers
    if (password.length < 8) return false;
    if (!/[A-Za-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const signUp = async (email: string, password: string, name: string) => {
    console.log('Starting signup in useAuth...');
    setIsLoading(true);
    setError(null);

    try {
      // Input validation
      if (!email || !password || !name) {
        throw new Error('All fields are required');
      }

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (!validatePassword(password)) {
        throw new Error('Password must be at least 8 characters long and contain letters and numbers');
      }

      if (name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters long');
      }

      // Create Supabase client with error logging
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            flowType: 'pkce',
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
          },
        }
      );

      // Attempt signup
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            email_confirm: false,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      console.log('Auth signup response:', { data, error });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.user?.id) {
        throw new Error('No user data returned from signup');
      }

      // Create profile only after successful auth signup
      const username = generateUsername(email, name);
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: data.user.id,
          email: email.toLowerCase().trim(),
          username,
          full_name: name.trim(),
          created_at: new Date().toISOString(),
        }])
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        await supabase.auth.signOut(); // Cleanup on profile creation failure
        throw new Error('Failed to create user profile');
      }

      showSuccess('Account created! Please check your email to confirm your account.');
      return true;

    } catch (err: any) {
      console.error('Signup process error:', err);
      showError(err.message || 'An error occurred during signup');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        showError(signInError.message);
        return false;
      }

      if (authData.user) {
        router.push('/dashboard');
      }
      return true;
    } catch (err: any) {
      showError(err.message || 'Failed to sign in');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        showError(signOutError.message);
        return false;
      }
      return true;
    } catch (err: any) {
      showError(err.message || 'Failed to sign out');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    signUp,
    signIn,
    signOut,
  };
}
