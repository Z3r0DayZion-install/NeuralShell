import { Plugin } from '../router/pluginSystem.js';

export class SentimentPlugin extends Plugin {
  constructor() {
    super({
      name: 'sentiment-analyzer',
      version: '1.0.0',
      description: 'Analyzes prompt sentiment and injects metadata',
      priority: 90
    });

    // Simple word lists for demonstration
    this.negativeWords = new Set(['bad', 'angry', 'terrible', 'fail', 'hate', 'stupid', 'broken', 'slow']);
    this.positiveWords = new Set(['good', 'great', 'excellent', 'love', 'fast', 'amazing', 'thanks']);
  }

  async initialize(router) {
    console.log('[SentimentPlugin] Initialized');

    // Register middleware to intercept requests
    router.pluginManager.addMiddleware({
      name: 'sentiment-analysis',
      priority: 90,
      handler: async (context, type) => {
        if (type === 'request' && context.body && context.body.messages) {
          this.analyzeSentiment(context);
        }
        return true;
      }
    });

    return super.initialize(router);
  }

  analyzeSentiment(context) {
    const messages = context.body.messages;
    const lastMessage = messages[messages.length - 1].content.toLowerCase();

    let score = 0;
    const words = lastMessage.split(/\s+/);

    for (const word of words) {
      if (this.negativeWords.has(word)) {
        score--;
      }
      if (this.positiveWords.has(word)) {
        score++;
      }
    }

    let sentiment = 'neutral';
    if (score > 0) {
      sentiment = 'positive';
    }
    if (score < 0) {
      sentiment = 'negative';
    }

    // Inject into headers for downstream processing/logging
    if (!context.headers) {
      context.headers = {};
    }
    context.headers['x-sentiment'] = sentiment;
    context.headers['x-sentiment-score'] = String(score);

    // Inject into the request body context so models can see it (optional)
    // context.body.metadata = { ...context.body.metadata, sentiment };

    console.log(`[SentimentPlugin] Detected ${sentiment} sentiment (score: ${score})`);
  }
}
