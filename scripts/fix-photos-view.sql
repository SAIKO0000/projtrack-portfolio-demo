-- ===========================================
-- FIX PHOTOS VIEW - Missing Database Objects
-- ===========================================
-- This script creates missing views and functions that the application expects

-- Create photos_with_uploader_names view
CREATE OR REPLACE VIEW photos_with_uploader_names AS
SELECT 
    p.*,
    pe.name as uploader_name,
    pr.name as project_name
FROM photos p
LEFT JOIN personnel pe ON pe.user_id = p.uploaded_by
LEFT JOIN projects pr ON pr.id = p.project_id;

-- Grant permissions on the view
GRANT SELECT ON photos_with_uploader_names TO authenticated, anon;
