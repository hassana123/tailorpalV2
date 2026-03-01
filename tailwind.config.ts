// tailwind.config.ts
import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input:  'hsl(var(--input))',
        ring:   'hsl(var(--ring))',

        /* ── Brand palette ───────────────────────────────────────────── */
        brand: {
          ink:     '#0D1A33',   /* deep midnight — headlines, dark UI     */
          charcoal:'#2D3142',   /* softer dark — body text, secondary UI  */
          gold:    '#D97B2B',   /* warm terracotta gold — primary CTA     */
          'gold-light': '#F5C58A',
          cream:   '#FAF9F7',   /* warm off-white background              */
          stone:   '#8B8680',   /* warm mid-tone neutral                  */
          sage:    '#7A9E8E',   /* soft sage — success / green moments    */
          blush:   '#E8C5B0',   /* pale terracotta — hover tints          */
          border:  '#E8E4DC',   /* warm border                            */
        },

        /* Chart tokens */
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },

      fontFamily: {
        sans:    ['Plus Jakarta Sans', ...defaultTheme.fontFamily.sans],
        display: ['DM Serif Display', 'Georgia', 'serif'],
        mono:    ['ui-monospace', 'Cascadia Code', 'Menlo', 'monospace'],
      },

      borderRadius: {
        sm:   'calc(var(--radius) - 2px)',
        DEFAULT: 'var(--radius)',
        md:   'var(--radius)',
        lg:   'calc(var(--radius) + 2px)',
        xl:   'calc(var(--radius) + 6px)',
        '2xl':'calc(var(--radius) + 12px)',
        '3xl':'calc(var(--radius) + 20px)',
      },

      backgroundImage: {
        'gradient-brand':         'linear-gradient(135deg, #0D1A33 0%, #2D3142 100%)',
        'gradient-brand-reverse': 'linear-gradient(135deg, #2D3142 0%, #0D1A33 100%)',
        'gradient-gold':          'linear-gradient(135deg, #D97B2B 0%, #F5A94E 100%)',
        'gradient-hero':          'linear-gradient(160deg, #0D1A33 0%, #1A2744 45%, #2D3142 100%)',
        'gradient-warm':          'linear-gradient(135deg, #FAF9F7 0%, #F5EFE6 100%)',
        'gradient-subtle':        'linear-gradient(135deg, rgba(13,26,51,0.04) 0%, rgba(217,123,43,0.04) 100%)',
        'gradient-dark':          'linear-gradient(135deg, #0D1A33 0%, #1A2744 50%, #2D3142 100%)',
      },

      boxShadow: {
        brand:        '0 4px 24px rgba(13, 26, 51, 0.18)',
        'brand-lg':   '0 8px 48px rgba(13, 26, 51, 0.24)',
        gold:         '0 4px 24px rgba(217, 123, 43, 0.28)',
        'gold-lg':    '0 8px 48px rgba(217, 123, 43, 0.35)',
        card:         '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 40px rgba(13,26,51,0.10)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.1)',
      },

      animation: {
        'float':         'float 4.5s ease-in-out infinite',
        'float-delayed': 'float 5.5s ease-in-out infinite 1.2s',
        'shimmer':       'shimmer 3s linear infinite',
        'pulse-glow':    'pulse-glow 2.5s ease-in-out infinite',
        'gradient-shift':'gradient-shift 5s ease infinite',
        'fade-in':       'fadeIn 0.55s ease-out',
        'slide-up':      'slideUp 0.55s ease-out',
        'slide-in-right':'slideInRight 0.45s ease-out',
      },

      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(217,123,43,0.30)' },
          '50%':       { boxShadow: '0 0 40px rgba(217,123,43,0.55)' },
        },
        'gradient-shift': {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config