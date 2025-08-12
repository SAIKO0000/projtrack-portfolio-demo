# Multiple Reviewers Feature Implementation

## Overview
This feature allows uploaders to assign multiple reviewers to a single report, providing more flexibility in the review process.

## Database Changes
1. **New Table**: `report_reviewers` - Junction table for many-to-many relationship between reports and reviewers
2. **New View**: `report_review_summary` - Aggregated view of report review status

## Migration Steps

### 1. Run the Database Migration
Execute the SQL file to create the new table and view:
```sql
-- Run this in your Supabase SQL editor
\i sql/add_multiple_reviewers_support.sql
```

### 2. Update TypeScript Types
The types have been updated in `lib/supabase.types.ts` to include the new `report_reviewers` table.

## UI Changes

### 1. New Multiple Reviewer Selector Component
- **File**: `components/multiple-reviewer-selector.tsx`
- **Features**:
  - Select multiple reviewers with a "+" button
  - Visual badges showing selected reviewers
  - Remove reviewers with "X" button
  - Prevents self-assignment
  - Shows count of selected reviewers

### 2. Updated Report Upload Modal
- **File**: `components/report-upload-modal.tsx`
- **Changes**:
  - Replaced single reviewer dropdown with multiple reviewer selector
  - Updated validation to require at least one reviewer
  - Updated state management for multiple reviewers

### 3. Updated Upload Hook
- **File**: `lib/hooks/useReports.ts`
- **Changes**:
  - Modified `uploadReport` function to accept both single and multiple reviewers
  - Added logic to insert reviewer assignments into `report_reviewers` table
  - Maintains backward compatibility with existing single reviewer uploads

## How It Works

### 1. Report Upload Process
1. User selects file and fills out report details
2. User assigns one or more reviewers using the new selector
3. System uploads file to storage
4. System creates report record in `reports` table
5. System creates individual reviewer assignments in `report_reviewers` table

### 2. Review Process
- Each assigned reviewer can independently approve, request revision, or reject
- Individual reviewer notes are stored per reviewer
- Overall report status can be managed based on collective reviewer feedback

### 3. Reviewer Assignment Rules
- Users cannot assign themselves as reviewers
- Only authorized positions can be assigned as reviewers:
  - Project Manager
  - Senior Electrical Engineer
  - Field Engineer
  - Design Engineer

## Database Schema

### report_reviewers Table
```sql
- id: UUID (Primary Key)
- report_id: UUID (Foreign Key to reports.id)
- reviewer_id: UUID (Foreign Key to personnel.id)
- status: TEXT ('pending', 'approved', 'revision', 'rejected')
- reviewer_notes: TEXT
- assigned_at: TIMESTAMP
- reviewed_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### RLS Policies
- Users can view review assignments they are involved in
- Only report uploaders and admins can assign reviewers
- Only assigned reviewers can update their review status
- Admins and report owners can delete review assignments

## Testing

### Test Cases
1. **Single Reviewer Assignment**: Ensure backward compatibility
2. **Multiple Reviewer Assignment**: Assign 2-3 reviewers to a report
3. **Reviewer Removal**: Add and remove reviewers before upload
4. **Self-Assignment Prevention**: Verify users cannot assign themselves
5. **Empty Assignment Prevention**: Ensure at least one reviewer is required

### UI Testing
1. Verify "+" button adds reviewers
2. Verify "X" button removes reviewers
3. Verify badge display shows reviewer name and position
4. Verify validation messages appear correctly
5. Verify available reviewers list updates as selections change

## Future Enhancements
1. **Bulk Review Actions**: Allow batch approval/rejection
2. **Review Workflow**: Define rules like "require 2 approvals"
3. **Notification System**: Notify all assigned reviewers
4. **Review Priority**: Assign priority levels to different reviewers
5. **Review Delegation**: Allow reviewers to delegate to others

## Notes
- The feature maintains backward compatibility with existing single reviewer assignments
- The `assigned_reviewer` field in the `reports` table is no longer used for new uploads
- Existing reports with the old single reviewer field will continue to work
- The migration includes proper RLS policies for security
