import request from './request'
import type { LearningPlanDraft, PlanPauseInfo, TaskList } from '@/types/planExecute'

/** 后端单次批量 trace 查询上限 */
const TRACE_BATCH_SIZE = 50

export interface AgentChatRequest {
  message: string
  /**
   * @deprecated 旧字段名；新链路使用 conversationUuid。
   * 后端以 conversationUuid 为准，两者同时存在时忽略本字段。
   */
  conversationId?: string
  /** 前端生成的会话 UUID：新建对话时生成，重试必须复用同一个值 */
  conversationUuid?: string
  /** 前端生成的消息 UUID：同一 conversationUuid + messageUuid 只会入库一次 */
  messageUuid?: string
  /** 新对话草稿 ID：与 conversationUuid 一对一；同一 requestId 不允许更换 */
  draftId?: string
  fileIds?: number[]
  /** 知识库 ID 列表（与 fileIds 分开传给后端） */
  knowledgeBaseIds?: number[]
  /** 学习执行页上下文：当前脚本步骤、教学段、画布、时间轴位置等 */
  studyContext?: Record<string, unknown>
  /** 强制运行模式：'REACT' 快速回答 / 'PLAN_AND_EXECUTE' 目标规划，不传则走意图路由 */
  forceMode?: 'REACT' | 'PLAN_AND_EXECUTE'
  /** 结构化澄清回答 JSON（可选），格式: {"clarificationId": "uuid", "answer": "用户回答"} */
  clarificationAnswerJson?: string
  /** 客户端幂等键：同一次发送重试时必须复用，服务端据此避免重复执行 */
  clientRequestId?: string
}

/** 一次对话任务的状态视图（发送接口同步返回，含会话与消息 ID） */
export interface AgentTaskVO {
  taskId: string
  /** 会话 UUID（兼容旧字段名，值等于 conversationUuid） */
  conversationId?: string | null
  /** 会话 UUID（后端 conversation_uuid） */
  conversationUuid?: string | null
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
  /** 是否本次新建（false = 命中幂等键，复用了已有任务） */
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
  /** 会话 UUID（与 conversationId 同值） */
  conversationUuid?: string
  title: string | null
  lastMessage: string | null
  messageCount: number
  lastActiveTime: string
}

export interface MessageVO {
  id: number
  /** 对外消息 UUID（= 写库时的 message_uuid） */
  publicId?: string
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
  /** 会话内序号，用于缓存排序与 beforeSequence 游标 */
  sequenceNo?: number
  /** RUNNING / COMPLETED / FAILED / CANCELLED */
  status?: string
}

export interface MessagePageResult {
  list: MessageVO[]
  total: number
  page: number
  size: number
  /** 是否还有更早的消息（beforeSequence 游标分页） */
  hasMore?: boolean
  /** 下一页更早消息的游标 */
  nextBeforeSequence?: number | null
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
   * 创建对话任务（幂等）。
   * 返回后通过 taskEventsUrl 订阅 SSE，断线重连时用 lastSeq 作为 after 游标。
   */
  createTask(payload: AgentChatRequest) {
    // 重试由调用方控制（复用 clientRequestId），避免每次都弹全局错误提示
    return request.post<AgentTaskVO>('/agent/tasks', payload, { showError: false })
  },

  /** SSE 订阅地址（读取 Redis Stream）：after = 已成功应用的最大 seq，服务端只补发之后的事件 */
  taskEventsUrl(taskId: string, after = 0): string {
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    return `${base}/agent/tasks/${encodeURIComponent(taskId)}/events?after=${Math.max(0, after)}`
  },

  /** 查询任务状态（断线兜底 / 刷新恢复） */
  getTask(taskId: string) {
    return request.get<AgentTaskVO>(
      `/agent/tasks/${encodeURIComponent(taskId)}`,
      { showError: false },
    )
  },

  /** 协作式取消：停止后仍可回放 Redis Stream 已产生的事件 */
  cancelTask(taskId: string) {
    return request.post<{ taskId: string; cancelAccepted: boolean }>(
      `/agent/tasks/${encodeURIComponent(taskId)}/cancel`,
      undefined,
      { showError: false },
    )
  },

  /** 会话当前任务（刷新页面后恢复会话） */
  getActiveTask(conversationId: string) {
    return request.get<AgentTaskVO | null>(
      `/agent/tasks/conversations/${encodeURIComponent(conversationId)}/active`,
      { showError: false },
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

  /**
   * 获取指定对话的消息。
   *
   * <p>传 beforeSequence 时走后端游标分页（取更早的一页）；
   * 不传时兼容旧的 page/size OFFSET 分页。</p>
   */
  getConversationMessages(
    conversationId: string,
    page = 1,
    size = 100,
    options: { beforeSequence?: number; showError?: boolean } = {},
  ) {
    const params: Record<string, number> = { page, size }
    if (typeof options.beforeSequence === 'number' && Number.isFinite(options.beforeSequence)) {
      params.beforeSequence = options.beforeSequence
    }
    return request.get<MessagePageResult>(
      `/agent/conversations/${conversationId}/messages`,
      { params, showError: options.showError }
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
