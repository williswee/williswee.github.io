import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const markdownPath = path.join(root, 'gratitude-notes.md');
const outputPath = path.join(root, 'gratitude.html');

const markdown = await readFile(markdownPath, 'utf8');
const parts = markdown.split(/^## Gratitude note #(\d+)\s*$/gm);
const notes = [];

for (let index = 1; index < parts.length; index += 2) {
    const number = Number(parts[index]);
    const section = parts[index + 1].trim();
    const metadata = section.match(/^\*(\d{4}-\d{2}-\d{2}) · \[Original note\]\((https?:\/\/[^)]+)\)\*\s*/);

    if (!metadata) {
        throw new Error(`Could not parse metadata for gratitude note #${number}`);
    }

    const body = section.slice(metadata[0].length).trim();
    notes.push({
        number,
        date: metadata[1],
        sourceUrl: metadata[2],
        paragraphs: body.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean),
    });
}

if (notes.length === 0) {
    throw new Error('No gratitude notes found');
}

function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function linkify(value) {
    return escapeHtml(value).replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
    );
}

function humanDate(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, day)));
}

const noteMarkup = [...notes]
    .reverse()
    .map((note) => `
                <article class="gratitude-note" id="note-${note.number}" data-note-number="${note.number}" tabindex="-1">
                    <div class="gratitude-note-heading">
                        <div>
                            <h2><a href="#note-${note.number}" title="Link to gratitude note #${note.number}">Gratitude note #${note.number}<span class="gratitude-permalink-cue" aria-hidden="true">#</span></a></h2>
                            <time datetime="${note.date}">${humanDate(note.date)}</time>
                        </div>
                    </div>
                    <div class="gratitude-note-body">
${note.paragraphs.map((paragraph) => `                        <p>${linkify(paragraph)}</p>`).join('\n')}
                    </div>
                </article>`)
    .join('\n');

const html = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gratitude Notes - Willis Wee</title>
    <meta name="description" content="A growing archive of Willis Wee's daily gratitude notes—three small things worth noticing.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500;1,6..72,600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css?v=1.9">
    <link rel="icon" type="image/png" href="avatar.png">
    <script src="gratitude.js" defer></script>
</head>

<body>
    <div class="container">
        <header>
            <div class="site-brand">
                <img src="avatar.png" alt="Willis Wee" class="avatar" width="48" height="48">
                <span class="site-name">Willis Wee</span>
            </div>
            <nav>
                <a href="index.html">About</a>
                <a href="thoughts/index.html">Thoughts</a>
                <a href="guide.html">Guide</a>
                <a href="work.html">Work</a>
                <a href="books.html">Books</a>
                <a href="gratitude.html" class="active">Gratitude</a>
            </nav>
        </header>

        <main>
            <section class="gratitude-hero" aria-labelledby="gratitude-title">
                <p class="gratitude-eyebrow">A daily practice</p>
                <h1 id="gratitude-title">Gratitude notes</h1>
                <p class="gratitude-intro">Every weekday, I write down three small things that brought me joy.</p>
                <div class="gratitude-toolbar">
                    <button class="random-pick-btn" id="random-gratitude-btn" type="button" aria-label="Read a random gratitude note">
                        <span class="random-pick-icon" aria-hidden="true">🎲</span>
                        <span>Random pick</span>
                    </button>
                    <p class="gratitude-status" id="random-gratitude-status" aria-live="polite"></p>
                </div>
            </section>

            <div class="gratitude-notes" aria-label="Gratitude notes, latest first">
${noteMarkup}
            </div>
        </main>

        <div class="floating-book-dock" id="floating-gratitude-dock" aria-label="Gratitude note navigation">
            <button class="dock-btn dock-btn--shuffle" id="gratitude-dock-shuffle-btn" type="button" aria-label="Pick another random gratitude note">
                <span class="dock-icon">🎲</span>
                <span>Another pick</span>
                <span class="dock-shortcut" aria-hidden="true">↻</span>
            </button>
            <button class="dock-btn dock-btn--top" id="gratitude-dock-top-btn" type="button" aria-label="Return to the top of the gratitude notes">
                <span class="dock-icon">↑</span>
                <span>Top</span>
            </button>
        </div>

        <footer class="follow-strip">
            <span class="follow-strip-label">Follow</span>
            <div class="follow-strip-icons">
                <a href="https://williswee.substack.com" class="follow-icon" target="_blank" rel="noopener noreferrer" aria-label="Substack">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/></svg>
                </a>
                <a href="https://x.com/williswee" class="follow-icon" target="_blank" rel="noopener noreferrer" aria-label="X">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
                </a>
                <a href="https://www.linkedin.com/in/williswee/" class="follow-icon" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
            </div>
        </footer>
    </div>
</body>

</html>
`;

await writeFile(outputPath, html);
console.log(`Rendered ${notes.length} gratitude notes to ${path.relative(root, outputPath)}`);
