-- Add assigned_reviewer_id column back to reports table for single reviewer functionality

-- Add the assigned_reviewer_id column
ALTER TABLE reports ADD COLUMN IF NOT EXISTS assigned_reviewer_id UUID;

-- Add foreign key constraint to personnel table  
ALTER TABLE reports ADD CONSTRAINT IF NOT EXISTS reports_assigned_reviewer_id_fkey 
FOREIGN KEY (assigned_reviewer_id) REFERENCES personnel(id);

-- Update RLS policies for the reports table to include reviewer access
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all reports" ON reports;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON reports;
DROP POLICY IF EXISTS "Users can update their own reports or admin can update any" ON reports;
DROP POLICY IF EXISTS "Users can delete their own reports or admin can delete any" ON reports;

-- Recreate policies with reviewer access
CREATE POLICY "Users can view all reports" ON reports
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reports" ON reports
FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own reports or admin can update any" ON reports
FOR UPDATE USING (
  auth.uid() = uploaded_by OR 
  auth.uid() = assigned_reviewer_id OR
  EXISTS (
    SELECT 1 FROM personnel 
    WHERE personnel.email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    ) AND personnel.role = 'admin'
  )
);

CREATE POLICY "Users can delete their own reports or admin can delete any" ON reports
FOR DELETE USING (
  auth.uid() = uploaded_by OR
  EXISTS (
    SELECT 1 FROM personnel 
    WHERE personnel.email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    ) AND personnel.role = 'admin'
  )
);
