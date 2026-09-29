"use strict";
sap.ui.define([], function () {
    async function textError(response) {
        const text = await response.text();
        let message = text || response.statusText;
        try {
            const body = JSON.parse(text);
            if (body.error?.message)
                message = body.error.message;
        }
        catch {
            message = text || response.statusText;
        }
        return new Error(message);
    }
    async function read(url) {
        const response = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!response.ok)
            throw await textError(response);
        return response.json();
    }
    async function action(url, body) {
        const response = await fetch(url, {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok)
            throw await textError(response);
        return response.json();
    }
    function unpack(payload) {
        if (payload && typeof payload === 'object' && 'value' in payload) {
            const value = payload.value;
            if (typeof value === 'string') {
                try {
                    return JSON.parse(value);
                }
                catch {
                    return value;
                }
            }
            return value;
        }
        return payload;
    }
    return { read, action, unpack };
});
