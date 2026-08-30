(function () {
    const notes = Array.from(document.querySelectorAll('.gratitude-note'));
    const randomButton = document.getElementById('random-gratitude-btn');
    const notesGrid = document.querySelector('.gratitude-notes');
    const dock = document.getElementById('floating-gratitude-dock');
    const dockShuffleButton = document.getElementById('gratitude-dock-shuffle-btn');
    const dockTopButton = document.getElementById('gratitude-dock-top-btn');
    const controls = document.querySelector('.gratitude-toolbar');
    const status = document.getElementById('random-gratitude-status');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let lastPickedNote = null;
    let pickedPulseTimer = null;

    function clearSpotlight() {
        notesGrid?.classList.remove('gratitude-notes--spotlight');
        notes.forEach((note) => note.classList.remove('gratitude-note--spotlight', 'gratitude-note--picked'));
    }

    function spotlightNote(note, updateHash = true) {
        if (!note) return;

        clearSpotlight();
        lastPickedNote = note;
        notesGrid?.classList.add('gratitude-notes--spotlight');
        note.classList.add('gratitude-note--spotlight');

        window.clearTimeout(pickedPulseTimer);
        void note.offsetWidth;
        note.classList.add('gratitude-note--picked');
        pickedPulseTimer = window.setTimeout(() => {
            note.classList.remove('gratitude-note--picked');
        }, 950);

        if (updateHash && note.id) {
            window.history.replaceState(null, '', `#${note.id}`);
        }

        if (status) {
            const noteNumber = note.dataset.noteNumber;
            status.textContent = noteNumber ? `Gratitude note #${noteNumber} selected.` : 'Gratitude note selected.';
        }

        note.scrollIntoView({
            behavior: reduceMotion.matches ? 'auto' : 'smooth',
            block: 'center',
        });
        note.focus({ preventScroll: true });
        dock?.classList.add('show');
    }

    function spinControl(button) {
        if (!button) return;
        button.classList.remove('rolling');
        void button.offsetWidth;
        button.classList.add('rolling');
        window.setTimeout(() => button.classList.remove('rolling'), 450);
    }

    function pickRandomNote(sourceButton) {
        if (notes.length === 0) return;

        let pick;
        if (notes.length > 1) {
            do {
                pick = notes[Math.floor(Math.random() * notes.length)];
            } while (pick === lastPickedNote);
        } else {
            [pick] = notes;
        }

        spinControl(sourceButton);
        spotlightNote(pick, true);
    }

    randomButton?.addEventListener('click', () => pickRandomNote(randomButton));
    dockShuffleButton?.addEventListener('click', () => pickRandomNote(dockShuffleButton));

    dockTopButton?.addEventListener('click', () => {
        clearSpotlight();
        dock?.classList.remove('show');
        if (status) status.textContent = '';
        window.history.replaceState(null, '', window.location.pathname);
        window.scrollTo({
            top: 0,
            behavior: reduceMotion.matches ? 'auto' : 'smooth',
        });
    });

    window.addEventListener('scroll', () => {
        if (!controls || !dock) return;
        const controlsRect = controls.getBoundingClientRect();

        if (controlsRect.bottom < 0) {
            dock.classList.add('show');
        } else if (!notesGrid?.classList.contains('gratitude-notes--spotlight')) {
            dock.classList.remove('show');
        }
    }, { passive: true });

    function spotlightFromHash() {
        if (!window.location.hash) return;
        const target = document.getElementById(window.location.hash.slice(1));
        if (target?.classList.contains('gratitude-note')) {
            window.setTimeout(() => spotlightNote(target, false), 150);
        }
    }

    spotlightFromHash();
    window.addEventListener('hashchange', spotlightFromHash);
})();
