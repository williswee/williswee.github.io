import type { KAPLAYCtx } from 'kaplay';
import atlas from './display-font.json';

/** A padded, proportional Anton atlas bypasses KAPLAY 3001's clipped TTF cache. */
export function loadDisplayFont(k: KAPLAYCtx): void {
  k.loadBitmapFont('Display', './fonts/anton-atlas.png', atlas.cellWidth, atlas.cellHeight,
    { chars: atlas.chars, filter: 'linear' }).onLoad((font) => {
    font.size = atlas.size;
    // Bitmap fonts start as equal cells; these public quads restore each
    // character's measured advance and retain its complete padded glyph.
    [...atlas.chars].forEach((ch, i) => {
      const glyph = atlas.glyphs[ch as keyof typeof atlas.glyphs];
      font.map[ch] = k.quad((i % atlas.columns) * atlas.cellWidth,
        Math.floor(i / atlas.columns) * atlas.cellHeight, glyph.width, glyph.height);
    });
  });
}
