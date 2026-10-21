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

        const mobile = window.matchMedia('(max-width: 760px)');

        function closeNavigation({ restoreFocus = false } = {}) {
            if (mobile.matches) {
                const wasOpen = menu.open;
                menu.open = false;
                if (wasOpen && restoreFocus) menuToggle.focus({ preventScroll: true });
            } else {
                const wasOpen = more.open;
                more.open = false;
                if (wasOpen && restoreFocus) moreToggle.focus({ preventScroll: true });
            }
        }

        function syncLayout() {
            const focused = document.activeElement;
            const focusInNavigation = navigation.contains(focused);
            const focusInMore = more.contains(focused) && focused !== moreToggle;

            // Native open states also support browsers without ::details-content.
            // Changing viewport mode never leaves keyboard focus in hidden content.
            menu.open = !mobile.matches;
            more.open = mobile.matches;
            if (mobile.matches && focusInNavigation) {
                menuToggle.focus({ preventScroll: true });
            } else if (!mobile.matches && (focused === menuToggle || focused?.classList.contains('site-home-link'))) {
                header.querySelector('.site-brand')?.focus({ preventScroll: true });
            } else if (!mobile.matches && focusInMore) {
                moreToggle.focus({ preventScroll: true });
            }
        }

        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape' || event.defaultPrevented) return;
            const isOpen = mobile.matches ? menu.open : more.open;
            if (!isOpen) return;
            event.preventDefault();
            closeNavigation({ restoreFocus: true });
        });

        document.addEventListener('pointerdown', event => {
            if (!header.contains(event.target)) closeNavigation();
        });

        document.addEventListener('focusin', event => {
            if (!header.contains(event.target)) closeNavigation();
        });

        navigation.addEventListener('click', event => {
            if (event.target.closest('a[href]')) closeNavigation();
        });

        mobile.addEventListener('change', syncLayout);
        window.addEventListener('pageshow', event => {
            if (event.persisted) syncLayout();
        });
        syncLayout();
        document.documentElement.classList.add('site-navigation-enhanced');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enhanceNavigation, { once: true });
    } else {
        enhanceNavigation();
    }
})();
