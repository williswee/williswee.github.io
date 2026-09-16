import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../../thoughts/reading-room.js', import.meta.url), 'utf8');

function readerFixture({ href = 'http://localhost:4173/thoughts/freedom.html?reading=3#footnote-1', top = 264, height = 2000, viewport = 900, headerSize = 76, resizeObserver = true } = {}) {
    const documentEvents = new Map();
    const windowEvents = new Map();
    const frames = [];
    const observed = [];
    const elements = [];
    const clipboard = [];
    let resizeCallback;
    let fontsReady;
    let selected = '';
    function element() {
        const events = new Map();
        return {
            events, style: {}, hidden: false, offsetWidth: 240, offsetHeight: 60,
            classList: { add() {}, remove() {} },
            setAttribute() {}, removeAttribute() {}, hasAttribute: () => false,
            querySelectorAll: () => [], matches: () => false, contains: () => false,
            addEventListener: (type, handler, capture) => events.set(type, { handler, capture })
        };
    }
    const copy = element();
    const label = element();
    const share = element();
    copy.querySelector = () => label;
    const header = element();
    header.getBoundingClientRect = () => ({ height: headerSize });
    const article = element();
    article.contains = () => true;
    article.getBoundingClientRect = () => ({ top, height, bottom: top + height });
    const origin = { nodeType: 1, closest: () => origin, isConnected: true };
    const document = {
        documentElement: { scrollHeight: 5000 },
        body: { append: node => elements.push(node) },
        querySelector: selector => selector === 'article' ? article : selector === '.reading-hud' ? header : null,
        getElementById: () => null,
        createElement: () => {
            const node = element();
            node.querySelector = selector => selector === '#quote-copy-btn' ? copy : share;
            return node;
        },
        addEventListener: (type, handler) => documentEvents.set(type, handler),
        fonts: { ready: { then: callback => { fontsReady = callback; } } }
    };
    class ResizeObserver {
        constructor(callback) { resizeCallback = callback; }
        observe(node) { observed.push(node); }
    }
    const location = new URL(href);
    const sandbox = {
        document, location, URL, Node: { ELEMENT_NODE: 1 }, innerWidth: 390, innerHeight: viewport,
        window: {
            matchMedia: () => ({ matches: false }), WILLIS_ESSAYS: [], scrollY: 0,
            addEventListener: (type, handler) => windowEvents.set(type, handler),
            getSelection: () => ({
                toString: () => selected, rangeCount: selected ? 1 : 0,
                getRangeAt: () => ({ commonAncestorContainer: origin, getBoundingClientRect: () => ({ left: 40, top: 200, bottom: 230, width: 200, height: 30 }) })
            }),
            ...(resizeObserver ? { ResizeObserver } : {})
        },
        ResizeObserver,
        requestAnimationFrame: callback => { frames.push(callback); },
        setTimeout: () => 1, clearTimeout() {},
        fetch: () => Promise.reject(new Error('offline fixture')),
        navigator: { clipboard: { writeText: async text => clipboard.push(text) } }
    };
    vm.runInNewContext(source, sandbox);
    const progress = elements.find(node => node.id === 'reading-progress-bar');
    return {
        article, header, observed, frames, clipboard, location, share, label, document,
        progress: () => parseFloat(progress.style.width),
        bounds: values => { if ('top' in values) top = values.top; if ('height' in values) height = values.height; if ('header' in values) headerSize = values.header; if ('viewport' in values) sandbox.innerHeight = values.viewport; },
        event: type => windowEvents.get(type)(),
        frame: () => frames.splice(0).forEach(callback => callback()),
        resize: () => resizeCallback(),
        fontLoad: () => fontsReady(),
        select: text => { selected = text; documentEvents.get('mouseup')(); },
        copy: () => copy.events.get('click').handler()
    };
}

