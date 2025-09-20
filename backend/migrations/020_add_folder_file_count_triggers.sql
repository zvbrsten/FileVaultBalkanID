-- Migration to add triggers for automatically updating folder file counts
-- This ensures that the file_count in folders table is always accurate

-- Function to update folder file count
CREATE OR REPLACE FUNCTION update_folder_file_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT and UPDATE operations
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update count for the new folder (if folder_id is not null)
        IF NEW.folder_id IS NOT NULL THEN
            UPDATE folders 
            SET file_count = (
                SELECT COUNT(*) 
                FROM files 
                WHERE folder_id = NEW.folder_id AND uploader_id = NEW.uploader_id
            )
            WHERE id = NEW.folder_id;
        END IF;
        
        -- If this is an UPDATE and the folder_id changed, update the old folder too
        IF TG_OP = 'UPDATE' AND OLD.folder_id IS DISTINCT FROM NEW.folder_id THEN
            IF OLD.folder_id IS NOT NULL THEN
                UPDATE folders 
                SET file_count = (
                    SELECT COUNT(*) 
                    FROM files 
                    WHERE folder_id = OLD.folder_id AND uploader_id = OLD.uploader_id
                )
                WHERE id = OLD.folder_id;
            END IF;
        END IF;
    END IF;
    
    -- Handle DELETE operations
    IF TG_OP = 'DELETE' THEN
        -- Update count for the folder that the deleted file belonged to
        IF OLD.folder_id IS NOT NULL THEN
            UPDATE folders 
            SET file_count = (
                SELECT COUNT(*) 
                FROM files 
                WHERE folder_id = OLD.folder_id AND uploader_id = OLD.uploader_id
            )
            WHERE id = OLD.folder_id;
        END IF;
    END IF;
    
    -- Return the appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for files table
DROP TRIGGER IF EXISTS update_folder_file_count_trigger ON files;
CREATE TRIGGER update_folder_file_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON files
    FOR EACH ROW EXECUTE FUNCTION update_folder_file_count();

-- Update existing folder file counts to be accurate
UPDATE folders 
SET file_count = (
    SELECT COUNT(*) 
    FROM files 
    WHERE folder_id = folders.id
);
