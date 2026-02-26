/**
 * Database Graph Mapper
 *
 * Generates graph data for 3D visualization by querying pgvector.
 * Automatically identifies clusters based on semantic similarity.
 */
export class GraphMapper {
  constructor(databaseMemory) {
    this.memory = databaseMemory;
  }

  async generateGraph() {
    // 1. Fetch latest 100 memories
    const query = `
      SELECT id, text, metadata, embedding::text
      FROM memories
      ORDER BY created_at DESC
      LIMIT 100
    `;
    const res = await this.memory.pool.query(query);
    const docs = res.rows;

    const nodes = docs.map(doc => ({
      id: doc.id,
      name: doc.text.substring(0, 30) + '...',
      fullText: doc.text,
      group: doc.metadata?.source || 'api',
      val: 1
    }));

    const links = [];

    // 2. Compute similarity for visualization
    // We parse the embedding text back to arrays for comparison
    const parseVector = (v) => JSON.parse(v);

    for (let i = 0; i < docs.length; i++) {
      const v1 = parseVector(docs[i].embedding);
      for (let j = i + 1; j < docs.length; j++) {
        const v2 = parseVector(docs[j].embedding);
        const score = this.cosineSimilarity(v1, v2);

        if (score > 0.75) { // Strict threshold for high-fidelity graph
          links.push({
            source: docs[i].id,
            target: docs[j].id,
            value: score
          });
        }
      }
    }

    return { nodes, links };
  }

  cosineSimilarity(v1, v2) {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    for (let i = 0; i < v1.length; i++) {
      dotProduct += v1[i] * v2[i];
      mag1 += v1[i] * v1[i];
      mag2 += v2[i] * v2[i];
    }
    return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
  }
}
