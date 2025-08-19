-- Add assignee_headcounts field to tasks table to store head count data
ALTER TABLE tasks 
ADD COLUMN assignee_headcounts JSONB DEFAULT '{}';

-- Add comment to the column
COMMENT ON COLUMN tasks.assignee_headcounts IS 'JSON object storing headcount for each assignee role';

-- Example of data structure:
-- {"PROJECT ENGINEER": 2, "FOREMAN": 1, "ELECTRICIAN": 3}

-- Create index for JSONB operations
CREATE INDEX idx_tasks_assignee_headcounts ON tasks USING GIN(assignee_headcounts);
