-- Add reviewer_notes field to reports table
-- This field will store notes from the assigned reviewer when they approve, request revision, or reject a report

ALTER TABLE reports 
ADD COLUMN reviewer_notes TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN reports.reviewer_notes IS 'Notes from the assigned reviewer explaining approval, revision requests, or rejection reasons';

-- Update the existing reports to have NULL reviewer_notes (this is the default, but being explicit)
UPDATE reports SET reviewer_notes = NULL WHERE reviewer_notes IS NULL;
