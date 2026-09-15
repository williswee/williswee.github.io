# Essay authoring

Use [`freedom.html`](freedom.html) as the layout reference when adding an essay. All essays share the approved reading template and the ten-preset background picker. Preserve the pixel-art identity and the complete original article content.

## Add an essay

1. Copy `freedom.html` to `{slug}.html`. Update the document title, meta description, visible heading, publication date, subtitle, and complete article content. Preserve the source essay's wording, links, images, and captions; remove copied Freedom-specific content. Omit Substack's in-article subscription buttons, such as **Subscribe now**; use the site's shared newsletter embed and footer subscription link. Put `<p class="article-subtitle">` after the title image/figure, as in the reference.
2. Keep `body.essay-page`, the skip link, navigation, `.reading-shell`, and shared `reading-room.css`. Load deferred `essay-manifest.js` immediately before deferred `reading-room.js`. Preserve the newsletter embed and direct subscription link, back links, Random pick button, and footnote markup. The shared reader supplies progress, keyboard-accessible footnote previews/navigation, and quote copy/share actions. Keep analytics `async` so it cannot hold up rendering or reader controls.
3. Keep the preset scenery setup below. Article images belong in `../images/` and remain separate from the decorative background.
4. Add the essay to `index.html` inside `#article-list`, newest date first. Follow the existing `<li>` structure with a link and `.article-date`, and update the static `#thoughts-count-label`. JavaScript derives the year groups and counts from this list.
5. Add its URL to [`../sitemap.xml`](../sitemap.xml) and [`../llms.txt`](../llms.txt). From the repository root run `node scripts/sync-essay-manifest.mjs`. This generates `essay-manifest.js` from the archive—the single shared fallback for random picks if the archive request fails. Do not edit the generated list or add fallback arrays to either reader script. Run `node scripts/sync-essay-manifest.mjs --check` before publishing to catch drift.
6. Give each article image its verified intrinsic `width` and `height` to reserve space before download. Preserve source artwork/captions and descriptive alt text. Prefer optimized WebP and retain the original asset. Keep the first/hero image eager; below-the-fold images should use `loading="lazy"` and `decoding="async"`. Preserve responsive `srcset`/`sizes` when present and update every candidate when replacing an image.

## Third-party embeds

Use `https://williswee.substack.com/embed` for the newsletter iframe, without `transparent=1&light=1`. The plain embed uses the publication’s coordinated background and text colors; the old query combination rendered white text on white. Keep the direct subscription link as a fallback, `loading="lazy"`, a descriptive iframe title, and the shared responsive iframe sizing. Test the actual provider contents at desktop and narrow mobile widths without submitting a subscription; host-page CSS cannot repair styles inside a cross-origin iframe.

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
