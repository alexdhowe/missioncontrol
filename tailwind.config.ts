import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Accent — refined, not loud
        accent: {
          DEFAULT: '#5B6EF5',
          hover: '#7B8CF8',
          muted: 'rgba(91,110,245,0.15)',
        },
        // Status — muted pastels for dark backgrounds
        status: {
          done: '#4ADE80',
          'in-progress': '#60A5FA',
          waiting: '#C084FC',
          'not-started': '#64748B',
        },
        priority: {
          urgent: '#FB7185',
          high: '#FB923C',
          medium: '#FBBF24',
          low: '#64748B',
        },
      },
      maxWidth: {
        content: '720px',
      },
      width: {
        sidebar: '260px',
        panel: '360px',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        // Glass inner highlight + outer depth
        glass: 'inset 0 1px 0 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.25)',
        'glass-lg': 'inset 0 1px 0 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.35)',
        'glass-ring': '0 0 0 0.5px rgba(255,255,255,0.1)',
        // Subtle tinted shadow for accent buttons
        'accent-sm': '0 2px 8px rgba(91,110,245,0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
        'slide-in-left': 'slideInLeft 0.25s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-100%)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config
