(() => {
    'use strict';

    function slugify(text) {
        return text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/[\s_-]+/g, '-');
    }

    const headings = Array.from(document.querySelectorAll('.guide-section h2'));
    const status = document.getElementById('guide-copy-status');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const copyTimers = new WeakMap();
    let statusTimer;
    let copyRequest = 0;
    let highlightedTarget;
    let highlightTimer;

    function announce(message, duration = 4000) {
        if (!status) return;
        window.clearTimeout(statusTimer);
        status.textContent = message;
        status.classList.add('is-visible');
        statusTimer = window.setTimeout(() => {
            status.classList.remove('is-visible');
            status.textContent = '';
        }, duration);
    }

    function addCopyButton(target, label, kind) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'guide-anchor-link';
        button.setAttribute('aria-label', `Copy link to ${label}`);
        button.title = `Copy link to ${kind}`;

        const symbol = document.createElement('span');
        symbol.className = 'anchor-symbol';
        symbol.setAttribute('aria-hidden', 'true');
        symbol.textContent = '#';
        button.appendChild(symbol);

        button.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            const request = ++copyRequest;
            const url = `${window.location.origin}${window.location.pathname}#${target.id}`;

            // Keep the permalink available even if clipboard access is denied.
            window.history.replaceState(null, '', `#${target.id}`);
            window.clearTimeout(copyTimers.get(button));
            symbol.textContent = '#';
            button.classList.remove('guide-anchor-link--copied');

            try {
                if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
                    throw new Error('Clipboard unavailable');
                }
                await navigator.clipboard.writeText(url);
                symbol.textContent = '✓';
                button.classList.add('guide-anchor-link--copied');
                copyTimers.set(button, window.setTimeout(() => {
                    symbol.textContent = '#';
                    button.classList.remove('guide-anchor-link--copied');
                }, 1500));
                if (request === copyRequest) announce('Link copied.');
            } catch {
                if (request === copyRequest) {
                    announce('Could not copy. Copy the link from your address bar.', 8000);
                }
            }
        });

        const nestedList = target.querySelector('ol, ul');
        if (nestedList) target.insertBefore(button, nestedList);
        else target.appendChild(button);
    }

    headings.forEach((heading) => {
        const text = heading.textContent.replace(/^[^\w\s]+/, '').trim();
        if (!heading.id) heading.id = slugify(text);
        addCopyButton(heading, text, 'section');
    });

    document.querySelectorAll('.guide-section li').forEach((item) => {
        const strong = item.querySelector('strong');
        if (!strong) return;
        const text = strong.textContent.replace(/[:.]+$/, '').trim();
        if (!item.id) item.id = slugify(text);
        addCopyButton(item, text, 'rule');
    });

    function hashTarget(hash = window.location.hash) {
        if (!hash || hash === '#') return null;
        let id = hash.slice(1);
        try {
            id = decodeURIComponent(id);
        } catch {
            // Invalid percent encoding must not interrupt the rest of the guide.
        }
        const target = document.getElementById(id);
        return target && target.matches('.guide-section h2, .guide-section li') ? target : null;
    }

    function readingHeaderHeight() {
        const header = document.querySelector('.reading-hud');
        return header ? header.getBoundingClientRect().height : 0;
    }

    function highlightCurrentHash(moveFocus = false) {
        const target = hashTarget();
        if (!target) return;
        window.clearTimeout(highlightTimer);
        if (highlightedTarget) highlightedTarget.classList.remove('guide-highlight-target');
        highlightedTarget = target;
        target.classList.add('guide-highlight-target');

        if (moveFocus) {
            if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
        }
        const availableHeight = Math.max(0, window.innerHeight - readingHeaderHeight() - 64);
        const isLongTarget = target.getBoundingClientRect().height > availableHeight;
        target.scrollIntoView({
            behavior: reducedMotion.matches ? 'instant' : 'smooth',
            block: isLongTarget ? 'start' : 'center'
        });
        highlightTimer = window.setTimeout(() => {
            target.classList.remove('guide-highlight-target');
        }, 3000);
        scheduleReadingUpdate();
    }

    const contentsLinks = Array.from(document.querySelectorAll('.guide-contents a[href^="#"]'));
    contentsLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            // A repeated click on the current hash does not fire hashchange.
            if (link.getAttribute('href') === window.location.hash) {
                window.requestAnimationFrame(() => highlightCurrentHash(true));
            }
        });
    });

    const progress = document.createElement('div');
    progress.className = 'reading-progress-bar';
    progress.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progress);
    let readingUpdatePending = false;

    function updateReadingPosition() {
        readingUpdatePending = false;
        const root = document.documentElement;
        const distance = Math.max(0, root.scrollHeight - window.innerHeight);
        const fraction = distance ? Math.max(0, Math.min(1, window.scrollY / distance)) : 0;
        progress.style.width = `${fraction * 100}%`;

        // Allow for the fixed header and the scroll offsets on centered targets.
        const readingLine = window.innerHeight / 2 + readingHeaderHeight() + 32;
        let current = null;
        headings.forEach((heading) => {
            if (heading.getBoundingClientRect().top <= readingLine) current = heading;
        });
        if (distance > 0 && window.scrollY >= distance - 2) current = headings.at(-1);
        contentsLinks.forEach((link) => {
            if (current && hashTarget(link.getAttribute('href')) === current) {
                link.setAttribute('aria-current', 'location');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }

    function scheduleReadingUpdate() {
        if (readingUpdatePending) return;
        readingUpdatePending = true;
        window.requestAnimationFrame(updateReadingPosition);
    }

    window.addEventListener('scroll', scheduleReadingUpdate, { passive: true });
    window.addEventListener('resize', scheduleReadingUpdate);
    window.addEventListener('hashchange', () => highlightCurrentHash(true));
    window.addEventListener('load', scheduleReadingUpdate, { once: true });
    scheduleReadingUpdate();

    if (window.location.hash) {
        window.requestAnimationFrame(() => highlightCurrentHash(false));
    }
})();
