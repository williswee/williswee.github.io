# Orbit site polish source

The published demo is built from `williswee/orbit-watch` at `caf5ee0b35007908c025f3ceae5e25580270680a`. Apply `deployed-baseline.patch` first to preserve the previously shipped always-visible desktop details card, then `return-link.patch` to add Back to Play and set mobile search inputs to 16px. Desktop input sizes remain unchanged.

Use the upstream pinned Bun lockfile with `bun install --frozen-lockfile --ignore-scripts`, then `bun run build:orbit` and `bun test`. The source snapshot used for this export is recorded in `baseline-source-sha256.json`. When rebuilding from a minimal source snapshot, place `tailwind-scan-context.html` at the app root so Tailwind sees the utility context from omitted upstream non-runtime files.

The recovered baseline rebuilt byte-for-byte to the old site JS and CSS before these changes. The new export preserves every unchanged worker, data snapshot, font and public asset. When publishing, copy the generated JS/CSS into `orbit/assets/`, update their hashed references in the existing `orbit/index.html`, and remove obsolete entry assets. Preserve the site's canonical/social metadata, analytics loader and no-script recovery in that HTML shell.

The website still requires no build step.
