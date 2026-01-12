/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}" // <--- Esta línea es la que hace la magia
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}