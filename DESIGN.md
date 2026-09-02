---
name: "Willis Wee — Save Point Atlas"
description: "A premium 16-bit narrative journey through a founder's work, memory, and next chapter"
colors:
  save-gold: "#ffbe63"
  archive-cyan: "#8adad0"
  quest-green: "#79d99b"
  midnight-ink: "#07101d"
  dialogue-panel: "rgba(6, 13, 25, 0.91)"
  vellum: "#f4e9cf"
  vellum-soft: "#cfc9bd"
  map-muted: "#8f9cad"
  frame-line: "rgba(244, 233, 207, 0.22)"
  frame-line-strong: "rgba(244, 233, 207, 0.5)"
typography:
  display:
    fontFamily: "'Silkscreen', 'Courier New', monospace"
    fontSize: "clamp(2.7rem, 5.3vw, 5.75rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "'Silkscreen', 'Courier New', monospace"
    fontSize: "clamp(2.1rem, 4vw, 4.25rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  title:
    fontFamily: "'Sora', sans-serif"
    fontSize: "0.94rem"
    fontWeight: 700
    lineHeight: 1.5
  body:
    fontFamily: "'Sora', sans-serif"
    fontSize: "clamp(0.93rem, 1.15vw, 1.05rem)"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "'Silkscreen', 'Courier New', monospace"
    fontSize: "0.67rem"
    fontWeight: 400
    lineHeight: 1.35
rounded:
  none: "0px"
  key-circle: "50%"
spacing:
  tight: "8px"
  compact: "10px"
  control: "12px"
  inset: "16px"
  standard: "20px"
  roomy: "24px"
  section: "28px"
  panel-fluid: "clamp(24px, 3vw, 42px)"
components:
  game-button-primary:
    backgroundColor: "{colors.save-gold}"
    textColor: "{colors.midnight-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
    height: "46px"
  game-button-secondary:
    backgroundColor: "rgba(10, 22, 39, 0.88)"
    textColor: "{colors.vellum}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
    height: "46px"
  dialogue-panel:
    backgroundColor: "{colors.dialogue-panel}"
    textColor: "{colors.vellum}"
    rounded: "{rounded.none}"
    padding: "{spacing.panel-fluid}"
    width: "min(590px, 47vw)"
  hud-navigation:
    backgroundColor: "rgba(5, 11, 20, 0.94)"
    textColor: "{colors.vellum}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 34px"
    height: "76px"
  quest-row:
    backgroundColor: "transparent"
    textColor: "{colors.vellum}"
    rounded: "{rounded.none}"
    padding: "16px 2px"
    width: "100%"
  archive-row:
    backgroundColor: "transparent"
    textColor: "{colors.vellum}"
    rounded: "{rounded.none}"
    padding: "15px 2px"
    width: "100%"
  contact-terminal-row:
    backgroundColor: "transparent"
    textColor: "{colors.vellum}"
    rounded: "{rounded.none}"
    padding: "13px 16px"
    width: "100%"
---

# Design System: Willis Wee — Save Point Atlas

## Overview

**Creative North Star: "Save Point Atlas"**

Save Point Atlas turns the homepage into one continuous premium 16-bit narrative adventure. Four personal biomes—Base Camp, Workshop, Memory Archive, and Dawn Terminal—move from present identity to work, reflection, and connection while a restrained rail-board HUD keeps place, progress, and onward movement visible.

The pixel scenes supply atmosphere, not the reading surface. Solid ink dialogue plates, directional veils, cream text, and the Sora body face protect legibility against the deliberately rich art; Silkscreen is reserved for short game-world signals. Motion is spare and scene-aware: progress tracks the journey, dialogue reveals from the outer edge, artwork settles into focus, and the quest shuffle uses one split-flap beat with a matching polite announcement.

This system is the built truth for `index.html`, `home-game.css`, `home-game.js`, and `images/game-world/`. Existing deeper pages are legacy surfaces; their fonts, colors, cards, and page layouts are not authority for the new homepage world unless they are deliberately migrated.

