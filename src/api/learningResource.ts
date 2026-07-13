import request from './request'
import type { ResourceDetailVO, ResourceGenerationJobVO } from '@/types/learningSpace'

export const learningResourceApi = {
  async detail(resourceId: string): Promise<ResourceDetailVO> {
    return request.get(`/resources/${resourceId}`)
  },

  async generate(resourceId: string): Promise<ResourceDetailVO> {
    return request.post(`/resources/${resourceId}/generate`)
  },

  async latestGenerationJob(resourceId: string): Promise<ResourceGenerationJobVO | null> {
    return request.get(`/resources/${resourceId}/generation-job`)
  },

  async retryGeneration(resourceId: string): Promise<ResourceGenerationJobVO> {
    return request.post(`/resources/${resourceId}/retry-generation`)
  },
}

export default learningResourceApi
