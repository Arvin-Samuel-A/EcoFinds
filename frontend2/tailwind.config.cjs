/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["'Orbitron'", "sans-serif"],
        body: ["'Inter'", "sans-serif"]
      },
      boxShadow: {
        neon: "0 0 8px 0 rgba(236,72,153,.8), 0 0 16px 2px rgba(147,51,234,.6)"
      },
      colors: {
        accent: {
          pink: "#ec4899",
          purple: "#9333ea"
        }
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};
