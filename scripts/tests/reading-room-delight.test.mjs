import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../../thoughts/reading-room.js', import.meta.url), 'utf8');
const manifest = {};
vm.runInNewContext(readFileSync(new URL('../../thoughts/essay-manifest.js', import.meta.url), 'utf8'), { window: manifest });

function readerFixture({ href = 'http://localhost:4173/thoughts/freedom.html?reading=3#footnote-1', top = 264, height = 2000, viewport = 900, headerSize = 76, resizeObserver = true, essayDetails = [] } = {}) {
    const documentEvents = new Map();
    const windowEvents = new Map();
    const frames = [];
    const observed = [];
    const elements = [];
    const clipboard = [];
    const continuations = [];
    let resizeCallback;
    let fontsReady;
    let selected = '';
    function element() {
        const events = new Map();
        return {
            events, style: {}, hidden: false, offsetWidth: 240, offsetHeight: 60,
            children: [],
            append(...nodes) { this.children.push(...nodes); },
            classList: { add() {}, remove() {} },
            setAttribute() {}, removeAttribute() {}, hasAttribute: () => false,
            querySelectorAll: () => [], querySelector: () => null, matches: () => false, contains: () => false,
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
    article.after = node => continuations.push(node);
    const date = element();
    date.textContent = '25 August 2026';
    article.querySelector = selector => selector === '.article-date' ? date : null;
    const origin = { nodeType: 1, closest: () => origin, isConnected: true };
    const document = {
        documentElement: { scrollHeight: 5000 },
        body: { append: node => elements.push(node) },
        querySelector: selector => selector === 'article' ? article : selector === '.reading-hud' ? header : null,
        getElementById: () => null,
        createElementNS: () => element(),
        createTextNode: text => ({ textContent: text }),
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
            matchMedia: () => ({ matches: false }), WILLIS_ESSAYS: [], WILLIS_ESSAY_DETAILS: essayDetails, scrollY: 0,
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
        article, header, observed, frames, clipboard, location, share, label, document, date,
        continuation: () => continuations[0],
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

test('published reader metadata covers every archived essay once with actual titles and reading estimates', () => {
    const details = manifest.WILLIS_ESSAY_DETAILS;
    assert.deepEqual(Array.from(details, essay => essay.slug), Array.from(manifest.WILLIS_ESSAYS));
    assert.equal(new Set(details.map(essay => essay.slug)).size, details.length);
    for (const essay of details) {
        assert.ok(essay.title.trim() && essay.date.trim(), essay.slug);
        assert.ok(Number.isInteger(essay.minutes) && essay.minutes >= 1, essay.slug);
        assert.doesNotMatch(essay.title, /<[^>]+>|&amp;|&rsquo;/, essay.slug);
    }
    assert.equal(details.find(essay => essay.slug === 'freedom.html').title, 'Freedom is being disliked by other people');
});

test('reading estimate supplements the untouched date without extending article completion', () => {
    const f = readerFixture({ essayDetails: manifest.WILLIS_ESSAY_DETAILS, top: -924, height: 1824 });
    const metadata = manifest.WILLIS_ESSAY_DETAILS.find(essay => essay.slug === 'freedom.html');
    assert.equal(f.date.textContent, '25 August 2026');
    assert.equal(f.date.children[1].textContent, `About ${metadata.minutes} min read`);
    assert.equal(f.progress(), 100);
});

test('essay completion offers the adjacent actual titles with distinct destinations', () => {
    const f = readerFixture({ essayDetails: manifest.WILLIS_ESSAY_DETAILS });
    const nav = f.continuation();
    const index = manifest.WILLIS_ESSAY_DETAILS.findIndex(essay => essay.slug === 'freedom.html');
    const links = nav.children[1].children.map(item => item.children[0]);
    assert.deepEqual(links.map(link => link.href), [manifest.WILLIS_ESSAY_DETAILS[index - 1].slug, manifest.WILLIS_ESSAY_DETAILS[index + 1].slug]);
    assert.deepEqual(links.map(link => link.children[0].textContent), [manifest.WILLIS_ESSAY_DETAILS[index - 1].title, manifest.WILLIS_ESSAY_DETAILS[index + 1].title]);
    assert.equal(new Set(links.map(link => link.href)).size, links.length);
    assert.ok(links.every(link => link.href !== 'freedom.html'));
});

test('newest and oldest essays offer only their existing neighbor without looping the archive', () => {
    const details = manifest.WILLIS_ESSAY_DETAILS;
    for (const index of [0, details.length - 1]) {
        const f = readerFixture({ href: `https://williswee.com/thoughts/${details[index].slug}`, essayDetails: details });
        const links = f.continuation().children[1].children.map(item => item.children[0]);
        assert.equal(links.length, 1);
        assert.equal(links[0].href, details[index === 0 ? 1 : index - 1].slug);
    }
});

test('missing or unknown metadata leaves the static date and existing reader controls intact', () => {
    for (const options of [{}, { href: 'https://williswee.com/thoughts/new-essay.html', essayDetails: manifest.WILLIS_ESSAY_DETAILS }]) {
        const f = readerFixture(options);
        assert.equal(f.date.children.length, 0);
        assert.equal(f.continuation(), undefined);
        assert.equal(f.progress(), 0);
    }
});

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

function archiveFixture({ searchMarkup = true } = {}) {
    const windowEvents = new Map();
    const destinations = [];
    const timers = [];
    let focused;
    function element() {
        const events = new Map();
        return {
            children: [], hidden: false, disabled: false, value: '', events,
            classList: { add() {}, remove() {} },
            setAttribute() {},
            append(...nodes) { this.children.push(...nodes); },
            replaceChildren(fragment) { this.children = fragment.children; },
            addEventListener: (type, handler) => events.set(type, handler),
            focus() { focused = this; }
        };
    }
    const html = readFileSync(new URL('../../thoughts/index.html', import.meta.url), 'utf8');
    const listHtml = html.match(/<ul\b[^>]*id="article-list"[^>]*>([\s\S]*?)<\/ul>/)[1];
    const entries = [...listHtml.matchAll(/<li>\s*<a href="([^"]+)">([\s\S]*?)<\/a>\s*<span class="article-date">([^<]+)<\/span>\s*<\/li>/g)].map(([, slug, title, date]) => {
        const item = element();
        item.slug = slug;
        const link = { href: `https://williswee.com/thoughts/${slug}`, textContent: title.replace(/&amp;/g, '&') };
        item.querySelector = selector => selector === 'a' ? link : { textContent: date };
        return item;
    });
    const ids = Object.fromEntries(['article-list', 'thoughts-archive-container', 'thoughts-count-label', 'random-thought-btn', 'essay-search-tools', 'essay-search', 'essay-search-clear', 'essay-search-empty', 'essay-search-reset'].map(id => [id, element()]));
    ids['article-list'].children = entries;
    const controls = element();
    controls.getBoundingClientRect = () => ({ height: 130 });
    const document = {
        getElementById: id => !searchMarkup && id.startsWith('essay-search') ? null : ids[id] ?? null,
        querySelector: selector => selector === '.archive-controls' ? controls : null,
        createElement: element,
        createDocumentFragment: element,
        documentElement: { style: { setProperty() {} } }
    };
    vm.runInNewContext(source, {
        document,
        window: {
            matchMedia: () => ({ matches: false }),
            addEventListener: (type, handler) => windowEvents.set(type, [...(windowEvents.get(type) || []), handler]),
            setTimeout: callback => timers.push(callback),
            location: { assign: href => destinations.push(href) }
        },
        Math: Object.assign(Object.create(Math), { random: () => 0 })
    });
    const search = ids['essay-search'];
    return {
        ids, entries, destinations,
        query: value => { search.value = value; search.events.get('input')(); },
        click: id => ids[id].events.get('click')(),
        escape: () => search.events.get('keydown')({ key: 'Escape', preventDefault() {} }),
        restore: () => windowEvents.get('pageshow').forEach(handler => handler()),
        navigate: () => timers.splice(0).forEach(callback => callback()),
        focused: () => focused,
        visible: () => entries.filter(item => !item.hidden).map(item => item.slug),
        groups: () => ids['thoughts-archive-container'].children
    };
}

test('archive search starts with all real essays and activates only with complete search markup', () => {
    const f = archiveFixture();
    assert.equal(f.ids['essay-search-tools'].hidden, false);
    assert.equal(f.visible().length, manifest.WILLIS_ESSAYS.length);
    assert.equal(f.ids['thoughts-count-label'].textContent, `${manifest.WILLIS_ESSAYS.length} essays`);
    assert.equal(f.ids['essay-search-empty'].hidden, true);
    const fallback = archiveFixture({ searchMarkup: false });
    assert.equal(fallback.visible().length, manifest.WILLIS_ESSAYS.length);
    assert.equal(fallback.ids['random-thought-btn'].hidden, false);
});

test('archive search matches every normalized term across title and date, and random picks only matches', () => {
    const f = archiveFixture();
    f.query('  BoUnCiNg\n2018  ');
    assert.deepEqual(f.visible(), ['bounce.html']);
    assert.equal(f.ids['thoughts-count-label'].textContent, `1 of ${manifest.WILLIS_ESSAYS.length} essays`);
    const visibleYears = f.groups().filter(group => !group.hidden);
    assert.equal(visibleYears.length, 1);
    assert.equal(visibleYears[0].children[0].children[0].textContent, '2018');
    assert.equal(visibleYears[0].children[0].children[1].textContent, '1 essay');
    f.click('random-thought-btn');
    f.navigate();
    assert.deepEqual(f.destinations, ['https://williswee.com/thoughts/bounce.html']);
});

test('archive no-results state disables random and clearing restores all years with input focus', () => {
    const f = archiveFixture();
    f.query('no such title 2099');
    assert.equal(f.visible().length, 0);
    assert.equal(f.ids['random-thought-btn'].disabled, true);
    assert.equal(f.ids['essay-search-empty'].hidden, false);
    assert.ok(f.groups().every(group => group.hidden));
    f.click('random-thought-btn');
    f.navigate();
    assert.equal(f.destinations.length, 0);
    f.click('essay-search-reset');
    assert.equal(f.visible().length, manifest.WILLIS_ESSAYS.length);
    assert.equal(f.ids['random-thought-btn'].disabled, false);
    assert.equal(f.ids['essay-search-empty'].hidden, true);
    assert.equal(f.ids['essay-search-clear'].hidden, true);
    assert.ok(f.groups().every(group => !group.hidden));
    assert.equal(f.focused(), f.ids['essay-search']);
});

test('archive Escape and browser restore keep search text, counts, and picker availability consistent', () => {
    const f = archiveFixture();
    f.query('missing essay 2099');
    f.restore();
    assert.equal(f.ids['random-thought-btn'].disabled, true);
    assert.equal(f.ids['essay-search-empty'].hidden, false);
    f.escape();
    assert.equal(f.ids['essay-search'].value, '');
    assert.equal(f.visible().length, manifest.WILLIS_ESSAYS.length);
    assert.equal(f.focused(), f.ids['essay-search']);
    f.query('2018');
    f.click('essay-search-clear');
    assert.equal(f.ids['thoughts-count-label'].textContent, `${manifest.WILLIS_ESSAYS.length} essays`);
});
