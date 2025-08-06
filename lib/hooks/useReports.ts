import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import type { Database } from '../supabase.types'

type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]
type Report = Database['public']['Tables']['reports']['Row']
type ReportInsert = Database['public']['Tables']['reports']['Insert']

export function useReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fetchReports = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('uploaded_at', { ascending: false })

      if (error) {
        console.error('Database error:', error)
        throw error
      }
      
      setReports(data || [])
    } catch (error) {
      console.error('Error fetching reports:', error)    } finally {
      setLoading(false)
    }
  }

  // Normalize MIME types for better Supabase compatibility
  const normalizeMimeType = (file: File): string => {
    const extension = file.name.split('.').pop()?.toLowerCase()
    const originalType = file.type.toLowerCase()
    
    // Handle zip files with different MIME types
    if (extension === 'zip' || originalType.includes('zip')) {
      return 'application/zip'
    }
    
    // Handle other compressed files
    if (extension === 'rar') return 'application/x-rar-compressed'
    if (extension === '7z') return 'application/x-7z-compressed'
    if (extension === 'tar') return 'application/x-tar'
    if (extension === 'gz') return 'application/gzip'
    
    // Handle document types
    if (extension === 'pdf') return 'application/pdf'
    if (extension === 'doc') return 'application/msword'
    if (extension === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    if (extension === 'xls') return 'application/vnd.ms-excel'
    if (extension === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    if (extension === 'ppt') return 'application/vnd.ms-powerpoint'
    if (extension === 'pptx') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    
    // Handle text files
    if (extension === 'txt') return 'text/plain'
    if (extension === 'csv') return 'text/csv'
    if (extension === 'json') return 'application/json'
    if (extension === 'xml') return 'application/xml'
    
    // Handle images
    if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg'
    if (extension === 'png') return 'image/png'
    if (extension === 'gif') return 'image/gif'
    if (extension === 'bmp') return 'image/bmp'
    if (extension === 'webp') return 'image/webp'
    if (extension === 'svg') return 'image/svg+xml'
    
    // Handle CAD files
    if (extension === 'dwg') return 'image/vnd.dwg'
    if (extension === 'dxf') return 'image/vnd.dxf'
    
    // Handle video files
    if (extension === 'mp4') return 'video/mp4'
    if (extension === 'avi') return 'video/x-msvideo'
    if (extension === 'mov') return 'video/quicktime'
    if (extension === 'wmv') return 'video/x-ms-wmv'
    if (extension === 'webm') return 'video/webm'
    
    // Handle audio files
    if (extension === 'mp3') return 'audio/mpeg'
    if (extension === 'wav') return 'audio/wav'
    if (extension === 'flac') return 'audio/flac'
    if (extension === 'aac') return 'audio/aac'
    
    // Handle code files
    if (extension === 'js') return 'text/javascript'
    if (extension === 'ts') return 'text/typescript'
    if (extension === 'html') return 'text/html'
    if (extension === 'css') return 'text/css'
    if (extension === 'py') return 'text/x-python'
    if (extension === 'java') return 'text/x-java'
    if (extension === 'cpp' || extension === 'c') return 'text/x-c'
    
    // Return original type if no normalization needed
    return originalType || 'application/octet-stream'
  }

  const uploadReport = async (
    file: File,
    projectId: string,
    category: string,
    status: string = 'pending',
    description?: string
  ) => {
    try {
      setUploading(true)
      setUploadProgress(0)

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2)
      const fileName = `${projectId}_${timestamp}_${randomId}.${fileExt}`
      const filePath = `reports/${projectId}/${fileName}`

      // Normalize MIME type for better compatibility
      const normalizedMimeType = normalizeMimeType(file)
      
      // Create a new File object with normalized MIME type if needed
      const fileToUpload = file.type !== normalizedMimeType 
        ? new File([file], file.name, { type: normalizedMimeType })
        : file

      console.log('Upload debug:', {
        originalFileName: file.name,
        originalMimeType: file.type,
        normalizedMimeType: normalizedMimeType,
        extension: file.name.split('.').pop()?.toLowerCase()
      })

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('project-reports')
        .upload(filePath, fileToUpload, {
          contentType: normalizedMimeType,
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        throw new Error(`Storage upload failed: ${uploadError.message}`)
      }      setUploadProgress(50)

      // Truncate fields to match database constraints - file_type has 50 char limit
      const truncatedFileName = file.name.length > 255 ? file.name.substring(0, 255) : file.name
      const truncatedFileType = normalizedMimeType && normalizedMimeType.length > 50 ? normalizedMimeType.substring(0, 50) : normalizedMimeType
      const truncatedCategory = category.length > 50 ? category.substring(0, 50) : category
      const truncatedStatus = status.length > 50 ? status.substring(0, 50) : status
      const truncatedDescription = description && description.length > 1000 ? description.substring(0, 1000) : description

      // Save report metadata to database
      const reportData: ReportInsert = {
        project_id: projectId,
        file_name: truncatedFileName,
        file_path: filePath,
        file_size: file.size,
        file_type: truncatedFileType || null,
        category: truncatedCategory,
        status: truncatedStatus,
        description: truncatedDescription || null,
        uploaded_by: null, // Will be set when auth is implemented
      }

      const { data: report, error: dbError } = await supabase
        .from('reports')
        .insert(reportData)
        .select()
        .single()

      if (dbError) {
        console.error('Database error details:', {
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
          code: dbError.code,
          reportData
        })
        throw new Error(`Database insert failed: ${dbError.message}`)
      }

      setUploadProgress(100)

      // Refresh reports list
      await fetchReports()
      return report
    } catch (error) {
      console.error('Error uploading report:', error)
      throw error
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const getReportUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('project-reports')
      .getPublicUrl(filePath)
    return data.publicUrl
  }

  const downloadReport = async (report: Report) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-reports')
        .download(report.file_path)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = report.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading report:', error)
      throw error
    }
  }

  const deleteReport = async (reportId: string) => {
    try {
      // Get report details first
      const { data: report, error: fetchError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single()

      if (fetchError) throw fetchError

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('project-reports')
        .remove([report.file_path])

      if (storageError) {
        console.error('Error deleting from storage:', storageError)
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId)

      if (dbError) throw dbError

      // Refresh reports list
      await fetchReports()
    } catch (error) {
      console.error('Error deleting report:', error)
      throw error
    }
  }

  const updateReport = async (reportId: string, updates: Partial<Pick<Tables<'reports'>['Update'], 'file_name' | 'project_id' | 'category' | 'status' | 'description'>>) => {
    if (!reportId) {
      throw new Error('Report ID is required')
    }

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('reports')
        .update(updates)
        .eq('id', reportId)
        .select()
        .single()

      if (error) throw error

      // Update local state
      setReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, ...data } : r
      ))

      return data
      
    } catch (error) {
      console.error('Error updating report:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  return {
    reports,
    loading,
    uploading,
    uploadProgress,
    fetchReports,
    uploadReport,
    getReportUrl,
    downloadReport,
    deleteReport,
    updateReport
  }
}
