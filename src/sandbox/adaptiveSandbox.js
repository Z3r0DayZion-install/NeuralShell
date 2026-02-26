import { HardenedSandbox } from './hardenedSandbox.js';
import { SafeRuntime } from './safeRuntime.js';

export class AdaptiveSandbox {
  constructor(options = {}) {
    const backend = (options.backend || process.env.NS_SANDBOX_BACKEND || 'docker').toLowerCase();
    const allowVmFallback =
      options.allowVmFallback ??
      (process.env.NS_SANDBOX_ALLOW_VM_FALLBACK === '1' || process.env.NS_SANDBOX_ALLOW_VM_FALLBACK === 'true');

    this.backend = backend;
    this.allowVmFallback = allowVmFallback;

    this.dockerSandbox = new HardenedSandbox(options.dockerTimeoutMs);
    this.vmSandbox = new SafeRuntime(options.vmTimeoutMs);
  }

  async execute(code, timeoutMs) {
    if (this.backend === 'vm') {
      return this.vmSandbox.execute(code);
    }

    if (this.backend === 'docker') {
      return this.dockerSandbox.execute(code, timeoutMs);
    }

    if (this.backend !== 'auto') {
      throw new Error(`Unknown NS_SANDBOX_BACKEND: ${this.backend} (expected docker|vm|auto)`);
    }

    try {
      return await this.dockerSandbox.execute(code, timeoutMs);
    } catch (err) {
      const msg = String(err && err.message ? err.message : err);
      const dockerUnavailable =
        msg.includes('docker engine is not reachable') ||
        msg.includes('docker') && msg.includes('not reachable') ||
        msg.includes('connect') && msg.includes('docker') ||
        msg.includes('ENOENT') ||
        msg.includes('npipe');

      if (!dockerUnavailable) throw err;

      if (!this.allowVmFallback) {
        throw new Error(
          'Docker sandbox is unavailable. Start Docker Desktop (or set NS_SANDBOX_BACKEND=vm for dev). ' +
            'To allow auto fallback, set NS_SANDBOX_ALLOW_VM_FALLBACK=1.'
        );
      }

      return this.vmSandbox.execute(code);
    }
  }
}
