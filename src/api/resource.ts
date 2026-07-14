import request from '@/utils/request'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import type { FileFolderContentVO, CreateFolderDTO } from '@/types/resource'

/** 查询文件夹内容（子文件夹 + 文件列表） */
export function getFolderContent(parentId: string) {
  return request.get<FileFolderContentVO>(`/yun-resource/folders/${parentId}`)
}

/** 获取文件夹树（全量） */
export function getFolderTree() {
  return request.get<FileFolderContentVO>('/yun-resource/folders/tree')
}

/** 创建文件夹 */
export function createFolder(data: CreateFolderDTO) {
  return request.post<string>('/yun-resource/folders', data)
}

/** 重命名文件夹 */
export function updateFolder(id: string, folderName: string) {
  return request.put<string>(`/yun-resource/folders/${id}`, null, {
    params: { folderName }
  })
}

/** 删除文件夹 */
export function deleteFolder(id: string) {
  return request.delete<string>(`/yun-resource/folders/${id}`)
}

/** 移动文件夹 */
export function moveFolder(id: string, targetParentId: string) {
  return request.post<string>('/yun-resource/folders/move', null, {
    params: { id, targetParentId }
  })
}

// ======================= 文件普通操作 =======================

/** 上传文件 (单文件普通上传) */
export function uploadFile(file: File, parentId: string) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('parentId', parentId)
  return request.post<string>('/yun-resource/file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/** 删除文件 */
export function deleteFile(id: string) {
  return request.delete<string>(`/yun-resource/file/${id}`)
}

/** 获取文件详情 */
export function getFileDetail(id: string) {
  return request.get<any>(`/yun-resource/file/${id}`)
}

/** 移动文件 */
export function moveFile(fileId: string, targetFolderId: string) {
  return request.post<string>('/yun-resource/file/move', null, {
    params: { fileId, targetFolderId }
  })
}

/** 批量移动文件夹和文件到目标文件夹 */
export function batchMoveToFolder(data: {
  folderId: string
  folders: { folderId: string }[]
  files: { id: string }[]
}) {
  return request.post<string>('/yun-resource/folders/batch-move', data)
}

/** 更新解析状态 */
export function updateParseStatus(id: string, parseStatus: string) {
  return request.put<string>(`/yun-resource/file/${id}/parse-status`, null, {
    params: { parseStatus }
  })
}

// ======================= 文件分片上传 =======================

export interface InitUploadReq {
  fileHash: string
  fileName: string
  fileSize: number
  targetFolderId: string
}

export interface InitUploadRes {
  uploadId: string
  uploadedChunksParts: number[]
  fileId: string
  isFinished?: boolean
}

/** 初始化分片上传（支持秒传和断点续传检查） */
export const apiInitUpload = (data: InitUploadReq) => {
  return request.post<InitUploadRes>('/yun-resource/file/init', data)
}

/** 获取分片上传签名 URL */
export const apiGetSignUrl = (params: { fileHash: string, partNumber: number }) => {
  return request.get<string>('/yun-resource/file/sign', { params })
}

/** 直接上传分片到 OSS（绕过后端，不携带 token） */
export const apiUploadChunkToOSS = async (url: string, chunk: Blob) => {
  const res = await fetch(url, {
    method: 'PUT',
    body: chunk
  })
  if (!res.ok) throw new Error('Upload to OSS failed')
  return res.headers.get('ETag') || ''
}

/** 通知后端某分片上传完成 */
export const apiChunkDone = (params: { fileHash: string, chunkNumber: number, eTag: string }) => {
  return request.post('/yun-resource/file/chunk', null, { params })
}

/** 请求后端合并所有分片 */
export const apiMergeChunks = (params: { fileHash: string, fileId: string }) => {
  return request.post('/yun-resource/file/merge', null, { params })
}

/** 取消上传 */
export const apiCancelUpload = (params: { fileHash: string }) => {
  return request.post('/yun-resource/file/cancel', null, { params })
}

/** 下载文件 — 用 <a> 标签让浏览器原生下载，避免大文件撑爆前端内存 */
export function downloadFile(id: string | undefined, fileName: string) {
  if (!id) {
    console.error('downloadFile: id is undefined, 请检查文件数据是否有 id 字段')
    return
  }
  const base = import.meta.env.VITE_API_BASE_URL || '/api'
  const token = localStorage.getItem('token')
  const url = `${base}/yun-resource/download/${id}?token=${token}`
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/** 获取文件预览的直链 URL */
export function getPreviewUrl(id: string | undefined): string {
  if (!id) {
    console.error('getPreviewUrl: id is undefined')
    return ''
  }
  const base = import.meta.env.VITE_API_BASE_URL || '/api'
  const token = localStorage.getItem('token')
  return `${base}/yun-resource/preview/${id}?token=${token}`
}

// ======================= 文件夹导出 =======================

export interface ExportProgress {
  processedFiles: number
  totalFiles: number
  processedBytes: number
  totalBytes: number
  percent: number
}

export interface ExportComplete {
  taskId: string
  fileName: string
}

/** 发起文件夹导出任务 */
export function exportFolder(folderId: string): Promise<{ taskId: string }> {
  return request.post(`/yun-resource/folders/${folderId}/export`)
}

/** 取消导出任务 */
export function cancelExportTask(taskId: string) {
  return request.delete(`/yun-resource/folders/export/${taskId}`)
}

/** SSE 订阅导出进度 */
export function createExportEventSource(
  taskId: string,
  callbacks: {
    onProgress: (data: ExportProgress) => void
    onComplete: (data: ExportComplete) => void
    onError: (message: string) => void
    onCancelled: () => void
  }
): { abort: () => void } {
  const base = import.meta.env.VITE_API_BASE_URL || '/api'
  const token = localStorage.getItem('token')
  const ctrl = new AbortController()

  fetchEventSource(`${base}/yun-resource/folders/export/${taskId}/progress?token=${token}`, {
    method: 'GET',
    signal: ctrl.signal,
    openWhenHidden: true,
    onmessage(event) {
      try {
        const data = JSON.parse(event.data)
        switch (event.event) {
          case 'progress':
            callbacks.onProgress(data)
            break
          case 'complete':
            callbacks.onComplete(data)
            break
          case 'error':
            callbacks.onError(data?.message || '导出失败')
            break
          case 'cancelled':
            callbacks.onCancelled()
            break
        }
      } catch {
        // 忽略解析错误
      }
    },
    onerror(err) {
      console.error('SSE 导出进度连接异常:', err)
      // 不抛出异常 — fetchEventSource 默认会重试
    },
  })

  return { abort: () => ctrl.abort() }
}

/** 下载导出完成的 zip 文件（<a> 标签下载） */
export function downloadExportZip(taskId: string, fileName: string) {
  const base = import.meta.env.VITE_API_BASE_URL || '/api'
  const token = localStorage.getItem('token')
  const url = `${base}/yun-resource/folders/export/${taskId}/download?token=${token}`
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
