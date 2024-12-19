'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { FiGithub, FiGoogle } from 'react-icons/fi';

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
    <div className="space-y-4">
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
        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthSignIn('github')}
            className="w-full"
            isLoading={isLoading === 'github'}
          >
            <FiGithub className="w-5 h-5 mr-2" />
            GitHub
          </Button>
        </motion.div>

        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthSignIn('google')}
            className="w-full"
            isLoading={isLoading === 'google'}
          >
            <FiGoogle className="w-5 h-5 mr-2" />
            Google
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
