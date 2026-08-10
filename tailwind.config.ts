import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#0a0a0c',
          900: '#111114',
          850: '#16161a',
          800: '#1c1c21',
          700: '#28282f',
          600: '#3a3a44',
          500: '#54545f',
          400: '#7a7a86',
          300: '#a3a3ad',
          200: '#cfcfd6',
          100: '#eeeef1',
        },
        accent: {
          DEFAULT: '#e63946',
          muted: '#c22c38',
          soft: '#3a1418',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        drawLine: {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        fadeSlideUp: 'fadeSlideUp 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
