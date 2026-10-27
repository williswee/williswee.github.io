import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';
import { normalizeNavigation, renderBreadcrumb } from '../site-navigation.mjs';

const root = new URL('../../', import.meta.url);
const read = name => readFileSync(new URL(name, root), 'utf8');
const manifest = JSON.parse(read('thoughts/essay-manifest.js').match(/Object\.freeze\(([\s\S]*?)\);/)[1]);
const essayPages = manifest.map(name => `thoughts/${name}`);
const pages = ['index.html', 'work.html', 'coaching.html', 'books.html', 'play.html', 'guide.html',
    'gratitude.html', '404.html', 'thoughts/index.html', ...essayPages];
const plainText = html => html.replace(/<svg\b[\s\S]*?<\/svg>/g, '').replace(/<br\s*\/?>/g, ' ')
    .replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#(?:0*39|x27);/gi, "'")
    .replace(/&(?:nbsp);/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/\s+/g, ' ').trim();

test('menus are native disclosures whose destinations are present before JavaScript runs', () => {
    for (const name of pages) {
        const html = read(name);
        const header = html.match(/<header\b[^>]*>([\s\S]*?)<\/header>/)?.[1];
        assert.ok(header, name);
        assert.match(header, /<details class="site-menu">\s*<summary\b[^>]*>Menu\s/);
        assert.match(header, /<nav class="site-navigation" aria-label="Main navigation">/);
        assert.match(header, /<details class="site-more"[^>]*>\s*<summary\b[^>]*>More\s/);
        assert.doesNotMatch(header, /\s(?:hidden|inert|disabled)(?:\s|=|>)|aria-hidden="true"[^>]*>\s*<(?:a|nav|details)/,
            `${name}: native menus must remain usable without enhancement`);
        const links = [...header.matchAll(/<a\b([^>]*)>/g)];
        assert.equal(links.length, 11, `${name}: brand, nine destinations, and Subscribe must be static links`);
        const signup = header.match(/<a class="site-subscribe" href="([^"]+)"[^>]*>Subscribe<\/a>/);
        assert.ok(signup, `${name}: a direct signup shortcut must be present`);
        const target = new URL(signup[1], `https://williswee.com/${name}`);
        assert.equal(target.hash, '#newsletter', `${name}: shortcut must lead to the signup section`);
        const targetFile = target.pathname === '/' ? 'index.html' : target.pathname === '/thoughts/'
            ? 'thoughts/index.html' : target.pathname.slice(1);
        assert.match(read(targetFile), /id="newsletter"/, `${name}: target must exist`);
        for (const [, attrs] of links) {
            assert.match(attrs, /\bhref="\//, name);
            assert.doesNotMatch(attrs, /\b(?:onclick|role="button")/, `${name}: keep ordinary link semantics`);
        }
        const currentMore = ['books.html', 'play.html', 'guide.html', 'gratitude.html'].includes(name);
        assert.equal(/<details class="site-more"[^>]*data-current="true"/.test(header), currentMore, name);
    }
});

test('the Writing archive exposes every essay once as an ordinary HTML link', () => {
    const archive = read('thoughts/index.html');
    assert.match(archive, /<h1\b[^>]*>Writing<\/h1>/);
    const list = archive.match(/<ul\b[^>]*id="article-list"[^>]*>([\s\S]*?)<\/ul>/)?.[1];
    assert.ok(list, 'the archive is present without search or JavaScript');
    const actual = [...list.matchAll(/<a\b[^>]*href="([^"]+)"/g)]
        .map(([, href]) => new URL(href, 'https://williswee.com/thoughts/').pathname);
    assert.deepEqual(actual.sort(), essayPages.map(name => `/${name}`).sort());
    assert.equal(new Set(actual).size, manifest.length);
});

