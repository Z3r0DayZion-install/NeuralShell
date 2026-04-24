/**
 * Paranoid Shell Demo Script
 * 
 * Pre-loaded demo conversation that showcases hardware binding.
 * This runs automatically on first launch to show the "undeniable" feature.
 */

const paranoidShellDemo = {
  id: 'demo-paranoid-shell',
  name: '🔐 Hardware-Bound Session Demo',
  description: 'See how NeuralShell cryptographically binds sessions to your hardware',
  type: 'interactive-demo',
  autoLaunch: true, // Show on first launch
  
  messages: [
    {
      role: 'system',
      content: `Welcome to NeuralShell - the AI operator shell for paranoid developers.

This session is hardware-bound. Even if you reinstall your OS, this conversation can be restored - but ONLY on this machine.`
    },
    {
      role: 'user',
      content: 'What is hardware binding?'
    },
    {
      role: 'assistant',
      content: `**Hardware binding** means this session is cryptographically tied to your machine's unique fingerprint.

**How it works:**
1. We read 4 hardware identifiers (CPU, BIOS, baseboard, UUID)
2. Generate a unique fingerprint
3. Encrypt your sessions with a key derived from this fingerprint
4. Sign all backups with your hardware identity

**What this means:**
✅ You can reinstall your OS and restore sessions
✅ Backups are encrypted (need your passphrase)
❌ Sessions won't work on different hardware (cryptographically locked)

**Try it:** Export this session, delete the app, reinstall, and import. It will restore - but only on THIS machine.`
    },
    {
      role: 'user',
      content: 'Show me my hardware status'
    },
    {
      role: 'assistant',
      content: `**Hardware Identity Status**

🟢 **Bound**: Session locked to this machine
🔒 **Encrypted**: AES-256-GCM with hardware-derived key
📝 **Auditable**: Every interaction logged and hashed

**Hardware Sources:**
- CPU Serial: [redacted-hash]
- BIOS UUID: [redacted-hash]
- Baseboard: [redacted-hash]
- System UUID: [redacted-hash]

**Verification:** All sources valid, identity stable
**Mode:** Protected (degraded if hardware changes)

*Click "Export Backup" to create a portable, hardware-locked backup.*`
    }
  ],
  
  actions: [
    {
      id: 'export-backup',
      label: '💾 Export Hardware-Bound Backup',
      description: 'Create encrypted backup locked to this machine'
    },
    {
      id: 'verify-identity',
      label: '🔍 Verify Hardware Identity',
      description: 'Show current hardware fingerprint'
    },
    {
      id: 'demo-restore',
      label: '🎮 Simulate OS Reinstall',
      description: 'See how session survives app data wipe'
    },
    {
      id: 'audit-log',
      label: '📊 View Audit Trail',
      description: 'See tamper-evident session log'
    }
  ]
};

const airgapDemo = {
  id: 'demo-airgap',
  name: '📴 Air-Gap Mode Demo',
  description: 'Run AI completely offline',
  type: 'interactive-demo',
  
  messages: [
    {
      role: 'system',
      content: `**Air-Gap Mode Active**

NeuralShell is running with no internet connection. All AI processing happens locally via Ollama.`
    },
    {
      role: 'user',
      content: 'How does offline AI work?'
    },
    {
      role: 'assistant',
      content: `**100% Offline AI**

NeuralShell + Ollama = No cloud required

**What runs locally:**
- ✅ LLM inference (Llama, Mistral, etc.)
- ✅ Session storage
- ✅ Agent execution
- ✅ Audit logging

**What needs internet:**
- ❌ Nothing (optional: model downloads)

**Perfect for:**
- Classified environments
- Air-gapped networks
- Privacy-critical workflows
- Offline development

**Current Model:** [Detected from Ollama]
**Status:** 🟢 Running locally`
    }
  ]
};

const auditDemo = {
  id: 'demo-audit',
  name: '📋 Compliance Audit Demo',
  description: 'Export SOC2-ready session logs',
  type: 'interactive-demo',
  
  messages: [
    {
      role: 'system',
      content: `**Audit Trail Demo**

Every interaction in NeuralShell is logged with cryptographic integrity.`
    },
    {
      role: 'user',
      content: 'Show me the audit report'
    },
    {
      role: 'assistant',
      content: `**Session Audit Report**

**Session ID:** demo-session-001  
**Created:** 2026-04-22T14:30:00Z  
**Hardware Bound:** Yes (ID: a3f7...e2d9)  
**Encryption:** AES-256-GCM

**Chain of Custody:**
1. [14:30:01] User: "Show me the audit report"
   Hash: sha256:9a2b...c4f1
   
2. [14:30:02] System: Generated audit response
   Hash: sha256:7e8d...a2b3
   
3. [14:30:03] Signed with hardware key
   Signature: valid ✅

**Export Options:**
- PDF Report (compliance-ready)
- JSON (machine-readable)
- CSV (spreadsheet)

**Verification:** Hash chain intact, signature valid`
    }
  ]
};

module.exports = {
  paranoidShellDemo,
  airgapDemo,
  auditDemo,
  allDemos: [paranoidShellDemo, airgapDemo, auditDemo]
};
