import request from './request'
import type {
  SpaceDashboardVO,
  TaskVO,
  TaskStatus,
  TaskActionType,
  TaskTargetType,
  TaskType,
  ResourcePackageGenerateDTO,
  ResourcePackageVO,
  ResourceGenerationJobVO,
} from '@/types/learningSpace'

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

// ---- Resource Generation Jobs ----

export const resourceGenerationJobApi = {
  async list(spaceId: string, limit = 20): Promise<ResourceGenerationJobVO[]> {
    return request.get(`/learning-spaces/${spaceId}/resource-package/jobs`, { params: { limit } })
  },
}

// ---- Task ----

export interface CreateTaskDTO {
  spaceId: string | number
  pathNodeId?: string | number | null
  title: string
  description?: string
  taskType?: TaskType
  actionType?: TaskActionType
  targetType?: TaskTargetType | null
  targetId?: string | number | null
  priority?: number
  status?: TaskStatus
  dueDate?: string | null
  dueTime?: string | null
  estimatedDurationMinutes?: number | null
  sortOrder?: number
  aiSuggestion?: string | null
  agentReason?: string | null
  metadata?: string | Record<string, any> | null
}

export const taskApi = {
  async create(data: CreateTaskDTO): Promise<TaskVO> {
    return request.post('/tasks', data)
  },

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
