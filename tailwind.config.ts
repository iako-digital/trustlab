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
          DEFAULT: "#0B2D5B", // Navy: headings, primary buttons, dark surfaces
          soft: "#1F2937", // Slate: body text
          faint: "#5B6B82", // muted text (AA on white and on paper)
        },
        paper: {
          DEFAULT: "#F3F6FB", // page background
          card: "#FFFFFF",
          line: "#D6E4F7", // light-blue hairlines
          tint: "#E6F1FF", // Light Blue: subtle containers and highlights
        },
        verdict: {
          // Fill/border colors; use the *ink variants for small text (AA contrast).
          fake: "#EF4444", // alert red: untrusted / misinformation
          fakeink: "#B91C1C",
          fakebg: "#FEF0F0",
          manip: "#D97706", // amber: manipulative
          manipink: "#92400E",
          manipbg: "#FEF4E0",
          true: "#10B981", // emerald/teal: verified
          trueink: "#047857",
          truebg: "#E6F8F1",
          pending: "#475569",
          pendingbg: "#E6F1FF",
        },
        brand: {
          DEFAULT: "#2563EB", // Royal Blue: links, hover, interaction
          navy: "#0B2D5B",
        },
        accent: "#10B981", // Teal Green: success, progress, badges
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
        card: "0 1px 2px rgba(11,45,91,0.06), 0 10px 28px -14px rgba(11,45,91,0.22)",
        lux: "0 2px 4px rgba(11,45,91,0.08), 0 20px 44px -16px rgba(11,45,91,0.38)",
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
};

export default config;
