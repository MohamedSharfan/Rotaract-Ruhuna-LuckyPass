import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-sora)", "system-ui", "sans-serif"],
        body: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      colors: {
        void: "#080510",
        plum: "#241147",
        neonPink: "#ff2ea6",
        electric: "#37d5ff",
        prize: "#ffd36a",
      },
      boxShadow: {
        glow: "0 0 40px rgba(255, 46, 166, 0.35), 0 0 80px rgba(55, 213, 255, 0.18)",
        gold: "0 0 42px rgba(255, 211, 106, 0.34)",
      },
    },
  },
  plugins: [],
};

export default config;
