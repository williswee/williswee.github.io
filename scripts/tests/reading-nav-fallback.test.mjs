import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../../reading-nav.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../../thoughts/reading-room.css', import.meta.url), 'utf8');
const fallbackRule = selector => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return styles.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`))?.[1] || '';
};

test('navigation without enhancement is in flow and wraps instead of clipping', () => {
    const header = fallbackRule('html:not(.reading-nav-enhanced) .reading-hud');
    assert.match(header, /position:\s*relative;/);
    assert.match(header, /height:\s*auto;/);
    assert.match(header, /flex-wrap:\s*wrap;/);
    const nav = fallbackRule('html:not(.reading-nav-enhanced) .reading-nav');
    assert.match(nav, /flex:\s*1 1 100%;/);
    assert.match(nav, /flex-wrap:\s*wrap;/);
    assert.match(nav, /height:\s*auto;/);
    assert.match(nav, /overflow:\s*visible;/);
    const link = fallbackRule('html:not(.reading-nav-enhanced) .reading-nav a');
    assert.match(link, /min-width:\s*44px;/);
    assert.match(link, /min-height:\s*44px;/);
});

test('fallback overrides narrow-screen fixed-height navigation rules', () => {
    assert.ok(styles.indexOf('html:not(.reading-nav-enhanced) .reading-hud') >
        styles.indexOf('@media (max-width: 380px)'));
});

test('normal visuals activate before body parsing, after delegated keyboard enhancement', () => {
    const events = [];
    const document = {
        readyState: 'loading',
        body: null,
        documentElement: { classList: { add: name => events.push(`class:${name}`) } },
        addEventListener: type => events.push(`listener:${type}`)
    };
    vm.runInNewContext(source, { document });
    assert.deepEqual(events, ['listener:focusin', 'class:reading-nav-enhanced']);
    assert.doesNotMatch(source, /DOMContentLoaded|querySelectorAll/);
});