**Key Characteristics:**
- **Continuous Four-Biome Journey:** Base Camp, Workshop, Memory Archive, and Dawn Terminal form one authored progression rather than separate cards or routes.
- **Rail-Board Orientation:** A fixed rectilinear HUD, gold progress line, active diamond, and desktop journey rail continuously expose location and state.
- **Art-and-Plate Composition:** Full-bleed 16-bit scenes alternate with opaque dialogue plates and directional dark veils for readable cinematic contrast.
- **Two-Font Translation Layer:** Silkscreen voices the game world; Sora carries every sentence that needs effortless reading.
- **Purposeful Motion Restraint:** Scene settling, directional panel reveals, progress, and one split-flap shuffle are the complete signature motion vocabulary.

## Colors

The palette is nocturnal and map-like: Midnight Ink and translucent navy plates establish depth, Vellum carries content, and three semantic signals distinguish action, archive, and live status.

### Primary
- **Save Gold** (`save-gold`): Primary action fills, focus outlines, active progress, corner brackets, arrows, and selective inline emphasis. It is the visual equivalent of a save point or navigational beacon.

### Secondary
- **Archive Cyan** (`archive-cyan`): Small archive taxonomy labels and knowledge-oriented wayfinding. It does not substitute for action gold.

### Tertiary
- **Quest Green** (`quest-green`): Live experiment labels and the current-quest signal light. Its use is strictly status-bearing.

### Neutral
- **Midnight Ink** (`midnight-ink`): Root canvas, scrollbar track, marker interior, and the mobile bridge between art and content.
- **Dialogue Panel** (`dialogue-panel`): The dense reading plate placed over each scene; mobile raises its opacity further for safety.
- **Vellum** (`vellum`): Headlines, active navigation, principal labels, and high-emphasis prose.
- **Soft Vellum** (`vellum-soft`): Supporting prose and secondary actions that need warmth without competing with headings.
- **Map Muted** (`map-muted`): Metadata, descriptions, inactive labels, and contextual copy.
- **Frame Line** (`frame-line`): Quiet row rules and terminal boundaries.
- **Strong Frame Line** (`frame-line-strong`): Dialogue frames and control outlines that must remain visible over illustrated scenes.

### Named Rules

**The Beacon Rule.** Save Gold owns primary action, active navigation, progress, focus, and directional emphasis; keep Archive Cyan and Quest Green semantic rather than decorative.

**The Ink-Plate Rule.** Never place reading copy directly on a detailed scene. Use the Dialogue Panel plus its directional veil so atmosphere cannot erode contrast.

## Typography

**Display Font:** Silkscreen, with Courier New and monospace fallbacks

**Body Font:** Sora, with a sans-serif fallback

**Label/HUD Font:** Silkscreen, with Courier New and monospace fallbacks

**Character:** Silkscreen gives the world its premium 16-bit voice through blocky, widely recognizable forms. Sora is the translation layer: contemporary, calm, and highly legible at paragraph and metadata sizes.

### Hierarchy
- **Display:** The `display` token is reserved for the Base Camp statement; constrain it to roughly 12 characters per line and balance the wrap.
- **Headline:** The `headline` token carries each biome's central declaration with the same tight, block-built rhythm.
- **Title:** The `title` token names quests and destinations inside rows; it stays in Sora so lists remain quickly scannable.
- **Body:** The `body` token carries dialogue and explanatory copy, with a maximum measure of about 62 characters.
- **Label:** The `label` token handles HUD destinations, key prompts, state labels, and terminal names. Use uppercase only where the implemented component does.

### Named Rules

**The Translation Rule.** Silkscreen owns short declarations, coordinates, controls, and state; Sora owns explanation. Never set paragraph-length copy in Silkscreen.

**The Twelve-Character Headline Rule.** Display headings remain compact and balanced at about 12 characters per line so the pixel letterforms read as a composed silhouette, not a wall of text.

