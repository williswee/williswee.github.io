Hello, this is just a personal site.
https://williswee.com/

## How to publish a new article

1. Copy `thoughts/goodbye.html` as a template
2. Rename to `thoughts/{slug}.html` (single word slug, e.g. `mission`)
3. Update: `<title>`, `<meta description>`, `<h1>`, date, and body content
4. Add a new `<li>` entry **at the top** of `thoughts/index.html`
5. Add the URL to `sitemap.xml` and `llms.txt`

**Prompt**

Follow the instruction here [README.md#L4-10]
- add this article into `thoughts` directory
- on https://williswee.com/thoughts/index.html, rank the article by date (latest post on top)

Title: 
Slug: (single word slug)
Date: (e.g. 2020 January 16)
Body:

---

## How to add a book

1. Open `books.html`
2. Inside `<div class="book-grid">`, add a new `<div class="book-card">` block (books are listed alphabetically by title)
3. Fill in the three fields:
   - `<h3>` — full book title
   - `<p class="book-author">` — author name in ALL CAPS, prefixed with `BY`
   - `<p class="book-review">` — 1–3 sentence personal take

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

Title:
Author:
Review: