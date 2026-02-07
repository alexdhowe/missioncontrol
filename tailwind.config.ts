import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#DBEAFE',
        },
        sidebar: '#F7F7F7',
        priority: {
          urgent: '#EF4444',
          high: '#F97316',
          medium: '#EAB308',
          low: '#6B7280',
        },
        status: {
          done: '#22C55E',
          'in-progress': '#3B82F6',
          waiting: '#A855F7',
          'not-started': '#9CA3AF',
        },
      },
      maxWidth: {
        content: '720px',
      },
      width: {
        sidebar: '280px',
        panel: '360px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config
