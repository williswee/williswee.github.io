(function () {
    document.documentElement.classList.add('js-ready');

    const scenes = Array.from(document.querySelectorAll('.game-scene'));
    const navLinks = Array.from(document.querySelectorAll('.chapter-nav a'));
    const root = document.documentElement;

    // Enlarged text may turn the compact header into a horizontal scroller.
    // Keep each keyboard destination visible without moving the page itself.
    navLinks.forEach(link => {
        link.addEventListener('focus', () => {
            const nav = link.parentElement;
            if (nav.scrollWidth <= nav.clientWidth) return;
            const navBounds = nav.getBoundingClientRect();
            const linkBounds = link.getBoundingClientRect();
            if (linkBounds.left < navBounds.left) nav.scrollLeft += linkBounds.left - navBounds.left;
            else if (linkBounds.right > navBounds.right) nav.scrollLeft += linkBounds.right - navBounds.right;
        });
    });

    const statusBadge = document.getElementById('status-badge');
    if (statusBadge) {
        const statuses = [
            { text: 'Building for joy', emoji: '🦥' },
            { text: 'Playing tennis', emoji: '🎾' },
            { text: 'Coaching as comrades', emoji: '🤝' },
            { text: 'Daydreaming', emoji: '💭' },
            { text: 'Reading books', emoji: '📖' },
            { text: 'Angel investing', emoji: '' },
            { text: 'Meditating', emoji: '🧠' },
            { text: 'Eating', emoji: '(🍏🍔🍜🍣🥑🥦)' },
            { text: 'Writing', emoji: '📝' },
            { text: 'Laughing', emoji: '😂' },
            { text: 'Family time', emoji: '👩🏻👧🏻👧🏻👧🏻' },
            { text: 'Trading', emoji: '🦗(jkjk)' }
        ];
        const statusText = statusBadge.querySelector('.status-text strong');
        const statusEmoji = statusBadge.querySelector('.status-emoji');
        const shuffleIcon = statusBadge.querySelector('.status-shuffle');
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let currentIndex = 0;
        let shuffleRotation = 0;

        statusBadge.addEventListener('click', () => {
            // A native button handles Enter and Space; never repeat the current status.
            const offset = 1 + Math.floor(Math.random() * (statuses.length - 1));
            currentIndex = (currentIndex + offset) % statuses.length;
            const status = statuses[currentIndex];
            statusText.textContent = status.text;
            statusEmoji.textContent = status.emoji ? ` ${status.emoji}` : '';
            statusBadge.setAttribute('aria-label', `Current status: ${status.text}. Click to shuffle status`);

            if (shuffleIcon) {
                if (reducedMotion.matches) {
                    // Keep feedback visible without spinning when less motion is preferred.
                    shuffleIcon.getAnimations().forEach(animation => animation.cancel());
                    shuffleIcon.animate([{ opacity: 0.45 }, { opacity: 1 }], {
                        duration: 160,
                        easing: 'ease-out'
                    });
                } else {
                    // Continue from the current angle if another click interrupts the turn.
                    shuffleRotation += 360;
                    shuffleIcon.style.setProperty('--shuffle-rotation', `${shuffleRotation}deg`);
                }
            }
        });
        // Keep the initial status readable when enhancement cannot load.
        // Advertise shuffle only once its click handler is attached.
        statusBadge.disabled = false;
        statusBadge.setAttribute('aria-label', 'Current status: Building for joy. Click to shuffle status');
        statusBadge.setAttribute('title', 'Click to shuffle status');
    }

    if (!scenes.length) return;

    const header = document.querySelector('.site-hud');
    let activeScene = null;
    function selectScene(scene) {
        if (scene === activeScene) return;
        activeScene = scene;
        scenes.forEach(item => item.classList.toggle('is-current', item === scene));
        navLinks.forEach(link => {
            if (link.dataset.level === scene.id) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
    }

    let frameRequested = false;
    function updateProgress() {
        frameRequested = false;
        // A viewport activation line works even when enlarged text makes a
        // scene several screens tall; a whole-scene intersection ratio cannot.
        const headerBottom = Math.max(0, header?.getBoundingClientRect().bottom || 0);
        const activationLine = headerBottom + Math.min(100, Math.max(0, window.innerHeight - headerBottom) * 0.25);
        let current = scenes[0];
        for (const scene of scenes) {
            if (scene.getBoundingClientRect().top > activationLine) break;
            current = scene;
        }
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
        selectScene(current);
        root.style.setProperty('--scene-progress', progress.toFixed(4));
    }

    function queueProgress() {
        if (frameRequested) return;
        frameRequested = true;
        window.requestAnimationFrame(updateProgress);
    }
    window.addEventListener('scroll', queueProgress, { passive: true });
    window.addEventListener('resize', queueProgress);
    window.addEventListener('hashchange', queueProgress);
    window.addEventListener('pageshow', queueProgress);
    window.addEventListener('load', queueProgress);
    if ('ResizeObserver' in window) {
        const observer = new window.ResizeObserver(queueProgress);
        scenes.forEach(scene => observer.observe(scene));
        if (header) observer.observe(header);
    }
    document.fonts?.ready.then(queueProgress);

    const year = document.getElementById('current-year');
    if (year) year.textContent = String(new Date().getFullYear());

    updateProgress();
})();
