(() => {
    const quotes = document.querySelector('.coaching-quotes');
    const continueCue = quotes?.querySelector('.coaching-continue-cue');
    if (continueCue && 'IntersectionObserver' in window) {
        // Start the continue cue when the final card's arrow enters the reading area.
        new IntersectionObserver(([entry]) => {
            quotes.classList.toggle('is-visible', entry.isIntersecting);
        }, { rootMargin: '0px 0px -24px 0px' }).observe(continueCue);
    }

    const lantern = document.querySelector('.coaching-lantern');
    if (lantern && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // Welcome the reader once, when the closing invitation comes into view.
        const welcome = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting || entry.intersectionRatio < .6) return;
            lantern.classList.add('has-arrived');
            welcome.disconnect();
        }, { threshold: .6 });
        welcome.observe(lantern);
    }

    const art = document.querySelector('.coaching-landscape');
    const rail = document.querySelector('.coaching-rail');
    if (art && rail) {
        // Tells the art where the rail ends, so the figures clear it at any text size.
        const clearRail = () => {
            const artRect = art.getBoundingClientRect();
            const railTop = rail.getBoundingClientRect().top;
            // The selected portrait's heads and lantern span y=1205 through y=1465.
            // Short windows reserve that space; the rail can scroll if text needs more room.
            const scale = Math.max(artRect.width / 768, artRect.height / 2048);
            const railRoom = Math.min(
                artRect.bottom - railTop - 24 - 260 * scale - 16,
                artRect.top + 1205 * scale - railTop - 24
            );
            rail.style.setProperty('--coaching-rail-room', `${Math.max(44, Math.floor(railRoom))}px`);
            const { bottom } = rail.getBoundingClientRect();
            if (bottom) {
                const clearance = Math.round(bottom - artRect.top + 24);
                art.style.setProperty('--coaching-rail-clearance', `${clearance}px`);
                const centered = (artRect.height - 2048 * scale) / 2;
                const lanternFits = artRect.height - 16 - 1465 * scale;
                const headsClearRail = clearance - 1205 * scale;
                const shortCrop = Math.min(0, Math.max(headsClearRail, Math.min(centered, lanternFits)));
                art.style.setProperty('--coaching-short-crop', `${shortCrop}px`);
            }
        };
        clearRail();
        window.addEventListener('resize', clearRail);
        document.fonts?.ready.then(clearRail);
    }

    const railLinks = Array.from(document.querySelectorAll('.coaching-rail a[href^="#"]'));
    const sections = railLinks.map((link) => document.getElementById(link.hash.slice(1)));
    if (!railLinks.length || sections.includes(null)) return;
    const header = document.querySelector('.reading-hud');
    let pending = false;

    function markCurrentSection() {
        pending = false;
        const readingLine = window.innerHeight / 2 + (header ? header.getBoundingClientRect().height : 0);
        const root = document.documentElement;
        let current = null;
        sections.forEach((section) => {
            if (section.getBoundingClientRect().top <= readingLine) current = section;
        });
        if (window.scrollY >= root.scrollHeight - window.innerHeight - 2) current = sections.at(-1);
        railLinks.forEach((link, index) => {
            if (sections[index] === current) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
    }

    function scheduleUpdate() {
        if (pending) return;
        pending = true;
        window.requestAnimationFrame(markCurrentSection);
    }

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    scheduleUpdate();
})();
