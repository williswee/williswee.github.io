import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../../coaching-contact.js', import.meta.url), 'utf8');

function setup({ missingFeature, missingForm = false, abortRejects = true } = {}) {
    const elements = new Map();
    const requests = [];
    const timers = new Map();
    const windowListeners = new Map();
    let activeElement;
    let nextTimer = 0;
    class Element {
        constructor(id) {
            this.id = id;
            this.listeners = new Map();
            this.attributes = new Map();
            this.dataset = {};
            this.hidden = false;
            this.disabled = false;
            this.textContent = '';
            this.value = '';
            this.maxLength = 120;
            this.validity = { valid: true, typeMismatch: false, tooLong: false };
            elements.set(id, this);
        }
        addEventListener(type, listener) { this.listeners.set(type, listener); }
        setAttribute(name, value) { this.attributes.set(name, String(value)); }
        removeAttribute(name) { this.attributes.delete(name); }
        getAttribute(name) { return this.attributes.get(name) ?? null; }
        focus() {
            if (!this.disabled && !(this.inFieldset && fieldset.disabled)) activeElement = this;
        }
    }
    const form = new Element('coaching-note-form');
    form.action = 'https://formspree.io/f/mdekydke';
    form.noValidate = false;
    const fieldset = new Element('coaching-note-fields');
    const status = new Element('coaching-note-status');
    status.hidden = true;
    const providerButton = new Element('coaching-note-provider');
    providerButton.hidden = true;
    form.submit = () => {
        form.nativePostCount = (form.nativePostCount || 0) + 1;
        form.nativePostFields = fieldset.disabled ? [] : Object.values(fields).map(field => field.input.value);
    };
    const submit = new Element('submit');
    submit.textContent = 'Send note';
    const fields = Object.fromEntries(['name', 'email', 'message'].map(name => {
        const input = new Element(`note-${name}`);
        input.inFieldset = true;
        input.name = name;
        const error = new Element(`note-${name}-error`);
        error.hidden = true;
        return [name, { input, error }];
    }));
    fields.email.input.maxLength = 254;
    fields.message.input.maxLength = 6000;
    fields.name.input.value = 'A founder';
    fields.email.input.value = 'founder@example.test';
    fields.message.input.value = 'I’m deciding how to focus the team.';
    form.querySelector = selector => selector === '[data-note-submit]' ? submit : null;
    form.reset = () => {
        form.resetCount = (form.resetCount || 0) + 1;
        Object.values(fields).forEach(field => { field.input.value = ''; });
    };
    const window = {
        addEventListener(type, listener) { windowListeners.set(type, listener); },
        AbortController,
        FormData: class {
            constructor() {
                this.values = new Map(fieldset.disabled ? [] : Object.entries(fields).map(([name, field]) => [name, field.input.value]));
                this.values.set('_subject', 'Coaching enquiry from williswee.com');
                this.values.set('_gotcha', '');
            }
            get(name) { return this.values.get(name); }
        },
        fetch(url, options) {
            return new Promise((resolve, reject) => {
                const request = {
                    url, options, reject,
                    resolve(body = { next: 'https://formspree.io/thanks' }, settings = {}) {
                        resolve({ ok: true, redirected: false, json: async () => body, ...settings });
                    }
                };
                requests.push(request);
                if (abortRejects) options.signal.addEventListener('abort', () => reject(new Error('Aborted')));
            });
        },
        setTimeout(callback, delay) { const id = ++nextTimer; timers.set(id, { callback, delay }); return id; },
        clearTimeout(id) { timers.delete(id); }
    };
    if (missingFeature) delete window[missingFeature];
    const document = { getElementById: id => missingForm && id === form.id ? null : elements.get(id) };
    vm.runInNewContext(source, { document, window });
    return {
        form, fieldset, status, button: submit, providerButton, fields, requests, timers,
        get focused() { return activeElement; },
        async submit() {
            const event = { prevented: false, preventDefault() { this.prevented = true; } };
            await form.listeners.get('submit')?.(event);
            return event;
        },
        input(name, value) {
            fields[name].input.value = value;
            fields[name].input.listeners.get('input')?.();
        },
        continueWithProvider() { providerButton.listeners.get('click')(); },
        returnToPage() { windowListeners.get('pageshow')(); },
        timeout() { [...timers.values()][0].callback(); }
    };
}

