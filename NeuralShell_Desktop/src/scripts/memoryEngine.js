(function(globalObj) {
  "use strict";

  // --- NPY Parser (Pure JS) ---
  // Reads NumPy .npy files (Float32 arrays) directly into JS TypedArrays
  class NpyParser {
    static parse(buffer) {
      const view = new DataView(buffer);
      
      // 1. Magic String Check ("\x93NUMPY")
      if (view.getUint8(0) !== 0x93 || 
          String.fromCharCode(view.getUint8(1), view.getUint8(2), view.getUint8(3), view.getUint8(4), view.getUint8(5)) !== 'NUMPY') {
        throw new Error("Invalid NPY file: Missing magic string");
      }

      // 2. Read Header
      const headerLen = view.getUint16(8, true); // Little endian
      const headerStr = new TextDecoder("ascii").decode(buffer.slice(10, 10 + headerLen));
      
      // 3. Parse Metadata (Naive regex parse for speed/safety vs eval)
      const shapeMatch = headerStr.match(/'shape': \(([^)]+)\)/);
      const descrMatch = headerStr.match(/'descr': '([^']+)'/);
      
      if (!shapeMatch || !descrMatch) throw new Error("Failed to parse NPY header");
      
      const dims = shapeMatch[1].split(',').map(d => parseInt(d.trim())).filter(n => !isNaN(n));
      const dtype = descrMatch[1];
      
      if (!dtype.includes('f4')) throw new Error("Memory Engine only supports Float32 (.f4) vectors");

      // 4. Create Float32Array
      const dataOffset = 10 + headerLen;
      // Ensure 4-byte alignment if needed, but usually we just slice
      const floatData = new Float32Array(buffer.slice(dataOffset));
      
      return {
        dims: dims,
        data: floatData
      };
    }
  }

  // --- Vector Search Engine ---
  class MemoryEngine {
    constructor() {
      this.vectors = null; // Float32Array (flat)
      this.metadata = [];  // Array of objects
      this.dim = 0;
      this.count = 0;
      this.isLoaded = false;
    }

    async load(indexStats) {
        // In a real local setup, we'd use the file system API to read these.
        // For the browser environment simulation, we assume these are loaded into memory 
        // or fetched from the local server.
        console.log("[MemoryEngine] Initialized. Ready to load vectors.");
        this.isLoaded = true;
    }

    // Since we are in Electron renderer, we rely on the main process to read files.
    // This function accepts the raw ArrayBuffers.
    ingest(vectorBuffer, metaText) {
      try {
        console.log("[MemoryEngine] Parsing vectors...");
        const parsed = NpyParser.parse(vectorBuffer);
        this.vectors = parsed.data;
        this.count = parsed.dims[0];
        this.dim = parsed.dims[1];
        
        console.log(`[MemoryEngine] Loaded ${this.count} vectors of dimension ${this.dim}`);

        console.log("[MemoryEngine] Parsing metadata...");
        const lines = metaText.split('
');
        this.metadata = [];
        for (const line of lines) {
            if (line.trim()) {
                try {
                    this.metadata.push(JSON.parse(line));
                } catch(e) { /* skip bad lines */ }
            }
        }
        console.log(`[MemoryEngine] Loaded ${this.metadata.length} metadata entries.`);
        return { success: true, count: this.count };
      } catch (err) {
        console.error("[MemoryEngine] Ingest failed:", err);
        return { success: false, error: err.message };
      }
    }

    // Cosine Similarity
    search(queryVector, topK = 5) {
      if (!this.vectors || !this.isLoaded) return [];

      // 1. Normalize Query
      const qNorm = this.magnitude(queryVector);
      if (qNorm === 0) return [];

      const scores = [];
      
      // 2. Brute Force Scan (Fast enough for <100k vectors in JS)
      for (let i = 0; i < this.count; i++) {
        let dot = 0;
        let vNormSq = 0;
        
        const offset = i * this.dim;
        for (let j = 0; j < this.dim; j++) {
          const val = this.vectors[offset + j];
          dot += val * queryVector[j];
          vNormSq += val * val;
        }
        
        const similarity = dot / (Math.sqrt(vNormSq) * qNorm);
        scores.push({ index: i, score: similarity });
      }

      // 3. Sort and Retrieve
      scores.sort((a, b) => b.score - a.score);
      const top = scores.slice(0, topK);

      return top.map(match => ({
        ...this.metadata[match.index],
        score: match.score
      }));
    }

    magnitude(vec) {
      let sum = 0;
      for (let v of vec) sum += v * v;
      return Math.sqrt(sum);
    }
  }

  globalObj.NeuralMemoryEngine = new MemoryEngine();

})(window);
