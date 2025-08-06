# Supported File Types for Document Upload

## ✅ Supported File Categories

### 📄 Documents
- **PDF**: `.pdf` → `application/pdf`
- **Microsoft Word**: `.doc`, `.docx` → `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Microsoft Excel**: `.xls`, `.xlsx` → `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Microsoft PowerPoint**: `.ppt`, `.pptx` → `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`
- **Text Files**: `.txt` → `text/plain`
- **CSV**: `.csv` → `text/csv`

### 🖼️ Images
- **JPEG**: `.jpg`, `.jpeg` → `image/jpeg`
- **PNG**: `.png` → `image/png`
- **GIF**: `.gif` → `image/gif`
- **BMP**: `.bmp` → `image/bmp`
- **WebP**: `.webp` → `image/webp`
- **SVG**: `.svg` → `image/svg+xml`

### 📦 Archives
- **ZIP**: `.zip` → `application/zip` *(Fixed MIME type issue)*
- **RAR**: `.rar` → `application/x-rar-compressed`
- **7-Zip**: `.7z` → `application/x-7z-compressed`
- **TAR**: `.tar` → `application/x-tar`
- **GZIP**: `.gz` → `application/gzip`

### 🏗️ CAD Files
- **AutoCAD Drawing**: `.dwg` → `image/vnd.dwg`
- **AutoCAD Exchange**: `.dxf` → `image/vnd.dxf`

### 🎥 Video Files
- **MP4**: `.mp4` → `video/mp4`
- **AVI**: `.avi` → `video/x-msvideo`
- **QuickTime**: `.mov` → `video/quicktime`
- **Windows Media**: `.wmv` → `video/x-ms-wmv`
- **WebM**: `.webm` → `video/webm`

### 🎵 Audio Files
- **MP3**: `.mp3` → `audio/mpeg`
- **WAV**: `.wav` → `audio/wav`
- **FLAC**: `.flac` → `audio/flac`
- **AAC**: `.aac` → `audio/aac`

### 💻 Code Files
- **JavaScript**: `.js` → `text/javascript`
- **TypeScript**: `.ts` → `text/typescript`
- **HTML**: `.html` → `text/html`
- **CSS**: `.css` → `text/css`
- **Python**: `.py` → `text/x-python`
- **Java**: `.java` → `text/x-java`
- **C/C++**: `.c`, `.cpp` → `text/x-c`

### 📋 Data Files
- **JSON**: `.json` → `application/json`
- **XML**: `.xml` → `application/xml`

## 🔧 Technical Details

### MIME Type Normalization
The system now includes a `normalizeMimeType()` function that:
- Handles different browser MIME type variations
- Ensures compatibility with Supabase storage
- Fixes common MIME type issues (like ZIP files)

### Upload Configuration
```typescript
// Storage upload with explicit content type
await supabase.storage
  .from('project-reports')
  .upload(filePath, fileToUpload, {
    contentType: normalizedMimeType,
    upsert: false
  })
```

### Error Handling
- Better error messages for unsupported file types
- Console logging for debugging MIME type issues
- Graceful fallback to `application/octet-stream` for unknown types

## 🐛 Previous Issues Fixed
- **ZIP Files**: Fixed `application/x-zip-compressed` → `application/zip` conversion
- **File Type Detection**: Improved extension-based fallback detection
- **Database Storage**: Proper MIME type truncation for database constraints

## 📝 Usage Notes
1. File size limits depend on your Supabase storage configuration
2. All files are automatically organized in project-specific folders
3. Unique filenames are generated to prevent conflicts
4. File metadata is stored in the database for easy searching

## 🔮 Future Enhancements
- Additional specialized file types (e.g., BIM files, GIS formats)
- File type validation before upload
- Thumbnail generation for images
- Preview functionality for supported file types
