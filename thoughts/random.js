(function () {
    const DEFAULT_ESSAYS = [
        'freedom.html', 'talktousers.html', 'nomoney.html', 'tickertownusabilitytest.html',
        'meditation.html', 'boring-ai.html', 'hakunamatata.html', 'habits.html',
        'kinder.html', 'tickertown.html', 'famplan.html', 'userguide.html',
        'nowork.html', 'whatidid.html', 'mission.html', 'onemonth.html',
        'goodbye.html', 'tiasph.html', 'burnout.html', 'reminders.html',
        'hithard.html', 'carbonneutral.html', 'ten.html', 'layoffsucks.html',
        'stress.html', 'risk.html', 'profitable.html', 'buildculture.html',
        'dontdie.html', 'smallround.html', 'thehardway.html', 'tiaexperiment.html',
        'bounce.html', 'youaretheproblem.html', 'abroad.html', 'getshitdone.html',
        'journey.html', 'yc.html'
    ];

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
})();
