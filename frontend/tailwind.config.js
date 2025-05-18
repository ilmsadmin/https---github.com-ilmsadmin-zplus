const rtlPlugin = require('tailwindcss-flip');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Your existing theme colors
      },
      fontFamily: {
        // Your existing font families
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    rtlPlugin,
  ],
};
