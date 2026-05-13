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
