-- Update personnel positions for users with NULL values
-- Based on the personnel table screenshot, update the users without positions

-- Update Joshh's position (the main user)
UPDATE personnel 
SET position = 'Senior Software Engineer'
WHERE email = 'main.joshmatthew.delmundo@cvsu.edu.ph' AND position IS NULL;

-- Update Mark Daniel Iguban's position 
UPDATE personnel 
SET position = 'Project Engineer'
WHERE email = 'igubanmark0@gmail.com' AND position IS NULL;

-- Update Del Mundo Josh's position
UPDATE personnel 
SET position = 'Software Developer'
WHERE email = 'joshdelmundo860@gmail.com' AND position IS NULL;

-- Verify the updates
SELECT id, name, email, position FROM personnel WHERE position IS NOT NULL;
