import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const read = name => readFileSync(new URL(name, root), 'utf8');
const sitePages = [
    ...readdirSync(root).filter(name => name.endsWith('.html') && name !== 'creative.html'),
    ...readdirSync(new URL('thoughts/', root))
        .filter(name => name.endsWith('.html'))
        .map(name => `thoughts/${name}`),
].sort();
const sharedLabels = ['Home', 'Work', 'Coaching', 'Writing', 'Play', 'Books', 'User guide', 'Gratitude', 'Connect'];
const sharedPaths = ['/', '/work.html', '/coaching.html', '/thoughts/', '/play', '/books.html',
    '/guide.html', '/gratitude.html', '/#terminal'];

function navigation(name, className) {
    const pattern = new RegExp(`<nav\\b[^>]*\\bclass="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/nav>`, 'g');
    const matches = [...read(name).matchAll(pattern)];
    assert.equal(matches.length, 1, `${name}: expected one ${className}`);
    return [...matches[0][1].matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([, attributes, content]) => ({
        attributes,
        label: visibleText(content),
        href: attributes.match(/\bhref="([^"]*)"/)?.[1],
        current: attributes.match(/\baria-current="([^"]*)"/)?.[1],
    }));
}

function assertCoaching(links, name) {
    const coaching = links.filter(link => link.label === 'Coaching');
    assert.equal(coaching.length, 1, `${name}: expected one plain Coaching label`);
    const link = coaching[0];
    assert.equal(links[links.indexOf(link) - 1]?.label, 'Work', `${name}: Coaching must follow Work`);
    assert.equal(link.href, '/coaching.html', `${name}: Coaching must work at any URL depth`);
    const extraAttributes = link.attributes.replace(/\b(?:href|aria-current)="[^"]*"/g, '').trim();
    assert.equal(extraAttributes, '', `${name}: Coaching uses normal navigation styling and behavior`);
    assert.equal(link.current, name === 'coaching.html' ? 'page' : undefined,
        `${name}: only the Coaching page marks Coaching current`);
}

test('every global header prioritizes Work and Coaching with identical destinations at every URL depth', () => {
    for (const name of sitePages) {
        const links = navigation(name, 'site-navigation');
        assert.deepEqual(links.map(link => link.label), [...sharedLabels, 'Subscribe'], name);
        assert.deepEqual(links.slice(0, -1).map(link => link.href), sharedPaths, `${name}: canonical root-relative destinations`);
        const newsletterHref = name === 'index.html' ? '/#newsletter' : name === 'thoughts/index.html'
            ? '/thoughts/#newsletter' : name.startsWith('thoughts/') ? `/${name}#newsletter` : '/thoughts/#newsletter';
        assert.equal(links.at(-1).href, newsletterHref, `${name}: contextual signup destination`);
        assertCoaching(links, name);
    }
});

test('global headers distinguish the current page from an essay’s parent collection', () => {
    const activeByPage = {
        'index.html': 'Home',
        'books.html': 'Books',
        'coaching.html': 'Coaching',
        'gratitude.html': 'Gratitude',
        'guide.html': 'User guide',
        'play.html': 'Play',
        'work.html': 'Work',
        'thoughts/index.html': 'Writing',
    };
    for (const name of sitePages) {
        const links = navigation(name, 'site-navigation');
        const essay = name.startsWith('thoughts/') && name !== 'thoughts/index.html';
        const expected = essay ? ['Writing', 'location'] : activeByPage[name] ? [activeByPage[name], 'page'] : null;
        assert.deepEqual(links.filter(link => link.current !== undefined)
            .map(link => [link.label, link.current]), expected ? [expected] : [], name);
    }
});

test('every footer repeats the site directory as ordinary links', () => {
    for (const name of sitePages) {
        const menu = read(name).match(/<details\b([^>]*class="site-footer-menu"[^>]*)>([\s\S]*?)<\/details>/);
        assert.ok(menu, `${name}: keep the footer as a native disclosure`);
        assert.doesNotMatch(menu[1], /\bopen(?:\s|=|$)/, `${name}: footer starts closed`);
        assert.match(menu[2], /^\s*<summary><span>Explore this site<\/span>/);
        const links = navigation(name, 'site-footer-nav');
        assert.deepEqual(links.map(link => link.label), sharedLabels, name);
        assert.deepEqual(links.map(link => link.href), sharedPaths, name);
        assert.doesNotMatch(read(name), /class="footer-home"/, `${name}: avoid a duplicate Home link`);
    }
});

