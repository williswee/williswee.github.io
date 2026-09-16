(() => {
    'use strict';

    // Run in the head before body parsing. Delegation wires keyboard scrolling
    // before the header exists, so its fixed geometry is ready for first paint.
    // If this small script is blocked or unavailable, the CSS fallback wraps.
    document.addEventListener('focusin', event => {
        const link = event.target.closest?.('a[href]');
        const nav = link?.closest('.reading-nav');
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
    });

    document.documentElement.classList.add('reading-nav-enhanced');
})();
