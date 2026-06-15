/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        upvote: '#FF4500',
        downvote: '#7193FF',
        brand: {
          orange: '#FF4500',
          blue: '#0079D3',
          bg: '#E5EBEE',
          card: '#FFFFFF',
          dark: '#1A1A1B',
          lightText: '#787C7E',
          border: '#D7DFE2',
        }
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
