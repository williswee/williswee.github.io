Hello, this is just a personal site.
https://williswee.com/

## How to add and publish a gratitude note

1. Format the draft to match the latest entry in [`gratitude-notes.md`](gratitude-notes.md), using the next sequential note number and the Singapore date.
2. Edit the draft for clarity and return it for review.
3. Wait until the note is explicitly marked **final**. Do not update the site before approval.
4. After approval, append the final note to [`gratitude-notes.md`](gratitude-notes.md).
5. Run `node scripts/render-gratitude.mjs` to regenerate `gratitude.html` and synchronize the Gratitude entry in `sitemap.xml` with the newest note date. The renderer validates unique positive safe-integer note numbers, dates, and the matching sitemap entry before writing either output; it leaves other sitemap entries untouched. A duplicate number is an error: correct the new draft's number, never renumber published notes.
6. Run `node scripts/render-gratitude.mjs --check` to confirm both generated outputs match the approved source and current template without writing anything. Review the page locally and verify the note's shareable `#note-{number}` link, its date, the updated note count, and the Gratitude sitemap `lastmod`. Check desktop and mobile, Random pick → Another pick → Top, and focus mode: gold corners mark the selected note while all notes and introductory text remain at full contrast. Only decorative artwork fades. Escape clears the selection and note hash without moving the viewport. Top clears focus and returns to the beginning. From a selected note, Tab through its links to the nearby floating controls; other notes must remain keyboard-accessible.
7. Commit and push the changes, then confirm the note is live at [williswee.com/gratitude.html](https://williswee.com/gratitude.html).

### Gratitude page design and generation

`gratitude-notes.md` remains the source of truth for note content. `scripts/render-gratitude.mjs` owns the entire generated `gratitude.html` page, including navigation, controls, count, and footer. Make layout changes in the generator and regenerate; do not hand-edit the generated page. The renderer preserves the Markdown's existing oldest-first order and displays notes newest-first. Keep note numbers and `note-{number}` IDs stable so published links continue working.

The renderer also maintains the Gratitude URL's `lastmod` in `sitemap.xml` from the latest date anywhere in the note source, so appending an older backfilled note does not roll that date backward. Include both generated files in the publishing review; adding a note does not require manually editing sitemap dates. Its read-only `--check` mode exits nonzero when the page or sitemap is stale; it never publishes a draft or repairs output automatically. Preserve the approval step before regeneration.

The page uses `thoughts/reading-room.css` for the shared reading-world shell, `reading-nav.js` to keep keyboard-focused header links visible with enlarged text, `gratitude-game.css` for the journal layout and selection markers, and `gratitude.js` for random selection, accessible focus, permalinks, and floating controls. Focus keeps the selected note on the midnight reading surface with amber corner markers; Books uses the same treatment. Reduced-motion preferences disable animated scrolling, decorative fading, and dice feedback. All note content and native heading links remain available without JavaScript; Random pick stays hidden until its handler is ready.

Keep the dedicated `images/game-world/gratitude-evening-journal-v1.webp` illustration when adding notes—no new background is needed per note, and this page does not use the ten-preset essay picker. Generation context is recorded in `.impeccable/assets/gratitude-evening-journal-v1.prompt.json` and the image-adjacent `.webp.json` sidecar. Preview [Gratitude locally](http://localhost:4173/gratitude.html) before publishing.

## How to publish a new article

**Substack imports:** Exclude Substack's in-article subscription buttons, such as **Subscribe now**. Use the site's shared newsletter block with its immediate subscription link and deferred embed instead.

The current WIP essay template is [`thoughts/freedom.html`](thoughts/freedom.html). Follow the [essay authoring guide](thoughts/README.md) for the shared layout and background setup.

The newsletter's direct subscription link belongs inside its block, immediately after the invitation and before the deferred iframe. It stays available while the form loads automatically near the viewport. Pending and failed forms use compact feedback, with a reload action and a show/hide control for loaded forms; only a shown form reserves its full height. A cross-origin frame load is not proof of a working signup form. Follow the [embed guidance](thoughts/README.md#third-party-embeds), and verify blocked/slow-provider recovery and the no-JavaScript link when changing this shared behavior.

1. Copy `thoughts/freedom.html` to `thoughts/{slug}.html` (single word slug, e.g. `mission`). Keep its shared reading layout, scripts, navigation, and newsletter/footer markup.
2. Update the title, meta description, heading, date, body, and article images/captions. When the source has a subtitle, put its unchanged wording in `<p class="article-subtitle">` immediately after the article's `<h1>`, before the date and title image/figure. Omit this element for essays without a subtitle. Remove any copied Freedom-specific content that does not belong to the new essay.
3. **Keep the automatic preset background picker.** Every new essay uses `thoughts/essay-landscape.js` to select one of the ten existing images in [`images/reading-landscapes/`](images/reading-landscapes/). Do not generate a new decorative background or assign one manually per essay. The scene is selected once per page load and stays still while reading. Article/hero images from the source post are separate and should still be preserved.
4. Add the new `<li>` to `thoughts/index.html` in date order, newest first, and update the static essay count. The archive builds its year groupings automatically.
5. Add the URL to `sitemap.xml` and `llms.txt`. Run `node scripts/sync-essay-manifest.mjs` to generate the shared random-pick manifest from the archive. Do not maintain a separate list inside a reader script.
6. Give every article image its actual intrinsic `width` and `height`, descriptive alt text, and `decoding="async"`. Use optimized WebP assets where available, retaining originals; keep the first/hero image eager and mark below-the-fold images `loading="lazy"`. Keep responsive `srcset`/`sizes` when copying the template.
7. Run `node scripts/sync-essay-manifest.mjs --check`, then preview locally. Check desktop/mobile and text zoom, footnote keyboard navigation, quote copy (including denied clipboard access and selection after visiting a footnote), Random pick with the archive request blocked, background, links, and image layout before publishing. Copy/Share should use the clean article URL, not an unrelated footnote or preview query; the reading bar should finish at the end of the article, excluding the newsletter/footer.

**Prompt**

Follow the "How to publish a new article" section in README.md and the essay authoring guide in thoughts/README.md.
- add this article into `thoughts` directory
- on https://williswee.com/thoughts/index.html, rank the article by date (latest post on top)
- use `thoughts/freedom.html` as the layout reference and preserve its automatic ten-preset background picker (`essay-landscape.js`)
- do not create a new decorative background; the article's own images are separate from the preset scenery
- Extract the title, subtitle, date, and body from the live Substack post. Do not ask me for them. The subtitle is the Substack post's subtitle/deck. Place it as `<p class="article-subtitle">` immediately after the article's `<h1>`, before the date and title image/figure. Preserve its wording; omit the element when the source has no subtitle.
- Copy the article content from the Substack post, including images and captions, but omit Substack's in-article subscription buttons (for example, **Subscribe now**). Save any images in the `images` directory and reference them properly in the article. Center image captions and preserve the original wording. Keep the site's shared newsletter block, including its direct subscription link immediately after the invitation and before the deferred iframe.

Substack URL:
Slug: (single word slug, e.g. `mission`)

## Local preview

Run `node --test scripts/tests/*.test.mjs` for the dependency-free regression checks before publishing changes to navigation, reader interactions, focus mode, newsletter loading, or the Gratitude renderer. Generator tests use temporary fixtures, not the real note source or generated page. Also run `node scripts/sync-essay-manifest.mjs --check` and `node scripts/render-gratitude.mjs --check` to catch stale publishing outputs.

From the repository root, run:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open the [homepage](http://localhost:4173/index.html), [Thoughts archive](http://localhost:4173/thoughts/index.html), or [sample essay](http://localhost:4173/thoughts/freedom.html). Refresh the essay to try another preset background. Current design guidance lives in [`DESIGN.md`](DESIGN.md), with page-specific contracts in `.impeccable/surfaces/`.

## Editing the User Guide

The redesigned [Guide](guide.html) uses `thoughts/reading-room.css` for the shared navigation and reading shell, with `guide-game.css` and `guide-game.js` for its own layout and interactions. Its dedicated illustration is `images/game-world/guide-field-manual-v1.webp`, composed for the visible left column; it does not use the homepage artwork or randomized essay landscapes.

Keep the complete copy and nested alphabetic lists. Existing section/rule IDs are public deep links: preserve them when editing a heading or bold rule label (set the existing ID explicitly on its `<h2>` or `<li>` if the label changes). When adding a section, update the “In this guide” links as well. Preview [Guide locally](http://localhost:4173/guide.html), check mobile layout, and test both section and rule copy links.

---

## Editing Work

The redesigned [Work page](work.html) shares `thoughts/reading-room.css` with Guide and Thoughts. Its own presentation and milestone navigation live in `work-game.css` and `work-game.js`. Use the dedicated `images/game-world/work-coastal-workshop-v1.webp` illustration, composed for the visible left column; Work does not use the randomized essay backgrounds.

Keep the full stories, dates, project preview links, and existing milestone IDs (`now`, `tech-in-asia`, `tuition-center`, `trading-cards`, and `grasshoppers`). To add a milestone, give its `.timeline-item` section a stable unique ID and labeled heading, then add a matching `.project-nav-link` in the same chronological order. All stories remain readable without JavaScript. Preview [Work locally](http://localhost:4173/work.html) and check desktop navigation, the mobile Milestones menu, direct hash links, and project images before publishing.

---

## How to add a book

The Books page uses the shared reading-world styles in `thoughts/reading-room.css`, page-specific layout in `books-game.css`, and filtering, random picks, spotlight, and permalink behavior in `books-game.js`. The selected recommendation stays on the midnight reading surface with the same amber corner markers used by Gratitude. Its dedicated reading-nook background is `images/game-world/books-reading-nook-v1.webp`; provenance is recorded in `.impeccable/assets/books-reading-nook-v1.prompt.json`. Keep this page-specific illustration when adding books—individual recommendations do not need cover images or new backgrounds.

1. Open `books.html`
2. Inside `<div class="book-grid">`, add a new `<div class="book-card">` block (books are listed alphabetically by title)
3. Set the `data-category` attribute on the card to one of the valid categories (see below)
4. Fill in the four fields:
   - `<span class="book-tag">` — category label (title case, matches `data-category`)
   - `<h3>` — full book title
   - `<p class="book-author">` — author name in ALL CAPS, prefixed with `BY`
   - `<p class="book-review">` — 1–3 sentence personal take
5. Reorder the category filters (`<div class="filter-pills">`) so they appear from most to least books per category, keeping All first. Counts are calculated automatically by `books-game.js`; update the initial total in `#book-status` too, so the no-JavaScript view stays accurate.
6. Keep existing titles and IDs stable: book permalinks are generated from their titles. If correcting a published title, give that card an explicit `id` matching its old permalink before changing the heading. Do not reuse an existing ID.

**Valid categories:** `leadership` · `mindset` · `investing` · `life` · `science` · `career` · `parenting` · `design`

```html
<div class="book-card" data-category="mindset">
    <span class="book-tag">Mindset</span>
    <h3>Book Title Here</h3>
    <p class="book-author">BY AUTHOR NAME</p>
    <p class="book-review">Your personal take on the book.</p>
</div>
```

**Before publishing**

Preview [Books locally](http://localhost:4173/books.html) on desktop and mobile. Check the new entry's category/count, the mobile Categories menu, Random pick and Another pick within a selected category, and a direct book hash link (for example, `books.html#clarity-connection`). Gold corners mark the selected book while all visible books and introductory text remain at full contrast; only the decorative reading-nook background fades. Escape clears the spotlight and book hash without changing the scroll position or category. Top returns to the beginning; Top and category changes also clear the previous spotlight/hash and restore the artwork. The dock follows the selected book in keyboard order, without trapping access to other books. All recommendations remain readable without JavaScript; category filters and Random pick stay hidden until their handlers are ready. Reduced-motion settings disable animated scrolling, decorative fading, and dice feedback.

**Prompt**

Follow the instruction here [README.md] under "How to add a book"
- add the book into `books.html` in alphabetical order by title
- set the category and reorder the category filters from most to least books, keeping All first
- preserve existing book permalinks and update the initial total in `#book-status`

Title:
Author:
Category:
Review:
