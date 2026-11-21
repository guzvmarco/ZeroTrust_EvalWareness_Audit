/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nd: {
          blue: "#0c2340",
          gold: "#ae9142",
          brightGold: "#d39f10",
          darkGold: "#8c7535",
          green: "#0a843d",
          greenTint: "#b3dac5",
          canvas: "#f8f4ec",
          warmWhite: "#efe9d9",
          skyLight: "#edf2f9",
          skyMed: "#e1e8f2",
          skyBorder: "#c1cddd",
          crimson: "#991b1b",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Consolas",
          "Monaco",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
