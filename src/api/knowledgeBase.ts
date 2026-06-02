import request from './request'

// 知识库更新请求 DTO
export interface KnowledgeBaseReqDTO {
  id: number
  name: string
  category: string
  description?: string
  coverUrl?: string
}

// 知识库创建请求 DTO
export interface KnowledgeBaseCreateReqDTO {
  name: string            // 知识库名称
  category: string        // 知识库分类
  description?: string    // 知识库描述
  coverUrl?: string       // 知识库封面上传后返回并提交的URL
}

// 知识库列表响应 VO
export interface KnowledgeBaseListRespVO {
  id: number
  name: string
  category: string
  description?: string
  coverUrl?: string
  fileCount: number
  documentCount: number
  updatedAt?: string // 后端返回的 LocalDateTime
}

// 知识库统计信息 VO
export interface KnowledgeBaseStatsVO {
  knowledgeBaseCount: number
  fileCount: number
  chunkCount: number
}

/**
 * 步骤 1：上传知识库封面
 * @param file 封面图片文件
 * @returns 封面上传后的 URL 链接
 */
export const uploadKnowledgeBaseCover = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  
  // 上传文件通常需要覆盖默认的 application/json Content-Type
  return request.post<string>('/knowledge/base/upload/cover', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 步骤 2：提交表单新建知识库
 * @param data 知识库创建信息
 * @returns 创建成功的知识库 ID
 */
export const createKnowledgeBase = (data: KnowledgeBaseCreateReqDTO) => {
  return request.post<number>('/knowledge/base/create', data)
}

/**
 * 更新知识库
 * @param data 知识库更新信息
 */
export const updateKnowledgeBase = (data: KnowledgeBaseReqDTO) => {
  return request.post<boolean>('/knowledge/base/update', data)
}

/**
 * 获取知识库列表
 */
export const getKnowledgeBaseList = () => {
  return request.get<KnowledgeBaseListRespVO[]>('/knowledge/base/list')
}

// 知识库详情统计信息 VO
export interface KnowledgeBaseDetailStatsVO {
  fileCount: number
  chunkCount: number
  embeddedFileCount: number
}

/**
 * 获取知识库统计信息
 */
export const getKnowledgeBaseStats = () => {
  return request.get<KnowledgeBaseStatsVO>('/knowledge/base/stats')
}

/**
 * 获取指定知识库的详细统计信息
 */
export const getKnowledgeBaseDetailStats = (id: number) => {
  return request.get<KnowledgeBaseDetailStatsVO>(`/knowledge/base/${id}/stats`)
}

/**
 * 查询知识库文件列表参数
 */
export interface KnowledgeFileListReqDTO {
  knowledgeBaseId: number
  pageNum?: number
  pageSize?: number
}

export interface KnowledgeFilePageVO {
  id: number
  originalName: string
  fileUrl: string
  fileExtension: string
  mimeType: string
  fileSize: number
  parseStatus: string
  chunkStatus: string
  embeddingStatus: string
  pageCount: number
  wordCount: number
  chunkCount: number
  createdAt: string
}

export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
}

/**
 * 分页查询知识库下的文件
 */
export const getKnowledgeFileList = (params: KnowledgeFileListReqDTO) => {
  return request.get<PageResult<KnowledgeFilePageVO>>('/knowledge/file/list', { params })
}

// ======================= 文件分片上传 DTO =======================

export interface ChunkUploadInitReqDTO {
  fileHash: string
  fileName: string
  fileSize: number
  knowledgeBaseId: number
}

export interface ChunkUploadInitRespDTO {
  isFinished: boolean
  fileUrl?: string
  uploadId?: string
  uploadedParts?: number[]
}

export interface ChunkUploadMergeReqDTO {
  uploadId: string
  fileHash: string
  fileName: string
  fileSize: number
  knowledgeBaseId: number
  totalParts: number
}

/**
 * 1. 检查并初始化分片上传 (支持秒传和断点检查)
 */
export const initUpload = (data: ChunkUploadInitReqDTO) => {
  return request.post<ChunkUploadInitRespDTO>('/knowledge/file/upload/init', data)
}

/**
 * 2. 上传文件分片
 */
export const uploadChunk = (uploadId: string, partNumber: number, fileChunk: Blob) => {
  const formData = new FormData()
  formData.append('uploadId', uploadId)
  formData.append('partNumber', partNumber.toString())
  formData.append('file', fileChunk)
  
  return request.post<boolean>('/knowledge/file/upload/chunk', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 3. 所有分片上传完成，请求合并
 */
export const mergeChunks = (data: ChunkUploadMergeReqDTO) => {
  return request.post<string>('/knowledge/file/upload/merge', data)
}

// ======================= 知识图谱 =======================

export interface KnowledgeGraphNodeVO {
  id: string
  name: string
  description?: string
  category?: string
  importance?: number
}

export interface KnowledgeGraphEdgeVO {
  source: string
  target: string
  relationType?: string
  weight?: number
  description?: string
}

export interface KnowledgeGraphVO {
  fileId: number
  nodes: KnowledgeGraphNodeVO[]
  edges: KnowledgeGraphEdgeVO[]
}

/**
 * 获取文件的知识图谱
 */
export const getFileKnowledgeGraph = (fileId: number) => {
  return request.get<KnowledgeGraphVO>(`/knowledge/file/${fileId}`)
}

/**
 * 删除知识库
 * @param id 知识库ID
 */
export const deleteKnowledgeBase = (id: number) => {
  return request.delete<string>(`/knowledge/base/delete/${id}`)
}

/**
 * 删除文件
 * @param id 文件ID
 */
export const deleteKnowledgeFile = (id: number) => {
  return request.delete<string>(`/knowledge/file/${id}`)
}
