function bytesToBase64Url(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value: string): Uint8Array {
    const padded = String(value || '').replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
    const binary = atob(padded);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        out[i] = binary.charCodeAt(i);
    }
    return out;
}

function hex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

export async function createShareEnvelope(payload: any) {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error('WebCrypto is unavailable.');
    }
    const text = JSON.stringify(payload || {});
    const plain = new TextEncoder().encode(text);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const keyRaw = window.crypto.getRandomValues(new Uint8Array(32));
    const key = await window.crypto.subtle.importKey('raw', keyRaw, { name: 'AES-GCM' }, false, ['encrypt']);
    const cipherBuffer = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);
    const cipher = new Uint8Array(cipherBuffer);
    const digest = new Uint8Array(await window.crypto.subtle.digest('SHA-256', cipher));
    const hash = hex(digest).slice(0, 20);
    const envelope = {
        v: 1,
        iv: bytesToBase64Url(iv),
        c: bytesToBase64Url(cipher),
        k: bytesToBase64Url(keyRaw),
    };
    const fragment = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(envelope)));
    return {
        hash,
        fragment,
        envelope,
    };
}

export async function decodeShareEnvelope(fragment: string) {
    if (!fragment) {
        throw new Error('Missing share fragment.');
    }
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error('WebCrypto is unavailable.');
    }
    const payloadBytes = base64UrlToBytes(fragment);
    const payloadText = new TextDecoder().decode(payloadBytes);
    const envelope = JSON.parse(payloadText);
    return decryptEnvelopeObject(envelope);
}

export async function decryptEnvelopeObject(envelope: { v: number; iv: string; c: string; k: string }) {
    if (!envelope || typeof envelope !== 'object') {
        throw new Error('Invalid share envelope.');
    }
    if (Number(envelope.v) !== 1) {
        throw new Error(`Unsupported share envelope version: ${envelope.v}`);
    }
    const iv = base64UrlToBytes(envelope.iv);
    const cipher = base64UrlToBytes(envelope.c);
    const keyRaw = base64UrlToBytes(envelope.k);
    const key = await window.crypto.subtle.importKey('raw', keyRaw, { name: 'AES-GCM' }, false, ['decrypt']);
    const plainBuffer = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    const plainText = new TextDecoder().decode(new Uint8Array(plainBuffer));
    return JSON.parse(plainText);
}

export function buildShareUrl(hash: string, fragment: string): string {
    const safeHash = String(hash || '').trim() || 'local';
    const safeFragment = String(fragment || '').trim();
    const origin = typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null'
        ? window.location.origin
        : 'https://neuralshell.app';
    return `${origin}/share/${safeHash}${safeFragment ? `#${safeFragment}` : ''}`;
}

export async function loadStaticShareEnvelope(hash: string) {
    const safeHash = String(hash || '').trim();
    if (!safeHash) throw new Error('Missing share hash.');
    const attempts = [
        `/static/share_blobs/${safeHash}.json`,
        `/share_blobs/${safeHash}.json`,
        `./static/share_blobs/${safeHash}.json`,
    ];
    let lastError = null;
    for (const path of attempts) {
        try {
            const response = await fetch(path, { method: 'GET' });
            if (!response.ok) continue;
            return await response.json();
        } catch (err) {
            lastError = err;
        }
    }
    if (lastError) throw lastError;
    throw new Error('Share blob not found.');
}