test('essay breadcrumbs and their structured data agree on the page and its parent collection', () => {
    for (const name of essayPages) {
        const html = read(name);
        const breadcrumb = html.match(/<nav class="breadcrumbs"[^>]*aria-label="Breadcrumb"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
        assert.ok(breadcrumb, `${name}: visible breadcrumb missing`);
        const items = [...breadcrumb.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(([, content]) => content);
        const title = plainText(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '');
        assert.deepEqual(items.map(plainText), ['Home', 'Writing', title], name);
        assert.match(items[0], /href="\/"/);
        assert.match(items[1], /href="\/thoughts\/"/);
        assert.match(items[2], /aria-current="page"/);
        assert.ok(html.indexOf(breadcrumb) < html.indexOf('<article>'), `${name}: breadcrumb precedes the article`);
        const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
            .flatMap(([, json]) => { const data = JSON.parse(json); return data['@graph'] ?? [data]; });
        const breadcrumbs = schemas.filter(data => data['@type'] === 'BreadcrumbList');
        assert.equal(breadcrumbs.length, 1, name);
        assert.deepEqual(breadcrumbs[0].itemListElement.map(item => [item.position, item.name, item.item]), [
            [1, 'Home', 'https://williswee.com/'],
            [2, 'Writing', 'https://williswee.com/thoughts/'],
            [3, title, `https://williswee.com/${name}`],
        ], name);
        assert.equal(schemas.filter(data => data['@type'] === 'BlogPosting').length, 1, `${name}: retain article metadata`);
    }
});

test('internal Home and Writing links use canonical paths while existing fragments remain valid', () => {
    for (const name of pages) {
        for (const [, href] of read(name).matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
            if (href.startsWith('#')) continue;
            const url = new URL(href, `https://williswee.com/${name}`);
            if (url.origin !== 'https://williswee.com') continue;
            assert.ok(!['/index.html', '/thoughts/index.html'].includes(url.pathname), `${name}: alias ${href}`);
        }
    }
    const home = read('index.html');
    for (const id of ['base-camp', 'workshop', 'coaching', 'archive', 'life', 'terminal']) {
        assert.equal([...home.matchAll(new RegExp(`\\bid="${id}"`, 'g'))].length, 1, `preserve #${id}`);
    }
    const llmsLinks = [...read('llms.txt').matchAll(/\]\((https:\/\/williswee\.com\/[^)]*)\)/g)].map(([, url]) => url);
    for (const route of ['work.html', 'coaching.html', 'thoughts/']) {
        assert.ok(llmsLinks.includes(`https://williswee.com/${route}`), `llms.txt: missing ${route}`);
    }
    const sitemapLinks = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
    assert.equal(new Set(sitemapLinks).size, sitemapLinks.length, 'sitemap must not duplicate canonical pages');
    for (const url of sitemapLinks) {
        const parsed = new URL(url);
        assert.equal(parsed.hash, '', `sitemap must not list homepage sections: ${url}`);
        assert.ok(!['/index.html', '/thoughts/index.html'].includes(parsed.pathname), url);
    }
});

test('navigation synchronization can run repeatedly without changing a published page', () => {
    for (const name of pages) {
        const html = read(name);
        assert.equal(normalizeNavigation(html, name), html, `${name}: generated navigation drift`);
    }
});

test('breadcrumb titles retain line-break word boundaries without splitting inline emphasis', () => {
    for (const lineBreak of ['<br>', '<br />', '<BR>']) {
        const breadcrumb = renderBreadcrumb(`Mis<em>sion</em>-driven${lineBreak}founders &amp; friends`);
        assert.match(breadcrumb, /aria-current="page">Mission-driven founders &amp; friends<\/span>/);
    }
});

