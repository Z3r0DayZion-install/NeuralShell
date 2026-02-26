import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Vector Memory System
 *
 * Provides semantic storage and retrieval for the Router's Long-Term Memory.
 * Uses a simplified TF-IDF + Cosine Similarity approach for portability,
 * eliminating the need for external vector DBs or heavy Python dependencies.
 */
export class VectorMemory {
  constructor(options = {}) {
    this.storagePath = options.storagePath || './state/memory_vector_store.json';
    this.dimension = options.dimension || 384; // Simulated dimension
    this.documents = [];
    this.isDirty = false;

    // Auto-save interval
    setInterval(() => this.save(), 5000);
  }

  async initialize() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = fs.readFileSync(this.storagePath, 'utf8');
        this.documents = JSON.parse(data);
        console.log(`[VectorMemory] Loaded ${this.documents.length} memories.`);
      }
    } catch (err) {
      console.warn('[VectorMemory] Failed to load memory:', err.message);
      this.documents = [];
    }
  }

  /**
   * Calculate a simplified embedding (Sparse Vector / Bag of Words hash)
   * In a real production system, this would call an Embedding Model (OpenAI/HuggingFace).
   */
  simulateEmbedding(text) {
    // Simple hashing simulation for "semantic" signature
    // Real implementation would use: await openai.embeddings.create({ input: text })
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = new Set(words);
    return Array.from(uniqueWords);
  }

  calculateSimilarity(queryTags, docTags) {
    // Jaccard Similarity for set comparison (fast and effective for simple RAG)
    const intersection = queryTags.filter(x => docTags.includes(x));
    const union = new Set([...queryTags, ...docTags]);
    return intersection.length / union.size;
  }

  async add(text, metadata = {}) {
    const id = crypto.randomUUID();
    const tags = this.simulateEmbedding(text);

    const doc = {
      id,
      text,
      tags, // Storing "embedding"
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString()
      }
    };

    this.documents.push(doc);
    this.isDirty = true;
    return id;
  }

  async search(query, limit = 3, threshold = 0.1) {
    const queryTags = this.simulateEmbedding(query);

    const results = this.documents.map(doc => {
      const score = this.calculateSimilarity(queryTags, doc.tags);
      return { ...doc, score };
    });

    return results
      .filter(r => r.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async save() {
    if (!this.isDirty) {
      return;
    }
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.storagePath, JSON.stringify(this.documents, null, 2));
      this.isDirty = false;
      // console.log('[VectorMemory] Saved state.');
    } catch (err) {
      console.error('[VectorMemory] Save failed:', err.message);
    }
  }

  getStats() {
    return {
      documents: this.documents.length,
      storagePath: this.storagePath
    };
  }
}
