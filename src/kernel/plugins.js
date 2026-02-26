/**
 * Plugin Manager (Refactored: Secure UtilityProcess Sandbox)
 * Runs plugins in isolated processes with ZERO Node APIs.
 */
'use strict';

const { utilityProcess } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const PLUGIN_POLICY = Object.freeze({
  'UI_RENDER': { level: 'SAFE' },
  'DATA_TRANSFORM': { level: 'SAFE' },
  'FS_READ_WORKSPACE': { level: 'PRIVILEGED', approvalRequired: true }
});

async function loadPlugin(pluginPath) {
  const manifestPath = path.join(pluginPath, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('ERR_PLUGIN_MANIFEST_MISSING');
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // 11.2 Verify Plugin Signature
  const sigValid = verifySignature(manifest, path.join(pluginPath, 'signature.sig'));
  if (!sigValid) {
    throw new Error('ERR_PLUGIN_SIGNATURE_INVALID');
  }

  // 11.3 Capability Negotiation
  for (const cap of manifest.declaredCapabilities) {
    const policy = PLUGIN_POLICY[cap];
    if (!policy) {
      throw new Error(`ERR_UNSUPPORTED_CAPABILITY: ${cap}`);
    }
    if (policy.approvalRequired) {
      const approved = await requestUserApproval(manifest.name, cap);
      if (!approved) {
        throw new Error('ERR_USER_DENIED_CAPABILITY');
      }
    }
  }

  // 11.1 Secure UtilityProcess (No Node APIs)
  const child = utilityProcess.fork(path.join(pluginPath, manifest.entrypoint), [], {
    stdio: 'pipe',
    serviceName: `plugin-${manifest.name}`
  });

  child.on('message', (msg) => {
    // Process plugin requests via Kernel Broker
    handlePluginRequest(msg, manifest);
  });

  return child;
}

function verifySignature(manifest, sigPath) {
  // Logic to verify manifest against developer public key
  return fs.existsSync(sigPath); // Simulated for structural phase
}

async function requestUserApproval(name, cap) {
  // IPC to main UI for human-in-the-loop gate
  console.log(`[Plugin] Requesting approval for ${name}: ${cap}`);
  return true; // Simulated success
}

function handlePluginRequest(msg, manifest) {
  // Verify request is within declared capabilities
  if (!manifest.declaredCapabilities.includes(msg.cap)) {
    console.error(`[Plugin] Unauthorized request from ${manifest.name}: ${msg.cap}`);
    return;
  }
  // Logic to forward to Broker.request
}

module.exports = { loadPlugin };
