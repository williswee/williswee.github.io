// Authoring-time templates. The published site contains these links as HTML.
export const navigation = [
    { label: 'Home', href: '/' },
    { label: 'Work', href: '/work.html' },
    { label: 'Coaching', href: '/coaching.html' },
    { label: 'Writing', href: '/thoughts/' },
    { label: 'Play', href: '/play' },
    { label: 'Books', href: '/books.html' },
    { label: 'User guide', href: '/guide.html' },
    { label: 'Gratitude', href: '/gratitude.html' },
    { label: 'Connect', href: '/#terminal' },
];

const chevron = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="m5 7 5 5 5-5"/></svg>';

function route(pagePath) {
    const path = '/' + pagePath.replace(/^\//, '');
    if (path === '/index.html') return '/';
    if (path === '/thoughts/index.html') return '/thoughts/';
    if (path === '/play.html') return '/play';
    return path;
}

function current(item, pagePath) {
    const path = route(pagePath);
    if (item.href === path) return 'page';
    if (item.href === '/thoughts/' && path.startsWith('/thoughts/')) return 'location';
    return null;
}

function link(item, pagePath, className = '') {
    const state = current(item, pagePath);
    return `<a${className ? ` class="${className}"` : ''} href="${item.href}"${state ? ` aria-current="${state}"` : ''}>${item.label}</a>`;
}

export function renderHeader(pagePath) {
    const home = route(pagePath) === '/';
    const secondaryCurrent = navigation.slice(4).some(item => current(item, pagePath));
    return `<header class="${home ? 'site-hud' : 'reading-hud'} site-header">
        <a class="site-brand" href="/" aria-label="Willis Wee, home">
            <span class="brand-full">Willis Wee</span><span class="brand-short" aria-hidden="true">Willis</span><small aria-hidden="true">👋</small>
        </a>
        <details class="site-menu">
            <summary class="site-menu-toggle">Menu ${chevron}</summary>
            <nav class="site-navigation" aria-label="Main navigation">
                ${link(navigation[0], pagePath, 'site-home-link')}
${navigation.slice(1, 4).map(item => `                ${link(item, pagePath)}`).join('\n')}
                <details class="site-more"${secondaryCurrent ? ' data-current="true"' : ''}>
                    <summary>More ${chevron}</summary>
                    <div class="site-more-links">
${navigation.slice(4).map(item => `                        ${link(item, pagePath)}`).join('\n')}
                    </div>
                </details>
            </nav>
        </details>${home ? '\n        <span class="scroll-progress" aria-hidden="true"></span>' : ''}
    </header>`;
}

export function renderFooter(pagePath) {
    return `<details class="site-footer-menu">
                <summary><span>Explore this site</span> ${chevron}</summary>
                <nav class="site-footer-nav" aria-label="Footer navigation">
${navigation.map(item => `                    ${link(item, pagePath)}`).join('\n')}
                </nav>
            </details>`;
}

export function renderBreadcrumb(titleHtml) {
    // H1 markup is authored HTML. Preserve entities but omit presentational tags.
    const title = titleHtml.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    return `<nav class="breadcrumbs" aria-label="Breadcrumb">
                <ol>
                    <li><a href="/">Home</a></li>
                    <li><a href="/thoughts/">Writing</a></li>
                    <li><span aria-current="page">${title}</span></li>
                </ol>
            </nav>`;
}

export function normalizeNavigation(html, pagePath) {
    if (!/<header class="(?:site-hud|reading-hud)(?: site-header)?">/.test(html)) {
        throw new Error(`${pagePath}: shared header not found`);
    }
    let result = html.replace(/<header class="(?:site-hud|reading-hud)(?: site-header)?">[\s\S]*?<\/header>/,
        renderHeader(pagePath));

    // One shared stylesheet, loaded after all page-specific styles.
    result = result.replace(/^[ \t]*<link[^>]+href="[^"\n]*site-navigation\.css[^"\n]*"[^>]*>\n/gm, '');
    result = result.replace(/^[ \t]*<script\b[^>]*src="[^"\n]*(?:reading-nav|site-nav|site-navigation)\.js[^"\n]*"[^>]*><\/script>\n/gm, '');
    const styleLinks = [...result.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)];
    const lastStyle = styleLinks.at(-1);
    if (!lastStyle) throw new Error(`${pagePath}: stylesheet not found`);
    const styleEnd = lastStyle.index + lastStyle[0].length;
    result = result.slice(0, styleEnd) + '\n    <link rel="stylesheet" href="/site-navigation.css?v=4">\n    <script src="/site-navigation.js?v=1" defer></script>' + result.slice(styleEnd);

    // Normalize only homepage/archive aliases; keep authored URLs and all hashes.
    result = result.replace(/<a\b[^>]*\bhref="([^"]*)"[^>]*>[\s\S]*?<\/a>/g, (anchor, href) => {
        if (!href || href.startsWith('#')) return anchor;
        let url;
        try { url = new URL(href, `https://williswee.com/${pagePath.replace(/^\//, '')}`); }
        catch { return anchor; }
        if (url.origin !== 'https://williswee.com') return anchor;
        if (url.pathname === '/index.html') url.pathname = '/';
        else if (url.pathname === '/thoughts/index.html') url.pathname = '/thoughts/';
        else return anchor;
        return anchor.replace(`href="${href}"`, `href="${url.pathname}${url.search}${url.hash}"`);
    });

    result = result.replace(/<footer\b([^>]*)>([\s\S]*?)<\/footer>/, (_, attrs, body) => {
        let rest = body.replace(/\s*<details class="site-footer-menu"[^>]*>[\s\S]*?<\/details>/, '')
            .replace(/\s*<nav class="site-footer-nav"[^>]*>[\s\S]*?<\/nav>/, '')
            .replace(/\s*<a class="footer-home"[^>]*>[\s\S]*?<\/a>/, '').trim();
        if (!/<div class="site-footer-social">/.test(rest)) {
            rest = rest.replace(/<span class="follow-strip-label">[\s\S]*?<\/span>\s*<(div|nav)\b[^>]*\bclass="follow-strip-icons"[^>]*>[\s\S]*?<\/\1>/,
                social => `<div class="site-footer-social">\n            ${social}\n            </div>`);
        }
        return `<footer${attrs}>\n            ${renderFooter(pagePath)}${rest ? `\n            ${rest}` : ''}\n        </footer>`;
    });

    if (/<body class="essay-page"/.test(result)) {
        const title = result.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1];
        if (!title) throw new Error(`${pagePath}: essay H1 not found`);
        const breadcrumb = renderBreadcrumb(title);
        if (/<nav class="breadcrumbs"/.test(result)) {
            result = result.replace(/<nav class="breadcrumbs"[^>]*>[\s\S]*?<\/nav>/, breadcrumb);
        } else if (/<a class="essay-back /.test(result)) {
            result = result.replace(/<a class="essay-back [^"]*"[^>]*>[\s\S]*?<\/a>/, breadcrumb);
        } else {
            throw new Error(`${pagePath}: essay return link not found`);
        }
    }
    return result;
}
