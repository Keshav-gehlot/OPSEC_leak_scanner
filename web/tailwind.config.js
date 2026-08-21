/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0B1020',
        sidebar: '#0E1528',
        card: {
          DEFAULT: '#141C31',
          hover: '#19223A',
        },
        border: '#24304A',
        primary: {
          DEFAULT: '#6C63FF',
          hover: '#5B52E0',
          muted: 'rgba(108, 99, 255, 0.15)',
        },
        secondary: {
          DEFAULT: '#38BDF8',
          hover: '#0EA5E9',
          muted: 'rgba(56, 189, 248, 0.15)',
        },
        critical: {
          DEFAULT: '#EF4444',
          muted: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.3)',
        },
        high: {
          DEFAULT: '#F97316',
          muted: 'rgba(249, 115, 22, 0.15)',
          border: 'rgba(249, 115, 22, 0.3)',
        },
        medium: {
          DEFAULT: '#EAB308',
          muted: 'rgba(234, 179, 8, 0.15)',
          border: 'rgba(234, 179, 8, 0.3)',
        },
        low: {
          DEFAULT: '#22C55E',
          muted: 'rgba(34, 197, 94, 0.15)',
          border: 'rgba(34, 197, 94, 0.3)',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
        'glow-primary': '0 0 25px -5px rgba(108, 99, 255, 0.3)',
        'glow-critical': '0 0 25px -5px rgba(239, 68, 68, 0.3)',
      },
    },
  },
  plugins: [],
}
