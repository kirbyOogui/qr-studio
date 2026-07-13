import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#FBFBFD",
        ink: "#1D1D1F",
        accent: "#0071E3",
      },
      borderRadius: {
        apple: "20px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
        card: "0 2px 8px rgba(0,0,0,0.04), 0 24px 48px -16px rgba(0,0,0,0.14)",
        glow: "0 8px 24px -4px rgba(0,113,227,0.4)",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #0A84FF 0%, #6D28D9 60%, #C2185B 100%)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Inter",
          "Segoe UI",
          "Hiragino Sans",
          "Yu Gothic",
          "sans-serif",
        ],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
