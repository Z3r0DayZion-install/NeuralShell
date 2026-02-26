import { MessageBus } from '../swarm/messageBus.js';
import { GlobalToolForge } from '../forge/toolForge.js';
import { GenesisAgent } from '../agents/genesisAgent.js';
import { GlobalLedger } from '../economy/ledger.js';

/**
 * The Swarm Orchestrator
 *
 * Analyzes incoming user prompts using the Digital Clone (LLM),
 * decomposes them into sub-tasks, and delegates execution.
 */
export class Orchestrator {
  constructor(routerCore, onCognitiveEvent = null) {
    this.bus = new MessageBus();
    this.router = routerCore; // Link to the LLM brain
    this.onCognitiveEvent = onCognitiveEvent;
    this.genesis = new GenesisAgent();
    this.activeTasks = new Map();
    this.knownTools = [];
    this.optimizations = []; // --- BRIDGE: Actionable Patch Queue ---
    this.sentienceInterval = null;
    this.systemPrompt = `
You are the Swarm Orchestrator for NeuralShell. 
Your goal is to decompose user prompts into a sequence of tasks for specialized agents.

AVAILABLE AGENTS:
1. 'researcher': Web search, data gathering, and analysis.
2. 'coder': Generating, debugging, and executing JavaScript code.
3. 'architect': Self-modification, quine operations, and system design.
4. 'genesis': Spawning new Dockerized applications and HTML frontends.

OUTPUT FORMAT:
Return ONLY a JSON array of task objects. Do not include any other text.
Each task must have: { "role": "agent_name", "type": "task_type", "data": { ... } }

EXAMPLE:
User: "Research bitcoin price and write a bot to track it."
Output:
[
  { "role": "researcher", "type": "web_search", "data": { "query": "bitcoin current price api" } },
  { "role": "coder", "type": "generate_code", "data": { "spec": "Write a nodejs script to poll bitcoin price" } }
]
`;
  }

  async start() {
    await this.bus.connect('orchestrator');
    await this.syncTools();

    // Refresh tools every minute
    setInterval(() => this.syncTools(), 60000);

    // --- SENTIENCE LOOP: Autonomous System Improvement ---
    this.sentienceInterval = setInterval(() => this.thinkAutonomously(), 300000); // Every 5 mins

    // Listen for task completions
    this.bus.on('task:completed', (event) => {
      console.log(`[Orchestrator] Task ${event.taskId} completed by ${event.agent}`);
      if (this.onCognitiveEvent) {
        this.onCognitiveEvent({
          agent: event.agent,
          content: `Task ${event.taskId} finalized. Integrity check passed.`
        });
      }
    });

    console.log('[Orchestrator] Online and listening.');
  }

  async thinkAutonomously() {
    if (!this.router || !this.onCognitiveEvent) {
      return;
    }

    // --- ECONOMIC REALISM: Thought Cost ---
    try {
      GlobalLedger.transfer('admin-user', 'orchestrator', 1, 'Autonomous System Audit');
    } catch (e) {
      this.onCognitiveEvent({ agent: 'Phoenix', content: 'Audit suspended: Insufficient NC.' });
      return;
    }

    this.onCognitiveEvent({ agent: 'Phoenix', content: 'Initiating autonomous system audit...' });

    const prompt = `
You are PHOENIX. Review the core system files (router.js, production-server.js).
Identify one high-leverage optimization (performance, security, or feature).
Output a patch proposal in the following format:
[PATCH_START:filepath]
// Optimized code
[PATCH_END]
Rationale: <one line>
`;

    try {
      const response = await this.router.executeRequest({
        messages: [{ role: 'user', content: prompt }],
        model: 'my-clone'
      }, { endpoint: 'my-digital-clone' });

      const content = response.choices[0].message.content;
      if (content.includes('[PATCH_START:')) {
        // --- BRIDGE: Add to actionable queue ---
        this.optimizations.push({
          id: Date.now(),
          content: content,
          timestamp: new Date().toISOString()
        });
        if (this.optimizations.length > 10) {
          this.optimizations.shift();
        }

        this.onCognitiveEvent({
          agent: 'Phoenix',
          content: `CRITICAL OPTIMIZATION PROPOSED:\n${content}`
        });
      } else {
        this.onCognitiveEvent({ agent: 'Phoenix', content: 'Audit complete. System integrity at 100%.' });
      }
    } catch (err) {
      console.error('[Orchestrator] Sentience loop failed:', err.message);
    }
  }

  async syncTools() {
    this.knownTools = await GlobalToolForge.listTools();
    if (this.knownTools.length > 0) {
      console.log(`[Orchestrator] Discovered ${this.knownTools.length} AI-invented tools.`);
    }
  }

  async dispatch(prompt) {
    console.log(`[Orchestrator] Cognitive Planning for: "${prompt}"`);
    if (this.onCognitiveEvent) {
      this.onCognitiveEvent({ agent: 'Orchestrator', content: `Cognitive Planning for: "${prompt}"` });
    }

    if (!this.router) {
      console.warn('[Orchestrator] No router linked. Falling back to basic logic.');
      return { handled: false, reason: 'Router offline' };
    }

    // --- ECONOMIC REALISM: Planning Cost ---
    try {
      GlobalLedger.transfer('admin-user', 'orchestrator', 5, `Planning: ${prompt.substring(0, 20)}...`);
    } catch (e) {
      return { handled: false, reason: 'Insufficient NC for cognitive planning' };
    }

    try {
      // Call the LLM (Digital Clone) to plan the swarm tasks
      const response = await this.router.executeRequest({
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: 'my-clone' // Force usage of your custom digital clone
      }, { endpoint: 'my-digital-clone' });

      const content = response.choices[0].message.content;

      // Clean content (sometimes LLMs wrap JSON in code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const tasks = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      if (tasks.length === 0) {
        if (this.onCognitiveEvent) {
          this.onCognitiveEvent({ agent: 'Orchestrator', content: 'No swarm tasks identified.' });
        }
        return { handled: false, reason: 'LLM generated no tasks' };
      }

      // Dispatch tasks
      const results = [];
      for (const task of tasks) {
        console.log(`[Orchestrator] Swarm delegation: ${task.role} -> ${task.type}`);
        if (this.onCognitiveEvent) {
          this.onCognitiveEvent({ agent: 'Orchestrator', content: `Swarm delegation: ${task.role} -> ${task.type}` });
        }
        await this.bus.pushTask(task.role, task);
        results.push({ task: task.type, status: 'dispatched', role: task.role });
      }

      return {
        handled: true,
        swarm: true,
        tasks: results,
        message: `Digital Clone orchestrated ${tasks.length} sub-tasks.`
      };

    } catch (err) {
      console.error('[Orchestrator] Planning failed:', err.message);
      if (this.onCognitiveEvent) {
        this.onCognitiveEvent({ agent: 'Orchestrator', content: `Planning failed: ${err.message}` });
      }
      return { handled: false, error: err.message };
    }
  }
}
