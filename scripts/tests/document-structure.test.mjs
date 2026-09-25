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
const essayManifest = JSON.parse(read('thoughts/essay-manifest.js').match(/Object\.freeze\(([\s\S]*?)\);/)?.[1] ?? 'null');
const topLevelPages = ['books.html', 'coaching.html', 'gratitude.html', 'guide.html', 'index.html', 'work.html'];
const analyticsExcludedPages = new Set(['gratitude.html']);
const trackingPixel = /<img\b[^>]*\bsrc="https:\/\/www\.useinflect\.ai\/api\/bot-traffic\/pixel\?[^" ]+"[^>]*>/g;

test('public documents keep image content out of the head', () => {
    assert.ok(Array.isArray(essayManifest) && essayManifest.length, 'missing essay manifest');
    assert.equal(new Set(essayManifest).size, essayManifest.length, 'duplicate essay manifest entries');
    assert.deepEqual(pages, [...topLevelPages, 'thoughts/index.html', ...essayManifest.map(name => `thoughts/${name}`)].sort(),
        'every public document must belong to the site routes or essay manifest');
    const sitemapPages = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => {
        const pathname = new URL(url).pathname.slice(1);
        return pathname.endsWith('/') || !pathname ? `${pathname}index.html` : pathname;
    }).sort();
    assert.deepEqual(sitemapPages, pages, 'the sitemap must cover each public document exactly once');
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
        if (analyticsExcludedPages.has(name)) {
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
    assert.equal(trackedPages, pages.length - analyticsExcludedPages.size);
});

test('reading pages and the Gratitude renderer use the current shared cache tags', () => {
    const sharedStyles = read('books.html').match(/reading-room\.css\?v=\d+(?:\.\d+)*/)?.[0];
    assert.ok(sharedStyles, 'shared stylesheet must have a versioned URL');
    let readingPages = 0;
    for (const name of pages) {
        const html = read(name);
        if (name === 'index.html') continue;
        readingPages += 1;
        const readingStyles = html.match(/reading-room\.css(?:\?[^"\s]*)?/g) ?? [];
        assert.deepEqual(readingStyles, [sharedStyles], `${name}: use the same versioned shared stylesheet`);
        assert.equal((html.match(/reading-nav\.js\?v=1\.2"/g) ?? []).length, 1, name);
        const navScript = html.match(/<script\b[^>]*src="(?:\.\.\/)?reading-nav\.js\?v=1\.2"[^>]*><\/script>/)?.[0];
        assert.ok(navScript, `${name}: missing shared navigation bootstrap`);
        assert.doesNotMatch(navScript, /\b(?:defer|async|type)\b/, `${name}: navigation must initialize before body paint`);
        assert.ok(html.indexOf(navScript) < html.indexOf('</head>'), `${name}: bootstrap belongs in the head`);
    }
    assert.equal(readingPages, pages.length - 1);
    assert.match(read('books.html'), /books-game\.css\?v=\d+(?:\.\d+)*"/);
    const gratitudeStyles = read('gratitude.html').match(/gratitude-game\.css\?v=\d+(?:\.\d+)*/)?.[0];
    assert.ok(gratitudeStyles, 'Gratitude stylesheet must have a versioned URL');
    const renderer = read('scripts/render-gratitude.mjs');
    assert.equal(renderer.match(/reading-room\.css\?v=\d+(?:\.\d+)*/)?.[0], sharedStyles, 'renderer must retain the shared cache tag');
    assert.ok(renderer.includes(`"${gratitudeStyles}"`), 'renderer must retain the Gratitude cache tag');
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

test('portrait pages share one left-column landscape geometry', () => {
    for (const page of ['books', 'coaching', 'gratitude', 'guide', 'work']) {
        assert.match(read(`${page}.html`), new RegExp(`class="reading-landscape reading-landscape--portrait ${page}-landscape"`), page);
        assert.doesNotMatch(read(`${page}-game.css`), new RegExp(`\\.${page}-landscape \\{[^}]*\\bright:`), `${page}: landscape geometry belongs in reading-room.css`);
    }
    assert.match(read('scripts/render-gratitude.mjs'), /class="reading-landscape reading-landscape--portrait gratitude-landscape"/);
});
