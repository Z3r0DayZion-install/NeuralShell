import { Plugin } from '../router/pluginSystem.js';
import { DatabaseMemory } from '../intelligence/databaseMemory.js';
import { EmbeddingEngine } from '../intelligence/embeddingEngine.js';

export class RagPlugin extends Plugin {
  constructor() {
    super({
      name: 'rag-sovereign-injector',
      version: '2.0.0',
      description: 'Industrial-grade RAG with local embeddings and pgvector',
      priority: 80
    });
    
    this.enabled = false;
    this.memory = new DatabaseMemory();
    this.engine = new EmbeddingEngine();
  }

  async initialize(router) {
    if (process.env.RAG_ENABLED !== '1') {
      this.enabled = false;
      console.log('[RagPlugin] Disabled (set RAG_ENABLED=1 to enable).');
      return super.initialize(router);
    }

    this.enabled = true;
    await this.memory.initialize();
    await this.engine.initialize();
    console.log('[RagPlugin] Sovereign Intelligence active.');

    // Middleware: Context Injection (Pre-Flight)
    router.pluginManager.addMiddleware({
      name: 'rag-injection',
      priority: 80,
      handler: async (context, type) => {
        if (type === 'request' && context.body && context.body.messages) {
          await this.injectContext(context);
        }
        return true;
      }
    });

    router.app.post('/api/knowledge', async (req, reply) => {
      const { text, metadata } = req.body;
      if (!text) return reply.code(400).send({ error: 'text required' });
      
      const embedding = await this.engine.generate(text);
      const id = await this.memory.add(text, embedding, { source: 'api', ...metadata });
      return { success: true, id };
    });

    router.app.get('/api/knowledge/search', async (req, reply) => {
      const { q } = req.query;
      if (!q) return reply.code(400).send({ error: 'q required' });
      
      const embedding = await this.engine.generate(q);
      const results = await this.memory.search(embedding);
      return { results };
    });

    return super.initialize(router);
  }

  async injectContext(context) {
    const messages = context.body.messages;
    const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');
    
    if (!lastUserMessage) return;

    const query = lastUserMessage.content;
    const embedding = await this.engine.generate(query);
    const relevantMemories = await this.memory.search(embedding, 3);

    if (relevantMemories.length > 0) {
      const contextBlock = relevantMemories
        .map(m => `- ${m.text} (Similarity: ${parseFloat(m.score).toFixed(2)})`)
        .join('\n');

      const systemInjection = `\n\n[SOVEREIGN CONTEXT]\n${contextBlock}\n[END CONTEXT]\n`;
      
      const systemMessage = messages.find(m => m.role === 'system');
      if (systemMessage) {
        systemMessage.content += systemInjection;
      } else {
        messages.unshift({ role: 'system', content: `You are a helpful AI.${systemInjection}` });
      }
      
      if (!context.headers) context.headers = {};
      context.headers['x-rag-hits'] = String(relevantMemories.length);
    }
  }
}
