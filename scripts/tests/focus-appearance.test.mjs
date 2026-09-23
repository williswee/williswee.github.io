import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../../thoughts/reading-room.css', import.meta.url), 'utf8');
const books = readFileSync(new URL('../../books-game.css', import.meta.url), 'utf8');
const gratitude = readFileSync(new URL('../../gratitude-game.css', import.meta.url), 'utf8');

test('Books and Gratitude share transparent spotlight surfaces and corner markers', () => {
    assert.match(css, /:is\(\.book-card\.book-card--spotlight, \.gratitude-note\.gratitude-note--spotlight\)\s*\{[^}]*background:\s*transparent;[^}]*border-bottom-color:\s*transparent;/);
    for (const pseudo of ['before', 'after']) {
        assert.ok(css.includes(`:is(.book-card--spotlight, .gratitude-note--spotlight)::${pseudo}`));
    }
    assert.match(css, /--focus-marker-offset:\s*12px/);
    assert.match(css, /--focus-marker-offset:\s*8px/);
    for (const pageCss of [books, gratitude]) {
        assert.doesNotMatch(pageCss, /--spotlight\s*\{[^}]*\b(?:background|outline):/);
        assert.doesNotMatch(pageCss, /255,\s*190,\s*99,\s*\.055/);
    }
});

test('Keyboard focus stays distinct from persistent discovery selection', () => {
    assert.match(css, /:is\(\.book-card, \.gratitude-note\):focus-visible\s*\{[^}]*outline:\s*2px solid var\(--gold\);/);
    assert.match(css, /:is\(\.book-card, \.gratitude-note\):focus\s*\{\s*outline:\s*none;/);
    assert.match(css, /pointer-events:\s*none/);
});

test('Focus dimming is viewport-gated, keyboard-accessible, and reduced-motion aware', () => {
    for (const [pageCss, group, entry] of [[books, 'book-grid', 'book-card'], [gratitude, 'gratitude-notes', 'gratitude-note']]) {
        assert.ok(pageCss.includes(`.${group}--focus .${entry}:not(.${entry}--spotlight) { opacity: .22; }`));
        assert.ok(pageCss.includes(`.${group}--focus .${entry}:not(.${entry}--spotlight):focus-within { opacity: 1; }`));
        assert.ok(!pageCss.includes(`.${group}--spotlight .${entry}:not`), 'selection alone must not keep other entries dim');
        assert.match(pageCss, /@media \(prefers-reduced-motion: reduce\)/);
        assert.match(pageCss, /transition:\s*none/);
        assert.doesNotMatch(pageCss, /background-color 180ms/);
    }
});
