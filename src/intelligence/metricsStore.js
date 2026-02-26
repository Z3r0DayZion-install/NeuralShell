/**
 * Metrics Store Client
 *
 * Provides a client for ingesting and querying time-series metrics from TimescaleDB.
 * Supports 1-second granularity, batch ingestion, and automatic downsampling.
 *
 * Requirements: 50.1, 50.2, 50.3, 50.4, 50.5
 */

import pg from 'pg';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

const { Pool } = pg;
const tracer = trace.getTracer('neuralshell-metrics-store');

/**
 * Metric Data Point
 * @typedef {Object} MetricPoint
 * @property {Date|number} time - Timestamp
 * @property {string} metric_name - Metric name
 * @property {number} value - Metric value
 * @property {Object} [tags] - Optional tags
 * @property {string} [component] - System component
 * @property {string} [region] - Region
 */

/**
 * Metrics Store Client
 */
export class MetricsStoreClient {
  constructor(config = {}) {
    this.config = {
      host: config.host || process.env.TIMESCALE_HOST || 'localhost',
      port: config.port || process.env.TIMESCALE_PORT || 5432,
      database: config.database || process.env.TIMESCALE_DB || 'neuralshell_metrics',
      user: config.user || process.env.TIMESCALE_USER || 'neuralshell',
      password: config.password || process.env.TIMESCALE_PASSWORD || 'neuralshell_dev_password',
      max: config.max || 20, // Max connections in pool
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
      ...config
    };

    this.pool = null;
    this.connected = false;
    this.metrics = {
      pointsIngested: 0,
      ingestErrors: 0,
      queriesExecuted: 0,
      queryErrors: 0
    };
  }

  /**
   * Connect to TimescaleDB
   */
  async connect() {
    if (this.connected) {
      return;
    }

    const span = tracer.startSpan('metricsStore.connect');

    try {
      this.pool = new Pool(this.config);

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.connected = true;

      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.end();
      throw new Error(`Failed to connect to TimescaleDB: ${error.message}`);
    }
  }

  /**
   * Disconnect from TimescaleDB
   */
  async disconnect() {
    if (!this.connected || !this.pool) {
      return;
    }

    try {
      await this.pool.end();
      this.connected = false;
    } catch (error) {
      console.error('Error disconnecting from TimescaleDB:', error);
    }
  }

