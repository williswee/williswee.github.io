import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../../thoughts/newsletter.js', import.meta.url), 'utf8');
const provider = 'https://williswee.substack.com/embed';
function setup(count = 1, supportsObserver = true) {
    const requests = [];
    const timers = new Map();
    let timerId = 0;
    let observer;
    class Element {
        constructor(tag) {
            this.tagName = tag.toUpperCase(); this.attributes = new Map(); this.dataset = {};
            this.children = []; this.listeners = new Map(); this.hidden = false;
            this.textContent = ''; this.className = ''; this.id = ''; this.document = null;
        }
        hasAttribute(name) { return this.attributes.has(name); }
        getAttribute(name) { return this.attributes.get(name) ?? null; }
        setAttribute(name, value) { this.attributes.set(name, String(value)); }
        removeAttribute(name) { this.attributes.delete(name); }
        get src() { return this.getAttribute('src'); }
        set src(value) {
            this.setAttribute('src', value);
            requests.push({ frame: this, url: value, loading: this.loading, hidden: this.hidden });
        }
        get contentDocument() {
            if (this.throwOnDocument) throw new Error('Cross-origin access denied');
            return this.document;
        }
        append(...children) { children.forEach(child => { child.parentElement = this; this.children.push(child); }); }
        before(child) {
            const parent = this.parentElement; child.parentElement = parent;
            parent.children.splice(parent.children.indexOf(this), 0, child);
        }
        after(child) {
            const parent = this.parentElement; child.parentElement = parent;
            parent.children.splice(parent.children.indexOf(this) + 1, 0, child);
        }
        replaceWith(child) {
            const parent = this.parentElement; child.parentElement = parent;
            parent.children.splice(parent.children.indexOf(this), 1, child); this.parentElement = null;
        }
        cloneNode() {
            const clone = new Element(this.tagName);
            clone.attributes = new Map(this.attributes); clone.dataset = { ...this.dataset };
            clone.id = this.id; clone.loading = this.loading; clone.hidden = this.hidden;
            return clone;
        }
        closest() { return this.parentElement; }
        addEventListener(type, listener) {
            if (!this.listeners.has(type)) this.listeners.set(type, []);
            this.listeners.get(type).push(listener);
        }
        fire(type) {
            (this.listeners.get(type) || []).forEach(listener => listener({ target: this }));
            if (['click', 'pointerdown', 'keydown', 'focusin'].includes(type)) this.parentElement?.fire(type);
        }
    }
    const body = new Element('body');
    const containers = Array.from({ length: count }, (_, index) => {
        const container = new Element('div');
        container.className = index % 2 ? 'newsletter-cta' : 'subscribe-embed';
        const link = new Element('a'); link.setAttribute('href', 'https://williswee.substack.com/subscribe');
        const frame = new Element('iframe'); frame.dataset.newsletterSrc = provider; frame.loading = 'lazy';
        frame.setAttribute('aria-hidden', 'true'); frame.setAttribute('tabindex', '-1');
        container.append(link, frame); body.append(container); return container;
    });
    const descendants = node => node.children.flatMap(child => [child, ...descendants(child)]);
    const document = {
        createElement: tag => new Element(tag),
        querySelectorAll: () => descendants(body).filter(node => node.tagName === 'IFRAME'),
        getElementById: id => descendants(body).find(node => node.id === id) || null,
    };
    class IntersectionObserver {
        constructor(callback, options) { this.callback = callback; this.options = options; this.targets = new Set(); observer = this; }
        observe(target) { this.targets.add(target); }
        unobserve(target) { this.targets.delete(target); }
        disconnect() { this.disconnected = true; }
    }
    const window = {
        setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, delay }); return id; },
        clearTimeout(id) { timers.delete(id); },
    };
    if (supportsObserver) window.IntersectionObserver = IntersectionObserver;
    vm.runInNewContext(source, { document, window, IntersectionObserver });
    const find = (index, predicate) => descendants(containers[index]).find(predicate);
    return {
        containers, requests, timers, observer,
        frame: (index = 0) => find(index, node => node.tagName === 'IFRAME'),
        status: (index = 0) => find(index, node => node.className === 'newsletter-status'),
        controls: (index = 0) => find(index, node => node.className === 'newsletter-controls'),
        retry: (index = 0) => find(index, node => node.className === 'newsletter-retry'),
        toggle: (index = 0) => find(index, node => node.className === 'newsletter-toggle'),
        state: (index = 0) => containers[index].dataset.newsletterState,
        near(index = 0) { observer.callback([{ target: containers[index], isIntersecting: true }]); },
        timeout() { const [id, timer] = timers.entries().next().value; timers.delete(id); timer.callback(); },
    };
}

