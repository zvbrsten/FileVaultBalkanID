-- Update shares table for file sharing functionality
ALTER TABLE shares 
ADD COLUMN IF NOT EXISTS share_token VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create index on share_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_shares_share_token ON shares (share_token);

-- Create index on file_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_shares_file_id ON shares (file_id);

-- Update existing shares to have share tokens if they don't have them
UPDATE shares 
SET share_token = gen_random_uuid()::text 
WHERE share_token IS NULL;
