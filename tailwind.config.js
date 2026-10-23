/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0B2447', 50: '#EEF3FA', 100: '#D6E1F0', 600: '#0B2447', 700: '#081A35', 800: '#061428' },
        accent: { DEFAULT: '#19A7CE', 50: '#E8F8FC', 100: '#C9EFF8', 500: '#19A7CE', 600: '#1290B4' },
        canvas: '#F8FAFC',
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      boxShadow: {
        soft: '0 4px 24px -6px rgba(11,36,71,0.10)',
        card: '0 1px 3px rgba(11,36,71,0.06), 0 8px 28px -12px rgba(11,36,71,0.14)',
        glow: '0 10px 40px -10px rgba(25,167,206,0.55)',
      },
    },
  },
  plugins: [],
}