import { BaseAgent } from './baseAgent.js';
import { HardenedSandbox } from '../sandbox/hardenedSandbox.js';
import { GlobalToolForge } from '../forge/toolForge.js';

export class CoderAgent extends BaseAgent {
  constructor() {
    super({
      name: 'coder-01',
      role: 'coder',
      capabilities: ['generate_code', 'review_code', 'debug', 'execute_code', 'forge_tools']
    });
    this.sandbox = new HardenedSandbox();
  }

  async executeTask(task) {
    if (task.type === 'generate_code') return this.generateAndRun(task.data.spec);
    if (task.type === 'invent_tool') return this.inventTool(task.data.name, task.data.spec);
    throw new Error(`Unknown task type: ${task.type}`);
  }

  async inventTool(name, spec) {
    console.log(`[Coder] Inventing new tool: ${name} for ${spec}...`);
    
    // Simulate generation of tool code and schema
    const code = `console.log("Running AI Tool: ${name}"); return { success: true, input: args };`;
    const schema = {
      name,
      description: spec,
      parameters: { type: 'object', properties: { input: { type: 'string' } } }
    };

    const tool = await GlobalToolForge.forgeTool(name, code, schema);
    return { status: 'forged', tool };
  }

  async generateAndRun(spec) {
    console.log(`[Coder] Generating code for: "${spec}"...`);
    
    // Template logic for demo
    let code = 'console.log("No implementation found")';
    if (spec.includes('factorial')) code = 'function f(n){return n<=1?1:n*f(n-1)}; console.log(f(5))';
    else if (spec.includes('date')) code = 'console.log(new Date().toISOString())';
    else code = `console.log("Execution spec: ${spec}")`;

    console.log('[Coder] Launching Hardened Sandbox...');
    const execution = await this.sandbox.execute(code);

    return {
      spec,
      code,
      execution
    };
  }
}
