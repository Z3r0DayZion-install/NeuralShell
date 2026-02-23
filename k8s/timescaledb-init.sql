-- TimescaleDB initialization for NeuralShell Intelligence Layer
-- This script sets up the time-series database for metrics storage

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create metrics table with 1-second granularity
CREATE TABLE IF NOT EXISTS metrics (
    time TIMESTAMPTZ NOT NULL,
    metric_name TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    tags JSONB,
    component TEXT,
    region TEXT
);

-- Convert to hypertable with 1-day chunks
SELECT create_hypertable('metrics', 'time', if_not_exists => TRUE, chunk_time_interval => INTERVAL '1 day');

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_metrics_name_time ON metrics (metric_name, time DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_component_time ON metrics (component, time DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_tags ON metrics USING GIN (tags);

-- Create continuous aggregate for 1-minute downsampling (after 90 days)
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics_1min
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', time) AS bucket,
    metric_name,
    component,
    region,
    AVG(value) AS avg_value,
    MIN(value) AS min_value,
    MAX(value) AS max_value,
    COUNT(*) AS count
FROM metrics
GROUP BY bucket, metric_name, component, region
WITH NO DATA;

-- Create continuous aggregate for 1-hour downsampling (after 1 year)
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics_1hour
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    metric_name,
    component,
    region,
    AVG(value) AS avg_value,
    MIN(value) AS min_value,
    MAX(value) AS max_value,
    COUNT(*) AS count
FROM metrics
GROUP BY bucket, metric_name, component, region
WITH NO DATA;

-- Add refresh policies for continuous aggregates
SELECT add_continuous_aggregate_policy('metrics_1min',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE);

SELECT add_continuous_aggregate_policy('metrics_1hour',
    start_offset => INTERVAL '7 days',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day',
    if_not_exists => TRUE);

-- Add compression policy (compress data older than 7 days)
SELECT add_compression_policy('metrics', INTERVAL '7 days', if_not_exists => TRUE);

-- Add retention policy (drop raw data older than 90 days, keep aggregates)
SELECT add_retention_policy('metrics', INTERVAL '90 days', if_not_exists => TRUE);

-- Create decision quality scores table
CREATE TABLE IF NOT EXISTS decision_quality_scores (
    time TIMESTAMPTZ NOT NULL,
    event_id TEXT NOT NULL,
    decision_type TEXT NOT NULL,
    component TEXT NOT NULL,
    quality_score DOUBLE PRECISION NOT NULL CHECK (quality_score >= 0 AND quality_score <= 100),
    effectiveness_score DOUBLE PRECISION,
    response_time_score DOUBLE PRECISION,
    cost_impact_score DOUBLE PRECISION,
    metadata JSONB
);

-- Convert to hypertable
SELECT create_hypertable('decision_quality_scores', 'time', if_not_exists => TRUE, chunk_time_interval => INTERVAL '1 day');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quality_scores_type_time ON decision_quality_scores (decision_type, time DESC);
CREATE INDEX IF NOT EXISTS idx_quality_scores_component_time ON decision_quality_scores (component, time DESC);
CREATE INDEX IF NOT EXISTS idx_quality_scores_event_id ON decision_quality_scores (event_id);

-- Add compression policy
SELECT add_compression_policy('decision_quality_scores', INTERVAL '7 days', if_not_exists => TRUE);

-- Create cost tracking table
CREATE TABLE IF NOT EXISTS request_costs (
    time TIMESTAMPTZ NOT NULL,
    request_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    user_id TEXT,
    region TEXT NOT NULL,
    compute_cost DOUBLE PRECISION NOT NULL,
    storage_cost DOUBLE PRECISION NOT NULL,
    network_cost DOUBLE PRECISION NOT NULL,
    api_cost DOUBLE PRECISION NOT NULL,
    total_cost DOUBLE PRECISION NOT NULL,
    metadata JSONB
);

-- Convert to hypertable
SELECT create_hypertable('request_costs', 'time', if_not_exists => TRUE, chunk_time_interval => INTERVAL '1 day');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_costs_endpoint_time ON request_costs (endpoint, time DESC);
CREATE INDEX IF NOT EXISTS idx_costs_user_time ON request_costs (user_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_costs_region_time ON request_costs (region, time DESC);

-- Add compression policy
SELECT add_compression_policy('request_costs', INTERVAL '7 days', if_not_exists => TRUE);

-- Create prediction accuracy tracking table
CREATE TABLE IF NOT EXISTS prediction_accuracy (
    time TIMESTAMPTZ NOT NULL,
    prediction_id TEXT NOT NULL,
    prediction_type TEXT NOT NULL,
    predicted_value DOUBLE PRECISION NOT NULL,
    actual_value DOUBLE PRECISION,
    error DOUBLE PRECISION,
    confidence DOUBLE PRECISION,
    metadata JSONB
);

-- Convert to hypertable
SELECT create_hypertable('prediction_accuracy', 'time', if_not_exists => TRUE, chunk_time_interval => INTERVAL '1 day');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prediction_type_time ON prediction_accuracy (prediction_type, time DESC);
CREATE INDEX IF NOT EXISTS idx_prediction_id ON prediction_accuracy (prediction_id);

-- Add compression policy
SELECT add_compression_policy('prediction_accuracy', INTERVAL '7 days', if_not_exists => TRUE);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO neuralshell;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO neuralshell;