for (const missingFeature of ['fetch', 'FormData', 'AbortController']) {
    test(`native POST and validation remain available without ${missingFeature}`, async () => {
        const page = setup({ missingFeature });
        assert.equal(page.form.noValidate, false);
        assert.equal(page.form.listeners.has('submit'), false);
        assert.equal((await page.submit()).prevented, false);
        assert.equal(page.requests.length, 0);
    });
}

test('a page without the contact form is left alone', () => {
    assert.doesNotThrow(() => setup({ missingForm: true }));
});

test('blank and whitespace-only required fields show accessible errors without submitting', async () => {
    const page = setup();
    page.input('name', '   ');
    page.input('email', '');
    page.input('message', '\n\t');
    assert.equal((await page.submit()).prevented, true);
    assert.equal(page.requests.length, 0);
    for (const field of Object.values(page.fields)) {
        assert.equal(field.input.getAttribute('aria-invalid'), 'true');
        assert.equal(field.error.hidden, false);
        assert.ok(field.error.textContent.length);
    }
    assert.equal(page.focused, page.fields.name.input);
    assert.equal(page.status.dataset.state, 'error');
    page.input('name', 'A founder');
    assert.equal(page.fields.name.input.getAttribute('aria-invalid'), null);
    assert.equal(page.fields.name.error.hidden, true);
});

test('browser email validity and maximum length reject invalid entries', async () => {
    const page = setup();
    page.fields.email.input.validity = { valid: false, typeMismatch: true };
    page.input('message', 'x'.repeat(6001));
    await page.submit();
    assert.equal(page.requests.length, 0);
    assert.match(page.fields.email.error.textContent, /valid email/);
    assert.match(page.fields.message.error.textContent, /6,000/);
    assert.equal(page.focused, page.fields.email.input);
});

test('one request captures fields before disabling controls and confirms provider success', async () => {
    const page = setup();
    const pending = page.submit();
    assert.equal(page.form.noValidate, true);
    assert.equal(page.requests.length, 1);
    const request = page.requests[0];
    assert.equal(request.url, 'https://formspree.io/f/mdekydke');
    assert.equal(request.options.method, 'POST');
    assert.equal(request.options.headers.Accept, 'application/json');
    assert.equal(request.options.credentials, 'omit');
    assert.equal(request.options.body.get('email'), 'founder@example.test');
    assert.equal(request.options.body.get('message'), 'I’m deciding how to focus the team.');
    assert.equal(request.options.body.get('_gotcha'), '');
    assert.equal(page.fieldset.disabled, true);
    assert.equal(page.button.disabled, true);
    assert.equal(page.form.getAttribute('aria-busy'), 'true');
    assert.equal(page.status.dataset.state, 'sending');
    await page.submit();
    assert.equal(page.requests.length, 1);
    request.resolve();
    await pending;
    assert.equal(page.form.resetCount, 1);
    assert.equal(page.fieldset.hidden, true);
    assert.equal(page.status.dataset.state, 'success');
    assert.equal(page.status.textContent, 'Thanks for your note. I’ll reply by email within 3 business days.');
    assert.equal(page.focused, page.status);
    assert.equal(page.timers.size, 0);
    assert.equal(page.form.getAttribute('aria-busy'), null);
    await page.submit();
    assert.equal(page.requests.length, 1);
});

test('provider field errors retain the note and focus an enabled field with safe text', async () => {
    const page = setup();
    const pending = page.submit();
    const providerMessage = '<strong>Please use another email address.</strong>';
    page.requests[0].resolve({ errors: [{ field: 'email', message: providerMessage }] }, { ok: false });
    await pending;
    assert.equal(page.fields.email.error.textContent, providerMessage);
    assert.equal(page.fields.email.input.getAttribute('aria-invalid'), 'true');
    assert.equal(page.focused, page.fields.email.input);
    assert.equal(page.fieldset.disabled, false);
    assert.equal(page.fieldset.hidden, false);
    assert.equal(page.button.disabled, false);
    assert.equal(page.button.textContent, 'Send note');
    assert.equal(page.form.resetCount, undefined);
    assert.equal(page.fields.message.input.value, 'I’m deciding how to focus the team.');
    assert.equal(page.timers.size, 0);
});

for (const body of [{ error: 'Form not active.' }, { errors: 'Form not active.' }, { errors: ['Form not active.'] }]) {
    test(`string provider error is recoverable (${JSON.stringify(body)})`, async () => {
        const page = setup();
        const pending = page.submit();
        page.requests[0].resolve(body, { ok: false });
        await pending;
        assert.match(page.status.textContent, /^Your note wasn’t sent. Form not active\./);
        assert.equal(page.providerButton.hidden, false);
        assert.equal(page.focused, page.status);
        assert.equal(page.requests.length, 1);
        assert.equal(page.fieldset.hidden, false);
        const retry = page.submit();
        assert.equal(page.requests.length, 2);
        page.requests[1].resolve();
        await retry;
        assert.equal(page.status.dataset.state, 'success');
    });
}

