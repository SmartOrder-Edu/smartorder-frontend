import { fetchEventSource } from '@microsoft/fetch-event-source'
import request from './request'
import { refreshAccessToken } from './request'
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
  ResourceVO,
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

export type ResourcePackageStreamEventName =
  | 'package-start'
  | 'resource-start'
  | 'resource-token'
  | 'resource-done'
  | 'resource-failed'
  | 'package-done'
  | 'package-failed'

export interface ResourcePackageStreamEvent {
  packageId?: string
  package?: ResourcePackageVO
  jobId?: string
  resourceId?: string
  resource?: ResourceVO
  resourceType?: string
  title?: string
  chunk?: string
  contentId?: string
  contentType?: string
  status?: string
  message?: string
}

export interface StreamResourcePackageHandlers {
  signal?: AbortSignal
  onEvent?: (eventName: ResourcePackageStreamEventName, payload: ResourcePackageStreamEvent) => void
}

function parseStreamPayload(data: string): ResourcePackageStreamEvent | null {
  try {
    return JSON.parse(data) as ResourcePackageStreamEvent
  } catch {
    return null
  }
}

export async function streamGenerateResourcePackage(
  spaceId: string,
  data: ResourcePackageGenerateDTO,
  handlers: StreamResourcePackageHandlers = {}
) {
  const base = import.meta.env.VITE_API_BASE_URL || '/api'
  const token = await refreshAccessToken()

  await fetchEventSource(`${base}/learning-spaces/${spaceId}/resource-package/generate/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    openWhenHidden: true,
    signal: handlers.signal,

    onopen(response) {
      if (!response.ok) {
        throw new Error(`资料包生成请求失败：${response.status}`)
      }
      return Promise.resolve()
    },

    onmessage(event) {
      if (!event.data) return
      const payload = parseStreamPayload(event.data)
      if (!payload) return
      handlers.onEvent?.((event.event || 'resource-token') as ResourcePackageStreamEventName, payload)
    },
  })
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

export interface PlanTodayTasksDTO {
  maxTasks?: number
  totalAvailableMinutes?: number
  strategy?: 'deadline_first' | 'weakness_first' | 'balanced'
  allowedActionTypes?: TaskActionType[]
}

export interface PlanTodayScheduleRequest extends PlanTodayTasksDTO {
  createPracticeTasks?: boolean
  createResourceTasks?: boolean
  resourceTypes?: string[]
  resourceTaskCount?: number
  resourceTargetMinutes?: number
  resourceDueTime?: string
  evaluationTaskType?: 'practice_set' | 'assessment'
  practiceTaskCount?: number
  practiceQuestionCount?: number
  practiceDifficulty?: number
  practiceTopic?: string
  practiceDueTime?: string
}

export interface AgentScheduleEvidence {
  recentDays: number
  recentRecordCount: number
  recentSpaces: string[]
  recentStudyMinutes: number
  recentCompletedTasks: number
  recentPlannedTasks: number
  recentCompletionRate: number
  averageFocusLevel: number | null
  averageSelfRating: number | null
  todayExistingTaskCount: number
  unfinishedTaskCount: number
  overdueTaskCount: number
  availableMinutes: number
  strategy: 'deadline_first' | 'weakness_first' | 'balanced' | string
  weakSignals: string[]
  decisionBasis: string[]
}

export interface AgentScheduleProcessStep {
  key: string
  label: string
  status: 'pending' | 'running' | 'completed' | 'failed' | string
  detail: string
}

export interface AgentScheduleTaskPayload {
  taskId: string
  spaceId: string
  pathNodeId: string | null
  title: string
  taskType: TaskType
  actionType?: TaskActionType
  targetType?: TaskTargetType | null
  targetId?: string | number | null
  priority: number
  dueDate: string | null
  dueTime: string | null
  estimatedDurationMinutes: number | null
  agentReason?: string | null
}

export interface AgentScheduleTaskReason {
  taskId: string
  title: string
  reason: string
  evidenceTags: string[]
}

export interface PlanTodayScheduleResult {
  type: 'today_schedule_created'
  summary: string
  date: string
  strategy: string
  evidence: AgentScheduleEvidence
  processSteps: AgentScheduleProcessStep[]
  learningTaskCount: number
  resourceTaskCount: number
  practiceTaskCount: number
  createdTaskCount: number
  tasks: AgentScheduleTaskPayload[]
  taskReasons: AgentScheduleTaskReason[]
  actions: Array<Record<string, any>>
}

export const taskApi = {
  async listToday(): Promise<TaskVO[]> {
    return request.get('/tasks/today')
  },

  async listPending(): Promise<TaskVO[]> {
    return request.get('/tasks/pending')
  },

  async listOverdue(): Promise<TaskVO[]> {
    return request.get('/tasks/overdue')
  },

  async create(data: CreateTaskDTO): Promise<TaskVO> {
    return request.post('/tasks', data)
  },

  async planToday(data: PlanTodayTasksDTO = {}): Promise<TaskVO[]> {
    return request.post('/tasks/plan-today', data)
  },

  async updateStatus(taskId: string, status: TaskStatus): Promise<TaskVO> {
    return request.patch(`/tasks/${taskId}/status`, { status })
  },

  async complete(taskId: string, data: { actualDurationMinutes: number }): Promise<TaskVO> {
    return request.patch(`/tasks/${taskId}/complete`, data)
  },
}

export const agentScheduleApi = {
  async planToday(data: PlanTodayScheduleRequest = {}): Promise<PlanTodayScheduleResult> {
    return request.post('/agent/daily-schedule/plan-today', data)
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
