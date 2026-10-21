import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../../work-game.js', import.meta.url), 'utf8');

function fixture({ mobile = true, scrollY = 0, initializeFrame = true } = {}) {
    const frames = [];
    const documentEvents = new Map();
    let changeMode;
    const media = { matches: mobile, addEventListener: (_, callback) => { changeMode = callback; } };
    const document = { activeElement: null, addEventListener: (name, callback) => documentEvents.set(name, callback) };
    function focus(options) {
        document.activeElement = this;
        this.focusOptions = options;
        documentEvents.get('focusin')?.({ target: this });
    }
    const summary = { focus, contains: element => element === summary };
    const sections = ['now', 'tech-in-asia', 'tuition-center'].map((id, index) => ({
        id, matches: () => true,
        getBoundingClientRect: () => ({ top: index * 1000 - window.scrollY }),
    }));
    const links = sections.map(section => ({
        focus, attributes: new Map(),
        getAttribute: () => `#${section.id}`,
        addEventListener() {},
        querySelector: () => ({ textContent: section.id }),
        setAttribute(name, value) { this.attributes.set(name, value); },
        removeAttribute(name) { this.attributes.delete(name); },
    }));
    const menu = {
        open: true, querySelector: () => summary,
        contains: element => element === summary || links.includes(element),
    };
    const unrelated = { focus };
    Object.assign(document, {
        querySelector: selector => ({ '.chapter-menu': menu, '.current-chapter': { textContent: '' },
            '.reading-hud': { getBoundingClientRect: () => ({ height: 64 }) } })[selector],
        querySelectorAll: () => links,
        getElementById: id => sections.find(section => section.id === id),
        createElement: () => ({ style: {}, setAttribute() {} }),
        body: { appendChild() {} }, documentElement: { scrollHeight: 4000 },
    });
    const window = {
        scrollY, innerHeight: 800, location: { hash: '' },
        matchMedia: () => media, addEventListener() {},
        requestAnimationFrame: callback => frames.push(callback),
    };
    const flush = () => { while (frames.length) frames.shift()(); };
    vm.runInNewContext(source, { document, window });
    if (initializeFrame) flush();
    return { document, summary, links, menu, unrelated,
        resize(mobile, { clearFocus = false, bodyFocusEvent = false } = {}) {
            media.matches = mobile;
            if (clearFocus) document.activeElement = document.body;
            if (bodyFocusEvent) documentEvents.get('focusin')?.({ target: document.body });
            changeMode();
            flush();
        },
        pointer: target => documentEvents.get('pointerdown')?.({ target }),
    };
}

test('growing the Work viewport moves focus from Milestones to the current visible chapter link', () => {
    const f = fixture({ scrollY: 1050 });
    assert.equal(f.links[1].attributes.get('aria-current'), 'location');
    f.summary.focus();
    f.resize(false);
    assert.equal(f.menu.open, true);
    assert.equal(f.document.activeElement, f.links[1]);
    assert.equal(f.links[1].focusOptions.preventScroll, true);
});

test('changing Work layout before the first frame falls back to the first chapter', () => {
    const f = fixture({ initializeFrame: false });
    f.summary.focus();
    f.resize(false);
    assert.equal(f.document.activeElement, f.links[0]);
});

for (const bodyFocusEvent of [false, true]) {
    test(`Work restores chapter focus when the browser clears the hidden summary${bodyFocusEvent ? ' and reports body focus' : ''}`, () => {
        const f = fixture({ scrollY: 1050 });
        f.summary.focus();
        f.resize(false, { clearFocus: true, bodyFocusEvent });
        assert.equal(f.menu.open, true);
        assert.equal(f.document.activeElement, f.links[1]);
        assert.equal(f.links[1].focusOptions.preventScroll, true);
    });
}

test('Work does not restore old summary focus after the reader focuses elsewhere or clicks the page', () => {
    for (const move of ['focus', 'pointer']) {
        const f = fixture();
        f.summary.focus();
        if (move === 'focus') f.unrelated.focus();
        else f.pointer(f.unrelated);
        f.resize(false, { clearFocus: true });
        assert.equal(f.document.activeElement, f.document.body, move);
    }
});

test('shrinking the Work viewport returns chapter focus to the visible Milestones summary', () => {
    const f = fixture({ mobile: false });
    f.links[1].focus();
    f.resize(true);
    assert.equal(f.menu.open, false);
    assert.equal(f.document.activeElement, f.summary);
    assert.equal(f.summary.focusOptions.preventScroll, true);
});

test('Work layout changes preserve focus on links that stay visible and unrelated content', () => {
    const f = fixture();
    f.menu.open = true;
    f.links[1].focus();
    f.resize(false);
    assert.equal(f.document.activeElement, f.links[1]);
    f.unrelated.focus();
    f.resize(true);
    assert.equal(f.document.activeElement, f.unrelated);
    f.resize(false);
    assert.equal(f.document.activeElement, f.unrelated);
});
