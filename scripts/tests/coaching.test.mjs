import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const root = new URL('../../', import.meta.url);
const read = name => readFileSync(new URL(name, root), 'utf8');
const essays = JSON.parse(read('thoughts/essay-manifest.js').match(/Object\.freeze\(([\s\S]*?)\);/)?.[1] ?? 'null');
const booking = 'https://intro.co/williswee';
const invitation = '<span><strong>Founder and stuck on something?</strong> I do <span class="coaching-cta-name">coaching as comrades</span>.</span>';
const nameplate = '<span class="dialogue-nameplate" aria-hidden="true">Willis</span>';
const cards = html => html.match(/<aside class="coaching-cta" aria-label="Coaching">[\s\S]*?<\/aside>/g) ?? [];

test('every essay ends with one coaching invitation before its newsletter', () => {
    assert.ok(Array.isArray(essays) && essays.length, 'missing essay manifest');
    for (const name of essays) {
        const html = read(`thoughts/${name}`);
        const found = cards(html);
        assert.equal(found.length, 1, `${name}: expected one coaching card`);
        assert.match(found[0], /<a href="\.\.\/coaching\.html">/, name);
        assert.ok(found[0].includes(invitation), `${name}: keep the approved invitation copy`);
        assert.ok(found[0].includes(nameplate), `${name}: Willis speaks from the card's nameplate`);
        assert.match(html, /<\/article>\s*(?:<nav class="related-reading"[\s\S]*?<\/nav>\s*)?<aside class="coaching-cta"/, `${name}: the card follows the article and any related reading`);
        assert.ok(html.indexOf(found[0]) < html.indexOf('id="newsletter"'), `${name}: the card precedes the newsletter`);
    }
});

test('the guide closes with the same coaching invitation', () => {
    const html = read('guide.html');
    const found = cards(html);
    assert.equal(found.length, 1);
    assert.match(found[0], /<a href="coaching\.html">/);
    assert.ok(found[0].includes(invitation), 'keep the approved invitation copy');
    assert.ok(found[0].includes(nameplate), 'Willis speaks from the card nameplate');
    assert.ok(html.indexOf(found[0]) < html.indexOf('</main>'), 'keep the card inside the guide content');
});

test('the coaching page leads with a note and keeps direct booking at both ends', () => {
    const html = read('coaching.html');
    const title = html.match(/<h1>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    assert.equal(title, 'Coaching as comrades');
    assert.match(html, /<a class="coaching-invitation" href="#send-a-note">[\s\S]*?<strong>Send me a note<\/strong>/);
    const bookings = html.match(/<p class="coaching-book-direct[^\"]*">[\s\S]*?<\/p>/g) ?? [];
    assert.equal(bookings.length, 2, 'keep booking as a secondary choice in hero and close');
    const introLinks = html.match(/<a\b[^>]*href="https:\/\/intro\.co\/[^"]*"[^>]*>/g) ?? [];
    for (const link of introLinks) {
        assert.match(link, /href="https:\/\/intro\.co\/(?:williswee(?:#[^"]*)?|faq)"/, link);
        assert.match(link, /\btarget="_blank"/, link);
        assert.match(link, /\brel="noopener noreferrer"/, link);
    }
    for (const link of bookings) assert.ok(link.includes(`href="${booking}"`), link);
    for (const control of bookings) {
        assert.match(control, /<span class="visually-hidden"> \(opens in a new tab\)<\/span>/, 'booking controls announce the new tab');
        assert.match(control, /Rates &amp; times on Intro\. 20% goes to charity\./);
    }
});

