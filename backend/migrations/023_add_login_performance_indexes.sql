-- Add indexes for faster login performance

-- Index for email lookups (most critical for login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Composite index for email + password verification (if needed)
CREATE INDEX IF NOT EXISTS idx_users_email_password ON users(email) WHERE password IS NOT NULL;

-- Index for user ID lookups (already exists but ensure it's there)
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
