import request, { type RequestConfig } from './request'
import type {
  LessonBundleGenerateRequest,
  LessonBundleStatusBatchRequest,
  LessonBundleStatusVO,
  StudyMode,
} from '@/types/study'

export const lessonBundleApi = {
  generate(data: LessonBundleGenerateRequest, config?: RequestConfig): Promise<LessonBundleStatusVO> {
    return request.post('/lesson-bundles/generate', data, config)
  },

  getByTarget(params: {
    taskId?: string
    pathNodeId?: number | string
    spaceId?: string
    mode?: StudyMode
  }): Promise<LessonBundleStatusVO> {
    return request.get('/lesson-bundles/by-target', { params, showError: false })
  },

  getByTargets(data: LessonBundleStatusBatchRequest): Promise<LessonBundleStatusVO[]> {
    return request.post('/lesson-bundles/by-targets', data, { showError: false })
  },
}

export default lessonBundleApi
