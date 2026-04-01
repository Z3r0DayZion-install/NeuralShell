const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function sortObjectKeys(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => sortObjectKeys(entry));
  }
  if (value && typeof value === "object") {
    const sorted = {};
    Object.keys(value).sort().forEach((key) => {
      sorted[key] = sortObjectKeys(value[key]);
    });
    return sorted;
  }
  return value;
}

function stableStringify(value) {
  return JSON.stringify(sortObjectKeys(value));
}

function rawToDerEcdsaSignature(signatureBytes) {
  const bytes = Buffer.from(signatureBytes || []);
  if (bytes.length !== 64) {
    throw new Error("ECDSA raw signature must be 64 bytes for P-256.");
  }
  const r = bytes.subarray(0, 32);
  const s = bytes.subarray(32, 64);
  const encodeInteger = (part) => {
    let value = Buffer.from(part);
    while (value.length > 1 && value[0] === 0x00) {
      value = value.subarray(1);
    }
    if (value[0] & 0x80) {
      value = Buffer.concat([Buffer.from([0x00]), value]);
    }
    return Buffer.concat([Buffer.from([0x02, value.length]), value]);
  };
  const derR = encodeInteger(r);
  const derS = encodeInteger(s);
  const body = Buffer.concat([derR, derS]);
  return Buffer.concat([Buffer.from([0x30, body.length]), body]);
}

function signPayload(payload, privateKeyPem) {
  const signer = crypto.createSign("SHA256");
  signer.update(stableStringify(payload));
  signer.end();
  return signer.sign(privateKeyPem, "base64");
}

function verifyPayload(payload, signatureBase64, publicKeyPem) {
  const normalized = stableStringify(payload);
  const signatureBytes = Buffer.from(String(signatureBase64 || ""), "base64");
  const verifyWithSignature = (signatureBuffer) => {
    const verifier = crypto.createVerify("SHA256");
    verifier.update(normalized);
    verifier.end();
    return verifier.verify(publicKeyPem, signatureBuffer);
  };
  if (verifyWithSignature(signatureBytes)) {
    return true;
  }
  if (signatureBytes.length === 64) {
    try {
      return verifyWithSignature(rawToDerEcdsaSignature(signatureBytes));
    } catch {
      return false;
    }
  }
  return false;
}

function fingerprintPublicKey(publicKeyPem) {
  const key = crypto.createPublicKey(publicKeyPem);
  const der = key.export({ type: "spki", format: "der" });
  const digest = crypto.createHash("sha256").update(der).digest("hex");
  return `sha256:${digest}`;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

module.exports = {
  stableStringify,
  signPayload,
  verifyPayload,
  fingerprintPublicKey,
  readJson,
  writeJson,
};
