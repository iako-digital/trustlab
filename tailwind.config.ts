import type { Config } from "tailwindcss";

/** Colour defined as an `r g b` CSS variable (see globals.css) so it keeps alpha modifiers like bg-ink/50. */
const v = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
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
          DEFAULT: v("ink"), // Navy: headings, primary buttons, dark surfaces
          soft: v("ink-soft"), // Slate: body text
          faint: v("ink-faint"), // muted text (AA on white and on paper)
        },
        paper: {
          DEFAULT: v("paper"), // page background
          card: v("paper-card"),
          line: v("paper-line"), // light-blue hairlines
          tint: v("paper-tint"), // Light Blue: subtle containers and highlights
        },
        verdict: {
          // Fill/border colors; use the *ink variants for small text (AA contrast).
          fake: "#EF4444", // alert red: untrusted / misinformation
          fakeink: v("fakeink"),
          fakebg: v("fakebg"),
          manip: "#D97706", // amber: manipulative
          manipink: v("manipink"),
          manipbg: v("manipbg"),
          true: "#10B981", // emerald/teal: verified
          trueink: v("trueink"),
          truebg: v("truebg"),
          pending: v("pending"),
          pendingbg: v("pendingbg"),
        },
        brand: {
          DEFAULT: v("brand"), // Royal Blue: links, hover, interaction
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
