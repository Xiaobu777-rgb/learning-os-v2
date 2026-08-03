import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#151719",
          800: "#2c3137",
          600: "#5a626d"
        },
        panel: "#f7f8fa",
        line: "#e3e6ea",
        brand: {
          700: "#24605a",
          600: "#2d756e",
          50: "#edf7f5"
        },
        focus: "#ad6a2b"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(21, 23, 25, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
