import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f5f1e8",
        ink: "#1f1d18",
        brand: {
          50: "#f7f4eb",
          100: "#ede4cd",
          200: "#dcc79a",
          300: "#c6a15c",
          400: "#ad8036",
          500: "#8b6424",
          600: "#72501d",
          700: "#5b3f19",
          800: "#4b3418",
          900: "#402d16"
        },
        success: "#1c7c54",
        warning: "#a26212",
        danger: "#b52d2d"
      },
      fontFamily: {
        sans: [
          "var(--font-body)",
          "ui-sans-serif",
          "system-ui"
        ],
        display: [
          "var(--font-display)",
          "ui-serif",
          "Georgia"
        ]
      },
      boxShadow: {
        panel: "0 20px 60px rgba(34, 24, 10, 0.12)"
      },
      backgroundImage: {
        "paper-grid":
          "linear-gradient(rgba(91, 63, 25, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(91, 63, 25, 0.06) 1px, transparent 1px)"
      },
      backgroundSize: {
        "paper-grid": "36px 36px"
      }
    },
  },
  plugins: [],
};

export default config;
