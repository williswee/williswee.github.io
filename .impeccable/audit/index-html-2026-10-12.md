# Homepage polish and technical audit — 12 October 2026

## Implementation integrity verdict

**Pass.** The homepage expresses the established Save Point Atlas system: six Singapore pixel-art scenes, cream Silkscreen headings, Sora reading text, midnight panels and restrained gold navigation. Coaching retains the small gold “as” requested by the user. Connect retains the four approved destinations and latest captions. The polish preserves all artwork, visible wording and the compact, single-row mobile menu.

## Audit health score

| Dimension | Score | Evidence |
| --- | ---: | --- |
| Accessibility | 4/4 | Native links/buttons, visible focus, named link groups, consistent new-tab announcements, conservative panel-text contrast and reduced-motion alternatives. |
| Performance | 3/4 | Small deferred scripts, correctly sized WebP artwork and prioritized first image. The illustrated page still transfers about 1.85 MiB of scene artwork; no controlled network or field timing benchmark was collected. |
| Responsive design | 4/4 | Settled layouts at 320, 390, 768, 1032 and 1440px have no document overflow. A 320px fixture with 200% text scaling retains readable content and keyboard-accessible navigation. |
| Theming | 3/4 | Coherent dark tokens and intentional scenery overlays. A navigation tint remains a literal value, and the detector does not fully recognize the documented responsive type ramp. |
| Implementation integrity | 4/4 | Consistent scene/panel/link anatomy, complete native content and preserved destinations. Independent source review passed. |
| **Total** | **18/20** | **Excellent within the inspected scope.** |

This is a scoped implementation assessment, not a formal WCAG conformance certification.

## Executive summary

No P0 or P1 defect was found. Four smaller issues were identified and resolved during the requested polish: one P2 and three P3. No verified issue remains open in the inspected homepage path.

The first audit pass inspected the existing desktop/mobile composition, source and keyboard behavior. The fixes were applied together, then confirmed in one final desktop/tablet/mobile round. Existing regression checks, generated content checks and an independent review passed. Nothing was committed, pushed or published.

## Findings and resolutions

### [P2] Inconsistent announcements for links that open new tabs — resolved

- **Location:** `index.html:101`, `index.html:123`, `index.html:129`, `index.html:173`, `index.html:242`, `index.html:250`, `index.html:258`.
- **Category:** Accessibility / implementation integrity.
- **Impact:** X announced the context change, while eight other external links did not. Visitors using assistive technology received inconsistent expectations when following a destination.
- **Standard:** An accessibility enhancement and existing site convention; not classified as a WCAG AA failure.
- **Resolution:** Added a visually hidden “(opens in a new tab)” suffix to the eight links. X retains its existing accessible name. All nine external links now announce the behavior; visible captions and arrow alignment remain unchanged.
- **Suggested command:** `/impeccable polish` — completed.

### [P3] Group labels attached to generic containers — resolved

