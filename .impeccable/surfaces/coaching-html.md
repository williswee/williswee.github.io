---
version: 1
slug: "coaching-html"
primary_target: "coaching.html"
related_targets: ["coaching-game.css", "coaching-game.js", "coaching-contact.js"]
---

# Coaching — coaching as comrades

Mode: Persuade, inside the established reading room.

## Full-height landscape correction — 2026-10-08

The desktop backdrop now uses `images/game-world/coaching-lantern-bench-portrait-v1.webp` (768×2048), a vertical extension of the chosen lantern-bench scene. Its two peers remain seated with visible personal space, alongside the notebook, tote, bench, and lantern. Extended tree canopy, sky, and rocky foreground let the image fill the same fixed landscape column used by Guide and Thoughts. The shared image rules remain `width: 100%`, `height: 100%`, and `object-fit: cover`; there is no vignette mask or separately sized illustration.

The script only caps the scrollable navigation rail and adjusts the portrait's vertical crop. Crop offsets always stay between the full-cover image's bottom and top bounds, so the artwork never reveals blank bands. Where the available geometry permits, both heads stay 24px below the rail and the lantern stays 24px above the viewport edge. Extremely wide, short columns prioritize complete background coverage. The source artwork's spacing between the people is never compressed.

At 760px and below, a native picture source selects the original `images/game-world/coaching-lantern-bench-v1.webp` (1774×887). It covers the existing 260–320px opening band at `30% 60%`, followed by the established 32px pane overlap. The navigation rail stays hidden. Social previews continue to use this original wide image. Cache versions are `coaching-game.css?v=1.14` and `coaching-game.js?v=1.8`.

The previous landscape-fitted-below-the-rail treatment was rejected by the user and is superseded. Regression checks execute the crop script through desktop, mobile, narrow tablet, enlarged rail text, and very wide short-window states, checking full coverage, bounded offsets, source switching, and group clearance wherever geometrically possible. Final browser review is coordinated with the homepage correction.

## Current contract — 2026-09-29

The primary invitation is now **Send me a note**: an outline link in the hero and desktop rail jumps to a single inline form after the testimonials. **Book a session** remains a secondary Intro link in the hero and close, with the rates/times and 20%-to-charity copy. The visitor can ask about fit before committing to a paid session. All other coaching copy, supporting links, shared navigation, and the established navy/cream/gold world remain in place.

The form asks for name, email, and “What are you working through?” with permanent labels, an all-fields-required note, and a short writing prompt. The reply expectation is **within 3 business days**, supplied by the user. Name and email share a row on desktop and stack on phones. The submit button is solid gold; fields keep the reading room's ink fill and square cream outlines. The existing lantern welcomes the reader beside the form heading with its single 1.2-second flicker and steady reduced-motion fallback.

The native HTML POST points to the user-provided Formspree endpoint `https://formspree.io/f/mdekydke`. The recipient is configured in Formspree, not exposed in the page. `coaching-contact.js` adds inline validation, pending/confirmed-success/error states, draft retention on failure, and duplicate-submit prevention. A deliberate “Continue with Formspree” control recovers from provider/challenge failures; uncertain requests never retry automatically. Without JavaScript the native POST and browser validation remain available. No note values go into browser storage, URLs, custom analytics events, or confirmation copy. Formspree's `_gotcha` honeypot is present.

The six real testimonials now include Daniel and Yao Ming before Mariana. One exact sentence in each quote receives gold emphasis. All testimonial text and source links remain intact.

The 2026-09-25 entries below describe the earlier implementation and its audit history. This contract supersedes their primary-booking flow. CSS is v1.7; contact JS is v1.1. Validate desktop/mobile layout, keyboard focus, failed and confirmed sends, and no-script fallback before publishing. Mocked responses cannot verify the configured inbox or CAPTCHA account settings; delivery and Reply-To need a real test.

## Initial contract — 2026-09-25

Coaching is the destination for every essay's coaching card, the Guide's closing card, the homepage Work card, the Connect section's "More about coaching" link, and a one-line mention in the Work page's Now section. It appears immediately after Work in the shared header navigation, with the same link style and mobile behavior as the other destinations. Coaching is marked current only on this page.

