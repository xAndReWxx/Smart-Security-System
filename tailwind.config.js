/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      animation: {
        "spin-slow": "spin 2s linear infinite",
        "pulse-soft": "pulse 2.5s ease-in-out infinite",
        "slide-in": "slideIn 0.4s ease-out forwards",
      },
      keyframes: {
        slideIn: {
          from: {
            opacity: "0",
            transform: "translateX(20px)",
          },
          to: {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
      },
    },
  },

  plugins: [],
};
