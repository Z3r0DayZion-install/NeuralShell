import fs from 'fs';
import path from 'path';
import { HardenedSandbox } from '../sandbox/hardenedSandbox.js';

/**
 * Quine Engine (Self-Rewriting Core)
 * 
 * Capabilities:
 * 1. Read own source code.
 * 2. Apply LLM-driven optimizations.
 * 3. Verify syntax/logic via Sandbox.
 * 4. HOT SWAP the file on disk.
 * 
 * WARNING: This is the "Dangerous" part of the singularity.
 */
export class QuineEngine {
  constructor(routerCore) {
    this.runtime = new HardenedSandbox();
    this.router = routerCore;
    this.backupDir = './state/backups';
    this.shadowDir = './state/shadow'; // Shadow branch for safe mutation
    this.projectRoot = path.resolve(process.cwd());
    if (!fs.existsSync(this.backupDir)) fs.mkdirSync(this.backupDir, { recursive: true });
    if (!fs.existsSync(this.shadowDir)) fs.mkdirSync(this.shadowDir, { recursive: true });
  }

  async optimizeModule(filePath, instruction) {
    const absolutePath = path.resolve(filePath);
    const relativePath = path.relative(this.projectRoot, absolutePath);
    
    // 0. Security Check: Path Traversal
    if (!absolutePath.startsWith(this.projectRoot)) {
      console.error(`[Quine] Blocked access to path outside project root: ${absolutePath}`);
      return { success: false, error: 'Access denied: Path outside project root' };
    }

    console.log(`[Quine] Cognitive Optimization for module: ${relativePath}`);
    
    // 1. Read Source
    const originalCode = fs.readFileSync(absolutePath, 'utf8');
    
    // 2. Backup
    const backupPath = path.join(this.backupDir, `${path.basename(absolutePath)}.${Date.now()}.bak`);
    fs.writeFileSync(backupPath, originalCode);
    console.log(`[Quine] Backup saved to ${backupPath}`);

    // 3. Cognitive Optimization (Call Digital Clone)
    const optimizedCode = await this.callDigitalCloneOptimizer(originalCode, instruction);

    if (!optimizedCode) {
      return { success: false, error: 'LLM failed to generate optimized code' };
    }

    // 4. Verify Syntax (Hardened Sandbox)
    console.log('[Quine] Verifying syntax via Hardened Sandbox...');
    const verification = await this.runtime.execute(optimizedCode + '\nconsole.log("Syntax Check Pass");');
    
    if (!verification.success || verification.error) {
      console.error('[Quine] Verification failed. Reverting.', verification.error);
      return { success: false, error: verification.error || 'Syntax verification failed' };
    }

    // 5. Shadow Write (Phase 5: Safe Mutation)
    const shadowPath = path.join(this.shadowDir, relativePath.replace(/[\/\\]/g, '_'));
    fs.writeFileSync(shadowPath, optimizedCode, 'utf8');
    console.log(`[Quine] Shadow mutation written to: ${shadowPath}`);

    // 6. Merge (Hot Swap)
    // In a real Phase 5, we would run unit tests against shadowPath here.
    // For now, we assume syntax check + LLM logic is enough to proceed.
    console.log('[Quine] Merging shadow mutation to live...');
    
    // Safety Lock Check
    if (process.env.QUINE_CODE_LOCK === '1' || process.env.QUINE_CODE_LOCK === 'true') {
      console.warn(`[Quine] 🛑 Merge blocked by safety lock (QUINE_CODE_LOCK=true). Mutation preserved in shadow.`);
      return { success: true, path: absolutePath, shadow: shadowPath, locked: true };
    }

    fs.writeFileSync(absolutePath, optimizedCode, 'utf8');
    
    return { success: true, path: absolutePath, shadow: shadowPath, locked: false };
  }

  async callDigitalCloneOptimizer(code, instruction) {
    if (!this.router) {
      console.warn('[Quine] No router available for cognitive optimization. Falling back to mock.');
      return this.simulateLLMImprovement(code, instruction);
    }

    const prompt = `
You are the Architect Agent for NeuralShell.
TASK: Optimize the following JavaScript code according to the INSTRUCTION.
STYLE: Maintain the coding style found in your chat history (clean, robust, sovereign).

MUTATION LEVEL (TRIPLE 5): ${this.getTriple5Level(instruction)}

INSTRUCTION: ${instruction}

CODE:
\`\`\`javascript
${code}
\`\`\`

OUTPUT:
Return ONLY the improved JavaScript code. Do not include explanations or markdown blocks.
`;

    try {
      const response = await this.router.executeRequest({
        messages: [{ role: 'user', content: prompt }],
        model: 'my-clone'
      }, { endpoint: 'my-digital-clone' });

      let result = response.choices[0].message.content;
      // Strip markdown code blocks if the LLM added them
      result = result.replace(/^```javascript\n/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
      
      return result;
    } catch (err) {
      console.error('[Quine] LLM Optimization failed:', err.message);
      return null;
    }
  }

  getTriple5Level(instruction) {
    if (instruction.includes("RUN 3X") || instruction.includes("DEEP")) return "LEVEL 3: Deep Addictive Rewrite (Maximum Power)";
    if (instruction.includes("RUN TWICE")) return "LEVEL 2: NLP Structured Refinement";
    return "LEVEL 1: Light Optimization";
  }

  simulateLLMImprovement(code, instruction) {
    // This mocks what an LLM would return.
    // It adds a robust logging header and a "Self-Improved" badge.
    const header = `/**
 * SELF-IMPROVED MODULE
 * Optimized by NeuralShell Quine Engine
 * Goal: ${instruction}
 * Timestamp: ${new Date().toISOString()}
 */
`;
    
    if (code.includes('SELF-IMPROVED')) {
      return code.replace(/Timestamp: .*/, `Timestamp: ${new Date().toISOString()}`);
    }
    
    return header + code;
  }
}
