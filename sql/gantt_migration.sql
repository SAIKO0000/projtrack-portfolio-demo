-- Migration: Add Gantt Chart fields to tasks table
-- This adds the necessary columns for Gantt chart functionality

-- Add new columns to existing tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
ADD COLUMN IF NOT EXISTS phase VARCHAR(100),
ADD COLUMN IF NOT EXISTS category VARCHAR(50) CHECK (category IN ('planning', 'pre-construction', 'construction', 'finishing', 'closeout')),
ADD COLUMN IF NOT EXISTS duration INTEGER,
ADD COLUMN IF NOT EXISTS dependencies TEXT[], -- Array of task IDs
ADD COLUMN IF NOT EXISTS assignee VARCHAR(255),
ADD COLUMN IF NOT EXISTS gantt_position INTEGER; -- For ordering in Gantt chart

-- Update existing tasks to have default values
UPDATE tasks 
SET 
  start_date = CURRENT_DATE,
  end_date = CURRENT_DATE + INTERVAL '7 days',
  progress = 0,
  phase = 'Planning',
  category = 'planning',
  duration = 7,
  dependencies = '{}',
  assignee = 'Unassigned'
WHERE start_date IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_gantt ON tasks(project_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Insert some sample Gantt tasks if table is empty
INSERT INTO tasks (
  project_id, 
  title, 
  description, 
  start_date, 
  end_date, 
  status, 
  priority, 
  progress, 
  phase, 
  category, 
  duration, 
  assignee,
  estimated_hours
) 
SELECT 
  p.id,
  'Project Initiation & Planning',
  'Initial project setup and planning documentation',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '12 days',
  'completed',
  'critical',
  100,
  'Planning',
  'planning',
  12,
  'Project Manager',
  96
FROM projects p
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE project_id = p.id)
LIMIT 1;

INSERT INTO tasks (
  project_id, 
  title, 
  description, 
  start_date, 
  end_date, 
  status, 
  priority, 
  progress, 
  phase, 
  category, 
  duration, 
  assignee,
  dependencies,
  estimated_hours
) 
SELECT 
  p.id,
  'Site Survey & Investigation',
  'Comprehensive site analysis and soil testing',
  CURRENT_DATE + INTERVAL '15 days',
  CURRENT_DATE + INTERVAL '34 days',
  'completed',
  'high',
  100,
  'Planning',
  'planning',
  19,
  'Survey Team',
  ARRAY['1'],
  152
FROM projects p
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'Site Survey & Investigation')
LIMIT 1;
