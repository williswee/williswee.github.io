---
name: "Willis Wee — Save Point Atlas"
description: "A pixel-art personal journey and a quiet reading room for work, essays, books, and small joys"
colors:
  ink: "#07101d"
  panel: "#050c17"
  home-panel: "rgba(5, 12, 23, 0.94)"
  cream: "#f4e9cf"
  cream-soft: "#ddd6c8"
  muted: "#aeb5bd"
  gold: "#ffbe63"
  green: "#79d99b"
  teal: "#8adad0"
  line: "rgba(244, 233, 207, 0.24)"
  line-strong: "rgba(244, 233, 207, 0.5)"
typography:
  home-display:
    fontFamily: "'Silkscreen', 'Courier New', monospace"
    fontSize: "clamp(3.1rem, 5vw, 5.1rem)"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.035em"
  home-headline:
    fontFamily: "'Silkscreen', 'Courier New', monospace"
    fontSize: "clamp(2.55rem, 4.3vw, 4.35rem)"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.035em"
  reading-display:
    fontFamily: "'Silkscreen', 'Courier New', monospace"
    fontSize: "3.25rem"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.035em"
  essay-title:
    fontFamily: "'Silkscreen', 'Courier New', monospace"
    fontSize: "2.625rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  reading-section:
    fontFamily: "'Silkscreen', 'Courier New', monospace"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.035em"
  archive-year:
    fontFamily: "'Silkscreen', 'Courier New', monospace"
    fontSize: "1.6rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.035em"
  essay-subtitle:
    fontFamily: "'Sora', sans-serif"
    fontSize: "1.375rem"
    fontWeight: 500
    lineHeight: 1.6
  quotation:
    fontFamily: "'Sora', sans-serif"
    fontSize: "1.3rem"
    fontWeight: 400
  work-headline:
    fontFamily: "'Silkscreen', 'Courier New', monospace"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.035em"
  brand:
    fontFamily: "'Silkscreen', 'Courier New', monospace"
    fontSize: "0.88rem"
    fontWeight: 700
    letterSpacing: "0.04em"
  brand-compact:
    fontFamily: "'Silkscreen', 'Courier New', monospace"
    fontSize: "0.74rem"
    fontWeight: 700
    letterSpacing: "0.04em"
  reading-nav-compact:
    fontFamily: "'Sora', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.02em"
  essay-title-mid:
    fontFamily: "'Silkscreen', 'Courier New', monospace"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  essay-title-compact:
    fontFamily: "'Silkscreen', 'Courier New', monospace"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.035em"
  home-row-title:
    fontFamily: "'Sora', sans-serif"
    fontSize: "0.96rem"
    fontWeight: 700
  home-onward:
    fontFamily: "'Sora', sans-serif"
    fontSize: "0.94rem"
    fontWeight: 600
  entry-title:
    fontFamily: "'Sora', sans-serif"
    fontSize: "1.2rem"
    fontWeight: 600
    lineHeight: 1.55
    letterSpacing: "-0.02em"
  home-body:
    fontFamily: "'Sora', sans-serif"
    fontSize: "clamp(1rem, 1.12vw, 1.1rem)"
    fontWeight: 400
    lineHeight: 1.7
  reading-body:
    fontFamily: "'Sora', sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.85
  control:
    fontFamily: "'Sora', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
  metadata:
    fontFamily: "'Sora', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
  status:
    fontFamily: "'Sora', sans-serif"
    fontSize: "0.8rem"
    fontWeight: 500
    lineHeight: 1.5
rounded:
  none: "0px"
spacing:
  compact: "8px"
  control-gap: "10px"
  inset: "16px"
  medium: "20px"
  paragraph: "24px"
  section: "32px"
  reading-inset: "44px"
  home-inset: "clamp(30px, 3vw, 46px)"
components:
  reading-panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.cream}"
    rounded: "{rounded.none}"
    padding: "{spacing.reading-inset}"
    width: "min(800px, 64vw)"
  story-panel:
    backgroundColor: "{colors.home-panel}"
    textColor: "{colors.cream}"
    rounded: "{rounded.none}"
    padding: "{spacing.home-inset}"
    width: "min(610px, 47vw)"
  discovery-button:
    backgroundColor: "transparent"
    textColor: "{colors.cream}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    padding: "8px 14px"
  discovery-button-hover:
    textColor: "{colors.gold}"
  status-badge:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream-soft}"
    typography: "{typography.status}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
  reading-navigation:
    backgroundColor: "rgba(4, 10, 19, 0.97)"
    textColor: "{colors.muted}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
  discovery-dock:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.cream}"
    rounded: "{rounded.none}"
    padding: "6px"
