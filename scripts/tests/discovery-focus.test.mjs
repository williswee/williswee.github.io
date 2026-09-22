import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function fixture(kind, { compactMode = false, menuPresent = true } = {}) {
    const books = kind === 'books';
    const listeners = new Map();
    const keys = new Map();
    const frames = [];
    const scrolls = [];
    const location = { pathname: `/${kind}.html`, search: '?preview=1', hash: '' };
    const document = { activeElement: null, documentElement: {} };
    function element(id, tagName = 'DIV', textContent = '') {
        const classes = new Set();
        const handlers = new Map();
        const attrs = new Map();
        const item = {
            id, tagName, textContent, dataset: {}, hidden: false, handlers, attrs,
            classList: {
                add: name => classes.add(name), remove: name => classes.delete(name),
                contains: name => classes.has(name),
                toggle: (name, value) => { if (value) classes.add(name); else classes.delete(name); }
            },
            addEventListener: (type, handler) => handlers.set(type, handler),
            setAttribute: (name, value) => attrs.set(name, value),
            hasAttribute: name => attrs.has(name),
            matches: () => ['BUTTON', 'SUMMARY', 'A'].includes(tagName),
            focus: () => { document.activeElement = item; },
            contains: target => target === item,
            after: node => { node.previousElementSibling = item; },
            getBoundingClientRect: () => ({ top: 300, bottom: 500, height: 200 }),
            querySelector: () => null
        };
        return item;
    }
    const random = element(books ? 'random-book-btn' : 'random-gratitude-btn', 'BUTTON');
    const shuffle = element(books ? 'dock-shuffle-btn' : 'gratitude-dock-shuffle-btn', 'BUTTON');
    const top = element(books ? 'dock-top-btn' : 'gratitude-dock-top-btn', 'BUTTON');
    const dock = element(books ? 'floating-book-dock' : 'floating-gratitude-dock');
    dock.hidden = true;
    dock.contains = node => [dock, shuffle, top].includes(node);
    const grid = element(books ? 'book-grid' : 'gratitude-notes');
    const status = element(books ? 'book-status' : 'random-gratitude-status');
    const controls = element('controls');
    const menu = element('book-filter-menu', 'DETAILS');
    menu.getBoundingClientRect = () => ({ top: 76, bottom: 128, height: 52 });
    const summary = element('category-summary', 'SUMMARY');
    menu.querySelector = selector => selector === 'summary' ? summary : null;
    const cards = ['first', 'second', 'third'].map((id, i) => {
        const card = element(id, books ? 'DIV' : 'ARTICLE');
        card.dataset = { category: i === 2 ? 'science' : 'life', noteNumber: i + 1 };
        card.querySelector = name => name === 'h3' ? element('', 'H3', id)
            : name === '.book-tag' ? element('', 'SPAN', card.dataset.category) : null;
        return card;
    });
    const elements = [random, shuffle, top, dock, grid, status, ...cards];
    Object.assign(document, {
        querySelectorAll: selector => selector === '[id]' ? elements
            : selector === (books ? '.book-card' : '.gratitude-note') ? cards : [],
        querySelector: selector => {
            if (selector === '.reading-hud') return { getBoundingClientRect: () => ({ bottom: 76 }) };
            if (selector === '.book-controls' || selector === '.gratitude-toolbar') return controls;
            if (selector === '.gratitude-notes') return grid;
            if (selector === '.book-filter-menu' && books && menuPresent) return menu;
            return null;
        },
        getElementById: id => elements.find(e => e.id === id) || null,
        addEventListener: (name, handler) => keys.set(name, handler)
    });
    const window = {
        location, scrollY: 600, scrollX: 12, innerHeight: 800,
        history: { replaceState: (_state, _title, url) => { location.hash = url.includes('#') ? `#${url.split('#')[1]}` : ''; } },
        matchMedia: query => ({ matches: query.includes('reduced-motion') || (compactMode && query.includes('max-width')), addEventListener() {} }),
        getComputedStyle: e => e === document.documentElement ? { scrollPaddingTop: '100' } : { bottom: '20' },
        requestAnimationFrame: callback => frames.push(callback),
        addEventListener: (name, handler) => listeners.set(name, handler),
        scrollTo: value => {
            scrolls.push(value);
            window.scrollY = value.top;
            if (value.left !== undefined) window.scrollX = value.left;
        }
    };
    const source = readFileSync(new URL(books ? '../../books-game.js' : '../../gratitude.js', import.meta.url), 'utf8');
    vm.runInNewContext(source, { window, document });
    const flush = () => { while (frames.length) frames.shift()(); };
    flush();
    const select = (index = 0, settle = true) => {
        location.hash = `#${cards[index].id}`;
        listeners.get('hashchange')();
        if (settle) flush();
    };
    const click = button => { button.focus(); button.handlers.get('click')({ currentTarget: button }); flush(); };
    const escape = (defaultPrevented = false) => {
        const event = { key: 'Escape', defaultPrevented, preventDefault() { this.defaultPrevented = true; } };
        keys.get('keydown')(event);
        flush();
        return event;
    };
    const selected = () => cards.find(card => card.classList.contains(books ? 'book-card--spotlight' : 'gratitude-note--spotlight'));
    return { cards, dock, random, shuffle, top, grid, menu, location, window, document, controls, select, click, escape, selected, flush, scrolls, listeners };
}

