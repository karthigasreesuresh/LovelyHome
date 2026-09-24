/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0284c7',
          600: '#0284c7',
          700: '#0369a1',
        },
        elder: {
          bg: '#f8fafc',
          card: '#ffffff',
          primary: '#1e3a8a',
          accent: '#0d9488',
          danger: '#dc2626',
          success: '#16a34a',
        }
      }
    },
  },
  plugins: [],
}