- **Location:** `index.html:121`, `index.html:172`, `index.html:241`.
- **Category:** Accessibility.
- **Impact:** The Selected work, Coaching sessions and Ways to connect labels were attached to generic divs, whose role does not support naming. Assistive technology could omit those collection names.
- **Standard:** WAI-ARIA generic-role naming rules. See the [WAI-ARIA 1.2 specification](https://www.w3.org/TR/wai-aria-1.2/#generic).
- **Resolution:** Added `role="group"` to the three collections. The browser accessibility tree exposes the named groups while retaining each native link.
- **Suggested command:** `/impeccable polish` — completed.

### [P3] Desktop brand target smaller than the site's preferred target — resolved

- **Location:** `home-game.css:101`.
- **Category:** Responsive design / accessibility.
- **Impact:** The desktop brand's approximately 26px-tall target was less comfortable to activate than the site's other controls. It already met WCAG's 24px minimum; this was a polish issue.
- **Resolution:** Applied the existing 44px minimum height at the shared brand rule and removed the redundant mobile declaration. Confirmed a 44px target at every normal-size viewport without changing the logo/menu baseline.
- **Standard:** [WCAG 2.2 target size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). The user-approved 36px-wide menu links below 360px retain their full header-height target; inline prose links use the inline exception.
- **Suggested command:** `/impeccable polish` — completed.

### [P3] Status accessible name used different wording from the visible prefix — resolved

- **Location:** `index.html:90`, `home-game.js:51`, `home-game.js:71`.
- **Category:** Accessibility / implementation integrity.
- **Impact:** The visible “Currently:” prefix and accessible “Current status:” prefix differed, making the control less consistent for speech-control and screen-reader users.
- **Resolution:** Matched the accessible prefix to “Currently:” in native markup and both enhanced update paths. The twelve statuses and shuffle behavior remain unchanged.
- **Suggested command:** `/impeccable polish` — completed.

Removed the unused `.closing-note` rule as routine cleanup. CSS and JavaScript cache tags were advanced to 4.20 and 3.7.

## Patterns, positives and intentional choices

The recurring issue was inconsistent accessibility metadata on otherwise coherent native controls. The fixes address the shared naming/target patterns rather than changing the visual system.

- Panel body/caption text has a conservative **5.31:1** contrast ratio even when combining a 94% ink panel, 72% inactive-panel opacity and an all-white underlying scene. Cream headings reach 6.02:1 under the same pessimistic assumptions. Actual dark artwork and veils improve these bounds. This exceeds the [4.5:1 normal-text threshold](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- Keyboard navigation reveals offscreen menu destinations. The gold focus outline remains inside the navigation scrollport. The word-help button opens with Enter and dismisses with Escape while preserving focus.
- Reduced motion removes scene travel and scroll snapping while preserving useful status feedback. The scene observer handles enlarged content, restored scroll positions and history changes.
- Six artwork files total **1,940,204 bytes**. All declared dimensions match the files, and images use asynchronous decoding. Later scenes intentionally remain eager at low priority to avoid blank artwork during Safari scrolling; this existing choice was preserved.
- Before polish, homepage CSS gzipped to 4,983 bytes and the two homepage interaction scripts to 2,783 bytes combined. There is no framework bundle or new dependency.
- Static content, ordinary links, the initial status and the no-script “lah” explanation remain available without enhancement.
- The 11/12px compact mobile navigation, 36px minimum link widths at the narrowest breakpoint, dark palette, pixel headings and scene-specific crops are established user-approved decisions.

## Verification and limits

- **228/228 Node tests passed** after the changes. JavaScript syntax and `git diff --check` passed.
- Essay manifest: 46 essays current. Gratitude renderer: 71 notes current. Structured data: 48 pages current.
- Browser layouts checked at **1440×900, 1032×1344, 768×1024, 390×844 and 320×740**. Final page widths match viewport widths, and all normal-size brand targets measure 44px.
- A temporary copy of the current page with root/body text scaled to 200% was tested at 320px. It retained a 320px document width and a 128px header. This tests text reflow; it is not a physical-device or native browser-zoom measurement. The fixture was removed after verification.
- Browser accessibility inspection confirms three named groups and new-tab announcements for all nine external links. No browser console errors were observed.
- The mechanical detector ran once for this audit. It fell back to regex because its HTML/CSS parser packages are unavailable. It reported **eight inherited advisories**: one navigation color and seven responsive/logotype size advisories. The type values are already documented or user-approved; the navigation tint is legible and visually consistent. These are not eight verified usability failures. Custom-property resolution and computed contrast are outside that fallback's coverage.
- No controlled network throttling, field Core Web Vitals, physical-device or screen-reader session was performed. External service workflows and submissions were outside the homepage audit.

Screenshots, final layout metrics, test output and detector output are saved under `/tmp/homepage-audit-2026-10-12/`. Relevant captures include `after-1440.jpg`, `after-1032.jpg`, `after-768.jpg`, `after-390.jpg`, `after-320.jpg` and `after-320-text-200.jpg`.

## Recommended actions

The requested `/impeccable polish` pass is complete. No further corrective command is required for the inspected homepage. If its layout or interaction code changes later, rerun `/impeccable audit` against that changed surface. Publishing remains a separate action.
