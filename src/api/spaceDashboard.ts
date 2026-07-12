import request from './request'
import type { SpaceDashboardVO, TaskVO, TaskStatus, ResourcePackageGenerateDTO, ResourcePackageVO } from '@/types/learningSpace'

// ---- Space Dashboard ----

export const spaceDashboardApi = {
  async getDashboard(spaceId: string): Promise<SpaceDashboardVO> {
    return request.get(`/learning-spaces/${spaceId}/dashboard`)
  },
}

// ---- Resource Package ----

export const resourcePackageApi = {
  async preview(spaceId: string, data: ResourcePackageGenerateDTO): Promise<ResourcePackageVO> {
    return request.post(`/learning-spaces/${spaceId}/resource-package/preview`, data)
  },

  async generate(spaceId: string, data: ResourcePackageGenerateDTO): Promise<ResourcePackageVO> {
    return request.post(`/learning-spaces/${spaceId}/resource-package/generate`, data)
  },
}

// ---- Task ----

export const taskApi = {
  async updateStatus(taskId: string, status: TaskStatus): Promise<TaskVO> {
    return request.patch(`/tasks/${taskId}/status`, { status })
  },

  async complete(taskId: string, data: { actualDurationMinutes: number }): Promise<TaskVO> {
    return request.patch(`/tasks/${taskId}/complete`, data)
  },
}

// ---- Task Steps ----

import { getMockTaskSteps } from '@/mocks/taskSteps'
import type { TaskStepVO } from '@/types/learningSpace'

export const taskStepApi = {
  async getSteps(taskId: string): Promise<TaskStepVO[]> {
    // TODO: 切换为真实 API
    // return request.get(`/tasks/${taskId}/steps`)

    await new Promise(resolve => setTimeout(resolve, 300))
    return getMockTaskSteps(taskId)
  },
}
