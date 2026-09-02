(function () {
    document.documentElement.classList.add('js-ready');

    const scenes = Array.from(document.querySelectorAll('.game-scene'));
    const navLinks = Array.from(document.querySelectorAll('.chapter-nav a'));
    const root = document.documentElement;

    if (!scenes.length) return;

    function selectScene(scene) {
        scenes.forEach(item => item.classList.toggle('is-current', item === scene));
        navLinks.forEach(link => {
            if (link.dataset.level === scene.id) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
    }

    const observer = new IntersectionObserver(entries => {
        const visible = entries
            .filter(entry => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) selectScene(visible.target);
    }, { threshold: [0.35, 0.55, 0.72] });

    scenes.forEach(scene => observer.observe(scene));

    let frameRequested = false;
    function updateProgress() {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
        root.style.setProperty('--scene-progress', progress.toFixed(4));
        frameRequested = false;
    }

    window.addEventListener('scroll', () => {
        if (frameRequested) return;
        frameRequested = true;
        window.requestAnimationFrame(updateProgress);
    }, { passive: true });

    const year = document.getElementById('current-year');
    if (year) year.textContent = String(new Date().getFullYear());

    updateProgress();
})();
