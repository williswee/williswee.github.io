import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const read = name => readFileSync(new URL(name, root), 'utf8');
const readingPages = [
    ...readdirSync(root).filter(name => name.endsWith('.html') && name !== 'index.html'),
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

function assertPlainCoaching(links, name) {
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
        assertPlainCoaching(links, name);
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

test('the homepage adds plain Coaching after Work while retaining its scene destinations', () => {
    const links = navigation('index.html', 'chapter-nav');
    assert.deepEqual(links.map(link => link.label), ['Start', 'Work', 'Coaching', 'Notes', 'Life', 'Connect']);
    assert.deepEqual(links.map(link => link.href),
        ['#base-camp', '#workshop', '/coaching.html', '#archive', '#life', '#terminal']);
    assertPlainCoaching(links, 'index.html');
    const sceneLinks = links.filter(link => link.label !== 'Coaching');
    for (const link of sceneLinks) {
        assert.equal(link.attributes.match(/\bdata-level="([^"]*)"/)?.[1], link.href.slice(1), link.label);
    }
    assert.deepEqual(links.filter(link => link.current !== undefined)
        .map(link => [link.label, link.current]), [['Start', 'page']]);
});
