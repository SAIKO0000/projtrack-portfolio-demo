# Reviewer Notes Implementation Summary

## What We've Implemented

### 1. Database Changes
- Added `reviewer_notes` TEXT column to the `reports` table
- SQL migration file: `sql/add_reviewer_notes_to_reports.sql`

### 2. New Component
- Created `ReviewerNotesModal` component (`components/reviewer-notes-modal.tsx`)
- Modal for reviewers to add notes when approving, requesting revision, or rejecting reports
- Required notes for revision/rejection, optional for approval

### 3. Updated Components

#### Reports Component (`components/reports.tsx`)
- Added reviewer notes modal integration
- Updated status update logic to open modal for approval/revision/rejection actions
- Added display of reviewer notes in the reports list
- Updated types to include `reviewer_notes` field

#### Projects Component (`components/projects.tsx`)
- Added reviewer notes modal integration 
- Updated status update logic to open modal for approval/revision/rejection actions
- Added display of reviewer notes in the project reports dialog
- Added state management for reviewer notes modal

#### useReports Hook (`lib/hooks/useReports.ts`)
- Updated `updateReport` function to accept `reviewer_notes` parameter
- Extended `ReportWithUploader` interface to include `reviewer_notes`

## How It Works

1. **For Assigned Reviewers**: When clicking Approve, Request Revision, or Reject buttons:
   - A modal opens requesting reviewer notes
   - Notes are required for revision/rejection, optional for approval
   - Notes are saved to the database along with the status update

2. **Display**: Reviewer notes are displayed in both:
   - Reports page: Shows notes in a gray box below each report
   - Projects page: Shows notes in the project reports dialog

3. **Permissions**: Only assigned reviewers can approve/reject/request revision
   - Users cannot review their own reports
   - Non-assigned reviewers see who the report is assigned to

## To Apply Database Changes

Run this SQL in your Supabase dashboard or SQL editor:

```sql
-- Add reviewer_notes field to reports table
ALTER TABLE reports 
ADD COLUMN reviewer_notes TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN reports.reviewer_notes IS 'Notes from the assigned reviewer explaining approval, revision requests, or rejection reasons';
```

## Testing the Feature

1. Ensure you're logged in as an assigned reviewer for a report
2. Go to either the Projects page or Reports page
3. Find a pending report that you're assigned to review
4. Click Approve, Request Revision, or Reject
5. The reviewer notes modal should open
6. Add your notes and submit
7. The notes should appear below the report with the new status

## Files Modified/Created

- `sql/add_reviewer_notes_to_reports.sql` (new)
- `components/reviewer-notes-modal.tsx` (new)
- `components/reports.tsx` (modified)
- `components/projects.tsx` (modified)
- `lib/hooks/useReports.ts` (modified)
