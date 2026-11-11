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
        mineral: '#EDF0ED',
        surface: {
          DEFAULT: '#F8FAF8',
          card: '#FFFFFF',
          dark: '#13201C',
        },
        ink: {
          DEFAULT: '#14201C',
          muted: '#5A6662',
          light: '#E6EFEA',
        },
        rail: {
          DEFAULT: '#0F1D19',
          active: '#1A2C27',
          hover: '#142420',
        },
        vault: {
          green: '#0F5C4D',
          hover: '#0C4B3E',
          mint: '#3FB89A',
          subtle: '#E6F4F1',
        },
        danger: {
          DEFAULT: '#9B2F1F',
          hover: '#822618',
          subtle: '#FCE8E6',
        },
        line: {
          DEFAULT: '#E2E6E3',
          dark: '#25362F',
        },
        night: '#0B1311',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'ui-monospace',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
