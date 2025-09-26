/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Mobile-first responsive breakpoints
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Mobile-specific breakpoints
        'mobile': { 'max': '767px' },
        'tablet': { 'min': '768px', 'max': '1023px' },
        'desktop': { 'min': '1024px' },
        // Touch device optimizations
        'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
        'no-touch': { 'raw': '(hover: hover) and (pointer: fine)' },
      },

      // Mobile-optimized spacing
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        'keyboard': 'env(keyboard-inset-height)',
      },

      // Mobile-friendly colors
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },

      // Mobile-optimized typography
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        // Mobile-specific sizes
        'mobile-xs': ['0.8125rem', { lineHeight: '1.125rem' }],
        'mobile-sm': ['0.9375rem', { lineHeight: '1.375rem' }],
        'mobile-base': ['1.0625rem', { lineHeight: '1.625rem' }],
      },

      // Mobile-optimized shadows
      boxShadow: {
        'mobile': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'mobile-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'mobile-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },

      // Mobile-optimized animations
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },

      // Mobile-optimized transitions
      transitionDuration: {
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    require('@tailwindcss/typography'),
    // Custom mobile-optimized utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Touch-friendly utilities
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        '.touch-none': {
          'touch-action': 'none',
        },
        '.touch-pan-x': {
          'touch-action': 'pan-x',
        },
        '.touch-pan-y': {
          'touch-action': 'pan-y',
        },

        // iOS-specific utilities
        '.ios-momentum-scroll': {
          '-webkit-overflow-scrolling': 'touch',
        },
        '.ios-safe-area-top': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        '.ios-safe-area-bottom': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },

        // Mobile-optimized text
        '.text-mobile-prevent-zoom': {
          'font-size': '16px',
          '@media (max-width: 767px)': {
            'font-size': '16px !important',
          },
        },

        // Mobile-optimized heights
        '.h-mobile-screen': {
          'height': '100vh',
          'height': '-webkit-fill-available',
        },
        '.min-h-mobile-screen': {
          'min-height': '100vh',
          'min-height': '-webkit-fill-available',
        },

        // Mobile grid utilities
        '.mobile-grid-stack': {
          '@media (max-width: 767px)': {
            'grid-template-columns': '1fr !important',
          },
        },

        // Mobile-optimized scrollbars
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            'display': 'none',
          },
        },

        // Better mobile focus
        '.mobile-focus': {
          '&:focus': {
            'outline': '2px solid ' + theme('colors.primary.500'),
            'outline-offset': '2px',
          },
        },

        // Mobile-optimized buttons
        '.btn-mobile-touch': {
          'min-height': '44px',
          'min-width': '44px',
          'padding': '12px 16px',
          'touch-action': 'manipulation',
          'user-select': 'none',
          '-webkit-user-select': 'none',
        },
      };

      addUtilities(newUtilities);
    },
  ],
};