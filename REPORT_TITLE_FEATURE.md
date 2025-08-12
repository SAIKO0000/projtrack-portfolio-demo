# Report Title Feature Implementation

## Overview
This feature adds a `title` field to reports, allowing users to provide descriptive titles separate from file names. Reports are now displayed in the format "Title (File Name)" throughout the application.

## Database Migration Required

**IMPORTANT**: You need to run the SQL migration to add the title field to your database.

### Step 1: Run Database Migration

Go to your Supabase dashboard → SQL Editor and run the following migration:

```sql
-- Add title field to reports table
-- This allows reports to have descriptive titles separate from file names

-- Add the title column
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN reports.title IS 'Descriptive title for the report, displayed as "Title (File Name)"';

-- Create index for better search performance on titles
CREATE INDEX IF NOT EXISTS idx_reports_title ON reports(title);
```

**OR** run the migration file:
```bash
# In your Supabase SQL Editor, copy and paste the content from:
sql/add_title_to_reports.sql
```

### Step 2: Verify Migration

Run this query to verify the column was added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reports' AND column_name = 'title';
```

You should see:
```
column_name | data_type
title       | text
```

## Features Implemented

### 1. Report Upload Modal
- **New Title Field**: Users must enter a descriptive title when uploading reports
- **File Name Display**: Shows the selected file name as a small text hint
- **Validation**: Title field is required for new uploads
- **Position**: Title field appears right after file selection

### 2. Display Format
- **Format**: Reports display title prominently with file name in small text below
- **Title Styling**: Bold, normal size font
- **File Name Styling**: Very small (text-xs), non-bold, gray color - approximately half the size of title
- **Layout**: Title on top line, file name on separate line below
- **Fallback**: If no title exists, shows just the file name in normal styling
- **Consistency**: Applied across all components (Projects, Reports pages)

### 3. Search Enhancement
- **Multi-field Search**: Search now includes title, file name, and project name
- **Case Insensitive**: Search works regardless of case
- **Real-time**: Results update as user types

### 4. Components Updated
- **Projects Page**: 
  - Notification section shows report titles
  - Reports modal displays titles
- **Reports Page**: 
  - Main report list shows titles
  - Search includes title field
- **Report Upload Modal**: 
  - New title input field
  - Form validation includes title

## Usage Examples

### For Users:
1. **Upload New Report**:
   - Select file: "Q1_2024_Progress.pdf"
   - Enter title: "Q1 2024 Project Progress Report"
   - Display: 
     ```
     Q1 2024 Project Progress Report
     Q1_2024_Progress.pdf
     ```
     (Title in bold, file name in small gray text below)

2. **Search Reports**:
   - Can search by title: "Progress Report"
   - Can search by file name: "Q1_2024"
   - Can search by project name: "Building A"

### For Reviewers:
- Notification shows: 
  ```
  📋 You are assigned to review this report:
  Q1 2024 Project Progress Report
  Q1_2024_Progress.pdf
  ```
  (Clear visual hierarchy with prominent title and small file name)

## Backend Changes

### Database Schema
```sql
-- New column in reports table
title TEXT  -- Descriptive title for the report
```

### API Updates
- **uploadReport()**: Now accepts title parameter
- **replaceReport()**: Now accepts title parameter
- **ReportWithUploader interface**: Extended with title field

### Type Definitions
```typescript
interface ReportWithUploader {
  // ... existing fields
  title?: string  // New optional title field
}
```

## Benefits

1. **Better Organization**: Reports have meaningful, descriptive titles with clear visual hierarchy
2. **Improved Search**: Users can search by title, making reports easier to find
3. **Professional Display**: Clean title + small file name format is more professional and readable
4. **Better UX**: Clear visual distinction between title and file name
5. **Reviewer Friendly**: Easier for reviewers to identify reports with prominent titles and unobtrusive file names

## Backward Compatibility

- **Existing Reports**: Will display just the file name (no title)
- **Optional Field**: Title is optional, won't break existing functionality
- **Graceful Fallback**: If no title, displays file name as before

## Future Enhancements

1. **Bulk Edit**: Allow editing titles of existing reports
2. **Auto-suggest**: Suggest titles based on file names
3. **Title Templates**: Predefined title formats for different report types
4. **Title Validation**: Enforce title format standards
