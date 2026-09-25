import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

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
        assert.match(html, /<\/article>\s*<aside class="coaching-cta"/, `${name}: the card follows the article directly`);
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

test('the coaching page offers booking at the start and the end', () => {
    const html = read('coaching.html');
    const title = html.match(/<h1>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    assert.equal(title, 'Coaching as comrades');
    const bookings = html.match(/<a class="coaching-booking"[^>]*>/g) ?? [];
    assert.equal(bookings.length, 2);
    const introLinks = html.match(/<a\b[^>]*href="https:\/\/intro\.co\/[^"]*"[^>]*>/g) ?? [];
    for (const link of introLinks) {
        assert.match(link, /href="https:\/\/intro\.co\/williswee(?:#[^"]*)?"/, link);
        assert.match(link, /\btarget="_blank"/, link);
        assert.match(link, /\brel="noopener noreferrer"/, link);
    }
    for (const link of bookings) assert.ok(link.includes(`href="${booking}"`), link);
    assert.ok(bookings.every(link => introLinks.includes(link)), 'booking controls open Intro');
    for (const control of html.match(/<a class="coaching-booking"[\s\S]*?<\/a>/g) ?? []) {
        assert.match(control, /<span class="visually-hidden"> \(opens in a new tab\)<\/span>/, 'booking controls announce the new tab');
    }
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

test('the desktop rail links to real sections and to booking', () => {
    const html = read('coaching.html');
    const rail = html.match(/<nav class="coaching-rail reading-rail"[\s\S]*?<\/nav>/)?.[0];
    assert.ok(rail, 'missing coaching rail');
    const targets = [...rail.matchAll(/href="#([^"]+)"/g)].map(([, id]) => id);
    assert.ok(targets.length > 0);
    for (const id of targets) assert.match(html, new RegExp(`<h2 id="${id}">`), `rail target #${id}`);
    assert.match(rail, new RegExp(`<a class="coaching-rail-booking" href="${booking}" target="_blank" rel="noopener noreferrer">`));
    assert.match(rail, /<span class="visually-hidden"> \(opens in a new tab\)<\/span>/);
});

test('coaching page links and link-preview image resolve to published files', () => {
    const html = read('coaching.html');
    const local = [...html.matchAll(/\b(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)]
        .map(([, path]) => path)
        .filter(path => !/^(?:https?:|mailto:)/.test(path));
    assert.ok(local.length > 10, 'expected the page to link its supporting essays');
    for (const path of local) assert.ok(existsSync(new URL(path, root)), `missing ${path}`);
    const preview = html.match(/<meta property="og:image" content="https:\/\/williswee\.com\/([^"]+)">/)?.[1];
    assert.ok(preview && existsSync(new URL(preview, root)), 'missing link-preview image');
    assert.match(html, /<meta name="description" content="[^"]+">/);
});

test('homepage, Work, and llms.txt point founders to the coaching page', () => {
    const html = read('index.html');
    assert.match(html, /<a href="coaching\.html">\s*<span class="work-meta">Sessions<\/span>\s*<span><strong>Coaching as comrades<\/strong>/);
    assert.match(html, /<a class="coaching-more" href="coaching\.html">More about coaching</);
    const now = read('work.html').match(/<section class="timeline-item" id="now"[\s\S]*?<\/section>/)?.[0] ?? '';
    assert.match(now, /<p>I also do <strong><a href="coaching\.html">coaching as comrades<\/a><\/strong> for founders\.<\/p>/);
    assert.match(read('llms.txt'), /\[Coaching\]\(https:\/\/williswee\.com\/coaching\.html\)/);
});

test('the testimonial continue cue stops within five seconds', () => {
    const [, seconds, count] = read('coaching-game.css').match(/animation: coaching-continue ([\d.]+)s [^;]*?(\d+|infinite);/) ?? [];
    assert.ok(seconds && count && count !== 'infinite', 'the continue cue must not loop forever');
    assert.ok(Number(seconds) * Number(count) <= 5, 'WCAG 2.2.2: automatic motion stops within five seconds');
});
