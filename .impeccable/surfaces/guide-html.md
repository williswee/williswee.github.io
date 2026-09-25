---
schema_version: 1
slug: guide-html
primary_target: guide.html
related_targets: ["guide-game.css", "guide-game.js"]
---

# Guide — field guide at base camp

Mode: Read.

## Current contract — audit fixes, 2026-09-23

Guide is a fully migrated reading-room page with dedicated field-manual artwork, Silkscreen section declarations, Sora prose, and a contents rail that becomes inline on mobile. Preserve all five sections, 50 labeled rules, 22 nested alphabetic items, 55 stable slugs, and all authored copy and destinations.

The audit correction raises compact navigation and supporting text within the established hierarchy. Copy-link buttons appear only after their handlers initialize; without JavaScript, the complete guide and native contents anchors remain usable. Shared current tokens and responsive rules are documented in DESIGN.md.

## Coaching card — 2026-09-25

The Guide closes with the shared coaching card after its final section, linking to `coaching.html`. Like the essays' copy, it is a dialogue box with a "Willis" nameplate. The Coaching page links back to the Guide's "My debugging process" rule and its "My flaws" section, so keep those slugs stable. Guide copy, contents, and slugs are otherwise unchanged.

## Shared rail — 2026-09-25

The contents rail's desktop and tablet geometry now comes from the shared `.reading-rail` in `thoughts/reading-room.css`. `guide-game.css` (v1.3) keeps the phone layout, where the rail becomes inline contents. Computed geometry is unchanged at 1336, 1000, and 390px.

## Shared landscape — 2026-09-25

The left-column art's geometry and shared treatment (clipping, ink backing, centered image, 0.9 brightness, desktop and phone gradients) now come from `.reading-landscape--portrait` in `thoughts/reading-room.css`. `guide-game.css` (v1.4) keeps only its 68% phone crop. Computed styles are unchanged at 1336, 1000, 760, and 390px.

## Historical implementation notes (superseded)

The entries below preserve earlier review evidence and stage-specific decisions. The current contract above and refreshed DESIGN.md supersede their descriptions of current structure, content counts, type sizes, selection fade, and completion status. Old statements about local-only work, no DESIGN.md rewrite, or deployment describe those dated checkpoints; they do not grant or deny permission for a later task. Deployment authorization always comes from the active user request.

Mode: Read. Extend the approved homepage and Thoughts world, not the legacy serif/card design. User-pinned direction; code-led, no concept tournament or critic agents per standing workflow preference.

## Direction contract

THESIS: A living field guide to working with Willis, readable as one complete document.

OWN-WORLD: Inherit midnight ink, cream, amber brackets, Silkscreen headings, and Sora prose. Guide owns a lantern-lit field manual illustration.

STORY: Read the introduction, find one of five topics, read every principle, and share a precise section or rule.

FIRST VIEWPORT: Fixed shared HUD. A compact contents rail sits above a lantern, open field manual, compass, and sloth bookmark on the left; an 800px reading panel on the right opens with the original title, date, introduction, and first section. Mobile crops to the manual above one reading column.

FORM: User-pinned field guide, no seed required. Signature interaction: copy a rule link with visible success/error feedback. Only deliberate navigation scrolls; reduced motion stays still.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Preservation contract

Keep the full introduction, July 2026 date, all five section headings, 50 labeled rules, 22 nested alphabetic list items, 55 existing slug IDs, and three social destinations. No factual copy edits. Preserve copy buttons, URL hashes, deep-link positioning/highlight, and keyboard operation. Do not introduce random essays or quote sharing on this page. Use existing shared reading CSS with local Guide overrides; do not restyle other pages.

## Verification

### Dedicated Guide artwork — 2026-09-14

The user rejected the reused homepage tent because the cropped sliver did not suit Guide. Replaced it with images/game-world/guide-field-manual-v1.webp, a unique 768×2048 portrait illustration generated with the built-in ImageGen tool. notes-nature-v5.png was a style-only reference, not a composition template. Exact prompt, original generated PNG path, and compression provenance are recorded in .impeccable/assets/guide-field-manual-v1.prompt.json. WebP quality 88 preserves the image without cropping or resizing, at 204,760 bytes.

The scene now occupies only the visible left rail, ending exactly at the reading panel (395.1px at the user's 1258px viewport). The narrow portrait fills this rail rather than cropping a full-width homepage scene; its essential manual/compass/lantern group is below the contents menu and visible at the user's viewport. At ≤760px the existing 188px mobile strip uses a 68% vertical focal crop of the manual. No article copy or JavaScript behavior changed. Desktop 1258×1354 and mobile 390×844 screenshots checked; asset loaded and no horizontal overflow. A contain-fit check produced visible letterbox seams and was reverted to the already reviewed cover-fit layout. README updated to identify the dedicated illustration rather than homepage art.

### Initial layout review (before the artwork replacement)

Delivered locally on 2026-09-14. Main-agent visual checks at 1339×1354 and 390×844 confirmed the base-camp crop, readable solid panel, mobile art strip, long headings, and nested-list layout. A 320px DOM check also showed no page or navigation overflow. The title, date, intro, five complete sections, all 55 stable slugs, and three original social URLs match the pre-redesign source. No content depends on entrance animations; section anchors also exist in HTML without JavaScript.

The contents list stays fixed at desktop and becomes inline on mobile. Copy controls have 44px targets and live success/failure feedback. Focused Node VM tests passed for copy success, denied clipboard, symbol reset, hash updates, focus preservation, malformed hashes, and reduced-motion behavior. Browser checks confirmed 55 buttons, correct contents state after section navigation/reload, and long-rule links landing at the start rather than in the middle. No console errors. The browser copy click updated its URL; clipboard result branches were tested in the VM rather than asserting a system clipboard read.

The detector ran in degraded regex-only mode because parser modules were unavailable; its findings were advisory type-ramp differences from the older global documentation. No global DESIGN.md repair was made. Existing shared reading typography is the implementation authority for this extension. The artwork is the already approved, tracked images/game-world/base-camp-personal-v4.png; no new raster or substitute illustration was generated.

Verdict: ready for local user review. Guide changes remain uncommitted after the earlier Thoughts checkpoint. Standing no-critic preference honored; batched main-agent visual checks and independent content/interaction tests supplied the review.
