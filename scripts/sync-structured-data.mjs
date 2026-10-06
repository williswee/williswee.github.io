// Static metadata maintenance. The archive selects essays; each page owns its facts.
// Run without flags to synchronize, or with --check to report stale output only.
import { readFile, stat, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = fileURLToPath(new URL('../', import.meta.url));
const site = 'https://williswee.com/';
const person = { '@type': 'Person', '@id': `${site}#person`, name: 'Willis Wee', url: site };
const profileURLs = [
    'https://www.linkedin.com/in/williswee/',
    'https://github.com/williswee',
    'https://x.com/williswee',
    'https://williswee.substack.com'
];
const scriptId = 'structured-data';
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

function fail(path, message) { throw new Error(`${path}: ${message}`); }

function decodeEntities(value) {
    const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
        lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…', rarr: '→', sup1: '¹' };
    return value.replace(/&(#x[\da-f]+|#\d+|[a-z][\da-z]+);/gi, (entity, name) => {
        if (!name.startsWith('#')) return entities[name.toLowerCase()] ?? entity;
        const point = name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : Number(name.slice(1));
        return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : '�';
    });
}

function contentMarkup(html) {
    return html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
}

function plainText(html) {
    return decodeEntities(contentMarkup(html).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

// The site uses ordinary static HTML. Handle quoted attributes without mistaking
// a '>' in a value for the end of a tag, and never execute HTML or scripts.
function tags(html, name) {
    return [...html.matchAll(/<\/?([a-z][\w:-]*)\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi)]
        .filter(match => !name || match[1].toLowerCase() === name);
}

function attributes(tag) {
    const attrs = {};
    const inside = tag.replace(/^<\/?[\w:-]+/, '').replace(/\/?\s*>$/, '');
    for (const match of inside.matchAll(/([^\s=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
        attrs[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
    }
    return attrs;
}

function elements(html, name) {
    const pattern = new RegExp(`<${name}\\b(?:[^"'<>]|"[^"]*"|'[^']*')*>([\\s\\S]*?)<\\/${name}\\s*>`, 'gi');
    return [...html.matchAll(pattern)];
}

function one(items, path, label) {
    if (items.length !== 1) fail(path, `Expected exactly one ${label}; found ${items.length}.`);
    return items[0];
}

function pageFacts(html, path, expectedCanonical) {
    const clean = contentMarkup(html);
    const head = one(elements(clean, 'head'), path, 'head')[1];
    const canonical = one(tags(head, 'link').filter(tag =>
        (attributes(tag[0]).rel ?? '').toLowerCase().split(/\s+/).includes('canonical')), path, 'canonical link');
    const url = attributes(canonical[0]).href;
    if (url !== expectedCanonical) fail(path, `Canonical must be ${expectedCanonical}.`);
    const title = plainText(one(elements(head, 'title'), path, 'title')[1]);
    const descriptionTag = one(tags(head, 'meta').filter(tag =>
        attributes(tag[0]).name?.toLowerCase() === 'description'), path, 'meta description');
    const description = attributes(descriptionTag[0]).content?.trim();
    const lang = attributes(one(tags(clean, 'html').filter(tag => !tag[0].startsWith('</')), path, 'html element')[0]).lang;
    if (!title || !description) fail(path, 'Title and description must not be empty.');
    if (!lang || !/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(lang)) fail(path, 'Missing or invalid HTML language.');
    return { clean, head, url, title, description, lang };
}

function publishedDate(article, path) {
    const dateElement = one(elements(article, 'p').filter(match =>
        (attributes(tags(match[0], 'p')[0][0]).class ?? '').split(/\s+/).includes('article-date')), path, 'visible article date');
    const times = elements(dateElement[1], 'time');
    const visible = plainText(times.length ? one(times, path, 'publication time')[1] : dateElement[1]);
    const match = visible.match(/^(\d{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December) (\d{4})$/);
    if (!match) fail(path, `Unrecognized publication date: ${visible}`);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months.indexOf(match[2]) + 1;
    const iso = `${match[3]}-${String(month).padStart(2, '0')}-${match[1].padStart(2, '0')}`;
    const parsed = new Date(`${iso}T00:00:00Z`);
    if (!Number.isFinite(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== iso) fail(path, `Invalid publication date: ${visible}`);
    if (times.length) {
        const datetime = attributes(tags(times[0][0], 'time')[0][0]).datetime;
        if (datetime && datetime !== iso) fail(path, 'Publication datetime disagrees with the visible date.');
    }
    return iso;
}

async function articleImage(article, path, canonical, root) {
    const stack = [];
    for (const tag of tags(contentMarkup(article))) {
        const name = tag[1].toLowerCase();
        if (tag[0].startsWith('</')) {
            const index = stack.findLastIndex(entry => entry.name === name);
            if (index !== -1) stack.length = index;
            continue;
        }
        const attrs = attributes(tag[0]);
        const hidden = Boolean(stack.at(-1)?.hidden || 'hidden' in attrs || attrs['aria-hidden'] === 'true');
        if (name === 'img' && !hidden && attrs.alt?.trim() && !['none', 'presentation'].includes(attrs.role) &&
            !(attrs.width && Number(attrs.width) <= 1) && !(attrs.height && Number(attrs.height) <= 1)) {
            if (!attrs.src) fail(path, 'Meaningful article image is missing src.');
            let image;
            try { image = new URL(attrs.src, canonical); } catch { fail(path, 'Invalid article image URL.'); }
            if (!['https:', 'http:'].includes(image.protocol)) continue;
            if (image.pathname === '/avatar.png' || image.pathname.startsWith('/images/reading-landscapes/')) continue;
            if (image.origin === new URL(site).origin) {
                const local = resolve(root, `.${decodeURIComponent(image.pathname)}`);
                const withinRoot = relative(root, local);
                if (withinRoot.startsWith('..') || !(await stat(local).catch(() => null))?.isFile()) {
                    fail(path, `Article image does not resolve to a local file: ${attrs.src}`);
                }
            }
            return image.href;
        }
        if (!voidTags.has(name) && !tag[0].endsWith('/>')) stack.push({ name, hidden });
    }
    return undefined;
}

function withStructuredData(html, data, path) {
    const heads = elements(html, 'head');
    const head = one(heads, path, 'head');
    const scripts = elements(html, 'script').filter(match => attributes(tags(match[0], 'script')[0][0]).id === scriptId);
    if (scripts.length > 1) fail(path, 'Duplicate managed structured-data scripts.');
    const eol = html.includes('\r\n') ? '\r\n' : '\n';
    const json = JSON.stringify(data, null, 4).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    const block = `<script type="application/ld+json" id="${scriptId}">${eol}` +
        json.split('\n').map(line => `        ${line}`).join(eol) + `${eol}    </script>`;
    if (scripts.length) {
        const current = scripts[0];
        if (attributes(tags(current[0], 'script')[0][0]).type !== 'application/ld+json') fail(path, 'Managed script has an unexpected type.');
        if (current.index < head.index || current.index + current[0].length > head.index + head[0].length) fail(path, 'Managed script must be inside the head.');
        return html.slice(0, current.index) + block + html.slice(current.index + current[0].length);
    }
    const closing = head.index + head[0].search(/<\/head\s*>$/i);
    return html.slice(0, closing) + `    ${block}${eol}` + html.slice(closing);
}

export async function planStructuredData({ root = defaultRoot } = {}) {
    root = resolve(root);
    const read = path => readFile(resolve(root, path), 'utf8');
    const [home, coaching, archive] = await Promise.all(['index.html', 'coaching.html', 'thoughts/index.html'].map(read));
    const homeFacts = pageFacts(home, 'index.html', site);
    const profileLinks = new Set(tags(homeFacts.clean, 'a').filter(tag => !tag[0].startsWith('</')).map(tag => attributes(tag[0]).href));
    // Only the four professional/public profiles already linked by this site.
    const sameAs = profileURLs.filter(url => profileLinks.has(url));
    if (!sameAs.length) fail('index.html', 'No known public profile links remain; review Person metadata.');
    const homepage = { '@context': 'https://schema.org', '@type': 'ProfilePage', '@id': `${site}#profile`,
        url: site, name: homeFacts.title, description: homeFacts.description, inLanguage: homeFacts.lang,
        mainEntity: { ...person, sameAs } };
    const coachingFacts = pageFacts(coaching, 'coaching.html', `${site}coaching.html`);
    const coachingPage = { '@context': 'https://schema.org', '@type': 'WebPage', '@id': `${coachingFacts.url}#webpage`,
        url: coachingFacts.url, name: coachingFacts.title, description: coachingFacts.description, inLanguage: coachingFacts.lang,
        author: { ...person }, about: { '@id': person['@id'] } };
    const plans = [{ path: 'index.html', source: home, data: homepage }, { path: 'coaching.html', source: coaching, data: coachingPage }];
    const list = one(elements(contentMarkup(archive), 'ul').filter(match =>
        attributes(tags(match[0], 'ul')[0][0]).id === 'article-list'), 'thoughts/index.html', '#article-list')[1];
    const slugs = tags(list, 'a').filter(tag => !tag[0].startsWith('</')).map(tag => attributes(tag[0]).href);
    if (!slugs.length || new Set(slugs).size !== slugs.length || slugs.some(slug => !/^[a-z0-9-]+\.html$/.test(slug) || slug === 'index.html')) {
        fail('thoughts/index.html', 'Expected unique local essay links, with no archive or nonarticle links.');
    }
    for (const slug of slugs) {
        const path = `thoughts/${slug}`;
        const source = await read(path);
        const facts = pageFacts(source, path, `${site}${path}`);
        const body = one(tags(facts.clean, 'body').filter(tag => !tag[0].startsWith('</')), path, 'body');
        if (!(attributes(body[0]).class ?? '').split(/\s+/).includes('essay-page')) fail(path, 'Archived page must use the essay template.');
        const article = one(elements(facts.clean, 'article'), path, 'article')[1];
        const headline = plainText(one(elements(article, 'h1'), path, 'article H1')[1]);
        if (!headline) fail(path, 'Article headline must not be empty.');
        const data = { '@context': 'https://schema.org', '@type': 'BlogPosting', '@id': `${facts.url}#article`,
            url: facts.url, mainEntityOfPage: facts.url, headline, description: facts.description,
            datePublished: publishedDate(article, path), inLanguage: facts.lang, author: { ...person } };
        const image = await articleImage(article, path, facts.url, root);
        if (image) data.image = image;
        plans.push({ path, source, data });
    }
    // Prepare every page first, including managed-block validation, before any write.
    return plans.map(plan => ({ ...plan, output: withStructuredData(plan.source, plan.data, plan.path) }));
}

export async function syncStructuredData({ root = defaultRoot, check = false } = {}) {
    const plans = await planStructuredData({ root });
    const changed = plans.filter(plan => plan.output !== plan.source);
    if (check && changed.length) throw new Error(`Structured data is stale in ${changed.map(plan => plan.path).join(', ')}. Run node scripts/sync-structured-data.mjs.`);
    if (!check) {
        // Avoid overwriting an edit made while the plan was being prepared.
        for (const plan of plans) {
            if (await readFile(resolve(root, plan.path), 'utf8') !== plan.source) fail(plan.path, 'Source changed during planning; run again.');
        }
        for (const plan of changed) await writeFile(resolve(root, plan.path), plan.output);
    }
    return { pages: plans.length, essays: plans.length - 2, changed: changed.map(plan => plan.path) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        if (process.argv.slice(2).some(arg => arg !== '--check')) throw new Error('Usage: node scripts/sync-structured-data.mjs [--check]');
        const check = process.argv.includes('--check');
        const result = await syncStructuredData({ check });
        console.log(check ? `Structured data matches ${result.pages} pages (${result.essays} essays).` :
            `Synchronized structured data for ${result.pages} pages (${result.changed.length} changed; ${result.essays} essays).`);
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}
