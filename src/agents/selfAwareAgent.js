import { BaseAgent } from './baseAgent.js';
import fs from 'fs';
import path from 'path';
import { QuineEngine } from '../core/quineEngine.js';

/**
 * Self-Aware Agent
 *
 * Capability: Recursive Reflection & Self-Editing.
 */
export class SelfAwareAgent extends BaseAgent {
  constructor(routerCore) {
    super({
      name: 'self-aware-01',
      role: 'architect',
      capabilities: ['code_reflection', 'self_modification']
    });
    this.quine = new QuineEngine(routerCore);
  }

  async executeTask(task) {
    if (task.type === 'reflect_on_self') {
      return this.reflect();
    }
    if (task.type === 'improve_module') {
      return this.improve(task.data.target);
    }
    throw new Error(`Unknown task type: ${task.type}`);
  }

  async improve(targetFile) {
    console.log(`[Architect] Deciding to upgrade: ${targetFile}`);
    const result = await this.quine.optimizeModule(targetFile, 'Add detailed logging and error handling');
    return result;
  }

  async reflect() {
    console.log('[SelfAware] Initiating recursive reflection...');

    const rootDir = '.';
    const manifest = this.mapDirectory(rootDir);

    // Self-Analysis logic (Simulated)
    const insights = [
      "Dependency Bloat: 'tar-fs' and 'dockerode' could be abstracted into a Plugin.",
      'Scalability: Vector Memory currently limited to 100 nodes in visualization; needs HNSW pagination.',
      'Security: Genesis Engine deployments currently use root Nginx; needs non-root user hardening.',
      'Intelligence: Orchestrator uses keyword matching; needs LLM-based intent parsing.'
    ];

    return {
      status: 'analyzed',
      manifestSize: manifest.length,
      insights,
      timestamp: new Date().toISOString()
    };
  }

  mapDirectory(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      if (file === 'node_modules' || file === '.git') {
        return;
      }

      if (fs.statSync(filePath).isDirectory()) {
        this.mapDirectory(filePath, fileList);
      } else {
        fileList.push(filePath);
      }
    });
    return fileList;
  }
}
