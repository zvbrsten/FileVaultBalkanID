-- Restore folder_id column to files table
-- This migration adds back the folder_id column that was removed in migration 016

-- Add folder_id column back to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);

-- Add composite index for user + folder queries
CREATE INDEX IF NOT EXISTS idx_files_uploader_folder ON files(uploader_id, folder_id);