The page's one job is a click on **Book a call** (`https://intro.co/williswee`, new tab). One booking control sits in the first screen (verified at 390×844 and 1280×720); the other closes the page after the testimonial. Both reuse the homepage booking anatomy (video icon, gold label, "Rates & times on Intro. 20% goes to charity.", northeast arrow) inside the inner-page outline (`--line-strong`, gold on hover and keyboard focus). Each booking link, and the inline "via Intro" and "Slothware Labs" links, announces "(opens in a new tab)" through a visually hidden span.

The user approved the copy on 2026-09-25. Sequence:
- The title, at the shared reading-page sizes; on phones it stacks as "Coaching / as / comrades".
- One body-size intro, styled like the Guide's, in the user's 2026-09-25 wording. It leads with the Tech in Asia credential and ends with ✌️.
- Booking, then the 10-hours note.
- Who it's for.
- What we can work on: six topics, each linked to a supporting essay or Guide rule. At the user's request, each topic is numbered in a hanging column, drawn as small pixel-font tiles so the numbers look the same on every platform.
- How it works: the homepage FAQ answers, verbatim. The questions carry the user's decorative emoji (🎒 🤝 🧭), hidden from screen readers.
- A bit about me.
- Testimonials, as stacked dialogue boxes. Le Yi (linked to LinkedIn) comes first, then Mariana (linked to her Intro review). Each pixel-font nameplate straddles its box's frame. The last box shows a stepped gold "continue" arrow pointing down to Book a call. `coaching-game.js` runs its loop only while the list is on screen, and the global reduced-motion rule stops it.
- The closing booking control, then the "Not sure yet?" links.

Change approved copy only at the user's request. Add testimonials only as real, attributable quotes; never ship a placeholder.

The backdrop is the dedicated 768×2048 `images/game-world/coaching-comrades-v1.webp` portrait, with the shared portrait treatment (`.reading-landscape--portrait`) plus its own phone gradient and crop. It shows two comrades at a sea-cliff overlook. The link-preview image `images/game-world/coaching-comrades-og.jpg` is a 600×315 crop around the two figures, scaled exactly 2× without smoothing to 1200×630 (about 50KB), so shared links match the page.

The shared essay card (`aside.coaching-cta`, styled in `thoughts/reading-room.css`) carries the user-approved line "Founder and stuck on something? I do coaching as comrades." It is an ink dialogue box. A decorative "Willis" nameplate (the shared `.dialogue-nameplate`, hidden from screen readers) straddles the frame, and the whole card is the link, keeping its northeast destination arrow. `scripts/tests/coaching.test.mjs` enforces its placement in every essay and the Guide, the booking links, and that local links resolve.

## Audit follow-up — 2026-09-25

The audit scored the first build 15/20. Its integrity failures all came from homepage styling imported into an inner page: the sunset art, gold-framed buttons, and an oversized intro. The follow-up steps ran in this order:
- **Quieter:** swapped the backdrop and moved the booking controls to outlines. Displayed backdrop luminance fell from 0.133 to 0.012, inside the siblings' 0.009–0.018 range.
- **Typeset:** restored the shared title sizes and a Guide-style intro.
- **Layout:** added the user-requested topic numbers, removed the row rules, and extended the receipt links' tap area to 34px. At the user's request, the testimonial then became a card.
- **Clarify:** added the new-tab announcements.
- **Optimize:** measured, and made no change. The backdrop is the page's largest paint (602k px² at 1336×1360), so `fetchpriority="high"` stays. The swap already cut it from 246KB to 49KB, and the page totals about 105KB before analytics.
- **Polish:** gold border on keyboard focus, and test guards for the new-tab wording and the topic numbering.

## Delight and polish pass — 2026-09-25

The user chose all six proposed ideas:
- **Title:** a small gold "as" (Sora 500) joins the two Silkscreen words. From 320px to 1920px it breaks as "Coaching as / comrades" with whole words. At 200% text on phones, the shell's anywhere-wrap breaks a word rather than overflowing. Don't disable that wrap: a 2026-09-25 audit caught the resulting overflow.
- **Link previews:** the search and preview descriptions now reuse the user's intro wording.
- **Topic numbers:** redrawn as 24px pixel tiles with 1rem Silkscreen digits, the crisp size.
- **Desktop rail:** styled like the Guide's contents. Four section links highlight while their section is being read, and a booking shortcut stays in view. Phones omit the rail because the page already has two booking controls.
- **Essay card:** now a "Willis" dialogue box. The nameplate is a shared component with the testimonials; the stylesheet cache version is 1.17.
- **Dedicated backdrop:** generated from `.impeccable/assets/coaching-comrades-v1.prompt.json` and integrated as `images/game-world/coaching-comrades-v1.webp`.

