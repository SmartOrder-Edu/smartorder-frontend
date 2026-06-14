import request from './request'

// ---- Type Definitions ----

export type LearningSpaceType = 'course' | 'exam' | 'project' | 'career' | 'competition'
export type LearningSpaceStatus = 'active' | 'archived' | 'completed'

/** 匹配后端 LearningSpaceDTO */
export interface LearningSpaceDTO {
  name?: string
  type?: LearningSpaceType
  description?: string
  iconUrl?: string
  coverUrl?: string
  goals?: string // JSON string
  startDate?: string // YYYY-MM-DD
  targetEndDate?: string
  sortOrder?: number
}

/** 匹配后端 LearningSpaceVO */
export interface LearningSpaceVO {
  id: string
  userId: string
  name: string
  type: LearningSpaceType
  description: string
  iconUrl: string
  coverUrl: string
  goals: string // JSON string
  progress: number // 0-100
  status: LearningSpaceStatus
  startDate: string
  targetEndDate: string
  actualEndDate: string | null
  sortOrder: number
  createTime: string
  updateTime: string
}

// ---- Client-side display types ----

export type SpaceHealthStatus = 'normal' | 'warning' | 'danger' | 'good'

export interface PathNode {
  id: string
  week: number
  name: string
  description: string
  duration: string
  status: 'completed' | 'current' | 'locked'
}

export interface SpaceTask {
  id: string
  title: string
  type: 'practice' | 'review' | 'project' | 'learn' | 'test'
  minutes: number
  agentReason: string
  status: 'todo' | 'done'
}

export interface SpaceResource {
  id: string
  title: string
  type: 'doc' | 'quiz' | 'mindmap' | 'table'
}

/** 扩展 VO，增加客户端展示字段 */
export interface LearningSpaceDisplay extends LearningSpaceVO {
  healthStatus: SpaceHealthStatus
  icon: string
  color: string
  colorGradient: string
  goal: string
  streakDays: number
  todaySuggestion: string
  alert: string
  agentInsight: string
  pathNodes: PathNode[]
  tasks: SpaceTask[]
  resources: SpaceResource[]
}

// ---- API ----

export const learningSpaceApi = {
  /** 创建学习空间 */
  create(data: LearningSpaceDTO) {
    return request.post<LearningSpaceVO>('/learning-spaces', data)
  },

  /** 获取当前用户的学习空间列表 */
  list(status?: LearningSpaceStatus) {
    return request.get<LearningSpaceVO[]>('/learning-spaces', {
      params: status ? { status } : undefined
    })
  },

  /** 获取单个学习空间详情 */
  detail(id: string) {
    return request.get<LearningSpaceVO>(`/learning-spaces/${id}`)
  },

  /** 更新学习空间 */
  update(id: string, data: LearningSpaceDTO) {
    return request.put<LearningSpaceVO>(`/learning-spaces/${id}`, data)
  },

  /** 删除学习空间（逻辑删除） */
  remove(id: string) {
    return request.delete<string>(`/learning-spaces/${id}`)
  },

  /** 变更学习空间状态 */
  changeStatus(id: string, status: LearningSpaceStatus) {
    return request.patch<LearningSpaceVO>(`/learning-spaces/${id}/status`, null, {
      params: { status }
    })
  }
}

export default learningSpaceApi
