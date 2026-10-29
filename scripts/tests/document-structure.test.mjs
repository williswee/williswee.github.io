import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const pages = [
    ...readdirSync(root).filter(name => name.endsWith('.html')),
    ...readdirSync(new URL('thoughts/', root))
        .filter(name => name.endsWith('.html'))
        .map(name => `thoughts/${name}`)
].sort();
const read = name => readFileSync(new URL(name, root), 'utf8');
const essayManifest = JSON.parse(read('thoughts/essay-manifest.js').match(/Object\.freeze\(([\s\S]*?)\);/)?.[1] ?? 'null');
const topLevelPages = ['books.html', 'coaching.html', 'play.html', 'gratitude.html', 'guide.html', 'index.html', 'work.html', 'privacy.html'];
// Served by GitHub Pages for missing addresses; never listed in the sitemap.
const utilityPages = ['404.html'];
// Compatibility addresses redirect to their canonical content page.
const redirectPages = ['creative.html'];
// Standalone apps have their own canvas UI and bundled assets.
const standaloneAppPages = ['chix-run/index.html', 'orbit/index.html', '3d-floorplan/index.html'];
// This live route is served separately by Cloudflare; its project is outside this checkout.
const externallyHostedAppPages = ['game'];
const analyticsExcludedPages = new Set(['gratitude.html', 'privacy.html', ...redirectPages]);
const trackingPixel = /<img\b[^>]*\bsrc="https:\/\/www\.useinflect\.ai\/api\/bot-traffic\/pixel\?[^" ]+"[^>]*>/g;

test('public documents keep image content out of the head', () => {
    assert.ok(Array.isArray(essayManifest) && essayManifest.length, 'missing essay manifest');
    assert.equal(new Set(essayManifest).size, essayManifest.length, 'duplicate essay manifest entries');
    assert.deepEqual(pages, [...topLevelPages, ...utilityPages, ...redirectPages, 'thoughts/index.html', ...essayManifest.map(name => `thoughts/${name}`)].sort(),
        'every public document must belong to the site routes or essay manifest');
    const sitemapPages = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => {
        const pathname = new URL(url).pathname.slice(1);
        if (pathname === 'play') return 'play.html';
        return pathname.endsWith('/') || !pathname ? `${pathname}index.html` : pathname;
    }).sort();
    assert.deepEqual(sitemapPages, [...pages.filter(name => !utilityPages.includes(name) && !redirectPages.includes(name)), ...standaloneAppPages, ...externallyHostedAppPages].sort(), 'the sitemap must cover each public content document exactly once');
    for (const name of standaloneAppPages) assert.ok(existsSync(new URL(name, root)), `${name}: missing standalone game`);
    for (const name of pages) {
        const html = read(name);
        const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1];
        assert.notEqual(head, undefined, `${name}: missing explicit head`);
        assert.doesNotMatch(head, /<img\b/i, `${name}: images belong inside the body`);
        assert.match(html, /<\/head>\s*<body\b[^>]*>/, `${name}: keep an explicit head/body boundary`);
    }
});

test('each existing Inflect page retains one hidden body pixel and one async head script', () => {
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
        assert.equal(scripts.length, 1, `${name}: retain the existing integration once`);
        assert.match(scripts[0], /\basync\b/);
        assert.ok(html.indexOf(scripts[0]) < html.indexOf('</head>'), `${name}: keep the async script in the head`);
    }
    assert.equal(trackedPages, pages.length - analyticsExcludedPages.size);
});

