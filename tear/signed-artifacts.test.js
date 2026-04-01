const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const {
  signPayload,
  verifyPayload,
  fingerprintPublicKey
} = require("../scripts/lib/signed_artifacts.cjs");
const {
  verifySignedBrandingConfig
} = require("../scripts/verify_white_label_config.cjs");

const ROOT = path.resolve(__dirname, "..");
const PRIVATE_KEY_PATH = path.join(ROOT, "branding", "keys", "demo_white_label_private.pem");
const PUBLIC_KEY_PATH = path.join(ROOT, "branding", "keys", "demo_white_label_public.pem");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("signed artifact utility supports sign and verify round-trip", () => {
  const privateKeyPem = read(PRIVATE_KEY_PATH);
  const publicKeyPem = read(PUBLIC_KEY_PATH);
  const payload = {
    schema: "neuralshell_certificate_v1",
    certificateId: "cert-demo-001",
    issuedAt: "2026-03-27T00:00:00.000Z",
    trackId: "audit_operator",
    score: 100
  };

  const signature = signPayload(payload, privateKeyPem);
  assert.ok(signature && typeof signature === "string", "Expected base64 signature output.");
  assert.equal(verifyPayload(payload, signature, publicKeyPem), true);
  assert.equal(
    verifyPayload({ ...payload, score: 99 }, signature, publicKeyPem),
    false,
    "Tampered payload must fail verification."
  );
});

test("trusted signer verification passes for checked-in white-label config", () => {
  const signedConfig = path.join(ROOT, "config", "white_label.json");
  const trusted = path.join(ROOT, "config", "white_label_trusted_publishers.json");
  assert.equal(fs.existsSync(signedConfig), true, "Expected config/white_label.json to exist.");
  assert.equal(fs.existsSync(trusted), true, "Expected trusted publishers config to exist.");

  const result = verifySignedBrandingConfig(signedConfig, trusted);
  assert.equal(result.ok, true, `Expected trusted config verification pass. Result: ${JSON.stringify(result)}`);
});

test("fingerprint in trusted publishers matches demo public key", () => {
  const trusted = JSON.parse(read(path.join(ROOT, "config", "white_label_trusted_publishers.json")));
  const expected = new Set(
    (Array.isArray(trusted.publishers) ? trusted.publishers : [])
      .map((entry) => String(entry && entry.fingerprint ? entry.fingerprint : ""))
      .filter(Boolean)
  );
  const fp = fingerprintPublicKey(read(PUBLIC_KEY_PATH));
  assert.equal(expected.has(fp), true, "Demo white-label key fingerprint missing from trust set.");
});
