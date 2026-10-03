(() => {
    const button = document.getElementById('random-project-btn');
    const projects = Array.from(document.querySelectorAll('.creative-projects > li[id]'))
        .filter(project => project.querySelector('h2'));
    if (!button || projects.length < 2) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const icon = button.querySelector('.random-pick-icon');
    let selected = null;
    let lastPicked = null;
    let roll = null;

    function markProject(project) {
        selected = project;
        if (project) lastPicked = project;
        projects.forEach(entry => entry.classList.toggle('creative-project--picked', entry === project));
    }

    function projectForHash() {
        return projects.find(project => `#${encodeURIComponent(project.id)}` === window.location.hash) || null;
    }

    button.addEventListener('click', () => {
        const choices = projects.filter(project => project !== lastPicked);
        const project = choices[Math.floor(Math.random() * choices.length)];
        const heading = project.querySelector('h2');
        markProject(project);

        roll?.cancel();
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
    });

    window.addEventListener('hashchange', () => markProject(projectForHash()));
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) roll?.cancel(); });
    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || event.defaultPrevented || !selected) return;
        // Leave focus and the viewport alone when removing the selection marks.
        markProject(null);
        if (projectForHash()) {
            window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
        }
    });

    markProject(projectForHash());
    button.hidden = false;
})();
