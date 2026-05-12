export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {
    fontFamily: { sans: ['DM Sans', 'sans-serif'], display: ['Syne', 'sans-serif'] },
    colors: {
      brand: { 500: '#0ea5e9', 600: '#0284c7' },
      surface: { DEFAULT: '#0f1117', card: '#161b27', border: '#1e2535', hover: '#1a2030' }
    }
  }},
  plugins: [],
}