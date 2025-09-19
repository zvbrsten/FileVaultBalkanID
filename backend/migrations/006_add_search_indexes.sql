-- Add indexes for better search performance

-- Index for searching by filename and original name
CREATE INDEX IF NOT EXISTS idx_files_original_name_gin ON files USING gin(to_tsvector('english', original_name));
CREATE INDEX IF NOT EXISTS idx_files_filename_gin ON files USING gin(to_tsvector('english', filename));

-- Index for MIME type filtering
CREATE INDEX IF NOT EXISTS idx_files_mime_type ON files(mime_type);

-- Index for size filtering
CREATE INDEX IF NOT EXISTS idx_files_size ON files(size);

-- Index for date filtering
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);

-- Index for duplicate filtering (will be created in migration 008)
-- CREATE INDEX IF NOT EXISTS idx_files_is_duplicate ON files(is_duplicate);

-- Composite index for user + date (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_files_uploader_created ON files(uploader_id, created_at DESC);

-- Composite index for user + MIME type
CREATE INDEX IF NOT EXISTS idx_files_uploader_mime ON files(uploader_id, mime_type);

-- Composite index for user + size
CREATE INDEX IF NOT EXISTS idx_files_uploader_size ON files(uploader_id, size);

-- Index for hash lookups (deduplication)
CREATE INDEX IF NOT EXISTS idx_files_hash ON files(hash);

-- Index for unique file size calculation (will be created in migration 008)
-- CREATE INDEX IF NOT EXISTS idx_files_uploader_duplicate ON files(uploader_id, is_duplicate) WHERE is_duplicate = false;
