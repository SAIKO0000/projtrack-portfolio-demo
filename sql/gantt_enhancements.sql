-- Add missing columns to projects table for enhanced Gantt chart functionality

-- Add budget and financial tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget BIGINT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS spent BIGINT DEFAULT 0;

-- Add actual completion date for tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS actual_end_date DATE;

-- Add priority field (high, medium, low)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' 
  CHECK (priority IN ('high', 'medium', 'low'));

-- Add category field for filtering  
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general'
  CHECK (category IN ('educational', 'commercial', 'industrial', 'residential', 'general'));

-- Create milestones table to track project milestones
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_date DATE NOT NULL,
  actual_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster milestone queries
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_target_date ON milestones(target_date);

-- Add RLS policies for milestones (assuming you have RLS enabled)
-- ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Update the status check constraint to include more statuses if needed
-- ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
-- ALTER TABLE projects ADD CONSTRAINT projects_status_check 
--   CHECK (status IN ('planning', 'in-progress', 'on-hold', 'completed', 'cancelled'));

-- Create a view for enhanced project data with milestone counts
CREATE OR REPLACE VIEW project_gantt_view AS
SELECT 
  p.*,
  COALESCE(m.total_milestones, 0) as total_milestones,
  COALESCE(m.completed_milestones, 0) as completed_milestones,
  CASE 
    WHEN p.status = 'completed' THEN false
    WHEN p.end_date < CURRENT_DATE THEN true
    ELSE false
  END as is_overdue,
  CASE 
    WHEN p.status = 'completed' THEN NULL
    ELSE (p.end_date - CURRENT_DATE)
  END as days_until_deadline
FROM projects p
LEFT JOIN (
  SELECT 
    project_id,
    COUNT(*) as total_milestones,
    COUNT(*) FILTER (WHERE completed = true) as completed_milestones
  FROM milestones
  GROUP BY project_id
) m ON p.id = m.project_id;
