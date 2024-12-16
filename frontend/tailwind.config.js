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
          900: '#0a192f',
          800: '#172a46',
          700: '#1f3a5f',
        },
        accent: {
          400: '#4299e1',
          500: '#3182ce',
          600: '#2b6cb0',
        }
      },
      animation: {
        'background-shine': 'background-shine 2s linear infinite',
      },
      keyframes: {
        'background-shine': {
          from: { backgroundPosition: '0 0' },
          to: { backgroundPosition: '-200% 0' }
        }
      }
    },
  },
  plugins: [],
}
