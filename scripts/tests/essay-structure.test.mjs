import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../../thoughts/', import.meta.url);
const pages = readdirSync(root).filter(name => name.endsWith('.html')).sort();
const read = name => readFileSync(new URL(name, root), 'utf8');
const approvedSubtitles = {
    "bestdad.html": "<p class=\"article-subtitle\">My eldest is nine. If 15 years old marks the start of greater independence, I have just over 300 weeks left in this season of being a dad.</p>",
    "freedom.html": "<p class=\"article-subtitle\">Entrepreneurship is self-expression. Not everyone will like what you express.</p>",
    "tickertownupdate.html": "<p class=\"article-subtitle\">I stopped vibe investing. Then I realized the hardest part wasn't just learning to build the system. It was finding anyone willing to share theirs.</p>"
};

test('existing essay subtitles retain their exact approved wording', () => {
    for (const [name, subtitle] of Object.entries(approvedSubtitles)) {
        const actual = read(name).match(/<p class="article-subtitle">[\s\S]*?<\/p>/g);
        assert.deepEqual(actual, [subtitle], name);
    }
});

test('every subtitle belongs to the title group before the date and hero', () => {
    for (const name of pages.filter(name => name !== 'index.html')) {
        const html = read(name);
        const article = html.match(/<article>([\s\S]*?)<\/article>/)?.[1];
        assert.ok(article, `${name}: expected a readable article`);
        const subtitles = article.match(/<p class="article-subtitle">[\s\S]*?<\/p>/g) ?? [];
        assert.ok(subtitles.length <= 1, `${name}: duplicate subtitle`);
        if (!subtitles.length) continue;
        assert.match(article, /^\s*<h1>[\s\S]*?<\/h1>\s*<p class="article-subtitle">[\s\S]*?<\/p>\s*<p class="article-date">/, name);
        const figure = article.indexOf('<figure');
        assert.ok(figure === -1 || article.indexOf(subtitles[0]) < figure, `${name}: subtitle follows hero`);
    }
});

test('every newsletter has one immediate subscription action before its optional form', () => {
    for (const name of pages) {
        const html = read(name);
        const block = html.match(/<(div|section)\b[^>]*\bid="newsletter"[^>]*>([\s\S]*?)<\/\1>/)?.[2];
        assert.ok(block, `${name}: newsletter block missing`);
        const links = html.match(/<a\b[^>]*\bhref="https:\/\/williswee\.substack\.com\/subscribe"[^>]*>[\s\S]*?<\/a>/g) ?? [];
        assert.equal(links.length, 1, `${name}: expected one subscription fallback`);
        const link = links[0].replace(/\s+/g, ' ');
        assert.match(link, /class="text-link newsletter-fallback"/, name);
        assert.match(link, /\btarget="_blank"/, name);
        assert.match(link, /\brel="noopener noreferrer"/, name);
        assert.match(link, />Subscribe on Substack <span aria-hidden="true">↗<\/span><\/a>$/, name);
        const invitation = name === 'index.html'
            ? 'Join my free newsletter to get my latest essays and updates delivered straight to your inbox.'
            : 'Enjoyed this? Subscribe to get new essays delivered to your inbox.';
        assert.ok(block.replace(/\s+/g, ' ').includes(`<p>${invitation}</p> ${link} <iframe`),
            `${name}: keep invitation, fallback and form adjacent and in that order`);
        assert.match(html, /<script src="newsletter\.js\?v=2" defer><\/script>/, name);
        assert.match(html, /reading-room\.css\?v=\d+(?:\.\d+)*/, name);
        assert.match(html, /<noscript>\s*<style>\s*iframe\[data-newsletter-src\]\s*\{\s*display:\s*none;\s*\}\s*<\/style>\s*<\/noscript>/, name);
        assert.match(block, /<iframe data-newsletter-src="https:\/\/williswee\.substack\.com\/embed"[^>]+loading="lazy"[^>]+aria-hidden="true" tabindex="-1"[^>]+title="Subscribe to Willis Wee newsletter"><\/iframe>/, name);
        assert.doesNotMatch(block, /<iframe[^>]*\ssrc=/, name);
    }
});

test('nomoney retains its art and footnote copy while using shared presentation', () => {
    const html = read('nomoney.html');
    const image = html.match(/<img src="\.\.\/images\/nomoney-[a-f0-9]{12}\.webp"[^>]+>/)?.[0];
    assert.ok(image);
    assert.match(image, /alt="Row, row, row your boat"/);
    assert.match(image, /width="1448" height="1086"/);
    assert.doesNotMatch(image, /style=/);
    const footnotes = html.match(/<div class="article-footnotes">([\s\S]*?)<\/div>/)?.[1];
    assert.ok(footnotes);
    assert.match(footnotes, /<sup>1<\/sup> Make a guess which brand\./);
    assert.match(footnotes, /<sup>2<\/sup> Reminds me of <a href="https:\/\/youtu\.be\/6jZVsr7q-tE\?si=XkEbMxSoBOTlGsRn">this song<\/a> and movie\./);
    assert.doesNotMatch(footnotes, /style=/);
    assert.doesNotMatch(html, /border-top:1px solid #333|font-size:0\.85rem;color:#888/);
});
