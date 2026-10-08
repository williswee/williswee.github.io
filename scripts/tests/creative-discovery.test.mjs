import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../../creative-game.js', import.meta.url), 'utf8');

function fixture({ hash = '', reducedMotion = false, random = () => 0 } = {}) {
    const ids = ['find-the-real-willis', 'googlefluid', 'brain-games'];
    const animations = [];
    const scrolls = [];
    const history = [];
    const windowEvents = new Map();
    const documentEvents = new Map();
    let motionChange;
    let activeElement = null;
    let currentHash = hash;
    let currentSearch = '?preview=1';

    function button() {
        const listeners = new Map();
        const icon = {
            animate(keyframes, options) {
                const animation = { icon, keyframes, options, cancelled: false, cancel() { this.cancelled = true; } };
                animations.push(animation);
                return animation;
            }
        };
        return {
            listeners, icon, hidden: true,
            querySelector: selector => selector === '.random-pick-icon' ? icon : null,
            addEventListener: (type, handler) => listeners.set(type, handler)
        };
    }
    const intro = button();
    const reroll = button();
    const projects = ids.map((id, index) => {
        const classes = new Set();
        const attributes = new Map();
        const actions = {
            append(node) { node.parent = this; }
        };
        const heading = {
            attributes,
            setAttribute: (name, value) => attributes.set(name, value),
            removeAttribute: name => attributes.delete(name),
            focus: options => { activeElement = heading; heading.focusOptions = options; }
        };
        return {
            id, heading, actions,
            classes,
            classList: { toggle: (name, on) => on ? classes.add(name) : classes.delete(name) },
            querySelector: selector => selector === 'h2' ? heading : selector === '.creative-project-actions' ? actions : null,
            getBoundingClientRect: () => ({ top: 300 + index * 100 })
        };
    });
    const location = {
        pathname: '/play',
        get search() { return currentSearch; },
        get hash() { return currentHash; }
    };
    const document = {
        get activeElement() { return activeElement; },
        getElementById: id => id === 'random-project-btn' ? intro : id === 'another-project-btn' ? reroll : null,
        querySelectorAll: selector => selector === '.creative-projects > li[id]' ? projects : [],
        querySelector: selector => selector === '.reading-hud' ? { getBoundingClientRect: () => ({ bottom: 76 }) } : null,
        addEventListener: (type, handler) => documentEvents.set(type, handler)
    };
    const motion = {
        matches: reducedMotion,
        addEventListener: (type, handler) => { if (type === 'change') motionChange = handler; }
    };
    const window = {
        matchMedia: () => motion,
        location,
        scrollY: 200,
        scrollTo: options => scrolls.push(options),
        history: {
            state: null,
            replaceState(_state, _title, url) {
                history.push(url);
                const resolved = new URL(url, 'https://williswee.com/play?preview=1');
                currentHash = resolved.hash;
                currentSearch = resolved.search;
            }
        },
        addEventListener: (type, handler) => windowEvents.set(type, handler)
    };
    vm.runInNewContext(source, { document, window, Math: Object.assign(Object.create(Math), { random }) });
    const picked = () => projects.find(project => project.classes.has('creative-project--picked'));
    return {
        intro, reroll, projects, animations, scrolls, history, motion,
        picked,
        activeElement: () => activeElement,
        setFocus: element => { activeElement = element; },
        click: button => button.listeners.get('click')({ currentTarget: button }),
        changeHash: value => { currentHash = value; windowEvents.get('hashchange')(); },
        escape: () => documentEvents.get('keydown')({ key: 'Escape', defaultPrevented: false }),
        location
    };
}

test('Surprise me visits each project once per cycle, including across a refill boundary', () => {
    let draw = 0;
    // Force the refill draw toward the last project in DOM order. Without the
    // boundary exclusion this would immediately repeat the previous pick.
    const f = fixture({ random: () => draw++ === 3 ? 0.999 : 0 });
    assert.equal(f.intro.hidden, false);
    assert.equal(f.reroll.hidden, true);
    const visits = [];
    for (let i = 0; i < 6; i += 1) {
        f.click(i === 0 ? f.intro : f.reroll);
        visits.push(f.picked().id);
    }
    assert.equal(new Set(visits.slice(0, 3)).size, 3);
    assert.equal(new Set(visits.slice(3, 6)).size, 3);
    assert.notEqual(visits[2], visits[3], 'the first pick of a new cycle must differ from the previous pick');
});

test('a deep link and subsequent hash selection seed the remaining projects', () => {
    const f = fixture({ hash: '#googlefluid' });
    assert.equal(f.picked().id, 'googlefluid');
    assert.equal(f.reroll.parent, f.projects[1].actions);
    assert.equal(f.reroll.hidden, false);
    f.click(f.reroll);
    assert.notEqual(f.picked().id, 'googlefluid');
    const first = f.picked().id;
    f.click(f.reroll);
    assert.notEqual(f.picked().id, first);
    assert.notEqual(f.picked().id, 'googlefluid');
    f.changeHash('#brain-games');
    assert.equal(f.picked().id, 'brain-games');
    f.click(f.reroll);
    assert.notEqual(f.picked().id, 'brain-games');
});

test('both controls move one reroll button, focus the destination, and preserve preview query', () => {
    const f = fixture();
    f.click(f.intro);
    const first = f.picked();
    assert.equal(f.reroll.parent, first.actions);
    assert.equal(f.reroll.hidden, false);
    assert.equal(f.activeElement(), first.heading);
    assert.equal(first.heading.attributes.get('aria-current'), 'location');
    assert.equal(first.heading.focusOptions.preventScroll, true);
    assert.equal(f.location.hash, `#${first.id}`);
    assert.equal(f.location.search, '?preview=1');
    assert.equal(f.scrolls[0].top, 400);
    assert.equal(f.scrolls[0].behavior, 'smooth');
    f.click(f.reroll);
    const second = f.picked();
    assert.notEqual(second, first);
    assert.equal(f.reroll.parent, second.actions);
    assert.equal(first.heading.attributes.has('aria-current'), false);
    assert.equal(second.heading.attributes.get('aria-current'), 'location');
    assert.equal(f.animations[0].cancelled, true);
    assert.equal(f.animations[1].icon, f.reroll.icon);
});

test('Escape preserves focus and scroll except when hiding the focused reroll', () => {
    const f = fixture();
    f.click(f.intro);
    const project = f.picked();
    f.setFocus(f.reroll);
    const scrollCount = f.scrolls.length;
    f.escape();
    assert.equal(f.picked(), undefined);
    assert.equal(f.reroll.hidden, true);
    assert.equal(f.activeElement(), project.heading);
    assert.equal(f.scrolls.length, scrollCount);
    assert.equal(f.location.hash, '');
    assert.equal(f.location.search, '?preview=1');
    f.click(f.intro);
    const other = {};
    f.setFocus(other);
    f.escape();
    assert.equal(f.activeElement(), other);
    assert.equal(f.reroll.hidden, true);
});

test('hash changes protect a focused reroll without stealing other focus or scrolling', () => {
    const f = fixture();
    f.click(f.intro);
    f.setFocus(f.reroll);
    const scrollCount = f.scrolls.length;
    f.changeHash('#brain-games');
    assert.equal(f.activeElement(), f.projects[2].heading);
    assert.equal(f.projects[2].heading.focusOptions.preventScroll, true);
    assert.equal(f.reroll.parent, f.projects[2].actions);
    assert.equal(f.scrolls.length, scrollCount);

    f.setFocus(f.reroll);
    f.changeHash('#unknown-project');
    assert.equal(f.activeElement(), f.projects[2].heading);
    assert.equal(f.reroll.hidden, true);
    assert.equal(f.scrolls.length, scrollCount);

    const elsewhere = {};
    f.setFocus(elsewhere);
    f.changeHash('#googlefluid');
    assert.equal(f.activeElement(), elsewhere);
    assert.equal(f.reroll.parent, f.projects[1].actions);
    assert.equal(fixture({ hash: '#googlefluid' }).activeElement(), null);
});

test('reduced motion skips die animation and uses immediate scrolling', () => {
    const f = fixture({ reducedMotion: true });
    f.click(f.intro);
    f.click(f.reroll);
    assert.equal(f.animations.length, 0);
    assert.ok(f.scrolls.every(scroll => scroll.behavior === 'instant'));
});
