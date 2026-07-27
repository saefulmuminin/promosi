import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        baznas: {
          // Warna korporat BAZNAS (biru & emas)
          blue: "#0057A8",
          navy: "#003a70",
          gold: "#F2A900",
        },
        // Palet warna daun (sesuai flow: emas, hijau, biru, putih, merah)
        leaf: {
          gold: "#F2C230",
          green: "#4CAF50",
          blue: "#2F8FEB",
          white: "#F5F7FA",
          red: "#E5484D",
          yellow: "#F2C230",
          purple: "#8E44AD",
          orange: "#E8792E",
        },
        // Token dashboard admin (tema gelap "Stitch").
        background: "#131313",
        "on-surface": "#e5e2e1",
        "on-surface-variant": "#c3c6d1",
        secondary: "#ffc970",
        "secondary-container": "#f1a800",
        "on-secondary": "#432c00",
        "secondary-fixed": "#ffdead",
        "primary-container": "#003a70",
        danger: "#ffb4ab",
        "danger-container": "#93000a",
        outline: "#8d919b",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        pulseLeaf: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(1.12)" },
        },
        floatUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        pulseLeaf: "pulseLeaf 1.1s ease-in-out infinite",
        floatUp: "floatUp 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
