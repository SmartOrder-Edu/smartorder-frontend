import { ref, watch } from 'vue'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useAgentStore, type AgentTraceEvent, type ToolCallState, type ReasoningSegment } from '@/stores/agent'
import { useUserStore } from '@/stores/user'
import { agentApi, type AgentTaskVO, type AgentTraceEventBrief, type ExecutionStep, type PlanSummary } from '@/api/agent'
import { refreshAccessToken } from '@/api/request'
import {
  createResumableStream,
  type ResumableStream,
  type StreamFailure,
} from '@/composables/useResumableAgentStream'
import { shouldResumeTask } from '@/composables/resumableStreamCore'
import { mergeTraceEventsForMessage } from '@/utils/agentTrace'
import { normalizeAgentTraceEvent } from '@/utils/agentTraceEvent'
import {
  buildAgentStreamSnapshot,
  clearAgentStreamSnapshot,
  loadAgentStreamSnapshot,
  saveAgentStreamSnapshot,
  type AgentStreamSnapshot,
} from '@/utils/agentStreamSnapshot'
import {
  deleteCachedMessage,
  getCachedMessages,
  getCachedMessagesBefore,
  saveCachedMessages,
} from '@/cache/messageCache'
import {
  listCachedOutbox,
  markCachedOutboxFailed,
  pruneCachedOutbox,
  putCachedOutbox,
  removeCachedOutbox,
} from '@/cache/outbox'
import {
  getConversationSync,
  removeCachedConversation,
  saveConversationSync,
  runCacheGc,
} from '@/cache/conversationCache'
import {
  appendCachedStreamEvents,
  beginCachedStream,
  clearCachedStream,
  commitCachedStreamSnapshot,
  finalizeCachedStream,
  findLatestCachedStream,
  loadCachedStream,
  type LoadedCachedStream,
} from '@/cache/streamCache'
import {
  buildLocalMessageKey,
  canReuseCachedDisplay,
  mergeChatMessages,
  messageSortKey,
  toCachedMessage,
} from '@/cache/messageMapping'
import type {
  CachedStreamEventRecord,
  CachedStreamRecord,
  ConversationSyncRecord,
} from '@/cache/types'
import type {
  TaskItem,
  TaskList,
  TaskExecutionState,
  PlanPauseInfo,
  LearningPlanDraft,
} from '@/types/planExecute'
import type { MindMapData } from '@/types/mindMap'

export type AgentRunMode = 'REACT' | 'PLAN_AND_EXECUTE'

export interface RagReference {
  id: string
  name: string
  type: 'kb' | 'file'
  kbId?: string
  kbName?: string
}

export interface WebSearchReference {
  citationIndex: number
  title: string
  url: string
  snippet: string
}

export interface RagChunk {
  vectorId?: string
  content?: string
  chunkId?: number
  knowledgeBaseId?: number
  fileId?: number
  documentId?: number
  pageNumber?: number
  sectionTitle?: string
  titlePath?: string
  score?: number
  source?: string
  metadata?: Record<string, any>
}

export interface RagSourcePayload {
  chunks: RagChunk[]
  chunkCount: number
  usedRetrievalMode: string
  degraded: boolean
}

export interface LearningSpaceCardPayload {
  cardType: 'learning_space_list' | 'learning_space_resolved' | 'learning_space_dashboard'
  [key: string]: any
}

/**
 * 一条 AI 消息的生命周期状态：
 * - streaming：占位气泡，正在思考/生成（内容还在往里面追加）
 * - done：已定稿
 * - stopped：用户点了停止
 * - error：连接中断或生成失败
 */
export type ChatMessageStatus = 'streaming' | 'done' | 'stopped' | 'error'

export interface ChatMessage {
  /** 前端本地唯一 ID（用作 v-for key，保证气泡不因列表变化而重建） */
  id: string
  role: 'user' | 'ai'
  content: string
  /** 消息状态，见 ChatMessageStatus */
  status: ChatMessageStatus
  /** 网络中断后是否正在自动重连（气泡保持“生成中”，不提前定稿） */
  reconnecting?: boolean
  /** 后端对话任务 ID（断线重连 / 刷新恢复用） */
  taskId?: string
  /** 发送幂等键：本地待确认消息在拿到服务端 ID 前用它做稳定 key；值就是 taskRequestId */
  clientRequestId?: string
  /** 后端 conversation_message 主键（agent.message.created / done 下发） */
  messageId?: string
  /** 后端消息序号 */
  sequenceNo?: number
  /** 出错时的提示文案 */
  errorText?: string
  traceId?: string
  traceEvents?: AgentTraceEvent[]
  thinkingText?: string
  thinkingDurationMs?: number | null
  toolCalls?: ToolCallState[]
  reasoningSegments?: ReasoningSegment[]
  routeResult?: any
  timestamp: number
  planSummary?: PlanSummary
  executionSteps?: ExecutionStep[]
  /** 本条消息关联的附件文件ID列表 */
  attachmentFileIds?: number[]
  /** Plan-and-Execute: TaskList（规划审阅阶段） */
  taskList?: TaskList
  /** Plan-and-Execute: 任务执行状态快照 */
  taskExecutionMap?: Map<string, TaskExecutionState>
  /** Plan-and-Execute: 暂停信息 */
  pauseInfo?: PlanPauseInfo | null
  /** Plan-and-Execute: 本次澄清的已回答值（历史回放只读模式显示） */
  clarificationAnsweredValue?: string
  /** Plan-and-Execute: 是否处于执行阶段 */
  planExecuting?: boolean
  /** RAG 引用（知识库/文件） */
  references?: RagReference[]
  /** 网络搜索引用来源 */
  webSearchReferences?: WebSearchReference[]
  /** RAG 检索来源 */
  ragSources?: RagSourcePayload
  /** 思维导图列表（本轮 generateMindMap 工具产出） */
  mindMaps?: MindMapData[]
  /** 学习空间卡片（本轮学习空间查询工具产出） */
  learningSpaceCards?: LearningSpaceCardPayload[]
  /** 旧版资源卡片（向后兼容历史数据结构） */
  resources?: Array<{ type: string; title: string; minutes: number }>
  /** 旧版代码块（向后兼容历史数据结构） */
  code?: string
  /** 服务端尚未落正文、仅本地缓存保存的部分内容 */
  localOnly?: boolean
  /** 最近一次与服务端对齐的时间（缓存展示复用判断用） */
  cacheSyncedAt?: number
}

let localMessageSeq = 0
/** 生成本地消息 ID（只用于前端列表 key 与占位消息定位，不发给后端） */
function nextMessageId(prefix: 'u' | 'a'): string {
  localMessageSeq += 1
  return `${prefix}_${Date.now().toString(36)}_${localMessageSeq}`
}

/**
 * 生成 UUID（conversationId / messageUuid / draftId / taskRequestId 共用）。
 * 重试必须复用同一个值，因此调用方只能在“新的一次发送”时调用一次。
 */
function createUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // 非安全上下文（http 内网 IP）没有 crypto.randomUUID，手工生成 v4 格式
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16)
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

function createTaskRequestId(): string {
  return createUuid()
}

/* ===== 新对话草稿：draftId ↔ conversationId 一对一 ===== */
const PENDING_DRAFT_KEY = 'smartorder:agent:pendingDraft'

interface PendingDraft {
  draftId: string
  conversationId: string
  /** 最近一次未确认发送的 message_uuid；同内容重试必须复用它 */
  lastMessageUuid?: string
  /** 最近一次未确认发送的原文，用于判断“是不是同一次发送的重试” */
  lastContent?: string
}

/** 草稿按用户隔离：同一浏览器切换账号时不能复用上一个用户的 ID */
function draftStorageKey(userId: string | null): string {
  return userId ? `${PENDING_DRAFT_KEY}:${userId}` : PENDING_DRAFT_KEY
}

function readPendingDraft(userId: string | null): PendingDraft | null {
  try {
    const raw = localStorage.getItem(draftStorageKey(userId))
    if (!raw) return null
    // 兼容上一版本写下的 conversationUuid 字段
    const parsed = JSON.parse(raw) as Partial<PendingDraft> & { conversationUuid?: string }
    const conversationId = parsed.conversationId || parsed.conversationUuid
    if (!parsed.draftId || !conversationId) return null
    return {
      draftId: parsed.draftId,
      conversationId,
      lastMessageUuid: parsed.lastMessageUuid,
      lastContent: parsed.lastContent,
    }
  } catch {
    return null
  }
}

function savePendingDraft(draft: PendingDraft, userId: string | null): void {
  try {
    localStorage.setItem(draftStorageKey(userId), JSON.stringify(draft))
  } catch {
    // 隐私模式/配额满：丢草稿只会让下一次发送换新 ID，不影响主流程
  }
}

function clearPendingDraft(userId: string | null): void {
  try {
    localStorage.removeItem(draftStorageKey(userId))
  } catch {
    // ignore
  }
}

/**
 * 取出/创建当前“新对话草稿”。
 *
 * <p>刷新页面、网络超时、手动重试都必须复用同一个 draftId + conversationId；
 * 只有用户明确点“新建对话”或后端返回草稿冲突时才丢弃。</p>
 */
function ensurePendingDraft(userId: string | null): PendingDraft {
  const existing = readPendingDraft(userId)
  if (existing) return existing
  const draft: PendingDraft = {
    draftId: createUuid(),
    conversationId: createUuid(),
  }
  savePendingDraft(draft, userId)
  return draft
}

/** 服务端雪花 ID 到手后替换本地临时消息 ID（列表 key 与缓存都跟着走） */
function applyServerMessageId(message: { id: string; messageId?: string }, serverId: unknown): void {
  if (serverId === null || serverId === undefined) return
  const normalized = String(serverId)
  if (!normalized) return
  message.messageId = normalized
  message.id = `server:${normalized}`
}

/** 记住“最后打开的会话”，刷新页面后才能回到原来的对话，而不是停在欢迎页 */
const LAST_CONVERSATION_KEY = 'smartorder:agent:lastConversationId'

export function readLastConversationId(): string | null {
  try {
    return localStorage.getItem(LAST_CONVERSATION_KEY)
  } catch {
    return null
  }
}

function rememberConversation(conversationId: string) {
  try {
    localStorage.setItem(LAST_CONVERSATION_KEY, conversationId)
  } catch {
    // 隐私模式/配额满：记不住就算了，不影响主流程
  }
}

function forgetConversation() {
  try {
    localStorage.removeItem(LAST_CONVERSATION_KEY)
  } catch {
    // ignore
  }
}

/**
 * 创建对话任务（带短重试）。
 *
 * 请求超时/网络抖动时服务端可能已经建好任务，复用 taskRequestId 重试会直接拿回原任务，
 * 不会重复生成；403/404 这类明确的拒绝不重试。
 */
async function createTaskWithRetry(
  payload: Parameters<typeof agentApi.createTask>[0],
  attempts = 3,
): Promise<AgentTaskVO> {
  let lastError: any
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await agentApi.createTask(payload)
    } catch (err: any) {
      lastError = err
      const status = err?.response?.status
      // 4xx 是确定性拒绝（UUID 冲突 / 无权限 / 会话不存在），重试不会变好
      if (typeof status === 'number' && status >= 400 && status < 500
        && status !== 408 && status !== 429) {
        break
      }
      if (attempt < attempts) {
        await new Promise(resolve => setTimeout(resolve, 400 * attempt))
      }
    }
  }
  throw lastError
}

function computeTotalWeeks(plan: any): number {
  if (!plan?.phases) return 0
  return plan.phases.reduce((sum: number, p: any) => sum + (p.weeks || 0), 0)
}

function computeTotalKPs(plan: any): number {
  if (!plan?.phases) return 0
  return plan.phases.reduce((sum: number, p: any) => sum + (p.knowledgePoints?.length || 0), 0)
}

function normalizeExecutionStatus(status?: string): TaskExecutionState['status'] {
  const normalized = (status || 'PENDING').toLowerCase()
  if (normalized === 'running') return 'running'
  if (normalized === 'completed') return 'completed'
  if (normalized === 'failed') return 'failed'
  if (normalized === 'skipped') return 'skipped'
  if (normalized === 'paused') return 'paused'
  return 'pending'
}

function buildTaskExecutionMap(taskList: TaskList): Map<string, TaskExecutionState> {
  const map = new Map<string, TaskExecutionState>()
  for (const task of taskList.tasks || []) {
    map.set(task.taskId, {
      taskItem: task,
      status: normalizeExecutionStatus(task.status),
      resultSummary: task.resultSummary || '',
      errorMessage: task.errorMessage || '',
      retryCount: task.retryCount || 0,
      reasoningSegments: [],
      thinkText: '',
    })
  }
  return map
}

function normalizeTaskList(raw: any): TaskList | null {
  if (!raw?.tasks) return null
  const tasks = (raw.tasks || []).map((task: any): TaskItem => ({
    taskId: task.taskId || '',
    description: task.description || '',
    requiredTools: task.requiredTools || [],
    dependsOn: task.dependsOn || [],
    gate: task.gate || 'NORMAL',
    riskLevel: task.riskLevel || 'READ',
    expectedOutput: task.expectedOutput || '',
    status: task.status || 'PENDING',
    resultSummary: task.resultSummary || '',
    errorMessage: task.errorMessage || '',
    retryCount: task.retryCount || 0,
  }))
  return {
    userGoal: raw.userGoal || '',
    planId: raw.planId || '',
    tasks,
    status: raw.status || 'EXECUTING',
    currentTaskIndex: raw.currentTaskIndex || 0,
    taskOutputs: raw.taskOutputs || {},
    createdAt: raw.createdAt || Date.now(),
    clarificationQuestion: raw.clarificationQuestion || '',
    confirmationDraftId: raw.confirmationDraftId || '',
    spaceCreated: raw.spaceCreated,
  }
}

