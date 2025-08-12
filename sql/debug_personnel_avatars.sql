-- Debug query to check personnel records and their avatar URLs
SELECT 
  id,
  name,
  email,
  avatar_url,
  CASE 
    WHEN avatar_url IS NULL THEN 'No avatar URL'
    WHEN avatar_url = '' THEN 'Empty avatar URL'
    ELSE 'Has avatar URL'
  END as avatar_status
FROM personnel 
ORDER BY name;

-- Check if there are any actual avatar URLs in the database
SELECT COUNT(*) as total_personnel,
       COUNT(avatar_url) as with_avatar_url,
       COUNT(CASE WHEN avatar_url IS NOT NULL AND avatar_url != '' THEN 1 END) as with_valid_avatar
FROM personnel;
