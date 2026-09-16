(() => {
    'use strict';

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const header = document.querySelector('.reading-hud');
    const headerHeight = () => header?.getBoundingClientRect().height || 76;

    function wireRandom(button, getChoices) {
        if (!button) return;
        button.hidden = false;
        button.addEventListener('click', () => {
            const choices = getChoices();
            if (!choices.length || button.disabled) return;
            const destination = choices[Math.floor(Math.random() * choices.length)];
            button.disabled = true;
            button.classList.add('rolling');
            window.setTimeout(() => window.location.assign(destination), reducedMotion.matches ? 0 : 220);
        });
        // A browser back/forward-cache restore must not leave the picker disabled.
        window.addEventListener('pageshow', () => {
            button.disabled = false;
            button.classList.remove('rolling');
        });
    }

    const originalList = document.getElementById('article-list');
    const archive = document.getElementById('thoughts-archive-container');
    if (originalList && archive) {
        const items = [...originalList.children];
        const links = items.map(item => item.querySelector('a').href);
        document.getElementById('thoughts-count-label').textContent = `${items.length} essays`;
        wireRandom(document.getElementById('random-thought-btn'), () => links);

        const groups = new Map();
        items.forEach(item => {
            const year = item.querySelector('.article-date').textContent.match(/\b20\d{2}\b/)?.[0] || 'Archive';
            if (!groups.has(year)) groups.set(year, []);
            groups.get(year).push(item);
        });

        const controls = document.querySelector('.archive-controls');
        const fragment = document.createDocumentFragment();

        groups.forEach((groupItems, year) => {
            const section = document.createElement('section');
            section.className = 'timeline-year-group';
            section.id = `section-year-${year}`;
            section.setAttribute('aria-labelledby', `year-${year}`);
            const heading = document.createElement('div');
            heading.className = 'timeline-year-header';
            const title = document.createElement('h2');
            title.className = 'timeline-year-title';
            title.id = `year-${year}`;
            title.textContent = year;
            const count = document.createElement('span');
            count.className = 'timeline-year-count';
            count.textContent = `${groupItems.length} ${groupItems.length === 1 ? 'essay' : 'essays'}`;
            heading.append(title, count);
            const list = document.createElement('ul');
            list.className = 'article-list';
            list.append(...groupItems);
            section.append(heading, list);
            fragment.append(section);
        });
        archive.replaceChildren(fragment);
        function updateArchiveOffset() {
            const controlsHeight = controls.getBoundingClientRect().height;
            document.documentElement.style.setProperty('--archive-offset', `${controlsHeight + 12}px`);
        }
        window.addEventListener('resize', updateArchiveOffset);
        if ('ResizeObserver' in window) new ResizeObserver(updateArchiveOffset).observe(controls);
        updateArchiveOffset();
    }

    const article = document.querySelector('article');
    if (!article) return;

    let essays = [...(window.WILLIS_ESSAYS || [])];
    fetch('index.html').then(response => {
        if (!response.ok) throw new Error('Archive unavailable');
        return response.text();
    }).then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const links = [...doc.querySelectorAll('.article-list li a')]
            .map(link => link.getAttribute('href')).filter(href => /^[a-z0-9-]+\.html$/.test(href));
        if (links.length) essays = [...new Set(links)];
    }).catch(() => { /* The static archive keeps random pick available offline. */ });
    const currentFile = location.pathname.split('/').pop();
    wireRandom(document.getElementById('random-article-btn'), () => essays.filter(file => file !== currentFile));

    const progress = document.createElement('div');
    progress.id = 'reading-progress-bar';
    progress.className = 'reading-progress-bar';
    progress.setAttribute('aria-hidden', 'true');
    document.body.append(progress);
    let progressPending = false;
    function updateProgress() {
        progressPending = false;
        const bounds = article.getBoundingClientRect();
        const visibleHeight = Math.max(1, innerHeight - headerHeight());
        const readingDistance = bounds.height - visibleHeight;
        // Completion belongs to the essay, not the newsletter and footer below it.
        // A short essay is complete once its final line fits in the viewport.
        const fraction = !bounds.height ? 0 : bounds.bottom <= innerHeight + 1 ? 1 :
            readingDistance > 0 ? (headerHeight() - bounds.top) / readingDistance : 0;
        progress.style.width = `${Math.max(0, Math.min(1, fraction)) * 100}%`;
    }
    function queueProgress() {
        if (progressPending) return;
        progressPending = true;
        requestAnimationFrame(updateProgress);
    }
    window.addEventListener('scroll', queueProgress, {passive: true});
    window.addEventListener('resize', queueProgress);
    window.addEventListener('load', queueProgress);
    window.addEventListener('pageshow', queueProgress);
    article.addEventListener('load', queueProgress, true);
    if ('ResizeObserver' in window) {
        const progressResize = new ResizeObserver(queueProgress);
        progressResize.observe(article);
        if (header) progressResize.observe(header);
    }
    document.fonts?.ready.then(queueProgress);
    updateProgress();

    // Preserve code formatting without making a wide snippet overflow the page.
    // Explicit focusability also supports browsers without automatic scroller focus.
    article.querySelectorAll('pre').forEach(block => {
        if (!block.hasAttribute('tabindex')) block.tabIndex = 0;
    });

    const popover = document.createElement('div');
    popover.id = 'footnote-popover';
    popover.className = 'footnote-popover';
    popover.setAttribute('role', 'tooltip');
    popover.hidden = true;
    document.body.append(popover);
    let activeFootnote;
    let previousDescription;
    let hideTimer;
    function hideFootnote() {
        clearTimeout(hideTimer);
        popover.hidden = true;
        if (activeFootnote) {
            if (previousDescription === null) activeFootnote.removeAttribute('aria-describedby');
            else activeFootnote.setAttribute('aria-describedby', previousDescription);
        }
        activeFootnote = null;
    }
    function showFootnote(anchor, note) {
        clearTimeout(hideTimer);
        hideFootnote();
        activeFootnote = anchor;
        previousDescription = anchor.getAttribute('aria-describedby');
        const content = note.cloneNode(true);
        content.removeAttribute('id');
        content.querySelector('sup')?.remove();
        content.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
        popover.replaceChildren(content);
        popover.hidden = false;
        anchor.setAttribute('aria-describedby', [previousDescription, popover.id].filter(Boolean).join(' '));
        popover.style.width = `${Math.min(340, innerWidth - 32)}px`;
        const rect = anchor.getBoundingClientRect();
        const height = popover.offsetHeight;
        const top = rect.top - height - 12 > headerHeight() ? rect.top - height - 12 : rect.bottom + 12;
        popover.style.top = `${window.scrollY + top}px`;
        popover.style.left = `${Math.max(16, Math.min(innerWidth - popover.offsetWidth - 16, rect.left - 140))}px`;
    }
    const scheduleHide = () => {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            if (activeFootnote?.matches(':hover, :focus') || popover.matches(':hover, :focus-within')) return;
            hideFootnote();
        }, 160);
    };
    const seenFootnotes = new Set();
    article.querySelectorAll('sup a[href^="#footnote"], a[href^="#fn"], sup').forEach(reference => {
        if (reference.closest('.article-footnotes')) return;
        let anchor = reference.tagName === 'A' ? reference : reference.querySelector('a');
        if (anchor?.getAttribute('href')?.startsWith('#footnote-anchor') || seenFootnotes.has(anchor || reference)) return;
        let note = anchor?.hash ? document.getElementById(anchor.hash.slice(1)) : null;
        if (!note && reference.tagName === 'SUP' && /^\d+$/.test(reference.textContent.trim())) {
            const number = reference.textContent.trim();
            note = [...article.querySelectorAll('p')].find(p =>
                p.querySelector('sup')?.textContent.trim() === number && p.textContent.trim().startsWith(number) &&
                p !== reference.closest('p') && (reference.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING));
        }
        if (!note) return;
        if (!anchor) {
            if (!note.id) {
                let id = `legacy-footnote-${reference.textContent.trim()}`;
                while (document.getElementById(id)) id += '-note';
                note.id = id;
            }
            anchor = document.createElement('a');
            anchor.href = `#${note.id}`;
            anchor.append(...reference.childNodes);
            reference.append(anchor);
        }
        seenFootnotes.add(anchor);
        if (!anchor.hasAttribute('aria-label')) anchor.setAttribute('aria-label', `Footnote ${anchor.textContent.trim()}`);
        anchor.addEventListener('mouseenter', () => showFootnote(anchor, note));
        anchor.addEventListener('mouseleave', scheduleHide);
        anchor.addEventListener('focus', () => showFootnote(anchor, note));
        anchor.addEventListener('blur', scheduleHide);
        anchor.addEventListener('click', event => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            hideFootnote();
            // Hover/focus previews, while activation keeps native navigation.
            requestAnimationFrame(() => {
                if (location.hash !== anchor.hash) return;
                if (!note.hasAttribute('tabindex')) note.tabIndex = -1;
                note.focus({ preventScroll: true });
                // Focusing can cancel an in-flight native smooth anchor scroll
                // in Chrome. Align after focus without changing href/history.
                note.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
            });
        });
    });
    popover.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    popover.addEventListener('mouseleave', scheduleHide);
    popover.addEventListener('focusout', scheduleHide);
    document.addEventListener('pointerdown', event => {
        if (!popover.contains(event.target) && !activeFootnote?.contains(event.target)) hideFootnote();
    });
    document.addEventListener('focusin', event => {
        if (event.target !== activeFootnote && !popover.contains(event.target)) hideFootnote();
    });

    const dock = document.createElement('div');
    dock.id = 'quote-action-dock';
    dock.className = 'quote-action-dock';
    dock.setAttribute('role', 'toolbar');
    dock.setAttribute('aria-label', 'Quote actions');
    dock.hidden = true;
    dock.innerHTML = `
        <button class="quote-btn" id="quote-copy-btn" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 5H5v16h14V5h-4M9 3h6v4H9z"/></svg>
            <span class="quote-btn-label" aria-live="polite">Copy quote</span>
        </button>
        <a class="quote-btn" id="quote-share-btn" target="_blank" rel="noopener noreferrer" aria-label="Share quote on X">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 3h4l10 18h-4L5 3zm14 0L5 21"/></svg>
            <span>Share</span>
        </a>`;
    document.body.append(dock);
    const copy = dock.querySelector('#quote-copy-btn');
    const copyLabel = copy.querySelector('.quote-btn-label');
    const share = dock.querySelector('#quote-share-btn');
    let selectedText = '';
    let quoteOrigin;
    let selectionTimer;
    let copyTimer;
    function quoteUrl() {
        // Essay content is path-based. Drop preview/tracking queries and stale
        // footnotes, but keep the current origin so local previews still work.
        const url = new URL(location.href);
        url.search = '';
        url.hash = '';
        return url.href;
    }
    function hideDock() {
        clearTimeout(selectionTimer);
        if (dock.contains(document.activeElement)) {
            const target = quoteOrigin?.isConnected ? quoteOrigin : article;
            if (!target.hasAttribute('tabindex')) {
                target.tabIndex = -1;
                target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
            }
            target.focus({ preventScroll: true });
        }
        dock.hidden = true;
        selectedText = '';
    }
    function updateSelection() {
        const selection = window.getSelection();
        const text = selection?.toString().trim() || '';
        if (text.length >= 8 && text.length <= 500 && selection.rangeCount && article.contains(selection.getRangeAt(0).commonAncestorContainer)) {
            selectedText = text;
            const ancestor = selection.getRangeAt(0).commonAncestorContainer;
            const origin = ancestor.nodeType === Node.ELEMENT_NODE ? ancestor : ancestor.parentElement;
            quoteOrigin = origin.closest('p, li, blockquote, h2, h3, pre') || article;
            const rect = selection.getRangeAt(0).getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            dock.hidden = false;
            const top = rect.top - dock.offsetHeight - 12 > headerHeight() ? rect.top - dock.offsetHeight - 12 : rect.bottom + 12;
            dock.style.top = `${window.scrollY + top}px`;
            dock.style.left = `${Math.max(16, Math.min(innerWidth - dock.offsetWidth - 16, rect.left))}px`;
            share.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`“${text}” — @williswee`)}&url=${encodeURIComponent(quoteUrl())}`;
        } else if (!dock.contains(document.activeElement) && !dock.matches(':hover')) {
            hideDock();
        }
    }
    document.addEventListener('selectionchange', () => {
        clearTimeout(selectionTimer);
        selectionTimer = setTimeout(updateSelection, 100);
    });
    document.addEventListener('mouseup', updateSelection);
    dock.addEventListener('mouseleave', updateSelection);
    dock.addEventListener('focusout', () => requestAnimationFrame(updateSelection));
    document.addEventListener('keyup', event => {
        if (event.key !== 'Escape') updateSelection();
    });
    copy.addEventListener('mousedown', event => event.preventDefault());
    copy.addEventListener('click', async () => {
        if (!selectedText) return;
        clearTimeout(copyTimer);
        copy.classList.remove('quote-btn--copied');
        try {
            await navigator.clipboard.writeText(`“${selectedText}” — Willis Wee\n${quoteUrl()}`);
            copy.classList.add('quote-btn--copied');
            copyLabel.textContent = 'Copied!';
        } catch {
            copyLabel.textContent = 'Copy failed';
            copy.title = 'Use your browser’s Copy command on the selected text.';
        }
        copyTimer = setTimeout(() => {
            copy.classList.remove('quote-btn--copied');
            copyLabel.textContent = 'Copy quote';
            copy.removeAttribute('title');
        }, 4000);
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            clearTimeout(selectionTimer);
            hideFootnote();
            hideDock();
            window.getSelection()?.removeAllRanges();
        }
    });
    document.addEventListener('pointerdown', event => {
        if (!dock.contains(event.target) && !article.contains(event.target)) hideDock();
    });
})();
