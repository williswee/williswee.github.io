# Floorplan site polish source

The published demo is built from `williswee/3D-floorplan` at `ea776dce83634f4cab855662793a704d524e693b`. The local checkout in Downloads was older; it was left unchanged. Apply `return-link.patch` to this pinned source to add Back to Play beside the app identity. The source snapshot used for the export is recorded in `baseline-source-sha256.json`.

Use the upstream pinned dependencies and run `bun run build:site`, which checks TypeScript before Vite. The recovered baseline rebuilt byte-for-byte to the previous site JS and CSS. The export preserves unchanged runtime chunks, models, textures and fonts.

Copy changed build assets into `3d-floorplan/assets/`, update the hashed references in the existing `3d-floorplan/index.html`, and remove obsolete hashes. Preserve the site's canonical/social metadata, analytics loader and no-script recovery in that HTML shell. The website still requires no build step.
