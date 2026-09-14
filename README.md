Hello, this is just a personal site.
https://williswee.com/

## How to add and publish a gratitude note

1. Format the draft to match the latest entry in [`gratitude-notes.md`](gratitude-notes.md), using the next sequential note number and the Singapore date.
2. Edit the draft for clarity and return it for review.
3. Wait until the note is explicitly marked **final**. Do not update the site before approval.
4. After approval, append the final note to [`gratitude-notes.md`](gratitude-notes.md).
5. Run `node scripts/render-gratitude.mjs` to regenerate `gratitude.html`.
6. Review the page locally and verify the note's shareable `#note-{number}` link.
7. Commit and push the changes, then confirm the note is live at [williswee.com/gratitude.html](https://williswee.com/gratitude.html).

## How to publish a new article

The current WIP essay template is [`thoughts/freedom.html`](thoughts/freedom.html). Follow the [essay authoring guide](thoughts/README.md) for the shared layout and background setup.

1. Copy `thoughts/freedom.html` to `thoughts/{slug}.html` (single word slug, e.g. `mission`). Keep its shared reading layout, scripts, navigation, and newsletter/footer markup.
2. Update the title, meta description, heading, date, body, and article images/captions. The subtitle (`<p class="article-subtitle">`) goes right below the title image/figure. Remove any copied Freedom-specific content that does not belong to the new essay.
3. **Keep the automatic preset background picker.** Every new essay uses `thoughts/essay-landscape.js` to select one of the ten existing images in [`images/reading-landscapes/`](images/reading-landscapes/). Do not generate a new decorative background or assign one manually per essay. The scene is selected once per page load and stays still while reading. Article/hero images from the source post are separate and should still be preserved.
4. Add the new `<li>` to `thoughts/index.html` in date order, newest first, and update the static essay count. The archive builds its year groupings automatically.
5. Add the URL to `sitemap.xml` and `llms.txt`. Add the filename to the fallback essay list in `thoughts/reading-room.js` so Random pick also includes it when the archive cannot be fetched.
6. Preview locally and check the article, background, links, and mobile layout before publishing.

**Prompt**

Follow the "How to publish a new article" section in README.md and the essay authoring guide in thoughts/README.md.
- add this article into `thoughts` directory
- on https://williswee.com/thoughts/index.html, rank the article by date (latest post on top)
- use `thoughts/freedom.html` as the layout reference and preserve its automatic ten-preset background picker (`essay-landscape.js`)
- do not create a new decorative background; the article's own images are separate from the preset scenery
- Extract the title, subtitle, date, and body from the live Substack post. Do not ask me for them. The subtitle is the Substack post's subtitle/deck. Place it as `<p class="article-subtitle">` right after the title image/figure.
- Copy all content from the Substack post, including images and captions. Save any images in the `images` directory and reference them properly in the article. For image captions, centralize them. Do not change anything.

Substack URL:
Slug: (single word slug, e.g. `mission`)

## Local preview

From the repository root, run:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open the [homepage](http://localhost:4173/index.html), [Thoughts archive](http://localhost:4173/thoughts/index.html), or [sample essay](http://localhost:4173/thoughts/freedom.html). Refresh the essay to try another preset background. The current redesign lives on `codex/pixel-portfolio-wip-2026-09-02`.

---

## How to add a book

1. Open `books.html`
2. Inside `<div class="book-grid">`, add a new `<div class="book-card">` block (books are listed alphabetically by title)
3. Set the `data-category` attribute on the card to one of the valid categories (see below)
4. Fill in the four fields:
   - `<span class="book-tag">` — category label (title case, matches `data-category`)
   - `<h3>` — full book title
   - `<p class="book-author">` — author name in ALL CAPS, prefixed with `BY`
   - `<p class="book-review">` — 1–3 sentence personal take
5. Reorder the filter pills (`<div class="filter-pills">`) so they appear from most to least books per category

**Valid categories:** `leadership` · `mindset` · `investing` · `life` · `science` · `career` · `parenting` · `design`

```html
<div class="book-card" data-category="mindset">
    <span class="book-tag">Mindset</span>
    <h3>Book Title Here</h3>
    <p class="book-author">BY AUTHOR NAME</p>
    <p class="book-review">Your personal take on the book.</p>
</div>
```

**Template**

```html
<div class="book-card">
    <h3>Book Title Here</h3>
    <p class="book-author">BY AUTHOR NAME</p>
    <p class="book-review">Your review here.</p>
</div>
```

**Prompt**

Follow the instruction here [README.md] under "How to add a book"
- add the book into `books.html` in alphabetical order by title
- reorder the filter pills from most to least books per category

Title:
Author:
Review:
