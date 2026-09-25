(() => {
    const quotes = document.querySelector('.coaching-quotes');
    if (quotes && 'IntersectionObserver' in window) {
        // The continue cue replays each time the testimonials come on screen.
        new IntersectionObserver(([entry]) => {
            quotes.classList.toggle('is-visible', entry.isIntersecting);
        }).observe(quotes);
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
