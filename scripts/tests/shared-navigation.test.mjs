import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const read = name => readFileSync(new URL(name, root), 'utf8');
const readingPages = [
    ...readdirSync(root).filter(name => name.endsWith('.html') && !['index.html', 'creative.html'].includes(name)),
    ...readdirSync(new URL('thoughts/', root))
        .filter(name => name.endsWith('.html'))
        .map(name => `thoughts/${name}`),
].sort();
const sharedLabels = ['Start', 'Thoughts', 'Guide', 'Work', 'Coaching', 'Books', 'Gratitude'];
const sharedPaths = ['/index.html', '/thoughts/index.html', '/guide.html', '/work.html',
    '/coaching.html', '/books.html', '/gratitude.html'];

function navigation(name, className) {
    const pattern = new RegExp(`<nav\\b[^>]*\\bclass="${className}"[^>]*>([\\s\\S]*?)<\\/nav>`, 'g');
    const matches = [...read(name).matchAll(pattern)];
    assert.equal(matches.length, 1, `${name}: expected one ${className}`);
    return [...matches[0][1].matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([, attributes, content]) => ({
        attributes,
        label: content.trim(),
        href: attributes.match(/\bhref="([^"]*)"/)?.[1],
        current: attributes.match(/\baria-current="([^"]*)"/)?.[1],
    }));
}

