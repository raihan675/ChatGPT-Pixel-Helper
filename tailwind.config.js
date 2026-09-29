/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10a37f', // OpenAI emerald
          600: '#0e8b6d',
          700: '#0b7259',
          900: '#064e3b',
        },
        surface: {
          bg: 'var(--surface-bg)',
          card: 'var(--surface-card)',
          border: 'var(--surface-border)',
          muted: 'var(--surface-muted)'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace']
      }
    },
  },
  plugins: [],
}
