/**
 * Willis Wee — Reading Journey Enhancements
 * - Whisper-Thin Reading Progress Line
 * - Inline Footnote Peek (Popovers)
 * - Tactile "Quote & Share" on Text Selection
 * - Random Thought Essay Picker
 */
(function () {
    // ================================================================
    // 1. RANDOM ESSAY PICKER
    // ================================================================
    // Compatibility reader: share the generated manifest with the modern reader.
    const DEFAULT_ESSAYS = window.WILLIS_ESSAYS || [];

    let essayList = [...DEFAULT_ESSAYS];

    // Asynchronously refresh list from index.html if available
    try {
        fetch('index.html')
            .then(res => res.text())
            .then(html => {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const links = Array.from(doc.querySelectorAll('.article-list li a'));
                const scraped = links.map(a => a.getAttribute('href')).filter(h => h && h.endsWith('.html'));
                if (scraped.length > 0) {
                    essayList = Array.from(new Set([...scraped, ...DEFAULT_ESSAYS]));
                }
            })
            .catch(() => {});
    } catch (e) {}

    const currentFile = window.location.pathname.split('/').pop() || '';
    const randomBtn = document.getElementById('random-article-btn');

    if (randomBtn) {
        randomBtn.addEventListener('click', () => {
            const available = essayList.filter(file => file !== currentFile);
            if (available.length === 0) return;

            const pick = available[Math.floor(Math.random() * available.length)];

            randomBtn.classList.remove('rolling');
            void randomBtn.offsetWidth;
            randomBtn.classList.add('rolling');

            setTimeout(() => {
                window.location.href = pick;
            }, 180);
        });
    }

    // ================================================================
    // 2. WHISPER-THIN READING PROGRESS LINE
    // ================================================================
    const article = document.querySelector('article');
    if (article) {
        const progressBar = document.createElement('div');
        progressBar.className = 'reading-progress-bar';
        progressBar.id = 'reading-progress-bar';
        progressBar.setAttribute('aria-hidden', 'true');
        document.body.appendChild(progressBar);

        let ticking = false;
        function updateProgress() {
            const scrollY = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (docHeight > 0) {
                const progress = Math.min(100, Math.max(0, (scrollY / docHeight) * 100));
                progressBar.style.width = progress + '%';
            }
            ticking = false;
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateProgress);
                ticking = true;
            }
        }, { passive: true });
        updateProgress();
    }

    // ================================================================
    // 3. INLINE FOOTNOTE PEEK (POPOVERS)
    // ================================================================
    if (article) {
        const popover = document.createElement('div');
        popover.className = 'footnote-popover';
        popover.id = 'footnote-popover';
        popover.setAttribute('role', 'tooltip');
        popover.setAttribute('aria-hidden', 'true');
        popover.hidden = true;

        const popoverContent = document.createElement('div');
        popoverContent.className = 'footnote-popover-content';
        popover.appendChild(popoverContent);

        const popoverArrow = document.createElement('div');
        popoverArrow.className = 'footnote-popover-arrow';
        popover.appendChild(popoverArrow);

        document.body.appendChild(popover);

        let hideTimeout;
        let activeAnchor;
        let previousDescription;

        function hidePopover() {
            clearTimeout(hideTimeout);
            popover.classList.remove('visible');
            popover.setAttribute('aria-hidden', 'true');
            popover.hidden = true;
            if (activeAnchor) {
                if (previousDescription === null) activeAnchor.removeAttribute('aria-describedby');
                else activeAnchor.setAttribute('aria-describedby', previousDescription);
            }
            activeAnchor = null;
        }

        function showPopover(anchor, contentHtml) {
            hidePopover();
            activeAnchor = anchor;
            previousDescription = anchor.getAttribute('aria-describedby');
            popoverContent.innerHTML = contentHtml;
            popover.hidden = false;
            popover.classList.add('visible');
            popover.setAttribute('aria-hidden', 'false');
            anchor.setAttribute('aria-describedby', [previousDescription, popover.id].filter(Boolean).join(' '));

            const anchorRect = anchor.getBoundingClientRect();
            const popoverWidth = Math.min(320, window.innerWidth - 32);
            popover.style.width = popoverWidth + 'px';

            const popoverHeight = popover.offsetHeight;
            let top = anchorRect.top + window.scrollY - popoverHeight - 10;
            let placement = 'top';

            if (anchorRect.top < popoverHeight + 20) {
                // If not enough room on top, show below
                top = anchorRect.bottom + window.scrollY + 10;
                placement = 'bottom';
            }

            popover.setAttribute('data-placement', placement);

            let left = anchorRect.left + (anchorRect.width / 2) - (popoverWidth / 2);
            left = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, left));

            popover.style.top = top + 'px';
            popover.style.left = left + 'px';

            // Position arrow relative to anchor
            const arrowLeft = Math.max(12, Math.min(popoverWidth - 12, anchorRect.left + (anchorRect.width / 2) - left - 4));
            popoverArrow.style.left = arrowLeft + 'px';
        }

        function scheduleHidePopover() {
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => {
                if (activeAnchor?.matches(':hover, :focus') || popover.matches(':hover, :focus-within')) return;
                hidePopover();
            }, 120);
        }

        popover.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
        popover.addEventListener('mouseleave', scheduleHidePopover);
        popover.addEventListener('focusout', scheduleHidePopover);

        // Find all footnote anchors
        const footnoteAnchors = Array.from(article.querySelectorAll('sup a[href^="#footnote"], a[href^="#fn"], sup'));
        const seenAnchors = new Set();

        footnoteAnchors.forEach(el => {
            // Endnote back-links are navigation, not another preview trigger.
            if (el.closest('.article-footnotes')) return;
            let anchor = el.tagName === 'A' ? el : el.querySelector('a');
            if (anchor?.getAttribute('href')?.startsWith('#footnote-anchor')) return;
            if (seenAnchors.has(anchor || el)) return;
            let footnoteId = '';

            if (anchor && anchor.getAttribute('href')?.startsWith('#')) {
                footnoteId = anchor.getAttribute('href').substring(1);
            }

            // Find target footnote text
            let footnoteEl = footnoteId ? document.getElementById(footnoteId) : null;

            // Fallback lookup if no explicit anchor ID
            if (!footnoteEl && el.tagName === 'SUP') {
                const num = el.textContent.trim();
                if (/^\d+$/.test(num)) {
                    // A bare reference points forward to a paragraph beginning
                    // with its matching number, not back to another reference.
                    const candidates = Array.from(article.querySelectorAll('p')).filter(p => {
                        const sup = p.querySelector('sup');
                        return sup && sup.textContent.trim() === num &&
                            p.textContent.trim().startsWith(num) &&
                            p !== el.closest('p') &&
                            (el.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING);
                    });
                    if (candidates.length > 0) {
                        footnoteEl = candidates[0];
                    }
                }
            }

            if (footnoteEl) {
                // Clone and sanitize footnote content
                const clone = footnoteEl.cloneNode(true);
                // Remove back-reference anchor if present
                const backRef = clone.querySelector('sup, a[href^="#footnote-anchor"]');
                if (backRef) backRef.remove();
                clone.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
                const contentHtml = clone.innerHTML.trim();

                if (contentHtml) {
                    // Give older bare superscripts the same native keyboard
                    // link as explicitly marked-up footnotes.
                    if (!anchor) {
                        if (!footnoteEl.id) {
                            let id = `legacy-footnote-${el.textContent.trim()}`;
                            while (document.getElementById(id)) id += '-note';
                            footnoteEl.id = id;
                        }
                        anchor = document.createElement('a');
                        anchor.href = `#${footnoteEl.id}`;
                        anchor.append(...el.childNodes);
                        el.appendChild(anchor);
                    }
                    seenAnchors.add(anchor);
                    const targetInteractive = anchor;
                    if (!anchor.hasAttribute('aria-label')) {
                        anchor.setAttribute('aria-label', `Footnote ${anchor.textContent.trim()}`);
                    }

                    targetInteractive.addEventListener('mouseenter', () => showPopover(targetInteractive, contentHtml));
                    targetInteractive.addEventListener('mouseleave', scheduleHidePopover);
                    targetInteractive.addEventListener('focus', () => showPopover(targetInteractive, contentHtml));
                    targetInteractive.addEventListener('blur', scheduleHidePopover);

                    targetInteractive.addEventListener('click', (e) => {
                        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                        // Keep native href/history behavior: focus or hover
                        // previews; activation reaches the complete endnote.
                        hidePopover();
                        window.requestAnimationFrame(() => {
                            if (window.location.hash !== anchor.hash) return;
                            if (!footnoteEl.hasAttribute('tabindex')) footnoteEl.setAttribute('tabindex', '-1');
                            footnoteEl.focus({ preventScroll: true });
                            footnoteEl.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
                        });
                    });
                }
            }
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') hidePopover();
        });
        document.addEventListener('pointerdown', event => {
            if (!popover.contains(event.target) && !activeAnchor?.contains(event.target)) hidePopover();
        });
        document.addEventListener('focusin', event => {
            if (!popover.contains(event.target) && event.target !== activeAnchor) hidePopover();
        });
    }

    // ================================================================
    // 4. TACTILE "QUOTE & SHARE" ON TEXT SELECTION
    // ================================================================
    if (article) {
        const quoteDock = document.createElement('div');
        quoteDock.className = 'quote-action-dock';
        quoteDock.id = 'quote-action-dock';
        quoteDock.setAttribute('role', 'toolbar');
        quoteDock.setAttribute('aria-label', 'Quote actions');
        quoteDock.hidden = true;

        quoteDock.innerHTML = `
            <button class="quote-btn quote-btn--copy" id="quote-copy-btn" type="button" aria-label="Copy quote">
                <span class="quote-btn-icon" aria-hidden="true">📋</span>
                <span class="quote-btn-label">Copy Quote</span>
            </button>
            <a class="quote-btn quote-btn--share" id="quote-share-btn" target="_blank" rel="noopener noreferrer" aria-label="Share on X">
                <span class="quote-btn-icon" aria-hidden="true">𝕏</span>
                <span class="quote-btn-label">Share</span>
            </a>
        `;

        document.body.appendChild(quoteDock);

        const copyBtn = quoteDock.querySelector('#quote-copy-btn');
        const shareBtn = quoteDock.querySelector('#quote-share-btn');
        const copyLabel = copyBtn.querySelector('.quote-btn-label');

        let selectedQuoteText = '';
        let quoteOrigin;
        let selectionTimeout;

        function hideQuoteDock() {
            clearTimeout(selectionTimeout);
            // Never strand keyboard focus inside an element we are hiding.
            if (quoteDock.contains(document.activeElement)) {
                const target = quoteOrigin?.isConnected ? quoteOrigin : article;
                if (!target.hasAttribute('tabindex')) {
                    target.setAttribute('tabindex', '-1');
                    target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
                }
                target.focus({ preventScroll: true });
            }
            quoteDock.classList.remove('visible');
            quoteDock.hidden = true;
            selectedQuoteText = '';
        }

        function updateQuoteDock() {
            const selection = window.getSelection();
            const text = selection ? selection.toString().trim() : '';

            // Check if selection is within article and of meaningful length
            if (text.length >= 8 && text.length <= 500 && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const commonAncestor = range.commonAncestorContainer;

                // Ensure selection is inside article and not inside the dock itself
                if (article.contains(commonAncestor) && !quoteDock.contains(commonAncestor)) {
                    selectedQuoteText = text;
                    const origin = commonAncestor.nodeType === Node.ELEMENT_NODE ? commonAncestor : commonAncestor.parentElement;
                    quoteOrigin = origin.closest('p, li, blockquote, h2, h3') || article;
                    const rect = range.getBoundingClientRect();

                    if (rect.width > 0 && rect.height > 0) {
                        quoteDock.hidden = false;
                        const dockWidth = quoteDock.offsetWidth || 190;
                        const dockHeight = quoteDock.offsetHeight || 36;

                        let top = rect.top + window.scrollY - dockHeight - 8;
                        if (rect.top < dockHeight + 16) {
                            top = rect.bottom + window.scrollY + 8;
                        }

                        let left = rect.left + (rect.width / 2) - (dockWidth / 2);
                        left = Math.max(16, Math.min(window.innerWidth - dockWidth - 16, left));

                        quoteDock.style.top = top + 'px';
                        quoteDock.style.left = left + 'px';

                        // Format Twitter/X Intent URL
                        const tweetText = `“${text}” — @williswee`;
                        shareBtn.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(window.location.href)}`;

                        quoteDock.classList.add('visible');
                        return;
                    }
                }
            }

            // Hide dock if selection is cleared or outside
            if (!quoteDock.matches(':hover') && !quoteDock.contains(document.activeElement)) {
                hideQuoteDock();
            }
        }

        document.addEventListener('selectionchange', () => {
            // Small debounce to allow smooth selection dragging
            clearTimeout(selectionTimeout);
            selectionTimeout = setTimeout(updateQuoteDock, 100);
        });

        document.addEventListener('mouseup', updateQuoteDock);
        document.addEventListener('keyup', event => {
            if (event.key !== 'Escape') updateQuoteDock();
        });
        quoteDock.addEventListener('mouseleave', updateQuoteDock);
        quoteDock.addEventListener('focusout', () => window.requestAnimationFrame(updateQuoteDock));
        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape') return;
            hideQuoteDock();
            window.getSelection()?.removeAllRanges();
        });

        // Copy quote action
        copyBtn.addEventListener('mousedown', event => event.preventDefault());
        copyLabel.setAttribute('aria-live', 'polite');
        copyBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!selectedQuoteText) return;

            const formatted = `“${selectedQuoteText}” — Willis Wee\n${window.location.href}`;
            try {
                await navigator.clipboard.writeText(formatted);
                copyBtn.classList.add('quote-btn--copied');
                copyLabel.textContent = 'Copied!';

                setTimeout(() => {
                    copyBtn.classList.remove('quote-btn--copied');
                    copyLabel.textContent = 'Copy Quote';
                }, 1800);
            } catch {
                copyBtn.classList.remove('quote-btn--copied');
                copyLabel.textContent = 'Copy failed';
                setTimeout(() => copyLabel.textContent = 'Copy Quote', 1800);
            }
        });

        // Dismiss on clicking outside
        document.addEventListener('mousedown', (e) => {
            if (!quoteDock.contains(e.target) && !article.contains(e.target)) {
                hideQuoteDock();
            }
        });
    }
})();
