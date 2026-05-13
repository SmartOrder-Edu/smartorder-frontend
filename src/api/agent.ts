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
}

export default { agentApi }
