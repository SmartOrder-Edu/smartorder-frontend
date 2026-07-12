import request from './request'
import type { ResourceDetailVO } from '@/types/learningSpace'

export const learningResourceApi = {
  async detail(resourceId: string): Promise<ResourceDetailVO> {
    return request.get(`/resources/${resourceId}`)
  },
}

export default learningResourceApi
