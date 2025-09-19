-- Add S3 fields to file_hashes table (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'file_hashes' AND column_name = 's3_key') THEN
        ALTER TABLE file_hashes ADD COLUMN s3_key VARCHAR(500);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'file_hashes' AND column_name = 's3_url') THEN
        ALTER TABLE file_hashes ADD COLUMN s3_url TEXT;
    END IF;
END $$;

-- Add index for S3 key lookups (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_file_hashes_s3_key ON file_hashes(s3_key);
