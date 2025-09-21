-- Fix NULL folder paths by setting them to the folder name
UPDATE folders 
SET path = name 
WHERE path IS NULL;






