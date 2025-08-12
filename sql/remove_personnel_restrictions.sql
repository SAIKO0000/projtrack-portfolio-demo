-- Remove all restrictions from personnel table for signup
-- This will allow unrestricted access to the personnel table

-- Disable Row Level Security completely
ALTER TABLE personnel DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users during signup" ON personnel;
DROP POLICY IF EXISTS "Users can view all personnel" ON personnel;
DROP POLICY IF EXISTS "Users can update own personnel record" ON personnel;
DROP POLICY IF EXISTS "Enable insert for anonymous users during signup" ON personnel;
DROP POLICY IF EXISTS "Users can insert own personnel" ON personnel;
DROP POLICY IF EXISTS "Users can view personnel" ON personnel;
DROP POLICY IF EXISTS "Users can update personnel" ON personnel;
DROP POLICY IF EXISTS "Enable read access for all users" ON personnel;
DROP POLICY IF EXISTS "Enable insert access for all users" ON personnel;
DROP POLICY IF EXISTS "Enable update for users based on email" ON personnel;

-- Grant full access to authenticated and anonymous users
GRANT ALL ON personnel TO authenticated;
GRANT ALL ON personnel TO anon;

-- Grant access to the public role (just in case)
GRANT ALL ON personnel TO public;

-- Find and grant access to the actual sequence (if it exists)
DO $$
DECLARE
    seq_name text;
BEGIN
    -- Find the sequence name for the personnel table's id column
    SELECT pg_get_serial_sequence('personnel', 'id') INTO seq_name;
    
    IF seq_name IS NOT NULL THEN
        -- Grant permissions on the sequence
        EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE ' || seq_name || ' TO authenticated';
        EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE ' || seq_name || ' TO anon';
        EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE ' || seq_name || ' TO public';
    END IF;
END $$;
