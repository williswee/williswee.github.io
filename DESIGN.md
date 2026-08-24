---
name: Willis Wee
description: Personal digital garden, founder hub, and living archive
colors:
  primary: "#c9a96e"
  neutral-bg: "#111110"
  neutral-surface: "#1a1a18"
  neutral-text: "#c8c5bc"
  neutral-text-strong: "#efede8"
  neutral-muted: "#6b6862"
  neutral-border: "rgba(255, 255, 255, 0.06)"
  accent-green: "#4ade80"
typography:
  display:
    fontFamily: "'Newsreader', Georgia, serif"
    fontSize: "2.6rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "'Newsreader', Georgia, serif"
    fontSize: "1.65rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'Source Serif 4', Georgia, serif"
    fontSize: "1.15rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "'Source Serif 4', Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.72
  label:
    fontFamily: "'DM Sans', system-ui, sans-serif"
    fontSize: "0.82rem"
    fontWeight: 500
    letterSpacing: "0.06em"
rounded:
  none: "0px"
  sm: "4px"
  md: "8px"
  lg: "12px"
  pill: "20px"
  full: "30px"
  circle: "50%"
spacing:
  xs: "6px"
  sm: "12px"
  md: "24px"
  lg: "32px"
  xl: "48px"
  xxl: "80px"
components:
  button-primary:
    backgroundColor: "rgba(255, 255, 255, 0.03)"
    textColor: "{colors.neutral-text-strong}"
    rounded: "{rounded.full}"
    padding: "9px 18px"
  button-primary-hover:
    backgroundColor: "rgba(255, 255, 255, 0.06)"
    textColor: "#ffffff"
  filter-pill:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-muted}"
    rounded: "{rounded.pill}"
    padding: "5px 12px"
  filter-pill-active:
    backgroundColor: "rgba(201, 169, 110, 0.07)"
    textColor: "{colors.primary}"
  book-card:
    backgroundColor: "rgba(255, 255, 255, 0.015)"
    rounded: "{rounded.lg}"
    padding: "28px"
---

# Design System: Willis Wee

## Overview

**Creative North Star: "The Quiet Press"**

"The Quiet Press" embodies a warm, tactile, and restrained editorial haven. Rooted in traditional typographic excellence, it pairs the classic rhythm of literary typesetting with modern dark-mode clarity. Rather than competing for visual noise with aggressive gradients or heavy card elevation, the design recedes into the background to let reflective thoughts, founder insights, and curated works command total focus.

Surfaces feel deep, organic, and composed. A subtle film grain overlay lends warmth to smoked charcoal backgrounds (`#111110`), while warm parchment gold (`#c9a96e`) provides quiet, deliberate accents. Micro-interactions are gentle and intentional—delicate link underlines that expand smoothly on hover, soft lift elevations on cards, and quiet pulse indicators for live status.

**Key Characteristics:**
- **Literary Typographic Rhythm:** Newsreader italic serif headings paired with Source Serif 4 body text and crisp DM Sans uppercase metadata.
- **Gilded Obsidian Palette:** Deep smoked background tones accented with refined warm gold and soft alabaster typography.
- **Restrained Depth:** Flat translucent layering (`rgba(255, 255, 255, 0.015–0.06)`) with subtle ambient hover elevation.
- **Zero-Build Simplicity:** Pure semantic HTML and modular CSS with instantaneous performance and zero dependency overhead.

## Colors

The palette balances deep carbon charcoal tones with warm parchment gold accents and high-legibility alabaster typography.

### Primary
- **Warm Parchment Gold** (`#c9a96e` / `oklch(74% 0.09 78)`): Used sparingly for key interactive accents, active filter pill states, subtle border highlights, and hover text colors. Rarity ensures its impact.

