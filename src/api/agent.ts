import request from './request'
import type { LearningPlanDraft, PlanPauseInfo, TaskList } from '@/types/planExecute'

/** 后端单次批量 trace 查询上限 */
const TRACE_BATCH_SIZE = 50

export interface AgentChatRequest {
  message: string
  conversationId?: string
  fileIds?: number[]
  /** 学习执行页上下文：当前脚本步骤、教学段、画布、时间轴位置等 */
  studyContext?: Record<string, unknown>
  /** 强制运行模式：'REACT' 快速回答 / 'PLAN_AND_EXECUTE' 目标规划，不传则走意图路由 */
  forceMode?: 'REACT' | 'PLAN_AND_EXECUTE'
  /** 结构化澄清回答 JSON（可选），格式: {"clarificationId": "uuid", "answer": "用户回答"} */
  clarificationAnswerJson?: string
  /** 客户端幂等键：同一次发送重试时必须复用，服务端据此避免重复执行 */
  clientRequestId?: string
}

/** 一次生成任务的状态视图（发送接口同步返回，含会话与消息 ID） */
export interface AgentGenerationVO {
  generationId: string
  conversationId?: string | null
  /** 本轮追踪 ID */
  traceId?: string | null
  /** 用户消息行 ID（已落库） */
  userMessageId?: number | null
  /** assistant 占位行 ID（status=RUNNING） */
  assistantMessageId?: number | null
  assistantSequenceNo?: number | null
  /** 会话兜底标题 */
  title?: string | null
  /** CREATED / RUNNING / COMPLETED / FAILED / CANCELLED / INTERRUPTED */
  status: string
  /** 是否本次新建（false = 命中幂等键，复用了已有生成） */
  created?: boolean
  /** 已产生事件的最大 seq，作为断线重连的 after 游标 */
  lastSeq: number
  errorMessage?: string | null
  /** 事件是否完整可回放 */
  replayable?: boolean
  createdAt?: number
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

/** 批量 trace 接口的精简事件（后端已按当前用户过滤） */
export interface AgentTraceEventBrief {
  traceId: string
  eventType: string
  seq: number
  timestamp: number | null
  payload: string | null
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
  chatStreamUrl(): string {
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    return `${base}/agent/chat/stream`
  },

  /**
   * 创建生成任务（幂等）。
   * 返回后通过 generationEventsUrl 订阅 SSE，断线重连时用 lastSeq 作为 after 游标。
   */
  createGeneration(payload: AgentChatRequest) {
    // 重试由调用方控制（复用 clientRequestId），避免每次都弹全局错误提示
    return request.post<AgentGenerationVO>('/agent/generations', payload, { showError: false })
  },

  /** SSE 订阅地址：after = 已成功应用的最大 seq，服务端只补发之后的事件 */
  generationEventsUrl(generationId: string, after = 0): string {
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    return `${base}/agent/generations/${encodeURIComponent(generationId)}/events?after=${Math.max(0, after)}`
  },

  /** 查询生成状态（断线兜底 / 刷新恢复） */
  getGeneration(generationId: string) {
    return request.get<AgentGenerationVO>(`/agent/generations/${encodeURIComponent(generationId)}`)
  },

  /** 协作式取消：停止后仍可回放已产生的事件 */
  cancelGeneration(generationId: string) {
    return request.post<{ generationId: string; cancelAccepted: boolean }>(
      `/agent/generations/${encodeURIComponent(generationId)}/cancel`,
    )
  },

  /** 会话当前生成（刷新页面后恢复会话） */
  getActiveGeneration(conversationId: string) {
    return request.get<AgentGenerationVO | null>(
      `/agent/generations/conversations/${encodeURIComponent(conversationId)}/active`,
    )
  },

  planConfirmUrl(): string {
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    return `${base}/agent/plan/confirm`
  },

  getTraceEvents(traceId: string) {
    return request.get(`/agent/trace/${traceId}`)
  },

  /**
   * 批量获取 trace 事件：一次 IN 查询替代 N 个单条请求。
   * 后端单次上限 50，超过时自动分批（长会话仍然只需要少量请求）。
   */
  async getTraceEventsBatch(traceIds: string[]): Promise<Record<string, AgentTraceEventBrief[]>> {
    const unique = [...new Set(
      (traceIds || [])
        .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        .map(id => id.trim()),
    )]
    if (unique.length === 0) return {}

    const chunks: string[][] = []
    for (let i = 0; i < unique.length; i += TRACE_BATCH_SIZE) {
      chunks.push(unique.slice(i, i + TRACE_BATCH_SIZE))
    }

    const maps = await Promise.all(chunks.map(async (ids) => {
      try {
        const result = await request.get<Record<string, AgentTraceEventBrief[]>>('/agent/traces', {
          params: { traceIds: ids.join(',') },
          showError: false,
        })
        return result || {}
      } catch (err) {
        // trace 只影响工具/思考卡片，失败不应阻塞历史消息展示
        console.warn('[agentApi] 批量获取 trace 失败:', ids.length, err)
        return {}
      }
    }))
    return Object.assign({}, ...maps)
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
