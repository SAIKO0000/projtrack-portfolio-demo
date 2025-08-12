-- Create profile-pictures storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Create RLS policies for profile-pictures bucket
CREATE POLICY "Users can view all profile pictures" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'profile-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own profile pictures" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'profile-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'profile-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Alternative approach: Allow users to manage profile pictures based on personnel table
-- If the above doesn't work, use this instead:

-- CREATE POLICY "Users can upload profile pictures" ON storage.objects
--   FOR INSERT 
--   WITH CHECK (
--     bucket_id = 'profile-pictures' 
--     AND auth.uid() IN (
--       SELECT auth_user_id FROM personnel WHERE id = (storage.foldername(name))[1]::uuid
--     )
--   );

-- Note: You may need to add an auth_user_id column to personnel table if it doesn't exist
-- ALTER TABLE personnel ADD COLUMN auth_user_id uuid REFERENCES auth.users(id);