test('the note form works as native HTML and names each field for accessible email delivery', () => {
    const html = read('coaching.html');
    const form = html.match(/<form id="coaching-note-form"[\s\S]*?<\/form>/)?.[0];
    assert.ok(form, 'missing note form');
    assert.match(form, /action="https:\/\/formspree\.io\/f\/mdekydke" method="POST"/);
    assert.doesNotMatch(form, /\bnovalidate\b/, 'native validation must survive without JavaScript');
    for (const name of ['name', 'email', 'message']) {
        assert.match(form, new RegExp(`<label for="note-${name}">`));
        assert.match(form, new RegExp(`<(?:input|textarea) id="note-${name}" name="${name}"[^>]*\\brequired`));
        assert.match(form, new RegExp(`aria-describedby="[^"]*note-${name}-error`));
        assert.match(form, new RegExp(`id="note-${name}-error"[^>]*hidden`));
    }
    assert.match(form, /name="email" type="email" autocomplete="email"/);
    assert.match(form, /name="_gotcha" tabindex="-1" autocomplete="off"/);
    assert.match(form, /type="submit" data-note-submit>Send note<\/button>/);
    assert.match(form, /id="coaching-note-status"[^>]*role="status"[^>]*aria-live="polite"/);
    assert.ok(html.indexOf(form) > html.indexOf('aria-labelledby="wall-of-love"'));
    assert.match(html, /I’ll reply by email within 3 business days\./);
    assert.match(html, /<script src="coaching-contact\.js\?v=[^"]+" defer><\/script>/);
});

test('every testimonial quotes a named, linked source', () => {
    const quotes = read('coaching.html').match(/<figure class="coaching-quote">[\s\S]*?<\/figure>/g) ?? [];
    assert.ok(quotes.length > 0, 'missing testimonials');
    for (const quote of quotes) {
        assert.match(quote, /<figcaption><a class="dialogue-nameplate" href="https:\/\/[^"]+" target="_blank" rel="noopener noreferrer">[^<]+<svg/, 'name the source with a link');
        assert.match(quote, /<blockquote>\s*<p>“[^”]+”<\/p>\s*<\/blockquote>/, 'quote the testimonial');
    }
});

test('coaching topics stay numbered in order', () => {
    const list = read('coaching.html').match(/<ul class="coaching-topics"[^>]*>([\s\S]*?)<\/ul>/)?.[1];
    assert.ok(list, 'missing coaching topics');
    const items = list.match(/<li>[\s\S]*?<\/li>/g) ?? [];
    const marks = [...list.matchAll(/<span class="coaching-topic-mark" aria-hidden="true">([^<]+)<\/span>/g)].map(([, mark]) => mark);
    assert.ok(items.length > 0);
    assert.deepEqual(marks, items.map((_, index) => `${index + 1}`));
});

test('the desktop rail links to real sections including the note form', () => {
    const html = read('coaching.html');
    const rail = html.match(/<nav class="coaching-rail reading-rail"[\s\S]*?<\/nav>/)?.[0];
    assert.ok(rail, 'missing coaching rail');
    const targets = [...rail.matchAll(/href="#([^"]+)"/g)].map(([, id]) => id);
    assert.ok(targets.length > 0);
    for (const id of targets) assert.match(html, new RegExp(`<h2 id="${id}"(?: [^>]*)?>`), `rail target #${id}`);
    assert.match(rail, /<a class="coaching-rail-contact" href="#send-a-note">Send me a note/);
});

