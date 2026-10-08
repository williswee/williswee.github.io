---
schema_version: 1
slug: creative-html
primary_target: creative.html
related_targets: ["creative-game.css", "creative-game.js", "thoughts/reading-room.css", "index.html"]
---

# Creative projects

Mode: Read.

## Current preference, 2026-10-08

The project list now lives at `/play` in `play.html`; `creative.html` is a compatibility redirect. The user explicitly removed all visible **Video description** disclosures and separate **Open video** links. Preserve native video controls, accessible labels, in-player fallback links, brief duration/audio notes, and the primary project actions. This preference supersedes the older media guidance below.

## Current contract, 2026-10-05

Creative is a growing list of projects Willis builds to explore. The fifth Work row on the homepage opens `creative.html`. Its label is "Creative", its title is "Randomly fun projects", and its description is "Things I build just to explore." The page opens with "Randomly fun projects." and the same description.

This is a narrow addition to the existing site. It uses the shared reading room, Silkscreen page heading, Sora project headings and prose, navy reading pane, cream text, gold details, and a dedicated seaside pixel-art workshop portrait. Willis appears from behind at a warm game-building desk, with a small thought cloud. The illustration keeps the coastline and boardwalk atmosphere of the site while giving Creative its own story. On desktop, the portrait sits beside the reading pane. On phones, it becomes the opening band with a 60% vertical crop that includes Willis and the thought cloud. The project list uses ruled rows. Each row has a title, description, full-width preview, and separate action link with a northeast arrow. It can grow by adding another list item.

Each project action is a native link. Media sits outside the action link so video controls work independently. The two X posts open in new tabs with `noopener noreferrer` and accessible new-tab notices. The game opens in the same tab. The list works without JavaScript. The page keeps the shared navigation, skip link, footer links, and a "Back to Work" link to `index.html#workshop`. The gold action links have a minimum height of 44px. Hover and keyboard focus underline their text; reduced-motion preferences remove the arrow transition.

Each silent video has a native "Video description" disclosure beside its direct-file link. The controls wrap with enlarged text, and an open description uses the full pane width. The prose describes the recorded interactions and results, verified against the final video. `aria-details` connects the player to the disclosure, while `aria-describedby` references its always-visible summary. Chrome omits descriptions that reference content inside a closed disclosure, so the player points to the available control and exposes the full prose when it opens. The summary has a project-specific accessible name, native disclosure marker, visible keyboard focus, and a minimum height of 44px. Description text uses the shared body font at 1rem. Custom link names retain the full visible wording before adding project or new-tab context.

## Discovery interaction

The delight thesis is curiosity that opens a different project each time, with another roll beside the project just discovered. An inline "Surprise me" button sits beside the introduction on desktop and wraps beneath it on phones. It uses the shared random-pick control and drawn die from Books and Gratitude. `creative-game.js` reveals it only after initialization and only when at least two projects exist. One reusable "Another surprise" button moves into the selected project's action group so continued exploration does not require returning to the top. It wraps below the destination link when space is limited.

Each cycle visits every project once, and the first pick of the next cycle cannot repeat the previous pick. Each pick focuses the project's heading beneath the fixed navigation and updates the URL hash without adding a history entry. Gold heading text and opposing 12px corners identify the selection. Other projects stay fully visible. The activated control's die turns for 220ms without delaying navigation. Reduced motion removes the turn and uses immediate scrolling; the selected state remains visible. Escape clears the marks and project hash and hides the contextual button. If that button has focus, focus returns to the selected heading before hiding it; otherwise focus and scrolling stay unchanged. Existing project hashes restore selection marks and count as a visited project in a fresh cycle. The picker never plays a video or opens a project link.

## Supplied projects and exact destinations

Projects appear newest first, with a muted date aligned to the title baseline when space allows, wrapping beneath the heading on narrower screens. Dates use a native `time` element with an ISO date:

- "Chix Run" (5 October 2026) links to `/chix-run/`. Its description is "One chicken, a very bad escape plan, and a rooftop full of coins." A separate paragraph follows: "I built this for fun to see what I could make with a free game engine and Codex. It started as a bean, then became a ridiculous chicken."
- "Find the real Willis" (30 September 2026) links to `https://williswee.com/game`. Its description is "A five-minute game. Three versions of me. Two are making shit up." A separate paragraph follows: "We used to play 2 Truths and a Lie at Tech in Asia with every new team member. So I built this for reminiscence’s sake."
- "GoogleFluid" (24 September 2026) links to `https://x.com/williswee/status/2103028022358204876?s=20`. Its description is "A Google Search experiment where the interface changes as you type."
- "Brain games for kids" (12 August 2026) links to `https://x.com/williswee/status/2092113393419518026?s=20`. Its description is "Brain games I built for my girls, with a little friendly competition."