## Layout

Desktop is a sequence of full-viewport scenes (`min-height: 100svh`) beneath a fixed 76px HUD. Art covers each scene edge to edge; content alternates left and right inside fluid scene insets (`clamp(58px, 7vw, 116px)`), while the dialogue plate stays at `min(590px, 47vw)`. A directional dark veil extends from the plate into the scene, and proximity snapping aligns the journey without forcing every scroll gesture.

At 1100px the HUD compacts, secondary identity and continue labels hide, level targets narrow, and dialogue plates can grow to 55vw. At 760px the structure becomes stacked: the HUD falls to 64px, the journey rail and scroll cue disappear, snapping is removed, artwork occupies the upper 52%, and the full-width dialogue plate begins around 40vh on an 860px minimum scene. At 460px actions stack vertically, row columns tighten, and the terminal footer becomes a short vertical list. The implementation remains usable down to the 320px body minimum.

Scene art uses deliberate focal crops on mobile: Base Camp and Memory Archive bias left, while Workshop and Dawn Terminal bias right. This preserves the character and environmental landmark before the dialogue plate takes over the lower reading region.

## Elevation & Depth

Depth is structural rather than card-like. Illustrated distance, directional navy veils, solid dialogue plates, one-pixel frames, and small gold brackets do most of the work; shadows are narrow extensions that separate fixed chrome, plates, markers, and controls from busy art.

### Shadow Vocabulary
- **HUD Float** (`0 8px 30px rgba(0, 0, 0, 0.24)`): Separates the fixed rail-board header from every biome.
- **Avatar Cartridge** (`0 5px 14px rgba(0, 0, 0, 0.35)`): Gives the pixel avatar a small physical insert effect.
- **Dialogue Depth** (`0 18px 50px rgba(0, 0, 0, 0.32)`): Holds the reading plate above full-bleed artwork without making it look like a rounded card.
- **Save Marker Glow** (`0 0 12px rgba(255, 190, 99, 0.38)`): Makes the diamond progress marker readable against changing scenes.
- **Live Signal Glow** (`0 0 10px rgba(121, 217, 155, 0.72)`): Reinforces status on the small square quest light.
- **Control Lift** (`0 9px 20px rgba(0, 0, 0, 0.26)`): Appears only while a game button is hovered.

### Named Rules

**The Plate-Before-Glow Rule.** Legibility comes from solid ink surfaces, veils, and one-pixel boundaries. Shadows may clarify an existing layer but never replace contrast.

## Shapes

The form language is rectilinear and instrument-like. Dialogue plates, buttons, HUD bars, avatar frames, terminals, and list rows use square corners with one-pixel boundaries. Dialogue panels carry two short 12px gold corner brackets—top left and bottom right—instead of decorative full frames.

Diamonds indicate location and progress in the HUD and journey rail. Small squares indicate live status. Circles are reserved for the 22px keycap controls inside game buttons; do not spread pill shapes or rounded cards across the system.

Icons use a consistent wire grammar: inline SVG, no fill, square line caps, miter joins, and approximately 1.5px strokes. Direction arrows are compact and geometric so they read like the same navigation instrument as the HUD.

## Components

### Game Buttons
- **Shape:** Square-cornered, one-pixel control with a circular keycap; minimum height is 46px.
- **Primary:** Save Gold fill with Midnight Ink text for the principal next-scene action.
- **Secondary:** Translucent navy fill with a Strong Frame Line and Vellum text for deeper-route actions.
- **Hover / Focus / Active:** Hover lifts 3px, changes the boundary to Save Gold, and adds Control Lift. Keyboard focus uses the global 3px Save Gold outline with 4px offset; active returns the control toward its resting plane.

