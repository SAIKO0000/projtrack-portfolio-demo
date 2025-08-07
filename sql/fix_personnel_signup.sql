-- Fix personnel table for signup integration
-- This ensures that users can create personnel records during signup

-- Check if RLS is enabled and add appropriate policies
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable insert for authenticated users during signup" ON personnel;
DROP POLICY IF EXISTS "Users can view all personnel" ON personnel;
DROP POLICY IF EXISTS "Users can update own personnel record" ON personnel;

-- Allow authenticated users to insert personnel records (for signup)
CREATE POLICY "Enable insert for authenticated users during signup" 
ON personnel FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow users to view all personnel (needed for report attribution)
CREATE POLICY "Users can view all personnel" 
ON personnel FOR SELECT 
TO authenticated 
USING (true);

-- Allow users to update their own personnel record (match by email)
CREATE POLICY "Users can update own personnel record" 
ON personnel FOR UPDATE 
TO authenticated 
USING (email = auth.jwt() ->> 'email');

-- Also allow anonymous users to insert (for signup before email confirmation)
CREATE POLICY "Enable insert for anonymous users during signup" 
ON personnel FOR INSERT 
TO anon 
WITH CHECK (true);
