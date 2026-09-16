import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

for (const page of ['books', 'gratitude']) {
    const css = readFileSync(new URL(`../../${page}-game.css`, import.meta.url), 'utf8');

    test(`${page}: dock width is bounded by its actual viewport space`, () => {
        assert.match(css, /--dock-center:\s*calc\(95vw - min\(400px, 32vw\)\)/);
        assert.match(css, /left:\s*var\(--dock-center\)/);
        assert.match(css, /max-width:\s*min\(calc\(100vw - 32px\), calc\(200vw - var\(--dock-center\) - var\(--dock-center\) - 32px\)\)/);
        assert.match(css, /--dock-center:\s*63\.5vw/);
        assert.match(css, /--dock-center:\s*50vw/);
        assert.match(css, /\.dock-btn--top\s*\{\s*flex-shrink:\s*0; white-space:\s*nowrap;/);
    });

    test(`${page}: compact focus dock keeps all three actions in two rows`, () => {
        assert.match(css, /:has\(\.dock-btn--keep-reading:not\(\[hidden\]\)\)\s*\{\s*display: grid; grid-template-columns: minmax\(0, 1fr\) auto;/);
        assert.match(css, /\.dock-btn--shuffle\s*\{\s*grid-column: 1 \/ -1; grid-row: 1;/);
        assert.match(css, /\.dock-btn--keep-reading\s*\{\s*grid-column: 1; grid-row: 2;/);
        assert.match(css, /\.dock-btn--top\s*\{\s*grid-column: 2; grid-row: 2;/);
    });
}
