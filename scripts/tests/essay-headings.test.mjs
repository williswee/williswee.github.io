import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const thoughts = new URL('../../thoughts/', import.meta.url);
const essays = [
    {
        page: 'boring-ai.html',
        title: 'The boring ways I use AI',
        className: 'article-section-heading--compact',
        headings: [
            '1) Speed: getting thoughts out faster with Wispr Flow',
            '2) Clarity: thinking before building with PM OS',
            '3) Cursor for work, because I want to review and think',
            '4) Antigravity IDE and OpenClaws for personal tasks',
            '5) Codex for vibe coding',
            '6) Design',
        ],
    },
    {
        page: 'meditation.html',
        title: "You can't stop thinking. That's the whole point.",
        className: 'article-section-heading--body',
        headings: [
            'My meditation "thinking flow"',
            'Metacognition',
            'Applying it in real life',
        ],
    },
];

for (const essay of essays) {
    const html = readFileSync(new URL(essay.page, thoughts), 'utf8');
    const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/)?.[1];

    test(`${essay.page}: section headings follow the article title without skipped levels`, () => {
        assert.ok(article, 'article exists');
        const headings = [...article.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/g)];
        assert.deepEqual(headings.map(match => Number(match[1])), [1, ...essay.headings.map(() => 2)]);
        assert.deepEqual(headings.map(match => match[2]), [essay.title, ...essay.headings], 'preserve exact heading copy and order');
    });

    test(`${essay.page}: semantic sections retain their existing typography variant`, () => {
        const sections = [...article.matchAll(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/g)];
        assert.equal(sections.length, essay.headings.length);
        for (const section of sections) {
            assert.equal(section[1], ` class="${essay.className}"`);
        }
        assert.doesNotMatch(article, /\baria-level=|\brole="heading"/, 'use native heading semantics');
    });
}
