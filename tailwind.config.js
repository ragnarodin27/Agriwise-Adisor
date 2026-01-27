/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'agri-teal': '#006D6F',
        'agri-dark': '#005557',
        'agri-bg': '#F4F6F5',
        'agri-card': '#FFFFFF',
        'agri-text': '#1F2933',
        'agri-gray': '#6B7280',
        'icon-mint': '#D1FAE5',
        'icon-teal': '#E0F2F1',
        'icon-yellow': '#FFF7CC',
        'icon-orange': '#FFEDD5',
        'agri-orange': '#F4A261',
        'agri-sun': '#FDB813',
        'blob-cyan': '#E0F2F1',
        'blob-green': '#D1FAE5',
        'blob-mint': '#A8E6CF',
      },
      borderRadius: {
        'card': '24px',
        'pill': '26px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 6px 20px rgba(0,0,0,0.06)',
        'glow': '0 0 20px rgba(0, 109, 111, 0.3)',
      }
    }
  },
  plugins: [],
}
