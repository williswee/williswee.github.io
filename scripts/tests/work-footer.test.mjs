import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const footer = page => read(page).match(/<footer class="follow-strip">([\s\S]*?)<\/footer>/)?.[1];
const work = footer('work.html');

test('Work follows the shared social icon pattern and offers Home in its directory', () => {
    assert.ok(work);
    const directory = work.match(/<nav\b[^>]*class="site-footer-nav"[^>]*aria-label="Footer navigation"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    assert.ok(directory, 'the shared footer directory must be present');
    assert.match(directory, /<a\b[^>]*href="\/"[^>]*>Home<\/a>/);
    assert.doesNotMatch(work, /class="footer-home"/, 'Home appears only in the directory');
    assert.match(work, /<span class="follow-strip-label">Follow<\/span>/);
    assert.match(work, /<nav class="follow-strip-icons" aria-label="Follow Willis">/);
    const links = html => [...html.matchAll(/<a href="([^"]+)" class="follow-icon"[^>]+aria-label="([^"]+)">\s*<svg[^>]*><path d="([^"]+)"\/><\/svg>\s*<\/a>/g)]
        .map(([, href, label, path]) => ({ href, label, path }));
    const actual = links(work);
    assert.equal(actual.length, 3);
    assert.deepEqual(actual, links(footer('guide.html')));
    assert.equal((work.match(/target="_blank" rel="noopener noreferrer"/g) ?? []).length, 3);
    const social = work.match(/<nav class="follow-strip-icons"[^>]*>[\s\S]*?<\/nav>/)?.[0];
    assert.equal((social?.match(/<svg[^>]+aria-hidden="true"/g) ?? []).length, 3);
});

test('Work inherits shared footer styling without page-specific overrides', () => {
    assert.doesNotMatch(read('work-game.css'), /\.work-footer/);
    assert.doesNotMatch(read('work.html'), /work-footer/);
    assert.match(read('work.html'), /work-game\.css\?v=\d+(?:\.\d+)*"/);
});
