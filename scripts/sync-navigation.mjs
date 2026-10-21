// Keep shared navigation in committed HTML. No browser fetch or build is needed.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { normalizeNavigation } from './site-navigation.mjs';

const root = new URL('../', import.meta.url);
const args = process.argv.slice(2);
if (args.some(arg => arg !== '--check')) throw new Error('Usage: node scripts/sync-navigation.mjs [--check]');
const check = args.includes('--check');
const paths = [
    ...(await readdir(root)).filter(name => name.endsWith('.html')),
    ...(await readdir(new URL('thoughts/', root))).filter(name => name.endsWith('.html')).map(name => `thoughts/${name}`),
];
const changed = [];
let count = 0;
for (const path of paths) {
    const file = new URL(path, root);
    const source = await readFile(file, 'utf8');
    // Compatibility redirects and standalone demos keep their own shells.
    if (!/<header class="(?:site-hud|reading-hud)(?: site-header)?">/.test(source)) continue;
    count++;
    const output = normalizeNavigation(source, path);
    if (output === source) continue;
    changed.push(path);
    if (!check) await writeFile(fileURLToPath(file), output);
}
if (check && changed.length) {
    console.error(`Navigation is stale: ${changed.join(', ')}. Run node scripts/sync-navigation.mjs.`);
    process.exitCode = 1;
} else {
    console.log(`${check ? 'Checked' : 'Synchronized'} navigation across ${count} pages${check ? '' : `; ${changed.length} updated`}.`);
}
