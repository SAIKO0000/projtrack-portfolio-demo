# Apply Database Migration for Reviewer Notes

## Step 1: Add the reviewer_notes column to the reports table

Go to your Supabase dashboard → SQL Editor and run this query:

```sql
-- Add reviewer_notes field to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN reports.reviewer_notes IS 'Notes from the assigned reviewer explaining approval, revision requests, or rejection reasons';
```

## Step 2: Verify the column was added

Run this query to verify:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reports' AND column_name = 'reviewer_notes';
```

You should see:
```
column_name     | data_type
reviewer_notes  | text
```

## Step 3: Test the Feature

1. **In Projects Page**:
   - Go to a project and view its reports
   - As an assigned reviewer, you should see an "Add Note" button next to reports
   - Click it to add/edit reviewer notes
   - The notes should display below the report after saving

2. **Notes Display**:
   - Reviewer notes will appear in a gray box below each report
   - The button text changes to "Edit Note" if notes already exist

3. **Permissions**:
   - Only assigned reviewers can add/edit notes
   - Notes are visible to everyone who can view the reports

## What's New

- **Simple Notes Modal**: Clean interface for adding/editing notes
- **Visual Display**: Notes appear in a gray box below reports
- **Smart Button**: Shows "Add Note" or "Edit Note" based on existing notes
- **Database Field**: `reviewer_notes` TEXT column stores the notes
