import {
  File,
  FileText,
  FileType,
  FileSpreadsheet,
  FileImage,
  Archive,
  Layers,
  FileCode,
  Video,
  Music,
} from "lucide-react"

export const getFileIcon = (fileType: string | null, fileName?: string) => {
  if (!fileType) return (
    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
      <File className="h-10 w-10 text-gray-500" />
    </div>
  )
  
  const type = fileType.toLowerCase()
  
  // Also check file extension from filename as fallback
  const fileExtension = fileName ? fileName.split('.').pop()?.toLowerCase() : null
  
  if (type.includes('pdf')) {
    return (
      <div className="w-16 h-16 rounded-lg bg-red-100 flex items-center justify-center">
        <FileText className="h-10 w-10 text-red-600" />
      </div>
    )
  }
  if (type.includes('word') || type.includes('doc')) {
    return (
      <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
        <FileText className="h-10 w-10 text-blue-600" />
      </div>
    )
  }
  if (type.includes('text') || type === 'txt') {
    return (
      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
        <FileType className="h-10 w-10 text-gray-600" />
      </div>
    )
  }
  if (type.includes('excel') || type.includes('sheet') || type === 'xlsx' || type === 'xls' || type === 'csv') {
    return (
      <div className="w-16 h-16 rounded-lg bg-green-100 flex items-center justify-center">
        <FileSpreadsheet className="h-10 w-10 text-green-600" />
      </div>
    )
  }
  if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(type)) {
    return (
      <div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center">
        <FileImage className="h-10 w-10 text-purple-600" />
      </div>
    )
  }
  if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar') || type.includes('gz') || 
      ['zip', 'rar', '7z', 'tar', 'gz'].includes(type) || fileExtension === 'zip') {
    return (
      <div className="w-16 h-16 rounded-lg bg-yellow-100 flex items-center justify-center">
        <Archive className="h-10 w-10 text-yellow-600" />
      </div>
    )
  }
  if (['dwg', 'dxf', 'cad'].includes(type)) {
    return (
      <div className="w-16 h-16 rounded-lg bg-cyan-100 flex items-center justify-center">
        <Layers className="h-10 w-10 text-cyan-600" />
      </div>
    )
  }
  if (type.includes('video') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(type)) {
    return (
      <div className="w-16 h-16 rounded-lg bg-pink-100 flex items-center justify-center">
        <Video className="h-10 w-10 text-pink-600" />
      </div>
    )
  }
  if (type.includes('audio') || ['mp3', 'wav', 'flac', 'aac'].includes(type)) {
    return (
      <div className="w-16 h-16 rounded-lg bg-indigo-100 flex items-center justify-center">
        <Music className="h-10 w-10 text-indigo-600" />
      </div>
    )
  }
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'cpp', 'c'].includes(type)) {
    return (
      <div className="w-16 h-16 rounded-lg bg-orange-100 flex items-center justify-center">
        <FileCode className="h-10 w-10 text-orange-600" />
      </div>
    )
  }
  
  return (
    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
      <File className="h-10 w-10 text-gray-500" />
    </div>
  )
}
