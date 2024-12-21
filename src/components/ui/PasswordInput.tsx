'use client';

import { useState, useEffect } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showStrengthIndicator?: boolean;
}

interface PasswordStrength {
  score: number;
  message: string;
  color: string;
}

const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  let message = '';
  let color = 'bg-gray-200 dark:bg-gray-700';

  if (!password) {
    return { score: 0, message: '', color };
  }

  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1; // lowercase
  if (/[A-Z]/.test(password)) score += 1; // uppercase
  if (/[0-9]/.test(password)) score += 1; // numbers
  if (/[^A-Za-z0-9]/.test(password)) score += 1; // special characters

  // Determine message and color based on score
  switch (true) {
    case score === 0:
      message = 'Too weak';
      color = 'bg-red-500';
      break;
    case score <= 2:
      message = 'Weak';
      color = 'bg-red-400';
      break;
    case score <= 4:
      message = 'Medium';
      color = 'bg-yellow-400';
      break;
    case score <= 5:
      message = 'Strong';
      color = 'bg-green-400';
      break;
    default:
      message = 'Very strong';
      color = 'bg-green-500';
  }

  return { score: Math.min(score, 6), message, color };
};

export function PasswordInput({
  label,
  error,
  className = '',
  showStrengthIndicator = false,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState<PasswordStrength>({ score: 0, message: '', color: 'bg-gray-200 dark:bg-gray-700' });

  useEffect(() => {
    if (showStrengthIndicator && props.value && typeof props.value === 'string') {
      setStrength(calculatePasswordStrength(props.value));
    }
  }, [props.value, showStrengthIndicator]);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          className={`
            w-full px-4 py-2 rounded-lg border
            bg-white dark:bg-neutral-800
            text-gray-900 dark:text-white
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            ${className}
          `}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {showPassword ? (
            <FiEyeOff className="w-5 h-5" />
          ) : (
            <FiEye className="w-5 h-5" />
          )}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
      {showStrengthIndicator && props.value && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${strength.color} transition-all duration-300`}
                style={{ width: `${(strength.score / 6) * 100}%` }}
              />
            </div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 min-w-[80px] text-right">
              {strength.message}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Use 8+ characters with a mix of letters, numbers & symbols
          </p>
        </div>
      )}
    </div>
  );
}
