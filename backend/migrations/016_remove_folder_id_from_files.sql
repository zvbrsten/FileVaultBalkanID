-- Remove folder_id column from files table if it exists
-- This migration is safe to run even if the column doesn't exist

-- First, drop any foreign key constraints on folder_id
DO $$ 
BEGIN
    -- Check if the constraint exists before dropping it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'files_folder_id_fkey' 
        AND table_name = 'files'
    ) THEN
        ALTER TABLE files DROP CONSTRAINT files_folder_id_fkey;
    END IF;
END $$;

-- Drop the folder_id column if it exists
DO $$ 
BEGIN
    -- Check if the column exists before dropping it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'files' 
        AND column_name = 'folder_id'
    ) THEN
        ALTER TABLE files DROP COLUMN folder_id;
    END IF;
END $$;

-- Drop any indexes on folder_id if they exist
DROP INDEX IF EXISTS idx_files_folder_id;
