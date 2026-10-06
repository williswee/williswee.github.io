import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const root = new URL('../../', import.meta.url);
const source = readFileSync(new URL('home-word-help.js', root), 'utf8');
const html = readFileSync(new URL('index.html', root), 'utf8');
const explanation = 'Lah — a Singlish word added to the end of a sentence for emphasis, warmth, or certainty.';

function fixture({ missing } = {}) {
    const requestedIds = [];
    const focusCalls = [];
    class Target {
        constructor(id) {
            this.id = id;
            this.listeners = new Map();
            this.attributes = new Map();
            this.children = [];
            this.hidden = false;
            this.disabled = false;
        }
        addEventListener(type, handler) {
            const handlers = this.listeners.get(type) ?? [];
            handlers.push(handler);
            this.listeners.set(type, handlers);
        }
        setAttribute(name, value) { this.attributes.set(name, value); }
        getAttribute(name) { return this.attributes.get(name); }
        append(child) { child.parentElement = this; this.children.push(child); }
        contains(target) { return target === this || this.children.some(child => child.contains(target)); }
        focus() { focusCalls.push(this.id); document.activeElement = this; }
        emit(type, values = {}) {
            const event = { type, target: this, defaultPrevented: false,
                preventDefault() { this.defaultPrevented = true; }, ...values };
            for (const handler of this.listeners.get(type) ?? []) handler(event);
            return event;
        }
    }
    const help = new Target('lah-help');
    const trigger = new Target('lah-trigger');
    const definition = new Target('lah-definition');
    const text = new Target('definition-text');
    const outside = new Target('unrelated-control');
    trigger.disabled = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-describedby', 'lah-definition');
    definition.hidden = true;
    definition.append(text);
    help.append(trigger);
    help.append(definition);
    const elements = new Map([help, trigger, definition].map(element => [element.id, element]));
    if (missing) elements.delete(missing);
    const document = new Target('document');
    document.activeElement = outside;
    document.getElementById = id => { requestedIds.push(id); return elements.get(id) ?? null; };
    const window = new Target('window');
    vm.runInNewContext(source, { document, window });
    return {
        help, trigger, definition, text, outside, document, window, requestedIds, focusCalls,
        enter: (pointerType = 'mouse') => help.emit('pointerenter', { pointerType }),
        leave: () => help.emit('pointerleave', { pointerType: 'mouse', relatedTarget: outside }),
        focus: () => { document.activeElement = trigger; help.emit('focusin', { target: trigger }); },
        blur: () => { document.activeElement = outside; help.emit('focusout', { target: trigger, relatedTarget: outside }); },
        click: () => trigger.emit('click'),
        key: key => document.emit('keydown', { key, target: document.activeElement }),
        pointerdown: target => document.emit('pointerdown', { target }),
    };
}

function assertOpen(f, open) {
    assert.equal(f.definition.hidden, !open, 'definition visibility');
    assert.equal(f.trigger.getAttribute('aria-expanded'), String(open), 'expanded state agrees with visibility');
    assert.equal(f.trigger.getAttribute('aria-describedby'), 'lah-definition');
}

test('Connect renders the exact greeting with a disabled native trigger, associated explanation, and no-script fallback', () => {
    const terminal = html.match(/<section\b[^>]*id="terminal"[^>]*>([\s\S]*?)<\/section>/)?.[1];
    assert.ok(terminal);
    const greeting = terminal.match(/<p class="connect-greeting">([\s\S]*?)<\/p>/)?.[1];
    assert.ok(greeting);
    assert.match(greeting, /<span\b(?=[^>]*class="word-help")(?=[^>]*id="lah-help")[^>]*>/);
    const trigger = greeting.match(/<button\b[^>]*id="lah-trigger"[^>]*>lah<\/button>/)?.[0];
    assert.ok(trigger, 'lah remains the native button label');
    for (const attr of ['type="button"', 'aria-describedby="lah-definition"', 'aria-expanded="false"']) assert.ok(trigger.includes(attr));
    assert.match(trigger, /\sdisabled(?:\s|>)/);
    const definition = greeting.match(/<span\b[^>]*id="lah-definition"[^>]*>([\s\S]*?)<\/span>/);
    assert.ok(definition);
    assert.equal(definition[1], explanation);
    assert.match(definition[0], /role="tooltip"/);
    assert.match(definition[0], /\shidden(?:\s|>)/);
    assert.equal(greeting.replace(definition[0], '').replace(/<[^>]+>/g, ''), 'Come say hello lah.');
    const fallback = terminal.match(/<noscript>\s*<p class="word-help-fallback">([^<]+)<\/p>\s*<\/noscript>/)?.[1];
    assert.equal(fallback, explanation);
    for (const id of ['lah-help', 'lah-trigger', 'lah-definition']) {
        assert.equal((html.match(new RegExp(`\\bid="${id}"`, 'g')) ?? []).length, 1, `one ${id}`);
    }
    const scripts = html.match(/<script\b[^>]*src="home-word-help\.js(?:\?[^\"]*)?"[^>]*><\/script>/g) ?? [];
    assert.equal(scripts.length, 1);
    assert.match(scripts[0], /\sdefer(?:\s|>)/);
});

