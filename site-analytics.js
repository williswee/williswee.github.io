(() => {
    // Public Umami Website ID for williswee.com.
    const websiteId = 'fe208afe-7586-4157-8a5c-4d8ac8ae640a';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(websiteId)) return;

    const tracker = document.createElement('script');
    tracker.src = 'https://cloud.umami.is/script.js';
    tracker.async = true;
    tracker.dataset.websiteId = websiteId;
    tracker.dataset.domains = 'williswee.com,www.williswee.com';
    tracker.dataset.excludeSearch = 'true';
    tracker.dataset.excludeHash = 'true';
    document.head.append(tracker);

    const pending = [];
    const track = name => {
        if (typeof window.umami?.track !== 'function') {
            if (pending.length < 20) pending.push(name);
            return;
        }
        try { window.umami.track(name); } catch { /* Analytics must not affect site actions. */ }
    };
    tracker.addEventListener('load', () => {
        if (typeof window.umami?.track !== 'function') return;
        pending.splice(0).forEach(track);
    });
    window.siteAnalytics = { track };

    document.addEventListener('click', event => {
        const element = event.target instanceof Element ? event.target : event.target?.parentElement;
        if (!element) return;

        const link = element.closest('a[href]');
        if (link) {
            let url;
            try { url = new URL(link.getAttribute('href'), window.location.href); }
            catch { return; }
            if (window.location.pathname === '/coaching.html' && url.origin === window.location.origin &&
                url.pathname === '/coaching.html' && url.hash === '#send-a-note') {
                track('coaching_note_link_click');
            } else if (window.location.pathname !== '/coaching.html' &&
                url.origin === window.location.origin && url.pathname === '/coaching.html') {
                track('coaching_cta_click');
            } else if (url.hostname === 'intro.co' && url.pathname === '/williswee') {
                track('coaching_booking_click');
            }
        }

        if (element.closest('[data-note-submit]')) track('coaching_note_send_click');
        if (element.closest('#coaching-note-provider')) track('coaching_note_provider_click');
    }, true);

    let noteStarted = false;
    document.addEventListener('input', event => {
        if (!noteStarted && event.target?.id === 'note-message' && event.target.value.trim()) {
            noteStarted = true;
            track('coaching_note_started');
        }
    });
})();
