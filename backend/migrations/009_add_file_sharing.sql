-- Add file sharing functionality
-- This migration adds tables and columns for file sharing with public links

-- Create file_shares table for tracking shared files
CREATE TABLE IF NOT EXISTS file_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    share_token VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create download_logs table for tracking downloads
CREATE TABLE IF NOT EXISTS download_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID NOT NULL REFERENCES file_shares(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    downloaded_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_shares_token ON file_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_active ON file_shares(is_active);
CREATE INDEX IF NOT EXISTS idx_download_logs_share_id ON download_logs(share_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_downloaded_at ON download_logs(downloaded_at);

-- Add function to generate secure share tokens
CREATE OR REPLACE FUNCTION generate_share_token() RETURNS TEXT AS $$
BEGIN
    RETURN replace(replace(encode(gen_random_uuid()::text::bytea || gen_random_uuid()::text::bytea, 'base64'), '+', '-'), '/', '_');
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-generate share tokens
CREATE OR REPLACE FUNCTION set_share_token() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.share_token IS NULL OR NEW.share_token = '' OR NEW.share_token = 'temp' THEN
        NEW.share_token := generate_share_token();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS trigger_set_share_token ON file_shares;
CREATE TRIGGER trigger_set_share_token
    BEFORE INSERT ON file_shares
    FOR EACH ROW
    EXECUTE FUNCTION set_share_token();

-- Add updated_at trigger for file_shares
CREATE OR REPLACE FUNCTION update_file_shares_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS trigger_update_file_shares_updated_at ON file_shares;
CREATE TRIGGER trigger_update_file_shares_updated_at
    BEFORE UPDATE ON file_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_file_shares_updated_at();
