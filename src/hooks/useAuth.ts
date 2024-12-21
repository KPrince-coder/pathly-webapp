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
  const { error: showError } = useNotification();
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
          email,
          password,
        });

        if (error) throw error;

        router.push('/dashboard');
      } catch (error: any) {
        showError(error.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [router, supabase.auth, showError]
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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name.trim(),
              email_confirm: false,
            },
            emailRedirectTo: `${appUrl}/auth/callback`,
          },
        });

        if (error) {
          if (error.status === 429) {
            throw new Error('Too many signup attempts. Please try again in a few minutes.');
          }
          console.error('Signup error:', error);
          throw error;
        }

        // Store the signup attempt timestamp
        localStorage.setItem('lastSignupAttempt', Date.now().toString());

        const username = generateUsername(email, name);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not found');
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            username: username,
            display_name: name.trim(),
            bio: '',
            avatar_type: 'default',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Delete the auth user if profile creation fails
          await supabase.auth.admin.deleteUser(user.id);
          throw new Error('Database error saving new user profile. Please try again.');
        }

        return true;
      } catch (error: any) {
        console.error('Full signup error:', error);
        showError(error.message || 'An error occurred during signup');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase.auth, showError]
  );

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/login');
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [router, supabase.auth, showError]);

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
        showError(error.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase.auth, showError]
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
        showError(error.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase.auth, showError]
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
