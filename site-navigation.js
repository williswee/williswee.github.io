(() => {
    'use strict';

    function enhanceNavigation() {
        const header = document.querySelector('.site-header');
        const menu = header?.querySelector('.site-menu');
        const more = header?.querySelector('.site-more');
        const navigation = header?.querySelector('.site-navigation');
        const menuToggle = menu?.querySelector(':scope > summary');
        const moreToggle = more?.querySelector(':scope > summary');
        if (!menu || !more || !navigation || !menuToggle || !moreToggle) return;

        const viewport = window.matchMedia('(max-width: 760px)');
        let compact;
        let lastHeaderFocus;

        function closeNavigation({ restoreFocus = false } = {}) {
            if (compact) {
                const wasOpen = menu.open;
                menu.open = false;
                if (wasOpen && restoreFocus) menuToggle.focus({ preventScroll: true });
            } else {
                const wasOpen = more.open;
                more.open = false;
                if (wasOpen && restoreFocus) moreToggle.focus({ preventScroll: true });
            }
        }

        function syncLayout(force = false) {
            // Read the CSS layout so increased text size and viewport changes agree.
            const next = window.getComputedStyle ? window.getComputedStyle(menuToggle).display !== 'none' : viewport.matches;
            if (next === compact && !force) return;
            compact = next;
            // Some browsers blur a summary as soon as CSS hides it.
            const focused = document.activeElement === document.body ? lastHeaderFocus : document.activeElement;
            const focusInNavigation = navigation.contains(focused);
            const focusInMore = more.contains(focused) && focused !== moreToggle;

            // Native open states also support browsers without ::details-content.
            // Changing viewport mode never leaves keyboard focus in hidden content.
            menu.open = !compact;
            more.open = compact;
            if (compact && focusInNavigation) {
                menuToggle.focus({ preventScroll: true });
            } else if (!compact && (focused === menuToggle || focused?.classList.contains('site-home-link'))) {
                header.querySelector('.site-brand')?.focus({ preventScroll: true });
            } else if (!compact && focusInMore) {
                moreToggle.focus({ preventScroll: true });
            }
        }

        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape' || event.defaultPrevented) return;
            const isOpen = compact ? menu.open : more.open;
            if (!isOpen) return;
            event.preventDefault();
            closeNavigation({ restoreFocus: true });
        });

        document.addEventListener('pointerdown', event => {
            if (!header.contains(event.target)) {
                lastHeaderFocus = null;
                closeNavigation();
            }
        });

        document.addEventListener('focusin', event => {
            lastHeaderFocus = header.contains(event.target) ? event.target : null;
            if (!lastHeaderFocus) closeNavigation();
        });

        navigation.addEventListener('click', event => {
            if (event.target.closest('a[href]')) closeNavigation();
        });

        viewport.addEventListener('change', () => syncLayout());
        if (window.ResizeObserver) new window.ResizeObserver(() => syncLayout()).observe(header);
        window.addEventListener('pageshow', event => {
            if (event.persisted) syncLayout(true);
        });
        // Older engines keep the native disclosure layout supplied by the stylesheet.
        if (window.CSS?.supports('container-type: inline-size')) {
            document.documentElement.classList.add('site-navigation-enhanced');
        }
        syncLayout();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enhanceNavigation, { once: true });
    } else {
        enhanceNavigation();
    }
})();
