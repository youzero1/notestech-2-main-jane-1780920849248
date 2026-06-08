
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        satoshi: ["Satoshi", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
        bebas: ["Bebas Neue", "cursive"],
        display: ["Inter", "sans-serif"],
      },
      fontSize: {
        'stage-name': ['clamp(2.5rem, 8vw, 4.5rem)', { lineHeight: '1.1', fontWeight: '900' }],
        'stage-bio': ['clamp(1rem, 2vw, 1.25rem)', { lineHeight: '1.6', fontWeight: '400' }],
        'stage-link': ['clamp(1rem, 2vw, 1.125rem)', { lineHeight: '1.5', fontWeight: '600' }],
      },
      spacing: {
        'stage': '6rem',
        'stage-sm': '3rem',
      },
      colors: {
        border: "#333333",
        input: "#222222",
        ring: "#404040",
        background: "#000000",
        foreground: "#FFFFFF",
        primary: {
          DEFAULT: "#B08D57", // Gold/bronze color from the logo
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#1A1A1A",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#8B7355", // Darker gold for contrast
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#FF0000",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#1A1A1A",
          foreground: "#999999",
        },
        popover: {
          DEFAULT: "#000000",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#1A1A1A",
          foreground: "#FFFFFF",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
