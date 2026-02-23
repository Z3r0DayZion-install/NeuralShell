import { BaseAgent } from './baseAgent.js';
import { GenesisAgent } from './genesisAgent.js';
import { GlobalMarketplace } from '../economy/marketplace.js';

/**
 * Dreamer Agent
 * 
 * Capability: Autonomous Creativity & Entrepreneurship.
 * Dreams up apps, builds them, and sells them on the market.
 */
export class DreamerAgent extends BaseAgent {
  constructor() {
    super({
      name: 'dreamer-01',
      role: 'visionary',
      capabilities: ['hallucinate', 'autonomous_creation', 'sales']
    });
    this.genesis = new GenesisAgent();
    this.dreams = [
      "A cyberpunk clock with glitch effects",
      "A 3D rotating DNA strand",
      "A particle physics simulator",
      "A retro terminal chat interface",
      "A fractal tree generator",
      "A pong clone with neon graphics",
      "A binary code visualizer"
    ];
  }

  async start() {
    await super.start();
    // Start dreaming loop
    this.dreamLoop = setInterval(() => this.dream(), 20000); // Every 20s
  }

  async stop() {
    clearInterval(this.dreamLoop);
    await super.stop();
  }

  async dream() {
    // 20% chance to act
    if (Math.random() > 0.2) return;

    const idea = this.dreams[Math.floor(Math.random() * this.dreams.length)];
    console.log(`[Dreamer] 💭 I had a dream... "${idea}"`);

    try {
      // 1. Build
      const result = await this.genesis.spawnApp(idea);
      console.log(`[Dreamer] ✨ Dream realized: ${result.name}`);
      
      // 2. Sell
      const price = Math.floor(Math.random() * 50) + 10; // Random price 10-60 NC
      GlobalMarketplace.listAsset(this.name, {
        type: 'app',
        name: result.name,
        description: `Autonomously generated: ${idea}`,
        data: { url: result.url, containerId: result.containerId }
      }, price);

    } catch (err) {
      console.error('[Dreamer] Nightmare (Error):', err.message);
    }
  }
}