### Dialogue Panels
- **Structure:** Dense Dialogue Panel surface, Strong Frame Line, fluid internal padding, and two opposing gold corner brackets.
- **Behavior:** JavaScript-enhanced inactive panels collapse from their outer edge, then reveal inward over 700ms with the emphasized scene easing. Opacity settles alongside the clip reveal.
- **Mobile:** Width becomes 100%, padding becomes 25px by 20px, and panel opacity increases to protect text over the art-to-ink transition.

### HUD Navigation and Journey Rail
- **HUD:** Fixed three-zone rail board with player identity, four centered level destinations, and an onward route. At compact and mobile widths it progressively removes secondary labels while keeping all four destinations.
- **State:** Intersection observation selects the current biome and applies `aria-current="page"`; the active destination receives Vellum text and a small Save Gold diamond.
- **Progress:** A passive scroll listener updates one normalized scene-progress value through `requestAnimationFrame`, driving the HUD line, rail fill, marker, and rotated scene label.

### Current Quest Shuffle
- **Structure:** Bordered status strip with a glowing square Quest Green signal, contextual label, current quest, and redraw icon.
- **Motion:** The visible quest uses a 260ms four-step split-flap; content swaps at its midpoint. With reduced motion the swap is immediate.
- **Accessibility:** The button has an explicit shuffle label, decorative graphics are hidden, and every new quest is repeated into a polite, atomic live region.

### Quest Rows
- **Structure:** Three-column row for state, Sora title/description, and an external-direction icon; each row ends with a Frame Line.
- **State:** Live experiments use Quest Green; other quest states use Map Muted. Hover moves the row 5px in the travel direction and colors the navigation signal Save Gold.

### Archive Rows
- **Structure:** Three-column destination row with an Archive Cyan taxonomy label, Sora title/description, and Save Gold arrow.
- **State:** Hover translates the row 5px and shifts its interactive color to Save Gold while the cyan taxonomy remains semantically stable.

### Contact Terminal Rows
- **Structure:** A framed terminal groups compact rows with fixed-width Silkscreen channel names, Sora descriptions, and geometric external arrows.
- **State:** Hover adds a low-opacity Save Gold wash and shifts the row's active content to Save Gold; the last row removes its bottom divider.

### Scene and Quest Motion
- **Scene Settle:** Artwork eases from a slightly larger, dimmer, less saturated state into focus over 1600ms, with filter recovery over 1000ms.
- **Directional Reveal:** Dialogue plates use `cubic-bezier(.16, 1, .3, 1)` so entry feels like a deliberate scene load rather than a generic fade.
- **Reduced Motion:** Smooth scrolling is disabled, animation and transition durations collapse to 0.01ms, and dialogue plates remain fully revealed.

## Do's and Don'ts

### Do:
- **Do** use solid Midnight Ink dialogue plates and directional veils whenever text overlaps pixel art.
- **Do** keep Silkscreen to headlines, HUD labels, state labels, and compact controls; use Sora for every explanatory sentence.
- **Do** preserve the alternating full-viewport composition on desktop and the stacked art-then-content composition below 760px.
- **Do** keep the rectilinear one-pixel frame language, short gold corner brackets, diamond location markers, and square live signals.
- **Do** pair every shuffled quest update with both the visible split-flap state and the polite live-region announcement.
- **Do** treat the implemented homepage tokens and components as authority; migrate legacy deeper pages deliberately rather than importing their visual language here.

### Don't:
- **Don't** place body copy directly on detailed pixel artwork or rely on text shadow as the contrast strategy.
- **Don't** introduce rounded cards, pill navigation, or circles beyond the established keycap control.
- **Don't** swap the authored 16-bit environmental scenes for photorealism, generic gradients, or isolated decorative sprites.
- **Don't** make Save Gold, Archive Cyan, and Quest Green interchangeable; each color carries a distinct action or status meaning.
- **Don't** animate smooth scrolling, scene drift, panel clipping, or flap motion when reduced motion is requested.
- **Don't** let the legacy Newsreader, Source Serif 4, DM Sans, warm-charcoal, or rounded-card system override this homepage world.
