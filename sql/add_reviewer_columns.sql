-- Add assigned_reviewer_id column to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS assigned_reviewer_id UUID REFERENCES personnel(id);

-- Add reviewer_notes column to reports table  
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;
