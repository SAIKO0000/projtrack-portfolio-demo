"use client"

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

export interface ReportFileUploadResult {
  url: string
  path: string
}

export function useReportOperations() {
  const queryClient = useQueryClient()

  const uploadReportFile = async (file: File, reportId: string): Promise<ReportFileUploadResult> => {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${reportId}/${Date.now()}.${fileExt}`
    
    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('report-attachments')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('report-attachments')
      .getPublicUrl(fileName)

    return {
      url: urlData.publicUrl,
      path: fileName
    }
  }

  const updateReportWithFile = async (reportId: string, fileUrl: string, fileName: string) => {
    const { error } = await supabase
      .from('reports')
      .update({ 
        file_url: fileUrl,
        file_name: fileName,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)

    if (error) {
      throw new Error(`Database update failed: ${error.message}`)
    }
  }

  const uploadReportFilesMutation = useMutation({
    mutationFn: async ({ files, reportId }: { files: File[], reportId: string }) => {
      const results = []
      
      for (const file of files) {
        const uploadResult = await uploadReportFile(file, reportId)
        await updateReportWithFile(reportId, uploadResult.url, file.name)
        results.push(uploadResult)
      }
      
      return results
    },
    onSuccess: () => {
      // Instantly invalidate and refetch reports data
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['report-files'] })
      toast.success('Files uploaded successfully!')
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`)
    }
  })

  const deleteReportFileMutation = useMutation({
    mutationFn: async ({ reportId, filePath }: { reportId: string, filePath: string }) => {
      // Remove from storage
      const { error: storageError } = await supabase.storage
        .from('report-attachments')
        .remove([filePath])

      if (storageError) throw storageError

      // Update database to remove file reference
      const { error: dbError } = await supabase
        .from('reports')
        .update({ 
          file_url: null,
          file_name: undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)

      if (dbError) throw dbError
    },
    onSuccess: () => {
      // Instantly invalidate and refetch reports data
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['report-files'] })
      toast.success('File removed successfully')
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`)
    }
  })

  return {
    uploadReportFiles: uploadReportFilesMutation.mutate,
    deleteReportFile: deleteReportFileMutation.mutate,
    uploading: uploadReportFilesMutation.isPending,
    deleting: deleteReportFileMutation.isPending
  }
}