for (const failure of ['network', 'invalid JSON', 'unknown JSON', 'HTTP failure', 'redirect']) {
    test(`${failure} never claims delivery or clears the note`, async () => {
        const page = setup();
        const pending = page.submit();
        const request = page.requests[0];
        if (failure === 'network') request.reject(new Error('Offline'));
        if (failure === 'invalid JSON') request.resolve(null, { json: async () => { throw new SyntaxError(); } });
        if (failure === 'unknown JSON') request.resolve({ received: true });
        if (failure === 'HTTP failure') request.resolve({ next: 'https://formspree.io/thanks' }, { ok: false });
        if (failure === 'redirect') request.resolve({ next: 'https://formspree.io/thanks' }, { redirected: true });
        await pending;
        assert.match(page.status.textContent, /couldn't confirm whether your note was sent/);
        assert.equal(page.status.dataset.state, 'error');
        assert.equal(page.fields.message.input.value, 'I’m deciding how to focus the team.');
        assert.equal(page.fieldset.hidden, false);
        assert.equal(page.fieldset.disabled, false);
        assert.equal(page.focused, page.status);
        assert.equal(page.requests.length, 1);
        assert.equal(page.timers.size, 0);
        assert.equal(page.providerButton.hidden, false);
    });
}

test('a slow request aborts after 20 seconds without an automatic retry or false success', async () => {
    const page = setup();
    const pending = page.submit();
    assert.equal([...page.timers.values()][0].delay, 20000);
    page.timeout();
    await pending;
    assert.equal(page.requests[0].options.signal.aborted, true);
    assert.equal(page.requests.length, 1);
    assert.match(page.status.textContent, /couldn't confirm whether your note was sent/);
    assert.equal(page.fieldset.disabled, false);
    assert.equal(page.fields.message.input.value, 'I’m deciding how to focus the team.');
});

test('a response racing the timeout cannot report success after cancellation', async () => {
    const page = setup({ abortRejects: false });
    const pending = page.submit();
    page.timeout();
    page.requests[0].resolve();
    await pending;
    assert.equal(page.form.resetCount, undefined);
    assert.equal(page.fieldset.hidden, false);
    assert.match(page.status.textContent, /couldn't confirm whether your note was sent/);
});

test('an explicit successful provider flag also confirms delivery', async () => {
    const page = setup();
    const pending = page.submit();
    page.requests[0].resolve({ ok: true });
    await pending;
    assert.equal(page.status.dataset.state, 'success');
    assert.equal(page.providerButton.hidden, true);
});

test('hosted fallback requires an explicit click and sends enabled fields exactly once', async () => {
    const page = setup();
    const pending = page.submit();
    page.requests[0].resolve(null, { json: async () => { throw new SyntaxError(); } });
    await pending;
    assert.equal(page.form.nativePostCount, undefined);
    assert.equal(page.providerButton.hidden, false);
    page.continueWithProvider();
    assert.equal(page.form.nativePostCount, 1);
    assert.deepEqual(page.form.nativePostFields, ['A founder', 'founder@example.test', 'I’m deciding how to focus the team.']);
    assert.equal(page.form.noValidate, false);
    assert.equal(page.fieldset.disabled, false);
    assert.equal(page.providerButton.disabled, true);
    page.continueWithProvider();
    await page.submit();
    assert.equal(page.form.nativePostCount, 1);
    assert.equal(page.requests.length, 1);
    page.returnToPage();
    assert.equal(page.form.noValidate, true);
    assert.equal(page.providerButton.disabled, false);
    assert.equal(page.button.disabled, false);
    assert.match(page.status.textContent, /don’t need to send it again/);
});

test('hosted fallback revalidates edited fields before posting', async () => {
    const page = setup();
    const pending = page.submit();
    page.requests[0].reject(new Error('Offline'));
    await pending;
    page.input('message', '  ');
    page.continueWithProvider();
    assert.equal(page.form.nativePostCount, undefined);
    assert.equal(page.fields.message.input.getAttribute('aria-invalid'), 'true');
    assert.equal(page.focused, page.fields.message.input);
    assert.equal(page.form.noValidate, true);
});
