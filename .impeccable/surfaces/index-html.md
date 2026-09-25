---
schema_version: 1
slug: index-html
primary_target: index.html
related_targets: ["home-game.css", "home-game.js"]
---

# Homepage — five-scene journey

Mode: Experience.

## Current contract — audit fixes, 2026-09-23

The current homepage contains Start / Work / Notes / Life / Connect, backed by five scenic WebP images. The compact fixed header uses an active underline and a single scroll-progress line. There is no journey rail, game-key button system, avatar cartridge, or Life-only font exception. All display headings use Silkscreen; prose and navigation use Sora. DESIGN.md and home-game.css describe the shared current world.

All four Scroll next controls use drawn down arrows; the work, archive, and contact clickthrough rows use northeast SVG arrows. The 12-status badge preserves its full strings and existing compact text size; an explicit 6px status-dot width fixes WebKit intrinsic sizing, and the visible “Currently:” prefix disappears at widths up to 360px. The mobile header keeps the short brand and smaller navigation labels on one line, as requested by the user; horizontal scrolling remains available for enlarged text. The audit correction preserves the approved artwork, copy, and badge behavior.

## Mobile header correction — 2026-09-24

Reproduced the crowded header at the iPhone 13 mini's 375px width in WebKit. The user rejected the initial two-row proposal and explicitly prefers one line with smaller menu text. At widths up to 760px, the short brand and five links now share a 64px header with a clear gap and 12px menu text. At widths up to 360px, 11px labels and a slightly smaller brand keep every link visible; link widths can reduce to 36px, with the full header height remaining tappable. Header dimensions scale with enlarged text, and em-based root scroll padding keeps Safari's anchor offset in sync. Desktop layout and homepage content are preserved. The homepage stylesheet cache version is 4.6.

Verified WebKit and Chromium at 320, 375, 414, 760, 768, 812 landscape, and 1440px, plus 200% text at 375px. Keyboard navigation, active-section feedback, anchor clearance, and contained scrolling pass; no page overflow or runtime errors were observed. All 117 Node tests passed again during deployment preflight. These are browser-emulation checks, not a physical iPhone test. The detector used its degraded regex fallback and reported inherited palette/type advisories plus the user-approved smaller header sizes; it is not a full detector pass. The user approved deploying the single-row version to GitHub Pages.

## Coaching communication — 2026-09-24

Start and Work lead into the Connect coaching introduction. A collapsed native FAQ explains preparation, working as comrades, and the expected sense of direction. The contact grid prioritizes Book a call and includes the approved Substack helper line. FAQ body text follows the 1rem body size; its summary uses the shared UI token. Approved wording remains concise and unchanged.

## Coaching page links — 2026-09-25

The Work card "Coaching as comrades" now opens `coaching.html`, which matches its northeast destination arrow. Beneath the Connect intro, a compact "More about coaching" link with a northeast arrow also opens the page. All other approved copy and the Start → Connect in-page link are unchanged. The homepage stylesheet cache version is 4.7. See coaching-html.md.

## Historical implementation notes (superseded)

The entries below preserve earlier review evidence and stage-specific decisions. The current contract above and refreshed DESIGN.md supersede their descriptions of current structure, content counts, type sizes, selection fade, and completion status. Old statements about local-only work, no DESIGN.md rewrite, or deployment describe those dated checkpoints; they do not grant or deny permission for a later task. Deployment authorization always comes from the active user request.

## WIP checkpoint — 2026-09-04

The homepage refinements are complete. Latest follow-ups changed every chapter cue to “Scroll next,” the Work → Notes label to “My notes,” and removed the environmental-startups clause from Life. The Connect return link now has equal gaps above and below (36px at 1200px; 30px on mobile), with its original destination preserved. Status copy is now “Angel investing” and “Trading 🦗(jkjk)”; the other ten messages and shuffle behavior are unchanged. Active artwork is life-family-v2.png and workshop-personal-v11.png (sticker-covered laptop). The Life heading inherits shared Silkscreen styling; historical font exceptions below no longer apply.

The user requested a commit and push to the existing WIP branch only. The Thoughts archive and freedom.html reading-room pilot are ready for review; see thoughts-index-html.md. Continue with feedback on that pair before migrating more essays or deeper pages. The paused Work-page draft and unused image experiments remain local, outside this checkpoint. No production deployment is authorized.

## Status activation feedback — 2026-09-04

