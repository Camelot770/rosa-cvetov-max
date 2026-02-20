/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E91E63',
          light: '#F48FB1',
          dark: '#C2185B',
        },
        accent: '#F48FB1',
      },
    },
  },
  plugins: [],
};
