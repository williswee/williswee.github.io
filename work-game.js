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

    function updateChapter() {
        queued = false;
        const header = document.querySelector('.reading-hud');
        const headerHeight = header ? header.getBoundingClientRect().height : 0;
        // Match the CSS scroll-padding used by native milestone links.
        const threshold = headerHeight + (compact.matches ? 80 : 24) + 2;
        let active = chapters[0].section;
        chapters.forEach(({ section }) => {
            if (section.getBoundingClientRect().top <= threshold) active = section;
        });

        const distance = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        if (distance > 0 && window.scrollY >= distance - 4) {
            active = chapters[chapters.length - 1].section;
        }
        const fraction = distance ? Math.max(0, Math.min(1, window.scrollY / distance)) : 0;
        progress.style.width = `${fraction * 100}%`;

        if (active.id === activeId) return;
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

    function scheduleUpdate() {
        if (queued) return;
        queued = true;
        window.requestAnimationFrame(updateChapter);
    }

    function setMenuMode() {
        if (menu) {
            if (compact.matches && menu.open && menu.contains(document.activeElement)) {
                menu.querySelector('summary')?.focus({ preventScroll: true });
            }
            menu.open = !compact.matches;
        }
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
    window.addEventListener('hashchange', () => {
        focusChapter(targetForHash(window.location.hash));
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
