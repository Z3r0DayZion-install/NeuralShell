/**
 * Secret Rotation Manager
 * Automatic secret rotation with zero-downtime updates
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

export class SecretRotationManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.enabled = options.enabled !== false;
    this.rotationIntervalDays = options.rotationIntervalDays || 90;
    this.warningDays = options.warningDays || 7;
    this.gracePeriodDays = options.gracePeriodDays || 1;

    this.secrets = new Map();
    this.rotationSchedule = [];
    this.checkInterval = null;

    this.metrics = {
      totalRotations: 0,
      successfulRotations: 0,
      failedRotations: 0,
      warningsIssued: 0
    };
  }

  /**
   * Register a secret for rotation
   */
  registerSecret(name, options = {}) {
    const secret = {
      name,
      current: options.current || null,
      previous: null,
      createdAt: options.createdAt || Date.now(),
      rotatedAt: options.rotatedAt || null,
      expiresAt: this.calculateExpiration(options.rotatedAt || Date.now()),
      rotationHandler: options.rotationHandler,
      validator: options.validator,
      autoRotate: options.autoRotate !== false,
      metadata: options.metadata || {}
    };

    this.secrets.set(name, secret);
    this.scheduleRotation(secret);

    return secret;
  }

  /**
   * Calculate expiration date
   */
  calculateExpiration(fromDate) {
    return fromDate + (this.rotationIntervalDays * 24 * 60 * 60 * 1000);
  }

  /**
   * Schedule rotation check
   */
  scheduleRotation(secret) {
    const warningTime = secret.expiresAt - (this.warningDays * 24 * 60 * 60 * 1000);

    this.rotationSchedule.push({
      secretName: secret.name,
      warningTime,
      expiresAt: secret.expiresAt
    });

    this.rotationSchedule.sort((a, b) => a.warningTime - b.warningTime);
  }

  /**
   * Start rotation monitoring
   */
  start() {
    if (!this.enabled || this.checkInterval) {
      return;
    }

    // Check every hour
    this.checkInterval = setInterval(() => {
      this.checkRotations();
    }, 60 * 60 * 1000);

    // Initial check
    this.checkRotations();

    console.log('[SecretRotation] Started monitoring');
  }

  /**
   * Stop rotation monitoring
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[SecretRotation] Stopped monitoring');
    }
  }

  /**
   * Check for secrets needing rotation
   */
  async checkRotations() {
    const now = Date.now();

    for (const [name, secret] of this.secrets) {
      const daysUntilExpiry = (secret.expiresAt - now) / (24 * 60 * 60 * 1000);

      // Issue warning
      if (daysUntilExpiry <= this.warningDays && daysUntilExpiry > 0) {
        this.metrics.warningsIssued++;
        this.emit('rotation_warning', {
          secret: name,
          daysRemaining: Math.ceil(daysUntilExpiry),
          expiresAt: new Date(secret.expiresAt).toISOString()
        });
      }

      // Auto-rotate if enabled and expired
      if (secret.autoRotate && now >= secret.expiresAt) {
        console.log(`[SecretRotation] Auto-rotating secret: ${name}`);
        await this.rotateSecret(name);
      }
    }
  }

  /**
   * Rotate a secret
   */
  async rotateSecret(name, newValue = null) {
    const secret = this.secrets.get(name);

    if (!secret) {
      return { success: false, error: 'Secret not found' };
    }

    this.metrics.totalRotations++;

    try {
      console.log(`[SecretRotation] Rotating secret: ${name}`);

      // Generate or use provided new value
      const newSecret = newValue || this.generateSecret();

      // Validate new secret
      if (secret.validator) {
        const isValid = await secret.validator(newSecret);
        if (!isValid) {
          throw new Error('Secret validation failed');
        }
      }

      // Store previous secret for grace period
      secret.previous = secret.current;
      secret.current = newSecret;
      secret.rotatedAt = Date.now();
      secret.expiresAt = this.calculateExpiration(secret.rotatedAt);

      // Call rotation handler to update external systems
      if (secret.rotationHandler) {
        await secret.rotationHandler({
          name,
          current: secret.current,
          previous: secret.previous
        });
      }

      // Schedule next rotation
      this.scheduleRotation(secret);

      // Schedule cleanup of previous secret after grace period
      setTimeout(() => {
        if (this.secrets.has(name)) {
          const s = this.secrets.get(name);
          s.previous = null;
          console.log(`[SecretRotation] Cleaned up previous secret: ${name}`);
        }
      }, this.gracePeriodDays * 24 * 60 * 60 * 1000);

      this.metrics.successfulRotations++;

      this.emit('rotated', {
        secret: name,
        rotatedAt: new Date(secret.rotatedAt).toISOString(),
        expiresAt: new Date(secret.expiresAt).toISOString()
      });

      return {
        success: true,
        secret: name,
        rotatedAt: secret.rotatedAt,
        expiresAt: secret.expiresAt
      };

    } catch (error) {
      this.metrics.failedRotations++;
      console.error(`[SecretRotation] Failed to rotate ${name}:`, error);

      this.emit('rotation_error', {
        secret: name,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate a secure random secret
   */
  generateSecret(length = 32) {
    return crypto.randomBytes(length).toString('base64');
  }

  /**
   * Get secret (supports grace period)
   */
  getSecret(name, allowPrevious = true) {
    const secret = this.secrets.get(name);

    if (!secret) {
      return null;
    }

    return {
      current: secret.current,
      previous: allowPrevious ? secret.previous : null,
      rotatedAt: secret.rotatedAt,
      expiresAt: secret.expiresAt
    };
  }

  /**
   * Validate secret (checks both current and previous during grace period)
   */
  validateSecret(name, value) {
    const secret = this.secrets.get(name);

    if (!secret) {
      return false;
    }

    // Check current secret
    if (secret.current === value) {
      return true;
    }

    // Check previous secret (grace period)
    if (secret.previous === value) {
      const gracePeriodEnd = secret.rotatedAt + (this.gracePeriodDays * 24 * 60 * 60 * 1000);
      return Date.now() < gracePeriodEnd;
    }

    return false;
  }

  /**
   * Get rotation status for all secrets
   */
  getStatus() {
    const now = Date.now();
    const statuses = [];

    for (const [name, secret] of this.secrets) {
      const daysUntilExpiry = (secret.expiresAt - now) / (24 * 60 * 60 * 1000);
      const daysSinceRotation = secret.rotatedAt
        ? (now - secret.rotatedAt) / (24 * 60 * 60 * 1000)
        : null;

      statuses.push({
        name,
        status: daysUntilExpiry <= 0 ? 'expired' :
          daysUntilExpiry <= this.warningDays ? 'warning' : 'ok',
        daysUntilExpiry: Math.ceil(daysUntilExpiry),
        daysSinceRotation: daysSinceRotation ? Math.floor(daysSinceRotation) : null,
        expiresAt: new Date(secret.expiresAt).toISOString(),
        rotatedAt: secret.rotatedAt ? new Date(secret.rotatedAt).toISOString() : null,
        autoRotate: secret.autoRotate,
        hasGracePeriod: secret.previous !== null
      });
    }

    return {
      enabled: this.enabled,
      secrets: statuses,
      metrics: { ...this.metrics },
      config: {
        rotationIntervalDays: this.rotationIntervalDays,
        warningDays: this.warningDays,
        gracePeriodDays: this.gracePeriodDays
      }
    };
  }

  /**
   * Get secrets needing rotation
   */
  getSecretsNeedingRotation() {
    const now = Date.now();
    const needRotation = [];

    for (const [name, secret] of this.secrets) {
      if (now >= secret.expiresAt) {
        needRotation.push({
          name,
          expiresAt: new Date(secret.expiresAt).toISOString(),
          daysOverdue: Math.floor((now - secret.expiresAt) / (24 * 60 * 60 * 1000))
        });
      }
    }

    return needRotation;
  }

  /**
   * Force rotation of all secrets
   */
  async rotateAll() {
    const results = [];

    for (const name of this.secrets.keys()) {
      const result = await this.rotateSecret(name);
      results.push({ name, ...result });
    }

    return results;
  }

  /**
   * Get statistics
   */
  getStats() {
    const successRate = this.metrics.totalRotations > 0
      ? (this.metrics.successfulRotations / this.metrics.totalRotations) * 100
      : 0;

    return {
      enabled: this.enabled,
      totalSecrets: this.secrets.size,
      metrics: { ...this.metrics },
      successRate: successRate.toFixed(2) + '%',
      nextRotation: this.rotationSchedule[0] || null
    };
  }
}

export default SecretRotationManager;
