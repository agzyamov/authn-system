-- Migration 002: Create password_resets table
-- Description: Time-limited password reset tokens (1 hour expiry, single-use)

CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reset_token VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NULL
);

-- Index for fast token lookup during reset
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(reset_token);

-- Index for looking up user's reset requests
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);

-- Index for cleanup job (expired records)
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);
