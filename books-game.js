(() => {
    'use strict';

    const cards = Array.from(document.querySelectorAll('.book-card'));
    const pills = Array.from(document.querySelectorAll('.filter-pill[data-filter]'));
    const grid = document.getElementById('book-grid');
    const controls = document.querySelector('.book-controls');
    const emptyState = document.getElementById('book-empty');
    const status = document.getElementById('book-status');
    const menu = document.querySelector('.book-filter-menu');
    const filterSidebar = document.querySelector('.book-filter-sidebar');
    const currentFilterLabel = document.querySelector('.current-filter-label');
    const randomButton = document.getElementById('random-book-btn');
    const dock = document.getElementById('floating-book-dock');
    const shuffleButton = document.getElementById('dock-shuffle-btn');
    const topButton = document.getElementById('dock-top-btn');
    const compact = window.matchMedia('(max-width: 760px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function slugify(text) {
        return text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/[\s_-]+/g, '-');
    }

    // Keep existing permalinks, including explicitly assigned IDs. Reserve all
    // page IDs so adding a duplicate title cannot create another duplicate ID.
    const usedIds = new Set(Array.from(document.querySelectorAll('[id]'), (element) => element.id));
    const legacyTargets = new Map();
    const categoryLabels = new Map();
    cards.forEach((card) => {
        const title = card.querySelector('h3');
        const slug = slugify(title ? title.textContent : '');
        if (!card.id) {
            const base = slug || 'book';
            let candidate = base;
            let suffix = 2;
            while (usedIds.has(candidate)) candidate = `${base}-${suffix++}`;
            card.id = candidate;
            usedIds.add(candidate);
        }
        if (slug && !legacyTargets.has(slug)) legacyTargets.set(slug, card);
        const tag = card.querySelector('.book-tag');
        if (tag) categoryLabels.set(card.dataset.category, tag.textContent.trim());
    });

    function targetForHash(hash) {
        if (!hash || hash === '#' || !hash.startsWith('#')) return null;
        let id;
        try {
            id = decodeURIComponent(hash.slice(1));
        } catch {
            return null;
        }
        const target = document.getElementById(id);
        return cards.includes(target) ? target : legacyTargets.get(id) || null;
    }

    pills.forEach((pill) => {
        const filter = pill.dataset.filter;
        const count = document.getElementById(`count-${filter}`);
        if (count) count.textContent = filter === 'all'
            ? cards.length
            : cards.filter((card) => card.dataset.category === filter).length;
    });

    let activeFilter = 'all';
    let selectedCard = null;
    let lastPickedCard = null;
    let navigationVersion = 0;
    let dockUpdateQueued = false;

    function motionBehavior() {
        return reducedMotion.matches ? 'instant' : 'smooth';
    }

    function headerBottom() {
        const header = document.querySelector('.reading-hud');
        return header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
    }

    function safeViewport() {
        const padding = parseFloat(window.getComputedStyle(document.documentElement).scrollPaddingTop);
        const top = Number.isFinite(padding)
            ? padding
            : headerBottom() + (compact.matches ? 80 : 24);
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
        if (!element.hasAttribute('tabindex') && !element.matches('button, summary, a[href]')) {
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
        // whole toolbar disappears. The compact category menu is sticky too;
        // use its measured edge so enlarged text is handled without a fixed gap.
        const obstructionBottom = compact.matches && menu
            ? Math.max(headerBottom(), menu.getBoundingClientRect().bottom)
            : headerBottom();
        const primaryControlObscured = randomButton && randomButton.getBoundingClientRect().top < obstructionBottom;
        setDockVisible(Boolean(selectedCard || primaryControlObscured));
        // Focus quiets the surroundings only while the pick is in the reading
        // viewport. Scrolling away restores the page without losing its link.
        const bounds = safeViewport();
        const rect = selectedCard?.getBoundingClientRect();
        const focusVisible = rect && rect.bottom > bounds.top && rect.top < bounds.bottom;
        if (grid) grid.classList.toggle('book-grid--focus', Boolean(focusVisible));
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

    function alignElement(element, center, behavior) {
        const bounds = safeViewport();
        const rect = element.getBoundingClientRect();
        const availableHeight = bounds.bottom - bounds.top;
        const destination = center && rect.height <= availableHeight
            ? bounds.top + (availableHeight - rect.height) / 2
            : bounds.top;
        window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - destination), behavior });
    }

    function closeCompactMenu() {
        if (menu && compact.matches) menu.open = false;
    }

    function setMenuMode() {
        if (menu) {
            const focusWillHide = compact.matches && menu.contains(document.activeElement)
                && document.activeElement !== menu.querySelector('summary');
            menu.open = !compact.matches;
            if (focusWillHide) focusElement(menu.querySelector('summary'));
        }
        scheduleDockUpdate();
    }

    function setFilter(filter) {
        activeFilter = filter;
        let count = 0;
        cards.forEach((card) => {
            const visible = filter === 'all' || card.dataset.category === filter;
            card.classList.toggle('book-card--hidden', !visible);
            card.hidden = !visible;
            if (visible) count++;
        });
        pills.forEach((pill) => {
            const active = pill.dataset.filter === filter;
            pill.classList.toggle('active', active);
            pill.setAttribute('aria-pressed', String(active));
        });
        const label = categoryLabels.get(filter) || filter;
        if (currentFilterLabel) currentFilterLabel.textContent = filter === 'all' ? 'All books' : label;
        if (status) status.textContent = `${count} ${count === 1 ? 'book' : 'books'}${filter === 'all' ? '' : ` · ${label}`}`;
        if (emptyState) emptyState.hidden = count > 0;
    }

    function clearSpotlight() {
        selectedCard = null;
        if (grid) grid.classList.remove('book-grid--spotlight');
        if (grid) grid.classList.remove('book-grid--focus');
        cards.forEach((card) => card.classList.remove('book-card--spotlight'));
    }

    function clearBookHash() {
        if (targetForHash(window.location.hash)) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }

    function spotlightBook(card, updateHash = true, behavior = motionBehavior()) {
        if (!card) return navigationVersion;
        if (card.hidden) setFilter('all');
        closeCompactMenu();
        clearSpotlight();
        selectedCard = card;
        lastPickedCard = card;
        if (grid) grid.classList.add('book-grid--spotlight');
        card.classList.add('book-card--spotlight');
        // Keep the fixed controls next in reading/Tab order, not after the
        // entire collection. Other recommendations stay freely reachable.
        if (dock) card.after(dock);
        if (updateHash) window.history.replaceState(null, '', `#${encodeURIComponent(card.id)}`);
        setDockVisible(true);
        return queueNavigation(() => {
            focusElement(card);
            alignElement(card, true, behavior);
        });
    }

    function animateRandomButton(button) {
        if (!button || reducedMotion.matches) return;
        button.classList.remove('rolling');
        void button.offsetWidth;
        button.classList.add('rolling');
    }

    function pickRandomBook(event) {
        let available = cards.filter((card) => activeFilter === 'all' || card.dataset.category === activeFilter);
        if (!available.length) {
            setFilter('all');
            available = cards;
        }
        if (!available.length) return;
        const choices = available.length > 1 ? available.filter((card) => card !== lastPickedCard) : available;
        const pick = choices[Math.floor(Math.random() * choices.length)];
        animateRandomButton(event.currentTarget);
        spotlightBook(pick);
    }

    pills.forEach((pill) => {
        pill.addEventListener('click', () => {
            clearSpotlight();
            clearBookHash();
            setFilter(pill.dataset.filter);
            closeCompactMenu();
            if (compact.matches && menu) focusElement(menu.querySelector('summary'));
            queueNavigation(() => {
                if (!controls) return;
                const rect = controls.getBoundingClientRect();
                const bounds = safeViewport();
                if (rect.top < bounds.top || rect.bottom > bounds.bottom) {
                    alignElement(controls, false, motionBehavior());
                }
            });
        });
    });

    [randomButton, shuffleButton].forEach((button) => {
        if (!button) return;
        button.disabled = !cards.length;
        button.addEventListener('click', pickRandomBook);
        button.addEventListener('animationend', () => button.classList.remove('rolling'));
    });
    function exitFocusMode() {
        if (!selectedCard) return;
        const position = { left: window.scrollX, top: window.scrollY, behavior: 'instant' };
        navigationVersion++;
        // Stop any in-flight random-pick scroll before restoring the reading
        // position. Restore content focus before the dock can hide.
        window.scrollTo(position);
        if (dock && dock.contains(document.activeElement)) focusElement(selectedCard);
        clearSpotlight();
        clearBookHash();
        updateDock();
        window.scrollTo(position);
    }
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || event.defaultPrevented || !selectedCard) return;
        event.preventDefault();
        exitFocusMode();
    });
    if (topButton) {
        topButton.addEventListener('click', () => {
            clearSpotlight();
            clearBookHash();
            closeCompactMenu();
            queueNavigation(() => {
                focusElement(randomButton);
                window.scrollTo({ top: 0, behavior: motionBehavior() });
            });
        });
    }

    compact.addEventListener('change', setMenuMode);
    if (menu) menu.addEventListener('toggle', scheduleDockUpdate);
    window.addEventListener('scroll', scheduleDockUpdate, { passive: true });
    window.addEventListener('resize', scheduleDockUpdate);
    window.addEventListener('hashchange', () => {
        const card = targetForHash(window.location.hash);
        if (card) spotlightBook(card, false, 'instant');
        else {
            navigationVersion++;
            clearSpotlight();
            scheduleDockUpdate();
        }
    });
    setMenuMode();
    setFilter('all');
    // The complete reading list is the default. Reveal optional controls only
    // once their behavior and initial state are ready.
    if (filterSidebar) filterSidebar.hidden = false;
    if (randomButton) randomButton.hidden = false;
    updateDock();

    const initialHash = window.location.hash;
    const initialCard = targetForHash(initialHash);
    if (!initialCard) return;
    const initialVersion = spotlightBook(initialCard, false, 'instant');

    // Correct a first anchor jump after fonts/images settle, but never pull a
    // visitor back after they start reading or navigate somewhere else.
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
                    alignElement(initialCard, true, 'instant');
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
