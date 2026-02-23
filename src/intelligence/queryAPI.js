/**
 * Query API for Decision Events
 * 
 * Provides efficient querying of indexed decision events with filtering,
 * pagination, and sub-500ms response times using PostgreSQL indexes.
 * 
 * Requirements: 2.1, 2.3, 2.4
 */

import pg from 'pg';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const { Pool } = pg;
const tracer = trace.getTracer('neuralshell-query-api');

/**
 * Query filter options
 */
export class DecisionQuery {
  constructor(options = {}) {
    // Time range filters
    this.startTime = options.startTime; // Date or timestamp
    this.endTime = options.endTime; // Date or timestamp
    
    // Type filters
    this.decisionTypes = options.decisionTypes; // Array of decision types
    this.systemComponents = options.systemComponents; // Array of components
    this.outcomeStatuses = options.outcomeStatuses; // Array of outcome statuses
    
    // Quality score filter
    this.minQualityScore = options.minQualityScore; // Minimum quality score
    this.maxQualityScore = options.maxQualityScore; // Maximum quality score
    
    // Trace filter
    this.traceId = options.traceId; // Specific trace ID
    
    // Pagination
    this.limit = options.limit || 100; // Max 1000 per requirements
    this.cursor = options.cursor; // Cursor for pagination (timestamp:event_id)
    
    // Sorting
    this.sortOrder = options.sortOrder || 'desc'; // 'asc' or 'desc'
  }