test('books: compact sticky category menu counts as an obstruction at its measured height', () => {
    const f = fixture('books', { compactMode: true });
    for (const bottom of [128, 184, 240]) {
        f.menu.getBoundingClientRect = () => ({ top: 76, bottom, height: bottom - 76 });
        f.random.getBoundingClientRect = () => ({ top: bottom - 1, bottom: bottom + 43, height: 44 });
        f.listeners.get('scroll')(); f.flush();
        assert.equal(f.dock.hidden, false);
        f.random.getBoundingClientRect = () => ({ top: bottom, bottom: bottom + 44, height: 44 });
        f.listeners.get('scroll')(); f.flush();
        assert.equal(f.dock.hidden, true);
    }
});

test('books: desktop category rail does not extend the primary action obstruction', () => {
    const f = fixture('books');
    f.menu.getBoundingClientRect = () => ({ top: 140, bottom: 680, height: 540 });
    f.random.getBoundingClientRect = () => ({ top: 130, bottom: 174, height: 44 });
    f.listeners.get('scroll')(); f.flush();
    assert.equal(f.dock.hidden, true);
});

test('books: compact category toggle recalculates handoff without a scroll event', () => {
    const f = fixture('books', { compactMode: true });
    f.random.getBoundingClientRect = () => ({ top: 150, bottom: 194, height: 44 });
    f.menu.getBoundingClientRect = () => ({ top: 76, bottom: 220, height: 144 });
    f.menu.handlers.get('toggle')(); f.flush();
    assert.equal(f.dock.hidden, false);
    f.menu.getBoundingClientRect = () => ({ top: 76, bottom: 128, height: 52 });
    f.menu.handlers.get('toggle')(); f.flush();
    assert.equal(f.dock.hidden, true);
});

test('books: a missing compact menu still uses the header boundary', () => {
    const f = fixture('books', { compactMode: true, menuPresent: false });
    f.random.getBoundingClientRect = () => ({ top: 77, bottom: 121, height: 44 });
    f.listeners.get('scroll')(); f.flush();
    assert.equal(f.dock.hidden, true);
    f.random.getBoundingClientRect = () => ({ top: 75, bottom: 119, height: 44 });
    f.listeners.get('scroll')(); f.flush();
    assert.equal(f.dock.hidden, false);
});

