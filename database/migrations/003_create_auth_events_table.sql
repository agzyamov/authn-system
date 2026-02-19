-- Migration 003: Create auth_events table
-- Description: Security audit log for all authentication events

CREATE TYPE auth_event_type AS ENUM (
  'registration',
  'login_success',
  'login_failure',
  'logout',
  'password_reset_request',
  'password_reset_complete',
  'password_reset_failure',
  'password_change'
);

CREATE TABLE IF NOT EXISTS auth_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  event_type auth_event_type NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for user event history
CREATE INDEX IF NOT EXISTS idx_auth_events_user_id ON auth_events(user_id);

-- Index for time-based queries (cleanup job)
CREATE INDEX IF NOT EXISTS idx_auth_events_created_at ON auth_events(created_at);

-- Index for event type filtering (security analysis)
CREATE INDEX IF NOT EXISTS idx_auth_events_event_type ON auth_events(event_type);
