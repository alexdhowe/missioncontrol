import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0a0a12',
          deep: '#06060c',
          raised: '#111120',
          overlay: '#16162a',
          hover: 'rgba(255,255,255,0.06)',
          active: 'rgba(255,255,255,0.1)',
        },
        glass: {
          DEFAULT: 'rgba(255,255,255,0.03)',
          border: 'rgba(255,255,255,0.06)',
          light: 'rgba(255,255,255,0.08)',
        },
        accent: {
          DEFAULT: '#6366f1',
          hover: '#818cf8',
          light: 'rgba(99,102,241,0.15)',
          end: '#a855f7',
        },
        spark: {
          DEFAULT: '#06b6d4',
          light: 'rgba(6,182,212,0.15)',
        },
        sidebar: '#0c0c16',
        priority: {
          urgent: '#f43f5e',
          high: '#fb923c',
          medium: '#facc15',
          low: '#64748b',
        },
        status: {
          done: '#34d399',
          'in-progress': '#60a5fa',
          waiting: '#c084fc',
          'not-started': '#64748b',
        },
      },
      maxWidth: {
        content: '720px',
      },
      width: {
        sidebar: '260px',
        panel: '360px',
      },
      boxShadow: {
        glow: '0 0 30px rgba(99,102,241,0.15)',
        'glow-lg': '0 0 60px rgba(99,102,241,0.2)',
        'glow-accent': '0 0 20px rgba(99,102,241,0.4)',
        'glow-purple': '0 0 30px rgba(168,85,247,0.2)',
        'glow-cyan': '0 0 30px rgba(6,182,212,0.2)',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #6366f1, #a855f7)',
        'gradient-surface': 'linear-gradient(180deg, rgba(99,102,241,0.03) 0%, transparent 40%)',
        mesh: 'radial-gradient(at 20% 20%, rgba(99,102,241,0.08) 0%, transparent 50%), radial-gradient(at 80% 80%, rgba(168,85,247,0.06) 0%, transparent 50%)',
      },
      animation: {
        'gradient-shift': 'gradientShift 8s ease infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config
