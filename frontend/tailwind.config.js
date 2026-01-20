/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Hier definieren wir das Omnicore-Branding
        primary: {
          DEFAULT: '#e11d48', // Das kräftige Rot
          hover: '#fb7185',
        },
        slate: {
          950: '#0b0c10', // Dein tiefer Hintergrundwert
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}