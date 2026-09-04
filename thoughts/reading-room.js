(() => {
    'use strict';

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const scrollBehavior = () => reducedMotion.matches ? 'auto' : 'smooth';
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

        const yearNav = document.getElementById('timeline-nav');
        const yearButtons = document.getElementById('timeline-nav-pills');
        const controls = document.querySelector('.archive-controls');
        const fragment = document.createDocumentFragment();
        const sections = [];
        const buttons = [];
        function makeYearButton(label, year) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'timeline-pill';
            button.textContent = label;
            button.dataset.year = year;
            yearButtons.append(button);
            buttons.push(button);
            return button;
        }
        const all = makeYearButton(`All (${items.length})`, 'all');
        all.setAttribute('aria-current', 'true');
        all.addEventListener('click', () => window.scrollTo({top: 0, behavior: scrollBehavior()}));

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
            sections.push({year, section});
            const button = makeYearButton(`${year} (${groupItems.length})`, year);
            button.setAttribute('aria-controls', section.id);
            button.addEventListener('click', () => section.scrollIntoView({behavior: scrollBehavior(), block: 'start'}));
        });
        archive.replaceChildren(fragment);
        yearNav.hidden = false;

        let framePending = false;
        function updateYears() {
            framePending = false;
            const controlsHeight = controls.getBoundingClientRect().height;
            document.documentElement.style.setProperty('--archive-offset', `${controlsHeight + 12}px`);
            let active = 'all';
            if (window.scrollY > 20) {
                sections.forEach(({year, section}) => {
                    if (section.getBoundingClientRect().top <= headerHeight() + controlsHeight + 42) active = year;
                });
            }
            buttons.forEach(button => {
                if (button.dataset.year === active) button.setAttribute('aria-current', 'true');
                else button.removeAttribute('aria-current');
            });
        }
        function queueYearUpdate() {
            if (framePending) return;
            framePending = true;
            requestAnimationFrame(updateYears);
        }
        window.addEventListener('scroll', queueYearUpdate, {passive: true});
        window.addEventListener('resize', queueYearUpdate);
        if ('ResizeObserver' in window) new ResizeObserver(queueYearUpdate).observe(controls);
        updateYears();
    }

    const article = document.querySelector('article');
    if (!article) return;

    let essays = [
        'tickertownupdate.html', 'freedom.html', 'talktousers.html', 'nomoney.html',
        'tickertownusabilitytest.html', 'meditation.html', 'boring-ai.html', 'hakunamatata.html',
        'habits.html', 'kinder.html', 'tickertown.html', 'famplan.html', 'userguide.html',
        'nowork.html', 'whatidid.html', 'mission.html', 'onemonth.html', 'goodbye.html',
        'tiasph.html', 'burnout.html', 'reminders.html', 'hithard.html', 'carbonneutral.html',
        'ten.html', 'layoffsucks.html', 'stress.html', 'profitable.html', 'getshitdone.html',
        'bounce.html', 'buildculture.html', 'yc.html', 'tiaexperiment.html', 'youaretheproblem.html',
        'smallround.html', 'thehardway.html', 'risk.html', 'abroad.html', 'dontdie.html', 'journey.html'
    ];
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
        const total = document.documentElement.scrollHeight - innerHeight;
        progress.style.width = `${total > 0 ? Math.max(0, Math.min(100, window.scrollY / total * 100)) : 0}%`;
    }
    function queueProgress() {
        if (progressPending) return;
        progressPending = true;
        requestAnimationFrame(updateProgress);
    }
    window.addEventListener('scroll', queueProgress, {passive: true});
    window.addEventListener('resize', queueProgress);
    window.addEventListener('load', queueProgress);
    updateProgress();

    const popover = document.createElement('div');
    popover.id = 'footnote-popover';
    popover.className = 'footnote-popover';
    popover.setAttribute('role', 'tooltip');
    popover.hidden = true;
    document.body.append(popover);
    let activeFootnote;
    let hideTimer;
    function hideFootnote() {
        popover.hidden = true;
        activeFootnote?.removeAttribute('aria-describedby');
        activeFootnote?.setAttribute('aria-expanded', 'false');
        activeFootnote = null;
    }
    function showFootnote(anchor, note) {
        clearTimeout(hideTimer);
        hideFootnote();
        activeFootnote = anchor;
        const content = note.cloneNode(true);
        content.removeAttribute('id');
        content.querySelector('sup')?.remove();
        popover.replaceChildren(content);
        popover.hidden = false;
        anchor.setAttribute('aria-describedby', popover.id);
        anchor.setAttribute('aria-expanded', 'true');
        popover.style.width = `${Math.min(340, innerWidth - 32)}px`;
        const rect = anchor.getBoundingClientRect();
        const height = popover.offsetHeight;
        const top = rect.top - height - 12 > headerHeight() ? rect.top - height - 12 : rect.bottom + 12;
        popover.style.top = `${window.scrollY + top}px`;
        popover.style.left = `${Math.max(16, Math.min(innerWidth - popover.offsetWidth - 16, rect.left - 140))}px`;
    }
    const scheduleHide = () => { hideTimer = setTimeout(hideFootnote, 160); };
    article.querySelectorAll('sup a[href^="#footnote-"]').forEach(anchor => {
        if (anchor.closest('.article-footnotes')) return;
        const note = document.getElementById(anchor.hash.slice(1));
        if (!note) return;
        anchor.setAttribute('aria-label', `Footnote ${anchor.textContent}`);
        anchor.setAttribute('aria-expanded', 'false');
        anchor.addEventListener('mouseenter', () => showFootnote(anchor, note));
        anchor.addEventListener('mouseleave', scheduleHide);
        anchor.addEventListener('focus', () => showFootnote(anchor, note));
        anchor.addEventListener('click', event => { event.preventDefault(); showFootnote(anchor, note); });
    });
    popover.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    popover.addEventListener('mouseleave', scheduleHide);
    document.addEventListener('pointerdown', event => {
        if (!popover.contains(event.target) && event.target !== activeFootnote) hideFootnote();
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
    let selectionTimer;
    let copyTimer;
    function updateSelection() {
        const selection = window.getSelection();
        const text = selection?.toString().trim() || '';
        if (text.length >= 8 && text.length <= 500 && selection.rangeCount && article.contains(selection.getRangeAt(0).commonAncestorContainer)) {
            selectedText = text;
            const rect = selection.getRangeAt(0).getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            dock.hidden = false;
            const top = rect.top - dock.offsetHeight - 12 > headerHeight() ? rect.top - dock.offsetHeight - 12 : rect.bottom + 12;
            dock.style.top = `${window.scrollY + top}px`;
            dock.style.left = `${Math.max(16, Math.min(innerWidth - dock.offsetWidth - 16, rect.left))}px`;
            share.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`“${text}” — @williswee`)}&url=${encodeURIComponent(location.href)}`;
        } else if (!dock.contains(document.activeElement) && !dock.matches(':hover')) {
            dock.hidden = true;
        }
    }
    document.addEventListener('selectionchange', () => {
        clearTimeout(selectionTimer);
        selectionTimer = setTimeout(updateSelection, 100);
    });
    document.addEventListener('mouseup', updateSelection);
    document.addEventListener('keyup', event => {
        if (event.key !== 'Escape') updateSelection();
    });
    copy.addEventListener('mousedown', event => event.preventDefault());
    copy.addEventListener('click', async () => {
        if (!selectedText) return;
        clearTimeout(copyTimer);
        copy.classList.remove('quote-btn--copied');
        try {
            await navigator.clipboard.writeText(`“${selectedText}” — Willis Wee\n${location.href}`);
            copy.classList.add('quote-btn--copied');
            copyLabel.textContent = 'Copied!';
        } catch {
            copyLabel.textContent = 'Couldn’t copy';
        }
        copyTimer = setTimeout(() => {
            copy.classList.remove('quote-btn--copied');
            copyLabel.textContent = 'Copy quote';
        }, 1800);
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            clearTimeout(selectionTimer);
            hideFootnote();
            dock.hidden = true;
        }
    });
    document.addEventListener('pointerdown', event => {
        if (!dock.contains(event.target) && !article.contains(event.target)) dock.hidden = true;
    });
})();