test('the Gratitude publisher reproduces the saved page with the same shared navigation', () => {
    const result = spawnSync(process.execPath, ['scripts/render-gratitude.mjs', '--check'], {
        cwd: fileURLToPath(root), encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /outputs are current/);
});

test('normalization preserves article content, query strings, fragments, and external links', () => {
    const article = '<article><h1>A title &amp; a thought</h1><p>Keep <strong>every word</strong>.</p></article>';
    const input = `<!DOCTYPE html><head>\n<link rel="stylesheet" href="reading-room.css">\n</head>
<body class="essay-page"><header class="reading-hud"></header>
<a class="essay-back text-link" href="index.html">Back</a>${article}
<a href="../index.html?source=essay#coaching">Home section</a>
<a href="index.html?source=essay#newsletter">Writing section</a>
<a href="#footnote">Footnote</a><a href="https://example.com/index.html#part">External</a>
<footer class="follow-strip"><a class="footer-home" href="../index.html">Back</a><span>Existing footer</span></footer></body>`;
    const actual = normalizeNavigation(input, 'thoughts/test.html');
    assert.ok(actual.includes(article));
    for (const expected of ['/?source=essay#coaching', '/thoughts/?source=essay#newsletter', '#footnote', 'https://example.com/index.html#part']) {
        assert.ok(actual.includes(`href="${expected}"`), expected);
    }
    assert.ok(actual.includes('<span>Existing footer</span>'));
    assert.equal(normalizeNavigation(actual, 'thoughts/test.html'), actual, 'the second pass must not accumulate markup or whitespace');
});

test('footer normalization preserves social markup, neighboring content, and homepage copyright', () => {
    for (const socialTag of ['div', 'nav', null]) {
        const social = socialTag ? `<span class="follow-strip-label">Follow</span>
<${socialTag} class="follow-strip-icons" aria-label="Follow Willis"><a class="follow-icon" href="https://example.com" target="_blank" rel="noopener noreferrer">Profile</a></${socialTag}>` : '';
        const copyright = '<p>© 2026 Willis Wee</p>';
        const input = `<head>
<link rel="stylesheet" href="reading-room.css">
</head>
<body><header class="reading-hud"></header><footer class="${socialTag ? 'follow-strip' : 'home-footer'}">
<span>Before</span><nav class="site-footer-nav" aria-label="Footer navigation"><a href="/">Home</a></nav>
${social}${copyright}<span>After</span></footer></body>`;
        const actual = normalizeNavigation(input, 'work.html');
        assert.equal((actual.match(/class="site-footer-menu"/g) ?? []).length, 1);
        assert.equal((actual.match(/class="site-footer-social"/g) ?? []).length, socialTag ? 1 : 0);
        assert.ok(actual.includes(copyright), 'retain the existing copyright');
        assert.ok(actual.includes('<span>Before</span>') && actual.includes('<span>After</span>'));
        if (socialTag) assert.ok(actual.includes(social), 'preserve social container, attributes and content');
        assert.equal(normalizeNavigation(actual, 'work.html'), actual, 'normalizing again must not nest menus or wrappers');
    }
});

const runtime = read('site-navigation.js');

function runtimeFixture({ mobile = false, loading = false, missing = false } = {}) {
    const documentEvents = new Map();
    const windowEvents = new Map();
    const mediaEvents = new Map();
    const document = {
        readyState: loading ? 'loading' : 'complete', activeElement: null,
        documentElement: { classList: { add() {} } },
        addEventListener: (name, fn) => documentEvents.set(name, fn),
    };
    function element(parent = null, classes = []) {
        const listeners = new Map();
        return {
            parent, open: false, listeners, classList: { contains: name => classes.includes(name) },
            contains(node) { for (; node; node = node.parent) if (node === this) return true; return false; },
            focus(options) { document.activeElement = this; this.focusOptions = options; },
            addEventListener: (name, fn) => listeners.set(name, fn),
            closest(selector) { return selector === 'a[href]' ? this.link ?? null : null; },
        };
    }
    const header = element();
    const brand = element(header);
    const menu = element(header);
    const menuToggle = element(menu);
    const navigation = element(menu);
    const more = element(navigation);
    const moreToggle = element(more);
    const work = element(navigation);
    const home = element(navigation, ['site-home-link']);
    const books = element(more);
    const outside = element();
    for (const link of [work, home, books]) link.link = link;
    header.querySelector = selector => ({ '.site-menu': menu, '.site-more': more, '.site-navigation': navigation, '.site-brand': brand })[selector];
    menu.querySelector = () => menuToggle;
    more.querySelector = () => moreToggle;
    document.querySelector = () => missing ? null : header;
    const media = { matches: mobile, addEventListener: (name, fn) => mediaEvents.set(name, fn) };
    const window = { matchMedia: () => media, addEventListener: (name, fn) => windowEvents.set(name, fn) };
    vm.runInNewContext(runtime, { document, window });
    const emit = (name, detail = {}) => documentEvents.get(name)?.(detail);
    return { document, header, brand, menu, menuToggle, navigation, more, moreToggle, work, home, books, outside, emit,
        click: target => navigation.listeners.get('click')({ target }),
        resize(value) { media.matches = value; mediaEvents.get('change')(); },
        restore: () => windowEvents.get('pageshow')({ persisted: true }),
        escape({ prevented = false } = {}) {
            const event = { key: 'Escape', defaultPrevented: prevented, preventDefault() { this.defaultPrevented = true; } };
            emit('keydown', event); return event;
        },
    };
}

for (const mobile of [false, true]) {
    test(`${mobile ? 'mobile' : 'desktop'} Escape closes the open disclosure and restores its trigger`, () => {
        const f = runtimeFixture({ mobile });
        assert.equal(f.menu.open, !mobile);
        assert.equal(f.more.open, mobile);
        const disclosure = mobile ? f.menu : f.more;
        const trigger = mobile ? f.menuToggle : f.moreToggle;
        disclosure.open = true;
        f.books.focus();
        assert.equal(f.escape().defaultPrevented, true);
        assert.equal(disclosure.open, false);
        assert.equal(f.document.activeElement, trigger);
        assert.equal(trigger.focusOptions.preventScroll, true);
        assert.equal(f.escape().defaultPrevented, false, 'closed navigation does not consume Escape');
        disclosure.open = true;
        f.escape({ prevented: true });
        assert.equal(disclosure.open, true, 'respect Escape handled by another control');
    });
}

test('outside pointer or focus closes a menu without stealing focus, and links keep native navigation', () => {
    const f = runtimeFixture({ mobile: true });
    for (const event of ['pointerdown', 'focusin']) {
        f.menu.open = true;
        f.outside.focus();
        f.emit(event, { target: f.outside });
        assert.equal(f.menu.open, false);
        assert.equal(f.document.activeElement, f.outside);
        f.menu.open = true;
        f.emit(event, { target: f.books });
        assert.equal(f.menu.open, true, 'interaction inside the menu keeps it open');
    }
    f.click(f.work);
    assert.equal(f.menu.open, false, 'following a link closes the mobile menu without cancelling navigation');
});

test('breakpoint changes keep keyboard focus out of hidden navigation', () => {
    const f = runtimeFixture();
    f.work.focus();
    f.resize(true);
    assert.equal(f.document.activeElement, f.menuToggle);
    assert.equal(f.menu.open, false);
    f.resize(false);
    assert.equal(f.document.activeElement, f.brand);
    f.resize(true);
    f.home.focus();
    f.resize(false);
    assert.equal(f.document.activeElement, f.brand);
    f.resize(true);
    f.books.focus();
    f.resize(false);
    assert.equal(f.document.activeElement, f.moreToggle);
    assert.equal(f.more.open, false);
});

test('late initialization, absent headers, and restored pages preserve usable menus', () => {
    assert.doesNotThrow(() => runtimeFixture({ missing: true }));
    const f = runtimeFixture({ loading: true });
    assert.equal(f.menu.open, false);
    f.emit('DOMContentLoaded');
    assert.equal(f.menu.open, true);
    f.more.open = true;
    f.restore();
    assert.equal(f.menu.open, true);
    assert.equal(f.more.open, false);
});