The homepage Notes section no longer contains the game link. Creative now groups these four supplied projects under Work. Adjacent description and story paragraphs have a scoped 12px gap.

## Project previews

Chix Run uses a 15-second recording of real keyboard gameplay captured on 2026-10-05. It shows coins, two shields, four dashes, six obstacle smashes and the transition to Round 2, with the actual game sound effects. No captions or overlays were added. `videos/chix-run-demo-15s-a5fc910c8b02.mp4` is H.264/AAC stereo at 960 × 1440, 60fps, exactly 15 seconds. `images/chix-run-demo-poster-a5fc910c8b02.webp` comes from one second into that video. The native player is unmuted, does not autoplay, and has a direct-file link. At the user's request it has no "Video description" disclosure or relationships pointing to one; other projects retain theirs. The portrait player is centered at up to 400px wide and preserves the complete canvas. The standalone game serves prebuilt local assets under `/chix-run/`; editable Bun/TypeScript source is in `chix-run/source/`.

Brain games uses a 30-second recording of actual gameplay on the public `https://dlkplay10.vercel.app/`, captured on 2026-10-03. The recording shows casual play through level 1 of Arrow Exit, Star Circuit, and Color Pour, with each puzzle solved and the cursor visible. The raw clips last 13, 11, and 15 seconds. They were joined and sped up to 1.3 times speed with FFmpeg `setpts=PTS/1.3`. There are no overlays, captions, narration, or audio.

The page serves `videos/brain-games-demo.mp4`, encoded as H.264 with `yuv420p` at 1280 × 900 and 30 frames per second. Its poster, `images/brain-games-demo-poster.webp`, comes from 0.5 seconds into the finished video. Native controls, `playsinline`, and `preload="metadata"` allow playback without JavaScript. The video has no surrounding anchor and does not autoplay. A visible "Open video" link and an in-player fallback open the MP4 directly; there is no visible demo caption. The previous Open Graph image copies were removed after this recording replaced them.

GoogleFluid reuses `videos/googlefluid-demo-738b72e42608.mp4` and `images/googlefluid-demo-poster-1280-9f83b9bd09fe.webp`. The 30-second silent demo uses native video controls, `playsinline`, and `preload="metadata"`. It has no surrounding anchor. A visible "Open video" link and an in-player fallback both open the MP4 directly.

Find the real Willis uses a screenshot of the public `https://williswee.com/game` starting screen, captured without authentication at 1280 × 860 on 2026-10-03. The page serves `images/creative-real-willis-640.webp` and `images/creative-real-willis-1280.webp` with responsive source selection and lazy loading below Chix Run.

The previews retain their aspect ratios. Landscape previews fill the reading pane's available width; portrait previews are centered at up to 400px wide. The Brain games recording and Willis screenshot use actual project content. Their source URLs, capture dates, formats, and dimensions are recorded in `.impeccable/assets/creative-project-previews.json`.

## Sources and system fit

The implementation sources are `creative.html`, `creative-game.css`, and `creative-game.js`. Shared layout, typography, colors, and responsive behavior come from `thoughts/reading-room.css`. Creative uses its own portrait, `images/game-world/creative-workshop-v1.webp`, with provenance in `.impeccable/assets/creative-workshop-v1.prompt.json`. Work retains `images/game-world/work-coastal-workshop-v1.webp`. The homepage entry is in `index.html`; its existing contract is in `.impeccable/surfaces/index-html.md`.

The page follows `PRODUCT.md`'s static HTML/CSS constraint and purpose of sharing personal projects. The new illustration stays within the existing pixel-art world. It introduces no global tokens or new visual direction, so `DESIGN.md` and the global design sidecar remain unchanged.

The Willis image preview also links to the game, with a gold border on hover and keyboard focus. Both videos remain outside links.

The accessibility fixes passed Chrome checks at 1283, 768, 390, and 320px, including a 200% root text size at 320px. The browser exposes both video-description relationships while disclosures are closed and all description text when opened. Enter and Space toggle the disclosures, and both remain usable without JavaScript or loaded MP4s. Project links preserve their visible wording in the computed accessible names. The homepage round trip and 30-second Brain video playback pass. All 28 document-structure and reading-navigation tests pass. These checks do not constitute a full assistive-technology certification.

The 2026-10-05 polish passed browser checks at 1280, 768, 390, and 320px with no horizontal overflow or console errors. Three consecutive picks visited all three projects, the contextual button followed the selection, Escape restored heading focus before hiding a focused button, and the video description still opened with Enter at 320px. Five discovery regression tests cover cycle boundaries, hash seeding, button movement, focus, and reduced motion; all eight document-structure tests also pass. The Impeccable detector reported no findings in the three Creative implementation files, but ran in regex fallback because its HTML parser dependencies were unavailable; computed contrast was not evaluated by that scan.
