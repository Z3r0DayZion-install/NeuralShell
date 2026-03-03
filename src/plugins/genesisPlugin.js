import { Plugin } from '../router/pluginSystem.js';
import { GenesisAgent } from '../agents/genesisAgent.js';

export class GenesisPlugin extends Plugin {
  constructor() {
    super({
      name: 'genesis-engine',
      version: '1.0.0',
      description: 'Autonomous Software Generation & Deployment',
      priority: 100
    });
    this.agent = new GenesisAgent();
  }

  async initialize(router) {
    await this.agent.start();
    console.log('[GenesisPlugin] Engine Online.');

    // Genesis API
    router.app.post('/api/genesis/spawn', async (req, reply) => {
      const { prompt } = req.body;
      if (!prompt) return reply.code(400).send({ error: 'prompt required' });
      
      try {
        const result = await this.agent.spawnApp(prompt);
        return { success: true, deployment: result };
      } catch (err) {
        return reply.code(500).send({ error: err.message });
      }
    });

    router.app.get('/api/genesis/apps', async () => {
      return { apps: this.agent.containerManager.listActive() };
    });

    return super.initialize(router);
  }
}
