# Essay authoring

Use [`freedom.html`](freedom.html) as the layout reference when adding an essay. All essays share the approved reading template and the ten-preset background picker. Preserve the pixel-art identity and the complete original article content.

## Add an essay

1. Copy `freedom.html` to `{slug}.html`. Update the document title, meta description, visible heading, publication date, subtitle, and complete article content. Preserve the source essay's wording, links, images, and captions; remove copied Freedom-specific content. Omit Substack's in-article subscription buttons, such as **Subscribe now**; use the site's shared newsletter block with its immediate subscription link and deferred embed. If the source has a subtitle, put its unchanged wording in `<p class="article-subtitle">` immediately after the article's `<h1>`, before the date and title image/figure. Omit the subtitle element when the source has none.
2. Keep `body.essay-page`, the skip link, navigation, `.reading-shell`, and shared `reading-room.css`. Keep `../reading-nav.js` as a small synchronous head script (no `defer` or `async`) for stable first-paint geometry and visible keyboard navigation. Keep deferred `newsletter.js` for near-viewport signup loading. Load deferred `essay-manifest.js` immediately before deferred `reading-room.js`. Preserve the newsletter embed and exactly one `text-link newsletter-fallback` subscription link inside the newsletter block, immediately after its invitation paragraph and before the iframe. Keep back links, Random pick, and footnote markup. The shared reader supplies progress, keyboard-accessible footnote previews/navigation, and quote copy/share actions. Keep analytics `async` so it cannot hold up rendering or reader controls.
3. Keep the preset scenery setup below. Article images belong in `../images/` and remain separate from the decorative background. Keep analytics scripts in the head, but place the hidden tracking image inside the body; images are not valid head content.
4. Add the essay to `index.html` inside `#article-list`, newest date first. Follow the existing `<li>` structure with a link and `.article-date`, and update the static `#thoughts-count-label`. JavaScript derives the year groups and counts from this list.
5. Add its URL to [`../sitemap.xml`](../sitemap.xml) and [`../llms.txt`](../llms.txt). From the repository root run `node scripts/sync-essay-manifest.mjs`. This generates `essay-manifest.js` from the archive—the single shared fallback for random picks if the archive request fails. Do not edit the generated list or add fallback arrays to either reader script. Run `node scripts/sync-essay-manifest.mjs --check` before publishing to catch drift.
6. Give each article image its verified intrinsic `width` and `height` to reserve space before download. Preserve source artwork/captions and descriptive alt text. Prefer optimized WebP and retain the original asset. Keep the first/hero image eager; below-the-fold images should use `loading="lazy"` and `decoding="async"`. Preserve responsive `srcset`/`sizes` when present and update every candidate when replacing an image.

## Article videos

Short demos can be hosted directly in `../videos/`, as in `googlefluid.html`. Use a browser-compatible MP4 with playback metadata at the start of the file, a local poster image, and native `<video controls playsinline preload="none">`. Set verified intrinsic dimensions and responsive width, give the player a descriptive accessible label, and provide a direct video link below it. Preserve the source demo; do not autoplay it. Check playback, pause, seeking, mobile layout, the direct link, and production byte-range responses. Confirm that the video is not requested before the reader starts it.

## Shared navigation

The shared header progressively enhances its navigation: without `reading-nav.js`, links wrap in an in-flow header so enlarged text never clips. The synchronous head script installs a document-level keyboard handler and adds `reading-nav-enhanced` before the body is parsed. This avoids moving an already-painted reading panel. Do not defer this tiny bootstrap or add an early enhancement flag separately from its handler; a blocked script must retain the accessible CSS fallback. Keep the shared CSS and script cache versions synchronized across all reading pages and the Gratitude renderer when changing this behavior. Test delayed and blocked script requests, JavaScript disabled, and enlarged-text keyboard navigation together.

Use `h2` for primary sections beneath the essay's `h1`, then `h3` only for subsections. Do not skip heading levels to obtain a smaller font. Existing `.article-section-heading--compact` and `.article-section-heading--body` classes preserve approved body-face section styles on semantic `h2` elements.

## Third-party embeds

