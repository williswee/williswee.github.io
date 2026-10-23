import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { planStructuredData, syncStructuredData } from '../sync-structured-data.mjs';

const site = 'https://williswee.com/';
const profiles = ['https://www.linkedin.com/in/williswee/', 'https://github.com/williswee',
    'https://x.com/williswee', 'https://williswee.substack.com', 'https://intro.co/williswee'];
const articleBody = '<p>Original prose, links, and <strong>emphasis</strong>.</p>';
const date = '<p class="article-date">19 August 2026</p>';

function breadcrumb(title) {
    return '<nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li>' +
        '<li><a href="/thoughts/">Writing</a></li>' +
        `<li><span aria-current="page">${title}</span></li></ol></nav>`;
}

function page(path, body, { essay = false, description = 'An existing description.', title = 'Existing title — Willis Wee' } = {}) {
    return `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <title>${title}</title>\n` +
        `    <meta content="${description}" name="description">\n` +
        `    <link href="${site}${path === 'index.html' ? '' : path}" rel="canonical">\n` +
        `    <meta property="og:image" content="${site}avatar.png">\n` +
        '    <script src="existing.js" defer></script>\n</head>\n' +
        `<body${essay ? ' class="essay-page"' : ''}>${body}</body>\n</html>\n`;
}