The user requested reload-icon feedback on every shuffle. Replaced the hover-only quarter turn with a 300ms full turn triggered by the badge's native click event, covering mouse, touch, Enter, and Space without delaying status updates. Cumulative rotation lets rapid activations continue from the current rendered angle instead of snapping back. Reduced-motion preferences suppress rotation and receive a short 160ms opacity acknowledgement, restarted on repeated activation. No layout or artwork changes.

Verification: browser checks confirmed 360deg, 720deg, then 1800deg after repeated clicks and keyboard activations, a non-identity transform while turning, mobile activation at 390px with no overflow, and no console errors. Node checks cover repeated turns, reduced-motion feedback cancellation/restart, preference changes, and unchanged status progression. Syntax and diff checks pass. Mechanical scanning remains degraded and reports only the existing DESIGN.md size/color advisories; no motion findings. No production changes.

## Current Life heading correction — 2026-09-04

The user explicitly requested LIFE match every other h2 in Silkscreen at 51.772px in a 1204px viewport. Removed the earlier Life-only Press Start 2P override and its unused Google Fonts request. LIFE now inherits the shared h2 font, weight, size, tracking, line-height, and responsive rules. Verified all four h2s at 1204px: Silkscreen 700, 51.772px, 54.8783px line-height, and -1.81202px tracking. At 390px LIFE and the other h2s are all 42.12px. Desktop/mobile screenshots show no horizontal overflow; scene art and body copy are unchanged. The type scan still uses degraded regex mode and reports inherited size advisories, but the extra-font warning and Life-specific scale advisory are gone. This correction supersedes the earlier local Life font exception below. Production is unchanged.

Mode: Experience. Preserve the full-screen pixel-art story and dialogue-panel design selected by the user. Add Life between Notes and Contact. Use the user-supplied production Life paragraph verbatim, including emojis. No critic agent or design tournament. No production deployment.

## Direction contract

THESIS: The personal life behind the work, told as one additional scene in the existing journey.

OWN-WORLD: Existing midnight navy, cream, amber corner accents, Silkscreen headings, and Sora prose. Reuse existing panel and motion rules.

STORY: Work and reflection lead into family, tennis, reading, nature, then connection.

FIRST VIEWPORT: Full-bleed Singapore park picnic at dusk. Quiet left dialogue panel; family of five and tennis/reading props at right. Back-facing neutral figures retain privacy and character consistency.

FORM: User-pinned extension; no new direction seed. Existing scroll journey and chapter navigation gain a Life stop. Mobile stacks art above the panel and preserves the family crop.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Scope and verification

User's no-critic instruction takes priority: main-agent desktop/mobile visual and functional checks only, with one fix round. Existing scenes and deeper Work-page draft are outside this change. DESIGN.md remains the inherited system, with local strategy here. Save the generated asset and its full prompt locally.

## Delivery review — 2026-09-04

Life uses the supplied paragraph verbatim. Header navigation and the Notes → Life → Contact sequence are wired; existing scene copy and artwork are unchanged. The generated family picnic preserves the rear-facing family of five, Singapore setting, tennis gear, books, Kindle, tote, and sloth charm. Impeccable's inherited-world guidance kept the same panel treatment, colors, and type rather than opening another design direction.

The first generated crop put the father behind the panel. A single composition correction gathered the family at the right; Life's narrower desktop panel and top-aligned portrait-tablet panel keep everyone visible. Mobile uses the inherited art-above-panel treatment.

Browser checks: 1280×720, 1483×1354, 390×844, and 768×1024 visually checked; 320px navigation fits without horizontal overflow. Notes → Life and Life → Contact clicks update the hash and active navigation correctly. Preview console returned no errors. Temporary viewport override was reset. No critic agent or production deployment ran.

Detector ran once on index.html and home-game.css. It fell back to regex because parser dependencies were unavailable and reported inherited DESIGN.md type/color advisories, not new Life-specific findings. Those existing styles were preserved as requested; this is not a clean full-detector pass.

Shipping artwork: images/game-world/life-family-v2.png. Full generation/edit prompts are saved in .impeccable/assets/life-family-v1.prompt.txt and life-family-v2.prompt.txt and embedded in their corresponding PNGs. Original generated files and the first composition remain preserved. Verdict: ready for user review on the local WIP branch; no broader homepage-copy migration was made while the scope question remained unanswered.

## User-directed copy pass — 2026-09-04

Applied the subsequent 15 browser comments to About, Work, Notes, and Connect. The new AngelCentral link is grouped with TickerTown as a second Now entry; the supplied wording, links, and numeral 16 are retained. Work's longer heading has a discretionary break at the existing hyphen, without changing its text or type styling. Connect loses its four helper descriptions and closing slogan, as requested. Life and all five scene assets are unchanged.

