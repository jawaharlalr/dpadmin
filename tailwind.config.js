/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#DC2626',   // red-600
          orange: '#F97316', // orange-500
          dark: '#7F1D1D',
        }
      }
    },
  },
  plugins: [],
}