test('all content pages load the same progressive navigation assets after their page styles', () => {
    const sharedStyles = read('books.html').match(/reading-room\.css\?v=\d+(?:\.\d+)*/)?.[0];
    assert.ok(sharedStyles, 'shared stylesheet must have a versioned URL');
    const sharedNavigation = read('books.html').match(/\/site-navigation\.js\?v=\d+(?:\.\d+)*/)?.[0];
    const sharedNavigationStyles = read('books.html').match(/\/site-navigation\.css\?v=\d+(?:\.\d+)*/)?.[0];
    assert.ok(sharedNavigation && sharedNavigationStyles, 'shared navigation assets must have versioned root-relative URLs');
    let readingPages = 0;
    for (const name of pages) {
        const html = read(name);
        if (redirectPages.includes(name)) continue;
        if (name !== 'index.html') {
            readingPages += 1;
            const readingStyles = html.match(/reading-room\.css(?:\?[^"\s]*)?/g) ?? [];
            assert.deepEqual(readingStyles, [sharedStyles], `${name}: use the same versioned shared stylesheet`);
        }
        assert.deepEqual(html.match(/\/site-navigation\.js(?:\?[^"\s]*)?/g) ?? [], [sharedNavigation], name);
        assert.deepEqual(html.match(/\/site-navigation\.css(?:\?[^"\s]*)?/g) ?? [], [sharedNavigationStyles], name);
        assert.doesNotMatch(html, /<script\b[^>]*src="[^"]*reading-nav\.js/, `${name}: do not initialize the obsolete scroll menu`);
        const navScript = html.match(/<script\b[^>]*src="\/site-navigation\.js\?v=\d+(?:\.\d+)*"[^>]*><\/script>/)?.[0];
        assert.ok(navScript, `${name}: missing shared navigation enhancement`);
        assert.match(navScript, /\bdefer\b/, `${name}: initialize after the static menu is parsed`);
        assert.ok(html.indexOf(navScript) < html.indexOf('</head>'), `${name}: script belongs in the head`);
        const stylesheets = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)];
        assert.equal(stylesheets.at(-1)?.[1], sharedNavigationStyles, `${name}: shared navigation overrides page-specific header styles`);
    }
    assert.equal(readingPages, pages.length - 1 - redirectPages.length);
    assert.match(read('books.html'), /books-game\.css\?v=\d+(?:\.\d+)*"/);
    const gratitudeStyles = read('gratitude.html').match(/gratitude-game\.css\?v=\d+(?:\.\d+)*/)?.[0];
    assert.ok(gratitudeStyles, 'Gratitude stylesheet must have a versioned URL');
    const renderer = read('scripts/render-gratitude.mjs');
    assert.equal(renderer.match(/reading-room\.css\?v=\d+(?:\.\d+)*/)?.[0], sharedStyles, 'renderer must retain the shared cache tag');
    assert.ok(renderer.includes(`"${gratitudeStyles}"`), 'renderer must retain the Gratitude cache tag');
});

test('updated top-level routes have sitemap dates at least as recent as their redesign', () => {
    const sitemap = read('sitemap.xml');
    for (const route of ['', 'guide.html', 'work.html', 'books.html']) {
        const location = `<loc>https://williswee.com/${route}</loc>`;
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

test('the sitemap and robots.txt use the site\'s own host, so crawlers skip the www redirect', () => {
    const host = `https://${read('CNAME').trim()}/`;
    for (const [, url] of read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)) assert.ok(url.startsWith(host), url);
    assert.match(read('robots.txt'), new RegExp(`^Sitemap: ${host.replaceAll('.', '\\.')}sitemap\\.xml$`, 'm'));
});

test('footer social icons say they open a new tab', () => {
    for (const name of [...pages, 'scripts/render-gratitude.mjs']) {
        for (const [tag] of read(name).matchAll(/<a\b[^>]*class="follow-icon"[^>]*>/g)) {
            assert.match(tag, /target="_blank"/, name);
            assert.match(tag, /aria-label="[^"]+ \(opens in a new tab\)"/, `${name}: announce the new tab`);
        }
    }
});

test('the not-found page works at any depth and stays out of search', () => {
    const html = read('404.html');
    assert.match(html, /<meta name="robots" content="noindex">/);
    const local = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(([, url]) => url).filter(url => !/^(?:https?:|#)/.test(url));
    for (const url of local) {
        assert.ok(url.startsWith('/'), `404.html: ${url} must be root-relative`);
        const pathname = url.split(/[?#]/)[0].slice(1);
        const file = pathname === 'play' ? 'play.html' : pathname.endsWith('/') || !pathname ? `${pathname}index.html` : pathname;
        assert.ok(existsSync(new URL(file, root)), `404.html: missing ${file}`);
    }
    for (const way of ['/', '/thoughts/', '/#terminal']) {
        assert.ok(html.includes(`<a href="${way}"><span>`), `404.html: offer a way back to ${way}`);
    }
});


test('the privacy notice is a standalone utility page with provider details and a direct contact route', () => {
    const html = read('privacy.html');
    assert.match(html, /<link rel="canonical" href="https:\/\/williswee\.com\/privacy\.html">/);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
    assert.match(html, /<h1>Privacy and data use<\/h1>/);
    assert.match(html, /<time datetime="2026-10-29">29 October 2026<\/time>/);
    assert.doesNotMatch(html, /class="essay-page"|<article\b|<form\b|<iframe\b|essay-manifest|newsletter\.js|coaching-contact\.js/);
    assert.doesNotMatch(html, /<script\b[^>]*src="[^"]*(?:site-analytics|inflect|umami)|<img\b[^>]*src="https?:/);
    const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(([, url]) => url);
    assert.deepEqual(scripts, ['/site-navigation.js?v=1']);
    for (const id of ['privacy-notes', 'privacy-visits', 'privacy-subscriptions', 'privacy-requests', 'privacy-contact']) {
        assert.match(html, new RegExp(`<section aria-labelledby="${id}">\\s*<h2 id="${id}">`));
    }
    const links = [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(([, href]) => href);
    for (const url of ['https://formspree.io/legal/privacy-policy/', 'https://joininflect.com/privacy',
        'https://docs.umami.is/docs/tracker-configuration', 'https://substack.com/privacy', 'https://intro.co/policy',
        'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement', 'https://www.cloudflare.com/privacypolicy/',
        '/coaching.html#send-a-note']) assert.ok(links.includes(url), url);
    assert.match(read('coaching.html'), /class="coaching-form-privacy">[\s\S]*?<a href="\/privacy\.html#privacy-notes">Privacy and data use<\/a>/);
    assert.ok(!essayManifest.includes('privacy.html'), 'privacy is outside the article collection');
});
