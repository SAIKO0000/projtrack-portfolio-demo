# Debugging Reviewer Notes in Projects Page

## Issue
The reviewer notes functionality is not working in the projects page.

## Things to Check:

### 1. Database Migration
First, make sure the `reviewer_notes` column has been added to the reports table:

```sql
-- Run this in your Supabase SQL editor
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;
```

### 2. Verify Column Exists
Check if the column exists:

```sql
-- Run this to check if the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reports' AND column_name = 'reviewer_notes';
```

### 3. Test Data
Check if any reports have reviewer notes:

```sql
-- Check if there are any reports with reviewer notes
SELECT id, file_name, status, reviewer_notes 
FROM reports 
WHERE reviewer_notes IS NOT NULL;
```

## Debugging Steps:

1. Open browser developer tools (F12)
2. Go to Console tab
3. Try to approve/reject a report as an assigned reviewer
4. Check for any console errors
5. Check if the modal opens
6. Check if the database update succeeds

## Common Issues:

1. **Column doesn't exist**: Run the SQL migration above
2. **Permission issues**: Make sure RLS policies allow updating reviewer_notes
3. **Type mismatch**: The TypeScript interface might not match the database

## If Still Not Working:

Add this debugging code temporarily to the projects component to see what's happening:

```typescript
// Add this console.log in handleReviewerNotesSubmit function
console.log('Updating report with:', { 
  reportId: reviewerNotesModal.reportId, 
  status: action, 
  reviewer_notes: notes 
})
```
