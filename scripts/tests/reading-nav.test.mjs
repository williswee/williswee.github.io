import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../../reading-nav.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../../thoughts/reading-room.css', import.meta.url), 'utf8');

test('shared navigation can shrink and scroll before the mobile breakpoint', () => {
    const baseNav = styles.match(/\.reading-nav\s*\{([^}]+)\}/)[1];
    assert.match(baseNav, /min-width:\s*0\s*;/);
    assert.match(baseNav, /overflow-x:\s*auto\s*;/);
    assert.match(baseNav, /flex:\s*0\s+1\s+auto\s*;/);
    const baseLink = styles.match(/\.reading-nav a\s*\{([^}]+)\}/)[1];
    assert.match(baseLink, /flex:\s*0\s+0\s+auto\s*;/);
});

test('navigation focus ring remains inside its scrollport on every breakpoint', () => {
    assert.match(styles, /\.reading-nav a:focus-visible\s*\{\s*outline-offset:\s*-4px;\s*\}/);
});

function navigationFixture({ width = 280, scrollWidth = 640, scrollLeft = 0, loading = false,
    enhance = false, activeX = 552, activeWidth = 80 } = {}) {
    const listeners = new Map();
    const navListeners = new Map();
    const windowListeners = new Map();
    const frames = [];
    const classes = new Set();
    const properties = new Map();
    const observed = [];
    const scrolls = [];
    let fontReady;
    let resizeObserved;
    let queries = 0;
    const header = {
        getBoundingClientRect: () => ({ left: 0 }),
        classList: { toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name) },
        style: { setProperty: (name, value) => properties.set(name, value) }
    };
    const nav = {
        clientWidth: width,
        clientLeft: 0,
        scrollWidth,
        scrollLeft,
        closest: () => header,
        addEventListener: (type, handler) => navListeners.set(type, handler),
        getBoundingClientRect: () => ({ left: 20, right: 20 + nav.clientWidth, width: nav.clientWidth }),
        scrollBy: options => {
            // Browsers clamp the navigation at the first and last item.
            nav.scrollLeft = Math.max(0, Math.min(nav.scrollWidth - nav.clientWidth, nav.scrollLeft + options.left));
            scrolls.push(options);
        }
    };
    const activeLink = {
        x: activeX,
        getBoundingClientRect: () => {
            const left = 20 + activeLink.x - nav.scrollLeft;
            return { left, right: left + activeWidth, width: activeWidth };
        }
    };
    nav.querySelector = () => activeLink;
    nav.querySelectorAll = () => [activeLink];
    const document = {
        readyState: loading ? 'loading' : 'complete',
        documentElement: { classList: { add: () => {} } },
        addEventListener: (type, handler) => listeners.set(type, handler),
        querySelector: () => { queries += 1; return enhance ? nav : null; },
        fonts: { ready: { then: handler => { fontReady = handler; } } }
    };
    vm.runInNewContext(source, {
        document,
        window: {
            getComputedStyle: () => ({ outlineWidth: '3px', outlineOffset: '5px' }),
            addEventListener: (type, handler) => windowListeners.set(type, handler),
            requestAnimationFrame: handler => frames.push(handler),
            ResizeObserver: class {
                constructor(handler) { resizeObserved = handler; }
                observe(target) { observed.push(target); }
            }
        }
    });
    function focus(x, linkWidth = 80, { nested = false, outside = false } = {}) {
        const link = {
            nav: outside ? {} : nav,
            getBoundingClientRect: () => {
                const left = 20 + x - nav.scrollLeft;
                return { left, right: left + linkWidth, width: linkWidth };
            }
        };
        link.closest = selector => selector === '.reading-nav' ? (outside ? null : nav) : link;
        const target = nested ? { closest: () => link } : link;
        listeners.get('focusin')({ target });
        return link.getBoundingClientRect();
    }
    function flush() {
        assert.ok(frames.length <= 1, 'navigation work shares one queued animation frame');
        frames.splice(0).forEach(handler => handler());
    }
    return { nav, header, activeLink, scrolls, listeners, navListeners, windowListeners,
        classes, properties, observed, focus, flush, frames,
        fontReady: () => fontReady(), resizeObserved: () => resizeObserved(), queries: () => queries };
}

test('does not move a non-overflowing desktop navigation', () => {
    const fixture = navigationFixture({ width: 700, scrollWidth: 700 });
    fixture.focus(620);
    assert.equal(fixture.scrolls.length, 0);
});

test('fully visible links do not cause gratuitous scrolling', () => {
    const fixture = navigationFixture();
    fixture.focus(80);
    assert.equal(fixture.scrolls.length, 0);
});

test('forward focus reveals the entire label and outward focus ring', () => {
    const fixture = navigationFixture();
    const bounds = fixture.focus(278, 80);
    assert.equal(fixture.nav.scrollLeft, 86);
    assert.equal(bounds.right + 8, 300);
    assert.equal(fixture.scrolls[0].behavior, 'instant');
    assert.equal('top' in fixture.scrolls[0], false);
});

test('backward focus reveals the entire label and outward focus ring', () => {
    const fixture = navigationFixture({ scrollLeft: 180 });
    const bounds = fixture.focus(100);
    assert.equal(fixture.nav.scrollLeft, 92);
    assert.equal(bounds.left - 8, 20);
});

