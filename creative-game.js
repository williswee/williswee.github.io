(() => {
    const button = document.getElementById('random-project-btn');
    const reroll = document.getElementById('another-project-btn');
    const projects = Array.from(document.querySelectorAll('.creative-projects > li[id]'))
        .filter(project => project.querySelector('h2'));
    if (!button || projects.length < 2) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let selected = null;
    let lastPicked = null;
    let remaining = [];
    let roll = null;

    function markProject(project) {
        selected = project;
        if (project) lastPicked = project;
        projects.forEach(entry => {
            const picked = entry === project;
            entry.classList.toggle('creative-project--picked', picked);
            const heading = entry.querySelector('h2');
            if (picked) heading.setAttribute('aria-current', 'location');
            else heading.removeAttribute('aria-current');
        });
        if (reroll) {
            const actions = project?.querySelector('.creative-project-actions');
            if (actions) actions.append(reroll);
            reroll.hidden = !actions;
        }
    }

    function projectForHash() {
        return projects.find(project => `#${encodeURIComponent(project.id)}` === window.location.hash) || null;
    }

    function seedFromHash() {
        const project = projectForHash();
        if (project) remaining = projects.filter(entry => entry !== project);
        markProject(project);
    }

    function pickProject(event) {
        if (!remaining.length) remaining = [...projects];
        const choices = remaining.filter(project => project !== lastPicked);
        const project = choices[Math.floor(Math.random() * choices.length)];
        remaining.splice(remaining.indexOf(project), 1);
        const heading = project.querySelector('h2');
        markProject(project);

        roll?.cancel();
        const icon = event.currentTarget.querySelector('.random-pick-icon');
        if (!reducedMotion.matches && icon?.animate) {
            roll = icon.animate(
                [{ transform: 'rotate(0deg)' }, { transform: 'rotate(180deg)' }],
                { duration: 220, easing: 'cubic-bezier(.16, 1, .3, 1)' }
            );
        }

        window.history.replaceState(window.history.state, '', `#${encodeURIComponent(project.id)}`);
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
        // Keep the heading beneath the fixed navigation, including enlarged text.
        const headerBottom = document.querySelector('.reading-hud')?.getBoundingClientRect().bottom || 0;
        const top = Math.max(0, window.scrollY + project.getBoundingClientRect().top - headerBottom - 24);
        window.scrollTo({ top, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    }

    button.addEventListener('click', pickProject);
    reroll?.addEventListener('click', pickProject);

    window.addEventListener('hashchange', seedFromHash);
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) roll?.cancel(); });
    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || event.defaultPrevented || !selected) return;
        // A focused reroll cannot disappear along with its selected project.
        if (document.activeElement === reroll) {
            const heading = selected.querySelector('h2');
            heading.setAttribute('tabindex', '-1');
            heading.focus({ preventScroll: true });
        }
        markProject(null);
        if (projectForHash()) {
            window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
        }
    });

    seedFromHash();
    button.hidden = false;
})();
