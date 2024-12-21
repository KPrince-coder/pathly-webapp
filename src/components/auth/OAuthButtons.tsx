'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { FiGithub } from 'react-icons/fi';
import { AiOutlineGoogle } from 'react-icons/ai';

interface OAuthButtonsProps {
  onError?: (error: string) => void;
}

export function OAuthButtons({ onError }: OAuthButtonsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleOAuthSignIn = async (provider: 'github' | 'google') => {
    try {
      setIsLoading(provider);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      onError?.(err.message || `Failed to sign in with ${provider}`);
    } finally {
      setIsLoading(null);
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2,
      },
    },
    tap: {
      scale: 0.98,
    },
  };

  return (
    <div className="space-y-4 w-full sm:w-auto">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthSignIn('github')}
            className="w-full dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:border-neutral-700"
            isLoading={isLoading === 'github'}
          >
            <FiGithub className="w-5 h-5 mr-2" />
            GitHub
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthSignIn('google')}
            className="w-full dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:border-neutral-700"
            isLoading={isLoading === 'google'}
          >
            <AiOutlineGoogle className="w-5 h-5 mr-2" />
            Google
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
