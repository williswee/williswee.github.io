# Homepage Coaching — scoped polish and technical audit

Date: 8 October 2026 (Singapore). Scope: the homepage `#coaching` scene in `index.html`, its rules in `home-game.css`, and the navigation behavior that affects this scene. The separate `coaching.html` page was not changed or audited here.

## Implementation integrity verdict

**Pass.** The selected wide Lantern bench artwork, restrained navy reading panel, pixel display headings, Sora body text, native FAQ, and direct coaching actions express the site's established visual and content system. The final layout keeps the two peers and their personal space beside the right panel at desktop widths. It preserves the phone art-above-text composition and does not add a runtime dependency.

## Audit health score

| Dimension | Score | Evidence and limit |
| --- | ---: | --- |
| Accessibility | 3/4 | Native disclosure and links, visible keyboard focus, logical headings, and strong sampled contrast; no screen-reader or physical-device pass. |
| Performance | 3/4 | The 440,336-byte WebP has intrinsic dimensions and low fetch priority; eager loading supports direct `#coaching` arrivals. No field or throttled performance measurement. |
| Responsive design | 3/4 | Desktop overlay and phone layout passed the inspected sizes without overflow; text zoom and a broad browser matrix were not tested. |
| Theming | 3/4 | The intentional dark palette uses shared tokens. The literal `#000` is an opacity-mask stop, not a displayed color; no theme-switching mode exists. |
| Implementation integrity | 3/4 | The source and browser checks found a coherent, page-specific implementation. The detector lacked its full parser dependencies. |
| **Total** | **15/20** | **Good**, within the bounded scope and verification limits. |

Current verified issue count: **P0 0 · P1 0 · P2 0 · P3 0**. One P1 visual issue was fixed during this polish pass. These scores are a quality assessment, not WCAG certification.

## Resolved finding

### [P1, fixed] Tall desktop showed empty bands around the artwork

- **Location:** `home-game.css`, `.scene-coaching` and `.scene-coaching .scene-content` at the desktop breakpoint.
- **Impact:** At 1222×1344, the selected 2:1 image rendered about 787px high inside a forced 1344px scene, leaving conspicuous empty space above and below the visual. The separate right panel made Coaching feel unlike adjacent homepage scenes.
- **Correction:** Coaching now follows the larger of the scaled artwork height and its panel content instead of forcing 100svh. The artwork anchors at the scene top, so expanding the FAQ increases document height without moving the image. Its bottom 6% fades into navy. The two people remain clear of the right panel.
- **Verification:** At 1222×1344 the scene and artwork both measured **786.96px**, with zero top and bottom gap. At 1440×900 both measured **900px**. At 1024×900 the artwork measured about **619.6px** and the scene about **670.4px** because the panel needed more height; the extra content remained in normal flow. At 768×1024 the section measured about **668px** around a **468px** artwork, again retaining the right panel and the readable pair. No inspected size had horizontal overflow.

## Accessibility and interaction checks

- `index.html` uses a native `<details>` with a text `<summary>` for the FAQ. The summary has a 52px minimum height and inherits the global 3px gold focus outline. Its h3 questions follow the scene h2. At 1222px, 1024px, and 390px, Enter toggled the FAQ while focus remained on the summary; the artwork did not jump, and the booking and next-section links remained available in the document.
- The sampled worst-case contrast of body text, gold action text, and heading text on the desktop 94% panel composited over white was **12.01:1**, **10.58:1**, and **14.39:1** respectively. The corresponding phone 98% panel samples were **13.1:1**, **11.54:1**, and **15.7:1**. These exceed normal-text AA contrast thresholds in the sampled states.
- The “Scroll next / My notes” link navigated to `#archive`; the Notes navigation item became current after scrolling settled. `home-game.js` uses scene positions and a `ResizeObserver`, with no fixed scene-height assumption.

## Performance, theming, and integrity checks

The selected `images/game-world/coaching-lantern-bench-v1.webp` is **1774×887** and **440,336 bytes**. Its dimensions are present in the markup. Its eager, low-priority request is intentional for a direct hash arrival. The FAQ is native and adds no script or layout loop. The single scene image uses a static mask and the site's reduced-motion rule disables scenic transitions. The reviewed console error log was empty.

The one Impeccable detector pass returned eight advisories in degraded regex mode: seven existing palette/type declarations and one `#000` mask stop used only for alpha. Source inspection did not turn these into a new Coaching defect. No current critique snapshot was available. The full HTML/CSS parsers were unavailable, so the detector did not verify computed styles or accessibility behavior.

## Verification and limits

The inspected viewports were **1222×1344, 1440×900, 1024×900, 768×1024, and 390×844**. The phone screenshot retained the existing art-above-text layout, with no overflow. All **16** targeted home-navigation and shared-navigation tests passed. The check used browser emulation, not a physical phone or tablet; it did not include an actual screen reader, hardware keyboard, text zoom, Safari/Firefox matrix, or field performance data. The narrow 768px composition places some scenic image area beyond the left edge while preserving both people and the bench; this was reviewed as an intentional crop, not an observed defect.

No further scoped fix was warranted in the final inspection round. Maintain the selected bench asset, the desktop right-panel composition, native FAQ behavior, and the standalone Coaching page's separate portrait.
