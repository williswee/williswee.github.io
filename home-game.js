(function () {
    document.documentElement.classList.add('js-ready');

    const scenes = Array.from(document.querySelectorAll('.game-scene'));
    const navLinks = Array.from(document.querySelectorAll('.chapter-nav a'));
    const root = document.documentElement;

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
    }

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