async function fixture(t) {
    const root = await mkdtemp(join(tmpdir(), 'willis-structured-data-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    await mkdir(join(root, 'thoughts'));
    await mkdir(join(root, 'images'));
    const sources = {
        'index.html': page('index.html', '<h1>Willis Wee</h1>' + profiles.map(url => `<a href="${url}">Profile</a>`).join('') +
            '<a href="https://example.com/other">Unrelated</a>'),
        'coaching.html': page('coaching.html', '<main><h1>Coaching as comrades</h1><p>Existing service copy.</p></main>'),
        'thoughts/index.html': page('thoughts/', '<h1>Writing</h1><ul id="article-list"><li><a href="first.html">First</a></li><li><a href="second.html">Second</a></li></ul>'),
        'thoughts/first.html': page('thoughts/first.html', '<div aria-hidden="true"><img src="../images/scenery.webp" alt="Scenery"></div>' +
            breadcrumb('Two ways &amp; &lt;choices&gt;') +
            '<article><h1>Two <em>ways</em> &amp; &#x3C;choices&#x3E;</h1>' + date +
            '<div hidden><img src="../images/hidden.webp" alt="Hidden"></div>' +
            '<img src="../avatar.png" alt="Willis Wee">' +
            '<img src="../images/decorative.webp" alt="">' +
            '<img src="../images/tiny.gif" alt="Tracking" width="1" height="1">' +
            '<figure><img src="../images/hero.webp" alt="The existing article hero" width="1000" height="700"></figure>' +
            '<img src="../images/later.webp" alt="Later image">' + articleBody + '</article>', { essay: true }),
        'thoughts/second.html': page('thoughts/second.html', breadcrumb('Without an image') +
            '<article><h1>Without an image</h1><p class="article-date">8 May 2023</p>' + articleBody + '</article>', { essay: true }),
        '404.html': '<p>Not an article.</p>',
        'work.html': '<p>Not an article.</p>',
        'gratitude.html': '<p>Generated elsewhere.</p>'
    };
    for (const [path, html] of Object.entries(sources)) await writeFile(join(root, path), html);
    await mkdir(join(root, 'chix-run'));
    await writeFile(join(root, 'chix-run/index.html'), '<p>Game, not an article.</p>');
    await writeFile(join(root, 'images/hero.webp'), 'fixture-image');
    return { root, sources, read: path => readFile(join(root, path), 'utf8'),
        write: (path, html) => writeFile(join(root, path), html) };
}

function jsonFrom(html) {
    const matches = [...html.matchAll(/<script type="application\/ld\+json" id="structured-data">([\s\S]*?)<\/script>/g)];
    assert.equal(matches.length, 1);
    return JSON.parse(matches[0][1]);
}

function schemaNode(data, type = 'BlogPosting') {
    const nodes = data['@graph'] ?? [data];
    return nodes.find(node => node['@type'] === type);
}

function withoutManagedBlock(html) {
    return html.replace(/    <script type="application\/ld\+json" id="structured-data">[\s\S]*?<\/script>\r?\n/, '');
}

test('uses visible essay facts and one identity, with no invented metadata', async t => {
    const f = await fixture(t);
    const plans = await planStructuredData({ root: f.root });
    assert.deepEqual(plans.map(plan => plan.path), ['index.html', 'coaching.html', 'thoughts/index.html', 'thoughts/first.html', 'thoughts/second.html']);
    const [home, coaching, archive] = plans.map(plan => plan.data);
    const [first, second] = plans.slice(3).map(plan => schemaNode(plan.data));
    assert.equal(home['@type'], 'ProfilePage');
    assert.deepEqual(home.mainEntity, { '@type': 'Person', '@id': `${site}#person`, name: 'Willis Wee', url: site, sameAs: profiles });
    assert.equal(coaching['@type'], 'WebPage');
    assert.equal(coaching.about['@id'], home.mainEntity['@id']);
    assert.equal(archive['@type'], 'CollectionPage');
    assert.equal(first['@type'], 'BlogPosting');
    assert.equal(first.headline, 'Two ways & <choices>');
    assert.equal(first.description, 'An existing description.');
    assert.equal(first.datePublished, '2026-08-19');
    assert.equal(first.mainEntityOfPage, `${site}thoughts/first.html`);
    assert.equal(first['@id'], `${site}thoughts/first.html#article`);
    assert.equal(first.image, `${site}images/hero.webp`);
    assert.deepEqual(first.author, { '@type': 'Person', '@id': `${site}#person`, name: 'Willis Wee', url: site });
    assert.equal(second.datePublished, '2023-05-08');
    assert.ok(!('image' in second), 'an imageless essay must not borrow the OG avatar');
    for (const { data } of plans) {
        for (const node of data['@graph'] ?? [data]) {
            for (const key of ['dateModified', 'publisher', 'review', 'aggregateRating', 'offers']) assert.ok(!(key in node));
            if (node['@type'] !== 'BreadcrumbList') assert.equal(node.inLanguage, 'en');
        }
    }
});

test('synchronization preserves every byte outside the managed block and never touches excluded pages', async t => {
    const f = await fixture(t);
    const result = await syncStructuredData({ root: f.root });
    assert.equal(result.pages, 5);
    assert.equal(result.essays, 2);
    assert.equal(result.changed.length, 5);
    for (const path of result.changed) {
        const output = await f.read(path);
        assert.equal(withoutManagedBlock(output), f.sources[path], path);
        jsonFrom(output);
    }
    for (const path of ['404.html', 'work.html', 'gratitude.html']) assert.equal(await f.read(path), f.sources[path]);
    assert.equal(await f.read('chix-run/index.html'), '<p>Game, not an article.</p>');
    const firstOutput = await f.read('thoughts/first.html');
    assert.ok(firstOutput.includes(articleBody));
    assert.ok(firstOutput.includes(date));
    assert.deepEqual((await syncStructuredData({ root: f.root })).changed, []);
    assert.equal(await f.read('thoughts/first.html'), firstOutput);
    assert.deepEqual((await syncStructuredData({ root: f.root, check: true })).changed, []);
});

test('--check reports missing and stale data without writing, and synchronization updates only managed output', async t => {
    const f = await fixture(t);
    await assert.rejects(syncStructuredData({ root: f.root, check: true }), /Structured data is stale/);
    assert.equal(await f.read('index.html'), f.sources['index.html']);
    await syncStructuredData({ root: f.root });
    const changedSource = (await f.read('thoughts/second.html'))
        .replace('Without an image</h1>', 'A revised visible heading</h1>')
        .replace('Without an image</span>', 'A revised visible heading</span>');
    await f.write('thoughts/second.html', changedSource);
    await assert.rejects(syncStructuredData({ root: f.root, check: true }), /thoughts\/second\.html/);
    assert.equal(await f.read('thoughts/second.html'), changedSource);
    assert.deepEqual((await syncStructuredData({ root: f.root })).changed, ['thoughts/second.html']);
    const updated = await f.read('thoughts/second.html');
    assert.equal(schemaNode(jsonFrom(updated)).headline, 'A revised visible heading');
    assert.equal(schemaNode(jsonFrom(updated), 'BreadcrumbList').itemListElement[2].name, 'A revised visible heading');
    assert.equal(withoutManagedBlock(updated), withoutManagedBlock(changedSource));
});

for (const [name, change, expected] of [
    ['impossible visible date', html => html.replace('8 May 2023', '31 February 2023'), /Invalid publication date/],
    ['wrong canonical', html => html.replace('href="https://williswee.com/thoughts/second.html"', 'href="https://example.com/wrong"'), /Canonical must be/],
    ['missing description', html => html.replace(/<meta content="[^"]*" name="description">/, ''), /meta description/],
    ['nonarticle template', html => html.replace('class="essay-page"', ''), /essay template/],
    ['missing headline', html => html.replace(/<h1>[\s\S]*?<\/h1>/, ''), /article H1/],
    ['missing local image', html => html.replace('</article>', '<img src="../images/missing.webp" alt="Missing"></article>'), /does not resolve/]
]) {
    test(`rejects ${name} before writing any page`, async t => {
        const f = await fixture(t);
        await f.write('thoughts/second.html', change(f.sources['thoughts/second.html']));
        await assert.rejects(syncStructuredData({ root: f.root }), expected);
        assert.equal(await f.read('index.html'), f.sources['index.html']);
        assert.equal(await f.read('coaching.html'), f.sources['coaching.html']);
        assert.equal(await f.read('thoughts/first.html'), f.sources['thoughts/first.html']);
    });
}

for (const href of ['first.html', '../coaching.html', 'index.html', 'https://example.com/article.html']) {
    test(`rejects duplicate or unsafe archive inclusion ${href}`, async t => {
        const f = await fixture(t);
        await f.write('thoughts/index.html', f.sources['thoughts/index.html'].replace('href="second.html"', `href="${href}"`));
        await assert.rejects(syncStructuredData({ root: f.root }), /unique local essay links/);
        assert.equal(await f.read('index.html'), f.sources['index.html']);
    });
}

test('escapes JSON script termination and preserves entity-decoded source text', async t => {
    const f = await fixture(t);
    const unsafeText = '&lt;/script&gt;&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; text';
    await f.write('thoughts/second.html', f.sources['thoughts/second.html'].replace('An existing description.', unsafeText));
    await syncStructuredData({ root: f.root });
    const output = await f.read('thoughts/second.html');
    const data = schemaNode(jsonFrom(output));
    assert.equal(data.description, '</script><script>alert("x")</script> & text');
    assert.match(output, /\\u003c\/script>/);
    assert.doesNotMatch(output, /<script>alert/);
});

test('supports a visible time element, requires its datetime to agree, and preserves a separate author byline', async t => {
    const f = await fixture(t);
    const byline = '<p class="article-author">By <a href="../index.html">Willis Wee</a></p>';
    const source = f.sources['thoughts/second.html'].replace('<p class="article-date">8 May 2023</p>',
        '<p class="article-date"><time datetime="2023-05-08">8 May 2023</time></p>' + byline);
    await f.write('thoughts/second.html', source);
    await syncStructuredData({ root: f.root });
    assert.equal(schemaNode(jsonFrom(await f.read('thoughts/second.html'))).datePublished, '2023-05-08');
    assert.ok((await f.read('thoughts/second.html')).includes(byline));
    await f.write('thoughts/second.html', source.replace('datetime="2023-05-08"', 'datetime="2023-05-09"'));
    await assert.rejects(syncStructuredData({ root: f.root }), /disagrees with the visible date/);
});

test('preserves verified remote article URLs and only includes profile links still present on the homepage', async t => {
    const f = await fixture(t);
    await f.write('index.html', f.sources['index.html'].replace(`<a href="${profiles.at(-1)}">Profile</a>`, ''));
    await f.write('thoughts/second.html', f.sources['thoughts/second.html'].replace('</article>',
        '<img src="https://images.example.com/hero.jpg?width=1200&amp;format=webp" alt="Article illustration"></article>'));
    const plans = await planStructuredData({ root: f.root });
    assert.deepEqual(plans[0].data.mainEntity.sameAs, profiles.slice(0, -1));
    assert.equal(schemaNode(plans.at(-1).data).image, 'https://images.example.com/hero.jpg?width=1200&format=webp');
});

test('rejects duplicate managed blocks before writing and preserves CRLF files', async t => {
    const f = await fixture(t);
    await f.write('index.html', f.sources['index.html'].replaceAll('\n', '\r\n'));
    await syncStructuredData({ root: f.root });
    const home = await f.read('index.html');
    assert.equal(withoutManagedBlock(home), f.sources['index.html'].replaceAll('\n', '\r\n'));
    assert.equal(home.replaceAll('\r\n', '').includes('\n'), false);
    const block = home.match(/<script type="application\/ld\+json" id="structured-data">[\s\S]*?<\/script>/)[0];
    await f.write('index.html', home.replace('</head>', `${block}\r\n</head>`));
    await assert.rejects(syncStructuredData({ root: f.root }), /Duplicate managed/);
});


test('headline extraction preserves words across inline markup and handles real line breaks', async t => {
    const f = await fixture(t);
    await f.write('thoughts/second.html', f.sources['thoughts/second.html'].replace('Without an image</h1>',
        'Mis<span>sion</span>-<wbr>driven<br>founders</h1>').replace('Without an image</span>', 'Mission-driven founders</span>'));
    const plans = await planStructuredData({ root: f.root });
    assert.equal(schemaNode(plans.at(-1).data).headline, 'Mission-driven founders');
});

test('archive collection follows the visible list order and labels without including featured links', async t => {
    const f = await fixture(t);
    const source = f.sources['thoughts/index.html']
        .replace('<h1>Writing</h1>', '<h1>Writing</h1><a href="featured.html">Featured separately</a>')
        .replace('<li><a href="first.html">First</a></li><li><a href="second.html">Second</a></li>',
            '<li><a href="second.html">Second &amp; earlier</a></li><li><a href="first.html"><em>First</em> essay</a></li>');
    await f.write('thoughts/index.html', source);
    const plans = await planStructuredData({ root: f.root });
    const archive = plans.find(plan => plan.path === 'thoughts/index.html').data;
    assert.equal(archive.url, `${site}thoughts/`);
    assert.equal(archive.name, 'Existing title — Willis Wee');
    assert.equal(archive.author['@id'], `${site}#person`);
    assert.deepEqual(archive.mainEntity, {
        '@type': 'ItemList', numberOfItems: 2,
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Second & earlier', url: `${site}thoughts/second.html` },
            { '@type': 'ListItem', position: 2, name: 'First essay', url: `${site}thoughts/first.html` }
        ]
    });
});

test('essay breadcrumbs match visible labels, canonical destinations, and the escaped current title', async t => {
    const f = await fixture(t);
    const plans = await planStructuredData({ root: f.root });
    const first = plans.find(plan => plan.path === 'thoughts/first.html').data;
    assert.equal(first['@context'], 'https://schema.org');
    assert.deepEqual(schemaNode(first, 'BreadcrumbList'), {
        '@type': 'BreadcrumbList', '@id': `${site}thoughts/first.html#breadcrumb`,
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: site },
            { '@type': 'ListItem', position: 2, name: 'Writing', item: `${site}thoughts/` },
            { '@type': 'ListItem', position: 3, name: 'Two ways & <choices>', item: `${site}thoughts/first.html` }
        ]
    });
});

