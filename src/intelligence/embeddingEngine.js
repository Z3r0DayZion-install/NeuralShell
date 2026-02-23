/**
 * EmbeddingEngine
 * 
 * Generates high-quality vector embeddings locally using ONNX runtime.
 * Ensures that private text never leaves the secure NeuralShell boundary
 * for the purpose of vectorization.
 */
export class EmbeddingEngine {
  constructor(modelName = 'Xenova/all-MiniLM-L6-v2') {
    this.modelName = modelName;
    this.extractor = null;
  }

  async initialize() {
    console.log(`[EmbeddingEngine] Loading local model from: ./models/${this.modelName}...`);
    
    // Configure transformers to be strictly local
    const { pipeline, env } = await import('@xenova/transformers');
    env.allowRemoteModels = false;
    env.localModelPath = './models';

    this.extractor = await pipeline('feature-extraction', this.modelName, {
      local_files_only: true
    });
    console.log('[EmbeddingEngine] Sovereign local intelligence active.');
  }

  async generate(text) {
    if (!this.extractor) await this.initialize();
    
    const output = await this.extractor(text, { pooling: 'mean', normalize: true });
    // Convert Float32Array to standard JS array
    return Array.from(output.data);
  }
}
