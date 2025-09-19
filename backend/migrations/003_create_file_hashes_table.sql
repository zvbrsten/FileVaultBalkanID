-- Create file_hashes table for deduplication
CREATE TABLE IF NOT EXISTS file_hashes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hash
    file_path VARCHAR(500) NOT NULL,
    size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_file_hashes_hash ON file_hashes(hash);

-- Create index on created_at for cleanup operations
CREATE INDEX IF NOT EXISTS idx_file_hashes_created_at ON file_hashes(created_at);


