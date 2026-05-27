import { getMockDashboard, mockUpdateTaskStatus, mockCompleteTask } from '@/mocks/spaceDashboard'
import type { SpaceDashboardVO, TaskVO, TaskStatus } from '@/types/learningSpace'

// ============================================================
// 空间仪表盘 + 任务 API 适配层
// 当前使用 mock 数据。后端就绪后切换为真实 API 调用即可。
// 切换方式：取消注释 request.xxx 行，删除 mock 调用。
// ============================================================

// import request from './request'

// ---- Space Dashboard ----

export const spaceDashboardApi = {
  async getDashboard(spaceId: number): Promise<SpaceDashboardVO> {
    // TODO: 切换为真实 API
    // return request.get(`/learning-spaces/${spaceId}/dashboard`)

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 400))
    return getMockDashboard(spaceId)
  },
}

// ---- Task ----

export const taskApi = {
  async updateStatus(taskId: number, status: TaskStatus): Promise<TaskVO> {
    // TODO: 切换为真实 API
    // return request.patch(`/tasks/${taskId}/status`, { status })

    await new Promise(resolve => setTimeout(resolve, 200))
    return mockUpdateTaskStatus(taskId, status)
  },

  async complete(taskId: number, data: { actualDurationMinutes: number }): Promise<TaskVO> {
    // TODO: 切换为真实 API
    // return request.patch(`/tasks/${taskId}/complete`, data)

    await new Promise(resolve => setTimeout(resolve, 200))
    return mockCompleteTask(taskId, data)
  },
}

// ---- Task Steps ----

import { getMockTaskSteps } from '@/mocks/taskSteps'
import type { TaskStepVO } from '@/types/learningSpace'

export const taskStepApi = {
  async getSteps(taskId: number): Promise<TaskStepVO[]> {
    // TODO: 切换为真实 API
    // return request.get(`/tasks/${taskId}/steps`)

    await new Promise(resolve => setTimeout(resolve, 300))
    return getMockTaskSteps(taskId)
  },
}
