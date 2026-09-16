(() => {
    'use strict';

    function initializeReadingNavigation() {
        document.querySelectorAll('.reading-nav').forEach(nav => {
            nav.addEventListener('focusin', event => {
                const link = event.target.closest('a[href]');
                if (!link || !nav.contains(link) || nav.scrollWidth <= nav.clientWidth) return;

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
            });
        });
        // Keep the wrapping, in-flow fallback until keyboard scrolling is wired.
        document.documentElement?.classList.add('reading-nav-enhanced');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeReadingNavigation, { once: true });
    } else {
        initializeReadingNavigation();
    }
})();
