'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface AuthError {
  message: string;
  field?: string;
}

interface SignUpData {
  name: string;
  email: string;
  password: string;
}

interface SignInData {
  email: string;
  password: string;
}

export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

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

  const signUp = async (data: SignUpData) => {
    setIsLoading(true);
    setError(null);

    try {
      // First, sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // Create a profile in the profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              full_name: data.name,
              email: data.email,
            },
          ]);

        if (profileError) throw profileError;

        router.push('/dashboard');
      }
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to sign up',
        field: err.field,
      });
      return false;
    } finally {
      setIsLoading(false);
    }

    return true;
  };

  const signIn = async (data: SignInData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) throw signInError;

      if (authData.user) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to sign in',
        field: err.field,
      });
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
      setError({
        message: err.message || 'Failed to sign out',
      });
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
      setError({
        message: err.message || 'Failed to send reset password email',
        field: 'email',
      });
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