test('first and last link focus rings fit when the scroller has 8px edge padding', () => {
    const fixture = navigationFixture({ scrollLeft: 200 });
    assert.equal(fixture.focus(8).left - 8, 20);
    assert.equal(fixture.nav.scrollLeft, 0);
    assert.equal(fixture.focus(552).right + 8, 300);
    assert.equal(fixture.nav.scrollLeft, 360);
});

test('nested content within a link uses the link bounds', () => {
    const fixture = navigationFixture();
    const bounds = fixture.focus(300, 80, { nested: true });
    assert.equal(bounds.right + 8, 300);
});

test('ignores non-link or unrelated focus targets', () => {
    const fixture = navigationFixture();
    fixture.listeners.get('focusin')({ target: { closest: () => null } });
    fixture.focus(300, 80, { outside: true });
    assert.equal(fixture.scrolls.length, 0);
});

test('an oversized label is aligned to its leading edge without oscillating', () => {
    const fixture = navigationFixture();
    assert.equal(fixture.focus(300, 320).left - 8, 20);
    fixture.focus(300, 320);
    assert.equal(fixture.scrolls.length, 1);
});

test('delegated keyboard navigation initializes before the body is parsed', () => {
    const fixture = navigationFixture({ loading: true });
    assert.deepEqual([...fixture.listeners.keys()], ['focusin', 'DOMContentLoaded']);
    assert.equal(fixture.queries(), 0);
    fixture.focus(300);
    assert.equal(fixture.scrolls.length, 1);
});

test('ignores focus targets without element traversal methods', () => {
    const fixture = navigationFixture();
    fixture.listeners.get('focusin')({ target: {} });
    assert.equal(fixture.scrolls.length, 0);
});

test('arrival reveals the active destination and its focus ring without moving the document', () => {
    const fixture = navigationFixture({ enhance: true, loading: true });
    assert.equal(fixture.frames.length, 0);
    fixture.listeners.get('DOMContentLoaded')();
    fixture.flush();
    assert.equal(fixture.nav.scrollLeft, 360);
    assert.equal(fixture.activeLink.getBoundingClientRect().right + 8, 300);
    assert.deepEqual(Object.keys(fixture.scrolls[0]), ['left', 'behavior']);
    assert.equal(fixture.scrolls[0].behavior, 'instant');
    assert.equal(fixture.classes.has('reading-hud--more-before'), true);
    assert.equal(fixture.classes.has('reading-hud--more-after'), false);
    assert.equal(fixture.properties.get('--nav-left'), '20px');
});

test('scroll cues follow the actual horizontal edges and preserve a manually chosen position', () => {
    const fixture = navigationFixture({ enhance: true, activeX: 8 });
    fixture.flush();
    assert.equal(fixture.classes.has('reading-hud--more-before'), false);
    assert.equal(fixture.classes.has('reading-hud--more-after'), true);

    fixture.nav.scrollLeft = 120;
    fixture.navListeners.get('scroll')();
    fixture.flush();
    assert.equal(fixture.classes.has('reading-hud--more-before'), true);
    assert.equal(fixture.classes.has('reading-hud--more-after'), true);

    fixture.fontReady();
    fixture.windowListeners.get('resize')();
    fixture.resizeObserved();
    fixture.flush();
    assert.equal(fixture.nav.scrollLeft, 120);
    assert.equal(fixture.scrolls.length, 0);

    fixture.nav.scrollLeft = 360;
    fixture.navListeners.get('scroll')();
    fixture.flush();
    assert.equal(fixture.classes.has('reading-hud--more-after'), false);
});

test('font and viewport changes keep the active link visible until the visitor explores the row', () => {
    const fixture = navigationFixture({ enhance: true });
    fixture.flush();
    fixture.navListeners.get('scroll')(); // The scroll caused by our initial reveal.
    fixture.nav.clientWidth = 220;
    fixture.windowListeners.get('resize')();
    fixture.flush();
    assert.equal(fixture.nav.scrollLeft, 420);

    fixture.nav.scrollWidth = 720;
    fixture.activeLink.x = 632;
    fixture.fontReady();
    fixture.flush();
    assert.equal(fixture.nav.scrollLeft, 500);
    assert.deepEqual(fixture.observed, [fixture.nav, fixture.header, fixture.activeLink]);
});

test('back-forward restoration retains its horizontal position and refreshes cues', () => {
    const fixture = navigationFixture({ enhance: true });
    fixture.flush();
    fixture.nav.scrollLeft = 80;
    fixture.windowListeners.get('pageshow')({ persisted: true });
    fixture.flush();
    assert.equal(fixture.nav.scrollLeft, 80);
    assert.equal(fixture.classes.has('reading-hud--more-before'), true);
    assert.equal(fixture.classes.has('reading-hud--more-after'), true);
});

test('overflow cues disappear when the entire navigation fits', () => {
    const fixture = navigationFixture({ enhance: true });
    fixture.flush();
    fixture.nav.clientWidth = 700;
    fixture.nav.scrollLeft = 0;
    fixture.resizeObserved();
    fixture.flush();
    assert.equal(fixture.classes.has('reading-hud--more-before'), false);
    assert.equal(fixture.classes.has('reading-hud--more-after'), false);
});
