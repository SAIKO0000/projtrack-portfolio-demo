-- Add user_id field to personnel table if it doesn't exist
ALTER TABLE personnel ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_personnel_user_id ON personnel(user_id);

-- Create or replace a function to resolve user names for photos
CREATE OR REPLACE FUNCTION get_photo_uploader_name(uploader_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    uploader_name TEXT;
    uploader_email TEXT;
BEGIN
    -- First try to find in personnel by user_id
    SELECT name INTO uploader_name
    FROM personnel
    WHERE user_id = uploader_id;
    
    IF uploader_name IS NOT NULL THEN
        RETURN uploader_name;
    END IF;
    
    -- If not found by user_id, try to get email from auth.users and match with personnel
    SELECT email INTO uploader_email
    FROM auth.users
    WHERE id = uploader_id;
    
    IF uploader_email IS NOT NULL THEN
        SELECT name INTO uploader_name
        FROM personnel
        WHERE email = uploader_email;
        
        IF uploader_name IS NOT NULL THEN
            -- Update the user_id for future lookups
            UPDATE personnel
            SET user_id = uploader_id
            WHERE email = uploader_email;
            
            RETURN uploader_name;
        ELSE
            -- Return email username part if no personnel record
            RETURN split_part(uploader_email, '@', 1);
        END IF;
    END IF;
    
    -- Fallback to user ID substring
    RETURN 'User ' || substring(uploader_id::text, 1, 8);
END;
$$;

-- Create a view that includes uploader names
CREATE OR REPLACE VIEW photos_with_uploader_names AS
SELECT 
    p.*,
    get_photo_uploader_name(p.uploaded_by) as uploader_name,
    proj.name as project_name
FROM photos p
LEFT JOIN projects proj ON p.project_id = proj.id;

-- Grant access to the view
GRANT SELECT ON photos_with_uploader_names TO authenticated;

-- Create RLS policy for the view (inherits from photos table policies)
-- The view will respect the same RLS policies as the underlying photos table
-- since it's essentially a wrapper around the photos table
