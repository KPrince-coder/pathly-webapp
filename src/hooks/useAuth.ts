import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from './useSupabase';
import { useNotification } from '@/context/NotificationContext';

// Helper function to generate a unique username
function generateUsername(email: string, name: string): string {
  const baseUsername = name.toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15);
    
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${baseUsername}${randomSuffix}`;
}

export function useAuth() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { showNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password,
        });

        if (error) {
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Please check your email and confirm your account before signing in');
          }
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password');
          }
          throw error;
        }

        router.push('/dashboard');
        return true;
      } catch (error: any) {
        console.error('Sign in error:', error);
        showNotification(error.message || 'Failed to sign in', 'error');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [router, supabase.auth, showNotification]
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        setIsLoading(true);
        
        // Add delay if there was a recent signup attempt
        const lastSignupAttempt = localStorage.getItem('lastSignupAttempt');
        if (lastSignupAttempt) {
          const timeSinceLastAttempt = Date.now() - parseInt(lastSignupAttempt);
          if (timeSinceLastAttempt < 60000) { // Less than 1 minute
            throw new Error('Please wait a minute before trying again');
          }
        }
        
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const { data, error } = await supabase.auth.signUp({
          email: email.toLowerCase().trim(),
          password,
          options: {
            data: {
              name: name.trim(),
              email_confirm: false,
            },
            emailRedirectTo: `${appUrl}/callback`,
          },
        });

        if (error) {
          if (error.status === 429) {
            throw new Error('Too many signup attempts. Please try again in a few minutes.');
          }
          if (error.message.includes('invalid')) {
            throw new Error('Please enter a valid email address');
          }
          if (error.message.includes('User already registered')) {
            throw new Error('This email is already registered. Please use a different email or sign in.');
          }
          console.error('Signup error:', error);
          throw error;
        }

        if (!data?.user?.id) {
          throw new Error('Signup failed - unable to create user account');
        }

        // Store the signup attempt timestamp
        localStorage.setItem('lastSignupAttempt', Date.now().toString());

        // Show success message with email confirmation instructions
        showNotification('Please check your email for a confirmation link to complete your registration.', 'success');

        return true;
      } catch (error: any) {
        console.error('Full signup error:', error);
        showNotification(error.message || 'An error occurred during signup', 'error');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase.auth, showNotification]
  );

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/login');
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [router, supabase.auth, showNotification]);

  const resetPassword = useCallback(
    async (email: string) => {
      try {
        setIsLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
        });

        if (error) throw error;

        return true;
      } catch (error: any) {
        showNotification(error.message, 'error');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase.auth, showNotification]
  );

  const updatePassword = useCallback(
    async (newPassword: string) => {
      try {
        setIsLoading(true);
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) throw error;

        return true;
      } catch (error: any) {
        showNotification(error.message, 'error');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase.auth, showNotification]
  );

  return {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };
}
