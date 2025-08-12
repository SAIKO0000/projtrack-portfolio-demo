-- Add assigned_reviewer field to reports table
-- This field will store the personnel ID of the reviewer assigned to review the report

ALTER TABLE reports 
ADD COLUMN assigned_reviewer UUID REFERENCES personnel(id);

-- Add index for better query performance
CREATE INDEX idx_reports_assigned_reviewer ON reports(assigned_reviewer);

-- Add comment to explain the field
COMMENT ON COLUMN reports.assigned_reviewer IS 'Personnel ID of the reviewer assigned to review this report';