---

# Design System: Willis Wee — Save Point Atlas

## Overview

**Creative North Star: "Save Point Atlas"**

The site pairs a personal pixel-art journey with a quiet reading room. The homepage has five scenes: Start, Work, Notes, Life, and Connect. Its illustrated Singapore landscapes carry the atmosphere; framed navy panels carry the words. A compact fixed header and active gold underline provide orientation without a journey rail or game-key interface.

The same world continues through all 48 inner pages: Coaching, Guide, Work, Books, Gratitude, the Thoughts archive, and 42 essays. Their dedicated landscapes sit beside an opaque reading pane on desktop and form a short opening band on mobile. Silkscreen gives short declarations a distinctive voice; Sora carries prose, navigation, metadata, and controls. Content stays readable while discovery and navigation enhance the static document.

This is a refresh of the implemented world, not a replacement direction. The source of truth is `home-game.css`, `thoughts/reading-room.css`, and the route styles for Coaching, Guide, Work, Books, and Gratitude. Surface briefs hold route-specific composition and historical decisions; dated delivery restrictions in those histories do not define permission for future work.

**Key Characteristics:**
- **Five-scene introduction:** Full-width pixel landscapes and alternating reading panels introduce identity, work, writing, life, and connection.
- **Shared reading room:** Opaque ink panes protect long-form reading across every inner page.
- **Two complementary fonts:** Silkscreen marks the world; Sora carries the reading and control interface.
- **Restrained geometry:** Square frames, thin rules, opposing gold corners, and drawn arrows connect the surfaces.
- **Progressive enhancement:** Native links and complete static content survive unavailable JavaScript; enhanced controls appear only when ready.

## Colors

Midnight ink, warm cream, and restrained gold form the site-wide palette. The frontmatter mirrors the actual CSS values; translucent homepage panels and opaque reading panes are separate tokens.

### Primary
- **Gold** (`gold`): Active navigation, focus outlines, opposing corner marks, hover emphasis, and selected controls. It is a navigational accent, not a large decorative fill.

### Secondary
- **Category Cyan** (`teal`): Book categories. It is not a general archive taxonomy color.

### Tertiary
- **Green** (`green`): The current-status signal and live work metadata. Preserve its status meaning.

### Neutral
- **Ink** (`ink`): The surrounding canvas and scene-to-content transitions.
- **Panel** (`panel`): Opaque inner-page reading surfaces and floating controls.
- **Home Panel** (`home-panel`): The dense homepage plate over scenery; mobile raises its opacity to 0.98.
- **Cream** (`cream`): Headlines, principal labels, and emphasized text.
- **Soft Cream** (`cream-soft`): Paragraph text and secondary action text.
- **Muted** (`muted`): Readable metadata and inactive navigation; do not simulate a muted role by fading an entire content block.
- **Line / Strong Line** (`line`, `line-strong`): Quiet list separators and the stronger outer frame.

**The Ink-Plate Rule.** Reading text sits on an ink surface. Scenery, veils, and shadows provide atmosphere without determining text contrast.

**The Readable Selection Rule.** Focus mode dims neighboring entries, introductory text, and decorative scenery while the selected entry is in the reading viewport. Scrolling away restores normal contrast without discarding the selection or its link; returning restores focus. Keyboard-focused entries remain readable.

## Typography

**Display Font:** Silkscreen, with Courier New and monospace fallbacks.

**Body and Interface Font:** Sora, with a sans-serif fallback.

Both families are requested together from Google Fonts with `display=swap`, supported by Google Fonts and font-file preconnects. The requested weights are Silkscreen 400/700 and Sora 400/500/600/700. Keep fallback content visible while fonts load.