Every newsletter block keeps exactly one `<a class="text-link newsletter-fallback">` immediately after the invitation paragraph and before the iframe. Preserve its `https://williswee.substack.com/subscribe` destination, label, and `target="_blank" rel="noopener noreferrer"`. This direct subscription action stays visible while the optional inline form loads or recovers.

Use `data-newsletter-src="https://williswee.substack.com/embed"` for the iframe, **not an eager `src`** and without `transparent=1&light=1`. Keep its initial `loading="lazy"`, `aria-hidden="true" tabindex="-1"`, and descriptive title. Shared `newsletter.js` observes the newsletter container, then assigns the iframe source within 240px of the viewport and switches native loading to `eager` so the two lazy-loading mechanisms do not delay each other. Browsers without IntersectionObserver begin loading immediately. The pending state stays compact; the hidden iframe does not reserve an empty form-sized area. Only a shown iframe uses the shared 460px desktop, 560px mobile, or 620px narrow-mobile height.

The loader keeps an empty same-origin document, a frame error, or a 12-second timeout in a compact recovery state with **Reload form** and the direct subscription link. A cross-origin navigation load cannot prove that the provider rendered a working form, so the visible help also explains how to reload or subscribe above when the form is blank. **Hide form / Show form** lets readers collapse or reveal the loaded iframe without clearing its input; **Reload form** explicitly resets the frame. Do not replace this with an assumed ready signal or an unverified provider message.

Preserve the head's `<noscript><style>iframe[data-newsletter-src] { display: none; }</style></noscript>`. Without JavaScript the unused frame stays hidden and the direct link remains available. The plain embed uses publication colors; the old `transparent=1&light=1` combination rendered white text on white. Host CSS cannot repair a cross-origin button: test the **enabled** Subscribe label's contrast after entering a test email, without submitting. Publication-wide Substack color changes require separate approval. Check the blocked/slow-provider state, retry, and show/hide controls as well as the successful form.

For data visualizations, keep a readable, semantic local data view so the information remains available without scripts or the provider. [`carbonneutral.html`](carbonneutral.html) uses the exact eleven year/value pairs and CO2e definition verified against its original Flourish chart, with the original interactive embed retained in an optional disclosure and lazy-loaded. If that source chart changes, update its local data and bar values together and verify them against the source; do not invent or approximate the numbers.

## Use the ten preset backgrounds

Every new essay must use [`essay-landscape.js`](essay-landscape.js). Its `scenes` array is the authoritative list of the ten existing WebP images in [`../images/reading-landscapes/`](../images/reading-landscapes/). Do not generate a new decorative image for each essay or hard-code a particular background into its CSS or HTML.

Keep this markup before `.reading-shell`, with the synchronous script immediately after the decorative container:

```html
<div class="reading-landscape" aria-hidden="true">
    <noscript><img src="../images/reading-landscapes/01-misty-ridges.webp" alt="" width="1024" height="1536" decoding="async"></noscript>
</div>
<script src="essay-landscape.js?v=1.0"></script>
```

Do not add `async` or `defer` to this script. It chooses and inserts one scene during page parsing, so only the selected image downloads. Each page load chooses randomly, avoiding the previous scene in the same browser session when session storage is available. The scene stays still throughout reading. Without JavaScript, the first preset is the fallback; without session storage, random selection still works but may repeat.

The shared CSS displays subdued scenery in the left column on desktop and a shallow banner above the essay on mobile. Keep meaningful article images, such as a source post's hero image, inside the article with their own captions and descriptive alt text. They are not replaced by the decorative presets.

## Preview locally

From the repository root, start the server if it is not already running:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://localhost:4173/thoughts/{slug}.html`. Reload a few times to sample the presets and confirm the scene does not change while scrolling. Check desktop and mobile layouts, image loading and captions, archive date order/count, newsletter visibility, back links, Random pick, and any footnotes or quote actions used by the essay. A local preview does not publish the changes.

The shared reading bar measures only the article, including its footnotes, and reaches 100% when the final content has been read; the newsletter and footer do not extend it. Copy quote and Share use the article's origin/path without query parameters or an unrelated current fragment. Test a quote after visiting a footnote to ensure the copied/shared destination does not send readers to that old footnote. Local previews should retain their local origin and port. Run `node --test scripts/tests/*.test.mjs` and `node scripts/sync-essay-manifest.mjs --check` before publishing shared reader changes.