function assertInnerPageCoaching(links, name) {
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

test('every reading header places plain Coaching after Work and preserves destination order', () => {
    for (const name of readingPages) {
        const links = navigation(name, 'reading-nav');
        assert.deepEqual(links.map(link => link.label), sharedLabels, name);
        assert.deepEqual(links.map(link => new URL(link.href, `https://williswee.com/${name}`).pathname),
            sharedPaths, `${name}: navigation destinations`);
        assertInnerPageCoaching(links, name);
    }
});

test('reading headers preserve existing active destinations and mark Coaching on its own page', () => {
    const activeByPage = {
        'books.html': 'Books',
        'coaching.html': 'Coaching',
        'gratitude.html': 'Gratitude',
        'guide.html': 'Guide',
        'work.html': 'Work',
    };
    for (const name of readingPages) {
        const links = navigation(name, 'reading-nav');
        const expected = name.startsWith('thoughts/') ? 'Thoughts' : activeByPage[name];
        assert.deepEqual(links.filter(link => link.current !== undefined)
            .map(link => [link.label, link.current]), expected ? [[expected, 'page']] : [], name);
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
    return [...read('index.html').matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/g)]
        .filter(([, attributes]) => (attribute(attributes, 'class') ?? '').split(/\s+/).includes('game-scene'))
        .map(([, attributes, content]) => ({ id: attribute(attributes, 'id'), content }));
}

function nextChapter(scene) {
    const links = [...scene.content.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
        .filter(([, attributes]) => (attribute(attributes, 'class') ?? '').split(/\s+/).includes('next-chapter'));
    assert.equal(links.length, 1, `${scene.id}: expected one next-chapter link`);
    return attribute(links[0][1], 'href');
}

test('the homepage has six same-document chapter links matching six real sections in order', () => {
    const links = navigation('index.html', 'chapter-nav');
    const ids = ['base-camp', 'workshop', 'coaching', 'archive', 'life', 'terminal'];
    assert.deepEqual(links.map(link => link.label), ['Start', 'Work', 'Coaching', 'Notes', 'Life', 'Connect']);
    assert.deepEqual(links.map(link => link.href), ids.map(id => `#${id}`));
    assert.deepEqual(homeScenes().map(scene => scene.id), ids);
    for (const [index, link] of links.entries()) {
        assert.equal(attribute(link.attributes, 'data-level'), ids[index], link.label);
        assert.equal(attribute(link.attributes, 'target'), undefined, `${link.label}: native same-document navigation`);
    }
    assert.deepEqual(links.filter(link => link.current !== undefined)
        .map(link => [link.label, link.current]), [['Start', 'page']]);
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
    const paragraphs = [...coaching.content.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(([, text]) => visibleText(text));
    assert.ok(paragraphs.includes('I help ambitious founders get unstuck—from 0 to 1, and 1 to 2. We’ll work through the problem together and find a clearer way forward.'),
        'retain the existing homepage coaching introduction');
    const invitations = [...coaching.content.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
        .filter(([, attributes]) => (attribute(attributes, 'class') ?? '').split(/\s+/).includes('coaching-more'));
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


// Approved homepage markup before the Connect/Coaching split, 6 October 2026.
// Normalize indentation only so moving these blocks cannot silently change their copy or SVGs.
const compactMarkup = html => html.replace(/\s+/g, ' ').trim();
const originalCoachingIntro = 'I help ambitious founders get unstuck—from 0 to 1, and 1 to 2. We’ll work through the problem together and find a clearer way forward.';
const originalCoachingFAQ = `<details class="coaching-faq">
    <summary>
        <span>A few questions about coaching</span>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 8 5 5 5-5"/></svg>
    </summary>
    <div class="coaching-answers">
        <h3>What should I bring?</h3>
        <p>A challenge, the context, and what you’ve tried. Missing data, too many paths, strong emotions, or a skill you haven’t learned yet. All is good.</p>
        <h3>What does “comrades” mean?</h3>
        <p>We work through challenges together, on equal footing. I’m friendly and candid, and open to your feedback too. More about me in <a href="guide.html">my user guide</a>.</p>
        <h3>What will I leave with?</h3>
        <p>A clearer sense of your options and where to go next. I can share concrete examples or help draft a plan. You own the decisions and execution.</p>
    </div>
</details>`;
const originalCoachingBooking = `<a class="coaching-booking" href="https://intro.co/williswee" target="_blank" rel="noopener noreferrer">
    <span class="contact-label">
        <svg class="contact-icon contact-icon-stroke" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 10l5-3v10l-5-3v4H4V6h11v4z"/></svg>
        <span><strong>Book a call</strong><small>Rates &amp; times on Intro</small></span>
    </span>
    <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M4 14L14 4M7 4h7v7"/></svg>
</a>`;

// Fingerprints cover each original social anchor's label, caption, accessibility
// attributes, destination, and SVG without copying five long icons into this test.
const originalSocialLinks = [
    ['https://williswee.substack.com', '8474cec050702119dd711ae5f026458bf1568b2231935e5a3b9d8dfc05306f48'],
    ['https://www.linkedin.com/in/williswee/', 'e21b0b2215cc7120509bdbe89d5c8c3ab35a389280fd5cfdc6df2f59519081a9'],
    ['https://github.com/williswee', 'ea317fdc71ad32c38f9869784841c8a086daca44f2bb1fd0337a849e7aa1d36d'],
    ['https://x.com/williswee', 'ebbc9eb15f003a9d64e2a41405396e80fb4ecd35ebee8eb80ad341d0bb3a4e8f'],
    ['https://www.instagram.com/williswee', '7f800f210f156e5cabbefe78f3efd6e9271b957a1583947f85aa443d7bef5562'],
];

test('Coaching owns the single original introduction, FAQ, and booking control', () => {
    const html = read('index.html');
    const coaching = homeScenes().find(scene => scene.id === 'coaching');
    const terminal = homeScenes().find(scene => scene.id === 'terminal');
    assert.ok(coaching && terminal);
    const introductions = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)]
        .filter(([, text]) => visibleText(text) === originalCoachingIntro);
    assert.equal(introductions.length, 1, 'keep one original coaching introduction, in Coaching');
    assert.ok(coaching.content.includes(introductions[0][0]));
    const faqs = html.match(/<details class="coaching-faq">[\s\S]*?<\/details>/g) ?? [];
    assert.equal(faqs.length, 1, 'move the FAQ rather than duplicating it');
    assert.ok(coaching.content.includes(faqs[0]));
    assert.equal(compactMarkup(faqs[0]), compactMarkup(originalCoachingFAQ));
    const bookings = html.match(/<a class="coaching-booking"[\s\S]*?<\/a>/g) ?? [];
    assert.equal(bookings.length, 1, 'move the Intro control rather than duplicating it');
    assert.equal(compactMarkup(bookings[0]), compactMarkup(originalCoachingBooking));
    const bookingList = coaching.content.match(/<div\b(?=[^>]*class="contact-list")(?=[^>]*aria-label="Coaching sessions")[^>]*>([\s\S]*?)<\/div>/)?.[1];
    assert.ok(bookingList?.includes(bookings[0]), 'the existing booking control belongs to the Coaching sessions list');
    const pageLinks = html.match(/<a class="coaching-more"[\s\S]*?<\/a>/g) ?? [];
    assert.equal(pageLinks.length, 1, 'merge the old More about coaching link into Explore coaching');
    assert.equal(visibleText(pageLinks[0]), 'Explore coaching');
    assert.doesNotMatch(terminal.content, /coaching-(?:more|booking|faq)|href="(?:\/?coaching\.html|https:\/\/intro\.co)/,
        'Connect contains no coaching invitation, FAQ, or Intro link');
    assert.ok(!visibleText(terminal.content).includes(originalCoachingIntro));
});

test('Connect retains all five original social links in order without changing their markup', () => {
    const terminal = homeScenes().find(scene => scene.id === 'terminal');
    assert.ok(terminal);
    const list = terminal.content.match(/<div\b(?=[^>]*class="contact-list")(?=[^>]*aria-label="Ways to connect")[^>]*>([\s\S]*?)<\/div>/)?.[1];
    assert.ok(list, 'keep the existing social contact list');
    const links = [...list.matchAll(/<a\b([^>]*)>[\s\S]*?<\/a>/g)];
    assert.deepEqual(links.map(([, attrs]) => attribute(attrs, 'href')), originalSocialLinks.map(([url]) => url));
    for (const [index, [markup]] of links.entries()) {
        assert.equal(createHash('sha256').update(compactMarkup(markup)).digest('hex'), originalSocialLinks[index][1],
            `${originalSocialLinks[index][0]}: keep the existing label, caption, destination, accessibility attributes, and SVG`);
    }
});
