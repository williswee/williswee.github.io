# 3D floor plan studio

Interactive app published at https://williswee.com/3d-floorplan/.

Source: https://github.com/williswee/3D-floorplan/tree/ea776dc

## Rebuild

In the source repository, install the pinned dependencies with `bun install --frozen-lockfile`, then run `bun test`, `bun run lint`, and `bun run build:site`. Copy the contents of `dist/` into this directory, excluding dotfiles; retain this README, LICENSE, and ASSETS.md. The build scopes every asset to `/3d-floorplan/` and avoids filenames that GitHub Pages excludes.

This folder is self-contained. No changes to CNAME, DNS, shared site assets, routing, or Pages configuration are needed. Preview it under the same subpath before publishing. The app runs in the browser and needs no backend. AI design and upload controls retain their demo-only behavior. Comments are saved only in the visitor's browser.

## Release checks

103 tests, TypeScript build, and ESLint passed. Both layouts, 2D/3D switching, material palettes, pinned comments, and mobile layout controls were checked in the production build. All bundle dependencies and 26 runtime asset paths are present.

## Rollback

Revert the commit that added this directory. The deployment changes no pre-existing website files.
