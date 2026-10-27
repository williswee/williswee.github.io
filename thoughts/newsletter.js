(() => {
    'use strict';

    const frames = [...document.querySelectorAll('iframe[data-newsletter-src]')];
    if (!frames.length) return;

    const pending = new Map();
    frames.forEach((initialFrame, index) => {
        const container = initialFrame.closest('.subscribe-embed, .newsletter-cta');
        if (!container) return;

        let frame = initialFrame;
        let attempt;
        let state = 'hidden';
        let started = false;
        if (!frame.id) {
            let id = `newsletter-frame-${index + 1}`;
            while (document.getElementById(id)) id += '-embed';
            frame.id = id;
        }

        const status = document.createElement('p');
        status.className = 'newsletter-status';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        status.setAttribute('aria-atomic', 'true');
        const controls = document.createElement('div');
        controls.className = 'newsletter-controls';
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'newsletter-retry';
        retry.textContent = 'Reload form';
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'newsletter-toggle';
        toggle.setAttribute('aria-controls', frame.id);
        controls.append(retry, toggle);
        const help = document.createElement('details');
        help.className = 'newsletter-help';
        const helpSummary = document.createElement('summary');
        helpSummary.textContent = 'Form not showing?';
        const fallback = container.querySelector('a[href]');
        help.append(helpSummary);
        if (fallback) help.append(fallback);
        help.append(controls);
        frame.before(status);
        frame.after(help);

        function render(nextState, message = '') {
            const focusInHelp = help.contains(document.activeElement);
            state = nextState;
            container.dataset.newsletterState = state;
            status.textContent = message;
            const shown = state === 'loaded';
            status.hidden = !message || shown;
            frame.hidden = !shown;
            if (shown) {
                frame.removeAttribute('aria-hidden');
                frame.removeAttribute('tabindex');
            } else {
                frame.setAttribute('aria-hidden', 'true');
                frame.setAttribute('tabindex', '-1');
            }
            controls.hidden = !started || state === 'loading';
            help.hidden = !started;
            help.open = !shown;
            retry.hidden = controls.hidden;
            toggle.hidden = !attempt?.complete;
            toggle.textContent = shown ? 'Hide form' : 'Show form';
            toggle.setAttribute('aria-expanded', String(shown));
            if (focusInHelp && (controls.hidden || !help.open)) {
                helpSummary.focus({ preventScroll: true });
            }
        }

        function knownBlank(candidate) {
            try {
                const doc = candidate.contentDocument;
                // A cross-origin document is opaque, not evidence of success or failure.
                if (!doc) return false;
                return doc.URL === 'about:blank' || !doc.body ||
                    (!doc.body.childElementCount && !doc.body.textContent.trim());
            } catch {
                return false;
            }
        }

        function load() {
            if (attempt) {
                window.clearTimeout(attempt.timer);
                // A fresh browsing context keeps stale load/error events out of retries.
                const replacement = frame.cloneNode(false);
                replacement.removeAttribute('src');
                frame.replaceWith(replacement);
                frame = replacement;
            }
            started = true;
            const current = { frame, complete: false, failed: false, recoverable: false, interacted: false };
            attempt = current;
            render('loading', 'Loading the inline signup form…');

            function unavailable(message, recoverable = false) {
                if (attempt !== current || current.complete || (recoverable && current.failed)) return;
                window.clearTimeout(current.timer);
                current.failed = true;
                current.recoverable = recoverable;
                render('unavailable', message);
            }
            frame.addEventListener('load', () => {
                if (attempt !== current || current.complete ||
                    (current.failed && (!current.recoverable || current.interacted))) return;
                if (knownBlank(current.frame)) {
                    unavailable('The inline form is blank. You can reload it or use the Substack link below.');
                    return;
                }
                window.clearTimeout(current.timer);
                current.complete = true;
                // Navigation completion cannot verify a third-party form's contents.
                render('loaded', 'If the form is blank, reload it or use the Substack link below.');
            });
            frame.addEventListener('error', () => {
                unavailable('The inline form could not be loaded. You can reload it or use the Substack link below.');
            });
            current.timer = window.setTimeout(() => {
                unavailable('The inline form hasn’t loaded yet. You can reload it or use the Substack link below.', true);
            }, 12000);
            // The container observer controls timing; native lazy loading would add
            // a second gate that can prevent a hidden pending iframe from loading.
            frame.loading = 'eager';
            frame.src = frame.dataset.newsletterSrc;
        }

        retry.addEventListener('click', load);
        toggle.addEventListener('click', () => {
            if (!attempt?.complete) return;
            if (state === 'loaded') {
                render('hidden', 'The inline form is hidden. Show it again or use the Substack link below.');
            } else {
                render('loaded', 'If the form is blank, reload it or use the Substack link below.');
            }
        });
        // Do not expand a late response after someone has moved on to recovery.
        ['pointerdown', 'keydown', 'focusin'].forEach(event => {
            container.addEventListener(event, () => {
                if (attempt?.failed) attempt.interacted = true;
            });
        });
        render('hidden');
        pending.set(container, load);
    });

    if (!pending.size) return;
    if (!('IntersectionObserver' in window)) {
        pending.forEach(load => load());
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting || !pending.has(entry.target)) return;
            pending.get(entry.target)();
            observer.unobserve(entry.target);
            pending.delete(entry.target);
        });
        if (!pending.size) observer.disconnect();
    }, { rootMargin: '240px 0px' });

    pending.forEach((load, container) => observer.observe(container));
})();
