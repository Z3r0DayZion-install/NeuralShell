-- Event Indexes initialization for Decision Event querying
-- This script sets up secondary indexes for efficient querying of decision events

-- Create decision events index table
CREATE TABLE IF NOT EXISTS decision_event_indexes (
    event_id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    decision_type TEXT NOT NULL,
    system_component TEXT NOT NULL,
    outcome_status TEXT NOT NULL,
    trace_id TEXT NOT NULL,
    span_id TEXT NOT NULL,
    quality_score DOUBLE PRECISION,
    event_data JSONB NOT NULL,
    indexed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_decision_type_time ON decision_event_indexes (decision_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_component_time ON decision_event_indexes (system_component, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_outcome_time ON decision_event_indexes (outcome_status, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_timestamp ON decision_event_indexes (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trace_id ON decision_event_indexes (trace_id);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_type_component_time ON decision_event_indexes (decision_type, system_component, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_type_outcome_time ON decision_event_indexes (decision_type, outcome_status, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_component_outcome_time ON decision_event_indexes (system_component, outcome_status, timestamp DESC);

-- Create GIN index for JSONB event_data for flexible querying
CREATE INDEX IF NOT EXISTS idx_event_data_gin ON decision_event_indexes USING GIN (event_data);

-- Grant permissions
GRANT ALL PRIVILEGES ON decision_event_indexes TO neuralshell;
