import request from './request'

export interface GeneratePptRequest {
  topic?: string
  templateStyle?: string
  targetSlides?: number
  userIntent?: string
}

export interface PptGenerationResult {
  resourceId: string
  pptId: string
  fileUrl: string
  templateId: string
  markdown: string
}

export interface DocmeeTokenVO {
  token: string
  uid: string
}

export const pptApi = {
  generateFromResource(resourceId: string, data: GeneratePptRequest): Promise<PptGenerationResult> {
    return request.post(`/resources/${resourceId}/generate-ppt`, data)
  },

  getRenderToken(resourceId: string, pptId: string): Promise<DocmeeTokenVO> {
    return request.get('/resources/docmee/token', {
      params: { resourceId, pptId },
    })
  },
}

export default pptApi
