-- Add title field to photos table
-- This allows users to provide custom titles for their photo uploads

ALTER TABLE public.photos 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN public.photos.title IS 'Custom title provided by user for the photo upload';

-- Update any existing photos to have a default title based on file name (optional)
-- This ensures existing photos have some title value
UPDATE public.photos 
SET title = COALESCE(
  CASE 
    WHEN file_name IS NOT NULL THEN 
      -- Remove file extension and capitalize first letter
      INITCAP(REGEXP_REPLACE(file_name, '\.[^.]*$', ''))
    ELSE 
      'Untitled Photo'
  END
)
WHERE title IS NULL;
