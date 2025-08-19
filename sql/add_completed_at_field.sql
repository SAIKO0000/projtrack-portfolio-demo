-- Add completed_at field to tasks table
ALTER TABLE tasks 
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;

-- Add comment to the column
COMMENT ON COLUMN tasks.completed_at IS 'Timestamp when the task was marked as completed';

-- Create index for performance when querying completed tasks
CREATE INDEX idx_tasks_completed_at ON tasks(completed_at) WHERE completed_at IS NOT NULL;

-- Update existing completed tasks to have a completion timestamp (optional)
-- This sets completion timestamp to updated_at for tasks that are already completed
UPDATE tasks 
SET completed_at = updated_at 
WHERE status = 'completed' AND completed_at IS NULL;
