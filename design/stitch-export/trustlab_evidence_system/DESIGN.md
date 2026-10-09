---
name: TrustLab Evidence System
colors:
  surface: '#faf9f5'
  surface-dim: '#dbdad6'
  surface-bright: '#faf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f4f0'
  surface-container: '#efeeea'
  surface-container-high: '#e9e8e4'
  surface-container-highest: '#e3e2df'
  on-surface: '#1b1c1a'
  on-surface-variant: '#41474f'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f1ed'
  outline: '#717880'
  outline-variant: '#c1c7d0'
  surface-tint: '#1e6393'
  primary: '#004269'
  on-primary: '#ffffff'
  primary-container: '#0e5a8a'
  on-primary-container: '#a0d0ff'
  inverse-primary: '#95ccff'
  secondary: '#535f74'
  on-secondary: '#ffffff'
  secondary-container: '#d4e0f9'
  on-secondary-container: '#576378'
  tertiary: '#5d3500'
  on-tertiary: '#ffffff'
  tertiary-container: '#7e4900'
  on-tertiary-container: '#ffbe7d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cde5ff'
  primary-fixed-dim: '#95ccff'
  on-primary-fixed: '#001d32'
  on-primary-fixed-variant: '#004a75'
  secondary-fixed: '#d7e3fc'
  secondary-fixed-dim: '#bbc7df'
  on-secondary-fixed: '#101c2e'
  on-secondary-fixed-variant: '#3c475b'
  tertiary-fixed: '#ffdcbd'
  tertiary-fixed-dim: '#ffb86f'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#693c00'
  background: '#faf9f5'
  on-background: '#1b1c1a'
  surface-variant: '#e3e2df'
typography:
  display-lg:
    fontFamily: Noto Serif
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Noto Serif
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Noto Serif
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: IBM Plex Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  meta-sm:
    fontFamily: IBM Plex Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system is built on the **"Evidence Desk"** narrative—a digital workspace for investigative rigor and regional transparency. The aesthetic merges the authoritative weight of traditional journalism with the technical precision of modern OSINT tools (like Bellingcat).

The interface prioritizes **Calm Credibility**. It avoids sensationalism by using a "Paper" and "Ink" foundation, high whitespace, and structured metadata. The style is **Modern / Editorial**, utilizing subtle depth to distinguish between the background "desk" and the active "evidence" cards.

**Key Brand Pillars:**
- **Tri-border Fluidity:** Equal visual weight for Georgian, Armenian, and English scripts.
- **Evidentiary Clarity:** High-contrast verdicts and clear source attribution.
- **Quiet Confidence:** No aggressive animations; micro-interactions are purposeful and soft.

## Colors
The palette is rooted in the physical textures of newsrooms. **Paper (#F7F6F2)** serves as the primary canvas in light mode to reduce eye strain during long-form reading, while **Ink (#0F1B2D)** provides maximum legibility. 

**The Verdict System** uses a colorblind-safe palette. Each verdict status must be accompanied by both a background tint (10% opacity of the hex) and a high-contrast text/icon label to ensure accessibility. 

**Dark Mode Implementation:**
Dark mode is not a simple inversion. It shifts to a deep navy scale to maintain "depth" without using pure black, which can cause "smearing" on OLED screens and feels too aggressive for an editorial platform.

## Typography
This design system uses a tri-font hierarchy to balance authority and technical utility. 

1.  **Noto Serif:** Used for headlines and investigative titles. Its serif structure provides the necessary "Newsroom" weight and supports Georgian and Armenian characters natively.
2.  **Inter:** The workhorse for body copy and UI elements. Its high x-height ensures clarity across all three languages.
3.  **IBM Plex Mono:** Used for labels, timestamps, and "source" metadata. It mimics the look of a typewriter or a terminal, reinforcing the "fact-checking" and "archival" nature of the platform.

**Multilingual Handling:** Ensure `line-height` for Georgian and Armenian scripts is increased by 10% compared to English to account for taller ascenders and descenders.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy on desktop (1200px max-width) to mimic the structure of a newspaper column. 

- **Grid:** 12-column system.
- **Rhythm:** An 8px base unit controls all padding and margins. 
- **Language Switcher:** Persistent in the top-right of the global header, using a "Switcher Pill" that shows ISO codes (EN | KA | HY).
- **Responsive Behavior:** 
    - **Desktop:** Wide margins, sidebars for metadata/filters.
    - **Tablet:** 8-column grid, sidebars collapse into a "Filter Drawer."
    - **Mobile:** 4-column grid, 16px margins, sticky bottom-nav for primary actions (Home, Search, Submit Evidence).

## Elevation & Depth
Elevation is used sparingly to maintain the "desk" metaphor. 

- **Level 0 (Background):** Paper (#F7F6F2). Flat.
- **Level 1 (Cards/Evidence):** White (#FFFFFF). Uses a two-layer shadow:
    - Shadow 1: `0px 2px 4px rgba(15, 27, 45, 0.04)`
    - Shadow 2: `0px 8px 16px rgba(15, 27, 45, 0.08)`
- **Level 2 (Modals/Popovers):** Higher contrast shadow to pull element forward from the paper surface.
- **Sensitive Content:** Implements a `backdrop-filter: blur(20px)` over media assets. Users must click a "Reveal Evidence" button (Label-caps style) to remove the blur.

## Shapes
The shape language combines **Intellectual Rectilinear** (cards) with **Humanist Softness** (interactive elements). 

- **Cards:** 12px-16px radius. This provides a modern, approachable feel without looking "childish."
- **Interactive Elements:** Buttons and Input fields use a **Pill/2xl (Full Rounded)** radius. This creates a clear distinction: "Cards contain information, Pills perform actions."
- **Hairlines:** 1px borders (#E4E1D8) are used to separate sections within cards (e.g., separating the headline from the verdict).

## Components
- **Primary Buttons:** Pill-shaped, #0E5A8A background, White text. On hover, apply a `2px` vertical lift and a soft #0E5A8A outer glow (15% opacity).
- **Verdict Chips:** Small, rounded-sm badges. Background is 10% opacity of the verdict color; text is 100% opacity. Include a small status icon (e.g., an 'X' for Fake, a 'Check' for True).
- **Input Fields:** Pill-shaped, 1px border (#E4E1D8). In focus state, the border changes to Signal Blue (#0E5A8A) with a 2px offset ring.
- **Evidence Cards:** Contain a `Label-caps` category tag, a `Headline-sm` title, and a footer with `Meta-sm` timestamps and source links.
- **Sticky Navbar:** Height: 72px. Contains the Shield/Checkmark icon and "TrustLab" in Noto Serif. Features a thin bottom border to separate it from the scrolling content.
- **Sensitive Content Overlay:** A dark-grey translucent overlay with a central lock icon and text: "SENSITIVE CONTENT - CLICK TO VIEW".