import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../../site-analytics.js', import.meta.url), 'utf8');
const disabledSource = source.replace("const websiteId = 'fe208afe-7586-4157-8a5c-4d8ac8ae640a';", "const websiteId = '';");
const root = new URL('../../', import.meta.url);

test('the privacy notice loads no analytics adapter or tracking integration', () => {
    const html = readFileSync(new URL('privacy.html', root), 'utf8');
    assert.doesNotMatch(html, /<script\b[^>]*src="[^"]*(?:site-analytics|inflect|umami)|<img\b[^>]*src="https?:/);
});

test('content pages except the privacy notice load the analytics adapter once', () => {
    for (const folder of ['', 'thoughts/']) {
        const directory = new URL(folder, root);
        for (const name of readdirSync(directory).filter(name => name.endsWith('.html') && !['404.html', 'creative.html', 'privacy.html'].includes(name))) {
            const html = readFileSync(new URL(name, directory), 'utf8');
            const prefix = folder ? '../' : '';
            const version = '2';
            const expected = `<script src="${prefix}site-analytics.js?v=${version}" defer></script>`;
            assert.equal(html.split(expected).length - 1, 1, `${folder}${name}`);
        }
    }
});

function setup(code = source, { hostname = 'williswee.com', pathname = '/thoughts/freedom.html' } = {}) {
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
    const window = { location: { hostname, href: `https://${hostname}${pathname}`, origin: `https://${hostname}`, pathname } };
    const context = { document, window, Element, URL };
    vm.runInNewContext(code, context);
    return { window, scripts, Element, click: target => listeners.get('click')?.({ target }),
        input: (value, id = 'note-message') => listeners.get('input')?.({ target: { id, value } }),
        loaded: () => scriptListeners.get('load')?.(), again: () => vm.runInNewContext(code, context) };
}

test('previews and the published development source never load the tracker', () => {
    for (const hostname of ['localhost', '127.0.0.1', 'example.com']) {
        const page = setup(source, { hostname });
        assert.equal(page.scripts.length, 0);
        assert.equal(page.window.siteAnalytics, undefined);
    }
    assert.equal(setup(source, { pathname: '/chix-run/source/index.html' }).scripts.length, 0);
});

test('duplicate adapter execution cannot add another automatic pageview loader', () => {
    const page = setup();
    page.again();
    assert.equal(page.scripts.length, 1);
});

test('the public tracking helper rejects personal content and unknown events', () => {
    const page = setup();
    const events = [];
    page.window.umami = { track: (...args) => events.push(args) };
    for (const name of ['A private coaching message', 'someone@example.com', { email: 'someone@example.com' }, 'unknown_event']) {
        page.window.siteAnalytics.track(name);
    }
    assert.deepEqual(events, []);
    page.window.siteAnalytics.track('coaching_note_sent');
    assert.deepEqual(events, [['coaching_note_sent']]);
});

test('extensionless Coaching links preserve incoming and note-link event semantics', () => {
    const page = setup(source, { pathname: '/coaching' });
    const events = [];
    page.window.umami = { track: name => events.push(name) };
    page.click(new page.Element({ href: '/coaching.html' }));
    page.click(new page.Element({ href: '#send-a-note' }));
    assert.deepEqual(events, ['coaching_note_link_click']);
});

test('all standalone demos retain one shared loader without another Umami integration', () => {
    for (const path of ['chix-run/index.html', '3d-floorplan/index.html', 'orbit/index.html']) {
        const html = readFileSync(new URL(path, root), 'utf8');
        assert.equal((html.match(/<script src="\/site-analytics\.js\?v=2" defer><\/script>/g) ?? []).length, 1, path);
        assert.doesNotMatch(html, /cloud\.umami\.is|data-umami-event/, path);
    }
});

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
    assert.equal(page.scripts[0].dataset.doNotTrack, 'true');
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

test('coaching section, skip, and self links do not count as incoming CTAs', () => {
    const page = setup();
    const events = [];
    page.window.location.href = 'https://williswee.com/coaching.html';
    page.window.location.pathname = '/coaching.html';
    page.window.umami = { track: name => events.push(name) };

    for (const href of [
        '#who-its-for', '#what-we-can-work-on', '#about-me', '#wall-of-love', '#faq',
        '#main-content', '#how-it-works', '#cancellations', 'coaching.html',
        '/coaching.html#faq', 'https://williswee.com/coaching.html#faq'
    ]) {
        page.click(new page.Element({ href }));
    }
    assert.deepEqual(events, []);

    page.click(new page.Element({ href: '#send-a-note' }));
    page.click(new page.Element({ href: 'https://intro.co/williswee' }));
    assert.deepEqual(events, ['coaching_note_link_click', 'coaching_booking_click']);
});

test('links entering coaching still count from home, guide, and essays', () => {
    for (const pathname of ['/index.html', '/guide.html', '/thoughts/freedom.html']) {
        const page = setup();
        const events = [];
        page.window.location.href = `https://williswee.com${pathname}`;
        page.window.location.pathname = pathname;
        page.window.umami = { track: name => events.push(name) };
        page.click(new page.Element({ href: '/coaching.html#faq' }));
        assert.deepEqual(events, ['coaching_cta_click'], pathname);
    }
});