function normalizeLearningPlanDraft(raw: any): LearningPlanDraft | null {
  if (!raw) return null
  return {
    draftId: raw.draftId || '',
    spaceName: raw.spaceName || '',
    type: raw.type || 'course',
    description: raw.description || '',
    goals: Array.isArray(raw.goals) ? raw.goals : [],
    startDate: raw.startDate || '',
    targetEndDate: raw.targetEndDate || '',
    phases: Array.isArray(raw.phases) ? raw.phases : [],
    knowledgeGraph: raw.knowledgeGraph || { nodes: [], edges: [] },
  }
}

function normalizeToolResult(result: any): Record<string, any> | null {
  if (!result) return null
  if (typeof result === 'string') {
    try { return JSON.parse(result) } catch { return null }
  }
  if (typeof result === 'object' && !Array.isArray(result)) return result
  return null
}

function isLearningSpaceCardPayload(result: Record<string, any> | null): result is LearningSpaceCardPayload {
  return result?.cardType === 'learning_space_list'
    || result?.cardType === 'learning_space_resolved'
    || result?.cardType === 'learning_space_dashboard'
}

function learningSpaceCardKey(card: LearningSpaceCardPayload): string {
  const spaceId = card.dashboard?.space?.id || card.space?.id
  if (spaceId) return `${card.cardType}:${spaceId}`
  const ids = Array.isArray(card.spaces)
    ? card.spaces.map((space: any) => space?.id).filter(Boolean).join(',')
    : ''
  return `${card.cardType}:${ids || card.summary || ''}`
}

export function extractLearningSpaceCardsFromToolCalls(
  toolCalls?: ToolCallState[],
): LearningSpaceCardPayload[] {
  if (!toolCalls?.length) return []
  const seen = new Set<string>()
  const cards: LearningSpaceCardPayload[] = []
  for (const toolCall of toolCalls) {
    if (toolCall.status !== 'completed') continue
    const result = normalizeToolResult(toolCall.result)
    if (!isLearningSpaceCardPayload(result)) continue
    const key = learningSpaceCardKey(result)
    if (seen.has(key)) continue
    seen.add(key)
    cards.push(result)
  }
  return cards
}

function resetPlanningStateForConversation(agentStore: ReturnType<typeof useAgentStore>) {
  agentStore.currentDraftId = ''
  agentStore.currentPlan = null
  agentStore.currentTaskList = null
  agentStore.taskExecutionMap = new Map()
  agentStore.planPauseInfo = null
  agentStore.planExecuting = false
  agentStore.planNeedsConfirmation = false
  agentStore.learningPlanDraft = null
  agentStore.showLearningPlanPreview = false
  agentStore.learningPlanPreviewReadonly = false
  agentStore.learningPlanSpaceCreated = null
}

function hydratePlanningSnapshot(agentStore: ReturnType<typeof useAgentStore>, snapshot: any) {
  resetPlanningStateForConversation(agentStore)
  if (!snapshot) return

  const taskList = normalizeTaskList(snapshot.taskList)
  if (taskList) {
    if (snapshot.spaceCreated?.spaceId) {
      taskList.spaceCreated = {
        spaceId: String(snapshot.spaceCreated.spaceId),
        spaceName: snapshot.spaceCreated.spaceName || '',
      }
    }
    agentStore.currentDraftId = snapshot.executionDraftId || snapshot.draftId || ''
    agentStore.currentTaskList = taskList
    agentStore.taskExecutionMap = buildTaskExecutionMap(taskList)
    agentStore.planPauseInfo = snapshot.pauseInfo || null
    agentStore.planExecuting = snapshot.status === 'EXECUTING'
    agentStore.planNeedsConfirmation = ['DRAFT', 'PENDING_CONFIRM', 'WAITING_CONFIRMATION', 'PAUSED_CONFIRMATION']
      .includes(snapshot.status || taskList.status)
  }

  const learningDraft = normalizeLearningPlanDraft(snapshot.learningPlanDraft)
  if (learningDraft) {
    agentStore.learningPlanDraft = learningDraft
    agentStore.currentPlan = learningDraft
    agentStore.showLearningPlanPreview = true
    agentStore.learningPlanPreviewReadonly = !!snapshot.spaceCreated?.spaceId
    agentStore.learningPlanSpaceCreated = snapshot.spaceCreated?.spaceId
        ? {
          spaceId: String(snapshot.spaceCreated.spaceId),
          spaceName: snapshot.spaceCreated.spaceName || learningDraft.spaceName || '',
        }
      : null
  }
}

