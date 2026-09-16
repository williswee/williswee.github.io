import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function fixture(t) {
    const directory = await mkdtemp(path.join(tmpdir(), 'gratitude-publisher-test-'));
    t.after(() => rm(directory, { recursive: true, force: true }));
    await mkdir(path.join(directory, 'scripts'));
    for (const file of ['scripts/render-gratitude.mjs', 'gratitude-notes.md', 'gratitude.html', 'sitemap.xml']) {
        await copyFile(path.join(root, file), path.join(directory, file));
    }
    return directory;
}

function render(directory, ...args) {
    return spawnSync(process.execPath, [path.join(directory, 'scripts/render-gratitude.mjs'), ...args], {
        cwd: directory,
        encoding: 'utf8',
    });
}

test('--check accepts fresh outputs without writing them', async (t) => {
    const directory = await fixture(t);
    assert.equal(render(directory).status, 0);
    const before = await outputs(directory);
    const result = render(directory, '--check');
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /outputs are current/);
    assert.deepEqual(await outputs(directory), before);
});

test('--check detects a new unpublished source note without changing outputs', async (t) => {
    const directory = await fixture(t);
    assert.equal(render(directory).status, 0);
    const before = await outputs(directory);
    await appendNote(directory, 9000);
    const result = render(directory, '--check');
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, /stale: gratitude.html, sitemap.xml/);
    assert.deepEqual(await outputs(directory), before);
});

test('--check detects generated markup drift and sitemap drift independently', async (t) => {
    const directory = await fixture(t);
    assert.equal(render(directory).status, 0);
    const [html, sitemap] = await outputs(directory);
    await writeFile(path.join(directory, 'gratitude.html'), html.toString().replace('Gratitude.</h1>', 'Journal.</h1>'));
    let before = await outputs(directory);
    let result = render(directory, '--check');
    assert.equal(result.status, 1);
    assert.match(result.stderr, /stale: gratitude.html\./);
    assert.deepEqual(await outputs(directory), before);
    await writeFile(path.join(directory, 'gratitude.html'), html);
    await writeFile(path.join(directory, 'sitemap.xml'), sitemap.toString().replace(/(gratitude\.html<\/loc>\s*<lastmod>)[^<]+/, '$11900-01-01'));
    before = await outputs(directory);
    result = render(directory, '--check');
    assert.equal(result.status, 1);
    assert.match(result.stderr, /stale: sitemap.xml\./);
    assert.deepEqual(await outputs(directory), before);
});

test('unknown publisher options fail before writing outputs', async (t) => {
    const directory = await fixture(t);
    const before = await outputs(directory);
    const result = render(directory, '--typo');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Usage:/);
    assert.deepEqual(await outputs(directory), before);
});

async function outputs(directory) {
    return Promise.all(['gratitude.html', 'sitemap.xml'].map((file) => readFile(path.join(directory, file))));
}

async function appendNote(directory, number, date = '2099-01-01') {
    const file = path.join(directory, 'gratitude-notes.md');
    const markdown = await readFile(file, 'utf8');
    await writeFile(file, `${markdown}\n\n## Gratitude note #${number}\n\n*${date}*\n\nPublisher regression fixture.\n`);
}

test('valid notes render idempotently without changing their permalinks', async (t) => {
    const directory = await fixture(t);
    const markdown = await readFile(path.join(directory, 'gratitude-notes.md'), 'utf8');
    const numbers = [...markdown.matchAll(/^## Gratitude note #(\d+)\s*$/gm)].map((match) => Number(match[1]));
    const first = render(directory);
    assert.equal(first.status, 0, first.stderr);
    const firstOutputs = await outputs(directory);
    const html = firstOutputs[0].toString();
    assert.equal((html.match(/class="gratitude-note"/g) ?? []).length, numbers.length);
    for (const number of numbers) {
        assert.equal((html.match(new RegExp(`id="note-${number}"`, 'g')) ?? []).length, 1);
    }
    const second = render(directory);
    assert.equal(second.status, 0, second.stderr);
    assert.deepEqual(await outputs(directory), firstOutputs);
});

test('a new unique note updates the page and sitemap while keeping existing IDs', async (t) => {
    const directory = await fixture(t);
    const markdown = await readFile(path.join(directory, 'gratitude-notes.md'), 'utf8');
    const numbers = [...markdown.matchAll(/^## Gratitude note #(\d+)\s*$/gm)].map((match) => Number(match[1]));
    const nextNumber = Math.max(...numbers) + 1;
    await appendNote(directory, nextNumber);
    const result = render(directory);
    assert.equal(result.status, 0, result.stderr);
    const [htmlBuffer, sitemapBuffer] = await outputs(directory);
    const html = htmlBuffer.toString();
    assert.equal((html.match(/class="gratitude-note"/g) ?? []).length, numbers.length + 1);
    assert.match(html, new RegExp(`<p class="gratitude-count">${numbers.length + 1} notes</p>`));
    for (const number of [...numbers, nextNumber]) {
        assert.equal((html.match(new RegExp(`id="note-${number}"`, 'g')) ?? []).length, 1);
    }
    assert.match(sitemapBuffer.toString(), /<loc>https:\/\/(?:www\.)?williswee\.com\/gratitude\.html<\/loc>\s*<lastmod>2099-01-01<\/lastmod>/);
});

test('Windows line endings keep valid note headings readable', async (t) => {
    const directory = await fixture(t);
    const file = path.join(directory, 'gratitude-notes.md');
    const markdown = await readFile(file, 'utf8');
    await writeFile(file, markdown.replace(/\r?\n/g, '\r\n'));
    const result = render(directory);
    assert.equal(result.status, 0, result.stderr);
});

for (const number of ['0', '-1', '1.5', '9007199254740992', 'not-a-number', '']) {
    test(`invalid note number ${JSON.stringify(number)} fails before writing either output`, async (t) => {
        const directory = await fixture(t);
        const before = await outputs(directory);
        await appendNote(directory, number);
        const result = render(directory);
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /Invalid gratitude note number .*expected a positive safe integer/);
        assert.deepEqual(await outputs(directory), before);
    });
}

for (const leadingZero of [false, true]) {
    test(`duplicate note numbers${leadingZero ? ' with leading zeros' : ''} fail without changing output`, async (t) => {
        const directory = await fixture(t);
        const before = await outputs(directory);
        const markdown = await readFile(path.join(directory, 'gratitude-notes.md'), 'utf8');
        const existingNumber = markdown.match(/^## Gratitude note #(\d+)\s*$/m)[1];
        await appendNote(directory, leadingZero ? `0${existingNumber}` : existingNumber);
        const result = render(directory);
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, new RegExp(`Duplicate gratitude note number #${existingNumber}:`));
        assert.deepEqual(await outputs(directory), before);
    });
}
