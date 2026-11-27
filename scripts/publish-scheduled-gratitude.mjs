import { execFileSync } from 'node:child_process';
import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const queueDir = path.join(root, 'scripts', 'scheduled-gratitude');
const markdownPath = path.join(root, 'gratitude-notes.md');
const rendererPath = path.join(root, 'scripts', 'render-gratitude.mjs');

const args = new Set(process.argv.slice(2));
const validArgs = new Set(['--dry-run', '--force']);
for (const arg of args) {
    if (!validArgs.has(arg)) {
        throw new Error(`Usage: node scripts/publish-scheduled-gratitude.mjs [--dry-run] [--force]`);
    }
}
const dryRun = args.has('--dry-run');
const force = args.has('--force');

function getSingaporeDate(date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Singapore',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}

function parseQueuedNote(content, filename) {
    const trimmed = content.trim();
    const headerMatch = trimmed.match(/^## Gratitude note #(\d+)\r?\n\r?\n\*(\d{4}-\d{2}-\d{2})\*\r?\n\r?\n([\s\S]+)$/);
    if (!headerMatch) {
        throw new Error(`Invalid scheduled gratitude note format in ${filename}`);
    }
    const number = Number(headerMatch[1]);
    const date = headerMatch[2];
    const body = headerMatch[3].trim();
    const parsedDate = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
        throw new Error(`Invalid date in ${filename}: ${date}`);
    }
    if (!body) {
        throw new Error(`Empty body in ${filename}`);
    }
    return { filename, number, date, body };
}

function getExistingNumbers(markdown) {
    const numbers = new Set();
    for (const match of markdown.matchAll(/^## Gratitude note #(\d+)\r?$/gm)) {
        numbers.add(Number(match[1]));
    }
    return numbers;
}

let files = [];
try {
    files = (await readdir(queueDir)).filter((name) => name.endsWith('.md')).sort();
} catch (error) {
    if (error.code === 'ENOENT') {
        console.log('No scheduled gratitude directory found.');
        process.exit(0);
    }
    throw error;
}

if (files.length === 0) {
    console.log('No scheduled gratitude notes queued.');
    process.exit(0);
}

const todaySgt = getSingaporeDate();
let markdown = await readFile(markdownPath, 'utf8');
const existingNumbers = getExistingNumbers(markdown);
let maxNumber = existingNumbers.size > 0 ? Math.max(...existingNumbers) : 0;

const queuedNotes = [];
for (const filename of files) {
    const fullPath = path.join(queueDir, filename);
    const content = await readFile(fullPath, 'utf8');
    queuedNotes.push({ fullPath, ...parseQueuedNote(content, filename) });
}

const dueNotes = queuedNotes.filter((note) => force || note.date <= todaySgt);

if (dryRun) {
    console.log(`Today (Asia/Singapore): ${todaySgt}`);
    const dryRunNumbers = new Set(existingNumbers);
    let dryRunMax = maxNumber;
    for (const note of queuedNotes) {
        if (markdown.includes(note.body)) {
            console.log(`[dry-run] ${note.filename}: ALREADY PUBLISHED (would remove queue file)`);
            continue;
        }
        const assignedNumber = dryRunNumbers.has(note.number) ? ++dryRunMax : note.number;
        dryRunNumbers.add(assignedNumber);
        if (assignedNumber > dryRunMax) dryRunMax = assignedNumber;
        const status = (force || note.date <= todaySgt) ? 'DUE NOW' : `SCHEDULED (${note.date})`;
        console.log(`[dry-run] ${note.filename}: #${assignedNumber} (${status})`);
    }
    if (dueNotes.length === 0) {
        console.log('[dry-run] No notes due today; all queued notes passed format validation.');
    }
    process.exit(0);
}

if (dueNotes.length === 0) {
    console.log(`No scheduled gratitude notes due on ${todaySgt} (Asia/Singapore).`);
    process.exit(0);
}

const published = [];
const skippedDuplicates = [];
for (const note of dueNotes) {
    if (markdown.includes(note.body)) {
        skippedDuplicates.push(note);
        continue;
    }

    let assignedNumber = note.number;
    if (existingNumbers.has(assignedNumber)) {
        assignedNumber = maxNumber + 1;
    }
    existingNumbers.add(assignedNumber);
    if (assignedNumber > maxNumber) {
        maxNumber = assignedNumber;
    }

    const entry = `## Gratitude note #${assignedNumber}\n\n*${note.date}*\n\n${note.body}\n`;
    const separator = markdown.endsWith('\n\n') ? '' : markdown.endsWith('\n') ? '\n' : '\n\n';
    markdown = `${markdown}${separator}${entry}`;
    published.push({ ...note, assignedNumber });
}

if (published.length > 0) {
    await writeFile(markdownPath, markdown);
}
for (const note of [...published, ...skippedDuplicates]) {
    await rm(note.fullPath);
}

if (published.length > 0) {
    execFileSync(process.execPath, [rendererPath], { stdio: 'inherit' });
    execFileSync(process.execPath, [rendererPath, '--check'], { stdio: 'inherit' });
    console.log(`Published scheduled gratitude note(s): ${published.map((n) => `#${n.assignedNumber}`).join(', ')}`);
} else if (skippedDuplicates.length > 0) {
    console.log(`Removed already-published queued note(s): ${skippedDuplicates.map((n) => n.filename).join(', ')}`);
}
