/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef5ff',
          100: '#d9e8ff',
          200: '#bcd6ff',
          300: '#8ebcff',
          400: '#5996ff',
          500: '#316fff',
          600: '#1a4ef5',
          700: '#153be1',
          800: '#1730b6',
          900: '#1a2e8f',
          950: '#151d57',
        },
        ink: {
          50: '#f7f8fa',
          100: '#eef0f4',
          200: '#dcdfe7',
          300: '#bfc4d2',
          400: '#9aa1b3',
          500: '#717891',
          600: '#565d75',
          700: '#444a60',
          800: '#2f3447',
          900: '#1e2233',
          950: '#12141f',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(16, 24, 40, 0.05), 0 1px 3px 0 rgba(16, 24, 40, 0.04)',
        'card-hover': '0 4px 12px -2px rgba(16, 24, 40, 0.08), 0 2px 6px -2px rgba(16, 24, 40, 0.05)',
        pop: '0 12px 32px -8px rgba(16, 24, 40, 0.18), 0 4px 12px -4px rgba(16, 24, 40, 0.1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in': 'slide-in 0.25s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
};
