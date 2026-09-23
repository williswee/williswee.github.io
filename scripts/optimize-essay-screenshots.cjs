#!/usr/bin/env node
'use strict';

// Rebuild the eight audited TickerTown image families from their untouched PNGs.
// Generated with Sharp 0.34.5; use that version for byte-for-byte --check runs.
// Requires an existing installation; no dependencies are installed here.
// Preview: node scripts/optimize-essay-screenshots.cjs --output-dir /absolute/candidates
// Apply after visual review by copying the generated files into images/ and
// updating the two essays with the printed src/srcset values. --check verifies
// current outputs and essay references without writing. Old outputs are retained
// so cached HTML continues to load its original image URLs.
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const sharp = require('sharp');

const outputIndex = process.argv.indexOf('--output-dir');
if (outputIndex < 0 || !process.argv[outputIndex + 1]) {
    console.error('Usage: node scripts/optimize-essay-screenshots.cjs --output-dir <directory> [--check]');
    process.exit(1);
}
const outputDirectory = path.resolve(process.argv[outputIndex + 1]);
const checkOnly = process.argv.includes('--check');
const imagesDirectory = path.resolve(__dirname, '..', 'images');
const families = [
    { name: 'tickertown-usability-zen', width: 1448, height: 1086, essay: 'tickertownusabilitytest' },
    { name: 'tickertown-usability-waitlist', width: 2036, height: 1497, essay: 'tickertownusabilitytest' },
    { name: 'tickertown-usability-backtest', width: 2062, height: 1503, essay: 'tickertownusabilitytest' },
    { name: 'tickertown-update-waitlist', width: 2969, height: 2032, essay: 'tickertownupdate' },
    { name: 'tickertown-update-public-profile', width: 2880, height: 2016, essay: 'tickertownupdate' },
    { name: 'tickertown-update-portfolio', width: 2880, height: 2016, essay: 'tickertownupdate' },
    { name: 'tickertown-update-shareable', width: 2880, height: 2032, essay: 'tickertownupdate' },
    { name: 'tickertown-update-figma', width: 2992, height: 2038, essay: 'tickertownupdate' },
];
const options = { quality: 90, effort: 6, smartSubsample: true, lossless: false };

(async () => {
    if (!checkOnly) await fs.mkdir(outputDirectory, { recursive: true });
    const results = [];
    const references = [];
    for (const family of families) {
        const source = path.join(imagesDirectory, `${family.name}.png`);
        const metadata = await sharp(source).metadata();
        if (metadata.width !== family.width || metadata.height !== family.height) {
            throw new Error(`Unexpected source dimensions: ${source}`);
        }
        const variants = [];
        for (const width of [family.width, 640, 960, 1440]) {
            const height = Math.round(width * family.height / family.width);
            const { data, info } = await sharp(source)
                .resize({ width, height, fit: 'fill', kernel: 'lanczos3' })
                .webp(options)
                .toBuffer({ resolveWithObject: true });
            const sha256 = createHash('sha256').update(data).digest('hex');
            const filename = `${family.name}${width === family.width ? '' : `-${width}`}-${sha256.slice(0, 12)}.webp`;
            const output = path.join(outputDirectory, filename);
            if (info.width !== width || info.height !== height) {
                throw new Error(`Unexpected output dimensions: ${filename}`);
            }
            if (checkOnly) {
                if (!(await fs.readFile(output)).equals(data)) throw new Error(`Stale generated image: ${output}`);
            } else {
                await fs.writeFile(output, data);
            }
            variants.push({ filename, width });
            const original = path.join(imagesDirectory, `${family.name}${width === family.width ? '' : `-${width}`}.webp`);
            const beforeBytes = (await fs.stat(original)).size;
            results.push({ filename, width, height, beforeBytes, bytes: data.length, sha256 });
        }
        const src = `../images/${variants[0].filename}`;
        const srcset = [...variants].sort((a, b) => a.width - b.width)
            .map(variant => `../images/${variant.filename} ${variant.width}w`).join(', ');
        const essay = `thoughts/${family.essay}.html`;
        if (checkOnly) {
            const html = await fs.readFile(path.resolve(__dirname, '..', essay), 'utf8');
            if (!html.includes(`src="${src}"`) || !html.includes(`srcset="${srcset}"`)) {
                throw new Error(`Stale image references: ${essay}`);
            }
        }
        references.push({ name: family.name, essay, src, srcset });
    }
    console.log(JSON.stringify({ source: 'Untouched PNG originals', checkOnly, options, results, references }, null, 2));
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