### Neutral
- **Smoked Obsidian Background** (`#111110` / `oklch(15% 0.003 90)`): Base canvas color providing a restful, glare-free dark reading foundation.
- **Deep Mineral Surface** (`#1a1a18` / `oklch(19% 0.004 85)`): Elevated surface container color used for blockquotes and code snippets.
- **Soft Alabaster Strong Text** (`#efede8` / `oklch(94% 0.007 85)`): High-contrast primary text for headers, titles, active navigation, and highlighted keywords.
- **Muted Cream Body Text** (`#c8c5bc` / `oklch(80% 0.01 85)`): Warm, low-strain body reading color optimized for long-form reading comfort.
- **Warm Umber Gray** (`#6b6862` / `oklch(49% 0.009 75)`): Metadata labels, publication dates, author lines, and inactive filter pills.
- **Translucent Hairline Rule** (`rgba(255, 255, 255, 0.06)`): Structural dividers, subtle container borders, and card outlines.

### Accent (Functional)
- **Active Green Dot** (`#4ade80` / `oklch(81% 0.17 142)`): Reserved strictly for live pulse indicators in status badges.

### Named Rules
**The Rarity Accent Rule.** The primary gold accent (`#c9a96e`) is used on ≤5% of any given viewport. Its power comes from restraint and intentional focus.

**The Translucent Boundary Rule.** Borders never use opaque solid gray; they use low-opacity white (`rgba(255, 255, 255, 0.04–0.06)`) to naturally blend with underlying obsidian surfaces.

## Typography

**Display Font:** Newsreader, Georgia, serif  
**Body Font:** Source Serif 4, Georgia, serif  
**Label/UI Font:** DM Sans, system-ui, sans-serif  
**Code Font:** SFMono-Regular, Menlo, Consolas, monospace  

**Character:** A pairing of editorial literary depth and contemporary Scandinavian UI clarity. Headings carry an expressive italic cadence, body prose breathes comfortably with proportional serif letterforms, and UI metadata stays sharp and legible with uppercase sans-serif tracking.

### Hierarchy
- **Display / H1** (`Newsreader`, 400 italic, `2.6rem` / `clamp(2rem, 5vw, 2.6rem)`, line-height `1.2`, letter-spacing `-0.03em`): Page titles and primary introductions.
- **Headline / H2** (`Newsreader`, 500 italic, `1.65rem`, line-height `1.3`, letter-spacing `-0.01em`): Major section dividers with a delicate baseline rule.
- **Title / H3** (`Source Serif 4`, 600 normal, `1.15rem`, line-height `1.3`): Sub-sections, card headings, and timeline milestones.
- **Body** (`Source Serif 4`, 400 normal, `1.125rem` / `18px`, line-height `1.72`, max-width `640px`): Long-form prose, essays, and descriptions.
- **Label / UI** (`DM Sans`, 500/600 uppercase, `0.75rem–0.85rem`, letter-spacing `0.06em`): Navigation links, dates, category tags, filter pills, and button text.

### Named Rules
**The Italic Heading Doctrine.** All H1 and H2 display headers use Newsreader's italic optical weight to convey editorial warmth and authorial voice.

**The Reading Width Rule.** Reading prose is strictly constrained to a centered 640px container (~65–75 characters per line) to maintain optimal typographic cadence.

## Layout

- **Container Model:** Single centered column with a max-width of `640px` and responsive horizontal padding (`24px` on desktop, `20px` on mobile).
- **Vertical Spacing Rhythm:**
  - Page header margin-bottom: `72px` (`52px` on mobile).
  - Major section spacing: `56px` above H2 headers with `12px` bottom padding.
  - Paragraph bottom margin: `24px`.
  - Footer follow strip spacing: `64px` top margin with `24px` top padding.
- **Responsive Adaptations:**
  - On viewports `< 600px`, navigation converts to a horizontal smooth-scrolling ribbon without scrollbars.
  - Article list entries transition from side-by-side flex rows to vertical stacked items with metadata underneath.

## Elevation & Depth

The design system is fundamentally flat and layered, relying on tone and translucency rather than heavy drop shadows.

- **At Rest:** Flat surfaces layered via translucent white tinting (`rgba(255, 255, 255, 0.015–0.03)`) surrounded by translucent hairline borders (`1px solid rgba(255, 255, 255, 0.06)`).
- **Hover State:** Dynamic elevation where cards and interactive buttons translate upward (`translateY(-2px)` or `translateY(-4px)`) paired with a soft ambient shadow (`box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2)`).
- **Texture:** An invisible, fixed SVG fractal noise overlay (`opacity: 0.025`) covers the viewport, eliminating flat digital banding and giving backgrounds organic paper grain.

