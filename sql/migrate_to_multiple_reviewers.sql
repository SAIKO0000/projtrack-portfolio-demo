-- Migration script to move from single reviewer to multiple reviewers
-- This script should be run in your Supabase SQL editor

-- Step 1: Create the new report_reviewers table (if not already exists)
CREATE TABLE IF NOT EXISTS public.report_reviewers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revision', 'rejected')),
    reviewer_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination of report and reviewer
    UNIQUE(report_id, reviewer_id)
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_report_reviewers_report_id ON report_reviewers(report_id);
CREATE INDEX IF NOT EXISTS idx_report_reviewers_reviewer_id ON report_reviewers(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_report_reviewers_status ON report_reviewers(status);

-- Step 3: Enable RLS (Row Level Security) policies
ALTER TABLE report_reviewers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view relevant review assignments" ON report_reviewers;
DROP POLICY IF EXISTS "Admins and report owners can assign reviewers" ON report_reviewers;
DROP POLICY IF EXISTS "Reviewers can update their own reviews" ON report_reviewers;
DROP POLICY IF EXISTS "Admins and owners can delete review assignments" ON report_reviewers;

-- Step 4: Create RLS policies
CREATE POLICY "Users can view relevant review assignments" ON report_reviewers
    FOR SELECT USING (
        reviewer_id IN (
            SELECT id FROM personnel WHERE email = auth.jwt() ->> 'email'
        ) OR
        report_id IN (
            SELECT id FROM reports WHERE uploaded_by = auth.uid()
        )
    );

CREATE POLICY "Admins and report owners can assign reviewers" ON report_reviewers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM reports 
            WHERE id = report_id 
            AND uploaded_by = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM personnel 
            WHERE email = auth.jwt() ->> 'email'
            AND position IN ('Project Manager', 'Senior Electrical Engineer')
        )
    );

CREATE POLICY "Reviewers can update their own reviews" ON report_reviewers
    FOR UPDATE USING (
        reviewer_id IN (
            SELECT id FROM personnel WHERE email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Admins and owners can delete review assignments" ON report_reviewers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM reports 
            WHERE id = report_id 
            AND uploaded_by = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM personnel 
            WHERE email = auth.jwt() ->> 'email'
            AND position IN ('Project Manager', 'Senior Electrical Engineer')
        )
    );

-- Step 5: Migrate existing assigned_reviewer data to the new table
-- (Only if the assigned_reviewer column exists and has data)
INSERT INTO report_reviewers (report_id, reviewer_id, status, assigned_at)
SELECT 
    r.id as report_id,
    r.assigned_reviewer as reviewer_id,
    CASE 
        WHEN r.status = 'approved' THEN 'approved'
        WHEN r.status = 'rejected' THEN 'rejected'
        WHEN r.status = 'revision' THEN 'revision'
        ELSE 'pending'
    END as status,
    r.uploaded_at as assigned_at
FROM reports r
WHERE r.assigned_reviewer IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM report_reviewers rr 
    WHERE rr.report_id = r.id AND rr.reviewer_id = r.assigned_reviewer
);

-- Step 6: Create a view to easily get report review summary
CREATE OR REPLACE VIEW report_review_summary AS
SELECT 
    r.id as report_id,
    r.file_name,
    r.status as overall_status,
    COUNT(rr.id) as total_reviewers,
    COUNT(CASE WHEN rr.status = 'approved' THEN 1 END) as approved_count,
    COUNT(CASE WHEN rr.status = 'revision' THEN 1 END) as revision_count,
    COUNT(CASE WHEN rr.status = 'rejected' THEN 1 END) as rejected_count,
    COUNT(CASE WHEN rr.status = 'pending' THEN 1 END) as pending_count,
    ARRAY_AGG(
        CASE 
            WHEN rr.reviewer_id IS NOT NULL THEN 
                jsonb_build_object(
                    'reviewer_id', rr.reviewer_id,
                    'reviewer_name', p.name,
                    'reviewer_position', p.position,
                    'status', rr.status,
                    'notes', rr.reviewer_notes,
                    'reviewed_at', rr.reviewed_at
                )
        END
    ) FILTER (WHERE rr.reviewer_id IS NOT NULL) as reviewers
FROM reports r
LEFT JOIN report_reviewers rr ON r.id = rr.report_id
LEFT JOIN personnel p ON rr.reviewer_id = p.id
GROUP BY r.id, r.file_name, r.status;

-- Step 7: Add comments for documentation
COMMENT ON TABLE report_reviewers IS 'Junction table for many-to-many relationship between reports and reviewers';
COMMENT ON COLUMN report_reviewers.report_id IS 'Reference to the report being reviewed';
COMMENT ON COLUMN report_reviewers.reviewer_id IS 'Reference to the personnel assigned as reviewer';
COMMENT ON COLUMN report_reviewers.status IS 'Individual reviewer status: pending, approved, revision, rejected';
COMMENT ON COLUMN report_reviewers.reviewer_notes IS 'Notes from this specific reviewer';
COMMENT ON COLUMN report_reviewers.reviewed_at IS 'Timestamp when the reviewer completed their review';
COMMENT ON VIEW report_review_summary IS 'Aggregated view of report review status with all reviewer information';

-- Step 8: Optional - Remove the old assigned_reviewer column after confirming migration worked
-- (Uncomment the line below only after testing that everything works correctly)
-- ALTER TABLE reports DROP COLUMN IF EXISTS assigned_reviewer;

SELECT 'Migration completed successfully. New report_reviewers table created and data migrated.' as status;
