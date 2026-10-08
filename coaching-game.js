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
        // Keep the portrait covering the entire column while clearing the rail where possible.
        // The picture uses the original wide scene on phones, which needs no scripted crop.
        const clearRail = () => {
            const artRect = art.getBoundingClientRect();
            if (!artRect.width || !artRect.height) return;
            if (window.matchMedia('(max-width: 760px)').matches) {
                rail.style.removeProperty('--coaching-rail-room');
                art.style.removeProperty('--coaching-art-offset');
                return;
            }

            const scale = Math.max(artRect.width / 768, artRect.height / 2048);
            const minOffset = artRect.height - 2048 * scale;
            const heads = 1100 * scale;
            const lanternBase = 1510 * scale;
            const bottomOffset = Math.min(0, artRect.height - 24 - lanternBase);
            const railTop = rail.getBoundingClientRect().top;
            const railRoom = artRect.top + bottomOffset + heads - 24 - railTop;
            rail.style.setProperty('--coaching-rail-room', `${Math.max(44, Math.floor(railRoom))}px`);

            const headOffset = rail.getBoundingClientRect().bottom - artRect.top + 24 - heads;
            const lowerBound = Math.max(minOffset, headOffset);
            const upperBound = Math.min(0, bottomOffset);
            // If an unusually wide, short column cannot show the whole group below the rail,
            // retain full image coverage and the lantern instead of reducing the image size.
            const offset = lowerBound <= upperBound
                ? Math.max(lowerBound, Math.min(minOffset / 2, upperBound))
                : Math.max(minOffset, Math.min(0, bottomOffset));
            art.style.setProperty('--coaching-art-offset', `${offset}px`);
        };
        clearRail();
        window.addEventListener('resize', clearRail);
        document.fonts?.ready.then(clearRail);
    }

    const railLinks = Array.from(document.querySelectorAll('.coaching-rail a[href^="#"]'));
    const sections = railLinks.map((link) => document.getElementById(link.hash.slice(1)));
    if (!railLinks.length || sections.includes(null)) return;
    // The note shortcut stays last in the rail; track sections in page order.
    sections.sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
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
        railLinks.forEach((link) => {
            if (link.hash === `#${current?.id}`) link.setAttribute('aria-current', 'location');
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
