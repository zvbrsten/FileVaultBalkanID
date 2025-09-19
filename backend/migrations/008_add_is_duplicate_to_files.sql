-- Add is_duplicate column to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT FALSE;

-- Create index on is_duplicate for faster filtering
CREATE INDEX IF NOT EXISTS idx_files_is_duplicate ON files(is_duplicate);

-- Update existing files to check for duplicates
-- This will mark files as duplicates if they have the same hash
UPDATE files 
SET is_duplicate = TRUE 
WHERE hash IN (
    SELECT hash 
    FROM files 
    GROUP BY hash 
    HAVING COUNT(*) > 1
);

