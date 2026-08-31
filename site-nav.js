(function () {
    const nav = document.querySelector('header nav');
    if (!nav || nav.closest('.site-nav-shell')) return;

    const shell = document.createElement('div');
    shell.className = 'site-nav-shell';
    nav.parentNode.insertBefore(shell, nav);
    shell.appendChild(nav);

    if (!nav.hasAttribute('aria-label')) {
        nav.setAttribute('aria-label', 'Primary navigation');
    }

    const mobile = window.matchMedia('(max-width: 600px)');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const activeLink = nav.querySelector('a.active');
    let updateFrame = null;

    function updateScrollCues() {
        updateFrame = null;
        const maxScroll = Math.max(0, nav.scrollWidth - nav.clientWidth);
        const overflows = mobile.matches && maxScroll > 2;

        shell.classList.toggle('site-nav-shell--overflow', overflows);
        shell.classList.toggle('site-nav-shell--left', overflows && nav.scrollLeft > 4);
        shell.classList.toggle('site-nav-shell--right', overflows && nav.scrollLeft < maxScroll - 4);
    }

    function scheduleCueUpdate() {
        if (updateFrame !== null) return;
        updateFrame = window.requestAnimationFrame(updateScrollCues);
    }

    function positionActiveLink() {
        if (!mobile.matches) {
            nav.scrollLeft = 0;
            updateScrollCues();
            return;
        }

        if (activeLink) {
            const maxScroll = Math.max(0, nav.scrollWidth - nav.clientWidth);
            const centered = activeLink.offsetLeft + (activeLink.offsetWidth / 2) - (nav.clientWidth / 2);
            nav.scrollLeft = Math.max(0, Math.min(maxScroll, centered));
        }

        updateScrollCues();
    }

    function nudgeNavOnce() {
        if (!mobile.matches || reduceMotion.matches) return;

        try {
            if (window.sessionStorage.getItem('site-nav-hint-seen-v2')) return;
            window.sessionStorage.setItem('site-nav-hint-seen-v2', 'true');
        } catch (error) {
            // The affordance still works when storage is unavailable.
        }

        const maxScroll = Math.max(0, nav.scrollWidth - nav.clientWidth);
        if (maxScroll <= 2) return;

        const start = nav.scrollLeft;
        const direction = start < maxScroll - 8 ? 1 : -1;
        const distance = Math.min(28, direction > 0 ? maxScroll - start : start);
        if (distance <= 0) return;

        window.setTimeout(() => {
            nav.classList.add('site-nav--hinting');
            nav.scrollTo({
                left: start + (distance * direction),
                behavior: 'smooth',
            });

            window.setTimeout(() => {
                nav.scrollTo({ left: start, behavior: 'smooth' });

                window.setTimeout(() => {
                    nav.classList.remove('site-nav--hinting');
                    scheduleCueUpdate();
                }, 360);
            }, 360);
        }, 500);
    }

    nav.addEventListener('scroll', scheduleCueUpdate, { passive: true });
    nav.addEventListener('focusin', (event) => {
        if (!mobile.matches || !(event.target instanceof HTMLElement)) return;
        event.target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    });
    window.addEventListener('resize', positionActiveLink, { passive: true });
    mobile.addEventListener?.('change', positionActiveLink);

    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            positionActiveLink();
            nudgeNavOnce();
        });
    });
})();
