#!/usr/bin/env node
const assert = require("assert");
const path = require("path");

// Save original env
const originalEnv = {
  NS_LICENSE_SIGNING_KEY: process.env.NS_LICENSE_SIGNING_KEY,
  NS_ALLOW_DEV_LICENSE_KEY: process.env.NS_ALLOW_DEV_LICENSE_KEY
};

// Clear env before tests
delete process.env.NS_LICENSE_SIGNING_KEY;
delete process.env.NS_ALLOW_DEV_LICENSE_KEY;

// Clear module cache to force fresh load
delete require.cache[require.resolve("../billing/licenseEngine")];

function resetEnv() {
  delete process.env.NS_LICENSE_SIGNING_KEY;
  delete process.env.NS_ALLOW_DEV_LICENSE_KEY;
  delete require.cache[require.resolve("../billing/licenseEngine")];
}

function testRealKeyConfigured() {
  resetEnv();
  process.env.NS_LICENSE_SIGNING_KEY = "test-production-key-12345";
  const { createSignedLicense, verifyLicenseBlob } = require("../billing/licenseEngine");
  
  const license = createSignedLicense({
    planId: "pro",
    customer: "test-customer",
    seats: 5
  });
  
  assert.ok(license.signature, "License should have signature");
  assert.strictEqual(license.payload.planId, "pro", "Plan ID should match");
  
  const verification = verifyLicenseBlob(license);
  assert.strictEqual(verification.ok, true, "License should verify with real key");
  assert.strictEqual(verification.planId, "pro", "Verified plan ID should match");
  
  console.log("✓ Real key configured: sign/verify works");
}

function testNoKeyNoDevOverride() {
  resetEnv();
  // No NS_LICENSE_SIGNING_KEY, no NS_ALLOW_DEV_LICENSE_KEY
  
  let caughtError = null;
  try {
    const { createSignedLicense } = require("../billing/licenseEngine");
    createSignedLicense({ planId: "pro" });
  } catch (err) {
    caughtError = err;
  }
  
  assert.ok(caughtError, "Should throw error when no key configured");
  assert.ok(
    caughtError.message.includes("NS_LICENSE_SIGNING_KEY is not set"),
    "Error message should mention missing key"
  );
  assert.ok(
    caughtError.message.includes("NS_ALLOW_DEV_LICENSE_KEY=1"),
    "Error message should mention dev override"
  );
  
  console.log("✓ No key + no dev override: fails closed");
}

function testNoKeyWithDevOverride() {
  resetEnv();
  process.env.NS_ALLOW_DEV_LICENSE_KEY = "1";
  const { createSignedLicense, verifyLicenseBlob } = require("../billing/licenseEngine");
  
  const license = createSignedLicense({
    planId: "free",
    customer: "dev-test"
  });
  
  assert.ok(license.signature, "License should have signature with dev key");
  
  const verification = verifyLicenseBlob(license);
  assert.strictEqual(verification.ok, true, "License should verify with dev key");
  
  console.log("✓ No key + explicit dev override: dev path works");
}

function testMismatchedKey() {
  resetEnv();
  process.env.NS_LICENSE_SIGNING_KEY = "key-for-signing";
  const { createSignedLicense } = require("../billing/licenseEngine");
  
  const license = createSignedLicense({
    planId: "enterprise",
    customer: "test"
  });
  
  resetEnv();
  process.env.NS_LICENSE_SIGNING_KEY = "different-key-for-verification";
  const { verifyLicenseBlob } = require("../billing/licenseEngine");
  
  const verification = verifyLicenseBlob(license);
  assert.strictEqual(verification.ok, false, "License should fail verification with mismatched key");
  assert.strictEqual(verification.reason, "license_signature_mismatch", "Reason should be signature mismatch");
  
  console.log("✓ Mismatched key: verification fails");
}

function testDevKeyDoesNotWorkInProduction() {
  resetEnv();
  // Simulate attacker trying to use dev key without override
  process.env.NS_LICENSE_SIGNING_KEY = "neuralshell-license-dev-signing-key-v1";
  const { createSignedLicense, verifyLicenseBlob } = require("../billing/licenseEngine");
  
  const license = createSignedLicense({
    planId: "enterprise",
    customer: "attacker"
  });
  
  resetEnv();
  // Production instance with no key set and no dev override
  let caughtError = null;
  try {
    const { verifyLicenseBlob: verify } = require("../billing/licenseEngine");
    verify(license);
  } catch (err) {
    caughtError = err;
  }
  
  assert.ok(caughtError, "Should fail when trying to verify without key configured");
  
  console.log("✓ Dev key cannot be exploited without explicit override");
}

function testExplicitDevOverrideRequired() {
  resetEnv();
  // Try setting to "true" instead of "1" - should fail
  process.env.NS_ALLOW_DEV_LICENSE_KEY = "true";
  
  let caughtError = null;
  try {
    const { createSignedLicense } = require("../billing/licenseEngine");
    createSignedLicense({ planId: "pro" });
  } catch (err) {
    caughtError = err;
  }
  
  assert.ok(caughtError, "Should fail when dev override is not exactly '1'");
  
  console.log("✓ Dev override requires explicit '1' value");
}

// Run tests
try {
  testRealKeyConfigured();
  testNoKeyNoDevOverride();
  testNoKeyWithDevOverride();
  testMismatchedKey();
  testDevKeyDoesNotWorkInProduction();
  testExplicitDevOverrideRequired();
  
  console.log("\nLicense engine test passed.");
} catch (err) {
  console.error("\nLicense engine test failed:");
  console.error(err.message);
  console.error(err.stack);
  process.exit(1);
} finally {
  // Restore original env
  if (originalEnv.NS_LICENSE_SIGNING_KEY !== undefined) {
    process.env.NS_LICENSE_SIGNING_KEY = originalEnv.NS_LICENSE_SIGNING_KEY;
  } else {
    delete process.env.NS_LICENSE_SIGNING_KEY;
  }
  if (originalEnv.NS_ALLOW_DEV_LICENSE_KEY !== undefined) {
    process.env.NS_ALLOW_DEV_LICENSE_KEY = originalEnv.NS_ALLOW_DEV_LICENSE_KEY;
  } else {
    delete process.env.NS_ALLOW_DEV_LICENSE_KEY;
  }
}
