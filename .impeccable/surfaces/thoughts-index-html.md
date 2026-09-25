---
schema_version: 1
slug: thoughts-index-html
primary_target: thoughts/index.html
related_targets: ["thoughts/freedom.html", "thoughts/tickertownupdate.html", "thoughts/reading-room.css", "thoughts/reading-room.js", "thoughts/essay-landscape.js"]
---

# Thoughts — archive and essay reading room

Mode: Read.

## Current contract — audit fixes, 2026-09-23

The migration is complete: the Thoughts archive and all 41 essays share the dark reading room. Along with Guide, Work, Books, and Gratitude, these are the site's 46 inner pages. Preserve every essay's authored text, date, URL, stable anchors, image meaning, caption, and footnote. The archive groups by year and offers Random pick; it no longer has a year-jump navigation strip or year scroll-spy.

All archive arrows are drawn northeast vectors through a CSS mask, so Safari cannot substitute emoji. Navigation, dates, counts, captions, and supporting reader controls use the readable compact type scale. Random-pick and other enhanced controls appear only after initialization; native links and complete static content remain available without JavaScript. Essays use one of ten quiet landscapes chosen once per load, with a static no-JavaScript fallback.

Image optimization serves responsive compressed versions of heavy essay figures while preserving dimensions, alt text, captions, and the original source assets. The intentional eager, low-priority loading of later homepage and meditation-retreat images remains a Safari reliability decision; it is not superseded by generic lazy-loading advice.

## Polish follow-up — 2026-09-23

Archive dates take their natural height below each title, including when enlarged text wraps the date. The entire row remains clickable and its keyboard focus ring includes the date. Preserve this normal-flow spacing rather than restoring fixed bottom space for an absolutely positioned date.

## Coaching card — 2026-09-25

Every essay, including the `freedom.html` template, carries one shared coaching card between `</article>` and the newsletter block. It uses the user-approved line "Founder and stuck on something? I do coaching as comrades." and links to `../coaching.html`. The card sits outside the article, so reading progress, quote tools, and footnotes are unaffected. It is an ink dialogue box with a decorative "Willis" nameplate, the shared `.dialogue-nameplate` also used by the Coaching testimonials. Essay text is unchanged, and essay sitemap dates were deliberately left alone. The shared stylesheet cache version is 1.17 on every reading page and in the Gratitude renderer. `scripts/tests/coaching.test.mjs` enforces the card.

## Shared landscape — 2026-09-25

Essay scenery shares one left-column geometry rule with the five portrait pages (`.essay-page .reading-landscape` sits beside `.reading-landscape--portrait` in `thoughts/reading-room.css`). The essays' dimmed, desaturated treatment is unchanged, and a redundant phone height was removed. The shared stylesheet cache version is 1.19 on every reading page and in the Gratitude renderer. Computed styles matched a pre-change snapshot at 1336, 1000, 760, and 390px.

## Historical implementation notes (superseded)

The entries below preserve earlier review evidence and stage-specific decisions. The current contract above and refreshed DESIGN.md supersede their descriptions of current structure, content counts, type sizes, selection fade, and completion status. Old statements about local-only work, no DESIGN.md rewrite, or deployment describe those dated checkpoints; they do not grant or deny permission for a later task. Deployment authorization always comes from the active user request.

## TickerTown essay migration — 2026-09-14

At the user's request, tickertownupdate.html now uses the same reading shell, Silkscreen/Sora typography, navigation, newsletter/footer, shared interactions, and ten-preset background picker as Freedom. Preserved all article text, five original image sources/alt text, four captions, and eight numbered footnotes. Added intrinsic image sizes and lazy loading below the first figure; removed legacy rounded-image styling. Corrected one pre-existing malformed footnote URL by removing its trailing `)`. Desktop at 1339px and mobile at 390px checked, no horizontal overflow, background loaded, footnote preview showed the correct note, and the browser reported no errors. This extends the pilot to these two essays only.

## Quieter essay scenery — 2026-09-14

The user requested simpler, less repetitive essay backgrounds drawn from ten pre-created images, accounting for the visible left side. Freedom now uses a pool of ten portrait pixel landscapes in images/reading-landscapes/. The built-in image_gen tool generated each scene separately using notes-nature-v5.png as a style reference; full prompts and original generated paths are in .impeccable/assets/reading-landscapes-prompts.json. Optimized WebP assets preserve the night palette and remove the earlier figure/desk composition. Each is 1024×1536 and about 45–76 KB. A review contact sheet is .impeccable/review/reading-landscapes-contact.jpg.

essay-landscape.js chooses one asset during parsing and downloads only that selected background. It avoids the previous session choice, safely falls back to independent random choice if storage is blocked, and never changes scenery during reading. No-JS uses scene 01. Failed image loads leave the ink background. Essay-scoped CSS fits the image to the left rail ending at the reading pane, gently mutes it, and fades the right edge; mobile uses the existing 188px opening strip. Archive artwork and article content remain intact. This is still the Freedom pilot, not a migration of other essays.