## Second audit follow-up — 2026-09-25

The re-audit scored 17/20. The follow-up made three changes:
- **Title overflow:** removed the title's `overflow-wrap: normal`, which let it spill at 200% text.
- **Link preview:** first re-encoded the old Connect-scene preview (233KB to 114KB). Once the dedicated art shipped, it was replaced with `coaching-comrades-og.jpg`, a 50KB crop of the new art.
- **Shared styles:** moved the desktop rail geometry into the shared `.reading-rail` and the `.visually-hidden` helper into `thoughts/reading-room.css`. The stylesheet cache version is now 1.18, and the Guide, Work, Books, and Gratitude route stylesheets were bumped too.

Computed rail geometry matched the previous per-page values at 1336, 1000, and 390px. Work keeps 24px padding (18px 12px at tablet width); Books keeps its taller, 0.96-opacity panel.

## Third audit follow-up — 2026-09-25

The third audit scored 18/20. The user chose all three fixes:
- **Continue cue:** it plays four one-second loops, then rests, keeping this automatic motion under WCAG 2.2.2's five-second limit. It replays whenever the testimonials come back on screen, and reduced motion still removes it. A test guard keeps the loop count finite.
- **Phone and tablet crop:** the banner now pins the figures' heads using container units. The heads get 28px of headroom on phones, easing to 10px from 560px wide. The lantern stays in view through 560px; small tablets (iPad mini, 744px) show the faces instead of the lantern, where they previously lost their heads. Browsers without container units keep the old 62% crop.
- **Shared landscape:** the left-column geometry and shared treatment moved into `.reading-landscape--portrait` in `thoughts/reading-room.css`, used by all five portrait pages; essays share the same geometry rule. Cache versions: reading-room 1.19, `coaching-game.css` 1.2, `coaching-game.js` 1.1.

Computed styles for Coaching, Guide, Work, Books, Gratitude, and an essay matched a pre-change snapshot at 1336, 1000, 760, and 390px. The only differences were Coaching's intended phone crop at 390 and 760px. All 128 tests pass, along with the Gratitude and essay-manifest checks. The detector ran once in degraded regex mode; its four advisory findings are older lines in the Guide and Work stylesheets, outside this pass.

## Live-site audit follow-up — 2026-09-25

The work deployed as `814b443`. The live audit scored 18/20, and the user chose all of its fixes:
- **Desktop art:** on short laptop windows the rail hid the figures' heads (60px at 1366×657). The art now drops them to 24px below the rail, and taller windows keep the centered crop. `coaching-game.js` (v1.2) measures the rail into `--coaching-rail-clearance`. Without script, the 420px default still clears it by 23–31px. `coaching-game.css` is v1.3.
- **Footer icons:** on every reading page and in the Gratitude renderer, the Substack, X, and LinkedIn icons now say "(opens in a new tab)".
- **Not-found page:** `404.html` is new and has its own surface brief.
- **Sitemap host:** the sitemap and `robots.txt` now use `https://williswee.com/`, so crawlers skip the `www` redirect.

The Cloudflare "Always Use HTTPS" setting is the user's to change; this repository can't set it.

## Verification — 2026-09-25

All 126 Node tests passed, along with the essay-manifest and Gratitude checks. Later, the dialogue-box testimonials were checked at 1105px and 390px: no overflow, and the continue loop was paused off-screen and running on screen. Chromium checks ran at 1336×1360, 390×844, and 320px, including a three-card testimonial preview made from temporary DOM copies. They showed no horizontal overflow, markers aligned within 1px of their titles, and the booking control in the first screen. Keyboard focus shows the gold ring and border. The type and layout scans ran in degraded regex mode with no findings; this is not a full detector pass. The work is local on the WIP branch; main is untouched.
