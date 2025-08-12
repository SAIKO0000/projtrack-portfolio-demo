-- Revert multiple reviewers feature
-- This script removes the report_reviewers table and related functionality

-- First, drop any dependent views
DROP VIEW IF EXISTS report_review_summary CASCADE;

-- Drop any related policies (if they exist)
DROP POLICY IF EXISTS "Users can view their assigned reviews" ON report_reviewers;
DROP POLICY IF EXISTS "Users can update their review status" ON report_reviewers;
DROP POLICY IF EXISTS "Admin can manage all reviews" ON report_reviewers;

-- Now drop the report_reviewers table with CASCADE to handle any remaining dependencies
DROP TABLE IF EXISTS report_reviewers CASCADE;

-- Add back the assigned_reviewer_id column to reports table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' AND column_name = 'assigned_reviewer_id') THEN
        ALTER TABLE reports ADD COLUMN assigned_reviewer_id UUID REFERENCES personnel(id);
    END IF;
END $$;

-- Note: The reports table should now have the assigned_reviewer_id column
-- for single reviewer functionality
