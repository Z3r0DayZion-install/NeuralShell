/**
 * Global Threat Intelligence
 * Shared immune memory for NeuralShell and HyperSnatch.
 */

import { readJsonFile, writeJsonFile } from './stateStore.js';
import path from 'path';

const INTEL_FILE = 'state/global_threat_intel.json';

export class ThreatIntel {
  constructor() {
    this.memory = readJsonFile(INTEL_FILE) || {
      blockedIPs: {},
      maliciousPatterns: [],
      trapUrls: [],
      deceptionTargets: [],
      lastUpdate: null
    };
  }

  reportThreat(type, identity, metadata = {}) {
    const entry = {
      ts: new Date().toISOString(),
      metadata
    };

    if (type === 'ip') {
      this.memory.blockedIPs[identity] = {
        ...entry,
        expires: Date.now() + (24 * 60 * 60 * 1000)
      };
    } else if (type === 'pattern') {
      if (!this.memory.maliciousPatterns.includes(identity)) {
        this.memory.maliciousPatterns.push(identity);
      }
    } else if (type === 'url') {
      if (!this.memory.trapUrls.includes(identity)) {
        this.memory.trapUrls.push(identity);
      }
      // Flag for active deception if severity is high
      if (metadata.severity === 'critical' && !this.memory.deceptionTargets.includes(identity)) {
        this.memory.deceptionTargets.push(identity);
      }
    }

    this.save();
  }

  isDeceptionTarget(url) {
    return this.memory.deceptionTargets && this.memory.deceptionTargets.includes(url);
  }

  isThreat(type, identity) {
    if (type === 'ip') {
      const block = this.memory.blockedIPs[identity];
      if (block && block.expires > Date.now()) return true;
      if (block) delete this.memory.blockedIPs[identity]; // Prune expired
    } else if (type === 'pattern') {
      return this.memory.maliciousPatterns.some(p => new RegExp(p, 'i').test(identity));
    } else if (type === 'url') {
      return this.memory.trapUrls.includes(identity);
    }
    return false;
  }

  save() {
    this.memory.lastUpdate = new Date().toISOString();
    writeJsonFile(INTEL_FILE, this.memory);
  }
}

export const globalIntel = new ThreatIntel();
