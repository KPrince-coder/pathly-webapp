import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from './useSupabase';
import { useNotification } from '@/context/NotificationContext';

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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name.trim(),
              email_confirm: false,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

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
        showError(error.message);
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
          redirectTo: `${window.location.origin}/auth/reset-password`,
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
