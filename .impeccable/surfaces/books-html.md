---
schema_version: 1
slug: books-html
primary_target: books.html
related_targets: ["books-game.css", "books-game.js"]
---

# Books — reading shelf

Mode: Read.

## Current contract — audit fixes, 2026-09-23

Books uses the shared reading room and dedicated reading-nook artwork. Preserve the complete 47-book collection, eight categories, record order, reviews, links, and existing slugs. Sora entry titles and reviews remain distinct from the Silkscreen page declaration; author, category, filter, count, and dock text follow the readable compact interface scale.

Random selection is identified by the hash, focus, and gold corner marks. Neighboring books, the introduction, and scenery dim while the selected entry is in view; scrolling away restores readability. The compact floating dock contains Another pick and Top, with no Keep reading control. Filters and random-pick enhancements appear only once ready; without JavaScript all book content remains available. The mobile Categories menu retains keyboard and native details behavior.

## Focus-mode restoration — 2026-09-23

Focus mode dims neighboring entries, introductory text, and decorative scenery while the selected entry is in the reading viewport. Scrolling away restores normal contrast without discarding the selection or its link; returning restores focus. Keyboard-focused entries remain readable. The two-action dock remains unchanged.

## Shared rail — 2026-09-25

The category sidebar's desktop and tablet geometry now comes from the shared `.reading-rail` in `thoughts/reading-room.css`. `books-game.css` (v1.8) keeps its taller max-height and 0.96-opacity background, plus the sticky Categories menu on phones. The `.visually-hidden` helper moved to the shared stylesheet. Computed geometry is unchanged at 1336, 1000, and 390px.

## Shared landscape — 2026-09-25

The left-column art's geometry and shared treatment (clipping, ink backing, centered image, desktop and phone gradients) now come from `.reading-landscape--portrait` in `thoughts/reading-room.css`. `books-game.css` (v1.9) keeps its 0.95 brightness, the focus-mode fade, and its 68% phone crop. Computed styles are unchanged at 1336, 1000, 760, and 390px.

## Historical implementation notes (superseded)

The entries below preserve earlier review evidence and stage-specific decisions. The current contract above and refreshed DESIGN.md supersede their descriptions of current structure, content counts, type sizes, selection fade, and completion status. Old statements about local-only work, no DESIGN.md rewrite, or deployment describe those dated checkpoints; they do not grant or deny permission for a later task. Deployment authorization always comes from the active user request.

Mode: Read. Extend the approved reading-page world to the personal book collection. User-pinned sequence and reading-nook setting; code-led, no concept tournament or critic agent per established project preference. Preserve all 47 records and current order, eight categories, counts, random picks, spotlight, deep links, floating controls, and publishing workflow.

## Direction contract

THESIS: A personal reading shelf, browsed by interest and discovered one recommendation at a time.

OWN-WORLD: Shared midnight reading panel, cream Sora prose, Silkscreen declarations, restrained amber actions, and a dedicated pixel-art reading nook in the left column.

STORY: Choose a category, read Willis’s complete takeaways, or let Random pick bring one into focus.

FIRST VIEWPORT: Six-link header; left category rail above the quiet illustrated nook. Right panel opens with Books., the existing introduction, count and Random pick, then full-width recommendations with titles, authors, categories, and reviews.

FORM: Pinned existing reading-world extension; no seed. A compact mobile category menu and floating Another pick/Top controls maintain access through a long list. Spotlight highlights without blurring reading text.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Finish scope

One batched desktop/mobile self-check and at most one fix confirmation; independent content and behavior checks, no critic review. DESIGN.md stays unchanged for this local extension. Ship local preview only; the preceding Guide/Work commit is separate. Record artwork prompt/provenance and update README with the new style and unchanged content-authoring structure.

## Local finish — 2026-09-14

Verdict: ready for local user review. This is the build-thread self-check, not a separate design-critic verdict; the standing no-critic/no-DESIGN-rewrite boundary is unchanged.

- Dedicated artwork: `images/game-world/books-reading-nook-v1.webp`, 768 × 2048, 137,088 bytes. Built-in ImageGen, lossily encoded to WebP without resizing. Full generation context lives in `.impeccable/assets/books-reading-nook-v1.prompt.json`; the image-adjacent `.webp.json` sidecar makes the prompt recoverable by the skill's provenance reader. The chair, open book, lamp, and bookcase remain visible below/beside the desktop category rail; the mobile band crops around the chair and book.
- Content audit: all 47 records match the pre-redesign baseline exactly, including order, titles, authors, complete reviews, categories, links, and legacy permalink slugs. Eight category totals and the All total are preserved. Every referenced local asset exists; static IDs are unique.
- Browser self-check via the available CUA fallback: 1242 × 1354 (user-sized desktop), 1440 × 900, 390 × 844, and 320 × 740. Inline captures were visually inspected; no horizontal overflow or broken images. Browser error log was empty. All six navigation links fit the narrowest viewport.
- Interaction checks: category counts/visibility and pressed states; random picks restricted to Parenting/Career without immediate repeats; single persistent spotlight and focused card; visible floating Another pick/Top controls; mobile sticky Categories menu and collapse after selection; filter and Top clear stale spotlight/hash; existing `#clarity-connection` loads and focuses correctly. Selected cards clear the sticky header/category strip and floating dock.
- JavaScript syntax and focused VM checks pass, including malformed/decoded hashes, hashchange, empty/single-item selection, future duplicate-title IDs, reduced motion, hidden-dock focus safety, long-card alignment, and cancellation of stale initial-font navigation. Complete static book markup remains present without JavaScript.
- The one detector pass ran in degraded regex mode because its HTML/CSS parser dependencies are unavailable. It returned type-ramp advisories only; no computed-contrast verdict is claimed. Sizes follow the existing reading-page microcopy/body hierarchy and the Books title/review roles; no system-wide token rewrite was made for this page.
- README now documents the page-specific CSS/JS/art, category/count updates, preserving existing permalink IDs, and the desktop/mobile publishing checks. Books remains local and uncommitted, separate from Guide/Work checkpoint `a6faa93`.

## Focus-mode correction — 2026-09-14

User review caught a regression: the first redesign only muted neighboring titles instead of restoring the original focus-mode fade. Updated `books-game.css` to fade entire nonselected cards to the original 22% opacity, along with the reading-nook illustration and introduction. The selected card, header, category controls, and floating controls remain at full opacity. This is driven by persistent spotlight state, not transient keyboard focus; no JavaScript or content changes were needed. Reduced-motion preferences disable the fade transition, not the focus effect. The stylesheet URL is versioned `v=1.1`, and README describes this behavior.

Verified visually at 1396 × 1354 and 390 × 844: direct book hash, another random pick, one full-opacity selection, faded surroundings, and usable controls. Category selection and Top restore full visibility and clear the hash/spotlight. No horizontal overflow. Local correction ready for user review; uncommitted.

## Approved checkpoint — 2026-09-14

User approved committing and pushing Books after shortening the introduction to “A selection of books I've enjoyed.” The original 47 recommendations and restored focus-mode behavior are unchanged. This checkpoint supersedes the earlier uncommitted status above. Next agreed page: Gratitude, in a future session; do not start it as part of this checkpoint.