for (const kind of ['books', 'gratitude']) {
    test(`${kind}: dock remains available while the primary random action is partially hidden`, () => {
        const f = fixture(kind);
        f.controls.getBoundingClientRect = () => ({ top: 60, bottom: 130, height: 70 });
        f.random.getBoundingClientRect = () => ({ top: 70, bottom: 114, height: 44 });
        f.listeners.get('scroll')();
        f.flush();
        assert.equal(f.dock.hidden, false);

        f.random.getBoundingClientRect = () => ({ top: 76, bottom: 120, height: 44 });
        f.listeners.get('scroll')();
        f.flush();
        assert.equal(f.dock.hidden, true);

        f.random.getBoundingClientRect = () => ({ top: 75.5, bottom: 119.5, height: 44 });
        f.listeners.get('scroll')();
        f.flush();
        assert.equal(f.dock.hidden, false);
    });

    test(`${kind}: Escape retains the dock when the primary action is clipped`, () => {
        const f = fixture(kind);
        f.random.getBoundingClientRect = () => ({ top: 71, bottom: 115, height: 44 });
        f.select();
        f.window.scrollY = 494;
        f.escape();
        assert.equal(f.dock.hidden, false);
        assert.equal(f.selected(), undefined);
        assert.equal(f.window.scrollY, 494);
        assert.equal(f.location.hash, '');
    });

    test(`${kind}: dock follows selected content without disabling other entries`, () => {
        const f = fixture(kind);
        f.select();
        assert.equal(f.dock.previousElementSibling, f.cards[0]);
        assert.equal(f.document.activeElement, f.cards[0]);
        f.select(2);
        assert.equal(f.dock.previousElementSibling, f.cards[2]);
        assert.equal(f.cards.some(e => e.hidden || e.attrs.has('inert')), false);
    });

    test(`${kind}: Escape clears focus mode/hash, restores content focus and retains exact scroll coordinates`, () => {
        const f = fixture(kind);
        f.select();
        f.window.scrollX = 9;
        f.window.scrollY = 1234;
        f.shuffle.focus();
        f.escape();
        assert.equal(f.selected(), undefined);
        assert.equal(f.location.hash, '');
        assert.equal(f.location.search, '?preview=1');
        assert.equal(f.window.scrollX, 9);
        assert.equal(f.window.scrollY, 1234);
        assert.equal(f.document.activeElement, f.cards[0]);
        assert.equal(f.dock.hidden, true);
        assert.equal(f.scrolls.at(-1).behavior, 'instant');
    });

    test(`${kind}: Escape preserves existing content focus and cancels pending navigation`, () => {
        const f = fixture(kind);
        f.select(1, false);
        f.cards[2].focus();
        f.window.scrollY = 777;
        assert.equal(f.escape().defaultPrevented, true);
        assert.equal(f.selected(), undefined);
        assert.equal(f.window.scrollY, 777);
        assert.equal(f.document.activeElement, f.cards[2]);
    });

    test(`${kind}: Escape respects already handled events and does nothing outside focus mode`, () => {
        const f = fixture(kind);
        assert.equal(f.escape().defaultPrevented, false);
        f.select();
        f.escape(true);
        assert.equal(f.selected(), f.cards[0]);
    });

    test(`${kind}: Top still returns to the beginning and random button`, () => {
        const f = fixture(kind);
        f.select();
        f.click(f.top);
        assert.equal(f.selected(), undefined);
        assert.equal(f.location.hash, '');
        assert.equal(f.window.scrollY, 0);
        assert.equal(f.document.activeElement, f.random);
    });

    test(`${kind}: invalid hash safely moves focus off the hidden dock`, () => {
        const f = fixture(kind);
        f.select();
        f.shuffle.focus();
        f.location.hash = '#unrelated';
        f.listeners.get('hashchange')();
        f.flush();
        assert.equal(f.dock.hidden, true);
        assert.equal(f.document.activeElement, f.random);
        assert.equal(f.location.hash, '#unrelated');
    });
}
