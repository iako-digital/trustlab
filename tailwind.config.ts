import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        // Editorial "evidence desk" palette — ink + paper + a 3-verdict system.
        ink: {
          DEFAULT: "#0F1B2D", // deep newsroom navy-black
          soft: "#33415C",
          faint: "#6B7789",
        },
        paper: {
          DEFAULT: "#F7F6F2", // clean archival off-white (not the terracotta-cream tell)
          card: "#FFFFFF",
          line: "#E4E1D8",
        },
        verdict: {
          fake: "#C1272D",     // regional red
          fakebg: "#FBECEC",
          manip: "#B7791F",    // amber ochre
          manipbg: "#FBF2E1",
          true: "#2E7D5B",     // evidence green
          truebg: "#E7F2EC",
          pending: "#4B5C74",
          pendingbg: "#ECEFF3",
        },
        brand: "#0E5A8A", // signal blue used sparingly for links/actions
      },
      fontFamily: {
        serif: [
          '"Noto Serif Georgian"',
          '"Noto Serif Armenian"',
          '"Noto Serif"',
          "Georgia",
          "serif",
        ],
        sans: [
          'Inter',
          '"Noto Sans Georgian"',
          '"Noto Sans Armenian"',
          '"Noto Sans"',
          "system-ui",
          "-apple-system",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,27,45,0.04), 0 8px 24px -12px rgba(15,27,45,0.12)",
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
};

export default config;