test('offscreen newsletters stay compact and make no early provider request', () => {
    const page = setup();
    assert.equal(page.observer.options.rootMargin, '240px 0px');
    assert.deepEqual([...page.observer.targets], page.containers);
    page.observer.callback([{ target: page.containers[0], isIntersecting: false }]);
    assert.equal(page.requests.length, 0); assert.equal(page.frame().hasAttribute('src'), false);
    assert.equal(page.frame().hidden, true); assert.equal(page.frame().getAttribute('aria-hidden'), 'true');
    assert.equal(page.frame().getAttribute('tabindex'), '-1');
    assert.equal(page.status().hidden, true); assert.equal(page.controls().hidden, true);
});
test('the visible container activates one eager request while its iframe remains hidden', () => {
    const page = setup(); page.near(); page.near();
    assert.equal(page.requests.length, 1); assert.equal(page.requests[0].url, provider);
    assert.equal(page.requests[0].loading, 'eager'); assert.equal(page.requests[0].hidden, true);
    assert.equal(page.state(), 'loading'); assert.match(page.status().textContent, /Loading/);
    assert.equal(page.status().getAttribute('role'), 'status');
    assert.equal(page.status().getAttribute('aria-live'), 'polite');
    const children = page.containers[0].children;
    assert.ok(children.indexOf(page.controls()) > children.indexOf(page.status()));
    assert.ok(children.indexOf(page.controls()) < children.indexOf(page.frame()));
    assert.equal(page.controls().hidden, true); assert.equal(page.observer.targets.size, 0);
    assert.equal(page.observer.disconnected, true); assert.equal([...page.timers.values()][0].delay, 12000);
});
for (const inaccessible of ['null', 'throws']) {
    test(`cross-origin load (${inaccessible}) displays the frame without claiming its form works`, () => {
        const page = setup(); page.near(); page.frame().throwOnDocument = inaccessible === 'throws';
        page.frame().fire('load');
        assert.equal(page.state(), 'loaded'); assert.equal(page.frame().hidden, false);
        assert.equal(page.frame().hasAttribute('aria-hidden'), false); assert.equal(page.frame().hasAttribute('tabindex'), false);
        assert.equal(page.status().textContent, 'If the form is blank, reload it or subscribe above.');
        assert.equal(page.retry().hidden, false); assert.equal(page.toggle().hidden, false);
        assert.equal(page.toggle().getAttribute('aria-controls'), page.frame().id);
        assert.equal(page.toggle().getAttribute('aria-expanded'), 'true'); assert.equal(page.timers.size, 0);
    });
}
for (const doc of [
    { URL: 'about:blank', body: { childElementCount: 1, textContent: '' } },
    { URL: provider, body: { childElementCount: 0, textContent: '  ' } },
    { URL: provider, body: null },
]) {
    test(`known blank documents remain compact (${JSON.stringify(doc)})`, () => {
        const page = setup(); page.near(); page.frame().document = doc; page.frame().fire('load');
        assert.equal(page.state(), 'unavailable'); assert.equal(page.frame().hidden, true);
        assert.match(page.status().textContent, /blank.*reload.*subscribe above/);
        assert.equal(page.retry().hidden, false); assert.equal(page.toggle().hidden, true); assert.equal(page.timers.size, 0);
    });
}
test('accessible content is displayed with the same neutral guidance', () => {
    const page = setup(); page.near();
    page.frame().document = { URL: provider, body: { childElementCount: 1, textContent: 'Email' } };
    page.frame().fire('load'); assert.equal(page.state(), 'loaded');
    assert.match(page.status().textContent, /If the form is blank/);
});
for (const reason of ['error', 'timeout']) {
    test(`${reason} provides compact recovery without an empty panel`, () => {
        const page = setup(); page.near();
        if (reason === 'error') page.frame().fire('error'); else page.timeout();
        assert.equal(page.state(), 'unavailable'); assert.equal(page.frame().hidden, true);
        assert.equal(page.frame().getAttribute('aria-hidden'), 'true'); assert.equal(page.frame().getAttribute('tabindex'), '-1');
        assert.equal(page.retry().hidden, false); assert.equal(page.toggle().hidden, true);
        assert.match(page.status().textContent, reason === 'timeout' ? /hasn’t loaded yet/ : /could not be loaded/);
        assert.match(page.status().textContent, /reload it or subscribe above/); assert.equal(page.timers.size, 0);
    });
}
test('late load recovers after timeout if the reader has not interacted', () => {
    const page = setup(); page.near(); page.timeout(); page.frame().fire('load');
    assert.equal(page.state(), 'loaded'); assert.equal(page.frame().hidden, false);
});
for (const failure of ['error', 'blank']) {
    test(`${failure} followed by an opaque error-page load stays compact until explicit retry`, () => {
        const page = setup(); page.near(); const failedFrame = page.frame();
        const staleTimeout = [...page.timers.values()][0].callback;
        if (failure === 'error') failedFrame.fire('error');
        else {
            failedFrame.document = { URL: 'about:blank', body: { childElementCount: 0, textContent: '' } };
            failedFrame.fire('load');
        }
        const message = page.status().textContent;
        staleTimeout();
        failedFrame.document = null;
        failedFrame.fire('load');
        assert.equal(page.state(), 'unavailable'); assert.equal(failedFrame.hidden, true);
        assert.equal(page.status().textContent, message);
        page.retry().fire('click');
        assert.notEqual(page.frame(), failedFrame);
        page.frame().fire('load');
        assert.equal(page.state(), 'loaded'); assert.equal(page.frame().hidden, false);
    });
}
for (const event of ['pointerdown', 'keydown', 'focusin']) {
    test(`late load does not interrupt recovery after ${event}`, () => {
        const page = setup(); page.near(); page.timeout(); page.retry().fire(event);
        const message = page.status().textContent; page.frame().fire('load');
        assert.equal(page.state(), 'unavailable'); assert.equal(page.frame().hidden, true);
        assert.equal(page.status().textContent, message);
    });
}
test('retry replaces its browsing context and rejects old load/error/timer callbacks', () => {
    const page = setup(); page.near(); const oldFrame = page.frame();
    const oldTimeout = [...page.timers.values()][0].callback;
    oldFrame.fire('error'); page.retry().fire('click'); const current = page.frame();
    assert.notEqual(current, oldFrame); assert.equal(oldFrame.parentElement, null); assert.equal(current.id, oldFrame.id);
    assert.equal(page.requests.length, 2); assert.equal(page.requests[1].loading, 'eager');
    oldFrame.fire('load'); oldFrame.fire('error'); oldTimeout();
    assert.equal(page.state(), 'loading'); assert.equal(current.hidden, true); assert.equal(page.timers.size, 1);
    current.fire('load'); assert.equal(page.state(), 'loaded');
});
test('hide/show preserves the frame and entered data without requesting again', () => {
    const page = setup(); page.near(); const frame = page.frame(); frame.fire('load');
    frame.enteredEmail = 'retained@example.test'; page.toggle().fire('click');
    assert.equal(page.state(), 'hidden'); assert.equal(frame.hidden, true);
    assert.equal(page.toggle().textContent, 'Show form'); assert.equal(page.toggle().getAttribute('aria-expanded'), 'false');
    frame.fire('load'); frame.fire('error'); assert.equal(page.state(), 'hidden');
    page.toggle().fire('click'); assert.equal(page.state(), 'loaded'); assert.equal(frame.hidden, false);
    assert.equal(page.frame(), frame); assert.equal(frame.enteredEmail, 'retained@example.test'); assert.equal(page.requests.length, 1);
});
test('cleared timeouts and later provider errors cannot collapse an active form', () => {
    const page = setup(); page.near(); const staleTimeout = [...page.timers.values()][0].callback;
    page.frame().fire('load'); page.frame().enteredEmail = 'retained@example.test'; staleTimeout(); page.frame().fire('error');
    assert.equal(page.state(), 'loaded'); assert.equal(page.frame().hidden, false);
    assert.equal(page.frame().enteredEmail, 'retained@example.test');
});
test('multiple newsletters activate independently with separate state and controls', () => {
    const page = setup(2); page.near(0);
    assert.equal(page.state(0), 'loading'); assert.equal(page.state(1), 'hidden'); assert.equal(page.requests.length, 1);
    assert.equal(page.observer.disconnected, undefined); page.frame(0).fire('load'); page.near(1); page.frame(1).fire('error');
    assert.equal(page.state(0), 'loaded'); assert.equal(page.state(1), 'unavailable');
    assert.notEqual(page.frame(0).id, page.frame(1).id); assert.equal(page.requests.length, 2);
    assert.equal(page.observer.disconnected, true);
});
test('old browsers load eagerly and retain recovery controls', () => {
    const page = setup(1, false); assert.equal(page.observer, undefined); assert.equal(page.requests.length, 1);
    assert.equal(page.requests[0].loading, 'eager'); assert.equal(page.state(), 'loading');
    page.frame().fire('error'); assert.equal(page.state(), 'unavailable'); assert.equal(page.retry().hidden, false);
});
test('pages without newsletters create no observer or timers', () => {
    const page = setup(0); assert.equal(page.observer, undefined); assert.equal(page.requests.length, 0); assert.equal(page.timers.size, 0);
});
test('all public newsletter pages retain deferred markup and a no-JS subscription link', () => {
    const root = new URL('../../thoughts/', import.meta.url);
    for (const name of readdirSync(root).filter(name => name.endsWith('.html'))) {
        const html = readFileSync(new URL(name, root), 'utf8');
        assert.ok(html.includes('data-newsletter-src='), `${name} must preserve the deferred newsletter`);
        assert.match(html, /<script src="newsletter\.js\?v=\d+(?:\.\d+)*" defer><\/script>/);
        assert.match(html, /<noscript><style>iframe\[data-newsletter-src\] \{ display: none; \}<\/style><\/noscript>/);
        assert.match(html, /<a[^>]+href="https:\/\/williswee\.substack\.com\/subscribe"/);
        assert.doesNotMatch(html, /<iframe\s+src="https:\/\/williswee\.substack\.com\/embed/);
        assert.match(html, /<iframe data-newsletter-src="https:\/\/williswee\.substack\.com\/embed"[^>]+aria-hidden="true" tabindex="-1"/);
    }
});
