import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../../home-game.js', import.meta.url), 'utf8');
const sceneIds = ['base-camp', 'workshop', 'coaching', 'archive', 'life', 'terminal'];

function fixture({ tops = [0, 1000, 2000, 3000, 4000, 5000], y = 0, height = 844, header = 64, hash = '' } = {}) {
    assert.equal(tops.length, sceneIds.length);
    const listeners = new Map();
    const frames = [];
    const properties = new Map();
    const historyCalls = [];
    let resizeCallback;
    const scenes = tops.map((_, index) => ({
        id: sceneIds[index],
        classList: { toggle: (_name, value) => { scenes[index].current = value; } },
        getBoundingClientRect: () => ({ top: tops[index] - window.scrollY }),
    }));
    const links = scenes.map(scene => ({
        dataset: { level: scene.id },
        addEventListener() {},
        setAttribute: function (name, value) { this[name] = value; },
        removeAttribute: function (name) { delete this[name]; },
    }));
    const root = { classList: { add() {} }, style: { setProperty: (key, value) => properties.set(key, value) }, scrollHeight: tops.at(-1) + 1000 };
    const document = {
        documentElement: root,
        querySelectorAll: selector => selector === '.game-scene' ? scenes : links,
        querySelector: () => ({ getBoundingClientRect: () => ({ bottom: header }) }),
        getElementById: () => null,
    };
    const history = {
        pushState: (...args) => historyCalls.push(['pushState', ...args]),
        replaceState: (...args) => historyCalls.push(['replaceState', ...args]),
    };
    const window = {
        scrollY: y,
        innerHeight: height,
        location: new URL(`https://williswee.com/${hash}`),
        history,
        addEventListener: (event, fn) => listeners.set(event, fn),
        requestAnimationFrame: fn => frames.push(fn),
        ResizeObserver: class { constructor(fn) { resizeCallback = fn; } observe() {} },
    };
    vm.runInNewContext(source, { document, window, history });
    function flush() { while (frames.length) frames.shift()(); }
    return {
        scenes, links, tops, window, root, properties, frames, historyCalls, flush,
        active: () => links.find(link => link['aria-current'] === 'page')?.dataset.level,
        emit: (event, detail = {}) => { listeners.get(event)(detail); flush(); },
        scroll: position => { window.scrollY = position; listeners.get('scroll')(); flush(); },
        resize: () => { resizeCallback(); flush(); },
        queue: event => listeners.get(event)(),
    };
}

function assertCurrent(f, id) {
    assert.equal(f.active(), id);
    assert.deepEqual(f.scenes.filter(scene => scene.current).map(scene => scene.id), [id]);
    assert.deepEqual(f.links.filter(link => link['aria-current']).map(link => link.dataset.level), [id]);
}

test('home starts on the first of six scenes with exactly one current scene and link', () => {
    const f = fixture();
    assert.equal(f.scenes.length, 6);
    assert.equal(f.links.length, 6);
    assertCurrent(f, 'base-camp');
});

test('scrolling through all six scenes makes Coaching current between Work and Notes', () => {
    const f = fixture();
    for (const [position, id] of [[0, 'base-camp'], [950, 'workshop'], [1950, 'coaching'],
        [2950, 'archive'], [3950, 'life'], [4950, 'terminal'], [1950, 'coaching'], [0, 'base-camp']]) {
        f.scroll(position);
        assertCurrent(f, id);
    }
});

test('sections taller than three viewports, including Coaching, activate at enlarged text sizes', () => {
    const f = fixture({ tops: [0, 2131, 5177, 7685, 11002, 13950] });
    for (const [index, id] of sceneIds.entries()) {
        f.scroll(Math.max(0, f.tops[index] - 64));
        assertCurrent(f, id);
    }
});

test('manual scrolling in both directions updates orientation without rewriting the hash or history', () => {
    const f = fixture({ y: 1936, hash: '#coaching' });
    for (const [position, id] of [[3050, 'archive'], [1950, 'coaching'], [950, 'workshop'], [0, 'base-camp']]) {
        f.scroll(position);
        assertCurrent(f, id);
        assert.equal(f.window.location.hash, '#coaching');
        assert.deepEqual(f.historyCalls, []);
    }
});

test('an initial Coaching deep link selects its visible scene and settles again on load', () => {
    const f = fixture({ y: 1936, hash: '#coaching' });
    assertCurrent(f, 'coaching');
    // A late layout shift and the browser's adjusted fragment scroll still point at Coaching.
    f.tops[2] = 2200;
    f.window.scrollY = 2136;
    f.emit('load');
    assertCurrent(f, 'coaching');
    assert.equal(f.window.location.hash, '#coaching');
});

test('pageshow honors back-forward restored scroll positions, even when the stored hash is Coaching', () => {
    const f = fixture({ y: 1936, hash: '#coaching' });
    f.window.scrollY = 3936;
    f.emit('pageshow', { persisted: true });
    assertCurrent(f, 'life');
    f.window.scrollY = 1936;
    f.emit('pageshow', { persisted: true });
    assertCurrent(f, 'coaching');
    assert.equal(f.window.location.hash, '#coaching');
    assert.deepEqual(f.historyCalls, []);
});

test('same-document back and forward hashchange events restore Coaching between adjacent scenes', () => {
    const f = fixture({ y: 936, hash: '#workshop' });
    for (const id of ['coaching', 'archive', 'coaching', 'workshop', 'coaching', 'archive']) {
        // The browser owns fragment navigation and history; this script reflects its scroll position.
        f.window.location.hash = `#${id}`;
        f.window.scrollY = f.tops[sceneIds.indexOf(id)] - 64;
        f.emit('hashchange');
        assertCurrent(f, id);
        assert.equal(f.window.location.hash, `#${id}`);
    }
    assert.deepEqual(f.historyCalls, []);
});

test('text and layout resize recompute Coaching orientation without waiting for a scroll', () => {
    const f = fixture({ y: 2100 });
    assertCurrent(f, 'coaching');
    f.tops.splice(0, 6, 0, 1800, 3900, 6000, 8000, 10000);
    f.resize();
    assertCurrent(f, 'workshop');
    f.tops.splice(0, 6, 0, 900, 1900, 2900, 3900, 4900);
    f.emit('resize');
    assertCurrent(f, 'coaching');
});

test('scroll, resize, and history events coalesce into one frame while progress remains clamped', () => {
    const f = fixture();
    for (const event of ['scroll', 'resize', 'hashchange', 'pageshow', 'load']) f.queue(event);
    assert.equal(f.frames.length, 1);
    f.flush();
    f.scroll(9000);
    assert.equal(f.properties.get('--scene-progress'), '1.0000');
    assertCurrent(f, 'terminal');
    f.scroll(-20);
    assert.equal(f.properties.get('--scene-progress'), '0.0000');
    assertCurrent(f, 'base-camp');
});
