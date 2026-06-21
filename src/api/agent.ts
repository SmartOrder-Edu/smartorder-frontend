import request from './request'
import type { LearningPlanDraft, PlanPauseInfo, TaskList } from '@/types/planExecute'

export interface AgentChatRequest {
  message: string
  conversationId?: string
  fileIds?: number[]
  /** 强制运行模式：'REACT' 快速回答 / 'PLAN_AND_EXECUTE' 目标规划，不传则走意图路由 */
  forceMode?: 'REACT' | 'PLAN_AND_EXECUTE'
  /** 结构化澄清回答 JSON（可选），格式: {"clarificationId": "uuid", "answer": "用户回答"} */
  clarificationAnswerJson?: string
}

export interface PlanConfirmRequest {
  draftId: string
  conversationId?: string
}

export interface PlanSummary {
  spaceId: number
  spaceName: string
  spaceType: string
  nodeCount: number
  taskCount: number
  kgNodeCount: number
  startDate: string
  targetEndDate: string
  totalPhases?: number
  totalWeeks?: number
}

export interface ExecutionStep {
  stepName: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt?: number
  completedAt?: number
  message?: string
}

export interface ConversationVO {
  conversationId: string
  title: string | null
  lastMessage: string | null
  messageCount: number
  lastActiveTime: string
}

export interface MessageVO {
  id: number
  role: string
  content: string | null
  toolName: string | null
  traceId?: string
  reasoningContent?: string
  /** 思考分段 JSON 字符串（与工具调用交错） */
  reasoningSegments?: string
  /** 本条消息关联的附件文件ID列表，JSON数组格式如[1,2,3] */
  attachmentFileIds?: string
  createTime: string
}

export interface MessagePageResult {
  list: MessageVO[]
  total: number
  page: number
  size: number
}

export interface PlanningSnapshot {
  conversationId: string
  runId?: string
  executionDraftId?: string
  learningPlanDraftId?: string
  planType?: string
  status?: string
  taskList?: TaskList
  pauseInfo?: PlanPauseInfo | null
  learningPlanDraft?: LearningPlanDraft | null
  spaceCreated?: {
    spaceId: number
    spaceName: string
  } | null
}

/**
 * Agent 对话相关 API
 */
export const agentApi = {
  chatStreamUrl(): string {
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    return `${base}/agent/chat/stream`
  },

  planConfirmUrl(): string {
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    return `${base}/agent/plan/confirm`
  },

  getTraceEvents(traceId: string) {
    return request.get(`/agent/trace/${traceId}`)
  },

  /** 获取用户对话列表 */
  getConversations() {
    return request.get<ConversationVO[]>('/agent/conversations')
  },

  /** 获取指定对话的消息（分页） */
  getConversationMessages(conversationId: string, page = 1, size = 100) {
    return request.get<MessagePageResult>(
      `/agent/conversations/${conversationId}/messages`,
      { params: { page, size } }
    )
  },

  /** 删除指定对话 */
  deleteConversation(conversationId: string) {
    return request.delete<string>(`/agent/conversations/${conversationId}`)
  },

  /** 获取指定会话的澄清记录（历史回放用） */
  getClarifications(conversationId: string) {
    return request.get<any[]>(`/agent/clarifications/${conversationId}`)
  },

  /** 获取会话的活跃计划运行态——用于加载历史会话时恢复 agentStore 状态 */
  getActiveRun(conversationId: string) {
    return request.get<any>(`/agent/conversations/${conversationId}/active-run`)
  },

  /** 获取会话级目标规划快照——用于实时/历史会话顶部唯一执行面板 */
  getPlanningSnapshot(conversationId: string) {
    return request.get<PlanningSnapshot | null>(`/agent/conversations/${conversationId}/planning-snapshot`)
  },

  /** 获取 Run 的标准化 Timeline */
  getRunTimeline(runId: string) {
    return request.get<any[]>(`/agent/runs/${runId}/timeline`)
  },
}

export default { agentApi }
