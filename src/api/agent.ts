import request from './request'
import type { AgentTaskSnapshot, AgentTaskStatus } from '@/db/agentCacheRepository'
import type { LearningPlanDraft, PlanPauseInfo, TaskList } from '@/types/planExecute'

export interface AgentChatRequest {
  message: string
  conversationId?: string
  fileIds?: number[]
  /** RAG 已选知识库，由现有 Agent 路由使用。 */
  knowledgeBaseIds?: number[]
  /** 学习执行页上下文：当前脚本步骤、教学段、画布、时间轴位置等 */
  studyContext?: Record<string, unknown>
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
  spaceId: string
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
  /** 新版助手消息的稳定对外 ID；兼容旧历史时回退到数值 ID。 */
  publicId?: string
  /** 会话内顺序与后端消息状态。 */
  sequenceNo?: number
  status?: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
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
    spaceId: string
    spaceName: string
  } | null
}

/**
 * Agent 对话相关 API
 */
export const agentApi = {
  /** 仅首次发送调用；同一 requestId 重试时服务端返回原任务。 */
  createTask(body: AgentChatRequest & { requestId: string }) {
    return request.post<{ taskId: string; conversationId: string; messageId: string;
      streamVersion: string; status: AgentTaskStatus }>('/agent/tasks', body)
  },

  /** F5 和异常重同步均读取服务端权威快照。 */
  getTaskSnapshot(taskId: string) {
    return request.get<AgentTaskSnapshot>(`/agent/tasks/${encodeURIComponent(taskId)}/snapshot`)
  },

  /** 按会话定位原任务；GET 不会创建新任务。 */
  getActiveChatTask(conversationId: string) {
    return request.get<{ taskId?: string; conversationId?: string; streamVersion?: string;
      status?: string }>('/agent/tasks/active', { params: { conversationId } })
  },

  /** 当前 JWT 绑定的租户与用户缓存作用域。 */
  getCacheScope() {
    return request.get<{ scopeKey: string }>('/agent/tasks/cache-scope')
  },

  /** 仅生成 SSE 地址；Bearer 令牌由可恢复的 fetch 订阅请求头承载。 */
  taskEventsUrl(taskId: string, after: string, streamVersion: string, messageId?: string) {
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    const message = messageId ? `&messageId=${encodeURIComponent(messageId)}` : ''
    return `${base}/agent/tasks/${encodeURIComponent(taskId)}/events?after=${encodeURIComponent(after)}&streamVersion=${encodeURIComponent(streamVersion)}${message}`
  },
  /** @deprecated 主聊天已重构为 createTask + getTaskSnapshot + taskEventsUrl；旧页面兼容调用。 */
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

  /** 获取创建某个学习空间时确认的 Agent 学习计划 */
  getLearningPlanBySpace(spaceId: string) {
    return request.get<LearningPlanDraft | null>(`/agent/learning-plans/by-space/${spaceId}`)
  },

  /** 获取 Run 的标准化 Timeline */
  getRunTimeline(runId: string) {
    return request.get<any[]>(`/agent/runs/${runId}/timeline`)
  },
}

export default { agentApi }