export function useAgentChat(scrollCallback?: () => void) {
  const agentStore = useAgentStore()
  const userStore = useUserStore()
  const messages = ref<ChatMessage[]>([])
  const loadingHistory = ref(false)
  /** 本次打开会话是否先用了 IndexedDB 缓存（UI 可显示“本地缓存”） */
  const historyFromCache = ref(false)
  /** 是否还有更早的历史消息可加载 */
  const hasMoreHistory = ref(false)
  const loadingOlder = ref(false)
  let abortController: AbortController | null = null
  /** 当前正在运行的“可恢复事件流”（断线自动重连） */
  let activeStream: ResumableStream | null = null
  /** 当前对话任务 ID：停止时用于通知服务端取消 */
  let activeTaskId: string | null = null

  /** 当前登录用户 ID（后端 bigint 以字符串下发）；未登录/加载中返回 null，缓存自动降级 */
  const cacheUserId = (): string | null => {
    const id = userStore.userInfo?.id
    return id ? String(id) : null
  }

  const getCurrentMindMaps = (): MindMapData[] => agentStore.currentMindMaps || []
  const getCurrentLearningSpaceCards = (): LearningSpaceCardPayload[] =>
    extractLearningSpaceCardsFromToolCalls(agentStore.toolCalls)
  const getCurrentRagSources = (): RagSourcePayload | undefined => {
    const sources = agentStore.currentRagSources
    if (!sources?.chunks?.length) return undefined
    return {
      ...sources,
      chunks: sources.chunks.map(chunk => ({ ...chunk })),
    }
  }

  // ===== 占位消息（乐观更新）=====
  // 发送后立刻在列表里插入一条 status='streaming' 的 AI 消息，
  // 流式过程中把 store 里的实时状态同步进去，done 时原地定稿。
  // 好处：气泡有稳定身份，不会"占位气泡销毁 + 新气泡创建"导致跳动/闪烁。
  /** 当前正在流式的占位消息（reactive 代理引用） */
  let streamingMessage: ChatMessage | null = null

  /** 插入一条空的 AI 占位消息并返回它的 reactive 引用 */
  const beginAssistantMessage = (): ChatMessage => {
    messages.value.push({
      id: nextMessageId('a'),
      role: 'ai',
      content: '',
      status: 'streaming',
      timestamp: Date.now(),
    })
    // 从数组里读回来，拿到 reactive 代理，后续直接改属性即可触发渲染
    const msg = messages.value[messages.value.length - 1]
    streamingMessage = msg
    return msg
  }

  /** 把 store 中的实时状态同步到占位消息（流式过程中每个事件调用一次） */
  const syncStreamingMessage = () => {
    const msg = streamingMessage
    if (!msg || msg.status !== 'streaming') return
    msg.content = agentStore.answerText
    msg.traceId = agentStore.currentTraceId || undefined
    msg.thinkingText = agentStore.thinkingText || undefined
    msg.thinkingDurationMs = agentStore.thinkingDurationMs
    msg.toolCalls = agentStore.toolCalls.length ? agentStore.toolCalls : undefined
    msg.reasoningSegments = agentStore.reasoningSegments.length ? agentStore.reasoningSegments : undefined
    msg.routeResult = agentStore.routeResult || undefined
    msg.webSearchReferences = agentStore.currentWebSearchReferences.length
      ? agentStore.currentWebSearchReferences
      : undefined
    msg.ragSources = getCurrentRagSources()
    msg.mindMaps = getCurrentMindMaps().length ? [...getCurrentMindMaps()] : undefined
    msg.learningSpaceCards = getCurrentLearningSpaceCards().length
      ? [...getCurrentLearningSpaceCards()]
      : undefined
  }

  interface FinishAssistantOptions {
    status: Exclude<ChatMessageStatus, 'streaming'>
    /** 不传则取 store 中累积的回答 */
    content?: string
    /** 追加在正文之后的标记文本（如"已停止生成"） */
    appendText?: string
    errorText?: string
    planSummary?: PlanSummary
    executionSteps?: ExecutionStep[]
  }

  /** 把占位消息原地定稿：内容/推理/引用全部从 store 快照写入 */
  const finishAssistantMessage = (
    msg: ChatMessage | null,
    options: FinishAssistantOptions,
  ): ChatMessage | null => {
    if (!msg) return null
    const baseContent = options.content !== undefined ? options.content : agentStore.answerText
    msg.content = options.appendText ? `${baseContent}${options.appendText}` : baseContent
    msg.status = options.status
    msg.errorText = options.errorText
    msg.messageId = msg.messageId || agentStore.currentAssistantMessageId || undefined
    msg.traceId = agentStore.currentTraceId || msg.traceId
    // 历史事件 + 快照之后补收到的事件合并；没有历史时直接共享已过滤的 store 数组
    msg.traceEvents = mergeTraceEventsForMessage(msg.traceEvents, agentStore.traceEvents)
    msg.thinkingText = agentStore.thinkingText || undefined
    msg.thinkingDurationMs = agentStore.thinkingDurationMs
    msg.toolCalls = agentStore.toolCalls.length ? agentStore.toolCalls.map(t => ({ ...t })) : undefined
    msg.reasoningSegments = agentStore.reasoningSegments.length
      ? agentStore.reasoningSegments.map(s => ({
        ...s,
        toolCall: s.toolCall ? { ...s.toolCall } : undefined,
      }))
      : undefined
    msg.routeResult = agentStore.routeResult || undefined
    msg.webSearchReferences = agentStore.currentWebSearchReferences.length
      ? [...agentStore.currentWebSearchReferences]
      : undefined
    msg.ragSources = getCurrentRagSources()
    const mindMaps = getCurrentMindMaps()
    msg.mindMaps = mindMaps.length ? [...mindMaps] : undefined
    const cards = getCurrentLearningSpaceCards()
    msg.learningSpaceCards = cards.length ? [...cards] : undefined
    if (options.planSummary) msg.planSummary = options.planSummary
    if (options.executionSteps) msg.executionSteps = [...options.executionSteps]
    if (streamingMessage === msg) streamingMessage = null
    return msg
  }

  /** 占位消息定稿后是否"没有任何可展示内容"（如规划模式只出任务面板） */
  const isEmptyAssistantMessage = (msg: ChatMessage): boolean => {
    if (msg.status !== 'done') return false
    return !msg.content?.trim()
      && !msg.reasoningSegments?.length
      && !msg.toolCalls?.length
      && !msg.webSearchReferences?.length
      && !msg.ragSources?.chunks?.length
      && !msg.learningSpaceCards?.length
      && !msg.mindMaps?.length
      && !msg.planSummary
  }

  /** 从列表移除占位消息（无内容时保持与旧版一致的"不出现空气泡"） */
  const removeMessage = (msg: ChatMessage | null) => {
    if (!msg) return
    const idx = messages.value.findIndex(m => m.id === msg.id)
    if (idx >= 0) messages.value.splice(idx, 1)
    if (streamingMessage === msg) streamingMessage = null
  }

  // ===== 流式恢复：sessionStorage 快照 + IndexedDB 快照/日志 =====
  // sessionStorage 继续作为“同标签页快速恢复”的 fallback；
  // IndexedDB 保存完整快照 + (snapshotSeq, appliedSeq] 的事件日志，支持关标签/重启恢复。
  // 只有在事件应用并 commit 后才推进游标；快照与 snapshotSeq 同一事务写入。
  const SNAPSHOT_FLUSH_INTERVAL_MS = 1000
  const STREAM_EVENT_FLUSH_INTERVAL_MS = 250
  let snapshotTracking = false
  let snapshotTaskId = ''
  let snapshotConversationId = ''
  let snapshotLastSeq = 0
  let snapshotAppliedSeq = 0
  let snapshotUserId: string | null = null
  let snapshotDirty = false
  let snapshotTimer: ReturnType<typeof setTimeout> | null = null
  let snapshotEventTimer: ReturnType<typeof setTimeout> | null = null
  let snapshotEventBuffer: CachedStreamEventRecord[] = []
  let streamCacheInit: Promise<boolean> | null = null
  let snapshotPageHideHandler: (() => void) | null = null

  /** 事件入 journal 前做一次快照：store 后续可能原地修改 taskList 等 payload */
  function cloneEventForCache<T>(value: T): T {
    if (value === undefined || value === null) return value
    try {
      return JSON.parse(JSON.stringify(value)) as T
    } catch {
      return value
    }
  }

  const flushStreamEvents = () => {
    if (snapshotEventTimer !== null) {
      clearTimeout(snapshotEventTimer)
      snapshotEventTimer = null
    }
    const uid = snapshotUserId
    const taskId = snapshotTaskId
    const events = snapshotEventBuffer
    const appliedSeq = snapshotAppliedSeq
    const init = streamCacheInit
    snapshotEventBuffer = []
    if (!uid || !taskId || events.length === 0) return

    const write = async () => {
      if (init) {
        await init
      }
      await appendCachedStreamEvents(uid, taskId, events, appliedSeq)
    }
    void write().catch(err => {
      console.warn('[useAgentChat] 写流事件日志失败:', err)
    })
  }

  const scheduleStreamEventFlush = () => {
    if (!snapshotTracking || snapshotEventTimer !== null) return
    snapshotEventTimer = setTimeout(() => {
      snapshotEventTimer = null
      if (!snapshotTracking) return
      flushStreamEvents()
    }, STREAM_EVENT_FLUSH_INTERVAL_MS)
  }

  const buildCachedStreamRecord = (): CachedStreamRecord => ({
    taskId: snapshotTaskId,
    conversationId: snapshotConversationId,
    assistantMessageId: agentStore.currentAssistantMessageId || undefined,
    status: 'RUNNING',
    snapshotSeq: snapshotLastSeq,
    appliedSeq: Math.max(snapshotLastSeq, snapshotAppliedSeq),
    answerText: agentStore.answerText,
    thinkingText: agentStore.thinkingText,
    thinkingDurationMs: agentStore.thinkingDurationMs,
    toolCalls: agentStore.toolCalls,
    reasoningSegments: agentStore.reasoningSegments,
    traceEvents: agentStore.traceEvents.slice(-300),
    routeResult: agentStore.routeResult,
    ragSources: agentStore.currentRagSources,
    webSearchReferences: agentStore.currentWebSearchReferences,
    mindMaps: agentStore.currentMindMaps,
    updatedAt: Date.now(),
  })

  const writeStreamSnapshot = () => {
    if (!snapshotTracking || !snapshotTaskId) return

    saveAgentStreamSnapshot(buildAgentStreamSnapshot({
      taskId: snapshotTaskId,
      conversationId: snapshotConversationId,
      lastSeq: snapshotLastSeq,
      answerText: agentStore.answerText,
      thinkingText: agentStore.thinkingText,
      thinkingDurationMs: agentStore.thinkingDurationMs,
      toolCalls: agentStore.toolCalls,
      reasoningSegments: agentStore.reasoningSegments,
    }))

    const uid = snapshotUserId
    if (uid) {
      // 先 flush 一次增量事件，再写完整快照；即使顺序反过来，
      // streamCache 也会过滤掉 seq <= snapshotSeq 的日志，不会复活旧事件。
      flushStreamEvents()
      const record = buildCachedStreamRecord()
      void commitCachedStreamSnapshot(uid, record).catch(err => {
        console.warn('[useAgentChat] 写流快照失败:', err)
      })
    }
  }

  const flushStreamSnapshot = () => {
    if (snapshotTimer !== null) {
      clearTimeout(snapshotTimer)
      snapshotTimer = null
    }
    if (!snapshotTracking) return
    snapshotDirty = false
    writeStreamSnapshot()
  }

  const scheduleStreamSnapshot = () => {
    if (!snapshotTracking) return
    snapshotDirty = true
    if (snapshotTimer !== null) return
    snapshotTimer = setTimeout(() => {
      snapshotTimer = null
      if (!snapshotTracking || !snapshotDirty) return
      snapshotDirty = false
      writeStreamSnapshot()
    }, SNAPSHOT_FLUSH_INTERVAL_MS)
  }

  const stopStreamSnapshot = (clearStorage: boolean) => {
    if (snapshotTimer !== null) {
      clearTimeout(snapshotTimer)
      snapshotTimer = null
    }
    if (snapshotEventTimer !== null) {
      clearTimeout(snapshotEventTimer)
      snapshotEventTimer = null
    }
    // 收尾前把还没落盘的增量写掉；关闭页面时不等待结果
    if (snapshotTracking && snapshotEventBuffer.length > 0) {
      flushStreamEvents()
    }
    if (snapshotPageHideHandler && typeof window !== 'undefined') {
      window.removeEventListener('pagehide', snapshotPageHideHandler)
    }
    snapshotPageHideHandler = null
    snapshotTracking = false
    snapshotDirty = false
    snapshotTaskId = ''
    snapshotConversationId = ''
    snapshotLastSeq = 0
    snapshotAppliedSeq = 0
    snapshotUserId = null
    snapshotEventBuffer = []
    streamCacheInit = null
    if (clearStorage) {
      clearAgentStreamSnapshot()
    }
  }

  /**
   * 清理当前生成的本地恢复数据。
   * @param clearCache 是否同时删除 IndexedDB 里的流快照（用户停止/终态清理时为 true）
   */
  const clearStreamSnapshot = (clearCache = true) => {
    const taskId = snapshotTaskId
    const uid = snapshotUserId
    stopStreamSnapshot(true)
    if (clearCache && uid && taskId) {
      void clearCachedStream(uid, taskId)
    }
  }

  const beginStreamSnapshot = (taskId: string, conversationId: string, afterSeq: number) => {
    stopStreamSnapshot(false)
    snapshotTracking = true
    snapshotTaskId = taskId
    snapshotConversationId = conversationId || ''
    snapshotLastSeq = Math.max(0, Math.floor(Number(afterSeq) || 0))
    snapshotAppliedSeq = snapshotLastSeq
    snapshotUserId = cacheUserId()
    snapshotEventBuffer = []
    snapshotDirty = false

    if (snapshotUserId) {
      streamCacheInit = beginCachedStream(snapshotUserId, buildCachedStreamRecord())
        .catch(err => {
          console.warn('[useAgentChat] 初始化流快照失败:', err)
          return false
        })
    }

    if (typeof window !== 'undefined') {
      snapshotPageHideHandler = () => flushStreamSnapshot()
      window.addEventListener('pagehide', snapshotPageHideHandler)
    }
  }

  /** 事件已应用并 commit：此时 store 与 lastSeq 处于同一时刻 */
  const onStreamEventApplied = (seq: number) => {
    if (!snapshotTracking || !Number.isFinite(seq) || seq <= 0) return
    if (seq > snapshotLastSeq) {
      snapshotLastSeq = seq
    }
    if (seq > snapshotAppliedSeq) {
      snapshotAppliedSeq = seq
    }
    scheduleStreamSnapshot()
  }

  /** 事件到达即进入日志缓冲，先落 journal 再等 1 秒写完整快照 */
  const onStreamEvent = (eventName: string, data: any, seq: number) => {
    if (!snapshotTracking || !Number.isFinite(seq) || seq <= 0) return
    snapshotEventBuffer.push({
      taskId: snapshotTaskId,
      seq,
      eventName,
      data: cloneEventForCache(data),
      receivedAt: Date.now(),
    })
    if (snapshotEventBuffer.length >= 64) {
      flushStreamEvents()
      return
    }
    scheduleStreamEventFlush()
  }

  const hydrateStreamingStateFromSnapshot = (snapshot: AgentStreamSnapshot) => {
    agentStore.answerText = snapshot.answerText
    agentStore.thinkingText = snapshot.thinkingText
    agentStore.thinkingDurationMs = snapshot.thinkingDurationMs
    agentStore.toolCalls = (snapshot.toolCalls || []).map(tool => ({ ...tool }))
    agentStore.reasoningSegments = (snapshot.reasoningSegments || []).map(segment => ({
      ...segment,
      toolCall: segment.toolCall ? { ...segment.toolCall } : undefined,
    }))
    // 快照只存 toolCalls / reasoningSegments；联网搜索引用可从工具结果恢复
    const webSearchCall = [...agentStore.toolCalls].reverse().find(tool =>
      tool.toolName === 'webSearch'
      && tool.result
      && typeof tool.result === 'object'
      && Array.isArray((tool.result as any).webSearchReferences),
    )
    agentStore.currentWebSearchReferences = webSearchCall
      ? [...((webSearchCall.result as any).webSearchReferences)]
      : []
  }

  /**
   * 从 IndexedDB 的快照 + journal 恢复界面。
   *
   * <p>快照正文对应 snapshotSeq；journal 覆盖 (snapshotSeq, appliedSeq]，
   * 按 seq 顺序重放后，界面状态正好等于 appliedSeq 时刻。</p>
   */
  const hydrateStreamingStateFromCachedStream = (loaded: LoadedCachedStream) => {
    const record = loaded.record
    agentStore.answerText = record.answerText || ''
    agentStore.thinkingText = record.thinkingText || ''
    agentStore.thinkingDurationMs = record.thinkingDurationMs ?? null
    agentStore.toolCalls = (record.toolCalls || []).map(tool => ({ ...tool }))
    agentStore.reasoningSegments = (record.reasoningSegments || []).map(segment => ({
      ...segment,
      toolCall: segment.toolCall ? { ...segment.toolCall } : undefined,
    }))
    agentStore.routeResult = record.routeResult ?? null
    agentStore.currentRagSources = record.ragSources ?? null
    agentStore.currentWebSearchReferences = record.webSearchReferences
      ? [...record.webSearchReferences]
      : []
    agentStore.currentMindMaps = record.mindMaps ? [...record.mindMaps] : []
    agentStore.traceEvents = record.traceEvents ? [...record.traceEvents] : []

    for (const event of loaded.events) {
      if (event.eventName === 'done') continue
      try {
        agentStore.handleEvent(event.eventName, event.data)
      } catch (err) {
        console.warn('[useAgentChat] 重放本地流事件失败:', event.eventName, event.seq, err)
      }
    }
  }

  /** 用户手动选择的运行模式，null 表示走意图路由 */
  const currentForceMode = ref<'REACT' | 'PLAN_AND_EXECUTE' | null>(null)

  /** 防双击/竞态：确保 confirmPlan 同一时刻只执行一次 */
  const confirmPlanLocked = ref(false)

  // 流式输出时自动滚动
  watch(
    () => agentStore.answerText,
    () => {
      if (agentStore.loading) {
        scrollCallback?.()
      }
    },
  )

  /**
   * 停止当前生成
   *
   * 与旧实现的区别：断线不再等于停止。这里必须显式通知服务端取消，
   * 否则连接虽然断了，服务端仍会继续跑完整轮生成（浪费额度且可能落库一条“已完成”的回答）。
   *
   * 仍然把正在流式的占位气泡“原地定稿”，避免出现两条 AI 气泡。
   */
  const stopTask = () => {
    // 用户主动停止：快照不再代表“可恢复的进行中生成”
    clearStreamSnapshot()
    // ① 先停本地订阅，保证停止后不会再有事件写进气泡
    if (activeStream) {
      activeStream.stop()
      activeStream = null
    }
    // ② 协作式取消：服务端在循环边界退出，已提交的副作用不回滚
    if (activeTaskId) {
      const taskId = activeTaskId
      activeTaskId = null
      agentApi.cancelTask(taskId).catch(err => {
        console.warn('[useAgentChat] 取消生成失败:', taskId, err)
      })
    }
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    const target = streamingMessage
    const partial = agentStore.answerText
    agentStore.finishTurn()
    agentStore.planExecuting = false
    if (target) {
      target.reconnecting = false
      finishAssistantMessage(target, {
        status: 'stopped',
        content: partial,
        appendText: '\n\n*[已停止生成]*',
      })
    }
    scrollCallback?.()
  }

  /**
   * 收到 done：把占位气泡原地补成完整回答（RUNNING → COMPLETED）。
   * 这里刻意吞掉异常——终态已经到手，再抛错只会触发一次没有意义的重连。
   */
  const finalizeAssistantTurn = (
    assistantMsg: ChatMessage,
    donePayload: any,
    countMessageOnDone = true,
  ) => {
    try {
      // 提前解析 done payload — 需要在定稿前获取 clarificationPayload / messageId
      const hasReActClarification = !!donePayload?.clarificationPayload
        && !agentStore.currentTaskList
      const finalContent = agentStore.answerText || (hasReActClarification
        ? (donePayload.clarificationPayload.question || '请提供更多信息')
        : '')
      // finishTurn 会清空 answerText 并结算思考时长，所以先取内容再收尾
      agentStore.finishTurn()
      if (donePayload?.messageId != null) {
        assistantMsg.messageId = String(donePayload.messageId)
      }
      if (donePayload?.sequenceNo != null) {
        assistantMsg.sequenceNo = donePayload.sequenceNo
      }
      assistantMsg.reconnecting = false
      // 终态失败/中断：气泡标成 error，避免刷新后看起来像“正常但空”的回答
      const terminalError = donePayload?.status === 'FAILED'
        || donePayload?.status === 'INTERRUPTED'
        || !!donePayload?.error
      finishAssistantMessage(assistantMsg, {
        status: terminalError ? 'error' : 'done',
        content: finalContent,
        errorText: terminalError
          ? (donePayload?.error || '生成失败')
          : undefined,
      })
      if (isEmptyAssistantMessage(assistantMsg)) {
        removeMessage(assistantMsg)
      } else {
        // 终态正文落 IndexedDB：下次打开会话先显示缓存，再后台校验。
        // 没有 messageId 时不能当成服务端消息缓存，避免与历史消息重复。
        const uid = snapshotUserId || cacheUserId()
        const taskId = assistantMsg.taskId || snapshotTaskId
        const conversationId = agentStore.currentConversationId || snapshotConversationId
        if (uid && conversationId && taskId && assistantMsg.messageId) {
          const record = toCachedMessage(
            conversationId,
            assistantMsg,
            { serverSyncedAt: Date.now() },
          )
          record.serverSyncedAt = Date.now()
          record.localOnly = false
          void finalizeCachedStream(uid, taskId, record).catch(err => {
            console.warn('[useAgentChat] 终结流缓存失败:', err)
          })
        }
      }
      // 刷新恢复时这两条消息早已计入数据库，不能在本机重复累加
      if (countMessageOnDone) {
        agentStore.touchConversation(agentStore.conversationCreatedThisTurn ? 0 : 2)
      }
      // 优先以后端 done payload 的 runStatus 判断，其次从前端 taskList 推断
      const pausedStatuses = ['PAUSED_CLARIFICATION', 'PAUSED_CONFIRMATION']
      const terminalStatuses = ['COMPLETED', 'FAILED', 'PARTIAL_COMPLETED']
      const runStatus = donePayload?.runStatus
      if (runStatus && pausedStatuses.includes(runStatus)) {
        agentStore.planExecuting = true
        if (agentStore.currentTaskList && agentStore.currentTaskList.status !== runStatus) {
          agentStore.currentTaskList.status = runStatus
        }
      } else if (runStatus && terminalStatuses.includes(runStatus)) {
        if (agentStore.currentTaskList) {
          agentStore.currentTaskList.status = runStatus
        }
        agentStore.planExecuting = false
      } else if (!agentStore.currentTaskList || !pausedStatuses.includes(agentStore.currentTaskList.status)) {
        agentStore.planExecuting = false
      }
    } catch (err) {
      console.error('[useAgentChat] done 事件处理失败:', err)
    } finally {
      // 终态已落库，刷新时走历史消息，不再需要流式快照
      clearStreamSnapshot()
      scrollCallback?.()
    }
  }

  /**
   * 清空“本轮”的流式状态。
   *
   * 刷新恢复时事件日志要从 seq=0 重放，如果不清空，回放出来的正文会叠加到上一次轮次上。
   * 只清瞬态字段，不动规划快照（快照由 loadConversation 水合）。
   */
  const resetStreamingState = () => {
    agentStore.answerText = ''
    agentStore.thinkingText = ''
    agentStore.thinkingStartTime = null
    agentStore.thinkingDurationMs = null
    agentStore.toolCalls = []
    agentStore.reasoningSegments = []
    agentStore.routeResult = null
    agentStore.traceEvents = []
    agentStore.currentWebSearchReferences = []
    agentStore.currentRagSources = null
    agentStore.currentMindMaps = []
    agentStore.loading = true
  }

  /**
   * 按帧合并“把 store 状态同步进气泡”的操作。
   *
   * 实时流下每秒几十条事件，逐条同步没问题；但断线恢复/刷新恢复要一次性回放几千条，
   * 逐条复制数组并触发响应式更新会明显卡顿，合并到一帧一次即可（最终状态不变）。
   */
  let syncFrameHandle: number | null = null
  const scheduleSyncStreamingMessage = () => {
    if (syncFrameHandle !== null) return
    const run = () => {
      syncFrameHandle = null
      syncStreamingMessage()
    }
    if (typeof requestAnimationFrame === 'function') {
      syncFrameHandle = requestAnimationFrame(run)
    } else {
      syncFrameHandle = setTimeout(run, 16) as unknown as number
    }
  }

  /** 终态对账：从服务端历史里按 messageId 找最终正文 */
  const findFinalMessage = async (
    conversationId: string,
    assistantMessageId: string,
  ): Promise<ChatMessage | null> => {
    try {
      const countResult = await agentApi.getConversationMessages(conversationId, 1, 1, { showError: false })
      const total = countResult.total || 0
      const pageSize = 200
      const lastPage = Math.max(1, Math.ceil(total / pageSize))
      const page = await agentApi.getConversationMessages(conversationId, lastPage, pageSize, { showError: false })
      const found = page.list.find(item => String(item.id) === String(assistantMessageId))
      if (!found) return null
      return {
        id: `server:${found.id}`,
        role: 'ai',
        content: found.content || '',
        status: 'done',
        messageId: String(found.id),
        sequenceNo: found.sequenceNo,
        traceId: found.traceId,
        timestamp: new Date(found.createTime).getTime(),
      }
    } catch (err) {
      console.warn('[useAgentChat] 对账查询最终消息失败:', err)
      return null
    }
  }

  /**
   * 自动恢复失败后的终态对账。
   *
   * <p>400/404/410/EOF 不再直接判死：先查生成状态；
   * COMPLETED 就从历史消息取完整正文，INTERRUPTED/FAILED 就保留部分内容并标错误。
   * 仍在 RUNNING 时保留 IndexedDB 流快照，刷新/重新进入会话还能继续接收。</p>
   */
  const reconcileStreamFailure = async (
    taskId: string,
    assistantMsg: ChatMessage,
    failure: StreamFailure,
    countMessageOnDone: boolean,
  ) => {
    const failureConversationId = agentStore.currentConversationId || snapshotConversationId

    // 认证/权限/坏事件重试没有意义：直接清掉恢复点并定稿，避免刷新后反复失败
    if (failure.kind === 'bad-event' || failure.kind === 'auth' || failure.kind === 'fatal-http') {
      const partial = agentStore.answerText
      agentStore.finishTurn()
      assistantMsg.reconnecting = false
      agentStore.planExecuting = false
      clearStreamSnapshot()
      finishAssistantMessage(assistantMsg, {
        status: 'error',
        content: partial,
        appendText: `\n\n*[${failure.message}]*`,
        errorText: failure.message,
      })
      scrollCallback?.()
      return
    }

    let status: AgentTaskVO | null = null
    try {
      status = await agentApi.getTask(taskId)
    } catch (err) {
      console.warn('[useAgentChat] 对账查询生成状态失败:', err)
    }

    // 查询期间用户已经切走：不要把旧生成的状态写进新会话
    if (failureConversationId && agentStore.currentConversationId !== failureConversationId) {
      return
    }

    const conversationId = agentStore.currentConversationId || failureConversationId
    const terminalStatus = status?.status

    // 生成记录已不存在/事件已过期：保留已接收内容并明确失败，避免刷新后无限重试
    if (!status && (failure.kind === 'not-found' || failure.kind === 'cursor-expired')) {
      finalizeAssistantTurn(assistantMsg, {
        status: 'FAILED',
        error: failure.message,
      }, countMessageOnDone)
      return
    }

    if (terminalStatus === 'COMPLETED') {
      if (conversationId && assistantMsg.messageId) {
        const finalMessage = await findFinalMessage(conversationId, assistantMsg.messageId)
        if (finalMessage?.content) {
          agentStore.answerText = finalMessage.content
          assistantMsg.messageId = finalMessage.messageId
          assistantMsg.sequenceNo = finalMessage.sequenceNo
          finalizeAssistantTurn(assistantMsg, {
            status: 'COMPLETED',
            messageId: finalMessage.messageId,
            sequenceNo: finalMessage.sequenceNo,
          }, countMessageOnDone)
          return
        }
      }
      // 服务端说完成但历史暂时取不到：保留本地正文，按完成定稿
      finalizeAssistantTurn(assistantMsg, { status: 'COMPLETED' }, countMessageOnDone)
      return
    }

    const partial = agentStore.answerText
    agentStore.finishTurn()
    assistantMsg.reconnecting = false
    agentStore.planExecuting = false

    if (terminalStatus === 'FAILED' || terminalStatus === 'INTERRUPTED' || terminalStatus === 'CANCELLED') {
      clearStreamSnapshot()
      finishAssistantMessage(assistantMsg, {
        status: 'error',
        content: partial,
        appendText: `\n\n*[${status?.errorMessage || failure.message}]*`,
        errorText: status?.errorMessage || failure.message,
      })
      scrollCallback?.()
      return
    }

    // 仍在 RUNNING 或状态未知：保留 IndexedDB 快照，刷新后可继续；界面上先标错误
    stopStreamSnapshot(false)
    finishAssistantMessage(assistantMsg, {
      status: 'error',
      content: partial,
      appendText: `\n\n*[${failure.message}；已保留已接收内容，刷新后可继续接收]*`,
      errorText: failure.message,
    })
    scrollCallback?.()
  }

  /**
   * 运行一次可恢复事件流。
   *
   * 发送新消息与刷新后恢复共用这套逻辑：应用事件 → 按 seq 去重/重连 → done 定稿。
   * 区别只在 initialAfterSeq：新消息从 0 开始；刷新恢复从快照的 lastSeq 开始，只补增量。
   */
  const runTaskStream = async (
    taskId: string,
    assistantMsg: ChatMessage,
    initialAfterSeq = 0,
    countMessageOnDone = true,
  ) => {
    activeTaskId = taskId
    abortController = new AbortController()
    const stream = createResumableStream()
    activeStream = stream

    try {
      await stream.run({
        taskId,
        initialAfterSeq,
        signal: abortController.signal,

        onEvent(eventName, data, seq) {
          agentStore.handleEvent(eventName, data)

          // plan.created 时根据 taskList.status 推导 planExecuting
          // （后端 EXECUTING 状态时不应强制改为 false）
          if (eventName === 'agent.plan.created') {
            const tl = data?.payload?.taskList
            if (tl) {
              agentStore.planExecuting = tl.status === 'EXECUTING'
            }
          }
          // 事件先进 IndexedDB journal；完整快照由 onStreamEventApplied 节流写入
          onStreamEvent(eventName, data, seq)
          // 每个事件后把实时状态同步进占位气泡（思考/工具/正文/引用）
          // 回放/恢复时事件成批到达，按帧合并，避免几千条事件把主线程卡住
          scheduleSyncStreamingMessage()
        },

        // 关键顺序：先应用事件、再 commit 游标、最后才允许记录快照
        onApplied: (seq) => onStreamEventApplied(seq),

        onTerminal: (payload) => {
          activeTaskId = null
          finalizeAssistantTurn(assistantMsg, payload, countMessageOnDone)
        },

        onStateChange(state) {
          // 重连期间保留正文和气泡，只标记“正在重连”
          assistantMsg.reconnecting = state === 'reconnecting'
        },

        onFailure(failure: StreamFailure) {
          void reconcileStreamFailure(taskId, assistantMsg, failure, countMessageOnDone)
        },
      })
    } catch (err: any) {
      // stop() 主动中断时是 AbortError，属于预期路径
      if (err?.name !== 'AbortError') {
        console.error('[useAgentChat] 流式对话异常:', err)
      }
    } finally {
      if (activeStream === stream) {
        activeStream = null
      }
      abortController = null
      if (activeTaskId === taskId) {
        activeTaskId = null
      }
      // 正常 done/失败/停止都会在各自路径清快照；这里只做停止跟踪的兜底
      stopStreamSnapshot(false)
    }
  }

  /**
   * 刷新页面 / 重新进入会话时，把仍在执行的生成接回来。
   *
   * 生成中的正文只存在于服务端事件日志（Redis）和本标签页的 sessionStorage 快照里。
   * 有匹配快照时先水合文本/思考/工具，再从 lastSeq 之后只补增量；
   * 没有快照时退回从 0 回放，保证内容正确。
   */
  const resumeActiveTaskInternal = async (conversationId: string) => {
    if (!conversationId || activeStream) return

    const uid = cacheUserId()
    let active: AgentTaskVO | null = null
    try {
      active = await agentApi.getActiveTask(conversationId)
    } catch (err) {
      console.warn('[useAgentChat] 查询活跃生成失败（非关键）:', err)
    }

    // 服务端索引暂时不可用/已清理时，用本地未终结的流兜底；必须交叉校验，不能盲信缓存
    if (!active?.taskId && uid) {
      const latest = await findLatestCachedStream(uid, conversationId)
      const fresh = latest && Date.now() - latest.updatedAt < 24 * 60 * 60_000
      if (latest && fresh && (latest.status === 'RUNNING' || latest.status === 'CREATED')) {
        active = {
          taskId: latest.taskId,
          conversationId,
          // 后端 bigint 以字符串下发；这里保留字符串，后面统一 String(...) 比较
          assistantMessageId: (latest.assistantMessageId as any) ?? null,
          assistantSequenceNo: null,
          status: latest.status,
          lastSeq: latest.appliedSeq,
          errorMessage: null,
          replayable: latest.replayable !== false,
          createdAt: latest.updatedAt,
        }
      }
    }

    // 快照只在本会话、本次 task 上有效；不匹配时宁可从头回放，也不能拼错状态
    const storedSnapshot = loadAgentStreamSnapshot()

    if (!active?.taskId) {
      if (storedSnapshot && storedSnapshot.conversationId === conversationId) {
        clearStreamSnapshot()
      }
      // 没有活跃生成但缓存里还有 streaming 气泡：说明上次中断且服务端已丢失恢复点，
      // 明确标错，避免留下永久“正在思考”。
      for (const message of messages.value) {
        if (message.role === 'ai' && message.status === 'streaming') {
          message.status = 'error'
          message.reconnecting = false
          message.content = message.content || '生成已中断，请重新发送。'
          message.errorText = '生成已中断'
        }
      }
      return
    }
    // 查询期间用户已经切走：不要给旧会话接流，避免污染新会话
    if (agentStore.currentConversationId !== conversationId) return

    const taskId = active.taskId
    let cachedStream: LoadedCachedStream | null = null
    if (uid) {
      cachedStream = await loadCachedStream(uid, taskId)
    }

    // 复用历史里的 assistant 占位气泡（同一 messageId），避免出现两个空气泡
    let target: ChatMessage | undefined
    if (active.assistantMessageId != null) {
      target = messages.value.find(
        m => m.role === 'ai' && m.messageId != null
          && String(m.messageId) === String(active!.assistantMessageId),
      )
    }

    // 进程已退出的生成：库里只是空的 RUNNING 占位行，明确标记中断，别留一个永久空泡
    if (active.status === 'INTERRUPTED') {
      if (uid) void clearCachedStream(uid, taskId)
      clearStreamSnapshot(false)
      const placeholder = target || (messages.value[messages.value.length - 1]?.role === 'ai'
        ? messages.value[messages.value.length - 1]
        : undefined)
      if (placeholder) {
        placeholder.status = 'error'
        placeholder.content = placeholder.content || '生成已中断，请重新发送。'
        placeholder.errorText = '生成已中断'
      }
      return
    }
    // 已终态：正文已经落库，历史消息里就是完整答案，不需要再接流
    if (!shouldResumeTask(active.status)) {
      if (uid) void clearCachedStream(uid, taskId)
      clearStreamSnapshot(false)
      // 历史接口可能没拿到最终正文（或缓存气泡还没被覆盖）：不要把 streaming 留在页面上
      const placeholder = target || [...messages.value].reverse().find(item => item.role === 'ai')
      if (placeholder && placeholder.status === 'streaming') {
        placeholder.status = active.status === 'COMPLETED' && placeholder.content ? 'done' : 'error'
        if (!placeholder.content) {
          placeholder.content = '生成已结束，但没有取到回答。'
          placeholder.errorText = '生成已结束'
        }
      }
      return
    }
    if (!target) {
      const last = messages.value[messages.value.length - 1]
      if (last?.role === 'ai' && !last.content) {
        target = last
      }
    }
    if (!target) {
      messages.value.push({
        id: nextMessageId('a'),
        role: 'ai',
        content: '',
        status: 'streaming',
        timestamp: Date.now(),
      })
      target = messages.value[messages.value.length - 1]
    }

    const serverLastSeq = Number(active.lastSeq) || 0
    const sessionUsable = !!storedSnapshot
      && storedSnapshot.taskId === taskId
      && storedSnapshot.conversationId === conversationId
      && Number.isInteger(storedSnapshot.lastSeq)
      && storedSnapshot.lastSeq >= 0
      // active.lastSeq 为 0 通常表示元数据还没更新；非 0 时才做上限校验
      && (serverLastSeq <= 0 || storedSnapshot.lastSeq <= serverLastSeq)
    const cachedUsable = !!cachedStream
      && cachedStream.record.conversationId === conversationId
      && cachedStream.record.terminal !== true
      && cachedStream.record.appliedSeq >= 0
      && (serverLastSeq <= 0 || cachedStream.record.appliedSeq <= serverLastSeq)
    // IndexedDB 更耐刷新/关标签；sessionStorage 只有在游标更新时才优先
    const useCached = !!cachedStream
      && cachedUsable
      && (!sessionUsable || cachedStream.resumeSeq >= storedSnapshot!.lastSeq)
    const useSession = sessionUsable && !useCached

    if (storedSnapshot && !sessionUsable) {
      clearStreamSnapshot(false)
    }
    if (uid && cachedStream && !cachedUsable) {
      void clearCachedStream(uid, taskId)
    }

    resetStreamingState()
    streamingMessage = target
    target.status = 'streaming'
    target.content = ''
    target.reconnecting = false
    target.taskId = taskId
    if (active.assistantMessageId != null) {
      target.messageId = String(active.assistantMessageId)
      agentStore.currentAssistantMessageId = String(active.assistantMessageId)
    }
    if (active.assistantSequenceNo != null) {
      target.sequenceNo = active.assistantSequenceNo
    }
    agentStore.currentConversationId = conversationId
    if (active.traceId) {
      agentStore.currentTraceId = active.traceId
    }

    // 先画本地快照，再订阅增量；首屏不再等整轮回放
    const initialAfterSeq = useCached
      ? cachedStream!.resumeSeq
      : (useSession ? storedSnapshot!.lastSeq : 0)

    if (useCached) {
      hydrateStreamingStateFromCachedStream(cachedStream!)
      // 历史 trace 已经还原的路由/RAG/导图，在缓存缺字段时补齐
      if (!agentStore.traceEvents.length && target.traceEvents?.length) {
        agentStore.traceEvents = target.traceEvents.filter(
          event => event.seq > 0 && event.seq <= initialAfterSeq,
        )
      }
      if (!agentStore.routeResult && target.routeResult) agentStore.routeResult = target.routeResult
      if (!agentStore.currentRagSources && target.ragSources) {
        agentStore.currentRagSources = target.ragSources
      }
      if (!agentStore.currentMindMaps.length && target.mindMaps?.length) {
        agentStore.currentMindMaps = [...target.mindMaps]
      }
      syncStreamingMessage()
    } else if (useSession) {
      // 历史 trace 已经还原了路由/RAG/思维导图；先把它们放回 store，
      // 避免快照水合后 syncStreamingMessage 用空值覆盖。
      if (target.routeResult) agentStore.routeResult = target.routeResult
      if (target.ragSources) agentStore.currentRagSources = target.ragSources
      if (target.mindMaps?.length) agentStore.currentMindMaps = [...target.mindMaps]
      // 只种入 lastSeq 之前的过程事件，之后的事件由流补发，避免重复
      if (target.traceEvents?.length) {
        const historicalEvents = target.traceEvents.filter(
          event => event.seq > 0 && event.seq <= initialAfterSeq,
        )
        if (historicalEvents.length > 0) {
          agentStore.traceEvents = [...historicalEvents]
        }
      }
      hydrateStreamingStateFromSnapshot(storedSnapshot!)
      syncStreamingMessage()
    }
    scrollCallback?.()

    console.info('[useAgentChat] 恢复进行中的生成:', taskId,
      useCached ? `idb after=${initialAfterSeq}` : (useSession ? `session after=${initialAfterSeq}` : 'after=0'))
    beginStreamSnapshot(taskId, conversationId, initialAfterSeq)
    await runTaskStream(taskId, target, initialAfterSeq, false)
  }

  /** 正在恢复的会话 ID：同一会话防重入，但不阻塞用户切到另一个会话 */
  let resumingConversationId = ''
  /** 会话加载代次：快速切换时旧请求不能覆盖新会话 */
  let conversationLoadToken = 0

  /**
   * 恢复进行中的生成（按会话互斥）。
   *
   * <p>恢复需要先查服务端/本地缓存，再决定从哪个游标接流；这段时间内不允许给同一会话
   * 发送新消息，否则两条流会同时写同一个 agentStore。</p>
   */
  const resumeActiveTask = async (conversationId: string) => {
    if (!conversationId || resumingConversationId === conversationId) return
    resumingConversationId = conversationId
    try {
      await resumeActiveTaskInternal(conversationId)
    } finally {
      if (resumingConversationId === conversationId) resumingConversationId = ''
    }
  }

  /**
   * 发送消息给 Agent。
   *
   * 流程：创建对话任务（幂等）→ 订阅可恢复事件流（GET SSE）→ 按 seq 增量应用。
   * 网络中断时保留气泡并自动重连，重连只补发遗漏事件，不会重复追加正文。
   */
  const sendMessage = async (message: string, references?: RagReference[]) => {
    if (!message.trim() || agentStore.loading || loadingHistory.value) return
    if (resumingConversationId && resumingConversationId === agentStore.currentConversationId) return

    // 新一轮开始：上一轮快照（即使异常残留）不再有效
    clearStreamSnapshot()

    // 从 references 中提取 fileIds（用于向下兼容）
    const attachmentFileIds = references
      ?.filter(r => r.type === 'file')
      .map(r => Number(r.id))
      .filter(id => !isNaN(id))

    const isClarificationReply = agentStore.planPauseInfo?.reason === 'CLARIFICATION'
      && agentStore.currentTaskList?.status === 'PAUSED_CLARIFICATION'

    // 结构化澄清回答：如果当前有结构化 clarification，构建 clarificationAnswerJson
    let clarificationAnswerJson: string | undefined
    if (isClarificationReply && agentStore.planPauseInfo?.clarification) {
      clarificationAnswerJson = JSON.stringify({
        clarificationId: agentStore.planPauseInfo.clarification.clarificationId,
        answer: message,
      })
    }

    // ③ 创建对话任务：执行与订阅解耦。
    //    同一次发送重试必须复用 messageUuid / taskRequestId / conversationId，
    //    服务端据此做任务级与消息级双重幂等。
    const uid = cacheUserId()
    const isNewConversation = !agentStore.currentConversationId
    // 新对话：draftId 与 conversationId 一对一，刷新/重试都从本地草稿里取，
    // 只有用户明确“新建对话”或服务端返回草稿冲突时才换新。
    const pendingDraft = isNewConversation ? ensurePendingDraft(uid) : null
    const conversationId = pendingDraft?.conversationId || agentStore.currentConversationId
    const draftId = pendingDraft?.draftId
    // 同一草稿 + 同一原文 = 同一次发送的重试：复用 message_uuid，服务端据此不再插入第二条
    const messageUuid = pendingDraft?.lastMessageUuid && pendingDraft.lastContent === message
      ? pendingDraft.lastMessageUuid
      : createUuid()
    if (pendingDraft) {
      savePendingDraft({ ...pendingDraft, lastMessageUuid: messageUuid, lastContent: message }, uid)
    }
    const taskRequestId = createTaskRequestId()

    // ① 乐观更新：先把用户这句话显示成一个气泡
    const userMsg: ChatMessage = {
      id: nextMessageId('u'),
      role: 'user',
      content: message,
      status: 'done',
      timestamp: Date.now(),
      clientRequestId: taskRequestId,
      attachmentFileIds: attachmentFileIds && attachmentFileIds.length > 0 ? attachmentFileIds : undefined,
      references: references && references.length > 0 ? [...references] : undefined,
    }
    messages.value.push(userMsg)

    agentStore.startNewTurn({ preservePlanState: isClarificationReply })

    // ② 乐观更新：紧接着放一个空的 AI 气泡（"正在思考…"），后续内容往这个气泡里追加
    const assistantMsg = beginAssistantMessage()
    assistantMsg.clientRequestId = taskRequestId
    scrollCallback?.()

    // 从 references 中提取 fileIds 和 knowledgeBaseIds
    let fileIds: number[] | undefined
    let knowledgeBaseIds: number[] | undefined
    if (references && references.length > 0) {
      const files = references.filter(r => r.type === 'file')
      if (files.length > 0) {
        fileIds = files.map(r => parseInt(r.id))
      }
      const kbs = references.filter(r => r.type === 'kb')
      if (kbs.length > 0) {
        knowledgeBaseIds = kbs.map(r => parseInt(r.id))
      }
    }

    const requestPayload: Parameters<typeof agentApi.createTask>[0] = {
      message,
      // 新链路：conversationId + messageUuid + draftId 三个 UUID 全部由前端生成。
      // 已有会话时 conversationId 等于 currentConversationId；
      // 新会话时等于本地草稿里的值。
      conversationId: conversationId || undefined,
      messageUuid,
      draftId,
      fileIds: fileIds && fileIds.length > 0 ? fileIds : undefined,
      knowledgeBaseIds: knowledgeBaseIds && knowledgeBaseIds.length > 0 ? knowledgeBaseIds : undefined,
      forceMode: isClarificationReply ? undefined : (currentForceMode.value || undefined),
      clarificationAnswerJson,
      taskRequestId,
    }
    const pendingConversationId = conversationId || undefined

    // 先落发送意图：create 响应在网络上丢失时，下次进入页面用同一个 taskRequestId 重放，
    // 服务端幂等返回原任务，不会重复开轮/重复调用模型。
    // 注意：本地 IndexedDB outbox 的主键字段仍叫 clientRequestId（历史库兼容），值就是 taskRequestId。
    if (uid) {
      await putCachedOutbox(uid, {
        clientRequestId: taskRequestId,
        conversationId: pendingConversationId,
        payload: requestPayload,
        createdAt: Date.now(),
        attempts: 0,
        status: 'pending',
      })
      if (pendingConversationId) {
        // 已有会话先存本地气泡，刷新后能看到“已发出但未确认”的一轮
        void saveCachedMessages(uid, pendingConversationId, [userMsg, assistantMsg])
      }
    }

    let task: AgentTaskVO
    try {
      task = await createTaskWithRetry(requestPayload)
    } catch (err: any) {
      const status = err?.response?.status
      // 409 等业务拒绝的正文在 response.data.msg；优先展示它，而不是 axios 的通用文案
      const reason = err?.response?.data?.msg || err?.message || '请求失败，请重试'
      console.error('[useAgentChat] 创建对话任务失败:', err)

      if (uid) {
        if (typeof status === 'number' && status >= 400 && status < 500
          && status !== 408 && status !== 429) {
          // 明确的客户端错误：重放也不会成功，直接删除意图
          void removeCachedOutbox(uid, taskRequestId)
        } else {
          // 网络错误/超时/限流：保留意图，下次进入页面或联网后重放
          void markCachedOutboxFailed(uid, taskRequestId, reason)
        }
      }
      // 4xx 说明 draft/conversation/message 这组 UUID 已被服务端拒绝：
      // 丢掉本地草稿，下一次发送必须重新生成 conversationId + draftId，绝不复用。
      if (typeof status === 'number' && status >= 400 && status < 500) {
        clearPendingDraft(uid)
      }

      agentStore.finishTurn()
      finishAssistantMessage(assistantMsg, {
        status: 'error',
        content: '',
        appendText: `*[${reason}]*`,
        errorText: reason,
      })
      if (uid && pendingConversationId) {
        void saveCachedMessages(uid, pendingConversationId, [userMsg, assistantMsg])
      }
      scrollCallback?.()
      return
    }

    // 发送接口已经同步落库：会话与占位消息 ID 立即可用，不必等第一个 SSE 事件。
    // 即使随后 SSE 一次都没连上，页面也知道这段消息属于哪个会话、是哪一行。
    const serverConversationId = task.conversationId || conversationId
    if (serverConversationId) {
      agentStore.currentConversationId = serverConversationId
      agentStore.upsertConversation(serverConversationId, task.title || '')
      rememberConversation(serverConversationId)
    }
    // 会话已确认落库：本地草稿完成使命;下次“新建对话”必须换新的 draftId + conversationId
    if (isNewConversation) {
      clearPendingDraft(uid)
    }
    // 雪花 ID 到手：用它替换本地临时消息 ID（v-for key / IndexedDB 缓存一起迁移）
    applyServerMessageId(userMsg, task.userMessageId)
    applyServerMessageId(assistantMsg, task.assistantMessageId)
    if (task.assistantMessageId != null) {
      agentStore.currentAssistantMessageId = String(task.assistantMessageId)
    }
    if (task.assistantSequenceNo != null) {
      assistantMsg.sequenceNo = task.assistantSequenceNo
      // 发送接口只回 assistant 序号；同一轮 user 行紧随其前。
      // 不给 user 排个序号的话，缓存恢复时它会被 1e15 的本地 sortKey 排到 AI 后面。
      userMsg.sequenceNo = Math.max(1, Number(task.assistantSequenceNo) - 1)
    }

    assistantMsg.taskId = task.taskId
    const resolvedConversationId = serverConversationId || agentStore.currentConversationId
    if (uid) {
      // 创建响应已拿到：删除发送意图，把本地占位迁移成服务端消息 key
      void removeCachedOutbox(uid, taskRequestId)
      void deleteCachedMessage(uid, buildLocalMessageKey(taskRequestId, 'user'))
      void deleteCachedMessage(uid, buildLocalMessageKey(taskRequestId, 'ai'))
      if (resolvedConversationId) {
        void saveCachedMessages(uid, resolvedConversationId, [userMsg, assistantMsg], { syncedAt: Date.now() })
      }
    }

    // 消息幂等命中但原任务已被清理：没有可订阅的事件流，直接以服务端历史为准
    if (!task.taskId) {
      if (resolvedConversationId) {
        messages.value = []
        await loadConversation(resolvedConversationId)
      }
      return
    }

    // 发送与刷新恢复共用同一套“应用事件 / 断线重连 / done 定稿”逻辑。
    // 新生成从 0 开始记录快照；恢复路径会从快照的 lastSeq 开始。
    beginStreamSnapshot(task.taskId, resolvedConversationId, 0)
    await runTaskStream(task.taskId, assistantMsg)
  }

  /**
   * 确认学习规划
   */
  const confirmPlan = async (draftId: string) => {
    if (!draftId || confirmPlanLocked.value) return
    clearStreamSnapshot()
    confirmPlanLocked.value = true
    agentStore.planConfirmLoading = true
    agentStore.resetExecutionSteps()
    // 清空上一轮规划的 trace/推理/工具，避免与执行轮次混合
    // （后端确认接口创建新的 traceId，前端也需重置对应状态）
    agentStore.thinkingText = ''
    agentStore.thinkingStartTime = null
    agentStore.toolCalls = []
    agentStore.reasoningSegments = []
    agentStore.traceEvents = []
    agentStore.routeResult = null
    const base = import.meta.env.VITE_API_BASE_URL || '/api'

    // SSE 请求前主动刷新 accessToken
    let token: string
    try {
      token = await refreshAccessToken()
    } catch {
      agentStore.planConfirmLoading = false
      confirmPlanLocked.value = false
      return
    }

    abortController = new AbortController()

    try {
      await fetchEventSource(`${base}/agent/plan/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          draftId,
          conversationId: agentStore.currentConversationId,
        }),
        openWhenHidden: true,
        signal: abortController.signal,

        onmessage(event) {
          if (!event.data) return

          if (event.event === 'done') {
            agentStore.planConfirmLoading = false
            agentStore.planDialogVisible = false

            // 优先以后端 done payload 的 runStatus 判断，其次从前端 taskList 推断
            const pausedStatuses = ['PAUSED_CLARIFICATION', 'PAUSED_CONFIRMATION']
            let donePayload: any = null
            try { donePayload = JSON.parse(event.data) } catch { /* ignore */ }
            const runStatus = donePayload?.runStatus

            if (agentStore.currentTaskList) {
              if (runStatus && pausedStatuses.includes(runStatus)) {
                // 后端明确告知暂停态
                agentStore.planExecuting = true
                if (agentStore.currentTaskList.status !== runStatus) {
                  agentStore.currentTaskList.status = runStatus
                }
              } else {
                const currentStatus = agentStore.currentTaskList.status
                const isPaused = pausedStatuses.includes(currentStatus)
                agentStore.planExecuting = isPaused
                if (!isPaused) {
                  const hasRunningTask = agentStore.currentTaskList.tasks.some(t => t.status === 'RUNNING')
                  const hasPausedTask = agentStore.currentTaskList.tasks.some(t => t.status === 'PAUSED')
                  if (!hasRunningTask && !hasPausedTask) {
                    const hasFailedTask = agentStore.currentTaskList.tasks.some(t => t.status === 'FAILED')
                    agentStore.currentTaskList.status = hasFailedTask ? 'FAILED' : 'COMPLETED'
                  }
                }
              }
            } else {
              agentStore.planExecuting = false
            }

            // 构造 PlanSummary
            const plan = agentStore.currentPlan
            const payload = (() => {
              try { return JSON.parse(event.data).payload } catch { return null }
            })()
            const planSummary: PlanSummary = {
              spaceId: payload?.spaceId ? String(payload.spaceId) : '',
              spaceName: plan?.spaceName || '',
              spaceType: plan?.type || 'course',
              nodeCount: payload?.nodeCount || plan?.phases?.length || 0,
              taskCount: payload?.taskCount || computeTotalKPs(plan),
              kgNodeCount: plan?.knowledgeGraph?.nodes?.length || 0,
              startDate: plan?.startDate || '',
              targetEndDate: plan?.targetEndDate || '',
              totalPhases: plan?.phases?.length || 0,
              totalWeeks: computeTotalWeeks(plan),
            }

            // 添加执行结果消息到聊天列表
            if (agentStore.answerText) {
              messages.value.push({
                id: nextMessageId('a'),
                role: 'ai',
                content: agentStore.answerText,
                status: 'done',
                messageId: agentStore.currentAssistantMessageId || undefined,
                traceId: agentStore.currentTraceId,
                traceEvents: [...agentStore.traceEvents],
                reasoningSegments: agentStore.reasoningSegments?.length
                  ? [...agentStore.reasoningSegments] : undefined,
                timestamp: Date.now(),
                planSummary,
                executionSteps: [...agentStore.executionSteps],
              })
              agentStore.answerText = ''
            }
            agentStore.finishTurn()
            abortController = null
            confirmPlanLocked.value = false
            scrollCallback?.()
            return
          }

          try {
            const data = JSON.parse(event.data) as AgentTraceEvent
            agentStore.handleEvent(event.event, data)
          } catch {
            // ignore
          }
        },

        onerror(err) {
          console.error('[confirmPlan] SSE error:', err)
          agentStore.planConfirmLoading = false
          agentStore.planExecuting = false
          abortController = null
          confirmPlanLocked.value = false
          throw err
        },
      })
    } catch (err: any) {
      console.error('[confirmPlan] error:', err)
      agentStore.planConfirmLoading = false
      agentStore.planExecuting = false
      abortController = null
      confirmPlanLocked.value = false
    }
  }

  /**
   * 取消规划
   */
  const cancelPlan = () => {
    agentStore.planDialogVisible = false
    agentStore.currentDraftId = ''
    agentStore.currentPlan = null
  }

  /**
   * 通过专用 API 提交澄清回答（SSE）——不经过 /agent/chat/stream
   */
  const answerClarificationViaSSE = async (draftId: string, clarificationId: string, answer: string): Promise<boolean> => {
    clearStreamSnapshot()
    agentStore.startNewTurn({ preservePlanState: true })

    // 乐观更新：立即追加用户回答气泡
    const clarInfo = agentStore.planPauseInfo?.clarification
    let displayAnswer = answer
    if (clarInfo) {
      if (clarInfo.answerType === 'SINGLE_SELECT') {
        const opt = clarInfo.options?.find(o => o.value === answer)
        displayAnswer = opt?.label || answer
      } else if (clarInfo.answerType === 'MULTI_SELECT') {
        try {
          const vals: string[] = JSON.parse(answer)
          displayAnswer = vals.map(v => clarInfo.options?.find(o => o.value === v)?.label || v).join('、')
        } catch { displayAnswer = answer }
      }
    }
    messages.value.push({
      id: nextMessageId('u'),
      role: 'user',
      content: displayAnswer,
      status: 'done',
      timestamp: Date.now(),
    })

    // 乐观占位气泡：回答继续往这个气泡里流
    const assistantMsg = beginAssistantMessage()
    scrollCallback?.()

    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    let token: string
    try {
      token = await refreshAccessToken()
    } catch {
      finishAssistantMessage(assistantMsg, {
        status: 'error',
        content: '登录状态已过期，请重新登录后再试',
        errorText: '登录状态已过期',
      })
      agentStore.finishTurn()
      return false
    }
    abortController = new AbortController()

    try {
      await fetchEventSource(
        `${base}/agent/plans/${draftId}/clarifications/${clarificationId}/answer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            answer,
            displayAnswer,
            conversationId: agentStore.currentConversationId || undefined,
          }),
          openWhenHidden: true,
          signal: abortController.signal,
          onmessage(event) {
            if (!event.data) return
            if (event.event === 'done') {
              // 处理与 sendMessage done 类似：占位气泡原地定稿
              let donePayload: any = null
              try { donePayload = JSON.parse(event.data) } catch { /* ignore */ }
              const finalContent = agentStore.answerText
              agentStore.finishTurn()
              if (donePayload?.messageId != null) {
                assistantMsg.messageId = String(donePayload.messageId)
              }
              finishAssistantMessage(assistantMsg, { status: 'done', content: finalContent })
              if (isEmptyAssistantMessage(assistantMsg)) {
                removeMessage(assistantMsg)
              }
              const pausedStatuses = ['PAUSED_CLARIFICATION', 'PAUSED_CONFIRMATION']
              const terminalStatuses = ['COMPLETED', 'FAILED', 'PARTIAL_COMPLETED']
              const runStatus = donePayload?.runStatus
              // 多轮澄清时后端不发 plan.created，需从 done 恢复 draftId
              if (donePayload?.draftId && !agentStore.currentDraftId) {
                agentStore.currentDraftId = donePayload.draftId
              }
              if (runStatus && pausedStatuses.includes(runStatus)) {
                agentStore.planExecuting = true
                if (agentStore.currentTaskList && agentStore.currentTaskList.status !== runStatus) {
                  agentStore.currentTaskList.status = runStatus
                }
              } else if (runStatus && terminalStatuses.includes(runStatus)) {
                if (agentStore.currentTaskList) {
                  agentStore.currentTaskList.status = runStatus
                }
                agentStore.planExecuting = false
              } else if (!agentStore.currentTaskList || !pausedStatuses.includes(agentStore.currentTaskList.status)) {
                agentStore.planExecuting = false
              }
              abortController = null
              scrollCallback?.()
              return
            }
            try {
              const data = JSON.parse(event.data) as AgentTraceEvent
              agentStore.handleEvent(event.event, data)
              if (event.event === 'agent.plan.created') {
                const tl = data.payload?.taskList
                if (tl) {
                  agentStore.planExecuting = tl.status === 'EXECUTING'
                }
              }
              syncStreamingMessage()
            } catch { /* ignore */ }
          },
          onerror(err) {
            console.error('[answerClarification] SSE error:', err)
            const partial = agentStore.answerText
            agentStore.finishTurn()
            finishAssistantMessage(assistantMsg, {
              status: 'error',
              content: partial,
              appendText: '\n\n*[连接中断]*',
              errorText: '连接中断',
            })
            agentStore.planExecuting = false
            abortController = null
            scrollCallback?.()
            throw err
          },
        },
      )
      return true
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[answerClarification] fetch error:', err)
        if (assistantMsg.status === 'streaming') {
          const partial = agentStore.answerText
          agentStore.finishTurn()
          finishAssistantMessage(assistantMsg, {
            status: 'error',
            content: partial,
            appendText: '\n\n*[请求失败，请重试]*',
            errorText: '请求失败',
          })
        } else {
          agentStore.finishTurn()
        }
        agentStore.planExecuting = false
      }
      abortController = null
      return false
    }
  }

  /**
   * 通过专用 API 确认 CONFIRMATION 门（SSE）
   */
  const confirmGateViaSSE = async (draftId: string) => {
    clearStreamSnapshot()
    agentStore.startNewTurn({ preservePlanState: true })
    // 乐观占位气泡
    const assistantMsg = beginAssistantMessage()
    scrollCallback?.()
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    let token: string
    try {
      token = await refreshAccessToken()
    } catch {
      finishAssistantMessage(assistantMsg, {
        status: 'error',
        content: '登录状态已过期，请重新登录后再试',
        errorText: '登录状态已过期',
      })
      agentStore.finishTurn()
      return
    }
    abortController = new AbortController()

    try {
      await fetchEventSource(
        `${base}/agent/plans/${draftId}/confirm-gate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversationId: agentStore.currentConversationId || undefined,
          }),
          openWhenHidden: true,
          signal: abortController.signal,
          onmessage(event) {
            if (!event.data) return
            if (event.event === 'done') {
              let donePayload: any = null
              try { donePayload = JSON.parse(event.data) } catch { /* ignore */ }
              const finalContent = agentStore.answerText
              agentStore.finishTurn()
              if (donePayload?.messageId != null) {
                assistantMsg.messageId = String(donePayload.messageId)
              }
              finishAssistantMessage(assistantMsg, { status: 'done', content: finalContent })
              if (isEmptyAssistantMessage(assistantMsg)) {
                removeMessage(assistantMsg)
              }
              const pausedStatuses = ['PAUSED_CLARIFICATION', 'PAUSED_CONFIRMATION']
              const terminalStatuses = ['COMPLETED', 'FAILED', 'PARTIAL_COMPLETED']
              const runStatus = donePayload?.runStatus
              if (runStatus && pausedStatuses.includes(runStatus)) {
                agentStore.planExecuting = true
                if (agentStore.currentTaskList && agentStore.currentTaskList.status !== runStatus) {
                  agentStore.currentTaskList.status = runStatus
                }
              } else if (runStatus && terminalStatuses.includes(runStatus)) {
                if (agentStore.currentTaskList) {
                  agentStore.currentTaskList.status = runStatus
                }
                agentStore.planExecuting = false
              } else if (!agentStore.currentTaskList || !pausedStatuses.includes(agentStore.currentTaskList.status)) {
                agentStore.planExecuting = false
              }
              abortController = null
              scrollCallback?.()
              return
            }
            try {
              const data = JSON.parse(event.data) as AgentTraceEvent
              agentStore.handleEvent(event.event, data)
              if (event.event === 'agent.plan.created') {
                const tl = data.payload?.taskList
                if (tl) {
                  agentStore.planExecuting = tl.status === 'EXECUTING'
                }
              }
              syncStreamingMessage()
            } catch { /* ignore */ }
          },
          onerror(err) {
            console.error('[confirmGate] SSE error:', err)
            const partial = agentStore.answerText
            agentStore.finishTurn()
            finishAssistantMessage(assistantMsg, {
              status: 'error',
              content: partial,
              appendText: '\n\n*[连接中断]*',
              errorText: '连接中断',
            })
            agentStore.planExecuting = false
            abortController = null
            scrollCallback?.()
            throw err
          },
        },
      )
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[confirmGate] fetch error:', err)
        if (assistantMsg.status === 'streaming') {
          const partial = agentStore.answerText
          agentStore.finishTurn()
          finishAssistantMessage(assistantMsg, {
            status: 'error',
            content: partial,
            appendText: '\n\n*[请求失败，请重试]*',
            errorText: '请求失败',
          })
        } else {
          agentStore.finishTurn()
        }
        agentStore.planExecuting = false
      }
      abortController = null
    }
  }

  /**
   * 加载指定对话的历史消息
   */
  const loadConversation = async (conversationId: string) => {
    const loadToken = ++conversationLoadToken
    // 打开了真实会话：任何未确认的新对话草稿都不再适用（避免把旧 UUID 带到别的会话）
    const pendingDraft = readPendingDraft(cacheUserId())
    if (pendingDraft && pendingDraft.conversationId !== conversationId) {
      clearPendingDraft(cacheUserId())
    }
    // 切换会话：旧会话的快照不再适用；同会话刷新则保留，交给 resumeActiveTask 使用
    const previousConversationId = agentStore.currentConversationId
    const storedSnapshot = loadAgentStreamSnapshot()
    if ((previousConversationId && previousConversationId !== conversationId)
      || (storedSnapshot?.conversationId && storedSnapshot.conversationId !== conversationId)) {
      // 只清本标签页的 session 快照；IndexedDB 里别的会话的流保留，
      // 用户切回去时仍可快速恢复（服务端生成本来就还在跑）。
      clearStreamSnapshot(false)
    }
    // 切换会话：先断开旧的流式连接，避免旧生成的事件继续写进新会话的气泡
    if (activeStream) {
      activeStream.stop()
      activeStream = null
      // 切走时旧生成的 loading 不能带到新会话，否则输入框会一直不可用
      agentStore.finishTurn()
      agentStore.planExecuting = false
      streamingMessage = null
    }
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    activeTaskId = null
    // 清掉上一个会话可能残留的 loading/answerText，避免新会话输入框被禁用
    agentStore.finishTurn()
    streamingMessage = null
    loadingHistory.value = true
    historyFromCache.value = false
    hasMoreHistory.value = false
    // 先切到目标会话：即使网络失败，resume/发送也属于新会话而不是旧会话
    agentStore.currentConversationId = conversationId

    // 先读本地物化视图：有缓存就立即渲染，网络只做后台校验（SWR）
    const uid = cacheUserId()
    let cachedMessages: ChatMessage[] = []
    let cachedSync: ConversationSyncRecord | null = null
    if (uid) {
      try {
        const [messagesFromCache, sync] = await Promise.all([
          getCachedMessages(uid, conversationId, 200),
          getConversationSync(uid, conversationId),
        ])
        cachedMessages = messagesFromCache
        cachedSync = sync
      } catch (err) {
        console.warn('[useAgentChat] 读取本地会话缓存失败:', err)
      }
    }
    // 读缓存期间用户已切走：不要用旧会话覆盖新会话
    if (loadToken !== conversationLoadToken) return
    const cachedByMessageId = new Map<string, ChatMessage>()
    for (const cachedMessage of cachedMessages) {
      if (cachedMessage.messageId) cachedByMessageId.set(String(cachedMessage.messageId), cachedMessage)
    }
    if (cachedMessages.length > 0) {
      messages.value = cachedMessages
      agentStore.currentConversationId = conversationId
      rememberConversation(conversationId)
      historyFromCache.value = true
      hasMoreHistory.value = cachedSync
        ? !!cachedSync.hasMoreOlder
        : cachedMessages.length >= 200
      loadingHistory.value = false
      scrollCallback?.()
    } else if (previousConversationId && previousConversationId !== conversationId) {
      // 目标会话没有缓存：先清空旧会话消息，避免 loading 期间看到上一条会话的内容
      messages.value = []
    }

    try {
      // 倒序分页：先查总数，再请求最后一页，确保最新消息一定加载
      const countResult = await agentApi.getConversationMessages(conversationId, 1, 1, { showError: false })
      const total = countResult.total || 0
      const pageSize = 200
      const lastPage = Math.max(1, Math.ceil(total / pageSize))
      const result = await agentApi.getConversationMessages(conversationId, lastPage, pageSize, { showError: false })
      const msgs: ChatMessage[] = []

      // 第一遍：从 MessageVO 构建消息（无 API 调用），收集 trace 拉取任务
      const traceJobs: { msgIndex: number; traceId: string }[] = []

      for (let i = 0; i < result.list.length; i++) {
        const msg = result.list[i]
        // 跳过 tool/system 消息：工具调用结果和系统消息是内部数据，不应作为对话展示
        if (msg.role === 'tool' || msg.role === 'system') continue
        const chatMsg: ChatMessage = {
          id: nextMessageId(msg.role === 'user' ? 'u' : 'a'),
          role: (msg.role === 'user' ? 'user' : 'ai') as 'user' | 'ai',
          content: msg.content || '',
          status: msg.status === 'RUNNING'
            ? 'streaming'
            : (msg.status === 'FAILED' || msg.status === 'INTERRUPTED' ? 'error' : 'done'),
          messageId: msg.id != null ? String(msg.id) : undefined,
          sequenceNo: msg.sequenceNo,
          traceId: msg.traceId || undefined,
          timestamp: new Date(msg.createTime).getTime(),
        }

        // 服务端 assistant 行在生成中还是空占位：复用缓存里的正文/工具/思考，
        // 否则刷新后会把正在流式的内容覆盖成空。
        const cachedMessage = msg.id != null ? cachedByMessageId.get(String(msg.id)) : undefined
        if (cachedMessage) {
          // 复用本地稳定 ID，避免每次加载都重建气泡 DOM / 丢失滚动位置
          chatMsg.id = cachedMessage.id
          if (!chatMsg.content && cachedMessage.content) chatMsg.content = cachedMessage.content
          if (cachedMessage.status === 'streaming') {
            chatMsg.status = 'streaming'
            chatMsg.reconnecting = cachedMessage.reconnecting
          }
          if (!chatMsg.thinkingText && cachedMessage.thinkingText) {
            chatMsg.thinkingText = cachedMessage.thinkingText
          }
          if (chatMsg.thinkingDurationMs == null) {
            chatMsg.thinkingDurationMs = cachedMessage.thinkingDurationMs
          }
          if (!chatMsg.toolCalls?.length && cachedMessage.toolCalls?.length) {
            chatMsg.toolCalls = cachedMessage.toolCalls
          }
          if (!chatMsg.reasoningSegments?.length && cachedMessage.reasoningSegments?.length) {
            chatMsg.reasoningSegments = cachedMessage.reasoningSegments
          }
          if (!chatMsg.traceEvents?.length && cachedMessage.traceEvents?.length) {
            chatMsg.traceEvents = cachedMessage.traceEvents
          }
          if (!chatMsg.routeResult && cachedMessage.routeResult) chatMsg.routeResult = cachedMessage.routeResult
          if (!chatMsg.ragSources && cachedMessage.ragSources) chatMsg.ragSources = cachedMessage.ragSources
          if (!chatMsg.webSearchReferences?.length && cachedMessage.webSearchReferences?.length) {
            chatMsg.webSearchReferences = cachedMessage.webSearchReferences
          }
          if (!chatMsg.mindMaps?.length && cachedMessage.mindMaps?.length) {
            chatMsg.mindMaps = cachedMessage.mindMaps
          }
          if (!chatMsg.learningSpaceCards?.length && cachedMessage.learningSpaceCards?.length) {
            chatMsg.learningSpaceCards = cachedMessage.learningSpaceCards
          }
          if (!chatMsg.planSummary && cachedMessage.planSummary) chatMsg.planSummary = cachedMessage.planSummary
          chatMsg.cacheSyncedAt = cachedMessage.cacheSyncedAt
          chatMsg.localOnly = cachedMessage.localOnly
        }

        // 解析附件文件ID列表
        if (msg.attachmentFileIds) {
          try {
            const parsed = JSON.parse(msg.attachmentFileIds)
            if (Array.isArray(parsed) && parsed.length > 0) {
              chatMsg.attachmentFileIds = parsed
            }
          } catch {
            // 解析失败忽略
          }
        }

        if (msg.role === 'assistant') {
          if (msg.reasoningContent) {
            chatMsg.thinkingText = msg.reasoningContent
          }
          // 优先使用后端提供的思考分段（精确还原实时展示效果）
          if (msg.reasoningSegments) {
            try {
              const parsed = JSON.parse(msg.reasoningSegments)
              if (Array.isArray(parsed) && parsed.length > 0) {
                chatMsg.reasoningSegments = parsed as ReasoningSegment[]
              }
            } catch {
              // 解析失败，后续用旧逻辑重建
            }
          }
          // 缓存里的工具/思考展示数据还新鲜时，跳过 trace 拉取（长会话主要省在这里）
          if (msg.traceId && !canReuseCachedDisplay(chatMsg)) {
            traceJobs.push({ msgIndex: msgs.length, traceId: msg.traceId })
          }
        }

        msgs.push(chatMsg)
      }

      // 第二遍：一次批量拉取所有 trace，避免长会话 N 个请求线性变慢
      if (traceJobs.length > 0) {
        const traceIds = [...new Set(traceJobs.map(j => j.traceId))]
        let traceMap: Record<string, AgentTraceEventBrief[]> = {}
        try {
          traceMap = await agentApi.getTraceEventsBatch(traceIds)
        } catch (e) {
          console.warn('[useAgentChat] 批量获取 trace 事件失败:', e)
        }

        for (let j = 0; j < traceJobs.length; j++) {
          const chatMsg = msgs[traceJobs[j].msgIndex]
          const events = traceMap[traceJobs[j].traceId]
          if (!events || !Array.isArray(events)) continue

          const toolCalls: ToolCallState[] = []
          const traceEvents: AgentTraceEvent[] = []
          // 用 seq 做 key 避免同名工具调用互相覆盖
          const pendingTools: Map<number, { toolName: string; arguments?: any; startedAt: number }> = new Map()

          for (const raw of events) {
            const evt = normalizeAgentTraceEvent(raw)

            traceEvents.push(evt)

            switch (evt.eventType) {
              case 'agent.route.completed': {
                chatMsg.routeResult = evt.payload
                break
              }
              case 'agent.tool.started': {
                const toolName = evt.payload?.toolName || '未知工具'
                pendingTools.set(evt.seq, {
                  toolName,
                  arguments: evt.payload?.arguments,
                  startedAt: evt.timestamp || Date.now(),
                })
                break
              }
              case 'agent.tool.completed': {
                const toolName = evt.payload?.toolName || ''
                const { key, entry } = findPendingByToolName(pendingTools, toolName)
                toolCalls.push({
                  toolName,
                  status: 'completed',
                  arguments: entry?.arguments || evt.payload?.arguments,
                  result: evt.payload?.result,
                  durationMs: evt.payload?.durationMs,
                  startedAt: entry?.startedAt || evt.timestamp,
                })
                if (key !== null) pendingTools.delete(key)
                // 提取网络搜索引用
                if (toolName === 'webSearch' && evt.payload?.webSearchReferences) {
                  chatMsg.webSearchReferences = evt.payload.webSearchReferences
                  // 注入到 toolCall.result 中，避免 ToolCardCard 内联展示受 ToolResultTruncator 截断影响
                  const lastTc = toolCalls[toolCalls.length - 1]
                  if (lastTc && lastTc.toolName === 'webSearch') {
                    if (lastTc.result && typeof lastTc.result === 'object' && !Array.isArray(lastTc.result)) {
                      lastTc.result = { ...lastTc.result, webSearchReferences: evt.payload.webSearchReferences }
                    } else {
                      lastTc.result = { webSearchReferences: evt.payload.webSearchReferences }
                    }
                  }
                }
                break
              }
              case 'agent.rag.chunks': {
                const chunks = Array.isArray(evt.payload?.chunks) ? evt.payload.chunks : []
                chatMsg.ragSources = {
                  chunks,
                  chunkCount: evt.payload?.chunkCount ?? chunks.length,
                  usedRetrievalMode: evt.payload?.usedRetrievalMode || 'unknown',
                  degraded: evt.payload?.degraded === true,
                }
                break
              }
              case 'agent.tool.failed': {
                const toolName = evt.payload?.toolName || ''
                const { key, entry } = findPendingByToolName(pendingTools, toolName)
                toolCalls.push({
                  toolName,
                  status: 'failed',
                  arguments: entry?.arguments || evt.payload?.arguments,
                  durationMs: evt.payload?.durationMs,
                  startedAt: entry?.startedAt || evt.timestamp,
                })
                if (key !== null) pendingTools.delete(key)
                break
              }
              // Plan-and-Execute 状态由会话级 planning snapshot / agentStore 维护。
              // 历史消息只保留 traceEvents，避免同一次规划在聊天流里重建多个执行面板。
              case 'agent.mindmap.created': {
                const mm = evt.payload as MindMapData
                if (mm && Array.isArray(mm.nodes) && mm.nodes.length > 0) {
                  if (!chatMsg.mindMaps) chatMsg.mindMaps = []
                  chatMsg.mindMaps.push(mm)
                }
                break
              }
            }
          }

          // 未匹配完成的 pending 工具（兜底）
          for (const [, pending] of pendingTools) {
            toolCalls.push({
              toolName: pending.toolName,
              status: 'running',
              arguments: pending.arguments,
              startedAt: pending.startedAt,
            })
          }

          if (toolCalls.length > 0) {
            chatMsg.toolCalls = toolCalls
            const learningSpaceCards = extractLearningSpaceCardsFromToolCalls(toolCalls)
            if (learningSpaceCards.length > 0) {
              chatMsg.learningSpaceCards = learningSpaceCards
            }
          }
          if (traceEvents.length > 0) {
            chatMsg.traceEvents = traceEvents
          }

          // 重建 reasoningSegments（仅在 API 未提供时用旧逻辑）
          if (!chatMsg.reasoningSegments?.length && (chatMsg.thinkingText || toolCalls.length > 0)) {
            const segments: ReasoningSegment[] = []

            if (chatMsg.thinkingText) {
              segments.push({ thinkingText: chatMsg.thinkingText })
            }

            for (const tc of toolCalls) {
              const lastSeg = segments[segments.length - 1]
              if (lastSeg && !lastSeg.toolCall) {
                lastSeg.toolCall = tc
              } else {
                segments.push({ thinkingText: '', toolCall: tc })
              }
            }

            chatMsg.reasoningSegments = segments
          }
        }
      }

      // 网络请求期间用户已切走：丢弃本次结果，避免旧会话覆盖新会话
      if (loadToken !== conversationLoadToken) return

      // 与服务端最后一页合并：保留更早缓存、本地待确认消息；窗口内被删的移除。
      // 窗口起点用整页（含 tool/system）的最小 seq，避免把被跳过的内部消息误判成删除。
      const serverWindowStartSortKey = result.list
        .map(item => item.sequenceNo)
        .filter((value): value is number => typeof value === 'number' && value > 0)
        .reduce((min, value) => Math.min(min, value), Number.POSITIVE_INFINITY)
      // 用“当前视图”而不是最开始读到的缓存做合并：用户可能在网络校验期间刚发了新消息，
      // 那些乐观气泡还没有服务端 ID，不能被旧缓存/旧页面合并掉。
      const merged = mergeChatMessages([...messages.value], msgs, {
        serverWindowStartSortKey: Number.isFinite(serverWindowStartSortKey)
          ? serverWindowStartSortKey
          : undefined,
      })
      const sequenceNos = msgs
        .map(message => message.sequenceNo)
        .filter((value): value is number => typeof value === 'number' && value > 0)
      const oldestSequenceNo = sequenceNos.length ? Math.min(...sequenceNos) : undefined
      const newestSequenceNo = sequenceNos.length ? Math.max(...sequenceNos) : undefined
      const newestMessage = [...msgs].reverse().find(message => message.messageId)
      const hasMoreOlder = result.hasMore === true
        || (typeof oldestSequenceNo === 'number' && oldestSequenceNo > 1)

      messages.value = merged
      agentStore.currentConversationId = conversationId
      rememberConversation(conversationId)
      resetPlanningStateForConversation(agentStore)
      historyFromCache.value = false
      hasMoreHistory.value = hasMoreOlder

      if (uid) {
        const syncedAt = Date.now()
        void saveCachedMessages(uid, conversationId, merged, { syncedAt })
        void saveConversationSync(uid, {
          conversationId,
          total,
          newestMessageId: newestMessage?.messageId,
          newestSequenceNo,
          oldestSequenceNo,
          hasMoreOlder,
          lastSyncedAt: syncedAt,
          lastFullSyncAt: syncedAt,
        })
        void runCacheGc(uid, { maxConversations: 20, keepConversationId: conversationId })
      }

      // === 水合会话级目标规划快照 ===
      // 执行面板是会话级状态，不属于某条消息；历史会话打开时只恢复一个快照。
      try {
        const snapshot = await agentApi.getPlanningSnapshot(conversationId)
        if (loadToken !== conversationLoadToken) return
        hydratePlanningSnapshot(agentStore, snapshot)
      } catch (e) {
        console.warn('[useAgentChat] 查询规划快照失败，尝试 active-run 兜底:', e)
        try {
          const activeRun = await agentApi.getActiveRun(conversationId)
          if (loadToken !== conversationLoadToken) return
          hydratePlanningSnapshot(agentStore, {
            ...activeRun,
            executionDraftId: activeRun?.draftId,
          })
        } catch (fallbackError) {
          console.warn('[useAgentChat] 查询活跃计划状态失败（非关键）:', fallbackError)
        }
      }

      if (loadToken !== conversationLoadToken) return
      scrollCallback?.()
    } catch (e) {
      if (loadToken !== conversationLoadToken) return
      console.error('[useAgentChat] 加载对话消息失败:', e)
      // 会话被删除/无权访问时清掉本地记忆，避免每次刷新都去加载一个不存在的会话
      const message = String((e as any)?.message || '')
      if (/不存在|无权|删除|归档/.test(message)) {
        clearStreamSnapshot()
        if (uid) void removeCachedConversation(uid, conversationId)
        forgetConversation()
      }
    } finally {
      if (loadToken === conversationLoadToken) {
        loadingHistory.value = false
        // 即使历史请求失败（离线/服务端异常），也要尝试从本地流快照恢复进行中的生成
        void resumeActiveTask(conversationId)
      }
    }
  }

  /**
   * 加载更早的一页历史。
   *
   * <p>先看 IndexedDB 里有没有更早的缓存，没有再走后端 `beforeSequence` 游标；
   * 插入到列表头部，由页面负责保持滚动位置。</p>
   */
  const loadOlderMessages = async () => {
    const conversationId = agentStore.currentConversationId
    if (!conversationId || loadingOlder.value || !hasMoreHistory.value) return
    loadingOlder.value = true
    const loadToken = conversationLoadToken

    const uid = cacheUserId()
    try {
      const firstServerMessage = messages.value.find(
        message => message.messageId && typeof message.sequenceNo === 'number' && message.sequenceNo > 0,
      )
      const beforeSortKey = firstServerMessage ? messageSortKey(firstServerMessage) : null
      if (!beforeSortKey) {
        hasMoreHistory.value = false
        return
      }

      if (uid) {
        const cachedOlder = await getCachedMessagesBefore(uid, conversationId, beforeSortKey, 50)
        if (conversationId !== agentStore.currentConversationId || loadToken !== conversationLoadToken) return
        if (cachedOlder.length > 0) {
          // 当前列表当“服务端窗口”，更早的缓存因为 sortKey 小于窗口起点会被保留
          messages.value = mergeChatMessages(cachedOlder, messages.value)
          return
        }
      }

      const result = await agentApi.getConversationMessages(conversationId, 1, 100, {
        beforeSequence: beforeSortKey,
        showError: false,
      })
      if (conversationId !== agentStore.currentConversationId || loadToken !== conversationLoadToken) return
      const older: ChatMessage[] = []
      for (const msg of result.list) {
        if (msg.role === 'tool' || msg.role === 'system') continue
        const chatMsg: ChatMessage = {
          id: `server:${msg.id}`,
          role: msg.role === 'user' ? 'user' : 'ai',
          content: msg.content || '',
          status: 'done',
          messageId: String(msg.id),
          sequenceNo: msg.sequenceNo,
          traceId: msg.traceId,
          timestamp: new Date(msg.createTime).getTime(),
        }
        if (msg.attachmentFileIds) {
          try {
            const parsed = JSON.parse(msg.attachmentFileIds)
            if (Array.isArray(parsed) && parsed.length > 0) chatMsg.attachmentFileIds = parsed
          } catch {
            // ignore
          }
        }
        if (msg.role === 'assistant') {
          if (msg.reasoningContent) chatMsg.thinkingText = msg.reasoningContent
          if (msg.reasoningSegments) {
            try {
              const parsed = JSON.parse(msg.reasoningSegments)
              if (Array.isArray(parsed) && parsed.length > 0) {
                chatMsg.reasoningSegments = parsed as ReasoningSegment[]
              }
            } catch {
              // ignore
            }
          }
        }
        older.push(chatMsg)
      }

      messages.value = mergeChatMessages(older, messages.value)
      hasMoreHistory.value = result.hasMore === true
      if (uid) {
        void saveCachedMessages(uid, conversationId, older, { syncedAt: Date.now() })
      }
    } catch (err) {
      console.warn('[useAgentChat] 加载更早消息失败:', err)
    } finally {
      if (loadToken === conversationLoadToken) {
        loadingOlder.value = false
      }
    }
  }

  let outboxFlushPromise: Promise<void> | null = null

  /**
   * 重放上次未确认的发送意图。
   *
   * <p>同一个 taskRequestId 命中服务端幂等：如果上次其实已经创建成功，只会拿回原任务，
   * 不会重复开轮/重复调用模型；如果上次根本没到服务端，则这次正常创建。</p>
   */
  const flushPendingOutbox = (): Promise<void> => {
    if (outboxFlushPromise) return outboxFlushPromise
    outboxFlushPromise = (async () => {
      const uid = cacheUserId()
      if (!uid) return
      await pruneCachedOutbox(uid)
      const records = await listCachedOutbox(uid)
      for (const record of records) {
        if (record.status !== 'pending' && record.status !== 'failed') continue
        if (Date.now() - record.createdAt > 30 * 60_000) {
          await removeCachedOutbox(uid, record.clientRequestId)
          continue
        }
        try {
          const task = await createTaskWithRetry(record.payload)
          await removeCachedOutbox(uid, record.clientRequestId)
          await deleteCachedMessage(uid, buildLocalMessageKey(record.clientRequestId, 'user'))
          await deleteCachedMessage(uid, buildLocalMessageKey(record.clientRequestId, 'ai'))

          const conversationId = task.conversationId || record.conversationId
          // 草稿已成功落库：清掉本地 pending draft，避免后续新对话复用旧 UUID
          if (conversationId) {
            const pendingDraft = readPendingDraft(uid)
            if (pendingDraft && pendingDraft.conversationId === conversationId) {
              clearPendingDraft(uid)
            }
          }
          if (conversationId && agentStore.currentConversationId === conversationId) {
            // 用服务端历史重建这一轮，并继续接收仍在运行的生成
            await loadConversation(conversationId)
          } else {
            void agentStore.syncConversations()
          }
        } catch (err: any) {
          const status = err?.response?.status
          if (typeof status === 'number' && status >= 400 && status < 500
            && status !== 408 && status !== 429) {
            await removeCachedOutbox(uid, record.clientRequestId)
          } else if ((record.attempts || 0) >= 4) {
            // 已经重放过多次仍失败：避免永久占用 outbox
            await removeCachedOutbox(uid, record.clientRequestId)
          } else {
            await markCachedOutboxFailed(uid, record.clientRequestId, err?.message || '重放发送失败')
          }
        }
      }
    })().finally(() => {
      outboxFlushPromise = null
    })
    return outboxFlushPromise
  }

  /** 从 pendingTools 中查找第一个匹配 toolName 的条目（用于 tool.completed/failed 匹配 tool.started） */
  function findPendingByToolName(
    map: Map<number, { toolName: string; arguments?: any; startedAt: number }>,
    toolName: string,
  ): { key: number | null; entry: { toolName: string; arguments?: any; startedAt: number } | undefined } {
    for (const [key, val] of map) {
      if (val.toolName === toolName) {
        return { key, entry: val }
      }
    }
    return { key: null, entry: undefined }
  }

  /**
   * 开始新一轮对话
   */
  const resetConversationView = () => {
    if (activeStream) {
      activeStream.stop()
      activeStream = null
    }
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    activeTaskId = null
    clearStreamSnapshot()
    messages.value = []
    streamingMessage = null
    forgetConversation()
    agentStore.reset()
  }

  const startNewConversation = () => {
    // 用户明确要新对话：丢掉上一个未确认草稿，下一次发送生成全新的 draftId + conversationId
    clearPendingDraft(cacheUserId())
    resetConversationView()
  }

  const clearMessages = () => {
    resetConversationView()
  }

  /**
   * 删除对话并清理本地状态
   */
  const deleteConversation = async (conversationId: string) => {
    const wasActive = agentStore.currentConversationId === conversationId
    const stored = loadAgentStreamSnapshot()
    if (wasActive || !stored || !stored.conversationId || stored.conversationId === conversationId) {
      clearStreamSnapshot()
    }
    await agentStore.deleteConversation(conversationId)
    const uid = cacheUserId()
    if (uid) void removeCachedConversation(uid, conversationId)
    if (wasActive) {
      messages.value = []
    }
  }

  return {
    messages,
    loadingHistory,
    historyFromCache,
    hasMoreHistory,
    loadingOlder,
    loadOlderMessages,
    currentForceMode,
    sendMessage,
    stopTask,
    confirmPlan,
    cancelPlan,
    loadConversation,
    flushPendingOutbox,
    startNewConversation,
    clearMessages,
    deleteConversation,
    answerClarificationViaSSE,
    confirmGateViaSSE,
  }
}
