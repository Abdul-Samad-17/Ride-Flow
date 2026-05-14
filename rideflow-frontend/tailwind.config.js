/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amber: {
          core: '#F5A623',
          bright: '#FFB740',
          ghost: 'rgba(245, 166, 35, 0.08)',
          glow: 'rgba(245, 166, 35, 0.3)',
        }
      }
    },
  },
  plugins: [],
}