### Named Rules
**The Tonal Depth Rule.** Depth is created through surface opacity and border hairlines, never through opaque skeuomorphic shadows or thick dividers.

## Shapes

- **Base Radius:** `4px` (`rounded.sm`) for code snippets, avatars, and inline images.
- **Container Radius:** `12px` (`rounded.lg`) for content cards, guide sections, newsletter boxes, and callout blocks.
- **Pill Radius:** `20px` for filter pills and status badges.
- **Button Radius:** `30px` (`rounded.full`) for standalone action buttons and social links.
- **Circular Elements:** `50%` for author avatars and status indicator dots.

## Components

### Buttons
- **Shape:** Pill radius (`30px` / `rounded.full`).
- **Primary Style:** Subtle translucent background (`rgba(255, 255, 255, 0.03)`), hairline border (`rgba(255, 255, 255, 0.06)`), `DM Sans` 500 text in soft alabaster (`#efede8`), padding `9px 18px`.
- **Hover / Focus:** Lifts `translateY(-2px)` with background shift (`rgba(255, 255, 255, 0.06)`), border brightening (`rgba(255, 255, 255, 0.18)`), soft drop shadow (`0 6px 16px rgba(0, 0, 0, 0.15)`), and full white text.

### Filter Pills
- **Shape:** Rounded pill (`20px`).
- **Default State:** Transparent background, `1px solid rgba(255, 255, 255, 0.06)`, muted umber text (`#6b6862`), uppercase `0.75rem` tracking.
- **Hover State:** Brightened text (`#efede8`) and subtle white glow (`rgba(255, 255, 255, 0.03)`).
- **Active State:** Warm gold text (`#c9a96e`), gold border (`#c9a96e`), and subtle warm background tint (`rgba(201, 169, 110, 0.07)`).

### Book & Content Cards
- **Shape:** Rounded container (`12px`).
- **Default State:** `rgba(255, 255, 255, 0.015)` background, `1px solid rgba(255, 255, 255, 0.06)` hairline border, `28px` internal padding.
- **Hover State:** `translateY(-4px)` lift, `rgba(255, 255, 255, 0.03)` background, `0 12px 24px rgba(0, 0, 0, 0.2)` ambient shadow.

### Navigation
- **Header Nav:** Horizontal uppercase link bar with `DM Sans` 500 (`0.82rem`), letter-spacing `0.06em`. Active tab features a subtle translucent backdrop pill (`rgba(255, 255, 255, 0.05)`) and bold text.
- **Link Hover Effect:** Standard in-line text links feature an animated underline that expands smoothly from `0%` to `100%` width on hover using a CSS linear gradient transition.

### Status Badge
- **Style:** Compact pill (`20px` radius) with `rgba(255, 255, 255, 0.02)` background, hairline border, and an animated pulsing emerald dot (`#4ade80`) signifying active real-time status.

## Do's and Don'ts

### Do:
- **Do** preserve the strict 640px maximum content width on all reading layouts.
- **Do** use `Newsreader` italic for H1 and H2 headers to maintain the site's signature editorial voice.
- **Do** reserve `#c9a96e` (Warm Parchment Gold) for purposeful accents and active states.
- **Do** maintain translucent hairlines (`rgba(255, 255, 255, 0.06)`) for borders rather than opaque solid colors.
- **Do** use hardware-accelerated transforms (`transform: translateY(...)`, `opacity`) for all interactive hover animations.

### Don't:
- **Don't** introduce heavy saturated gradients or bright neon background fills.
- **Don't** use standard heavy drop shadows or skeuomorphic bevels.
- **Don't** load heavy third-party CSS or JS frameworks; all styles must remain modular, lightweight, and zero-build Vanilla CSS.
- **Don't** use generic sans-serif fonts for long-form essay prose.
- **Don't** use layout-thrashing CSS transitions on properties like `padding`, `margin`, `width`, or `height`.
