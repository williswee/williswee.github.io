import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const pages = [
    ...readdirSync(root).filter(name => name.endsWith('.html')),
    ...readdirSync(new URL('thoughts/', root))
        .filter(name => name.endsWith('.html'))
        .map(name => `thoughts/${name}`)
].sort();
const read = name => readFileSync(new URL(name, root), 'utf8');
const trackingPixel = /<img\b[^>]*\bsrc="https:\/\/www\.useinflect\.ai\/api\/bot-traffic\/pixel\?[^" ]+"[^>]*>/g;

test('public documents keep image content out of the head', () => {
    assert.equal(pages.length, 46, 'update route coverage when adding a public page');
    for (const name of pages) {
        const html = read(name);
        const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1];
        assert.notEqual(head, undefined, `${name}: missing explicit head`);
        assert.doesNotMatch(head, /<img\b/i, `${name}: images belong inside the body`);
        assert.match(html, /<\/head>\s*<body\b[^>]*>/, `${name}: keep an explicit head/body boundary`);
    }
});

test('each analytics-enabled page retains one hidden body pixel and its async head script', () => {
    let trackedPages = 0;
    for (const name of pages) {
        const html = read(name);
        const pixels = [...html.matchAll(trackingPixel)];
        const scripts = html.match(/<script\b[^>]*\bsrc="https:\/\/www\.useinflect\.ai\/inflect-tracking\.js"[^>]*><\/script>/g) ?? [];
        if (name === 'gratitude.html') {
            assert.equal(pixels.length, 0, `${name}: do not add unapproved analytics`);
            assert.equal(scripts.length, 0, `${name}: do not add unapproved analytics`);
            continue;
        }
        trackedPages += 1;
        assert.equal(pixels.length, 1, `${name}: expected exactly one tracking pixel`);
        const pixel = pixels[0];
        const bodyStart = html.indexOf('>', html.indexOf('<body'));
        assert.ok(pixel.index > bodyStart && pixel.index < html.indexOf('</body>'), `${name}: tracking image must be in the body`);
        assert.match(pixel[0], /\balt=""/);
        assert.match(pixel[0], /\bwidth="1" height="1"/);
        assert.match(pixel[0], /\breferrerpolicy="unsafe-url"/);
        assert.match(pixel[0], /\bhidden(?:\s|\/?>)|style="display:none;"|class="tracking-pixel"/, `${name}: pixel must remain hidden`);
        assert.match(pixel[0], /\?tk=inf_bWe3IXqMv5LxpnXkr-dLkOJpf14UfKm7&(?:amp;)?iv=2026-08-12\.1"/);
        assert.equal(scripts.length, 1, `${name}: analytics script must be retained once`);
        assert.match(scripts[0], /\basync\b/);
        assert.ok(html.indexOf(scripts[0]) < html.indexOf('</head>'), `${name}: keep the async script in the head`);
    }
    assert.equal(trackedPages, 45);
});

test('reading pages and the Gratitude renderer use the current shared cache tags', () => {
    let readingPages = 0;
    for (const name of pages) {
        const html = read(name);
        if (name === 'index.html') continue;
        readingPages += 1;
        const readingStyles = name === 'thoughts/index.html'
            ? /reading-room\.css\?v=1\.10"/g
            : /reading-room\.css\?v=1\.9"/g;
        assert.equal((html.match(readingStyles) ?? []).length, 1, name);
        assert.equal((html.match(/reading-nav\.js\?v=1\.2"/g) ?? []).length, 1, name);
        const navScript = html.match(/<script\b[^>]*src="(?:\.\.\/)?reading-nav\.js\?v=1\.2"[^>]*><\/script>/)?.[0];
        assert.ok(navScript, `${name}: missing shared navigation bootstrap`);
        assert.doesNotMatch(navScript, /\b(?:defer|async|type)\b/, `${name}: navigation must initialize before body paint`);
        assert.ok(html.indexOf(navScript) < html.indexOf('</head>'), `${name}: bootstrap belongs in the head`);
    }
    assert.equal(readingPages, 45);
    assert.match(read('books.html'), /books-game\.css\?v=1\.5"/);
    assert.match(read('gratitude.html'), /gratitude-game\.css\?v=1\.4"/);
    const renderer = read('scripts/render-gratitude.mjs');
    assert.match(renderer, /reading-room\.css\?v=1\.9"/);
    assert.match(renderer, /gratitude-game\.css\?v=1\.4"/);
    assert.match(renderer, /<script src="reading-nav\.js\?v=1\.2"><\/script>/);
});

test('updated top-level routes have sitemap dates at least as recent as their redesign', () => {
    const sitemap = read('sitemap.xml');
    for (const route of ['', 'guide.html', 'work.html', 'books.html']) {
        const location = `<loc>https://www.williswee.com/${route}</loc>`;
        const block = sitemap.split('<url>').find(entry => entry.includes(location));
        assert.ok(block, `missing sitemap route: ${route || '/'}`);
        const date = block.match(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/)?.[1];
        assert.ok(date && date >= '2026-09-16', `${route || '/'}: stale lastmod`);
    }
});