test('share and copy use the clean local article URL, not a preview query or footnote', async () => {
    const f = readerFixture({ href: 'http://localhost:4173/thoughts/freedom.html?reading=3&motion=2&utm_source=preview#footnote-1' });
    f.select('A meaningful thought worth sharing.');
    assert.equal(new URL(f.share.href).searchParams.get('url'), 'http://localhost:4173/thoughts/freedom.html');
    await f.copy();
    assert.equal(f.clipboard[0], '“A meaningful thought worth sharing.” — Willis Wee\nhttp://localhost:4173/thoughts/freedom.html');
    assert.equal(f.label.textContent, 'Copied!');
});

test('published shares retain the production origin and article path', async () => {
    const f = readerFixture({ href: 'https://williswee.com/thoughts/tickertownupdate.html?reading=3#footnote-2' });
    f.select('Building for joy.');
    const share = new URL(f.share.href);
    assert.equal(share.searchParams.get('url'), 'https://williswee.com/thoughts/tickertownupdate.html');
    assert.equal(share.searchParams.get('text'), '“Building for joy.” — @williswee');
    await f.copy();
    assert.ok(f.clipboard[0].endsWith('\nhttps://williswee.com/thoughts/tickertownupdate.html'));
});

test('quote links remain clean if the active hash changes before copying', async () => {
    const f = readerFixture();
    f.select('A selected passage.');
    f.location.hash = '#footnote-5';
    f.location.search = '?reading=99';
    await f.copy();
    assert.ok(f.clipboard[0].endsWith('\nhttp://localhost:4173/thoughts/freedom.html'));
});

test('reading progress starts at zero before the article reaches the fixed header', () => {
    assert.equal(readerFixture().progress(), 0);
});

test('reading progress accounts for the visible area beneath the fixed header', () => {
    const f = readerFixture({ top: -424, height: 1824, viewport: 900, headerSize: 76 });
    assert.equal(f.progress(), 50);
});

test('reading progress completes at the article end with fractional-pixel tolerance', () => {
    const f = readerFixture({ top: -923.4, height: 1824, viewport: 900 });
    assert.equal(f.progress(), 100);
});

test('newsletter and footer height never affect article completion', () => {
    const f = readerFixture({ top: -924, height: 1824 });
    f.document.documentElement.scrollHeight = 100000;
    f.event('scroll');
    f.frame();
    assert.equal(f.progress(), 100);
});

test('short essays complete only when their last line enters the viewport', () => {
    const f = readerFixture({ top: 700, height: 300 });
    assert.equal(f.progress(), 0);
    f.bounds({ top: 600 });
    f.event('scroll');
    f.frame();
    assert.equal(f.progress(), 100);
});

test('empty article and out-of-range scroll positions produce finite clamped progress', () => {
    const f = readerFixture({ top: -100, height: 0 });
    assert.equal(f.progress(), 0);
    f.bounds({ height: 2000, top: -5000 });
    f.event('scroll');
    f.frame();
    assert.equal(f.progress(), 100);
});

test('article and header resize are observed and update progress in one animation frame', () => {
    const f = readerFixture({ top: -424, height: 1824 });
    assert.deepEqual(f.observed, [f.article, f.header]);
    f.bounds({ height: 2824 });
    f.resize();
    f.resize();
    assert.equal(f.frames.length, 1);
    f.frame();
    assert.equal(f.progress(), 25);
});

test('image load, fonts, viewport change, and browser restore refresh article progress', () => {
    const f = readerFixture({ top: -424, height: 1824 });
    assert.equal(f.article.events.get('load').capture, true);
    f.article.events.get('load').handler();
    f.fontLoad();
    f.event('pageshow');
    f.event('resize');
    assert.equal(f.frames.length, 1);
    f.bounds({ header: 104, viewport: 844 });
    f.frame();
    assert.ok(Math.abs(f.progress() - 528 / 1084 * 100) < 0.00001);
});

test('scroll/load/resize fallback still works without ResizeObserver', () => {
    const f = readerFixture({ resizeObserver: false });
    f.bounds({ top: -1100 });
    f.event('load');
    f.frame();
    assert.equal(f.progress(), 100);
});
