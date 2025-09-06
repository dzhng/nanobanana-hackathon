import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FFFC00',
          border: '#D4AF37',
        },
        secondary: {
          DEFAULT: '#F3F4F6',
          border: '#9CA3AF',
        },
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
        sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        md: ['1rem', { lineHeight: '1.5rem' }], // 16px
        lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
        '5xl': ['3rem', { lineHeight: '1' }], // 48px
        '6xl': ['3.75rem', { lineHeight: '1' }], // 60px
        '7xl': ['4.5rem', { lineHeight: '1' }], // 72px
        '8xl': ['6rem', { lineHeight: '1' }], // 96px
        '9xl': ['8rem', { lineHeight: '1' }], // 128px
      },
      boxShadow: {
        'sm-light': '0 1px 2px 0 rgba(0, 0, 0, 0.045)',
        light:
          '0 1px 3px 0 rgba(0, 0, 0, 0.09), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md-light':
          '0 4px 6px -1px rgba(0, 0, 0, 0.09), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg-light':
          '0 10px 15px -3px rgba(0, 0, 0, 0.09), 0 4px 6px -2px rgba(0, 0, 0, 0.045)',
        'xl-light':
          '0 20px 25px -5px rgba(0, 0, 0, 0.09), 0 10px 10px -5px rgba(0, 0, 0, 0.03)',
      },
      screens: {
        xs: '475px',
      },
    },
  },
  plugins: [],
};

export default config;
