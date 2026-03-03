const crypto = require('crypto');

/**
 * NeuralShell Crypto Broker — Centralized Cryptographic Actions
 */

class CryptoBroker {
  async generateKeyPair(payload) {
    const { algorithm = 'ec', options = { namedCurve: 'prime256v1' } } = payload;
    const { privateKey, publicKey } = crypto.generateKeyPairSync(algorithm, {
      ...options,
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' }
    });
    return { privateKey, publicKey };
  }

  async sign(payload) {
    const { algorithm = 'sha256', data, privateKey } = payload;
    const buf = Buffer.from(data, 'utf8');
    return crypto.sign(algorithm, buf, privateKey).toString('base64');
  }

  async verify(payload) {
    const { algorithm = 'sha256', data, signature, publicKey } = payload;
    const buf = Buffer.from(data, 'utf8');
    const sig = Buffer.from(signature, 'base64');
    return crypto.verify(algorithm, buf, publicKey, sig);
  }

  async hash(payload) {
    const { algorithm = 'sha256', data } = payload;
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  async encrypt(payload) {
    const { algorithm = 'aes-256-gcm', key, iv, data } = payload;
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    const enc = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
    return {
      data: enc.toString('hex'),
      tag: cipher.getAuthTag().toString('hex')
    };
  }

  async decrypt(payload) {
    const { algorithm = 'aes-256-gcm', key, iv, data, tag } = payload;
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    const dec = Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]);
    return dec.toString('utf8');
  }

  async pbkdf2(payload) {
    const { password, salt, iterations = 100000, keylen = 32, digest = 'sha256' } = payload;
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey.toString('hex'));
      });
    });
  }
}

module.exports = new CryptoBroker();
