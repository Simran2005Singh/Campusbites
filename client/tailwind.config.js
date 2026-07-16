/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#dce5fd',
          300: '#c2d2fb',
          400: '#9cb5f7',
          500: '#6d8ef0',
          600: '#3855c8',
          700: '#2c42a5',
          800: '#263687',
          900: '#23306d',
          950: '#151b43',
        },
        darkBg: {
          DEFAULT: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          text: '#f8fafc',
          muted: '#94a3b8',
        }
      },
    },
  },
  plugins: [],
}
