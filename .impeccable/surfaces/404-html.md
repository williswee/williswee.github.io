---
schema_version: 1
slug: 404-html
primary_target: 404.html
related_targets: []
---

# Not-found page

Mode: Operate. Success is a lost visitor finding their way back within one glance.

## Current contract — 2026-09-25

GitHub Pages serves `404.html` for every missing address at any depth, so every local URL is root-relative. The page reuses the shared reading room: header, portrait column, pane, and footer. Its styles are inline so the error page makes no extra request.

- **Scene:** the shared `images/reading-landscapes/09-forest-path.webp` preset, with the portrait treatment and a 70% phone crop. No new raster.
- **Copy:** "Off the map." then a "Willis" dialogue box: "Hmm, this page isn't here. It may have moved when I rebuilt the site, or the link has a small typo." A short script adds "You were looking for …" with the missing path, inserted as text only.
- **Ways back:** the Work page's approved onward labels: Back to the beginning, Read my thoughts, Say hello and connect.
- **Search:** `noindex`, not in the sitemap. Analytics stay on, so broken inbound links show up in Inflect.

Checked at 1336, 390, and 320px: no horizontal overflow, 52px link rows, and the nameplate clear of the heading. `scripts/tests/document-structure.test.mjs` checks the root-relative URLs, the files they point to, `noindex`, and the three ways back.
