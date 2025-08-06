-- Sample reports data for testing
-- Note: You'll need to have projects in your database first
-- Run this after ensuring you have projects and the storage bucket is set up

-- First, let's check if we have projects
-- If you don't have projects, you'll need to create some first

-- Sample reports (update project_id values to match your actual project IDs)
INSERT INTO reports (
  id,
  project_id,
  file_name,
  file_path,
  file_type,
  file_size,
  category,
  status,
  description,
  uploaded_at
) VALUES 
(
  gen_random_uuid(),
  (SELECT id FROM projects LIMIT 1), -- Use first available project
  'Project_Progress_Report_Q1.pdf',
  'reports/sample/Project_Progress_Report_Q1.pdf',
  'application/pdf',
  2048576, -- 2MB
  'Progress Report',
  'approved',
  'Quarterly progress report showing project milestones and completion status.',
  NOW() - INTERVAL '5 days'
),
(
  gen_random_uuid(),
  (SELECT id FROM projects LIMIT 1),
  'Safety_Inspection_Report.docx',
  'reports/sample/Safety_Inspection_Report.docx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  1536000, -- 1.5MB
  'Safety Report',
  'pending',
  'Monthly safety inspection report with recommendations.',
  NOW() - INTERVAL '2 days'
),
(
  gen_random_uuid(),
  (SELECT id FROM projects LIMIT 1),
  'Site_Photos_Week_12.zip',
  'reports/sample/Site_Photos_Week_12.zip',
  'application/zip',
  15728640, -- 15MB
  'Site Photos',
  'approved',
  'Weekly site progress photos and documentation.',
  NOW() - INTERVAL '1 day'
),
(
  gen_random_uuid(),
  (SELECT id FROM projects LIMIT 1),
  'Technical_Specifications.pdf',
  'reports/sample/Technical_Specifications.pdf',
  'application/pdf',
  5242880, -- 5MB
  'Technical Drawing',
  'revision',
  'Updated technical specifications requiring review.',
  NOW() - INTERVAL '3 days'
),
(
  gen_random_uuid(),
  (SELECT id FROM projects LIMIT 1),
  'Material_List_Updated.xlsx',
  'reports/sample/Material_List_Updated.xlsx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  512000, -- 512KB
  'Material List',
  'pending',
  'Updated material requirements and quantities.',
  NOW()
);

-- Update the uploaded_by field if you have user authentication set up
-- UPDATE reports SET uploaded_by = (SELECT id FROM auth.users LIMIT 1) WHERE uploaded_by IS NULL;
