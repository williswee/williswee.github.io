(() => {
    'use strict';

    const menu = document.querySelector('.chapter-menu');
    const links = Array.from(document.querySelectorAll('.project-nav-link'));
    const currentLabel = document.querySelector('.current-chapter');
    const compact = window.matchMedia('(max-width: 760px)');

    function targetForHash(hash) {
        if (!hash || hash === '#' || !hash.startsWith('#')) return null;
        let id = hash.slice(1);
        try {
            id = decodeURIComponent(id);
        } catch {
            return null;
        }
        const target = document.getElementById(id);
        return target && target.matches('.timeline-item') ? target : null;
    }

    const chapters = links.map((link) => ({
        link,
        section: targetForHash(link.getAttribute('href'))
    })).filter((chapter) => chapter.section);
    if (!chapters.length) return;

    const progress = document.createElement('div');
    progress.className = 'reading-progress-bar';
    progress.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progress);

    let queued = false;
    let activeId;
    let previousScrollY = window.scrollY;
    const menuSummary = menu?.querySelector('summary');
    let previousCompact = compact.matches;
    let lastFocused = document.activeElement;

    // WebKit can blur the summary when CSS hides it before the media event.
    // Remember focus, but discard it when the reader moves elsewhere.
    document.addEventListener('focusin', (event) => {
        if (event.target === document.body && previousCompact && !compact.matches && lastFocused === menuSummary) return;
        lastFocused = event.target;
    });
    document.addEventListener('pointerdown', (event) => {
        if (lastFocused === menuSummary && !menuSummary?.contains(event.target)) lastFocused = null;
    });

    function updateMenuHeight() {
        if (!compact.matches || !menuSummary) return 0;
        const height = Math.max(52, menuSummary.getBoundingClientRect().height);
        document.documentElement.style.setProperty('--work-menu-height', `${height}px`);
        return height;
    }

    function setActiveChapter(active) {
        if (active.id !== activeId) {
            activeId = active.id;
            chapters.forEach(({ link, section }) => {
                if (section.id === activeId) {
                    link.setAttribute('aria-current', 'location');
                    if (currentLabel) {
                        const label = link.querySelector('strong');
                        currentLabel.textContent = (label || link).textContent.trim();
                    }
                } else {
                    link.removeAttribute('aria-current');
                }
            });
        }
        updateMenuHeight();
    }

    function updateChapter() {
        queued = false;
        const header = document.querySelector('.reading-hud');
        const headerHeight = header ? header.getBoundingClientRect().height : 0;
        // Match the CSS scroll-padding used by native milestone links.
        const threshold = headerHeight + (compact.matches ? updateMenuHeight() + 28 : 24) + 2;
        let active = chapters[0].section;
        chapters.forEach(({ section }) => {
            if (section.getBoundingClientRect().top <= threshold) active = section;
        });

        // A new label can resize its own sticky summary. Keep that reflow
        // from switching chapters back and forth at the reading boundary.
        const currentIndex = chapters.findIndex(({ section }) => section.id === activeId);
        const nextIndex = chapters.findIndex(({ section }) => section === active);
        if (currentIndex >= 0 && (
            (window.scrollY >= previousScrollY && nextIndex < currentIndex) ||
            (window.scrollY <= previousScrollY && nextIndex > currentIndex)
        )) active = chapters[currentIndex].section;
        previousScrollY = window.scrollY;

        const distance = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        if (distance > 0 && window.scrollY >= distance - 4) {
            active = chapters[chapters.length - 1].section;
        }
        const fraction = distance ? Math.max(0, Math.min(1, window.scrollY / distance)) : 0;
        progress.style.width = `${fraction * 100}%`;

        setActiveChapter(active);
    }

    function scheduleUpdate() {
        if (queued) return;
        queued = true;
        window.requestAnimationFrame(updateChapter);
    }

    function setMenuMode() {
        if (menu) {
            const focused = document.activeElement;
            const summaryFocused = focused === menuSummary ||
                (previousCompact && !compact.matches && focused === document.body && lastFocused === menuSummary);
            if (compact.matches && menu.open && menu.contains(document.activeElement)) {
                menuSummary?.focus({ preventScroll: true });
            }
            menu.open = !compact.matches;
            if (!compact.matches && summaryFocused) {
                const current = chapters.find(({ section }) => section.id === activeId) || chapters[0];
                current.link.focus({ preventScroll: true });
            }
        }
        previousCompact = compact.matches;
        scheduleUpdate();
    }
    setMenuMode();
    compact.addEventListener('change', setMenuMode);

    function focusChapter(section) {
        if (!section) return;
        if (!section.hasAttribute('tabindex')) section.setAttribute('tabindex', '-1');
        section.focus({ preventScroll: true });
    }

    chapters.forEach(({ link, section }) => {
        link.addEventListener('click', (event) => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const menuWasOpen = compact.matches && menu && menu.open;
            if (compact.matches && menu) menu.open = false;
            // The selected label can wrap to a different height. Measure it
            // before native hash navigation applies the CSS scroll offset.
            setActiveChapter(section);

            // Leave the href/history to the browser; align once after a mobile
            // menu collapse changes the layout above the destination.
            window.requestAnimationFrame(() => {
                if (targetForHash(window.location.hash) !== section) return;
                if (menuWasOpen) section.scrollIntoView({ behavior: 'instant', block: 'start' });
                focusChapter(section);
                scheduleUpdate();
            });
        });
    });

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    if (menuSummary && typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(scheduleUpdate).observe(menuSummary);
    }
    window.addEventListener('hashchange', () => {
        const target = targetForHash(window.location.hash);
        if (target) {
            const previousHeight = updateMenuHeight();
            setActiveChapter(target);
            // History navigation may have landed using the previous label's
            // height. Correct only a changed compact offset.
            if (compact.matches && updateMenuHeight() !== previousHeight) {
                target.scrollIntoView({ behavior: 'instant', block: 'start' });
            }
            focusChapter(target);
        }
        scheduleUpdate();
    });
    window.addEventListener('load', scheduleUpdate, { once: true });
    scheduleUpdate();

    const initialHash = window.location.hash;
    const initialTarget = targetForHash(initialHash);
    if (!initialTarget) return;

    // Fonts and the preview image can settle after the browser's first anchor
    // jump. Correct that initial position only while the visitor is hands-off.
    let userInteracted = false;
    let initialAlignmentFinished = false;
    const interruptionEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
    const stopInitialAlignment = () => { userInteracted = true; };
    interruptionEvents.forEach((name) => {
        window.addEventListener(name, stopInitialAlignment, { passive: true });
    });

    function finishInitialAlignment() {
        if (initialAlignmentFinished) return;
        initialAlignmentFinished = true;
        window.clearTimeout(settleTimeout);
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                if (!userInteracted && window.location.hash === initialHash) {
                    setActiveChapter(initialTarget);
                    initialTarget.scrollIntoView({ behavior: 'instant', block: 'start' });
                    scheduleUpdate();
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
