-- Event store schema for Event Sourcing
-- This should be run against the system_db

-- Create the event_store table for storing events
CREATE TABLE event_store (
    id UUID PRIMARY KEY,
    aggregate_id VARCHAR(255) NOT NULL, -- ID of the aggregate (entity) this event relates to
    aggregate_type VARCHAR(100) NOT NULL, -- Type of aggregate (e.g., 'tenant', 'user', 'billing')
    event_type VARCHAR(100) NOT NULL, -- Type of event (e.g., 'tenant.created', 'user.updated')
    event_version VARCHAR(20) NOT NULL, -- Schema version of the event
    event_data JSONB NOT NULL, -- Event payload
    metadata JSONB, -- Additional metadata about the event
    sequence_number BIGSERIAL NOT NULL, -- Global sequence number for ordering
    tenant_id VARCHAR(255), -- Optional tenant ID for tenant-specific events
    correlation_id VARCHAR(255), -- ID to correlate related events
    causation_id VARCHAR(255), -- ID of the event that caused this event
    user_id VARCHAR(255), -- ID of the user who triggered the action
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL, -- When the event occurred
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX idx_event_store_aggregate_id ON event_store(aggregate_id);
CREATE INDEX idx_event_store_aggregate_type ON event_store(aggregate_type);
CREATE INDEX idx_event_store_event_type ON event_store(event_type);
CREATE INDEX idx_event_store_tenant_id ON event_store(tenant_id);
CREATE INDEX idx_event_store_correlation_id ON event_store(correlation_id);
CREATE INDEX idx_event_store_causation_id ON event_store(causation_id);
CREATE INDEX idx_event_store_timestamp ON event_store(timestamp);
CREATE INDEX idx_event_store_sequence_number ON event_store(sequence_number);

-- Create a function to get events for a specific aggregate
CREATE OR REPLACE FUNCTION get_aggregate_events(
    p_aggregate_id VARCHAR(255),
    p_aggregate_type VARCHAR(100)
) RETURNS TABLE (
    id UUID,
    event_type VARCHAR(100),
    event_data JSONB,
    metadata JSONB,
    sequence_number BIGINT,
    timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.event_type,
        e.event_data,
        e.metadata,
        e.sequence_number,
        e.timestamp
    FROM 
        event_store e
    WHERE 
        e.aggregate_id = p_aggregate_id AND
        e.aggregate_type = p_aggregate_type
    ORDER BY 
        e.sequence_number ASC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to rebuild an aggregate state
CREATE OR REPLACE FUNCTION rebuild_aggregate_state(
    p_aggregate_id VARCHAR(255),
    p_aggregate_type VARCHAR(100)
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
    event_record RECORD;
BEGIN
    -- Initialize empty state
    result := '{}'::JSONB;
    
    -- Apply each event to build the state
    FOR event_record IN 
        SELECT * FROM get_aggregate_events(p_aggregate_id, p_aggregate_type)
    LOOP
        -- This is a simplified approach. In a real implementation, 
        -- you would have specific handling for each event type
        -- based on the aggregate type and the event's definition
        
        -- Example simplified implementation that just merges event data
        result := result || jsonb_build_object('lastEvent', event_record.event_type) || 
                  COALESCE(event_record.event_data, '{}'::JSONB);
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get events by tenant
CREATE OR REPLACE FUNCTION get_tenant_events(
    p_tenant_id VARCHAR(255),
    p_from_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_to_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_limit INTEGER DEFAULT 100
) RETURNS TABLE (
    id UUID,
    aggregate_id VARCHAR(255),
    aggregate_type VARCHAR(100),
    event_type VARCHAR(100),
    event_data JSONB,
    metadata JSONB,
    sequence_number BIGINT,
    timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.aggregate_id,
        e.aggregate_type,
        e.event_type,
        e.event_data,
        e.metadata,
        e.sequence_number,
        e.timestamp
    FROM 
        event_store e
    WHERE 
        e.tenant_id = p_tenant_id AND
        (p_from_timestamp IS NULL OR e.timestamp >= p_from_timestamp) AND
        (p_to_timestamp IS NULL OR e.timestamp <= p_to_timestamp)
    ORDER BY 
        e.sequence_number DESC
    LIMIT 
        p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create a snapshot table to optimize rebuilding large aggregates
CREATE TABLE event_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_id VARCHAR(255) NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    tenant_id VARCHAR(255),
    last_sequence_number BIGINT NOT NULL,
    state JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (aggregate_id, aggregate_type, last_sequence_number)
);

CREATE INDEX idx_event_snapshots_aggregate ON event_snapshots(aggregate_id, aggregate_type);
CREATE INDEX idx_event_snapshots_tenant_id ON event_snapshots(tenant_id);

-- Create a function to get the latest snapshot
CREATE OR REPLACE FUNCTION get_latest_snapshot(
    p_aggregate_id VARCHAR(255),
    p_aggregate_type VARCHAR(100)
) RETURNS TABLE (
    id UUID,
    last_sequence_number BIGINT,
    state JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.last_sequence_number,
        s.state,
        s.created_at
    FROM 
        event_snapshots s
    WHERE 
        s.aggregate_id = p_aggregate_id AND
        s.aggregate_type = p_aggregate_type
    ORDER BY 
        s.last_sequence_number DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create a function to rebuild state from the latest snapshot and subsequent events
CREATE OR REPLACE FUNCTION rebuild_from_snapshot(
    p_aggregate_id VARCHAR(255),
    p_aggregate_type VARCHAR(100)
) RETURNS JSONB AS $$
DECLARE
    snapshot_record RECORD;
    result JSONB;
    event_record RECORD;
BEGIN
    -- Try to get the latest snapshot
    SELECT * INTO snapshot_record FROM get_latest_snapshot(p_aggregate_id, p_aggregate_type);
    
    IF snapshot_record IS NULL THEN
        -- No snapshot, build from scratch
        RETURN rebuild_aggregate_state(p_aggregate_id, p_aggregate_type);
    END IF;
    
    -- Start with the snapshot state
    result := snapshot_record.state;
    
    -- Apply events after the snapshot
    FOR event_record IN 
        SELECT * FROM event_store
        WHERE aggregate_id = p_aggregate_id
          AND aggregate_type = p_aggregate_type
          AND sequence_number > snapshot_record.last_sequence_number
        ORDER BY sequence_number ASC
    LOOP
        -- Apply each event (simplified as in rebuild_aggregate_state)
        result := result || jsonb_build_object('lastEvent', event_record.event_type) || 
                  COALESCE(event_record.event_data, '{}'::JSONB);
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
