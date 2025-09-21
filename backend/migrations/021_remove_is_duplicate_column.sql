-- Remove is_duplicate column from files table
-- This column is no longer needed as we implement cross-user deduplication
-- where all files are treated equally regardless of whether content is shared

-- Drop the is_duplicate column
ALTER TABLE files DROP COLUMN IF EXISTS is_duplicate;

-- Update any existing indexes or constraints if they reference this column
-- (There shouldn't be any, but this is a safety measure)

-- Add a comment to document the change
COMMENT ON TABLE files IS 'Files table with cross-user deduplication - multiple file records can reference the same content via hash';
