(() => {
    'use strict';

    const landscape = document.querySelector('.essay-page .reading-landscape');
    if (!landscape) return;

    const scenes = [
        '01-misty-ridges.webp',
        '02-quiet-bay.webp',
        '03-bamboo-grove.webp',
        '04-dune-grasses.webp',
        '05-rainy-pines.webp',
        '06-still-lake.webp',
        '07-coastal-cliff.webp',
        '08-terraced-hills.webp',
        '09-forest-path.webp',
        '10-distant-islands.webp'
    ];
    const storageKey = 'willis:essay-landscape';
    let previous;
    try {
        previous = sessionStorage.getItem(storageKey);
    } catch {
        // The scenery still works when browser storage is unavailable.
    }

    const choices = scenes.filter(scene => scene !== previous);
    const selected = choices[Math.floor(Math.random() * choices.length)];
    try {
        sessionStorage.setItem(storageKey, selected);
    } catch {
        // Without storage, each page load is an independent random choice.
    }

    // Set a source only after choosing, so the browser downloads one scene.
    // This script runs once during parsing; the scene never changes while reading.
    const image = new Image(1024, 1536);
    image.alt = '';
    image.decoding = 'async';
    image.fetchPriority = 'low';
    image.addEventListener('error', () => image.remove(), {once: true});
    image.src = `../images/reading-landscapes/${selected}`;
    landscape.append(image);
})();
