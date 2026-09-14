# Essay authoring

Use [`freedom.html`](freedom.html) as the current WIP layout reference when adding an essay. It is the redesigned prototype; older essays such as `kinder.html` still use the previous layout and are no longer the template for new work. Adding an essay does not require converting the existing archive.

## Add an essay

1. Copy `freedom.html` to `{slug}.html`. Update the document title, meta description, visible heading, publication date, subtitle, and complete article content. Preserve the source essay's wording, links, images, and captions; remove copied Freedom-specific content. Put `<p class="article-subtitle">` after the title image/figure, as in the reference.
2. Keep `body.essay-page`, the navigation, `.reading-shell`, and the shared `reading-room.css` and deferred `reading-room.js` references. Preserve the newsletter embed and direct subscription link, back links, Random pick button, and any applicable footnote markup. The shared script supplies reading progress, footnote previews, and quote copy/share actions.
3. Keep the preset scenery setup below. Article images belong in `../images/` and remain separate from the decorative background.
4. Add the essay to `index.html` inside `#article-list`, newest date first. Follow the existing `<li>` structure with a link and `.article-date`, and update the static `#thoughts-count-label`. JavaScript derives the year groups and counts from this list.
5. Add its URL to [`../sitemap.xml`](../sitemap.xml) and [`../llms.txt`](../llms.txt). Also add its filename to the `essays` fallback list in `reading-room.js` so Random pick includes it when the archive fetch fails. Normally the picker reads the archive automatically.

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
