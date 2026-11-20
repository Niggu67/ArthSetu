import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep forest near-black backgrounds inspired by the reference
        canvas: "#071A13",
        "canvas-subtle": "#0B2118",
        surface: "#102A1E",
        "surface-elevated": "#143527",
        "surface-card": "#0C231A",
        "border-subtle": "rgba(255, 255, 255, 0.08)",
        "border-strong": "rgba(255, 255, 255, 0.16)",
        "border-glow": "rgba(139, 207, 74, 0.28)",

        // Lime / Fresh Emerald Green Primary Accents (Reference: #8BCF4A, #A3E35C, #72C83C)
        brand: {
          50: "#F2FBEF",
          100: "#E2F6DD",
          200: "#C6EDBE",
          300: "#A3E35C", // Light lime
          400: "#8BCF4A", // Primary vibrant lime accent
          500: "#72C83C", // Emerald green
          600: "#5BA82D",
          700: "#448122",
          800: "#2F5B18",
          900: "#1A350D",
          950: "#0C1B06",
        },

        // Deep Forest & Slate Tones for Containers
        navy: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#142D22", // Deep forest container tone
          900: "#0B1D16",
          950: "#06130E",
        },

        // Warm Gold / Amber Accent for Financial Highlights
        ochre: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B", // Financial gold highlight
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },

        // Typography soft white & muted green-gray tones
        charcoal: {
          900: "#F8FAF8", // Bright warm white for headings
          800: "#ECEFEA",
          700: "#D1D8D2",
          600: "#A5B3A7", // Secondary muted text
          500: "#78877B", // Tertiary muted text
          400: "#556458",
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "'Noto Sans'",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.4), 0 2px 6px -1px rgba(0, 0, 0, 0.3)",
        "card-hover": "0 16px 32px -4px rgba(0, 0, 0, 0.6), 0 0 24px -2px rgba(139, 207, 74, 0.15)",
        "subtle-lift": "0 8px 24px -4px rgba(0, 0, 0, 0.5)",
        "elevation-1": "0 2px 8px rgba(0, 0, 0, 0.35)",
        "elevation-2": "0 6px 20px rgba(0, 0, 0, 0.45)",
        "elevation-3": "0 16px 36px rgba(0, 0, 0, 0.6)",
        "glow-brand": "0 0 25px rgba(139, 207, 74, 0.25)",
        "glow-card": "0 0 35px -5px rgba(11, 33, 24, 0.8)",
        "glow-amber": "0 0 20px rgba(245, 158, 11, 0.2)",
      },
      transitionTimingFunction: {
        "spring-gentle": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        pulseSlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.95)", opacity: "0.8" },
          "50%": { transform: "scale(1.2)", opacity: "0.2" },
          "100%": { transform: "scale(0.95)", opacity: "0.8" },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite",
        "pulse-slow": "pulseSlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-ring": "pulseRing 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
