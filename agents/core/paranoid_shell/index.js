/**
 * Paranoid Shell Agent - Demo Mode
 * 
 * Shows hardware-bound identity in action.
 * This is the "undeniable" demo for HN launch.
 */

const { identityKernel } = require('../../src/core/identityKernel');
const { AuditChain } = require('../../src/core/auditChain');

class ParanoidShellAgent {
  constructor() {
    this.name = 'Paranoid Shell';
    this.version = '1.0.0';
  }

  /**
   * Demo: Show hardware binding status
   */
  async getHardwareStatus() {
    const identity = await identityKernel.getCurrentIdentity();
    const hardware = await identityKernel.getHardwareFingerprint();
    
    return {
      bound: identity.isBound,
      hardwareId: hardware.id,
      sources: hardware.sources,
      degraded: hardware.degraded,
      canRestore: identity.canRestore
    };
  }

  /**
   * Demo: Create hardware-bound session
   */
  async createBoundSession(sessionName) {
    const session = {
      id: crypto.randomUUID(),
      name: sessionName,
      createdAt: Date.now(),
      hardwareBound: true,
      identity: await identityKernel.getCurrentIdentity()
    };
    
    // Sign with hardware key
    session.signature = await identityKernel.sign(session.id);
    
    return session;
  }

  /**
   * Demo: Verify session survived reinstall
   */
  async verifySessionIntegrity(session) {
    const currentHardware = await identityKernel.getHardwareFingerprint();
    const verified = await identityKernel.verify(session.signature, session.id);
    
    return {
      valid: verified,
      sameHardware: currentHardware.id === session.identity.hardwareId,
      message: verified 
        ? "✅ Session verified - same hardware detected"
        : "❌ Session invalid - hardware mismatch or tampering"
    };
  }

  /**
   * Get demo script for UI
   */
  getDemoScript() {
    return {
      title: "The Paranoid Shell Demo",
      subtitle: "AI sessions that cryptographically bind to your hardware",
      steps: [
        {
          step: 1,
          title: "Create Session",
          description: "New thread with AES-256-GCM encryption + hardware-bound key",
          action: "create_session"
        },
        {
          step: 2,
          title: "Hardware Fingerprint",
          description: "CPU + BIOS + Baseboard + UUID = unique identity",
          action: "show_fingerprint"
        },
        {
          step: 3,
          title: "Simulate Reinstall",
          description: "Wipe app data, keep hardware identity",
          action: "simulate_reinstall"
        },
        {
          step: 4,
          title: "Restore & Verify",
          description: "Import encrypted backup, verify hardware signature",
          action: "restore_verify"
        }
      ],
      wow: "Your conversations survive OS reinstalls - but only on THIS machine"
    };
  }
}

module.exports = { ParanoidShellAgent };
