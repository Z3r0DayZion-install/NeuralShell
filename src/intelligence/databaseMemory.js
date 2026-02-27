import pg from 'pg';
import crypto from 'crypto';

/**
 * DatabaseMemory System (pgvector)
 *
 * Replaces the JSON VectorMemory with a production-grade PostgreSQL backend.
 * Enables persistence, scalability, and sub-millisecond semantic search.
 */
export class DatabaseMemory {
  constructor(options = {}) {
    const connectionString = options.connectionString
      || process.env.DATABASE_URL
      || 'postgres://neuralshell:CHANGE_ME_NOW@localhost:5432/neuralshell_events';
    this.pool = new pg.Pool({
      connectionString
    });
  }

  async initialize() {
    console.log('[DatabaseMemory] Initializing schema...');
    const client = await this.pool.connect();
    try {
      // 1. Enable pgvector
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');

      // 2. Create Memories table
      await client.query(`
        CREATE TABLE IF NOT EXISTS memories (
          id UUID PRIMARY KEY,
          text TEXT NOT NULL,
          embedding vector(384), -- Dimension for standard local models
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 3. Create Index for fast search
      await client.query('CREATE INDEX IF NOT EXISTS mem_search_idx ON memories USING hnsw (embedding vector_cosine_ops)');

      console.log('[DatabaseMemory] Schema ready.');
    } finally {
      client.release();
    }
  }

  async add(text, embedding, metadata = {}) {
    const id = crypto.randomUUID(); // Note: needs crypto import or passed id
    const query = 'INSERT INTO memories (id, text, embedding, metadata) VALUES ($1, $2, $3, $4)';
    // pgvector expects strings like '[1,2,3]'
    const vectorStr = `[${embedding.join(',')}]`;
    await this.pool.query(query, [id, text, vectorStr, JSON.stringify(metadata)]);
    return id;
  }

  async search(embedding, limit = 5) {
    const vectorStr = `[${embedding.join(',')}]`;
    const query = `
      SELECT id, text, metadata, 1 - (embedding <=> $1) AS score
      FROM memories
      ORDER BY score DESC
      LIMIT $2
    `;
    const res = await this.pool.query(query, [vectorStr, limit]);
    return res.rows;
  }

  async getStats() {
    const res = await this.pool.query('SELECT count(*) FROM memories');
    return { documents: parseInt(res.rows[0].count) };
  }
}
