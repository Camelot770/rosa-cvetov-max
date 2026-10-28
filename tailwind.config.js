/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper:        '#F4EFE5',
        'paper-2':    '#EEE7D8',
        ink:          '#1A1612',
        'ink-soft':   '#4A4038',
        'ink-line':   '#D8CFBD',
        vermilion:    '#C8421E',
        'vermilion-dark': '#9F3516',
        taupe:        '#8E8172',
        // Back-compat aliases so existing primary-* classes keep rendering.
        primary: {
          DEFAULT: '#C8421E',
          light:   '#E06A47',
          dark:    '#9F3516',
        },
        accent: '#C8421E',
      },
      fontFamily: {
        display:  ['"DM Serif Display"', '"Italiana"', 'Georgia', 'serif'],
        italiana: ['"Italiana"', 'Georgia', 'serif'],
        mono:     ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        body:     ['"DM Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      letterSpacing: {
        mega: '0.28em',
      },
    },
  },
  plugins: [],
};
