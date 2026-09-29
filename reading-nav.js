(() => {
    'use strict';

    function revealLink(link, nav) {
        if (!nav || nav.scrollWidth <= nav.clientWidth) return;

        const navBounds = nav.getBoundingClientRect();
        const linkBounds = link.getBoundingClientRect();
        const style = window.getComputedStyle(link);
        // Match the outward focus ring, including its offset. The nav's
        // inline padding also leaves this room at the first/last link.
        const focusSpace = Math.max(0,
            (parseFloat(style.outlineWidth) || 0) + (parseFloat(style.outlineOffset) || 0));
        const left = navBounds.left + nav.clientLeft + focusSpace;
        const right = navBounds.left + nav.clientLeft + nav.clientWidth - focusSpace;
        let delta = 0;

        if (linkBounds.width > right - left || linkBounds.left < left) {
            delta = linkBounds.left - left;
        } else if (linkBounds.right > right) {
            delta = linkBounds.right - right;
        }

        // Scroll only the navigation, never the document or its other
        // ancestors. Instant feedback also respects reduced motion.
        if (delta) nav.scrollBy({ left: delta, behavior: 'instant' });
    }

    // Run in the head before body parsing. Delegation wires keyboard scrolling
    // before the header exists, so its fixed geometry is ready for first paint.
    // If this small script is blocked or unavailable, the CSS fallback wraps.
    document.addEventListener('focusin', event => {
        const link = event.target.closest?.('a[href]');
        const nav = link?.closest('.reading-nav');
        if (link && nav) revealLink(link, nav);
    });

    document.documentElement.classList.add('reading-nav-enhanced');

    function enhanceNavigation() {
        const nav = document.querySelector?.('.reading-nav');
        const header = nav?.closest('.reading-hud');
        if (!nav || !header) return;

        const activeLink = nav.querySelector('a[aria-current]');
        let queued = false;
        let revealRequested = false;
        let userPositioned = false;
        let expectedScrollLeft = nav.scrollLeft;
        let previousLeft;

        function updateNavigation() {
            queued = false;
            if (revealRequested && !userPositioned && activeLink) {
                revealLink(activeLink, nav);
                expectedScrollLeft = nav.scrollLeft;
            }
            revealRequested = false;

            const maxScroll = Math.max(0, nav.scrollWidth - nav.clientWidth);
            const overflow = maxScroll > 1;
            const left = `${Math.round(nav.getBoundingClientRect().left - header.getBoundingClientRect().left)}px`;
            if (left !== previousLeft) {
                header.style.setProperty('--nav-left', left);
                previousLeft = left;
            }
            header.classList.toggle('reading-hud--more-before', overflow && nav.scrollLeft > 1);
            header.classList.toggle('reading-hud--more-after', overflow && nav.scrollLeft < maxScroll - 1);
        }

        function scheduleUpdate(reveal = false) {
            revealRequested ||= reveal;
            if (queued) return;
            queued = true;
            window.requestAnimationFrame(updateNavigation);
        }

        // Reveal the current destination while the page settles. Once the
        // visitor explores the row, later font/layout updates keep their place.
        const keepUserPosition = () => { userPositioned = true; };
        nav.addEventListener('pointerdown', keepUserPosition, { passive: true });
        nav.addEventListener('wheel', keepUserPosition, { passive: true });
        nav.addEventListener('keydown', keepUserPosition);
        nav.addEventListener('scroll', () => {
            if (Math.abs(nav.scrollLeft - expectedScrollLeft) > 1) userPositioned = true;
            scheduleUpdate();
        }, { passive: true });
        window.addEventListener('resize', () => scheduleUpdate(true), { passive: true });
        window.addEventListener('pageshow', event => {
            // A back/forward restoration owns its restored horizontal position.
            if (event.persisted) userPositioned = true;
            scheduleUpdate(!event.persisted);
        });
        if ('ResizeObserver' in window) {
            const observer = new window.ResizeObserver(() => scheduleUpdate(true));
            observer.observe(nav);
            observer.observe(header);
            nav.querySelectorAll('a').forEach(link => observer.observe(link));
        }
        document.fonts?.ready.then(() => scheduleUpdate(true));
        scheduleUpdate(true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enhanceNavigation, { once: true });
    } else {
        enhanceNavigation();
    }
})();