test('enhancement initializes only its three IDs and enables the closed trigger', () => {
    const f = fixture();
    assert.deepEqual(f.requestedIds, ['lah-help', 'lah-trigger', 'lah-definition']);
    assert.equal(f.trigger.disabled, false);
    assertOpen(f, false);
    assert.equal(f.document.activeElement, f.outside);
    assert.deepEqual(f.focusCalls, []);
});

for (const missing of ['lah-help', 'lah-trigger', 'lah-definition']) {
    test(`missing ${missing} leaves the page and disabled trigger alone`, () => {
        const f = fixture({ missing });
        assert.equal(f.trigger.disabled, true);
        assertOpen(f, false);
        for (const target of [f.help, f.trigger, f.document, f.window]) assert.equal(target.listeners.size, 0);
        assert.deepEqual(f.focusCalls, []);
    });
}

test('mouse hover opens the explanation and leaving the whole wrapper closes it', () => {
    const f = fixture();
    f.enter();
    assertOpen(f, true);
    f.leave();
    assertOpen(f, false);
});

test('the pointer can move from the trigger into the tooltip and interact with its text without dismissal', () => {
    const f = fixture();
    f.enter();
    // pointerleave does not bubble. Moving between descendants does not leave their common wrapper.
    f.trigger.emit('pointerleave', { relatedTarget: f.definition, pointerType: 'mouse' });
    f.pointerdown(f.text);
    assertOpen(f, true);
    f.leave();
    assertOpen(f, false);
});

test('keyboard focus opens the explanation and leaving the wrapper closes it', () => {
    const f = fixture();
    f.focus();
    assertOpen(f, true);
    f.blur();
    assertOpen(f, false);
    assert.equal(f.document.activeElement, f.outside);
    assert.deepEqual(f.focusCalls, []);
});

test('focus arriving before the first click pins the explanation instead of toggling it closed', () => {
    const f = fixture();
    f.enter();
    f.focus();
    assertOpen(f, true);
    f.click();
    assertOpen(f, true);
    f.leave();
    assertOpen(f, true);
    f.click();
    assertOpen(f, false);
    assert.equal(f.document.activeElement, f.trigger, 'a second click dismisses without blurring the button');
    f.click();
    assertOpen(f, true);
    f.blur();
    assertOpen(f, false);
    assert.deepEqual(f.focusCalls, []);
});

test('touch pointer entry does not synthesize hover; first tap pins and second tap dismisses', () => {
    const f = fixture();
    f.enter('touch');
    assertOpen(f, false);
    f.click();
    assertOpen(f, true);
    f.help.emit('pointerleave', { pointerType: 'touch' });
    assertOpen(f, true);
    f.click();
    assertOpen(f, false);
    f.enter('touch');
    assertOpen(f, false);
});

test('Escape dismisses an open explanation while preserving focus and ordinary keys remain untouched', () => {
    const f = fixture();
    f.focus();
    f.click();
    assert.equal(f.key('ArrowRight').defaultPrevented, false);
    assertOpen(f, true);
    assert.equal(f.key('Escape').defaultPrevented, true);
    assertOpen(f, false);
    assert.equal(f.document.activeElement, f.trigger);
    assert.deepEqual(f.focusCalls, []);
    assert.equal(f.key('Escape').defaultPrevented, false, 'a closed tooltip does not consume Escape');
    f.click();
    assertOpen(f, true, 'a deliberate new activation may reopen the explanation');
});

test('outside pointerdown closes the tooltip without moving focus, while inside pointerdown keeps it open', () => {
    const f = fixture();
    f.focus();
    f.click();
    f.pointerdown(f.trigger);
    assertOpen(f, true);
    f.pointerdown(f.definition);
    assertOpen(f, true);
    f.pointerdown(f.outside);
    assertOpen(f, false);
    assert.equal(f.document.activeElement, f.trigger);
    assert.deepEqual(f.focusCalls, []);
});

for (const event of ['hashchange', 'pagehide']) {
    test(`${event} closes the explanation without changing focus`, () => {
        const f = fixture();
        f.focus();
        f.click();
        f.window.emit(event);
        assertOpen(f, false);
        assert.equal(f.document.activeElement, f.trigger);
        assert.deepEqual(f.focusCalls, []);
    });
}

test('a dismissed explanation stays closed until a new hover or focus interaction', () => {
    const f = fixture();
    f.enter();
    f.key('Escape');
    assertOpen(f, false);
    f.leave();
    assertOpen(f, false);
    f.enter();
    assertOpen(f, true);
    f.key('Escape');
    f.leave();
    f.focus();
    assertOpen(f, true);
});

test('Escape followed by Tab does not reopen the tooltip while the pointer remains over its trigger', () => {
    const f = fixture();
    f.enter();
    f.focus();
    assertOpen(f, true);
    f.key('Escape');
    assertOpen(f, false);
    // Tab moves focus outside while the stationary pointer still hovers over lah.
    f.blur();
    assertOpen(f, false);
    assert.equal(f.document.activeElement, f.outside);

    f.leave();
    assertOpen(f, false);
    f.enter();
    assertOpen(f, true);

    f.focus();
    f.key('Escape');
    f.blur();
    assertOpen(f, false);
    // Fresh keyboard focus can reopen it without requiring the pointer to move.
    f.focus();
    assertOpen(f, true);
    assert.equal(f.document.activeElement, f.trigger);
    assert.deepEqual(f.focusCalls, []);
});
