(() => {
    const form = document.getElementById('coaching-note-form');
    if (!form || typeof window.fetch !== 'function' || typeof window.FormData !== 'function' ||
        typeof window.AbortController !== 'function') return;

    const fieldset = document.getElementById('coaching-note-fields');
    const status = document.getElementById('coaching-note-status');
    const providerButton = document.getElementById('coaching-note-provider');
    const submit = form.querySelector('[data-note-submit]');
    const fields = ['name', 'email', 'message'].map(name => ({
        name,
        input: document.getElementById(`note-${name}`),
        error: document.getElementById(`note-${name}-error`)
    }));
    if (!fieldset || !status || !submit || !providerButton || fields.some(field => !field.input || !field.error)) return;

    let sending = false;
    let succeeded = false;
    let leavingForProvider = false;
    const idleLabel = submit.textContent;
    const uncertainMessage = "We couldn't confirm whether your note was sent. Your message is still in the form. Try again later, or finish sending it on Formspree.";

    function clearError(field) {
        field.input.removeAttribute('aria-invalid');
        field.error.textContent = '';
        field.error.hidden = true;
    }

    function showError(field, message) {
        field.input.setAttribute('aria-invalid', 'true');
        field.error.textContent = message;
        field.error.hidden = false;
    }

    function showStatus(message, state) {
        status.textContent = message;
        status.hidden = false;
        status.dataset.state = state;
        form.dataset.noteState = state;
    }

    function validate(field) {
        if (!field.input.value.trim()) {
            return { name: 'Please enter your name.', email: 'Please enter your email address.',
                message: 'Please share a few words about what you’re working through.' }[field.name];
        }
        if (field.input.validity.typeMismatch) return 'Please enter a valid email address.';
        if (field.input.validity.tooLong || field.input.value.length > field.input.maxLength) {
            return `Please keep this to ${field.input.maxLength.toLocaleString()} characters or fewer.`;
        }
        if (!field.input.validity.valid) return field.input.validationMessage;
        return '';
    }

    function providerErrors(data) {
        if (!data || typeof data !== 'object') return [];
        const errors = Array.isArray(data.errors) ? data.errors : [data.errors || data.error];
        return errors.map(error => {
            if (typeof error === 'string') return { message: error };
            if (error && typeof error.message === 'string') return error;
            return null;
        }).filter(error => error && error.message.trim());
    }

    function validateFields() {
        status.hidden = true;
        fields.forEach(clearError);
        const invalid = fields.filter(field => {
            const message = validate(field);
            if (message) showError(field, message);
            return Boolean(message);
        });
        if (invalid.length) {
            showStatus('Please check the highlighted fields.', 'error');
            invalid[0].input.focus();
            return false;
        }
        return true;
    }

    fields.forEach(field => field.input.addEventListener('input', () => clearError(field)));
    providerButton.addEventListener('click', () => {
        if (sending || succeeded || !validateFields()) return;
        sending = true;
        leavingForProvider = true;
        submit.disabled = true;
        providerButton.disabled = true;
        form.noValidate = false;
        form.setAttribute('aria-busy', 'true');
        showStatus('Opening Formspree to finish sending your note…', 'sending');
        // The visitor explicitly chose this POST. Keep fields enabled so their values travel with it.
        form.submit();
    });

    window.addEventListener('pageshow', () => {
        if (!leavingForProvider) return;
        leavingForProvider = false;
        sending = false;
        submit.disabled = false;
        providerButton.disabled = false;
        form.noValidate = true;
        form.removeAttribute('aria-busy');
        showStatus('You’re back on the form. If Formspree confirmed your note was sent, you don’t need to send it again.', 'notice');
    });

    // Keep native browser validation and POST intact unless enhancement can initialize.
    form.noValidate = true;
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (sending || succeeded || !validateFields()) return;

        providerButton.hidden = true;
        // Capture the form before disabling its fieldset: disabled fields are not submitted.
        const data = new window.FormData(form);
        const controller = new window.AbortController();
        sending = true;
        fieldset.disabled = true;
        submit.disabled = true;
        submit.textContent = 'Sending…';
        form.setAttribute('aria-busy', 'true');
        showStatus('Sending your note…', 'sending');
        const timeout = window.setTimeout(() => controller.abort(), 20000);
        let focusAfterSend = status;

        try {
            const response = await window.fetch(form.action, {
                method: 'POST',
                body: data,
                headers: { Accept: 'application/json' },
                credentials: 'omit',
                signal: controller.signal
            });
            if (response.redirected) throw new Error('Unexpected provider redirect');
            const result = await response.json();
            if (controller.signal.aborted) throw new Error('Request timed out');
            const errors = providerErrors(result);
            // Formspree's current client recognizes `next`; also accept its explicit success flag.
            if (response.ok && result && (typeof result.next === 'string' || result.ok === true) && !errors.length) {
                succeeded = true;
                form.reset();
                fieldset.hidden = true;
                showStatus('Thanks for your note. I’ll reply by email within 3 business days.', 'success');
            } else if (errors.length) {
                const general = [];
                let firstInvalid;
                errors.forEach(error => {
                    const field = fields.find(item => item.name === error.field);
                    const message = error.message.trim().slice(0, 500);
                    if (field) {
                        showError(field, message);
                        firstInvalid = firstInvalid || field;
                    } else general.push(message);
                });
                showStatus(general.length ? `Your note wasn’t sent. ${general.join(' ')}` :
                    'Your note wasn’t sent. Please check the highlighted fields.', 'error');
                if (firstInvalid) focusAfterSend = firstInvalid.input;
                else {
                    providerButton.hidden = false;
                    status.textContent += ' You can finish sending your note on Formspree.';
                }
            } else {
                showStatus(uncertainMessage, 'error');
                providerButton.hidden = false;
            }
        } catch {
            // A failed response or timeout can happen after receipt; never retry automatically.
            showStatus(uncertainMessage, 'error');
            providerButton.hidden = false;
        } finally {
            window.clearTimeout(timeout);
            sending = false;
            fieldset.disabled = false;
            submit.disabled = false;
            submit.textContent = idleLabel;
            form.removeAttribute('aria-busy');
            focusAfterSend.focus();
        }
    });
})();
