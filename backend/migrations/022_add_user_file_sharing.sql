-- Add user file sharing table
CREATE TABLE IF NOT EXISTS user_file_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can't share the same file to the same user multiple times
    UNIQUE(file_id, to_user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_file_shares_to_user_id ON user_file_shares(to_user_id);
CREATE INDEX IF NOT EXISTS idx_user_file_shares_from_user_id ON user_file_shares(from_user_id);
CREATE INDEX IF NOT EXISTS idx_user_file_shares_file_id ON user_file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_user_file_shares_is_read ON user_file_shares(is_read);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_file_shares_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS trigger_update_user_file_shares_updated_at ON user_file_shares;
CREATE TRIGGER trigger_update_user_file_shares_updated_at
    BEFORE UPDATE ON user_file_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_user_file_shares_updated_at();