function attribute(attributes, name) {
    return attributes.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1];
}

function visibleText(html) {
    return html.replace(/<svg\b[\s\S]*?<\/svg>/g, '').replace(/<br\s*\/?>/g, ' ')
        .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

function homeScenes() {
    const home = read('index.html');
    const scenes = [...home.matchAll(/<section\b([^>]*)>/g)]
        .filter(([, attributes]) => (attribute(attributes, 'class') ?? '').split(/\s+/).includes('game-scene'));
    return scenes.map((scene, index) => ({
        id: attribute(scene[1], 'id'),
        // A scene can contain nested sections, including the newsletter.
        content: home.slice(scene.index + scene[0].length, scenes[index + 1]?.index ?? home.indexOf('</main>')),
    }));
}

function nextChapter(scene) {
    const links = [...scene.content.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
        .filter(([, attributes]) => (attribute(attributes, 'class') ?? '').split(/\s+/).includes('next-chapter'));
    assert.equal(links.length, 1, `${scene.id}: expected one next-chapter link`);
    assert.equal(attribute(links[0][1], 'target'), undefined, `${scene.id}: native same-document navigation`);
    return attribute(links[0][1], 'href');
}

test('the homepage retains six scenes and native onward links without a duplicate page menu', () => {
    const scenes = homeScenes();
    const ids = ['base-camp', 'workshop', 'coaching', 'archive', 'life', 'terminal'];
    assert.deepEqual(scenes.map(scene => scene.id), ids);
    for (const [index, scene] of scenes.slice(0, -1).entries()) {
        assert.equal(nextChapter(scene), `#${ids[index + 1]}`);
    }
    const returnLink = scenes.at(-1).content.match(/<a\b([^>]*class="return-link"[^>]*)>/);
    assert.ok(returnLink, 'Connect keeps its return to the beginning');
    assert.equal(attribute(returnLink[1], 'href'), '#base-camp');
    assert.equal(attribute(returnLink[1], 'target'), undefined);
    assert.doesNotMatch(read('index.html'), /home-page-nav|chapter-nav|On this page/);
});

test('the Coaching chapter preserves the approved invitation and links onward to Notes and the full service page', () => {
    const scenes = homeScenes();
    const work = scenes.find(scene => scene.id === 'workshop');
    const coaching = scenes.find(scene => scene.id === 'coaching');
    assert.ok(work && coaching, 'Work and Coaching are real homepage sections');
    assert.equal(nextChapter(work), '#coaching');
    assert.equal(nextChapter(coaching), '#archive');
    const heading = coaching.content.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/)?.[1];
    assert.match(visibleText(heading ?? ''), /^Coaching as comrades\.?$/);
    const invitations = [...coaching.content.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
        .filter(([, attributes]) => (attribute(attributes, 'class') ?? '').split(/\s+/).includes('coaching-more') && attribute(attributes, 'href') === 'coaching.html');
    assert.equal(invitations.length, 1, 'one full-page invitation in the Coaching chapter');
    assert.equal(attribute(invitations[0][1], 'href'), 'coaching.html');
    assert.equal(visibleText(invitations[0][2]), 'Explore coaching');
    assert.equal(attribute(invitations[0][1], 'target'), undefined);
});

test('the homepage introduction leaves the full coaching canonical, enquiry form, and booking choices on their own page', () => {
    const home = read('index.html');
    const coaching = read('coaching.html');
    assert.match(home, /<link\b[^>]*rel="canonical"[^>]*href="https:\/\/williswee\.com\/"/);
    assert.match(coaching, /<link\b[^>]*rel="canonical"[^>]*href="https:\/\/williswee\.com\/coaching\.html"/);
    assert.doesNotMatch(home, /<form\b|id="coaching-note-form"|id="note-(?:name|email|message)"/,
        'the scene must not duplicate the enquiry form');
    const forms = coaching.match(/<form\b[^>]*id="coaching-note-form"[\s\S]*?<\/form>/g) ?? [];
    assert.equal(forms.length, 1, 'the full coaching page retains its one enquiry form');
    assert.match(forms[0], /action="https:\/\/formspree\.io\/f\/mdekydke"/);
    assert.match(coaching, /<a\b[^>]*class="coaching-invitation"[^>]*href="#send-a-note"/);
    const bookings = coaching.match(/<p class="coaching-book-direct[^"]*">[\s\S]*?<\/p>/g) ?? [];
    assert.equal(bookings.length, 2, 'retain the full page’s hero and closing booking choices');
    for (const booking of bookings) assert.match(booking, /href="https:\/\/intro\.co\/williswee"/);
});


const socialLinks = [
    ['https://williswee.substack.com', 'Substack', 'I write about the chaos of building products, founder life, and being a dad to three daughters.'],
    ['https://www.linkedin.com/in/williswee/', 'LinkedIn', 'I try to sound professional here.'],
    ['https://github.com/williswee', 'GitHub', 'AI codes. I take the blame.'],
    ['https://x.com/williswee', 'X', 'Where I get overwhelmed.'],
    ['https://intro.co/williswee', 'Intro', 'My coaching profile, rates, and available times.'],
];

test('Coaching leads to the native note form and keeps Intro as a secondary choice', () => {
    const html = read('index.html');
    const coaching = homeScenes().find(scene => scene.id === 'coaching');
    const terminal = homeScenes().find(scene => scene.id === 'terminal');
    assert.ok(coaching && terminal);
    assert.doesNotMatch(html, /coaching-faq|A few questions about coaching/,
        'coaching questions belong on the detailed page');
    const actions = [...coaching.content.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
    const primary = actions.filter(([, attrs]) => (attribute(attrs, 'class') ?? '').split(/\s+/).includes('coaching-booking'));
    assert.equal(primary.length, 1, 'one primary contact action');
    assert.equal(attribute(primary[0][1], 'href'), 'coaching.html#send-a-note');
    assert.equal(attribute(primary[0][1], 'target'), undefined, 'the local note route stays in the same tab');
    assert.ok(visibleText(primary[0][2]).includes('Send me a note'));
    const notePage = read('coaching.html');
    assert.match(notePage, /id="send-a-note"/);
    assert.match(notePage, /<form\b[^>]*action="https:\/\/formspree\.io\/f\/mdekydke"[^>]*method="POST"/);
    const intro = actions.filter(([, attrs]) => attribute(attrs, 'href') === 'https://intro.co/williswee');
    assert.equal(intro.length, 1, 'Intro remains available within the Coaching chapter');
    assert.equal(attribute(intro[0][1], 'target'), '_blank');
    assert.match(attribute(intro[0][1], 'rel'), /\bnoopener\b/);
    assert.match(attribute(intro[0][1], 'rel'), /\bnoreferrer\b/);
    assert.match(visibleText(intro[0][2]), /Prefer Intro\?/);
    assert.match(visibleText(intro[0][2]), /opens in a new tab/);
    assert.ok(coaching.content.indexOf(primary[0][0]) < coaching.content.indexOf(intro[0][0]),
        'the note action precedes optional booking');
    assert.doesNotMatch(terminal.content, /coaching-(?:more|booking|faq)|href="\/?coaching\.html/,
        'Connect keeps the coaching invitation and FAQ in the Coaching section');
});

test('Connect offers the approved public profiles and captions in order', () => {
    const terminal = homeScenes().find(scene => scene.id === 'terminal');
    assert.ok(terminal);
    const list = terminal.content.match(/<div\b(?=[^>]*class="contact-list")(?=[^>]*aria-label="Ways to connect")[^>]*>([\s\S]*?)<\/div>/)?.[1];
    assert.ok(list, 'keep the existing social contact list');
    const links = [...list.matchAll(/<a\b([^>]*)>[\s\S]*?<\/a>/g)];
    assert.deepEqual(links.map(([, attrs]) => attribute(attrs, 'href')), socialLinks.map(([url]) => url));
    for (const [index, [markup, attrs]] of links.entries()) {
        const [url, label, caption] = socialLinks[index];
        assert.equal(visibleText(markup.match(/<strong>([\s\S]*?)<\/strong>/)?.[1] ?? ''), label, url);
        assert.equal(visibleText(markup.match(/<small>([\s\S]*?)<\/small>/)?.[1] ?? ''), caption, url);
        assert.equal(attribute(attrs, 'target'), '_blank', url);
        assert.equal(attribute(attrs, 'rel'), 'noopener noreferrer', url);
        assert.match(markup, /<svg class="contact-icon"/, url);
    }
});
