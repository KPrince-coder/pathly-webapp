'use client';

import { motion } from 'framer-motion';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const calculateStrength = (password: string): number => {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Character type checks
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return Math.min(strength, 5);
  };

  const getStrengthText = (strength: number): string => {
    switch (strength) {
      case 0:
        return 'Very Weak';
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Strong';
      case 5:
        return 'Very Strong';
      default:
        return '';
    }
  };

  const getStrengthColor = (strength: number): string => {
    switch (strength) {
      case 0:
        return 'bg-red-500';
      case 1:
        return 'bg-red-400';
      case 2:
        return 'bg-yellow-500';
      case 3:
        return 'bg-yellow-400';
      case 4:
        return 'bg-green-500';
      case 5:
        return 'bg-green-400';
      default:
        return 'bg-gray-200';
    }
  };

  const strength = calculateStrength(password);
  const strengthText = getStrengthText(strength);
  const strengthColor = getStrengthColor(strength);
  const strengthPercentage = (strength / 5) * 100;

  return (
    <div className="space-y-2">
      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${strengthColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${strengthPercentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      {password && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-gray-600"
        >
          Password strength: <span className="font-medium">{strengthText}</span>
        </motion.p>
      )}
    </div>
  );
}
