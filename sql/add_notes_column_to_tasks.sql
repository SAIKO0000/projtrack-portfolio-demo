-- Add notes column to tasks table
-- This migration adds a notes field to the tasks table for additional task information

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN tasks.notes IS 'Additional notes for the task, separate from description';

-- Optionally add an index if notes will be searched frequently
-- CREATE INDEX IF NOT EXISTS idx_tasks_notes ON tasks USING gin(to_tsvector('english', notes));
