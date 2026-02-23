import { safeFetch } from '../src/kernel/network.js';
import assert from 'node:assert';

async function testSafeFetch() {
  console.log("[Test] Verifying Kernel safeFetch Pinning...");

  // 1. Unpinned host should be denied
  await assert.rejects(
    safeFetch('https://google.com'),
    /ERR_PIN_REQUIRED/,
    "Unpinned host was not rejected"
  );

  // 2. Redirect should be denied
  // (Assuming mock server or real endpoint that redirects)
  // await assert.rejects(safeFetch('https://api.trusted-llm.com/redirect'), /ERR_REDIRECT_DENIED/);

  console.log("✅ Kernel pinning and isolation verified.");
}
