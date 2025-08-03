/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,js}",
    "./src/**/*.component.{html,ts}",
    "!./src/**/*.spec.ts",
    "!./src/**/*.old.*",
    "!./src/**/backup/**/*"
  ],
  // Enable JIT mode for smaller bundle size
  mode: 'jit',
  
  theme: {
    extend: {
      // Custom design system tokens
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
        }
      },
      fontFamily: {
        sans: ['Source Sans Pro', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'skeleton': 'skeleton 1.4s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        skeleton: {
          '0%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  
  plugins: [
    // Add form styling plugin
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    
    // Custom utilities
    function({ addUtilities }) {
      addUtilities({
        '.text-shadow': {
          textShadow: '0 2px 4px rgba(0,0,0,0.10)',
        },
        '.text-shadow-md': {
          textShadow: '0 4px 8px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
        },
        '.text-shadow-lg': {
          textShadow: '0 15px 35px rgba(0,0,0,0.1), 0 5px 15px rgba(0,0,0,0.07)',
        },
        '.glass': {
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
        },
      })
    }
  ],
  
  // Optimize for production
  corePlugins: {
    // Disable unused core plugins for smaller bundle
    float: false,
    objectFit: false,
    objectPosition: false,
    clear: false,
    placeholderColor: false,
    placeholderOpacity: false,
    verticalAlign: false,
  },
}