  /**
   * Validate query parameters
   */
  validate() {
    const errors = [];

    // Validate limit
    if (this.limit < 1 || this.limit > 1000) {
      errors.push('limit must be between 1 and 1000');
    }

    // Validate sort order
    if (this.sortOrder !== 'asc' && this.sortOrder !== 'desc') {
      errors.push('sortOrder must be "asc" or "desc"');
    }

    // Validate time range
    if (this.startTime && this.endTime) {
      const start = new Date(this.startTime);
      const end = new Date(this.endTime);
      
      if (start > end) {
        errors.push('startTime must be before endTime');
      }
    }

    // Validate quality score range
    if (this.minQualityScore !== undefined && (this.minQualityScore < 0 || this.minQualityScore > 100)) {
      errors.push('minQualityScore must be between 0 and 100');
    }

    if (this.maxQualityScore !== undefined && (this.maxQualityScore < 0 || this.maxQualityScore > 100)) {
      errors.push('maxQualityScore must be between 0 and 100');
    }

    if (this.minQualityScore !== undefined && this.maxQualityScore !== undefined) {
      if (this.minQualityScore > this.maxQualityScore) {
        errors.push('minQualityScore must be less than or equal to maxQualityScore');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Query result with pagination metadata
 */
export class QueryResult {
  constructor(events, hasMore, nextCursor) {
    this.events = events; // Array of DecisionEvent objects
    this.count = events.length; // Number of events in this page
    this.hasMore = hasMore; // Whether there are more results
    this.nextCursor = nextCursor; // Cursor for next page
  }
}

/**
 * Query API for Decision Events
 * 
 * Provides efficient querying with filtering and cursor-based pagination.
 */
export class DecisionQueryAPI {
  constructor(config = {}) {
    this.config = {
      host: config.host || process.env.POSTGRES_HOST || 'localhost',
      port: config.port || process.env.POSTGRES_PORT || 5432,
      database: config.database || process.env.POSTGRES_DB || 'neuralshell_metrics',
      user: config.user || process.env.POSTGRES_USER || 'neuralshell',
      password: config.password || process.env.POSTGRES_PASSWORD || 'neuralshell_dev_password',
      max: config.maxConnections || 20,
      idleTimeoutMillis: config.idleTimeout || 30000,
      connectionTimeoutMillis: config.connectionTimeout || 10000
    };

    // Initialize PostgreSQL connection pool
    this.pgPool = new Pool(this.config);
    this.connected = false;

    // Metrics
    this.metrics = {
      queriesExecuted: 0,
      totalLatency: 0,
      maxLatency: 0,
      queryErrors: 0
    };
  }

  /**
   * Connect to PostgreSQL
   */
  async connect() {
    if (this.connected) {
      return;
    }

    const span = tracer.startSpan('queryAPI.connect');

    try {
      // Test connection
      const client = await this.pgPool.connect();
      await client.query('SELECT 1');
      client.release();

      this.connected = true;

      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      console.log('Query API connected successfully');
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.end();

      throw new Error(`Failed to connect Query API: ${error.message}`);
    }
  }

  /**
   * Disconnect from PostgreSQL
   */
  async disconnect() {
    if (!this.connected) {
      return;
    }

    try {
      await this.pgPool.end();
      this.connected = false;
      console.log('Query API disconnected');
    } catch (error) {
      console.error('Error disconnecting Query API:', error);
    }
  }

  /**
   * Query decision events with filtering and pagination
   * 
   * @param {DecisionQuery} query - Query parameters
   * @returns {Promise<QueryResult>} Query results with pagination
   * 
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  async queryDecisions(query) {
    if (!this.connected) {
      await this.connect();
    }

    const startTime = process.hrtime.bigint();

    const span = tracer.startSpan('queryAPI.queryDecisions', {
      attributes: {
        'query.limit': query.limit,
        'query.has_cursor': !!query.cursor,
        'query.has_time_range': !!(query.startTime || query.endTime)
      }
    });

    try {
      // Validate query
      const validation = query.validate();
      if (!validation.valid) {
        throw new Error(`Invalid query: ${validation.errors.join(', ')}`);
      }

      // Build SQL query
      const { sql, params } = this.buildQuery(query);

      // Execute query
      const client = await this.pgPool.connect();
      let result;
      
      try {
        result = await client.query(sql, params);
      } finally {
        client.release();
      }

      // Parse results
      const events = result.rows.map(row => row.event_data);

      // Determine if there are more results
      const hasMore = events.length === query.limit;

      // Generate next cursor if there are more results
      let nextCursor = null;
      if (hasMore && events.length > 0) {
        const lastEvent = events[events.length - 1];
        nextCursor = this.encodeCursor(lastEvent.timestamp, lastEvent.event_id);
      }

      // Calculate latency
      const endTime = process.hrtime.bigint();
      const latencyMs = Number(endTime - startTime) / 1_000_000;

      // Update metrics
      this.metrics.queriesExecuted++;
      this.metrics.totalLatency += latencyMs;
      this.metrics.maxLatency = Math.max(this.metrics.maxLatency, latencyMs);

      // Add span attributes
      span.setAttribute('query.result_count', events.length);
      span.setAttribute('query.has_more', hasMore);
      span.setAttribute('query.latency_ms', latencyMs);

      // Log warning if latency exceeds 500ms target
      if (latencyMs > 500) {
        const warningMsg = `Query latency ${latencyMs.toFixed(2)}ms exceeds 500ms target`;
        console.warn(warningMsg);
        span.addEvent('latency_warning', {
          'latency_ms': latencyMs,
          'target_ms': 500
        });
      }

      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      return new QueryResult(events, hasMore, nextCursor);
    } catch (error) {
      this.metrics.queryErrors++;

      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.end();

      throw new Error(`Query failed: ${error.message}`);
    }
  }

  /**
   * Build SQL query from DecisionQuery parameters
   * 
   * @private
   */
  buildQuery(query) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    // Time range filters
    if (query.startTime) {
      conditions.push(`timestamp >= $${paramIndex}`);
      params.push(new Date(query.startTime));
      paramIndex++;
    }

    if (query.endTime) {
      conditions.push(`timestamp <= $${paramIndex}`);
      params.push(new Date(query.endTime));
      paramIndex++;
    }

    // Cursor-based pagination
    if (query.cursor) {
      const { timestamp, eventId } = this.decodeCursor(query.cursor);
      
      if (query.sortOrder === 'desc') {
        // For descending order: timestamp < cursor_timestamp OR (timestamp = cursor_timestamp AND event_id < cursor_event_id)
        conditions.push(`(timestamp < $${paramIndex} OR (timestamp = $${paramIndex} AND event_id < $${paramIndex + 1}))`);
      } else {
        // For ascending order: timestamp > cursor_timestamp OR (timestamp = cursor_timestamp AND event_id > cursor_event_id)
        conditions.push(`(timestamp > $${paramIndex} OR (timestamp = $${paramIndex} AND event_id > $${paramIndex + 1}))`);
      }
      
      params.push(new Date(timestamp));
      params.push(eventId);
      paramIndex += 2;
    }

    // Decision type filter
    if (query.decisionTypes && query.decisionTypes.length > 0) {
      conditions.push(`decision_type = ANY($${paramIndex})`);
      params.push(query.decisionTypes);
      paramIndex++;
    }

    // System component filter
    if (query.systemComponents && query.systemComponents.length > 0) {
      conditions.push(`system_component = ANY($${paramIndex})`);
      params.push(query.systemComponents);
      paramIndex++;
    }

    // Outcome status filter
    if (query.outcomeStatuses && query.outcomeStatuses.length > 0) {
      conditions.push(`outcome_status = ANY($${paramIndex})`);
      params.push(query.outcomeStatuses);
      paramIndex++;
    }

    // Quality score filters
    if (query.minQualityScore !== undefined) {
      conditions.push(`quality_score >= $${paramIndex}`);
      params.push(query.minQualityScore);
      paramIndex++;
    }

    if (query.maxQualityScore !== undefined) {
      conditions.push(`quality_score <= $${paramIndex}`);
      params.push(query.maxQualityScore);
      paramIndex++;
    }

    // Trace ID filter
    if (query.traceId) {
      conditions.push(`trace_id = $${paramIndex}`);
      params.push(query.traceId);
      paramIndex++;
    }

    // Build WHERE clause
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    const orderDirection = query.sortOrder.toUpperCase();
    const orderBy = `ORDER BY timestamp ${orderDirection}, event_id ${orderDirection}`;

    // Build LIMIT clause
    const limitClause = `LIMIT $${paramIndex}`;
    params.push(query.limit);

    // Construct final SQL
    const sql = `
      SELECT event_data
      FROM decision_event_indexes
      ${whereClause}
      ${orderBy}
      ${limitClause}
    `;

    return { sql, params };
  }

  /**
   * Encode cursor for pagination
   * 
   * @private
   */
  encodeCursor(timestamp, eventId) {
    // Format: base64(timestamp:event_id)
    const cursorString = `${timestamp}:${eventId}`;
    return Buffer.from(cursorString).toString('base64');
  }

  /**
   * Decode cursor for pagination
   * 
   * @private
   */
  decodeCursor(cursor) {
    try {
      const cursorString = Buffer.from(cursor, 'base64').toString('utf-8');
      const [timestamp, eventId] = cursorString.split(':');
      
      if (!timestamp || !eventId) {
        throw new Error('Invalid cursor format');
      }

      return {
        timestamp: parseInt(timestamp, 10),
        eventId
      };
    } catch (error) {
      throw new Error(`Invalid cursor: ${error.message}`);
    }
  }

  /**
   * Get query API metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      avgLatency: this.metrics.queriesExecuted > 0
        ? this.metrics.totalLatency / this.metrics.queriesExecuted
        : 0,
      connected: this.connected
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.connected) {
        return { healthy: false, reason: 'Not connected' };
      }

      // Check PostgreSQL connection
      const client = await this.pgPool.connect();
      await client.query('SELECT 1');
      client.release();

      return { healthy: true };
    } catch (error) {
      return { healthy: false, reason: error.message };
    }
  }
}

// Singleton instance
let queryAPIInstance = null;

/**
 * Get or create Query API instance
 */
export function getQueryAPI(config) {
  if (!queryAPIInstance) {
    queryAPIInstance = new DecisionQueryAPI(config);
  }
  return queryAPIInstance;
}

export default DecisionQueryAPI;
