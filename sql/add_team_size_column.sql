-- Add team_size column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_size INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN projects.team_size IS 'Number of team members assigned to this project';

-- Optional: Add a check constraint to ensure reasonable team sizes
-- ALTER TABLE projects ADD CONSTRAINT projects_team_size_check 
--   CHECK (team_size >= 1 AND team_size <= 100);