  /**
   * Ingest a single metric point
   *
   * @param {MetricPoint} point - Metric data point
   * @returns {Promise<void>}
   */
  async ingestMetric(point) {
    if (!this.connected) {
      await this.connect();
    }

    const span = tracer.startSpan('metricsStore.ingestMetric', {
      attributes: {
        'metric.name': point.metric_name,
        'metric.component': point.component
      }
    });

    try {
      this.validateMetricPoint(point);

      const time = point.time instanceof Date ? point.time : new Date(point.time);
      const tags = point.tags ? JSON.stringify(point.tags) : null;

      await this.pool.query(
        `INSERT INTO metrics (time, metric_name, value, tags, component, region)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [time, point.metric_name, point.value, tags, point.component, point.region]
      );

      this.metrics.pointsIngested++;

      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
    } catch (error) {
      this.metrics.ingestErrors++;

      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.end();

      throw new Error(`Failed to ingest metric: ${error.message}`);
    }
  }

  /**
   * Ingest multiple metric points in a batch
   *
   * @param {Array<MetricPoint>} points - Array of metric data points
   * @returns {Promise<void>}
   */
  async ingestBatch(points) {
    if (!this.connected) {
      await this.connect();
    }

    if (points.length === 0) {
      return;
    }

    const span = tracer.startSpan('metricsStore.ingestBatch', {
      attributes: {
        'batch.size': points.length
      }
    });

    const client = await this.pool.connect();

    try {
      // Use COPY for high-throughput batch ingestion
      const values = points.map(point => {
        this.validateMetricPoint(point);
        const time = point.time instanceof Date ? point.time : new Date(point.time);
        const tags = point.tags ? JSON.stringify(point.tags) : null;
        return `('${time.toISOString()}','${point.metric_name}',${point.value},'${tags}','${point.component || ''}','${point.region || ''}')`;
      }).join(',');

      await client.query(
        `INSERT INTO metrics (time, metric_name, value, tags, component, region)
         VALUES ${values}`
      );

      this.metrics.pointsIngested += points.length;

      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
    } catch (error) {
      this.metrics.ingestErrors += points.length;

      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.end();

      throw new Error(`Failed to ingest batch: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Query metrics with time range and filters
   *
   * @param {Object} query - Query parameters
   * @param {string} query.metric_name - Metric name
   * @param {Date} query.start_time - Start time
   * @param {Date} query.end_time - End time
   * @param {string} [query.component] - Filter by component
   * @param {string} [query.region] - Filter by region
   * @param {string} [query.aggregation] - Aggregation function (avg, sum, min, max, count)
   * @param {string} [query.interval] - Time bucket interval (e.g., '1 minute', '1 hour')
   * @returns {Promise<Array>} Query results
   */
  async queryMetrics(query) {
    if (!this.connected) {
      await this.connect();
    }

    const span = tracer.startSpan('metricsStore.queryMetrics', {
      attributes: {
        'query.metric_name': query.metric_name,
        'query.aggregation': query.aggregation || 'none'
      }
    });

    try {
      const params = [query.metric_name, query.start_time, query.end_time];
      let paramIndex = 4;

      let sql = '';

      if (query.aggregation && query.interval) {
        // Aggregated query with time bucketing
        const aggFunc = this.getAggregationFunction(query.aggregation);
        sql = `
          SELECT 
            time_bucket($${paramIndex}::interval, time) AS bucket,
            ${aggFunc}(value) AS value,
            component,
            region
          FROM metrics
          WHERE metric_name = $1
            AND time >= $2
            AND time <= $3
        `;
        params.push(query.interval);
        paramIndex++;
      } else {
        // Raw query
        sql = `
          SELECT time, value, component, region, tags
          FROM metrics
          WHERE metric_name = $1
            AND time >= $2
            AND time <= $3
        `;
      }

      // Add filters
      if (query.component) {
        sql += ` AND component = $${paramIndex}`;
        params.push(query.component);
        paramIndex++;
      }

      if (query.region) {
        sql += ` AND region = $${paramIndex}`;
        params.push(query.region);
        paramIndex++;
      }

      // Add grouping for aggregated queries
      if (query.aggregation && query.interval) {
        sql += ' GROUP BY bucket, component, region';
      }

      sql += ' ORDER BY time DESC';

      // Add limit
      if (query.limit) {
        sql += ` LIMIT $${paramIndex}`;
        params.push(query.limit);
      }

      const result = await this.pool.query(sql, params);

      this.metrics.queriesExecuted++;

      span.setAttribute('query.rows_returned', result.rows.length);
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      return result.rows;
    } catch (error) {
      this.metrics.queryErrors++;

      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.end();

      throw new Error(`Failed to query metrics: ${error.message}`);
    }
  }

  /**
   * Calculate percentiles for a metric
   *
   * @param {Object} query - Query parameters
   * @param {string} query.metric_name - Metric name
   * @param {Date} query.start_time - Start time
   * @param {Date} query.end_time - End time
   * @param {Array<number>} query.percentiles - Percentiles to calculate (e.g., [50, 95, 99])
   * @param {string} [query.component] - Filter by component
   * @returns {Promise<Object>} Percentile values
   */
  async calculatePercentiles(query) {
    if (!this.connected) {
      await this.connect();
    }

    const span = tracer.startSpan('metricsStore.calculatePercentiles');

    try {
      const percentiles = query.percentiles || [50, 95, 99];
      const percentileSelects = percentiles.map(p =>
        `percentile_cont(${p / 100}) WITHIN GROUP (ORDER BY value) AS p${p}`
      ).join(', ');

      const params = [query.metric_name, query.start_time, query.end_time];
      let sql = `
        SELECT ${percentileSelects}
        FROM metrics
        WHERE metric_name = $1
          AND time >= $2
          AND time <= $3
      `;

      if (query.component) {
        sql += ' AND component = $4';
        params.push(query.component);
      }

      const result = await this.pool.query(sql, params);

      this.metrics.queriesExecuted++;

      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      return result.rows[0] || {};
    } catch (error) {
      this.metrics.queryErrors++;

      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.end();

      throw new Error(`Failed to calculate percentiles: ${error.message}`);
    }
  }

  /**
   * Get aggregation function SQL
   * @param {string} aggregation - Aggregation type
   * @returns {string} SQL function
   */
  getAggregationFunction(aggregation) {
    const functions = {
      'avg': 'AVG',
      'sum': 'SUM',
      'min': 'MIN',
      'max': 'MAX',
      'count': 'COUNT',
      'rate': 'AVG' // Rate is calculated as average over time
    };

    return functions[aggregation] || 'AVG';
  }

  /**
   * Validate metric point
   * @param {MetricPoint} point - Metric point to validate
   * @throws {Error} If point is invalid
   */
  validateMetricPoint(point) {
    if (!point.metric_name) {
      throw new Error('metric_name is required');
    }

    if (typeof point.value !== 'number') {
      throw new Error('value must be a number');
    }

    if (isNaN(point.value) || !isFinite(point.value)) {
      throw new Error('value must be a finite number');
    }

    if (!point.time) {
      throw new Error('time is required');
    }
  }

  /**
   * Get client metrics
   * @returns {Object} Metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      connected: this.connected
    };
  }

  /**
   * Health check
   * @returns {Promise<boolean>} True if healthy
   */
  async healthCheck() {
    try {
      if (!this.connected) {
        return false;
      }

      const result = await this.pool.query('SELECT NOW()');
      return result.rows.length > 0;
    } catch (error) {
      console.error('Metrics Store health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
let metricsStoreInstance = null;

/**
 * Get or create Metrics Store client instance
 * @param {Object} config - Configuration
 * @returns {MetricsStoreClient} Metrics Store client
 */
export function getMetricsStore(config) {
  if (!metricsStoreInstance) {
    metricsStoreInstance = new MetricsStoreClient(config);
  }
  return metricsStoreInstance;
}

export default MetricsStoreClient;
