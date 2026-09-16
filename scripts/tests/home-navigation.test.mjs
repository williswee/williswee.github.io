import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../../home-game.js', import.meta.url), 'utf8');

function fixture({ tops = [0, 1000, 2000, 3000, 4000], y = 0, height = 844, header = 64 } = {}) {
    const listeners = new Map();
    const frames = [];
    const properties = new Map();
    let resizeCallback;
    const ids = ['base-camp', 'workshop', 'archive', 'life', 'terminal'];
    const scenes = tops.map((_, index) => ({
        id: ids[index],
        classList: { toggle: (_name, value) => { scenes[index].current = value; } },
        getBoundingClientRect: () => ({ top: tops[index] - window.scrollY }),
    }));
    const links = scenes.map(scene => ({
        dataset: { level: scene.id },
        addEventListener() {},
        setAttribute: function (name, value) { this[name] = value; },
        removeAttribute: function (name) { delete this[name]; },
    }));
    const root = { classList: { add() {} }, style: { setProperty: (key, value) => properties.set(key, value) }, scrollHeight: 6000 };
    const document = {
        documentElement: root,
        querySelectorAll: selector => selector === '.game-scene' ? scenes : links,
        querySelector: () => ({ getBoundingClientRect: () => ({ bottom: header }) }),
        getElementById: () => null,
    };
    const window = {
        scrollY: y,
        innerHeight: height,
        addEventListener: (event, fn) => listeners.set(event, fn),
        requestAnimationFrame: fn => frames.push(fn),
        ResizeObserver: class { constructor(fn) { resizeCallback = fn; } observe() {} },
    };
    vm.runInNewContext(source, { document, window });
    function flush() { while (frames.length) frames.shift()(); }
    return {
        scenes, links, tops, window, root, properties, frames, flush,
        active: () => links.find(link => link['aria-current'] === 'page')?.dataset.level,
        emit: event => { listeners.get(event)(); flush(); },
        scroll: position => { window.scrollY = position; listeners.get('scroll')(); flush(); },
        resize: () => { resizeCallback(); flush(); },
        queue: event => listeners.get(event)(),
    };
}

test('home starts on the first scene and exactly one scene/link is current', () => {
    const f = fixture();
    assert.equal(f.active(), 'base-camp');
    assert.equal(f.scenes.filter(scene => scene.current).length, 1);
    assert.equal(f.links.filter(link => link['aria-current']).length, 1);
});

test('sections taller than three viewports activate at enlarged text sizes', () => {
    const f = fixture({ tops: [0, 2131, 5177, 7685, 9002] });
    for (const [top, id] of [[2131, 'workshop'], [5177, 'archive'], [7685, 'life'], [9002, 'terminal']]) {
        f.scroll(top - 64);
        assert.equal(f.active(), id);
    }
});

test('manual scrolling updates orientation in both directions without changing the hash', () => {
    const f = fixture();
    f.scroll(2050);
    assert.equal(f.active(), 'archive');
    f.scroll(950);
    assert.equal(f.active(), 'workshop');
    f.scroll(0);
    assert.equal(f.active(), 'base-camp');
});

test('initial deep links and restored scroll positions select the visible scene', () => {
    const f = fixture({ y: 3936 });
    assert.equal(f.active(), 'terminal');
    f.window.scrollY = 1936;
    f.emit('pageshow');
    assert.equal(f.active(), 'archive');
    f.window.scrollY = 936;
    f.emit('hashchange');
    assert.equal(f.active(), 'workshop');
});

test('text/layout resize recomputes the visible section without waiting for a scroll', () => {
    const f = fixture({ y: 2100 });
    assert.equal(f.active(), 'archive');
    f.tops.splice(0, 5, 0, 1800, 3900, 5000, 7000);
    f.resize();
    assert.equal(f.active(), 'workshop');
    f.tops.splice(0, 5, 0, 900, 1900, 2900, 3900);
    f.emit('resize');
    assert.equal(f.active(), 'archive');
});

test('scroll/resize events are coalesced into a single frame; progress remains clamped', () => {
    const f = fixture();
    f.queue('scroll');
    f.queue('resize');
    f.queue('hashchange');
    assert.equal(f.frames.length, 1);
    f.flush();
    f.scroll(9000);
    assert.equal(f.properties.get('--scene-progress'), '1.0000');
    f.scroll(-20);
    assert.equal(f.properties.get('--scene-progress'), '0.0000');
});
