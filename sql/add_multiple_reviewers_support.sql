-- Add support for multiple reviewers per report
-- Create a junction table to handle many-to-many relationship between reports and reviewers

-- Create report_reviewers junction table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_report_reviewers_report_id ON report_reviewers(report_id);
CREATE INDEX IF NOT EXISTS idx_report_reviewers_reviewer_id ON report_reviewers(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_report_reviewers_status ON report_reviewers(status);

-- Add RLS (Row Level Security) policies
ALTER TABLE report_reviewers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see review assignments they are involved in
CREATE POLICY "Users can view relevant review assignments" ON report_reviewers
    FOR SELECT USING (
        reviewer_id = auth.uid() OR
        report_id IN (
            SELECT id FROM reports WHERE uploaded_by = auth.uid()
        )
    );

-- Policy: Only report uploaders and admins can assign reviewers
CREATE POLICY "Admins and report owners can assign reviewers" ON report_reviewers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM reports 
            WHERE id = report_id 
            AND uploaded_by = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM personnel 
            WHERE id = auth.uid() 
            AND position IN ('Project Manager', 'Senior Electrical Engineer')
        )
    );

-- Policy: Only assigned reviewers can update their review status
CREATE POLICY "Reviewers can update their own reviews" ON report_reviewers
    FOR UPDATE USING (
        reviewer_id = auth.uid()
    );

-- Policy: Admins and report owners can delete review assignments
CREATE POLICY "Admins and owners can delete review assignments" ON report_reviewers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM reports 
            WHERE id = report_id 
            AND uploaded_by = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM personnel 
            WHERE id = auth.uid() 
            AND position IN ('Project Manager', 'Senior Electrical Engineer')
        )
    );

-- Add comments for documentation
COMMENT ON TABLE report_reviewers IS 'Junction table for many-to-many relationship between reports and reviewers';
COMMENT ON COLUMN report_reviewers.report_id IS 'Reference to the report being reviewed';
COMMENT ON COLUMN report_reviewers.reviewer_id IS 'Reference to the personnel assigned as reviewer';
COMMENT ON COLUMN report_reviewers.status IS 'Individual reviewer status: pending, approved, revision, rejected';
COMMENT ON COLUMN report_reviewers.reviewer_notes IS 'Notes from this specific reviewer';
COMMENT ON COLUMN report_reviewers.reviewed_at IS 'Timestamp when the reviewer completed their review';

-- Create a view to easily get report review summary
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

COMMENT ON VIEW report_review_summary IS 'Aggregated view of report review status with all reviewer information';
