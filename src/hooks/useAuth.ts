'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              full_name: name,
              email,
            },
          ]);

        if (profileError) throw profileError;
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      return false;
    } finally {
      setIsLoading(false);
    }

    return true;
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (authData.user) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      return false;
    } finally {
      setIsLoading(false);
    }

    return true;
  };

  const signOut = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
      return false;
    } finally {
      setIsLoading(false);
    }

    return true;
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;
    } catch (err: any) {
      setError(err.message || 'Failed to send reset password email');
      return false;
    } finally {
      setIsLoading(false);
    }

    return true;
  };

  return {
    isLoading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
}