### Hierarchy
- **Homepage declarations:** The `home-display` and `home-headline` tokens use balanced wrapping and a maximum measure of 12ch. At 1100px the clamps become 3–4.5rem and 2.45–3.8rem. At 760px they become 2.65–4rem and 2.3–3.55rem.
- **Reading-page declarations:** `reading-display` titles reduce to 2.625rem on mobile and 2.25rem below 380px. Essay titles use their own smaller role, a maximum measure of 22ch, and 1.875rem/1.25 on mobile. Long titles wrap rather than truncate.
- **Reading hierarchy:** The `reading-section` role separates essay and newsletter sections; the archive uses the slightly smaller `archive-year` role. Essay decks use `essay-subtitle`; longer quotations use `quotation`. Work's five project headings use `work-headline`, with Sora subheadings below them. These established roles remain larger than prose and supporting metadata.
- **Homepage row text:** `home-row-title` names work, archive, and contact destinations; `home-onward` names the next section. Their compact Sora size is intentional inside the larger scene composition and is distinct from the shared interface-text token.
- **Repeated entry titles:** Books and Gratitude use the Sora `entry-title` role, reduced to 1.1rem on mobile. Repeated titles remain calmer than the page declaration.
- **Prose:** Homepage copy has a maximum measure of 62ch. The 800px reading shell and its insets set the essay measure; essays and Guide/Work prose use `reading-body`, falling to 1rem on mobile. Book reviews and Gratitude paragraphs use 1.0381rem/1.85 on desktop and 1rem/1.8 on mobile.
- **Controls and supporting text:** The `control` and `metadata` roles use the shared `--font-size-ui` value of 0.875rem (14px at the default root size) for navigation, dates, counts, captions, filters, and dock text. The brand logotype and status badge intentionally retain their established smaller sizes. Preserve tabular numerals for dates and counts.
- **Status badge:** The intentionally compact `status` role retains its existing size. At widths up to 360px, omit the visible “Currently:” prefix so all 12 full statuses fit at normal text sizes; enlarged text may wrap naturally.

### Responsive and component variants

These are contextual overrides of the named roles, not additional sizes to apply indiscriminately. Keep each override attached to its existing component and breakpoint. CSS is the authority for the exact formulas; a static detector that only reads frontmatter may still report these deliberate variants.

| Role and source | Established variant |
| --- | --- |
| Homepage declaration (`home-game.css`, h1) | Up to 1100px: `clamp(3rem, 6vw, 4.5rem)`; up to 760px: `clamp(2.65rem, 13vw, 4rem)`. Both retain 1.06 line height. |
| Homepage scene heading (`home-game.css`, h2) | Up to 1100px: `clamp(2.45rem, 5.2vw, 3.8rem)`; up to 760px: `clamp(2.3rem, 10.8vw, 3.55rem)`. Both retain 1.06 line height. |
| Brand (`.site-brand > span`) | Desktop keeps “Willis Wee” at 0.88rem. Up to 760px, the homepage and inner pages share the short “Willis” logotype at 0.74rem. This is the logotype exception, not the navigation scale. |
| Reading-page title (`thoughts/reading-room.css`, h1) | Up to 760px: 2.625rem/1.12; up to 380px: 2.25rem/1.12. |
| Essay title (`thoughts/reading-room.css`, article h1) | Up to 1100px: 2.25rem/1.2; up to 760px: 1.875rem/1.25. |
| Guide section title (`guide-game.css`, `.guide-section h2`) | The shared 1.75rem role uses a 1.4 line height here; up to 760px it is 1.375rem, and up to 380px it is 1.25rem. |
| Work project title (`work-game.css`, `.timeline h2`) | Up to 760px: 1.5rem/1.35. Sora subheadings use 1.17rem/1.45 on desktop and 1.1rem on mobile. |
| Work exhibit and supporting text (`work-game.css`) | The exhibit's Sora title is 1.3rem/1.45 at weight 600. Its supporting description is 0.94rem/1.8; timeline emphasis also uses 0.94rem. These local content treatments are not metadata controls. |
| Essay subtitle (`thoughts/reading-room.css`, `.article-subtitle`) | Up to 760px: 1.1875rem/1.6. |
| Book and Gratitude entry titles (`books-game.css`, `gratitude-game.css`) | Up to 760px: 1.1rem/1.55. |

**The Translation Rule.** Silkscreen owns short declarations and the established brief chapter cues. Sora owns sentences and the navigational interface. Never set paragraph-length copy in the pixel face.

