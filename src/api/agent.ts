import request from './request'

export interface AgentChatRequest {
  message: string
  conversationId?: string
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
  createTime: string
}

export interface MessagePageResult {
  list: MessageVO[]
  total: number
  page: number
  size: number
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
}

export default { agentApi }
