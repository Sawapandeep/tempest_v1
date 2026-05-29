import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // AMOLED core
        amoled: {
          black: "#000000",
          dark: "#080808",
          surface: "#0F0F0F",
          card: "#141414",
          border: "#1E1E1E",
          muted: "#2A2A2A",
        },
        // Tempest brand
        tempest: {
          cyan: "#00D4FF",
          "cyan-dim": "#0099CC",
          orange: "#FF6B00",
          "orange-dim": "#CC5500",
          green: "#00FF88",
          "green-dim": "#00CC6A",
          red: "#FF2D55",
          yellow: "#FFD60A",
          purple: "#BF5AF2",
        },
        // Light mode
        light: {
          bg: "#F5F5F5",
          surface: "#FFFFFF",
          card: "#F0F0F0",
          border: "#E0E0E0",
          text: "#1A1A1A",
          muted: "#666666",
        },
      },
      fontFamily: {
        display: ["'Exo 2'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "tempest-gradient": "linear-gradient(135deg, #00D4FF20, #FF6B0020)",
        "cyan-glow": "radial-gradient(circle, #00D4FF30 0%, transparent 70%)",
        "orange-glow":
          "radial-gradient(circle, #FF6B0030 0%, transparent 70%)",
        "glass-dark":
          "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        "glass-light":
          "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))",
      },
      boxShadow: {
        "cyan-glow": "0 0 20px rgba(0, 212, 255, 0.3)",
        "cyan-glow-lg": "0 0 40px rgba(0, 212, 255, 0.4)",
        "orange-glow": "0 0 20px rgba(255, 107, 0, 0.3)",
        "green-glow": "0 0 20px rgba(0, 255, 136, 0.3)",
        "red-glow": "0 0 20px rgba(255, 45, 85, 0.4)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
        "glass-light": "0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255,255,255,0.8)",
      },
      backdropBlur: {
        xs: "2px",
        "2xl": "40px",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      animation: {
        "pulse-cyan": "pulseCyan 2s ease-in-out infinite",
        "pulse-orange": "pulseOrange 2s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        "ping-slow": "ping 3s cubic-bezier(0, 0, 0.2, 1) infinite",
        blob: "blob 7s infinite",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fadeIn 0.3s ease-out",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "sos-pulse": "sosPulse 1s ease-in-out infinite",
      },
      keyframes: {
        pulseCyan: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 212, 255, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(0, 212, 255, 0.6)" },
        },
        pulseOrange: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255, 107, 0, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(255, 107, 0, 0.6)" },
        },
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        sosPulse: {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(255, 45, 85, 0.5)",
            transform: "scale(1)",
          },
          "50%": {
            boxShadow: "0 0 60px rgba(255, 45, 85, 0.9)",
            transform: "scale(1.05)",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;