import request from './request'

export interface AttachmentUploadInitReq {
  conversationId?: string
  fileHash: string
  fileName: string
  fileSize: number
}

export interface AttachmentUploadMergeReq {
  conversationId?: string
  uploadId: string
  fileHash: string
  fileName: string
  fileSize: number
  totalParts: number
}

export interface AttachmentUploadResp {
  isFinished: boolean
  uploadId?: string
  uploadedParts?: number[]
  conversationId: string
  fileId?: number
  jobId?: number
  fileName?: string
  fileUrl?: string
  status?: string
  parseStatus?: string
  chunkStatus?: string
  embeddingStatus?: string
  progress?: number
  currentStep?: string
  errorMessage?: string
}

export interface AttachmentStatus {
  conversationId: string
  fileId: number
  jobId?: number
  fileName: string
  fileSize?: number
  fileExtension?: string
  status: 'uploading' | 'processing' | 'ready' | 'failed' | 'deleted' | string
  parseStatus?: string
  chunkStatus?: string
  embeddingStatus?: string
  progress?: number
  currentStep?: string
  errorMessage?: string
}

export const agentAttachmentApi = {
  initUpload(data: AttachmentUploadInitReq) {
    return request.post<AttachmentUploadResp>('/agent/attachments/upload/init', data)
  },

  uploadChunk(uploadId: string, partNumber: number, fileChunk: Blob) {
    const formData = new FormData()
    formData.append('uploadId', uploadId)
    formData.append('partNumber', partNumber.toString())
    formData.append('file', fileChunk)
    return request.post<boolean>('/agent/attachments/upload/chunk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  mergeUpload(data: AttachmentUploadMergeReq) {
    return request.post<AttachmentUploadResp>('/agent/attachments/upload/merge', data)
  },

  getStatus(conversationId: string, fileId: number) {
    return request.get<AttachmentStatus>(`/agent/attachments/${conversationId}/${fileId}/status`)
  },

  list(conversationId: string) {
    return request.get<AttachmentStatus[]>(`/agent/attachments/${conversationId}`)
  },

  remove(conversationId: string, fileId: number) {
    return request.delete<string>(`/agent/attachments/${conversationId}/${fileId}`)
  },
}
