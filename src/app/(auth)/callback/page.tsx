'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/hooks/useSupabase';
import { useNotification } from '@/context/NotificationContext';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { success, error: showError } = useNotification();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the error and next URL from the URL hash
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        const type = hashParams.get('type');

        if (error) {
          throw new Error(errorDescription || 'Error during email confirmation');
        }

        if (type === 'email_confirmation') {
          success('Email confirmed successfully! Please sign in to continue.');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        } else {
          // Handle other auth callbacks if needed
          router.push('/login');
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        showError(error.message || 'An error occurred during authentication');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    };

    handleEmailConfirmation();
  }, [router, success, showError]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Processing your request...
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Please wait while we confirm your email.
        </p>
      </div>
    </div>
  );
}
