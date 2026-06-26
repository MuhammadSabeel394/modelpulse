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
        dark: {
          bg: '#0A0E17',       // terminal black
          card: '#121824',     // card gray
          border: '#1E293B',   // slate border
          text: '#F8FAFC',     // high contrast slate
          muted: '#64748B'     // gray
        },
        light: {
          bg: '#F8FAFC',       // light slate
          card: '#FFFFFF',     // white card
          border: '#E2E8F0',   // light border
          text: '#0F172A',     // dark slate text
          muted: '#64748B'     // gray
        },
        event: {
          launch: '#10B981',      // emerald green
          update: '#F59E0B',      // amber yellow
          deprecation: '#94A3B8', // slate gray
          restriction: '#EF4444', // crimson red
          pricing: '#3B82F6'      // royal blue
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
