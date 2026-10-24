import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../../work-game.js', import.meta.url), 'utf8');

function fixture({ mobile = true, scrollY = 0, initializeFrame = true } = {}) {
    const frames = [];
    const documentEvents = new Map();
    const windowEvents = new Map();
    const rootStyles = new Map();
    const observers = [];
    let changeMode;
    const media = { matches: mobile, addEventListener: (_, callback) => { changeMode = callback; } };
    const document = { activeElement: null, addEventListener: (name, callback) => documentEvents.set(name, callback) };
    function focus(options) {
        document.activeElement = this;
        this.focusOptions = options;
        documentEvents.get('focusin')?.({ target: this });
    }
    const summary = { focus, contains: element => element === summary,
        getBoundingClientRect: () => ({ height: 52 }) };
    const currentLabel = { textContent: '' };
    const sections = ['now', 'tech-in-asia', 'tuition-center'].map((id, index) => ({
        id, matches: () => true, focus, hasAttribute: () => true,
        scrollIntoView() {
            this.scrollOffset = rootStyles.get('--work-menu-height');
            window.scrollY = index * 1000 - (64 + parseFloat(this.scrollOffset) + 28);
        },
        getBoundingClientRect: () => ({ top: index * 1000 - window.scrollY }),
    }));
    const links = sections.map(section => ({
        focus, attributes: new Map(), handlers: new Map(),
        getAttribute: () => `#${section.id}`,
        addEventListener(name, callback) { this.handlers.set(name, callback); },
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
        querySelector: selector => ({ '.chapter-menu': menu, '.current-chapter': currentLabel,
            '.reading-hud': { getBoundingClientRect: () => ({ height: 64 }) } })[selector],
        querySelectorAll: () => links,
        getElementById: id => sections.find(section => section.id === id),
        createElement: () => ({ style: {}, setAttribute() {} }),
        body: { appendChild() {} }, documentElement: { scrollHeight: 4000,
            style: { setProperty: (name, value) => rootStyles.set(name, value) } },
    });
    const window = {
        scrollY, innerHeight: 800, location: { hash: '' },
        matchMedia: () => media, addEventListener: (name, callback) => windowEvents.set(name, callback),
        requestAnimationFrame: callback => frames.push(callback),
    };
    const flush = () => { while (frames.length) frames.shift()(); };
    class ResizeObserver {
        constructor(callback) { this.callback = callback; }
        observe(target) { this.target = target; observers.push(this); }
    }
    vm.runInNewContext(source, { document, window, ResizeObserver });
    if (initializeFrame) flush();
    return { document, summary, links, menu, unrelated, rootStyles, sections, window, currentLabel,
        scrollTo(y) {
            window.scrollY = y;
            windowEvents.get('scroll')();
            flush();
        },
        hashTo(index) {
            window.location.hash = `#${sections[index].id}`;
            window.scrollY = index * 1000 - (64 + parseFloat(rootStyles.get('--work-menu-height')) + 28);
            windowEvents.get('hashchange')();
            flush();
        },
        click(index) {
            menu.open = true;
            links[index].handlers.get('click')({ button: 0 });
            window.location.hash = `#${sections[index].id}`;
            window.scrollY = index * 1000 - (64 + parseFloat(rootStyles.get('--work-menu-height')) + 28);
            flush();
        },
        reflowSummary(height) {
            summary.getBoundingClientRect = () => ({ height });
            observers.find(observer => observer.target === summary)?.callback();
            flush();
        },
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

test('Work uses a wrapped Milestones height for native anchors and the current chapter', () => {
    const f = fixture();
    f.reflowSummary(122);
    f.click(1);
    assert.equal(f.rootStyles.get('--work-menu-height'), '122px');
    assert.equal(f.sections[1].scrollOffset, '122px');
    assert.equal(f.sections[1].getBoundingClientRect().top, 64 + 122 + 28);
    assert.equal(f.links[1].attributes.get('aria-current'), 'location');
    assert.equal(f.document.activeElement, f.sections[1]);
});

test('Work refreshes native offsets on reflow without moving the reader or changing their chapter', () => {
    const f = fixture({ scrollY: 760 });
    assert.equal(f.links[0].attributes.get('aria-current'), 'location');
    f.reflowSummary(170);
    assert.equal(f.rootStyles.get('--work-menu-height'), '170px');
    assert.equal(f.links[0].attributes.get('aria-current'), 'location');
    assert.equal(f.window.scrollY, 760);
});

test('Work chapter tracking stays stable when the active label becomes shorter at a boundary', () => {
    const f = fixture({ scrollY: 700 });
    f.summary.getBoundingClientRect = () => ({ height: f.currentLabel.textContent === 'now' ? 128 : 52 });
    f.scrollTo(820);
    assert.equal(f.links[1].attributes.get('aria-current'), 'location');
    // Repeated observer updates and continued downward scrolling must not
    // reactivate the preceding chapter after the selected label shrinks.
    for (const y of [820, 821, 825]) {
        f.scrollTo(y);
        assert.equal(f.links[1].attributes.get('aria-current'), 'location');
    }
    f.scrollTo(700);
    assert.equal(f.links[0].attributes.get('aria-current'), 'location');
});

test('Work history navigation corrects an offset only when the destination label changes height', () => {
    for (const destinationHeight of [52, 122]) {
        const f = fixture();
        f.summary.getBoundingClientRect = () => ({ height: f.currentLabel.textContent === 'tech-in-asia' ? destinationHeight : 52 });
        f.hashTo(1);
        assert.equal(f.sections[1].getBoundingClientRect().top, 64 + destinationHeight + 28);
        assert.equal(f.sections[1].scrollOffset, destinationHeight === 52 ? undefined : '122px');
        assert.equal(f.links[1].attributes.get('aria-current'), 'location');
        assert.equal(f.document.activeElement, f.sections[1]);
    }
});

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