## Layout

On desktop, the homepage alternates panels across five scenes with a minimum height of 100svh and a fixed 76px header. Standard panels use the frontmatter width and inset; the Life panel is narrower to preserve the family composition. At 1100px the panels grow to 54vw. At 760px the scenes become a natural document flow: each artwork is 44svh with a 300px minimum, followed by a full-width panel. The mobile header keeps the short brand and navigation on one line, with explicit space between them. Its 4rem height is 64px at the default text size and grows with enlarged text; the root scroll offset uses em units so Safari scales it correctly. By user preference, mobile navigation uses 0.75rem text, reducing to 0.6875rem at widths up to 360px. All five links fit at the default size down to 320px. The page supports a 320px minimum width without forcing the reading text onto the artwork.

Inner pages use an 800px maximum pane, positioned to the right with a 5vw outer margin and 44px inset. At 1100px it uses 67vw and a 32px inset. At 760px the header stays one row. Its height is 4.75rem, 76px at the default text size, and grows with enlarged text; the root scroll offset uses em units so Safari scales it. The short brand sits beside a sideways-scrolling navigation, above a 188px art band and a reading pane with a 24px inset; below 380px the inset is 20px. The pane overlaps the art band slightly to maintain continuity. Essays and the Coaching/Guide/Work/Books/Gratitude portraits occupy the exposed left region rather than continuing behind the opaque pane. That geometry is defined once in `thoughts/reading-room.css` (`.reading-landscape--portrait`, shared with essays); page stylesheets keep only their own brightness, fade, and phone crop. Coaching uses its dedicated "comrades" portrait with the Guide's treatment.

Navigation targets are at least 44px in both dimensions, except the homepage at widths up to 360px, where link widths can reduce to 36px while retaining the full header height as the tap target. At narrow widths or enlarged text, navigation scrolls within its own row; focus reveals the selected destination without widening the page. Without the navigation enhancement, inner-page links wrap into normal document flow. Guide, Work, Books, and Coaching share one desktop side rail (`.reading-rail` in `thoughts/reading-room.css`); page stylesheets keep only their overrides. On mobile, each page owns its rail: inline contents on Guide, native compact menus on Work and Books, and none on Coaching.

## Elevation & Depth

Illustrated distance, navy veils, opaque panes, thin borders, and opposing corner marks establish depth. Shadows separate a small number of structural layers, without rounded cards or luminous halos. The header uses a 10px/32px shadow; homepage panels use a 22px/54px shadow, reading panes a slightly softer version of the same form, and docks a 12px/28px shadow. Exact shadow values live in the sidecar.

Homepage panels settle through opacity and horizontal movement over 520–700ms, while artwork settles more slowly. Mobile panels remain fully visible. Short control transitions and dice/reload feedback acknowledge deliberate input. Reduced-motion preferences suppress smooth scrolling and decorative animation; content is never dependent on motion completing.

## Shapes

The system is rectilinear: square panels, rectangular controls, one-pixel boundaries, and opposing 14px gold panel corners. Books and Gratitude selections use smaller opposing 12px corners. The status signal is a 6px square with an explicit width and flex basis so WebKit accounts for it in the badge's intrinsic width.

Navigation arrows are drawn vectors with square line caps and miter joins. “Scroll next” uses a down arrow; destination links use northeast arrows; returning to the beginning uses an up arrow. The Thoughts archive uses the same vector approach through a CSS mask, avoiding platform emoji substitution. User-authored emoji remain part of the personal copy and are not the icon system.

## Components

### Reading and story panels

Dense ink surfaces with thin warm frames and opposing gold corner marks protect text from the scenery. Story panels alternate across the homepage; reading panels remain a single continuous document. Preserve the declared text measure and responsive insets rather than creating nested cards.

### Navigation

The homepage links to Start, Work, Notes, Life, and Connect within the page. Inner pages link to Start, Thoughts, Guide, Work, Books, and Gratitude. Coaching is reached from the homepage, the Guide, and every essay rather than the header, so the mobile header keeps six links; the Coaching page shows no current item. On desktop, Coaching adds a left rail like the Guide's contents, with its four sections and a booking shortcut; phones omit it. Active text and a gold underline indicate location. The header has a waving-hand brand, no avatar cartridge, game keycaps, active diamonds, or journey rail. Keyboard focus receives a gold outline; inside scrolling navigation the outline sits within the scrollport.

