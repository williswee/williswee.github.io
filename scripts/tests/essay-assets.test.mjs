import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../../', import.meta.url);

for (const [family, width, height] of [['freedom', 1447, 1087], ['nomoney', 1448, 1086], ['talktousers', 1447, 1087]]) {
    test(`${family} uses existing content-addressed hero variants without changing dimensions`, () => {
        const page = new URL(`thoughts/${family}.html`, root);
        const html = readFileSync(page, 'utf8');
        const image = html.match(new RegExp(`<img src="\\.\\./images/${family}-[a-f0-9]{12}\\.webp"[^>]+>`))?.[0];
        assert.ok(image, 'full-sized src must have a fresh content-hashed path');
        assert.ok(image.includes(`width="${width}" height="${height}"`));
        assert.match(image, /loading="eager"/);
        assert.match(image, /decoding="async"/);
        const src = image.match(/\ssrc="([^"]+)"/)[1];
        const candidates = image.match(/\ssrcset="([^"]+)"/)[1].split(', ').map(candidate => candidate.split(' '));
        assert.deepEqual(candidates.map(([, descriptor]) => descriptor), ['640w', '960w', '1440w', `${width}w`]);
        assert.equal(candidates.at(-1)[0], src);
        assert.equal(new Set(candidates.map(([url]) => url)).size, 4);
        for (const [url, descriptor] of candidates) {
            const candidateWidth = Number.parseInt(descriptor, 10);
            const expectedPrefix = `${family}${candidateWidth === width ? '' : `-${candidateWidth}`}-`;
            const filename = url.split('/').at(-1);
            assert.ok(filename.startsWith(expectedPrefix));
            assert.match(filename, /-[a-f0-9]{12}\.webp$/);
            const bytes = readFileSync(new URL(url, page));
            assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
            assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
            const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
            assert.equal(filename, `${expectedPrefix}${hash}.webp`);
        }
        assert.doesNotMatch(image, new RegExp(`${family}(?:-640|-960|-1440)?\\.webp`));
    });
}
