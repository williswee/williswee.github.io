# Chix Run

A one-screen chicken arcade built with Bun, strict TypeScript, Vite and KAPLAY 3001.0.19. The generated static game in this directory is served at `/chix-run/`; editable code lives in `source/`. The header’s Back to Creative button returns to `https://williswee.com/creative.html` in the same tab.

## Local development

```sh
cd chix-run/source
bun install --frozen-lockfile
bun run dev
```

Open the Vite URL printed in the terminal. Menu, playing and game over are one discriminated union in `source/src/flow.ts`; its pure `step` function owns score and life changes. `bun run check` checks TypeScript and `bun test` checks the transition and gameplay helpers.

## Publish an update

From `chix-run/source/`, rebuild and copy the complete generated output into its parent:

```sh
bun install --frozen-lockfile
bun run build
cp -R dist/. ../
```

Remove obsolete generated assets from `chix-run/assets/` when a rebuild changes their hashes, while retaining `source/` and this README. Commit the generated files together with their source, then push the website repository's publishing branch. Relative asset paths keep the game self-contained under `/chix-run/` on GitHub Pages.

## Mobile controls and sound

Pointer input uses large KAPLAY Left, Dash and Right controls with shared drawing/hit geometry and hold feedback. Buttons adapt to the rendered court; short touch viewports compact the shell. Keyboard controls remain available.

Audio unlocks on trusted touch/pointer release and retries on subsequent gestures. Safari’s optional playback routing supports enabled sound with the silent switch; unmuting plays a short confirmation. All audio is synthesized locally.

## Credits and bundled notices

Character art is drawn with KAPLAY shapes; game audio is synthesized locally with Web Audio. Anton and Outfit are bundled under SIL OFL 1.1, with their notices in `fonts/` and `source/public/fonts/`.

The pinned KAPLAY package's installed notice is preserved verbatim in `licenses/kaplay-LICENSE.md` and `source/public/licenses/kaplay-LICENSE.md`. The game credits link directly to that package notice. Bun and Vite use MIT, and TypeScript uses Apache 2.0.
