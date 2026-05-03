/** @type {import('tailwindcss').Config} */
export default {
  // Dark mode disabled per spec Section 2.1 anti-pattern #1

  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // WHY hardcoded hex: Tailwind's JIT compiler cannot resolve CSS var() at build-time.
      // All values mirror the custom properties defined in index.css :root { }.
      colors: {
        // Backgrounds
        'bg-primary':     '#F8FAFB',
        'bg-elevated':    '#FFFFFF',
        'bg-subtle':      '#F1F5F9',
        'bg-interactive': '#E6F7F4',

        // Text
        'text-primary':   '#1A2332',
        'text-secondary': '#475569',
        'text-tertiary':  '#64748B',
        'text-disabled':  '#94A3B8',
        'text-inverted':  '#FFFFFF',

        // Borders
        'border-default': '#E2E8F0',
        'border-subtle':  '#F1F5F9',
        'border-strong':  '#CBD5E1',
        'border-focus':   '#0A6E5C',

        // Interactive (Medical Teal primary)
        'interactive-primary':        '#0A6E5C',
        'interactive-primary-hover':  '#085B4D',
        'interactive-primary-active': '#06483E',
        'interactive-secondary':      '#2C5F8D',
        'interactive-cta':            '#0F9D7E',
        'interactive-cta-hover':      '#0D8A6E',

        // Status / Severity
        'status-success':  '#10B981',
        'status-info':     '#3B82F6',
        'status-warning':  '#F59E0B',
        'status-danger':   '#EF4444',
        'status-critical': '#991B1B',

        // Medical Teal palette
        'medical-teal': {
          50:  '#E6F7F4',
          100: '#B3E8DE',
          200: '#80D9C8',
          300: '#4DCAB2',
          400: '#26BB9C',
          500: '#0A6E5C',
          600: '#085B4D',
          700: '#06483E',
          800: '#04352E',
          900: '#02221F',
        },
        // Clinical Blue palette
        'clinical-blue': {
          50:  '#E8F1F8',
          100: '#C1DAEB',
          200: '#9AC3DE',
          300: '#73ACD1',
          400: '#4C95C4',
          500: '#2C5F8D',
          600: '#244E74',
          700: '#1C3D5B',
          800: '#142C42',
          900: '#0C1B29',
        },
        // Neutral palette
        'neutral': {
          50:  '#F8FAFB',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#1A2332',
        },
      },

      // --- TYPOGRAPHY SCALE (Spec Section 2.3 — Modular Scale 1.250 Major Third) ---
      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1.5' }],
        'sm':   ['0.875rem', { lineHeight: '1.5' }],
        'base': ['1rem',     { lineHeight: '1.5' }],
        'lg':   ['1.125rem', { lineHeight: '1.5' }],
        'xl':   ['1.25rem',  { lineHeight: '1.375' }],
        '2xl':  ['1.5rem',   { lineHeight: '1.375' }],
        '3xl':  ['1.875rem', { lineHeight: '1.25' }],
        '4xl':  ['2.25rem',  { lineHeight: '1.25' }],
        '5xl':  ['3rem',     { lineHeight: '1.25' }],
      },

      // --- SPACING SYSTEM (Spec Section 2.4 — 4px base unit) ---
      spacing: {
        '0':  '0',
        '1':  '0.25rem',
        '2':  '0.5rem',
        '3':  '0.75rem',
        '4':  '1rem',
        '5':  '1.25rem',
        '6':  '1.5rem',
        '7':  '1.75rem',
        '8':  '2rem',
        '9':  '2.25rem',
        '10': '2.5rem',
        '11': '2.75rem',
        '12': '3rem',
        '14': '3.5rem',
        '16': '4rem',
        '18': '4.5rem',
        '20': '5rem',
        '24': '6rem',
        '28': '7rem',
        '32': '8rem',
        '36': '9rem',
        '40': '10rem',
        '44': '11rem',
        '48': '12rem',
        '56': '14rem',
        '64': '16rem',
        '72': '18rem',
        '80': '20rem',
        '96': '24rem',
      },

      // --- BORDER RADIUS (Spec Section 2.5) ---
      borderRadius: {
        'none': '0',
        'sm':   '0.25rem',
        'DEFAULT': '0.375rem',
        'md':   '0.5rem',
        'lg':   '0.75rem',
        'xl':   '1rem',
        '2xl':  '1.5rem',
        'full': '9999px',
      },

      // --- SHADOW SYSTEM (Spec Section 2.5) ---
      boxShadow: {
        'sm':    '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md':    '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg':    '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl':    '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl':   '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'teal':  '0 4px 14px 0 rgba(10, 110, 92, 0.3)',
        'focus': '0 0 0 3px rgba(10, 110, 92, 0.4)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        'none':  'none',
      },

      // --- TRANSITIONS ---
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      // --- FONT FAMILY ---
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },

      // --- KEYFRAMES ---
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUpFadeIn: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideDownFadeIn: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        emergencyPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(153, 27, 27, 0.4)' },
          '70%':      { boxShadow: '0 0 0 10px rgba(153, 27, 27, 0)' },
        },
        tealPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(10, 110, 92, 0.4)' },
          '70%':      { boxShadow: '0 0 0 8px rgba(10, 110, 92, 0)' },
        },
        statusDot: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
        progressBar: {
          from: { width: '0%' },
          to:   { width: '100%' },
        },
        cardEntrance: {
          from: { opacity: '0', transform: 'translateY(20px) scale(0.98)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        spin: {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
      },
      animation: {
        'fade-in':        'fadeIn 200ms ease-in-out',
        'slide-up':       'slideUpFadeIn 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down':     'slideDownFadeIn 200ms ease-out',
        'scale-in':       'scaleIn 200ms ease-out',
        'card-entrance':  'cardEntrance 400ms cubic-bezier(0.4, 0, 0.2, 1) both',
        'shimmer':        'shimmer 2s linear infinite',
        'pulse-slow':     'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'emergency-ring': 'emergencyPulse 1.5s ease-in-out infinite',
        'teal-ring':      'tealPulse 2s ease-in-out infinite',
        'status-dot':     'statusDot 2s ease-in-out infinite',
        'progress-bar':   'progressBar 2.5s ease-in-out forwards',
        'spin':           'spin 1s linear infinite',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
