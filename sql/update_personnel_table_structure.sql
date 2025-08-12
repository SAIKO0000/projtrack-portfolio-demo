-- Update personnel table structure to match simplified signup
-- Remove unnecessary fields and ensure proper defaults

-- Use DO block to safely modify table structure
DO $$ 
BEGIN
    -- First, let's make sure the phone and position columns can handle NULLs properly
    -- Check if phone column has NOT NULL constraint and remove it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'personnel' 
        AND column_name = 'phone' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE personnel ALTER COLUMN phone DROP NOT NULL;
    END IF;
    
    -- Check if position column has NOT NULL constraint and remove it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'personnel' 
        AND column_name = 'position' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE personnel ALTER COLUMN position DROP NOT NULL;
    END IF;
    
    -- Drop department column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'personnel' AND column_name = 'department') THEN
        ALTER TABLE personnel DROP COLUMN department;
    END IF;
    
    -- Drop prc_license column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'personnel' AND column_name = 'prc_license') THEN
        ALTER TABLE personnel DROP COLUMN prc_license;
    END IF;
    
    -- Drop years_experience column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'personnel' AND column_name = 'years_experience') THEN
        ALTER TABLE personnel DROP COLUMN years_experience;
    END IF;
END $$;

-- Ensure the table has the correct structure for our signup
-- Create the table if it doesn't exist with the correct schema
CREATE TABLE IF NOT EXISTS personnel (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    position TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_personnel_email ON personnel(email);

-- Update existing records to ensure no empty strings in phone/position
UPDATE personnel 
SET phone = NULL 
WHERE phone = '' OR phone IS NULL;

UPDATE personnel 
SET position = NULL 
WHERE position = '' OR position IS NULL;
