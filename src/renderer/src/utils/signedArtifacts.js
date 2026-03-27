function sortObjectKeys(value) {
    if (Array.isArray(value)) {
        return value.map((entry) => sortObjectKeys(entry));
    }
    if (value && typeof value === 'object') {
        const sorted = {};
        Object.keys(value).sort().forEach((key) => {
            sorted[key] = sortObjectKeys(value[key]);
        });
        return sorted;
    }
    return value;
}

export function stableStringify(value) {
    return JSON.stringify(sortObjectKeys(value));
}

function base64Encode(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let index = 0; index < bytes.length; index += 1) {
        binary += String.fromCharCode(bytes[index]);
    }
    return window.btoa(binary);
}

function base64Decode(value) {
    const binary = window.atob(String(value || ''));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes.buffer;
}

function derToRawEcdsaSignature(signatureBuffer, partLength = 32) {
    const bytes = new Uint8Array(signatureBuffer);
    if (bytes.length < 8 || bytes[0] !== 0x30) {
        throw new Error('Signature is not DER encoded.');
    }
    let offset = 1;
    let seqLength = bytes[offset];
    offset += 1;
    if (seqLength & 0x80) {
        const lengthBytes = seqLength & 0x7f;
        seqLength = 0;
        for (let i = 0; i < lengthBytes; i += 1) {
            seqLength = (seqLength << 8) | bytes[offset + i];
        }
        offset += lengthBytes;
    }
    const sequenceEnd = offset + seqLength;
    const readInteger = () => {
        if (bytes[offset] !== 0x02) {
            throw new Error('Invalid DER integer marker.');
        }
        offset += 1;
        let intLength = bytes[offset];
        offset += 1;
        if (intLength & 0x80) {
            const lengthBytes = intLength & 0x7f;
            intLength = 0;
            for (let i = 0; i < lengthBytes; i += 1) {
                intLength = (intLength << 8) | bytes[offset + i];
            }
            offset += lengthBytes;
        }
        const value = bytes.slice(offset, offset + intLength);
        offset += intLength;
        let start = 0;
        while (start < value.length - 1 && value[start] === 0) {
            start += 1;
        }
        return value.slice(start);
    };
    const r = readInteger();
    const s = readInteger();
    if (offset > sequenceEnd) {
        throw new Error('DER signature length mismatch.');
    }
    const raw = new Uint8Array(partLength * 2);
    raw.set(r.slice(-partLength), partLength - Math.min(partLength, r.length));
    raw.set(s.slice(-partLength), (partLength * 2) - Math.min(partLength, s.length));
    return raw.buffer;
}

function toPem(label, base64) {
    const chunks = String(base64 || '').match(/.{1,64}/g) || [];
    return `-----BEGIN ${label}-----\n${chunks.join('\n')}\n-----END ${label}-----`;
}

function fromPem(pem) {
    return String(pem || '')
        .replace(/-----BEGIN [^-]+-----/g, '')
        .replace(/-----END [^-]+-----/g, '')
        .replace(/\s+/g, '')
        .trim();
}

async function exportPublicKeyPem(publicKey) {
    const spki = await window.crypto.subtle.exportKey('spki', publicKey);
    return toPem('PUBLIC KEY', base64Encode(spki));
}

async function exportPrivateKeyPem(privateKey) {
    const pkcs8 = await window.crypto.subtle.exportKey('pkcs8', privateKey);
    return toPem('PRIVATE KEY', base64Encode(pkcs8));
}

async function importPublicKeyPem(pem) {
    const spki = base64Decode(fromPem(pem));
    return window.crypto.subtle.importKey(
        'spki',
        spki,
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['verify'],
    );
}

async function importPrivateKeyPem(pem) {
    const pkcs8 = base64Decode(fromPem(pem));
    return window.crypto.subtle.importKey(
        'pkcs8',
        pkcs8,
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['sign'],
    );
}

export async function getOrCreateSigningKeyPair(storagePrefix = 'neuralshell_signing_key_v1') {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error('WebCrypto is unavailable.');
    }
    const publicKeyStore = `${storagePrefix}_public`;
    const privateKeyStore = `${storagePrefix}_private`;
    const cachedPublic = window.localStorage ? window.localStorage.getItem(publicKeyStore) : '';
    const cachedPrivate = window.localStorage ? window.localStorage.getItem(privateKeyStore) : '';
    if (cachedPublic && cachedPrivate) {
        return {
            publicKeyPem: cachedPublic,
            privateKeyPem: cachedPrivate,
        };
    }
    const pair = await window.crypto.subtle.generateKey(
        {
            name: 'ECDSA',
            namedCurve: 'P-256',
        },
        true,
        ['sign', 'verify'],
    );
    const publicKeyPem = await exportPublicKeyPem(pair.publicKey);
    const privateKeyPem = await exportPrivateKeyPem(pair.privateKey);
    if (window.localStorage) {
        window.localStorage.setItem(publicKeyStore, publicKeyPem);
        window.localStorage.setItem(privateKeyStore, privateKeyPem);
    }
    return { publicKeyPem, privateKeyPem };
}

export async function signArtifactPayload(payload, privateKeyPem) {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error('WebCrypto is unavailable.');
    }
    const privateKey = await importPrivateKeyPem(privateKeyPem);
    const encoder = new window.TextEncoder();
    const normalized = stableStringify(payload);
    const signature = await window.crypto.subtle.sign(
        {
            name: 'ECDSA',
            hash: { name: 'SHA-256' },
        },
        privateKey,
        encoder.encode(normalized),
    );
    return base64Encode(signature);
}

export async function verifyArtifactSignature(payload, signatureBase64, publicKeyPem) {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error('WebCrypto is unavailable.');
    }
    const publicKey = await importPublicKeyPem(publicKeyPem);
    const encoder = new window.TextEncoder();
    const normalized = stableStringify(payload);
    const signatureBuffer = base64Decode(signatureBase64);
    const verified = await window.crypto.subtle.verify(
        {
            name: 'ECDSA',
            hash: { name: 'SHA-256' },
        },
        publicKey,
        signatureBuffer,
        encoder.encode(normalized),
    );
    if (verified) return true;
    try {
        const rawSignature = derToRawEcdsaSignature(signatureBuffer, 32);
        return window.crypto.subtle.verify(
            {
                name: 'ECDSA',
                hash: { name: 'SHA-256' },
            },
            publicKey,
            rawSignature,
            encoder.encode(normalized),
        );
    } catch {
        return false;
    }
}

export async function fingerprintPublicKey(publicKeyPem) {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error('WebCrypto is unavailable.');
    }
    const bytes = base64Decode(fromPem(publicKeyPem));
    const digest = await window.crypto.subtle.digest('SHA-256', bytes);
    const hex = Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, '0')).join('');
    return `sha256:${hex}`;
}