Verification: all replacement strings matched in the rendered DOM, both Now entries were present, and removed descriptions/slogan were absent. Existing and new link targets were checked. Work was visually checked at 1483×1354 and 390×844; Connect at desktop and 320px. No page-level horizontal overflow or browser-console errors. Temporary viewport sizing was reset. No CSS changes, critic, commit, push, or production deployment were made in this copy pass.

## User-directed type and navigation pass — 2026-09-04

Navigation is now Start / Work / Notes / Life / Connect. The second Now entry is Slothware, with the user's description and slothware.ai destination. Life's next link reads “Say hello and connect.” Reused the production-branch inline SVG marks for Substack, LinkedIn, GitHub, and Intro.co's video icon; they remain decorative beside accessible text labels and inherit cream/gold link colors.

The two ledes now use the existing body-size rule instead of the larger lede rule: verified at 16.6096px in the user's 1483px viewport and 16px on mobile. Existing Sora body and Silkscreen headings remain. At the user's request, LIFE has a local Press Start 2P regular override for more explicit arcade lettering, sized to match the heading's visual footprint. Its Google Fonts request is subset to the four letters LIFE. Merely uppercasing Silkscreen did not create enough visual difference, so it was not treated as a finished typeface correction.

Verification: desktop Life and Connect plus 390px Life and 320px Connect screenshots reviewed; the Life → Connect link changes hash and active nav correctly; all four social SVGs render; no horizontal overflow or console errors. Press Start 2P loaded successfully. Type detector before/after remained degraded without parser dependencies and reports inherited type-ramp advisories plus the intentional local Life font/scale override. These are documented choices, not a full-detector pass. No artwork regeneration or production changes in this pass.

## Status shuffle and small refinements — 2026-09-04

Removed only the compact Work → Notes link's top rule, preserving other scene dividers. The homepage brand tagline is now the user-requested waving hand, also visible at 320px. Restored the production status badge's 12 messages below the Start heading. A native button provides click, Enter, and Space activation, avoids immediate repeats, updates its accessible name, and announces status text politely. The badge uses the existing square-edged navy, cream, green, and gold design instead of importing the legacy stylesheet; its 0.8rem type matches the original badge, and the emoji header uses 1rem.

Verification: desktop Start and Work screenshots and 320px Start with the longest status reviewed; no horizontal overflow, visible keyboard focus, a 44px minimum badge target, all 12 statuses covered by a Node check, and mouse/Enter/Space confirmed in a fresh browser tab. The earlier preview tab was in annotation mode and intercepted input, so it was not used as interaction evidence. The detector remains degraded without parser dependencies and reports inherited DESIGN.md drift plus the local badge/emoji type sizes, not a full clean pass. Artwork, other pages, and production are unchanged. No commit, push, deployment, or critic ran.

## Connect polish — 2026-09-24

Polished the approved coaching FAQ and contact rows without changing their wording. FAQ questions and answers use the existing 1rem body size, with more space between answers and a gold open-state chevron. Contact icons and arrows align with their titles; the grid becomes one column when the panel cannot support two 200px columns. This keeps the Intro and Substack helper lines readable at intermediate widths while preserving the existing mobile stack and scene artwork.

Verified expanded and collapsed FAQ states at desktop, 780px, and 320px widths, then restored the user's 1043px viewport. Enter and Space toggle the native disclosure with a visible focus ring. Settled layouts have no horizontal overflow; the console returned no errors. Final diff check passed. The one detector run used its degraded regex fallback because parser dependencies are unavailable; its inherited type/color advisories remain intentional for this visual world, not a full clean detector pass. Changes remain local on codex/pixel-portfolio-wip-2026-09-02; main, commits, pushes, and deployment were untouched. Verdict: ready for local review.

## Release QA — 2026-09-24

Updated WIP to origin/main at d368e7d before reapplying the coaching changes, preserving published essays, all 60 gratitude notes, current typography, Safari fixes, arrow conventions, and navigation improvements. Bumped the homepage CSS cache version to 4.5. All 117 regression tests passed; essay-manifest and gratitude-render checks passed. Homepage local links, anchors, and referenced assets exist and are tracked. Verified desktop and 320px FAQ/contact layouts, Enter/Space disclosure behavior, no horizontal overflow, and no browser-console errors in a clean preview tab; annotation controls in the earlier tab intercepted keyboard input. Temporary viewport overrides were reset. The user authorized committing, pushing WIP, and merging to main after QA; old untracked art/review files are excluded.
