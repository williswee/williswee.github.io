# Navigation polish and audit

Date: 21 October 2026. Local review only. Nothing published.

## Implementation integrity

Pass for the reviewed scope. The shared menu, footer, homepage chapter links and essay breadcrumbs follow the existing illustrated reading-room design. Static HTML contains the destinations and current states. Native disclosures provide the fallback; JavaScript supplies keyboard and dismissal behavior. All six homepage scenes and existing essay content remain intact.

This review covers the new shared navigation across 56 editorial pages, with rendered checks focused on Work and a representative essay. It also checks the generators, sitemap and LLM directory. It does not cover the standalone games or submit contact or subscription forms.

## Audit health score

Scores describe the sampled implementation after polish, not a WCAG certification or measured production performance result.

| Dimension | Score | Evidence and limits |
| --- | --- | --- |
| Accessibility | 3/4 | Native controls, labels, current states and visible focus. Work breakpoint focus repaired and confirmed in WebKit. Full assistive-technology testing remains outside this review. |
| Performance | 3/4 | Shared navigation adds 14,713 bytes uncompressed, approximately 3,479 bytes gzipped, with no dependencies or runtime data requests. No production field metrics or throttled-load benchmark. |
| Responsive design | 4/4 | Checked 320px, 390px, 820px, 1024px and wide desktop layouts, including doubled text at 320px and 820px. No horizontal overflow in the checked states. |
| Theming | 3/4 | Existing ink, cream and gold palette retained. Main colors use shared tokens; a few incumbent literal surface and underline colors remain. The site intentionally uses its established dark design. |
| Implementation integrity | 4/4 | Shared source and all generated outputs agree. Crawlable links, canonical URLs, article identity and publication dates are preserved. |
| **Total** | **17/20** | **Good** |

Five issues addressed: 0 P0, 0 P1, 3 P2 and 2 P3. No unresolved release blocker was found within this scope.

## Findings and fixes

### P2: Work could leave keyboard focus on a hidden mobile control

- Location: `work-game.js`, `setMenuMode` and its focus listeners.
- Category: Accessibility.
- Impact: After focusing Milestones and enlarging the viewport past 760px, the summary became hidden. WebKit could clear focus to the document before the media-query callback ran, losing the reader's place.
- Standard: Relevant to WCAG 2.4.3 Focus Order and 2.4.7 Focus Visible. This is a verified interaction defect, not a full conformance finding.
- Fix: Remember the focused control during the layout transition and move focus to the active visible chapter. Intentional focus changes and clicks elsewhere clear that memory. Use `preventScroll` to preserve reading position.
- Verification: Browser confirmation moved focus from Milestones to `#now`. Regression cases cover native focus loss, focus changes elsewhere, both resize directions and initialization before the first animation frame.
- Command: `$impeccable polish`, completed.

### P2: Breadcrumb generation joined words separated by a line break

- Location: `scripts/site-navigation.mjs`, `renderBreadcrumb`.
- Category: Implementation integrity.
- Impact: A future heading such as `Two<br>lines` generated `Twolines`, conflicting with the structured-data generator. No existing essay was affected.
- Fix: Normalize line breaks to spaces while preserving word boundaries around inline emphasis.
- Verification: Added a regression case. Existing generated HTML and metadata remain current.
- Command: `$impeccable polish`, completed.

### P2: Essay authoring instructions described the retired navigation script

- Location: `thoughts/README.md:20`.
- Category: Implementation integrity.
- Impact: Following the old instructions could restore synchronous `reading-nav.js` and the obsolete header assumptions on a new essay.
- Fix: Document the static shared template, native disclosures, deferred script, stylesheet order, synchronization and cache versions.
- Command: `$impeccable polish`, completed.

### P3: Some footer and breadcrumb targets were narrower than the site standard

- Location: `site-navigation.css`, `.site-footer-nav a` and `.breadcrumbs a`.
- Category: Responsive design and accessibility.
- Evidence: Footer Play measured about 29px wide, Work 38px, and breadcrumb Home 42.8px. Their heights already met 44px.
- Impact: Narrow labels were less comfortable to tap than the rest of the navigation.
- Standard: The project uses 44px targets, consistent with the enhanced WCAG 2.5.5 target. This was not reported as a WCAG 2.5.8 AA failure.
- Fix: Added a 44px minimum width. Confirmed the footer and breadcrumbs at 320px without overflow.
- Command: `$impeccable polish`, completed.

### P3: The mobile Menu chevron did not reflect its expanded state

- Location: `site-navigation.css`, `.site-menu[open] > .site-menu-toggle svg`.
- Category: Implementation integrity.
- Impact: The icon differed from More, Milestones and On this page, which already show disclosure state visually.
- Fix: Rotate the chevron when expanded. Native accessibility state remains supplied by details and summary.
- Verification: The expanded menu renders the upward chevron; Escape closes it.
- Command: `$impeccable polish`, completed.

## Positive findings

- Work, Coaching and Writing remain visible on desktop. Mobile destinations use 48px rows; secondary links fit a two-column layout and reflow with enlarged text.
- Header text contrast ranges from 9.59:1 for muted text to 16.45:1 for cream text. Dropdown text measures 13.56:1 and gold active text 11.94:1 against its panel.
- Footer destinations wrap without sideways scrolling. Breadcrumb titles remain readable on narrow screens.
- Keyboard Escape, current-page markers, native link destinations and reduced-motion rules are preserved.
- The navigation script performs no scroll-time measurements. Existing Work scrolling uses a scheduled animation frame.
- Sitemap and `llms.txt` contain the same 59 unique URLs. Indexable editorial canonicals and Open Graph URLs agree.
- All 47 essays retain their existing article metadata, including publication dates. Archive and breadcrumb schema remain synchronized with visible content.

## Detector and verification limits

The bundled detector ran once against the reviewed navigation and representative pages. It reported that its HTML parser dependencies were unavailable and used a reduced regex scan. It did not evaluate computed contrast or full selector matching. Its output is saved in `output/navigation-review/polish-detector.json`; it is not treated as a clean automated audit.

The scan returned two advisories in `work-game.css`. The 1.5rem mobile heading size is explicitly documented in DESIGN.md, so it is a false positive. The existing `#796748` link-underline shade is a minor token-documentation inconsistency. It does not set the text color and was preserved with the incumbent design.

Current PRODUCT.md and historical surface notes contain older counts and navigation descriptions. This pass uses the implemented CSS and current DESIGN.md for visual authority and does not perform an unrelated context migration.

The internal link check covered 1,676 links and fragments. Two existing absolute links on Play lead to `https://williswee.com/game`, whose implementation is absent from this checkout. Their live destination was not part of this local review; this is not a finding that the production route is broken.

The browser logged a third-party Datadog storage warning from the embedded subscription provider. No first-party script error was observed. Subscription delivery, external game routes, full screen-reader operation and production performance were not exercised.

## Final verification

- 261 automated tests pass.
- Navigation matches all 56 editorial pages.
- Structured data matches 50 pages, including 47 essays.
- The essay manifest matches all 47 archived essays.
- Gratitude generation matches 78 notes and its sitemap entry.
- `git diff --check` passes.
- Shared stylesheet cache version is 2; Work script cache version is 2.3.

The requested audit and polish are complete. Further work would be a separate assistive-technology or production-performance review, rather than another cosmetic pass.
