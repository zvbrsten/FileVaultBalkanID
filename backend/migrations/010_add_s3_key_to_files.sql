-- Add S3 key field to files table for AWS S3 integration
-- This migration adds the s3_key field to store the S3 object key

-- Add s3_key column to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS s3_key VARCHAR(500);

-- Add index for s3_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_files_s3_key ON files(s3_key);

-- Add comment to explain the field
COMMENT ON COLUMN files.s3_key IS 'S3 object key for AWS S3 storage';
