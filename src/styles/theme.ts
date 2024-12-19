export const colors = {
  // Primary Colors
  primary: {
    50: '#F0F7FF',
    100: '#E0EFFF',
    200: '#B8DBFF',
    300: '#8AC2FF',
    400: '#5CA8FF',
    500: '#2E8FFF', // Main primary color
    600: '#2472CC',
    700: '#1A5599',
    800: '#103866',
    900: '#061B33',
  },
  // Secondary Colors - Purple
  secondary: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6', // Main secondary color
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },
  // Accent Colors - Green
  accent: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // Main accent color
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  // Neutral Colors
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  // Semantic Colors
  success: {
    light: '#86EFAC',
    DEFAULT: '#22C55E',
    dark: '#15803D',
  },
  warning: {
    light: '#FDE68A',
    DEFAULT: '#F59E0B',
    dark: '#B45309',
  },
  error: {
    light: '#FCA5A5',
    DEFAULT: '#EF4444',
    dark: '#B91C1C',
  },
  info: {
    light: '#93C5FD',
    DEFAULT: '#3B82F6',
    dark: '#1D4ED8',
  },
} as const;

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  border: {
    DEFAULT: string;
    focus: string;
  };
  button: {
    primary: {
      background: string;
      text: string;
      hover: string;
    };
    secondary: {
      background: string;
      text: string;
      hover: string;
    };
  };
}

export const themes: Record<Exclude<ThemeMode, 'system'>, ThemeColors> = {
  light: {
    background: {
      primary: colors.neutral[50],
      secondary: colors.neutral[100],
      tertiary: colors.neutral[200],
    },
    text: {
      primary: colors.neutral[900],
      secondary: colors.neutral[700],
      tertiary: colors.neutral[500],
      inverse: colors.neutral[50],
    },
    border: {
      DEFAULT: colors.neutral[200],
      focus: colors.primary[500],
    },
    button: {
      primary: {
        background: colors.primary[500],
        text: colors.neutral[50],
        hover: colors.primary[600],
      },
      secondary: {
        background: colors.secondary[500],
        text: colors.neutral[50],
        hover: colors.secondary[600],
      },
    },
  },
  dark: {
    background: {
      primary: colors.neutral[900],
      secondary: colors.neutral[800],
      tertiary: colors.neutral[700],
    },
    text: {
      primary: colors.neutral[50],
      secondary: colors.neutral[300],
      tertiary: colors.neutral[400],
      inverse: colors.neutral[900],
    },
    border: {
      DEFAULT: colors.neutral[700],
      focus: colors.primary[400],
    },
    button: {
      primary: {
        background: colors.primary[500],
        text: colors.neutral[50],
        hover: colors.primary[400],
      },
      secondary: {
        background: colors.secondary[500],
        text: colors.neutral[50],
        hover: colors.secondary[400],
      },
    },
  },
};
