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

function navigationFixture({ width = 280, scrollWidth = 640, scrollLeft = 0, loading = false } = {}) {
    const listeners = new Map();
    const scrolls = [];
    const nav = {
        clientWidth: width,
        clientLeft: 0,
        scrollWidth,
        scrollLeft,
        getBoundingClientRect: () => ({ left: 20, right: 20 + width, width }),
        addEventListener: (type, handler) => listeners.set(type, handler),
        contains: link => link.nav === nav,
        scrollBy: options => {
            // Browsers clamp the navigation at the first and last item.
            nav.scrollLeft = Math.max(0, Math.min(scrollWidth - width, nav.scrollLeft + options.left));
            scrolls.push(options);
        }
    };
    let ready;
    const document = {
        readyState: loading ? 'loading' : 'complete',
        querySelectorAll: () => [nav],
        addEventListener: (type, handler) => {
            assert.equal(type, 'DOMContentLoaded');
            ready = handler;
        }
    };
    vm.runInNewContext(source, {
        document,
        window: { getComputedStyle: () => ({ outlineWidth: '3px', outlineOffset: '5px' }) }
    });
    function focus(x, linkWidth = 80, { nested = false, outside = false } = {}) {
        const link = {
            nav: outside ? {} : nav,
            getBoundingClientRect: () => {
                const left = 20 + x - nav.scrollLeft;
                return { left, right: left + linkWidth, width: linkWidth };
            }
        };
        link.closest = () => link;
        const target = nested ? { closest: () => link } : link;
        listeners.get('focusin')({ target });
        return link.getBoundingClientRect();
    }
    return { nav, scrolls, listeners, focus, ready: () => ready() };
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

test('initializes after parsing when loaded before the navigation', () => {
    const fixture = navigationFixture({ loading: true });
    assert.equal(fixture.listeners.size, 0);
    fixture.ready();
    fixture.focus(300);
    assert.equal(fixture.scrolls.length, 1);
});
