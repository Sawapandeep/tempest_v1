import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // We do NOT use Tailwind's darkMode — we manage it ourselves via html.light class + CSS vars
  theme: {
    extend: {
      colors: {
        // AMOLED base — map directly to CSS vars so they respond to .light class
        "amoled-black":   "var(--bg-primary)",
        "amoled-surface": "var(--bg-surface)",
        "amoled-card":    "var(--bg-card)",
        "amoled-elevated":"var(--bg-elevated)",

        // Brand accents (fixed — same in both modes)
        "tempest-cyan":   "#00D4FF",
        "tempest-orange": "#FF6B00",
        "tempest-green":  "#00FF88",
        "tempest-red":    "#FF2D55",
        "tempest-yellow": "#FFD60A",
        "tempest-purple": "#BF5AF2",

        // Semantic text colours tied to CSS vars
        "theme-text":     "var(--text-primary)",
        "theme-muted":    "var(--text-muted)",
        "theme-secondary":"var(--text-secondary)",
      },

      fontFamily: {
        display: ["'Exo 2'", "sans-serif"],
        body:    ["'DM Sans'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },

      borderColor: {
        subtle:  "var(--border-subtle)",
        default: "var(--border-default)",
        strong:  "var(--border-strong)",
      },

      backgroundColor: {
        surface:  "var(--bg-surface)",
        card:     "var(--bg-card)",
        elevated: "var(--bg-elevated)",
      },

      boxShadow: {
        "cyan-glow":   "0 0 20px rgba(0,212,255,0.35)",
        "orange-glow": "0 0 20px rgba(255,107,0,0.35)",
        "green-glow":  "0 0 20px rgba(0,255,136,0.35)",
        "red-glow":    "0 0 20px rgba(255,45,85,0.45)",
      },

      keyframes: {
        "pulse-ring": {
          "0%,100%": { boxShadow: "0 0 20px rgba(0,212,255,0.25)" },
          "50%":     { boxShadow: "0 0 40px rgba(0,212,255,0.55)" },
        },
        "sos-pulse": {
          "0%,100%": { boxShadow: "0 0 20px rgba(255,45,85,0.30)" },
          "50%":     { boxShadow: "0 0 50px rgba(255,45,85,0.70)" },
        },
      },

      animation: {
        "pulse-ring": "pulse-ring 2s ease-in-out infinite",
        "sos-pulse":  "sos-pulse 1s ease-in-out infinite",
        "spin-slow":  "spin 4s linear infinite",
        "ping-slow":  "ping 2s cubic-bezier(0,0,0.2,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;