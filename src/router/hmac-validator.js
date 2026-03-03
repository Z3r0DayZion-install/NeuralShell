import crypto from 'crypto';

// HMAC request signing and validation
export class HMACValidator {
  constructor(secret) {
    this.secret = String(secret);
  }

  signRequest(payload, timestamp = Date.now()) {
    const timestampMs = Math.floor(timestamp / 1000); // Second precision to prevent replay
    const message = `${JSON.stringify(payload)}.${timestampMs}`;
    const hmac = crypto.createHmac('sha256', this.secret);
    hmac.update(message);
    return {
      signature: hmac.digest('hex'),
      timestamp: timestampMs,
      message
    };
  }

  validateRequest(payload, signature, timestamp, replayWindowSec = 300) {
    // Verify timestamp is recent
    const now = Math.floor(Date.now() / 1000);
    const age = now - Number(timestamp);

    if (age < 0) {
      return { valid: false, reason: 'timestamp_in_future' };
    }

    if (age > replayWindowSec) {
      return { valid: false, reason: 'timestamp_too_old', age };
    }

    // Compute expected signature
    const message = `${JSON.stringify(payload)}.${timestamp}`;
    const hmac = crypto.createHmac('sha256', this.secret);
    hmac.update(message);
    const expectedSignature = hmac.digest('hex');

    // Constant-time comparison
    const providedBuf = Buffer.from(String(signature));
    const expectedBuf = Buffer.from(expectedSignature);

    let valid = false;
    try {
      valid = crypto.timingSafeEqual(providedBuf, expectedBuf);
    } catch {
      valid = false;
    }

    return {
      valid,
      reason: valid ? 'valid' : 'signature_mismatch',
      age
    };
  }

  createSignedRequest(payload, method = 'POST', path = '/prompt', baseSecret = null) {
    const secret = baseSecret || this.secret;
    const timestamp = Math.floor(Date.now() / 1000);
    const message = `${method}.${path}.${JSON.stringify(payload)}.${timestamp}`;

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(message);

    return {
      payload,
      headers: {
        'X-Signature': hmac.digest('hex'),
        'X-Timestamp': String(timestamp)
      }
    };
  }
}

export function signPayload(payload, secret) {
  const hmac = crypto.createHmac('sha256', String(secret));
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

export function validateSignature(payload, providedSignature, secret) {
  const expected = signPayload(payload, secret);
  const providedBuf = Buffer.from(String(providedSignature));
  const expectedBuf = Buffer.from(expected);

  try {
    return crypto.timingSafeEqual(providedBuf, expectedBuf);
  } catch {
    return false;
  }
}
