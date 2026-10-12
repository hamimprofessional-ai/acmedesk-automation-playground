/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(110%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'flash': {
          '0%': { opacity: '1' },
          '70%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'logo-glow': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.85)' },
          '50%': { opacity: '0.7', transform: 'scale(1.15)' },
        },
        'logo-mark': {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
          '50%': { transform: 'scale(1.06) rotate(6deg)' },
        },
        'logo-twinkle': {
          '0%, 100%': { opacity: '0.35', transform: 'scale(0.65)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        'logo-text': {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.25s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
        'flash': 'flash 0.9s ease-in forwards',
        'logo-glow': 'logo-glow 3s ease-in-out infinite',
        'logo-mark': 'logo-mark 4.5s ease-in-out infinite',
        'logo-twinkle': 'logo-twinkle 2.6s ease-in-out infinite',
        'logo-text': 'logo-text 4s linear infinite',
      },
    },
  },
  plugins: [],
};
