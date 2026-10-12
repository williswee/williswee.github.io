import { readFile } from 'node:fs/promises';

const origin = 'https://williswee.com';
const keyLocation = `${origin}/indexnow-key.txt`;
const endpoint = 'https://api.indexnow.org/indexnow';
const usage = 'Usage: node scripts/submit-indexnow.mjs [--dry-run] https://williswee.com/path [...]';

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const inputs = args.filter(arg => arg !== '--dry-run');
    if (!inputs.length) throw new Error(usage);

    const urlList = [...new Set(inputs.map(input => {
        let url;
        try {
            url = new URL(input);
        } catch {
            throw new Error(`Invalid URL: ${input}\n${usage}`);
        }
        if (url.origin !== origin || url.username || url.password || input.includes('#')) {
            throw new Error(`URLs must use ${origin}, without credentials or fragments: ${input}`);
        }
        return url.href;
    }))];
    if (urlList.length > 10_000) throw new Error('Submit at most 10,000 unique URLs per request.');

    const key = (await readFile(new URL('../indexnow-key.txt', import.meta.url), 'utf8')).trim();
    if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) {
        throw new Error('indexnow-key.txt must contain an 8 to 128 character key using only letters, numbers, and hyphens.');
    }

    if (dryRun) {
        console.log(`Dry run: ${urlList.length} unique URL(s). No network requests made.`);
        console.log(`Key location: ${keyLocation}`);
        console.log(urlList.join('\n'));
        return;
    }

    const keyResponse = await fetch(keyLocation, {
        headers: { 'User-Agent': 'williswee-indexnow/1.0' },
        redirect: 'error',
        signal: AbortSignal.timeout(30_000)
    });
    if (keyResponse.status !== 200 || (await keyResponse.text()).trim() !== key) {
        throw new Error(`The live key file must return HTTP 200 and match indexnow-key.txt. Publish it before submitting. Received HTTP ${keyResponse.status}.`);
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'User-Agent': 'williswee-indexnow/1.0'
        },
        body: JSON.stringify({ host: 'williswee.com', key, keyLocation, urlList }),
        redirect: 'error',
        signal: AbortSignal.timeout(30_000)
    });
    if (response.status === 200) {
        console.log(`IndexNow received ${urlList.length} URL(s), HTTP 200. Receipt does not guarantee indexing.`);
    } else if (response.status === 202) {
        console.log(`IndexNow received ${urlList.length} URL(s), HTTP 202. Key validation is pending. Receipt does not guarantee indexing.`);
    } else {
        throw new Error(`IndexNow submission failed with HTTP ${response.status}.`);
    }
}

main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});
