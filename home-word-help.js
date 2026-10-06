(() => {
    'use strict';

    const help = document.getElementById('lah-help');
    const trigger = document.getElementById('lah-trigger');
    const definition = document.getElementById('lah-definition');
    if (!help || !trigger || !definition) return;

    let hovered = false;
    let focused = false;
    let pinned = false;
    let dismissed = false;

    function update() {
        const open = !dismissed && (hovered || focused || pinned);
        definition.hidden = !open;
        trigger.setAttribute('aria-expanded', String(open));
    }

    function dismiss() {
        pinned = false;
        dismissed = true;
        update();
    }

    help.addEventListener('pointerenter', event => {
        // Touch uses the button's click, not a synthetic hover state.
        if (event.pointerType === 'touch') return;
        hovered = true;
        dismissed = false;
        update();
    });
    help.addEventListener('pointerleave', () => {
        hovered = false;
        update();
    });
    help.addEventListener('focusin', () => {
        focused = true;
        dismissed = false;
        update();
    });
    help.addEventListener('focusout', event => {
        if (help.contains(event.relatedTarget)) return;
        focused = false;
        pinned = false;
        // Keep an Escape/outside dismissal in force while the pointer
        // remains here. A fresh pointer entry or focus restores the help.
        update();
    });
    trigger.addEventListener('click', () => {
        // Focus arrives before a tap/click. Pin that first opening instead
        // of immediately toggling it shut; a second activation dismisses it.
        if (pinned) dismiss();
        else {
            pinned = true;
            dismissed = false;
            update();
        }
    });
    document.addEventListener('pointerdown', event => {
        if (!help.contains(event.target)) dismiss();
    });
    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || definition.hidden) return;
        event.preventDefault();
        dismiss();
    });
    window.addEventListener('hashchange', dismiss);
    window.addEventListener('pagehide', dismiss);

    trigger.disabled = false;
    update();
})();