test('coaching page links and link-preview image resolve to published files', () => {
    const html = read('coaching.html');
    const local = [...html.matchAll(/\b(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)]
        .map(([, path]) => path)
        .filter(path => !/^(?:https?:|mailto:)/.test(path));
    assert.ok(local.length > 10, 'expected the page to link its supporting essays');
    for (const path of local) assert.ok(existsSync(new URL(path.replace(/^\//, ''), root)), `missing ${path}`);
    const preview = html.match(/<meta property="og:image" content="https:\/\/williswee\.com\/([^"]+)">/)?.[1];
    assert.ok(preview && existsSync(new URL(preview, root)), 'missing link-preview image');
    assert.match(html, /<meta name="description" content="[^"]+">/);
});

test('homepage, Work, and llms.txt point founders to the coaching page', () => {
    const html = read('index.html');
    assert.match(html, /<a href="coaching\.html">\s*<span class="work-meta">Sessions<\/span>\s*<span><strong>Coaching as comrades<\/strong>/);
    assert.match(html, /<a class="coaching-more" href="coaching\.html">Explore coaching</);
    const now = read('work.html').match(/<section class="timeline-item" id="now"[\s\S]*?<\/section>/)?.[0] ?? '';
    assert.match(now, /<p>I also do <strong><a href="coaching\.html">coaching as comrades<\/a><\/strong> for founders\.<\/p>/);
    assert.match(read('llms.txt'), /\[Coaching\]\(https:\/\/williswee\.com\/coaching\.html\)/);
});

test('coaching uses a full-height portrait and the original wide mobile artwork', () => {
    const html = read('coaching.html');
    const picture = html.match(/<picture>[\s\S]*?<\/picture>/)?.[0];
    assert.ok(picture, 'supply artwork for each layout');
    assert.match(picture, /<source media="\(max-width: 760px\)" srcset="images\/game-world\/coaching-lantern-bench-v1\.webp" width="1774" height="887">/);
    assert.match(picture, /<img src="images\/game-world\/coaching-lantern-bench-portrait-v1\.webp"[^>]*width="768" height="2048"/);
    assert.match(read('thoughts/reading-room.css'), /\.reading-landscape img \{[^}]*width: 100%;[^}]*height: 100%;[^}]*object-fit: cover;/);
    const css = read('coaching-game.css');
    assert.match(css, /\.coaching-landscape picture \{[^}]*width: 100%;[^}]*height: 100%;/);
    assert.doesNotMatch(css, /--coaching-art-width|--coaching-art-top|mask-image/, 'do not shrink or fade the artwork into a vignette');
});

test('coaching crops stay within a full-cover image through resizing and enlarged rail text', () => {
    const fixtures = [
        { name: 'short desktop', compact: false, art: { top: 76, width: 497.7, height: 581 }, railTop: 100, railHeight: 311 },
        { name: 'phone', compact: true, art: { top: 76, width: 390, height: 260 }, paneTop: 304 },
        { name: 'narrow tablet', compact: false, art: { top: 76, width: 230.4, height: 948 }, railTop: 140, railHeight: 443 },
        { name: 'small phone', compact: true, art: { top: 76, width: 320, height: 260 }, paneTop: 304 },
        { name: 'small tablet with mobile pane', compact: true, art: { top: 76, width: 744, height: 320 }, paneTop: 364 },
        { name: 'tall desktop', compact: false, art: { top: 76, width: 378.82, height: 1268 }, railTop: 140, railHeight: 377 },
        { name: 'short desktop after enlarged rail text', compact: false, art: { top: 76, width: 497.7, height: 581 }, railTop: 100, railHeight: 530 },
        { name: 'very wide short desktop', compact: false, art: { top: 76, width: 1024, height: 581 }, railTop: 100, railHeight: 377 }
    ];
    let fixture = fixtures[0];
    const properties = () => {
        const values = new Map();
        return {
            setProperty: (name, value) => values.set(name, value),
            removeProperty: name => values.delete(name),
            getPropertyValue: name => values.get(name) ?? ''
        };
    };
    const art = {
        style: properties(),
        getBoundingClientRect: () => ({ ...fixture.art, left: 0, right: fixture.art.width, bottom: fixture.art.top + fixture.art.height })
    };
    const rail = {
        style: properties(),
        getBoundingClientRect() {
            if (fixture.compact) return { top: 0, bottom: 0, height: 0 };
            const maxHeight = parseFloat(this.style.getPropertyValue('--coaching-rail-room')) || Infinity;
            const height = Math.min(fixture.railHeight, maxHeight);
            return { top: fixture.railTop, bottom: fixture.railTop + height, height };
        }
    };
    const listeners = new Map();
    const document = {
        querySelector: selector => ({ '.coaching-landscape': art, '.coaching-rail': rail })[selector] ?? null,
        querySelectorAll: () => []
    };
    const window = {
        matchMedia: () => ({ matches: fixture.compact }),
        addEventListener(name, listener) {
            const handlers = listeners.get(name) ?? [];
            handlers.push(listener);
            listeners.set(name, handlers);
        }
    };
    runInNewContext(read('coaching-game.js'), { document, window });

    const assertCovered = () => {
        const label = fixture.name;
        const frame = art.getBoundingClientRect();
        const epsilon = .01;
        if (fixture.compact) {
            assert.equal(art.style.getPropertyValue('--coaching-art-offset'), '', `${label}: remove the desktop crop`);
            assert.equal(rail.style.getPropertyValue('--coaching-rail-room'), '', `${label}: remove the desktop rail cap`);
            const scale = Math.max(frame.width / 1774, frame.height / 887);
            const imageLeft = (frame.width - 1774 * scale) * .3;
            const imageTop = frame.top + (frame.height - 887 * scale) * .6;
            assert.ok(imageLeft <= epsilon && imageLeft + 1774 * scale >= frame.width - epsilon, `${label}: cover the full width`);
            assert.ok(imageTop <= frame.top + epsilon && imageTop + 887 * scale >= frame.bottom - epsilon, `${label}: cover the full height`);
            assert.ok(imageLeft + 300 * scale >= -epsilon && imageLeft + 920 * scale <= frame.width + epsilon, `${label}: keep the bench group inside the mobile band`);
            assert.ok(imageTop + 360 * scale >= frame.top - epsilon, `${label}: preserve both heads`);
            assert.ok(imageTop + 748 * scale <= fixture.paneTop + epsilon, `${label}: keep the lantern above the overlapping pane`);
            return;
        }

        const scale = Math.max(frame.width / 768, frame.height / 2048);
        const offset = parseFloat(art.style.getPropertyValue('--coaching-art-offset'));
        const minOffset = frame.height - 2048 * scale;
        assert.ok(Number.isFinite(offset), `${label}: use a finite crop offset`);
        assert.ok(offset >= minOffset - epsilon && offset <= epsilon, `${label}: never reveal an uncovered top or bottom edge`);
        assert.ok(768 * scale >= frame.width - epsilon, `${label}: cover the column width`);
        const railFrame = rail.getBoundingClientRect();
        assert.ok(railFrame.height >= 44, `${label}: keep a usable scrolling rail`);
        const heads = frame.top + offset + 1100 * scale;
        const lanternBase = frame.top + offset + 1510 * scale;
        const lowestOffset = Math.max(minOffset, railFrame.bottom + 24 - frame.top - 1100 * scale);
        const highestOffset = Math.min(0, frame.height - 24 - 1510 * scale);
        if (lowestOffset <= highestOffset) {
            assert.ok(heads >= railFrame.bottom + 24 - epsilon, `${label}: keep the heads below the rail when they fit`);
            assert.ok(lanternBase <= frame.bottom - 24 + epsilon, `${label}: keep the lantern above the viewport edge when it fits`);
        }
        assert.equal(art.style.getPropertyValue('--coaching-art-width'), '', `${label}: do not resize the covered image`);
        assert.equal(art.style.getPropertyValue('--coaching-art-top'), '', `${label}: do not position a detached image`);
    };
    assertCovered();
    assert.ok(listeners.get('resize')?.length, 'adjust cropping when the container changes');
    for (fixture of fixtures.slice(1)) {
        for (const resize of listeners.get('resize')) resize();
        assertCovered();
    }
});

test('the testimonial continue cue stops within five seconds', () => {
    const [, seconds, count] = read('coaching-game.css').match(/animation: coaching-continue ([\d.]+)s [^;]*?(\d+|infinite);/) ?? [];
    assert.ok(seconds && count && count !== 'infinite', 'the continue cue must not loop forever');
    assert.ok(Number(seconds) * Number(count) <= 5, 'WCAG 2.2.2: automatic motion stops within five seconds');
});