for (const [name, change, expected] of [
    ['missing breadcrumbs', html => html.replace(/<nav class="breadcrumbs"[\s\S]*?<\/nav>/, ''), /visible breadcrumb navigation/],
    ['noncanonical archive breadcrumb', html => html.replace('href="/thoughts/"', 'href="/thoughts/index.html"'), /canonical URLs/],
    ['incorrect current breadcrumb', html => html.replace('Without an image</span>', 'Outdated title</span>'), /match the article H1/],
    ['unmarked current breadcrumb', html => html.replace('aria-current="page"', ''), /current essay breadcrumb/]
]) {
    test(`rejects ${name} before writing any metadata`, async t => {
        const f = await fixture(t);
        await f.write('thoughts/second.html', change(f.sources['thoughts/second.html']));
        await assert.rejects(syncStructuredData({ root: f.root }), expected);
        assert.equal(await f.read('index.html'), f.sources['index.html']);
        assert.equal(await f.read('thoughts/index.html'), f.sources['thoughts/index.html']);
    });
}

test('rejects an archive with a conflicting canonical before writing', async t => {
    const f = await fixture(t);
    await f.write('thoughts/index.html', f.sources['thoughts/index.html'].replace(
        'href="https://williswee.com/thoughts/"', 'href="https://williswee.com/thoughts/index.html"'));
    await assert.rejects(syncStructuredData({ root: f.root }), /Canonical must be/);
    assert.equal(await f.read('index.html'), f.sources['index.html']);
});
