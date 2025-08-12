-- Add title field to reports table
-- This allows reports to have descriptive titles separate from file names

-- Add the title column
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN reports.title IS 'Descriptive title for the report, displayed as "Title (File Name)"';

-- Create index for better search performance on titles
CREATE INDEX IF NOT EXISTS idx_reports_title ON reports(title);

-- Update existing reports to have a default title based on file name (optional)
-- This will create titles from existing file names by removing extensions and formatting
UPDATE reports 
SET title = CASE 
    WHEN title IS NULL OR title = '' THEN 
        REPLACE(
            REPLACE(
                REPLACE(file_name, '_', ' '),
                '-', ' '
            ),
            REGEXP_REPLACE(file_name, '\.[^.]*$', ''),
            REGEXP_REPLACE(file_name, '\.[^.]*$', '')
        )
    ELSE title
END
WHERE title IS NULL OR title = '';

-- Show success message
SELECT 'Title field added to reports table successfully. Existing reports have been given default titles based on their file names.' as status;