### Discovery controls and dock

Random pick is a square-edged outlined button with a drawn dice icon and a minimum 44px target. Books and Gratitude share the compact floating **Another pick / Top** dock. There is no Keep reading button. The dock follows the reading-pane center on desktop and the viewport center on mobile, respects the bottom safe area, and may wrap when text is enlarged. Another pick preserves keyboard access; Top clears the selection and returns to the beginning. Escape can clear the selection in place.

### Selected books and gratitude notes

A stable hash, explicit focus, and two gold corner marks identify the chosen entry. Focus mode dims neighboring entries, introductory text, and decorative scenery while the selected entry is in the reading viewport. Scrolling away restores normal contrast without discarding the selection or its link; returning restores focus. Keyboard-focused entries remain readable. Category filtering remains a separate, explicit operation; hidden books are removed from the flow rather than made faint.

### Current status badge

The native button combines a reload SVG, green square, optional prefix, and the full current status. Each activation rotates the reload icon; reduced motion uses a short opacity acknowledgement. Its accessible name and polite live region reflect the current status. The static initial status remains meaningful when the shuffle enhancement is unavailable.

### Lists, figures, and reader tools

Homepage work and destination rows use thin separators and vector arrows. The Thoughts archive groups full essay links by year and retains visible dates. Guide copy actions and essay quote tools provide explicit success or failure feedback. Script-dependent actions become available only after their handlers are ready; complete content, the static current status, native links, anchors, and direct newsletter access remain usable without JavaScript. Essay figures preserve their content, alt text, aspect ratio, and captions; responsive compressed assets serve screen-sized files without changing the authored image.

### Coaching card and booking controls

Every essay has exactly one coaching card between the article and the newsletter, and the Guide closes with the same card. The whole card is one link: an ink dialogue box whose "Willis" nameplate straddles the top frame, with a northeast arrow because it opens another page. Hover and keyboard focus turn its frame, nameplate, lead, page name, and arrow gold. It sits outside the article, so reading progress still ends with the essay. On the Coaching page, the two **Book a call** controls reuse the homepage booking anatomy (video icon, gold label, helper line, northeast arrow) inside the inner-page outline, which turns gold on hover and keyboard focus. The gold label and icon are the only resting accent. One control sits in the first screen, the other after the testimonial. The page opens like the Guide: the shared reading-page title, then one body-size intro. In the title, a small gold "as" joins the two pixel words, so it breaks as "Coaching as / comrades" instead of stranding "as". Its six topics are numbered with small square tiles in the pixel face, set in a hanging column that looks identical on every platform. Its "How it works" questions carry the user's decorative emoji, following the Guide's section-heading pattern. Testimonials are stacked game-style dialogue boxes on an ink surface. Each speaker's nameplate (the shared `.dialogue-nameplate`, also used by the essay card) straddles the top frame and links to the source. The last box alone shows a stepped gold "continue" arrow pointing down to Book a call; it animates only while on screen and stays still under reduced motion.

## Do's and Don'ts

### Do:
- Do preserve the five-scene pixel-art homepage and the shared dark reading room across inner pages.
- Do use opaque ink surfaces for long-form text and restore normal contrast when readers scroll away from a focused entry.
- Do keep Sora navigation and metadata readable and controls at least 44px across compact viewports.
- Do use down arrows for onward scrolling, northeast arrows for destination links, and vectors rather than arrow emoji.
- Do retain all authored content, stable anchors, image descriptions, and complete no-JavaScript reading paths.
- Do verify long titles, all status strings, 320px layouts, enlarged text, keyboard focus, and reduced motion when changing shared components.

### Don't:
- Don't restore the removed journey rail, game keycaps, or Keep reading dock action from historical screenshots or briefs.
- Don't leave the page dimmed when the selected entry is outside the reading viewport.
- Don't truncate status copy or disable text enlargement to force the badge onto one line.
- Don't replace the established pixel artwork, square frames, or two-font pairing during a refinement.
- Don't expose an inactive control before its enhancement has initialized.
- Don't treat dated scope or deployment statements in archived briefs as current permission.
