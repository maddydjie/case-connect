import type { Config } from 'tailwindcss';

let sharedConfig: Partial<Config> = {};
try {
  sharedConfig = require('../../packages/config/tailwind/tailwind.config');
} catch {
  // Shared config not available, use defaults
}

const config: Config = {
  darkMode: 'class',
  ...sharedConfig,
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    ...(sharedConfig.content as string[] ?? []),
  ],
  theme: {
    extend: {
      ...(sharedConfig.theme?.extend ?? {}),
      colors: {
        ...(typeof sharedConfig.theme?.extend === 'object' &&
        sharedConfig.theme?.extend !== null &&
        'colors' in sharedConfig.theme.extend
          ? (sharedConfig.theme.extend as Record<string, unknown>).colors as Record<string, unknown>
          : {}),
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backdropBlur: {
        '2xl': '40px',
        '3xl': '64px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [...(sharedConfig.plugins ?? [])],
};

export default config;
