-- Create function to get folder path
CREATE OR REPLACE FUNCTION get_folder_path(folder_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    folder_path TEXT;
    current_folder RECORD;
BEGIN
    folder_path := '';
    
    -- Get the folder and build path recursively
    WITH RECURSIVE folder_hierarchy AS (
        SELECT id, name, parent_id, 1 as level
        FROM folders
        WHERE id = folder_uuid
        
        UNION ALL
        
        SELECT f.id, f.name, f.parent_id, fh.level + 1
        FROM folders f
        INNER JOIN folder_hierarchy fh ON f.id = fh.parent_id
    )
    SELECT string_agg(name, '/' ORDER BY level DESC) INTO folder_path
    FROM folder_hierarchy;
    
    RETURN folder_path;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate folder path
CREATE OR REPLACE FUNCTION is_valid_folder_path(path TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if path contains invalid characters
    IF path ~ '[<>:"|?*]' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if path is too long
    IF length(path) > 1000 THEN
        RETURN FALSE;
    END IF;
    
    -- Check if path starts or ends with slash
    IF path ~ '^/' OR path ~ '/$' THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
