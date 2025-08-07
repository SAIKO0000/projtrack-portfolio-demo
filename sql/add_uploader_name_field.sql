-- Add uploader_name and uploader_position fields to reports table to store the name and position of the user who uploaded the report
ALTER TABLE reports ADD COLUMN IF NOT EXISTS uploader_name TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS uploader_position TEXT;

-- Update existing reports with current user names and positions where possible
-- This will set uploader_name and uploader_position to default values for existing records
UPDATE reports 
SET uploader_name = 'Legacy User',
    uploader_position = 'Unknown Position'
WHERE uploaded_by IS NOT NULL AND uploader_name IS NULL;
