(() => {
    'use strict';

    const notes = Array.from(document.querySelectorAll('.gratitude-note'));
    const randomButton = document.getElementById('random-gratitude-btn');
    const notesGrid = document.querySelector('.gratitude-notes');
    const dock = document.getElementById('floating-gratitude-dock');
    const dockShuffleButton = document.getElementById('gratitude-dock-shuffle-btn');
    const dockTopButton = document.getElementById('gratitude-dock-top-btn');
    const status = document.getElementById('random-gratitude-status');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let selectedNote = null;
    let lastPickedNote = null;
    let navigationVersion = 0;
    let dockUpdateQueued = false;

    function targetForHash(hash) {
        if (!hash || hash === '#' || !hash.startsWith('#')) return null;
        let id;
        try {
            id = decodeURIComponent(hash.slice(1));
        } catch {
            return null;
        }
        const target = document.getElementById(id);
        return notes.includes(target) ? target : null;
    }

    function motionBehavior() {
        return reducedMotion.matches ? 'instant' : 'smooth';
    }

    function headerBottom() {
        const header = document.querySelector('.reading-hud');
        return header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
    }

    function safeViewport() {
        const padding = parseFloat(window.getComputedStyle(document.documentElement).scrollPaddingTop);
        const top = Number.isFinite(padding) ? padding : headerBottom() + 24;
        let bottom = window.innerHeight - 24;
        if (dock && !dock.hidden) {
            const dockHeight = dock.getBoundingClientRect().height;
            const dockBottom = parseFloat(window.getComputedStyle(dock).bottom) || 24;
            bottom = Math.min(bottom, window.innerHeight - dockHeight - dockBottom - 16);
        }
        return { top, bottom: Math.max(top, bottom) };
    }

    function focusElement(element) {
        if (!element) return;
        if (!element.hasAttribute('tabindex') && !element.matches('button, a[href]')) {
            element.setAttribute('tabindex', '-1');
        }
        element.focus({ preventScroll: true });
    }

    function setDockVisible(visible) {
        if (!dock) return;
        if (!visible && dock.contains(document.activeElement)) focusElement(randomButton);
        dock.hidden = !visible;
        dock.classList.toggle('show', visible);
    }

    function updateDock() {
        dockUpdateQueued = false;
        // Hand off as soon as the main action is clipped, not only after the
        // whole toolbar disappears beneath the fixed header.
        const primaryControlObscured = randomButton && randomButton.getBoundingClientRect().top < headerBottom();
        setDockVisible(Boolean(selectedNote || primaryControlObscured));
        // Focus quiets the surroundings only while the pick is in the reading
        // viewport. Scrolling away restores the page without losing its link.
        const bounds = safeViewport();
        const rect = selectedNote?.getBoundingClientRect();
        const focusVisible = rect && rect.bottom > bounds.top && rect.top < bounds.bottom;
        if (notesGrid) notesGrid.classList.toggle('gratitude-notes--focus', Boolean(focusVisible));
    }

    function scheduleDockUpdate() {
        if (dockUpdateQueued) return;
        dockUpdateQueued = true;
        window.requestAnimationFrame(updateDock);
    }

    function queueNavigation(action) {
        const version = ++navigationVersion;
        window.requestAnimationFrame(() => {
            if (version !== navigationVersion) return;
            action();
            updateDock();
        });
        return version;
    }

    function alignNote(note, behavior) {
        const bounds = safeViewport();
        const rect = note.getBoundingClientRect();
        const availableHeight = bounds.bottom - bounds.top;
        const destination = rect.height <= availableHeight
            ? bounds.top + (availableHeight - rect.height) / 2
            : bounds.top;
        window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - destination), behavior });
    }

    function clearSpotlight() {
        selectedNote = null;
        if (notesGrid) notesGrid.classList.remove('gratitude-notes--spotlight');
        if (notesGrid) notesGrid.classList.remove('gratitude-notes--focus');
        notes.forEach((note) => note.classList.remove('gratitude-note--spotlight'));
        if (status) status.textContent = '';
    }

    function spotlightNote(note, updateHash = true, behavior = motionBehavior()) {
        if (!note) return navigationVersion;
        clearSpotlight();
        selectedNote = note;
        lastPickedNote = note;
        if (notesGrid) notesGrid.classList.add('gratitude-notes--spotlight');
        note.classList.add('gratitude-note--spotlight');
        // The dock stays visually fixed, but follows this note in reading and
        // keyboard order instead of making visitors traverse the full journal.
        if (dock) note.after(dock);
        if (updateHash && note.id) {
            window.history.replaceState(null, '', `#${encodeURIComponent(note.id)}`);
        }
        if (status) {
            const number = note.dataset.noteNumber;
            status.textContent = number ? `Gratitude note #${number} selected.` : 'Gratitude note selected.';
        }
        setDockVisible(true);
        return queueNavigation(() => {
            focusElement(note);
            alignNote(note, behavior);
        });
    }

    function spinControl(button) {
        if (!button || reducedMotion.matches) return;
        button.classList.remove('rolling');
        void button.offsetWidth;
        button.classList.add('rolling');
    }

    function pickRandomNote(event) {
        if (!notes.length) return;
        const choices = notes.length > 1 ? notes.filter((note) => note !== lastPickedNote) : notes;
        const pick = choices[Math.floor(Math.random() * choices.length)];
        spinControl(event.currentTarget);
        spotlightNote(pick);
    }

    [randomButton, dockShuffleButton].forEach((button) => {
        if (!button) return;
        button.disabled = !notes.length;
        button.addEventListener('click', pickRandomNote);
        button.addEventListener('animationend', () => button.classList.remove('rolling'));
    });

    function exitFocusMode() {
        if (!selectedNote) return;
        const position = { left: window.scrollX, top: window.scrollY, behavior: 'instant' };
        navigationVersion++;
        window.scrollTo(position);
        if (dock && dock.contains(document.activeElement)) focusElement(selectedNote);
        clearSpotlight();
        if (targetForHash(window.location.hash)) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        updateDock();
        window.scrollTo(position);
    }
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || event.defaultPrevented || !selectedNote) return;
        event.preventDefault();
        exitFocusMode();
    });

    if (dockTopButton) {
        dockTopButton.addEventListener('click', () => {
            clearSpotlight();
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            queueNavigation(() => {
                focusElement(randomButton);
                window.scrollTo({ top: 0, behavior: motionBehavior() });
            });
        });
    }

    notes.forEach((note) => {
        const link = note.querySelector('h2 a[href]');
        if (!link) return;
        link.addEventListener('click', (event) => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const target = targetForHash(link.getAttribute('href'));
            if (!target || targetForHash(window.location.hash) !== target) return;

            // Different note links keep native history and hashchange handling.
            // Selecting the current link still focuses it without another entry.
            event.preventDefault();
            spotlightNote(target, false);
        });
    });

    window.addEventListener('scroll', scheduleDockUpdate, { passive: true });
    window.addEventListener('resize', scheduleDockUpdate);
    window.addEventListener('load', scheduleDockUpdate, { once: true });
    window.addEventListener('hashchange', () => {
        const note = targetForHash(window.location.hash);
        if (note) spotlightNote(note, false, 'instant');
        else {
            navigationVersion++;
            clearSpotlight();
            scheduleDockUpdate();
        }
    });
    // Native note links remain useful even if this enhancement cannot load.
    if (randomButton) randomButton.hidden = false;
    updateDock();

    const initialHash = window.location.hash;
    const initialNote = targetForHash(initialHash);
    if (!initialNote) return;
    const initialVersion = spotlightNote(initialNote, false, 'instant');

    // Correct a first anchor jump after fonts/images settle, only while the
    // visitor has not begun reading or navigated to another note.
    let userInteracted = false;
    let initialAlignmentFinished = false;
    const interruptionEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
    const stopInitialAlignment = () => { userInteracted = true; };
    interruptionEvents.forEach((name) => window.addEventListener(name, stopInitialAlignment, { passive: true }));

    function finishInitialAlignment() {
        if (initialAlignmentFinished) return;
        initialAlignmentFinished = true;
        window.clearTimeout(settleTimeout);
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                if (!userInteracted && navigationVersion === initialVersion && window.location.hash === initialHash) {
                    alignNote(initialNote, 'instant');
                    scheduleDockUpdate();
                }
                interruptionEvents.forEach((name) => window.removeEventListener(name, stopInitialAlignment));
            });
        });
    }

    const loaded = document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    const settleTimeout = window.setTimeout(finishInitialAlignment, 2000);
    Promise.allSettled([loaded, fontsReady]).then(finishInitialAlignment);
})();
