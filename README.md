# Willis Wee

My personal site at [williswee.com](https://williswee.com/).

## Site demo

https://github.com/user-attachments/assets/e95f99ca-d9e3-4186-bd29-d399a3d51ed9

## How to add and publish a gratitude note

1. Before drafting or editing, run `git fetch origin` and bring the local `main` branch up to `origin/main` with a fast-forward merge. Preserve unrelated local work; never overwrite or discard it to synchronize the branch.
2. Format the draft to match the latest entry in [`gratitude-notes.md`](gratitude-notes.md), using the next sequential note number and the Singapore date.
3. Edit the draft for clarity, run it through the globally installed `/unslop` skill, and return the revised note for review. Preserve the writer's meaning and voice.
4. Wait until the note is explicitly marked **final**. Do not update the site before approval.
5. After approval, append the final note to [`gratitude-notes.md`](gratitude-notes.md).
6. Run `node scripts/render-gratitude.mjs` to regenerate `gratitude.html` and synchronize the Gratitude entry in `sitemap.xml` with the newest note date. The renderer validates unique positive safe-integer note numbers, dates, and the matching sitemap entry before writing either output. It leaves other sitemap entries untouched. If a number is duplicated, correct the new draft's number. Never renumber published notes.
7. Run `node scripts/render-gratitude.mjs --check` to confirm both generated outputs match the approved source and current template without writing anything. Review the page locally. Verify the note's shareable `#note-{number}` link, date, updated note count, and Gratitude sitemap `lastmod`. On desktop and mobile, try Random pick, then Another pick, then Top. Check focus mode too. Gold corners mark the selected note while neighboring notes, the introduction, and artwork fade. Scroll beyond the selected note to restore normal contrast, then return to it to restore focus. Scrolling alone does not change the selected note link. Escape clears the selection and note hash without moving the viewport. Top clears focus and returns to the beginning. From a selected note, Tab through its links to the nearby floating controls. Other notes must remain keyboard-accessible.
8. Treat GitHub's `origin/main` as the source of truth. Immediately before pushing, run `git fetch origin` again. If `origin/main` moved while the note was being prepared, rebase the gratitude commit onto the latest remote branch, preserve the current GitHub changes, regenerate the page from the updated generator, and repeat the checks above. Resolve any overlap by keeping the latest remote implementation while retaining the approved note content.
9. Push the gratitude commit only after it is based on the latest `origin/main`, then confirm the note is live at [williswee.com/gratitude.html](https://williswee.com/gratitude.html).

### Gratitude page design and generation

`gratitude-notes.md` is the source for note content. `scripts/render-gratitude.mjs` generates the entire `gratitude.html` page, including navigation, controls, count, and footer. Make layout changes in the generator and regenerate. Do not hand-edit the generated page. The renderer preserves the Markdown's existing oldest-first order and displays notes newest-first. Keep note numbers and `note-{number}` IDs stable so published links continue working.

The renderer sets the Gratitude URL's `lastmod` in `sitemap.xml` to the latest date in the note source. Adding an older backfilled note does not move that date backward. Include both generated files in the publishing review. Adding a note does not require manual sitemap date edits.

The read-only `--check` mode exits nonzero when the page or sitemap is stale. It never publishes a draft or repairs output automatically. Preserve the approval step before regeneration.

The page uses `thoughts/reading-room.css` for the shared reading layout and `reading-nav.js` to keep keyboard-focused header links visible with enlarged text. `gratitude-game.css` handles the journal layout and selection markers. `gratitude.js` handles random selection, accessible focus, permalinks, and floating controls. Focus keeps the selected note on the midnight reading area with amber corner markers. Books uses the same treatment. Reduced-motion preferences disable animated scrolling, fading, and dice feedback. All note content and native heading links remain available without JavaScript. Random pick stays hidden until its handler is ready.

Keep the dedicated `images/game-world/gratitude-evening-journal-v1.webp` illustration when adding notes. Notes do not need individual backgrounds, and this page does not use the ten-preset essay picker. Generation context is recorded in `.impeccable/assets/gratitude-evening-journal-v1.prompt.json` and the image-adjacent `.webp.json` sidecar. Preview [Gratitude locally](http://localhost:4173/gratitude.html) before publishing.

## How to publish a new article

For Substack imports, omit in-article subscription buttons such as "Subscribe now". Use the site's shared newsletter block with its immediate subscription link and deferred embed.

The current WIP essay template is [`thoughts/freedom.html`](thoughts/freedom.html). Follow the [essay authoring guide](thoughts/README.md) for the shared layout and background setup.

Place the newsletter's direct subscription link inside its block, immediately after the invitation and before the deferred iframe. The link stays available while the form loads automatically near the viewport.

Pending and failed forms show compact feedback with a reload action. Loaded forms have a show/hide control, and only a shown form reserves its full height. A cross-origin frame load does not prove that the signup form works. Follow the [embed guidance](thoughts/README.md#third-party-embeds). When changing this shared behavior, check recovery when the provider is blocked or slow, and verify the no-JavaScript link.

1. Copy `thoughts/freedom.html` to `thoughts/{slug}.html` (single word slug, e.g. `mission`). Keep its shared reading layout, scripts, navigation, coaching card, and newsletter/footer markup.
2. Update the title, meta description, canonical URL, matching Open Graph/Twitter title and description, `og:url`, heading, date, body, and article images/captions. Use the new essay's `https://williswee.com/thoughts/{slug}.html` address for both URL fields. When the source has a subtitle, put its unchanged wording in `<p class="article-subtitle">` immediately after the article's `<h1>`, before the date and title image/figure. Omit this element for essays without a subtitle. Remove any copied Freedom-specific content that does not belong to the new essay.
3. Keep the automatic preset background picker. Every new essay uses `thoughts/essay-landscape.js` to select one of the ten existing images in [`images/reading-landscapes/`](images/reading-landscapes/). Do not generate a new decorative background or assign one manually per essay. The scene is selected once per page load and stays still while reading. Preserve article/hero images from the source post as well.
4. Add the new `<li>` to `thoughts/index.html` in date order, newest first, and update the static essay count. The archive builds its year groupings automatically.
5. Add the URL to `sitemap.xml` and `llms.txt`. Sitemap URLs use the site's own host, `https://williswee.com/`; `www` only redirects there. Run `node scripts/sync-essay-manifest.mjs` to generate the shared random-pick manifest, actual essay titles/dates, and estimated reading times. Run it again after editing an essay's title, date, or body. Reading estimates use 220 words per minute, including captions and footnotes; videos take additional time. Do not maintain a separate list inside a reader script.
6. Give every article image its actual intrinsic `width` and `height`, descriptive alt text, and `decoding="async"`. Use optimized WebP assets where available, retaining originals; keep the first/hero image eager and mark below-the-fold images `loading="lazy"`. Keep responsive `srcset`/`sizes` when copying the template.
7. Run `node scripts/sync-essay-manifest.mjs --check`, then preview locally. Check desktop and mobile, text zoom, footnote keyboard navigation, and quote copy (including denied clipboard access and selection after visiting a footnote). Also check Random pick with the archive request blocked, the background, links, and image layout before publishing. Copy/Share should use the clean article URL, without an unrelated footnote or preview query. The reading bar should finish at the end of the article, excluding the newsletter/footer.

### Article import prompt

The Thoughts archive's **Find an essay** search matches titles and dates. Random pick uses the current results; Clear search and Escape restore the complete archive. Each essay offers its actual newer and older neighbors after the article. These controls enhance the static content, which remains complete without JavaScript.

Follow the "How to publish a new article" section in README.md and the essay authoring guide in thoughts/README.md.

- Add this article to the `thoughts` directory.
- Add it to https://williswee.com/thoughts/index.html in date order, newest first.
- Use `thoughts/freedom.html` as the layout reference and preserve its automatic ten-preset background picker (`essay-landscape.js`).
- Do not create a new decorative background. The article's own images are separate from the preset scenery.
- Extract the title, subtitle, date, and body from the live Substack post. Do not ask me for them. The subtitle is the Substack post's subtitle/deck. Place it as `<p class="article-subtitle">` immediately after the article's `<h1>`, before the date and title image/figure. Preserve its wording; omit the element when the source has no subtitle.
- Copy the article content from the Substack post, including images and captions, but omit Substack's in-article subscription buttons (for example, "Subscribe now"). Save any images in the `images` directory and reference them properly in the article. Center image captions and preserve the original wording. Keep the site's shared newsletter block, including its direct subscription link immediately after the invitation and before the deferred iframe.
- Keep the template's coaching card (`<aside class="coaching-cta">`) unchanged, after `</article>` and any optional Related reading block, before the newsletter block.

Substack URL:
Slug: (single word slug, e.g. `mission`)

## Adding a Play project

The Randomly fun projects row in the homepage Work section opens `/play`, served by `play.html` using GitHub Pages’ extensionless HTML routing. The old `/creative` and `/creative.html` addresses redirect to `/play`, preserving query parameters and project hashes. Keep `creative.html` as the compatibility redirect and point all new links to `/play`. This page holds the growing list of projects made for fun. Add a `<li>` inside `.creative-projects` with a stable ID, project name, short description, visual preview, destination, and action label. Use a native `<video controls playsinline preload="metadata">` with a poster when a demo exists; otherwise use an optimized project image with alt text, intrinsic dimensions, and responsive sources. Keep media outside the action link so playback controls work independently. Keep the embedded player’s fallback link for browsers without video support. Keep the native links usable without JavaScript. Links to X open in a new tab and say so for screen readers; the Willis game opens in the same tab.

Keep projects in newest-first order. Group the `h2` and `<time class="creative-project-date" datetime="YYYY-MM-DD">D Month YYYY</time>` in `.creative-project-heading`; the date shares the title baseline when space allows and wraps beneath it on narrower screens. Wrap the destination link in `.creative-project-actions`. Load the first project image eagerly; images farther down the list can remain lazy-loaded.

3D Floorplan (9 October 2026) opens `/3d-floorplan/` in the same tab. Its description links to the open-source Pascal Editor that inspired the experiment; its 30-second v2 walkthrough combines actual app captures and camera tours, with the original music. Use native video controls and a poster from the video. The demo ends with an idea entered; it does not show a generated redesign.

Chef Bob (6 October 2026) links to its open-source GitHub repository and Grok bot; its primary action opens the bot in a new tab with an accessible new-tab notice. Keep this entry as text and project links, without the rejected demo video.

Tiny Brain (5 October 2026) links to its GitHub repository and preserves the supplied explanation and friend feedback. Its entry uses text and project links; its demo is deferred until requested.

Chix Run (2 October 2026) opens `/chix-run/` in the same tab. Its short description is followed by Willis's first-person story about building for fun with a free game engine and Codex, starting with a bean and changing it to a chicken. Its 15-second demo has native game audio, no added captions, and native playback controls; playback begins only when the visitor chooses it. Portrait demos use `.creative-project-media--portrait` to keep the entire playfield visible at up to 400px wide. Editable game sources, the pinned Bun dependencies, and rebuild instructions are in [`chix-run/README.md`](chix-run/README.md). The website itself still publishes static files with no build step.

Find the real Willis keeps its short description, followed by the story about playing 2 Truths and a Lie with new Tech in Asia teammates and building the game for reminiscence's sake. Separate description and story paragraphs use a scoped 12px gap.

Per the user’s preference, omit visible video captions, "Video description" disclosures, and separate "Open video" links from all project entries. Retain the native players, their accessible labels and primary project actions. Keep visible link wording at the start of any custom accessible name, then add project or new-tab context.

The page inherits `thoughts/reading-room.css` and `reading-nav.js`, with project-list styles in `creative-game.css`. Its dedicated seaside pixel-art workshop illustration is `images/game-world/creative-workshop-v1.webp`, with provenance in `.impeccable/assets/creative-workshop-v1.prompt.json`: Willis is seen from behind at a game-building desk with a small thought cloud. The Work page keeps its own workshop illustration. `creative-game.js` adds the optional "Surprise me" picker, which visits every project before repeating, focuses its heading, and updates its hash. A single "Another surprise" button moves beside the selected project's action. Escape clears the selection; if that button has focus, focus returns to the project heading before the button hides. The gold selection corners stay visible under reduced motion; the die turn and smooth scrolling stop. Keep every entry's ID stable and retain its `h2` and `.creative-project-actions` so new projects join the picker automatically. Update the Play entry's `lastmod` in `sitemap.xml` when changing the list. Preview the homepage Work row and Play page at desktop and phone widths.

## Homepage coaching section

The homepage menu follows six native section links: Start, Work, Coaching, Notes, Life, and Connect. Coaching points to `#coaching`, between Work and Notes, and uses the same active-section, keyboard, and browser-history behavior as its neighbors. Its short introduction reuses approved copy and pairs it with `images/game-world/coaching-right-overlook-v1.webp` (1536×1024), generated with built-in ImageGen. The Coaching panel sits on the left, beside two peers conversing on the right with comfortable personal space, a notebook, and a lantern. Other sections retain their existing alignments. Generation provenance is in `.impeccable/assets/coaching-right-overlook-v1.prompt.json`. Desktop Coaching shares the other chapters' `100svh` minimum and full-cover artwork, cropped at `74% center`; above 1100px, its panel is `min(590px, 45vw)` wide to expose the complete group. Portrait tablets from 761–1100px stack `50svh` of artwork above the panel, keeping the section at least `100svh` and allowing it to grow for content. Phones keep the artwork above the panel with a `100% center` crop. “Explore coaching” opens the detailed, canonical `coaching.html` page. Inner-page headers retain normal page destinations, including Coaching; no redirect or duplicate enquiry form is needed.

The Coaching section owns the founder introduction, three-question native FAQ, full-page link and Intro booking row. Connect keeps the general social destinations and “Come say hello lah.” The word “lah” is a button explained by `home-word-help.js` on hover, focus or tap; Escape, outside pointer interaction and leaving the control dismiss it. The definition has a no-script text fallback. Keep this small enhancement independent of scene navigation.

## Author and article metadata

Run `node scripts/sync-structured-data.mjs` after changing an essay’s heading, description, canonical, publication date, or article image, or after adding an essay to the Thoughts archive. It maintains static JSON-LD for the homepage, coaching page, and all archived essays, with no runtime dependency or build step. Run `node scripts/sync-structured-data.mjs --check` before publishing.

The homepage uses `ProfilePage` with Willis as its `Person`; coaching uses `WebPage`; the 43 archived essays use `BlogPosting`. Author identity links come from the homepage’s existing public profiles. Publication dates come from each essay’s visible date, and modified dates are omitted. Article images are included only when the article contains a meaningful image with descriptive alt text; the shared avatar and decorative scenery are excluded. Other pages, games, and the generated Gratitude page are outside this generator’s scope. It adds no reviews, ratings, FAQs, or offers.

Keep the small linked author byline separate from `.article-date` so the existing date and reading-time parsers remain accurate. Selected essays can include a static `.related-reading` navigation block after the article and before the coaching card. The reader inserts its chronological “More thoughts” links after that block. The founder reading groups stay outside `#article-list` so archive counts, search, and random picks retain the complete essay list.

## Local preview

Run `node --test scripts/tests/*.test.mjs` for the dependency-free regression checks before publishing changes to navigation, reader interactions, focus mode, newsletter loading, or the Gratitude renderer. Generator tests use temporary fixtures instead of the real note source or generated page. Also run `node scripts/sync-essay-manifest.mjs --check` and `node scripts/render-gratitude.mjs --check` to catch stale publishing outputs.

From the repository root, run:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open the [homepage](http://localhost:4173/index.html), [Thoughts archive](http://localhost:4173/thoughts/index.html), or [sample essay](http://localhost:4173/thoughts/freedom.html). Refresh the essay to try another preset background. [`DESIGN.md`](DESIGN.md) contains the current design guidance. Page-specific requirements are in `.impeccable/surfaces/`.

## Editing the user guide

The [Guide](guide.html) uses `thoughts/reading-room.css` for the shared navigation and reading layout. `guide-game.css` and `guide-game.js` handle its layout and interactions. Its dedicated illustration, `images/game-world/guide-field-manual-v1.webp`, is composed for the visible left column. The page does not use the homepage artwork or randomized essay landscapes.

Keep the complete copy and nested alphabetic lists. Existing section/rule IDs are public deep links. Preserve them when editing a heading or bold rule label (set the existing ID explicitly on its `<h2>` or `<li>` if the label changes). When adding a section, update the "In this guide" links as well. Preview [Guide locally](http://localhost:4173/guide.html), check mobile layout, and test both section and rule copy links.

## Not-found page

GitHub Pages serves `404.html` for every missing address, at any depth. Use root-relative local URLs in it (`/thoughts/reading-room.css`, not `thoughts/reading-room.css`). It uses the shared forest-path scene, shows the missing address when JavaScript runs, and offers the same three ways back as the Work page. It carries `noindex` and stays out of the sitemap. `scripts/tests/document-structure.test.mjs` enforces both.

## Editing coaching

[Coaching](coaching.html) is where every essay's coaching card leads. It shares `thoughts/reading-room.css` with the other reading pages, with its own layout in `coaching-game.css`. Its desktop backdrop uses `images/game-world/coaching-lantern-bench-portrait-v1.webp` (768×2048), a continuous vertical extension of the bench scene made with built-in ImageGen. It fills the shared fixed landscape column with `object-fit: cover`; generation provenance is in `.impeccable/assets/coaching-lantern-bench-portrait-v1.prompt.json`. Mobile and link previews retain the original wide `images/game-world/coaching-lantern-bench-v1.webp` (1774×887), whose provenance is in `images/game-world/coaching-variants-2026-10-08/prompts.json`. The mobile art band preserves the peers and lantern. Coaching appears immediately after Work in the header navigation, with the same link style and active-page treatment as the other destinations.

"Send me a note" is the primary invitation in the hero and desktop rail. It leads to the inline form after the testimonials. The secondary "Book a session" links in the hero and close open `https://intro.co/williswee` in a new tab. The coaching card (`aside.coaching-cta`, a dialogue box with a "Willis" nameplate) sits between `</article>` and the newsletter block in every essay, and at the end of the Guide. All copies share the same wording, so change them together.

The note form posts name, email, and message to `https://formspree.io/f/mdekydke`. The verified recipient lives in Formspree's notification settings, not in the website source. Keep the visitor field named `email` so notifications use it as Reply-To. The hidden `_gotcha` field is Formspree's honeypot. No API key or build step is needed. `coaching-contact.js` progressively enhances the native HTML POST with inline feedback, duplicate-submit protection, and draft retention on errors; JavaScript unavailable means Formspree handles the response. If a challenge or provider error prevents inline submission, the visitor can explicitly continue with Formspree. Never automatically resubmit an uncertain request.

The reply expectation is within 3 business days. Keep submitted values out of URLs, browser storage, analytics, logs, and confirmation text. After changing the endpoint or account settings, verify a clearly labeled test reaches the configured inbox and replying addresses the sender; local mocked tests cannot confirm delivery or account-side CAPTCHA settings.

### Coaching analytics

The site uses [Umami Cloud](https://cloud.umami.is/) for pageviews and coaching funnel events. Its **public Website ID** is in [`site-analytics.js`](site-analytics.js); this is not an API key. The tracker runs on `williswee.com` and `www.williswee.com`, not local previews, and excludes URL search and hash values. Keep the loader in the head of new pages; `scripts/render-gratitude.mjs` owns the generated Gratitude page's copy.

Umami records pageviews automatically. The site sends these named events without field values or event properties:

| Event | Meaning |
| --- | --- |
| `coaching_cta_click` | A link to Coaching was clicked; the event's page path identifies the source article or page. |
| `coaching_note_link_click` | A link on Coaching jumped to the note form. |
| `coaching_note_started` | The visitor first entered non-whitespace text in the message field on this page load. |
| `coaching_note_send_click` | The Send note button was clicked, even if validation prevents submission. |
| `coaching_note_sent` | The enhanced form received an explicit success response from Formspree. |
| `coaching_note_provider_click` | The visitor chose the Formspree fallback. This does not confirm delivery. |
| `coaching_booking_click` | A link to book on Intro was clicked. This does not confirm a booking. |

In Umami, compare **unique visitors** who triggered `coaching_cta_click` on an article path with unique visitors to that article in the same date range for an article-to-Coaching click-through rate. To see progression, create a Funnel with `coaching_cta_click` → viewed `/coaching.html` → `coaching_note_started` → `coaching_note_send_click` → `coaching_note_sent`. Filter the first event by article path when comparing individual essays. These are named actions, not a visual map of every click. The last step covers only confirmed inline submissions; native or fallback Formspree submissions cannot be confirmed from this site. Collection starts after the updated site is published. The existing Inflect tag measures bot traffic separately.

Keep actual enquiries and follow-up stages in Formspree or a private lead tracker, never in site analytics or this public repository. [Formspree's free plan](https://help.formspree.io/articles/account-management/account-limits) retains submission history for 30 days; its [automatic Google Sheets plugin](https://help.formspree.io/articles/plugins/use-google-sheets-to-send-your-submissions-to-a-spreadsheet) is a paid-plan feature.

The coaching topics are numbered with pixel tiles (plain digits in `.coaching-topic-mark`). Renumber them if you add or remove one. On desktop, the left rail (`.coaching-rail`) links each section's `h2` and offers a note shortcut. Add any new section to it. `coaching-game.js` adjusts the portrait crop around the rail while the image continues to cover the full landscape column; keep those calculations aligned with the portrait artwork.

To add a testimonial, copy an `<li>` inside `.coaching-quotes`. Replace the nameplate link in `<figcaption>` (the person's name and a source URL) and the curly-quoted text in `<blockquote>`. Use only real, attributable quotes. The last testimonial shows the "continue" arrow pointing to the note invitation. `coaching-game.js` runs its four-second animation when the cue is visible. The closing lantern welcomes the reader once and stays lit; reduced motion leaves it steady.

`scripts/tests/coaching.test.mjs` checks the card's placement and nameplate, note and booking links, form markup, rail targets, and topic numbering. It also checks that every testimonial names a linked source and every local link on the page resolves. `scripts/tests/coaching-contact.test.mjs` exercises submission states with mocked responses. Preview [Coaching locally](http://localhost:4173/coaching.html) on desktop and mobile before publishing.

## Editing work

The [Work page](work.html) shares `thoughts/reading-room.css` with Guide and Thoughts. `work-game.css` and `work-game.js` handle its layout and milestone navigation. Use the dedicated `images/game-world/work-coastal-workshop-v1.webp` illustration, composed for the visible left column. Work does not use the randomized essay backgrounds.

Keep the full stories, dates, project preview links, and existing milestone IDs (`now`, `tech-in-asia`, `tuition-center`, `trading-cards`, and `grasshoppers`). To add a milestone, give its `.timeline-item` section a stable unique ID and labeled heading, then add a matching `.project-nav-link` in the same chronological order. All stories remain readable without JavaScript. Preview [Work locally](http://localhost:4173/work.html) and check desktop navigation, the mobile Milestones menu, direct hash links, and project images before publishing.

## How to add a book

The Books page uses `thoughts/reading-room.css` for shared reading styles and `books-game.css` for its layout. `books-game.js` handles filtering, random picks, spotlight, and permalinks. The selected recommendation stays on the midnight reading area with the same amber corner markers used by Gratitude.

Its dedicated reading-nook background is `images/game-world/books-reading-nook-v1.webp`. Provenance is recorded in `.impeccable/assets/books-reading-nook-v1.prompt.json`. Keep this illustration when adding books. Individual recommendations do not need cover images or new backgrounds.

1. Open `books.html`.
2. Inside `<div class="book-grid">`, add a new `<div class="book-card">` block in alphabetical order by title.
3. Set the card's `data-category` attribute to one of the valid categories below.
4. Fill in the four fields:
   - `<span class="book-tag">` contains the category label in title case, matching `data-category`.
   - `<h3>` contains the full book title.
   - `<p class="book-author">` contains the author name in ALL CAPS, prefixed with `BY`.
   - `<p class="book-review">` contains a personal take of 1–3 sentences.
5. Reorder the category filters (`<div class="filter-pills">`) so they appear from most to least books per category, keeping All first. `books-game.js` calculates counts automatically. Update the initial total in `#book-status` too, so the no-JavaScript view stays accurate.
6. Keep existing titles and IDs stable. Book permalinks are generated from their titles. If correcting a published title, give that card an explicit `id` matching its old permalink before changing the heading. Do not reuse an existing ID.

Valid categories are `leadership`, `mindset`, `investing`, `life`, `science`, `career`, `parenting`, and `design`.

```html
<div class="book-card" data-category="mindset">
    <span class="book-tag">Mindset</span>
    <h3>Book Title Here</h3>
    <p class="book-author">BY AUTHOR NAME</p>
    <p class="book-review">Your personal take on the book.</p>
</div>
```

### Before publishing

Preview [Books locally](http://localhost:4173/books.html) on desktop and mobile. Check the new entry's category/count, the mobile Categories menu, Random pick and Another pick within a selected category, and a direct book hash link (for example, `books.html#clarity-connection`).

Gold corners mark the selected book while neighboring books, the introduction, and reading-nook background fade. Scrolling beyond the selected book restores normal contrast without changing its hash. Returning to it restores focus. Escape clears the spotlight and book hash without changing the scroll position or category. Top returns to the beginning. Top and category changes also clear the previous spotlight/hash and restore the artwork. The dock follows the selected book in keyboard order, without trapping access to other books. All recommendations remain readable without JavaScript. Category filters and Random pick stay hidden until their handlers are ready. Reduced-motion settings disable animated scrolling, fading, and dice feedback.

### Book entry prompt

Follow "How to add a book" in README.md.

- Add the book to `books.html` in alphabetical order by title.
- Set the category and reorder the category filters from most to least books, keeping All first.
- Preserve existing book permalinks and update the initial total in `#book-status`.

Title:
Author:
Category:
Review:
