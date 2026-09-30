import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../../site-analytics.js', import.meta.url), 'utf8');
const disabledSource = source.replace("const websiteId = 'fe208afe-7586-4157-8a5c-4d8ac8ae640a';", "const websiteId = '';");
const root = new URL('../../', import.meta.url);

test('every public content page loads the analytics adapter once', () => {
    for (const folder of ['', 'thoughts/']) {
        const directory = new URL(folder, root);
        for (const name of readdirSync(directory).filter(name => name.endsWith('.html') && name !== '404.html')) {
            const html = readFileSync(new URL(name, directory), 'utf8');
            const prefix = folder ? '../' : '';
            const expected = `<script src="${prefix}site-analytics.js?v=1" defer></script>`;
            assert.equal(html.split(expected).length - 1, 1, `${folder}${name}`);
        }
    }
});

function setup(code = source) {
    const listeners = new Map();
    const scriptListeners = new Map();
    const scripts = [];
    class Element {
        constructor({ href, selectors = [] } = {}) {
            this.href = href;
            this.selectors = selectors;
        }
        closest(selector) {
            if (selector === 'a[href]' && this.href) return this;
            return this.selectors.includes(selector) ? this : null;
        }
        getAttribute(name) { return name === 'href' ? this.href : null; }
    }
    const document = {
        createElement(name) {
            assert.equal(name, 'script');
            return {
                dataset: {},
                addEventListener(type, callback) { scriptListeners.set(type, callback); }
            };
        },
        head: { append(script) { scripts.push(script); } },
        addEventListener(type, callback) { listeners.set(type, callback); }
    };
    const window = { location: { href: 'https://williswee.com/thoughts/freedom.html', origin: 'https://williswee.com', pathname: '/thoughts/freedom.html' } };
    vm.runInNewContext(code, { document, window, Element, URL });
    return { window, scripts, Element, click: target => listeners.get('click')?.({ target }),
        input: (value, id = 'note-message') => listeners.get('input')?.({ target: { id, value } }),
        loaded: () => scriptListeners.get('load')?.() };
}

test('analytics stays off until a public website ID is supplied', () => {
    const page = setup(disabledSource);
    assert.equal(page.scripts.length, 0);
    assert.equal(page.window.siteAnalytics, undefined);
});

test('the loader limits collection to this site and excludes URL query and hash values', () => {
    const page = setup();
    assert.equal(page.scripts.length, 1);
    assert.equal(page.scripts[0].src, 'https://cloud.umami.is/script.js');
    assert.equal(page.scripts[0].dataset.websiteId, 'fe208afe-7586-4157-8a5c-4d8ac8ae640a');
    assert.equal(page.scripts[0].dataset.domains, 'williswee.com,www.williswee.com');
    assert.equal(page.scripts[0].dataset.excludeSearch, 'true');
    assert.equal(page.scripts[0].dataset.excludeHash, 'true');
});

test('coaching journey emits only named events and never note text', () => {
    const page = setup();
    const events = [];
    page.window.umami = { track: (...args) => events.push(args) };

    page.click(new page.Element({ href: '../coaching.html' }));
    page.window.location.href = 'https://williswee.com/coaching.html';
    page.window.location.pathname = '/coaching.html';
    page.click(new page.Element({ href: '#send-a-note' }));
    page.input('   ');
    page.input('My private coaching challenge');
    page.input('More private details');
    page.click(new page.Element({ selectors: ['[data-note-submit]'] }));
    page.window.siteAnalytics.track('coaching_note_sent');
    page.click(new page.Element({ href: 'https://intro.co/williswee' }));

    assert.deepEqual(events.map(([name]) => name), [
        'coaching_cta_click', 'coaching_note_link_click', 'coaching_note_started',
        'coaching_note_send_click', 'coaching_note_sent', 'coaching_booking_click'
    ]);
    assert.ok(events.every(args => args.length === 1), 'event properties could expose form values');
});

test('an early notes-start event waits for the tracker to load', () => {
    const page = setup();
    page.input('A private note');
    const events = [];
    page.window.umami = { track: name => events.push(name) };
    page.loaded();
    assert.deepEqual(events, ['coaching_note_started']);
});
