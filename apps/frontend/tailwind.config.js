/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#050B18",
          panel: "#0a1324",
          panelAlt: "#0d1a31",
          line: "#153355",
          neon: "#00FFC6",
          blue: "#007BFF",
          amber: "#FFC857",
          red: "#FF4D6D"
        }
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(0,255,198,0.22), 0 0 24px rgba(0,255,198,0.18)",
        glow: "0 0 20px rgba(0,255,198,0.3)"
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(57,160,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(57,160,255,0.09) 1px, transparent 1px)"
      },
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