Verified the ten generated scenes together, desktop layout at 1340px, and mobile at 390px without overflow. Reload changed scene 05 to scene 06, with one rendered background and successful 1024px source load; resizing kept the same scene. Browser console had no errors. Focused in-memory selection checks covered all ten choices, no immediate repeat over 100 loads, and blocked storage. Syntax and whitespace checks passed. Viewport reset after QA. Earlier September 14 feedback removed the archive year-jump controls and scroll-spy while retaining year groupings, counts, and Random pick.

Mode: Read. The user approved the Thoughts archive + one-essay pair from the proposed homepage-world migration. The sample is freedom.html because it covers an image, caption, footnotes, quotation, subscription, progress, and quote sharing. Preserve every essay, date, URL, and article word. Other essays, other deeper pages, the finished homepage, and production are outside scope.

## Direction contract

THESIS: A quiet reading room inside the homepage's night landscape; essays precede newsletter promotion.

OWN-WORLD: Existing Notes pixel artwork, midnight navy, cream, amber corner brackets, Silkscreen declarations, Sora reading text.

STORY: Find an essay by year or chance, read without distraction, explore footnotes, share a passage, and subscribe.

FIRST VIEWPORT: Full-height landscape at left; a solid, framed reading pane occupies the right three-fifths. Archive title, intro, random picker, years, and newest essays are visible. Mobile brings a short scene above the full-width pane.

FORM: User-approved reading-mode extension, code-led; no new seed or identity tournament. Sticky year navigation tracks normal document scrolling. Dice motion acknowledges random selection; no entrance choreography.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Execution boundaries

Inherit DESIGN.md and current homepage implementation, without rewriting global design rules. Retain the standing no-critic/no-tournament preference: main-agent batched desktop/mobile visual and functional verification. Reuse the existing Notes illustration; no new artwork or image generation. Keep all existing social and navigation destinations. A direct newsletter link accompanies the retained Substack embed in case third-party embedding is unavailable.

## Delivered pilot — 2026-09-04

The two pages share reading-room.css and reading-room.js, isolated from legacy pages and the homepage. Desktop uses an 800px maximum solid ink pane beside the existing Notes landscape; mobile uses a 188px scenic opening followed by the reading pane. Archive title is 52px Silkscreen, mobile 42px. Essay title is 42px/36px desktop and 30px mobile for longer titles; Sora body is 17px desktop and 16px mobile. Year buttons remain jumps, not filters, with counts and scroll tracking. Main navigation keeps all six existing destinations, adopting the homepage's Start label and waving-hand brand.

The archive's 39 entries, titles, dates, and hrefs are byte-for-byte unchanged. The essay's normalized text, caption, footnote text, and all article link destinations match HEAD. Its original image remains unchanged. Newsletter embedding, social links, random picks, reading progress, footnote previews, quote copying, and X sharing remain available. Substack needs color-scheme: light on its iframe to render its transparent embed correctly inside the dark host; retained 460px/520px small-screen heights prevent form clipping. No subscriptions or social posts were submitted during verification.

## Review and verdict

Ready for user review, limited to this pilot. Main-agent desktop (1440×1000), user-size (1089×1354), and mobile (390×844) captures reviewed. 320px document overflow checked. The mobile header was tightened to keep its six destinations visible. Newsletter jump spacing accounts for sticky archive controls. Quote Escape dismissal was corrected after the interaction check caught a keyup reopening it.

Seven archive checks and twelve reader checks pass in the development-only thoughts-feature-check.html harness, including random navigation to a real essay, year state/offsets, all-to-top, footnote/Escape behavior, quote selection, X URL composition, clipboard success and denial feedback, and reading progress. Clipboard API delivery is stubbed in that harness; it validates the exact copied payload and both response states, not system clipboard permissions. Live browser checks also exercised year jumps and mobile footnote interaction. Preview console reports no errors. Syntax and git whitespace checks pass.

The detector ran once in degraded regex mode because its parser dependencies are absent; findings are advisory type-scale and color differences against the historical DESIGN.md ramp, not a full clean detector pass. The pilot deliberately inherits current homepage colors and introduces fixed Read-mode sizes. No global design-document rewrite, critic agent, new raster, commit, push, or deployment. Existing image provenance is unchanged.

Evidence: .impeccable/review/thoughtsDesktopCapture.jpg, thoughtsMobileCapture.jpg, thoughtsUserCapture.jpg, essayDesktopCapture.jpg, essayMobileCapture.jpg, and thoughtsNewsletterMobileCapture.jpg. Other essays and the remaining deeper pages await user approval of this pair.
