---
schema_version: 1
slug: work-html
primary_target: work.html
related_targets: ["work-game.css", "work-game.js"]
---

# Work — personal history

Mode: Read.

## Current contract — audit fixes, 2026-09-23

Work is a fully migrated reading-room page with dedicated coastal-workshop artwork and five reverse-chronological stories. Preserve the existing narrative, milestones, anchors, images, and external destinations. The desktop milestone rail becomes a native compact menu on mobile. Full stories remain in the document throughout navigation.

Compact milestone labels, dates, and supporting controls follow the readable shared interface scale. Sora carries prose and metadata; Silkscreen carries short declarations. DESIGN.md now records this page as part of the current site rather than a local migration draft.

## Polish follow-up — 2026-09-23

Milestone year ranges stay on one line. A font-relative date column aligns the project names at ordinary sizes; names move below dates when enlarged text needs the room. The selected milestone marker follows the first line's vertical center.

## Historical implementation notes (superseded)

The entries below preserve earlier review evidence and stage-specific decisions. The current contract above and refreshed DESIGN.md supersede their descriptions of current structure, content counts, type sizes, selection fade, and completion status. Old statements about local-only work, no DESIGN.md rewrite, or deployment describe those dated checkpoints; they do not grant or deny permission for a later task. Deployment authorization always comes from the active user request.

Mode: Read. Extend the existing five-chapter work timeline into the user-selected homepage world. Preserve all biographical content, external destinations, and milestone anchors. No homepage changes or production deployment. Code-led, per project preference. No critic agent, per user instruction.

## Direction contract

THESIS: A readable continuation of the homepage journey; personal history, not a grid of portfolio cards.

OWN-WORLD: Midnight navy, cream, restrained gold; Silkscreen declarations and Sora prose. A dedicated portrait coastal workshop connects Work to the homepage world without reusing the same crop.

STORY: See what Willis is building now, read backwards through five ventures, then return to his notes or get in touch.

FIRST VIEWPORT: Shared six-link reading navigation; a navy reading panel on the right headed Work. A dated five-milestone rail sits above the workshop illustration in the visible left column. TickerTown is the first real project exhibit. On mobile, the illustration becomes a short opening band and the milestones become a native compact menu above the stories.

FORM: User-pinned world and incumbent reverse-chronological timeline; no new-world seed. Signature interaction: chapter marker tracks reading position; native anchor navigation and restrained color transitions respect reduced motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Finish scope

User's no-critic instruction overrides the agent review step. Perform one batched desktop/mobile self-check and at most one fix confirmation. DESIGN.md stays unchanged for this local extension. Generate one dedicated coastal workshop illustration, record its prompt and provenance, and test its left-rail crop in the real page. Preserve all five story anchors, narrative paragraphs, lists, and content links; no production deployment.

## Finish review — 2026-09-14

Verdict: local preview ready. The shared six-link reading header, navy panel, Silkscreen headings, Sora prose, and amber details match Guide and Thoughts. The left column has its own coastal workshop and boardwalk, with the main scene visible beneath the fixed milestone rail. At mobile widths the artwork becomes an opening strip and the milestones use an accessible native details menu. No stories are hidden or truncated.

Artwork: `images/game-world/work-coastal-workshop-v1.webp`, 768 × 2048, 249,092 bytes. Created using built-in ImageGen with the existing workshop as style/palette reference only; full prompt and encoding provenance are in `.impeccable/assets/work-coastal-workshop-v1.prompt.json`.

One batched browser review at 1258 × 1354, 390 × 844, and 320 × 740 passed: all five milestones present, images loaded, correct typefaces, no horizontal overflow, and no browser errors. Desktop Tech in Asia navigation aligns the story at y=100px below the 76px header, updates the active marker, and focuses the section. Mobile Trading Cards selection collapses the menu and leaves its heading at y=184px, clear of the menu bottom at y=158px; a fresh 320px-wide direct Friends! link lands at the same safe reading offset. The mobile header retains all six links.

Independent content audit against committed `work.html`: all 24 narrative paragraphs, 13 list items, six subheadings, five date/period labels, five milestone IDs, and six content links with their target/rel attributes preserved. TickerTown keeps its original source and alt text; its dimensions are corrected to 720 × 516. No missing local resources, duplicate IDs, or mismatched tags found. `node --check work-game.js` and `git diff --check` pass. Focused JS VM tests cover desktop/mobile menu modes, modified clicks, active reading position, malformed hashes, initial deep-link settling/cancellation, and final progress.

README documents the dedicated artwork, milestone authoring, public anchor stability, and local verification. DESIGN.md remains unchanged as agreed. No deployment in this pass.

User refinements: heading is now “Work.”, sidebar return label is “Back”, and the intro uses “school side business hustle” and “16 years”. The TickerTown preview now uses the user-supplied full-resolution image from `https://preview.tickertown.ai/waitlist/screen-home-2836.webp`, saved unchanged as `images/tickertown-home-2836.webp` (2836 × 2032). Desktop and mobile checks confirmed its load, aspect ratio, and unchanged project destination.
