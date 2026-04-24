/**
 * Hardware Binding Status UI Component
 * 
 * Shows real-time hardware identity status in the UI.
 * This is the visual proof of the "undeniable" feature.
 */

const identityKernel = require('./identityKernel');

class HardwareStatusUI {
  constructor() {
    this.name = 'HardwareStatusUI';
    this.status = null;
    this.lastCheck = null;
  }

  /**
   * Get current hardware status for UI display
   */
  async getStatus() {
    try {
      const identity = await identityKernel.getCurrentIdentity();
      const hardware = await identityKernel.getHardwareFingerprint();
      
      this.status = {
        // Overall state
        bound: identity.isBound,
        healthy: !hardware.degraded,
        verified: identity.verified,
        
        // Visual indicators
        icon: this.getStatusIcon(identity, hardware),
        color: this.getStatusColor(identity, hardware),
        tooltip: this.getTooltip(identity, hardware),
        
        // Detailed info
        hardwareId: this.maskId(hardware.id),
        sources: hardware.sources.map(s => ({
          name: s.name,
          valid: s.valid,
          icon: s.valid ? '✅' : '❌'
        })),
        
        // Security info
        encryption: 'AES-256-GCM',
        keyDerivation: 'scrypt (hardware + passphrase)',
        signature: identity.signature ? 'Valid' : 'None',
        
        // User actions
        actions: this.getActions(identity, hardware)
      };
      
      this.lastCheck = Date.now();
      return this.status;
    } catch (err) {
      return {
        bound: false,
        healthy: false,
        error: err.message,
        icon: '⚠️',
        color: 'red',
        tooltip: 'Hardware binding error - check system'
      };
    }
  }

  getStatusIcon(identity, hardware) {
    if (!identity.isBound) return '🔓'; // Unbound
    if (hardware.degraded) return '⚠️'; // Degraded
    if (!identity.verified) return '🔐'; // Bound but unverified
    return '🔒'; // Fully locked
  }

  getStatusColor(identity, hardware) {
    if (!identity.isBound) return 'gray';
    if (hardware.degraded) return 'yellow';
    if (!identity.verified) return 'orange';
    return 'green';
  }

  getTooltip(identity, hardware) {
    if (!identity.isBound) {
      return 'Session not hardware-bound. Click to enable encryption.';
    }
    if (hardware.degraded) {
      return `Hardware degraded - ${hardware.degradedReason}. Backup recommended.`;
    }
    if (!identity.verified) {
      return 'Hardware-bound but not yet verified. First unlock required.';
    }
    return `Hardware-bound to ${this.maskId(hardware.id)}. Session survives OS reinstall.`;
  }

  maskId(id) {
    if (!id) return 'unknown';
    if (id.length < 12) return id;
    return `${id.slice(0, 6)}...${id.slice(-6)}`;
  }

  getActions(identity, hardware) {
    const actions = [];
    
    if (!identity.isBound) {
      actions.push({
        id: 'enable-binding',
        label: 'Enable Hardware Binding',
        icon: '🔐',
        primary: true
      });
    } else {
      actions.push({
        id: 'export-backup',
        label: 'Export Backup',
        icon: '💾',
        primary: true
      });
      
      actions.push({
        id: 'verify-identity',
        label: 'Verify Identity',
        icon: '🔍'
      });
      
      if (hardware.degraded) {
        actions.push({
          id: 'emergency-export',
          label: 'Emergency Export',
          icon: '⚠️',
          urgent: true
        });
      }
    }
    
    return actions;
  }

  /**
   * Render status bar component (HTML/React string)
   */
  renderStatusBar() {
    if (!this.status) return '<span>Loading...</span>';
    
    const s = this.status;
    return `
      <div class="hardware-status ${s.color}" title="${s.tooltip}">
        <span class="icon">${s.icon}</span>
        <span class="text">${s.bound ? 'Hardware-Bound' : 'Unbound'}</span>
        ${s.healthy ? '' : '<span class="warning">⚠️</span>'}
      </div>
    `;
  }

  /**
   * Render detailed panel for settings
   */
  renderDetailPanel() {
    if (!this.status) return '<div>Loading hardware status...</div>';
    
    const s = this.status;
    return `
      <div class="hardware-detail-panel">
        <h3>🔐 Hardware Identity</h3>
        
        <div class="status-row">
          <span>Status:</span>
          <span class="${s.color}">${s.icon} ${s.bound ? 'Bound' : 'Unbound'}</span>
        </div>
        
        <div class="status-row">
          <span>Hardware ID:</span>
          <code>${s.hardwareId}</code>
        </div>
        
        <div class="status-row">
          <span>Encryption:</span>
          <span>${s.encryption}</span>
        </div>
        
        <div class="status-row">
          <span>Key Derivation:</span>
          <span>${s.keyDerivation}</span>
        </div>
        
        <h4>Hardware Sources</h4>
        <ul class="sources-list">
          ${s.sources.map(src => `
            <li>${src.icon} ${src.name}</li>
          `).join('')}
        </ul>
        
        <div class="actions">
          ${s.actions.map(action => `
            <button class="${action.primary ? 'primary' : ''} ${action.urgent ? 'urgent' : ''}">
              ${action.icon} ${action.label}
            </button>
          `).join('')}
        </div>
        
        <p class="help-text">
          Hardware binding means sessions are encrypted with keys derived from 
          your machine's unique fingerprint. Sessions survive OS reinstalls but 
          won't work on different hardware.
        </p>
      </div>
    `;
  }
}

module.exports = { HardwareStatusUI };
