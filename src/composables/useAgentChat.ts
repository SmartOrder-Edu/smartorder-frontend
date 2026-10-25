import { ref, watch } from 'vue'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useAgentStore, type AgentTraceEvent, type ToolCallState, type ReasoningSegment } from '@/stores/agent'
import { agentApi, type AgentGenerationVO, type AgentTraceEventBrief, type ExecutionStep, type PlanSummary } from '@/api/agent'
import { refreshAccessToken } from '@/api/request'
import {
  createResumableStream,
  type ResumableStream,
  type StreamFailure,
} from '@/composables/useResumableAgentStream'
import { shouldResumeGeneration } from '@/composables/resumableStreamCore'
import { mergeTraceEventsForMessage, traceEventsForMessage } from '@/utils/agentTrace'
import { normalizeAgentTraceEvent } from '@/utils/agentTraceEvent'
import {
  buildAgentStreamSnapshot,
  clearAgentStreamSnapshot,
  loadAgentStreamSnapshot,
  saveAgentStreamSnapshot,
  type AgentStreamSnapshot,
} from '@/utils/agentStreamSnapshot'
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
  /** 后端生成任务 ID（断线重连 / 刷新恢复用） */
  generationId?: string
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
}

let localMessageSeq = 0
/** 生成本地消息 ID（只用于前端列表 key 与占位消息定位，不发给后端） */
function nextMessageId(prefix: 'u' | 'a'): string {
  localMessageSeq += 1
  return `${prefix}_${Date.now().toString(36)}_${localMessageSeq}`
}

/**
 * 生成幂等键：一次用户发送只生成一次。
 * 重试创建、断线重连后重新创建都必须复用同一个 key，服务端据此拒绝重复执行模型调用。
 */
function createClientRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
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
 * 创建生成任务（带短重试）。
 *
 * 请求超时/网络抖动时服务端可能已经建好任务，复用 clientRequestId 重试会直接拿回原任务，
 * 不会重复生成；403/404 这类明确的拒绝不重试。
 */
async function createGenerationWithRetry(
  payload: Parameters<typeof agentApi.createGeneration>[0],
  attempts = 3,
): Promise<AgentGenerationVO> {
  let lastError: any
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await agentApi.createGeneration(payload)
    } catch (err: any) {
      lastError = err
      const status = err?.response?.status
      if (status === 401 || status === 403 || status === 404) {
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
  const messages = ref<ChatMessage[]>([])
  const loadingHistory = ref(false)
  let abortController: AbortController | null = null
  /** 当前正在运行的“可恢复事件流”（断线自动重连） */
  let activeStream: ResumableStream | null = null
  /** 当前生成任务 ID：停止时用于通知服务端取消 */
  let activeGenerationId: string | null = null

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

  // ===== 刷新快照：lastSeq + 当前可见的流式状态 =====
  // 只在事件应用并 commit 后记录游标；写入节流，pagehide 时同步 flush。
  // 恢复时先水合快照，再只订阅 seq > lastSeq 的增量。
  const SNAPSHOT_FLUSH_INTERVAL_MS = 500
  let snapshotTracking = false
  let snapshotGenerationId = ''
  let snapshotConversationId = ''
  let snapshotLastSeq = 0
  let snapshotDirty = false
  let snapshotTimer: ReturnType<typeof setTimeout> | null = null
  let snapshotPageHideHandler: (() => void) | null = null

  const writeStreamSnapshot = () => {
    if (!snapshotTracking || !snapshotGenerationId) return
    saveAgentStreamSnapshot(buildAgentStreamSnapshot({
      generationId: snapshotGenerationId,
      conversationId: snapshotConversationId,
      lastSeq: snapshotLastSeq,
      answerText: agentStore.answerText,
      thinkingText: agentStore.thinkingText,
      thinkingDurationMs: agentStore.thinkingDurationMs,
      toolCalls: agentStore.toolCalls,
      reasoningSegments: agentStore.reasoningSegments,
    }))
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
    if (snapshotPageHideHandler && typeof window !== 'undefined') {
      window.removeEventListener('pagehide', snapshotPageHideHandler)
    }
    snapshotPageHideHandler = null
    snapshotTracking = false
    snapshotDirty = false
    snapshotGenerationId = ''
    snapshotConversationId = ''
    snapshotLastSeq = 0
    if (clearStorage) {
      clearAgentStreamSnapshot()
    }
  }

  const clearStreamSnapshot = () => stopStreamSnapshot(true)

  const beginStreamSnapshot = (generationId: string, conversationId: string, afterSeq: number) => {
    stopStreamSnapshot(false)
    snapshotTracking = true
    snapshotGenerationId = generationId
    snapshotConversationId = conversationId || ''
    snapshotLastSeq = Math.max(0, Math.floor(Number(afterSeq) || 0))
    snapshotDirty = false
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
    scheduleStreamSnapshot()
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

  /** 只清理属于该会话的快照，避免误删另一个会话的恢复数据 */
  const clearSnapshotForConversation = (conversationId: string) => {
    const stored = loadAgentStreamSnapshot()
    if (!stored || !stored.conversationId || stored.conversationId === conversationId) {
      clearStreamSnapshot()
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
  const stopGeneration = () => {
    // 用户主动停止：快照不再代表“可恢复的进行中生成”
    clearStreamSnapshot()
    // ① 先停本地订阅，保证停止后不会再有事件写进气泡
    if (activeStream) {
      activeStream.stop()
      activeStream = null
    }
    // ② 协作式取消：服务端在循环边界退出，已提交的副作用不回滚
    if (activeGenerationId) {
      const generationId = activeGenerationId
      activeGenerationId = null
      agentApi.cancelGeneration(generationId).catch(err => {
        console.warn('[useAgentChat] 取消生成失败:', generationId, err)
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

  /**
   * 运行一次可恢复事件流。
   *
   * 发送新消息与刷新后恢复共用这套逻辑：应用事件 → 按 seq 去重/重连 → done 定稿。
   * 区别只在 initialAfterSeq：新消息从 0 开始；刷新恢复从快照的 lastSeq 开始，只补增量。
   */
  const runGenerationStream = async (
    generationId: string,
    assistantMsg: ChatMessage,
    initialAfterSeq = 0,
    countMessageOnDone = true,
  ) => {
    activeGenerationId = generationId
    abortController = new AbortController()
    const stream = createResumableStream()
    activeStream = stream

    try {
      await stream.run({
        generationId,
        initialAfterSeq,
        signal: abortController.signal,

        onEvent(eventName, data) {
          agentStore.handleEvent(eventName, data)

          // plan.created 时根据 taskList.status 推导 planExecuting
          // （后端 EXECUTING 状态时不应强制改为 false）
          if (eventName === 'agent.plan.created') {
            const tl = data?.payload?.taskList
            if (tl) {
              agentStore.planExecuting = tl.status === 'EXECUTING'
            }
          }
          // 每个事件后把实时状态同步进占位气泡（思考/工具/正文/引用）
          // 回放/恢复时事件成批到达，按帧合并，避免几千条事件把主线程卡住
          scheduleSyncStreamingMessage()
        },

        // 关键顺序：先应用事件、再 commit 游标、最后才允许记录快照
        onApplied: (seq) => onStreamEventApplied(seq),

        onTerminal: (payload) => finalizeAssistantTurn(assistantMsg, payload, countMessageOnDone),

        onStateChange(state) {
          // 重连期间保留正文和气泡，只标记“正在重连”
          assistantMsg.reconnecting = state === 'reconnecting'
        },

        onFailure(failure: StreamFailure) {
          // 自动恢复彻底失败：保留已收到的内容并定稿为错误，等待用户手动重试
          clearStreamSnapshot()
          const partial = agentStore.answerText
          agentStore.finishTurn()
          assistantMsg.reconnecting = false
          finishAssistantMessage(assistantMsg, {
            status: 'error',
            content: partial,
            appendText: `\n\n*[${failure.message}]*`,
            errorText: failure.message,
          })
          agentStore.planExecuting = false
          scrollCallback?.()
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
  const resumeActiveGeneration = async (conversationId: string) => {
    if (!conversationId || activeStream) return

    let active: AgentGenerationVO | null = null
    try {
      active = await agentApi.getActiveGeneration(conversationId)
    } catch (err) {
      console.warn('[useAgentChat] 查询活跃生成失败（非关键）:', err)
      return
    }

    // 快照只在本会话、本次 generation 上有效；不匹配时宁可从头回放，也不能拼错状态
    const storedSnapshot = loadAgentStreamSnapshot()

    if (!active?.generationId) {
      if (storedSnapshot && storedSnapshot.conversationId === conversationId) {
        clearStreamSnapshot()
      }
      return
    }
    // 查询期间用户已经切走：不要给旧会话接流，避免污染新会话
    if (agentStore.currentConversationId !== conversationId) return

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
      clearSnapshotForConversation(conversationId)
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
    if (!shouldResumeGeneration(active.status)) {
      clearSnapshotForConversation(conversationId)
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

    const snapshotUsable = !!storedSnapshot
      && storedSnapshot.generationId === active.generationId
      && storedSnapshot.conversationId === conversationId
      && Number.isInteger(storedSnapshot.lastSeq)
      && storedSnapshot.lastSeq >= 0
      // active.lastSeq 为 0 通常表示元数据还没更新；非 0 时才做上限校验
      && (active.lastSeq <= 0 || storedSnapshot.lastSeq <= active.lastSeq)
    if (storedSnapshot && !snapshotUsable) {
      clearStreamSnapshot()
    }

    resetStreamingState()
    streamingMessage = target
    target.status = 'streaming'
    target.content = ''
    target.reconnecting = false
    target.generationId = active.generationId
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

    // 先画快照，再订阅 seq > lastSeq 的增量；首屏不再等整轮回放
    const initialAfterSeq = snapshotUsable ? storedSnapshot!.lastSeq : 0
    if (snapshotUsable) {
      // 历史 trace 已经还原了路由/RAG/思维导图；先把它们放回 store，
      // 避免快照水合后 syncStreamingMessage 用空值覆盖。
      // 导图可能含快照之后的事件，重复由 store 的内容指纹去重。
      if (target.routeResult) agentStore.routeResult = target.routeResult
      if (target.ragSources) agentStore.currentRagSources = target.ragSources
      if (target.mindMaps?.length) agentStore.currentMindMaps = [...target.mindMaps]
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

    console.info('[useAgentChat] 恢复进行中的生成:', active.generationId,
      snapshotUsable ? `after=${initialAfterSeq}` : 'after=0')
    beginStreamSnapshot(active.generationId, conversationId, initialAfterSeq)
    await runGenerationStream(active.generationId, target, initialAfterSeq, false)
  }

  /**
   * 发送消息给 Agent。
   *
   * 流程：创建生成任务（幂等）→ 订阅可恢复事件流（GET SSE）→ 按 seq 增量应用。
   * 网络中断时保留气泡并自动重连，重连只补发遗漏事件，不会重复追加正文。
   */
  const sendMessage = async (message: string, references?: RagReference[]) => {
    if (!message.trim() || agentStore.loading) return

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

    // ① 乐观更新：先把用户这句话显示成一个气泡
    const userMsg: ChatMessage = {
      id: nextMessageId('u'),
      role: 'user',
      content: message,
      status: 'done',
      timestamp: Date.now(),
      attachmentFileIds: attachmentFileIds && attachmentFileIds.length > 0 ? attachmentFileIds : undefined,
      references: references && references.length > 0 ? [...references] : undefined,
    }
    messages.value.push(userMsg)

    agentStore.startNewTurn({ preservePlanState: isClarificationReply })

    // ② 乐观更新：紧接着放一个空的 AI 气泡（"正在思考…"），后续内容往这个气泡里追加
    const assistantMsg = beginAssistantMessage()
    scrollCallback?.()

    // ③ 创建生成任务：执行与订阅解耦。
    //    同一个 clientRequestId 重试只会命中同一任务，不会重复调用一次模型。
    const clientRequestId = createClientRequestId()

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

    let generation: AgentGenerationVO
    try {
      generation = await createGenerationWithRetry({
        message,
        conversationId: agentStore.currentConversationId || undefined,
        fileIds: fileIds && fileIds.length > 0 ? fileIds : undefined,
        knowledgeBaseIds: knowledgeBaseIds && knowledgeBaseIds.length > 0 ? knowledgeBaseIds : undefined,
        forceMode: isClarificationReply ? undefined : (currentForceMode.value || undefined),
        clarificationAnswerJson,
        clientRequestId,
      })
    } catch (err: any) {
      const reason = err?.message || '请求失败，请重试'
      console.error('[useAgentChat] 创建生成任务失败:', err)
      agentStore.finishTurn()
      finishAssistantMessage(assistantMsg, {
        status: 'error',
        content: '',
        appendText: `*[${reason}]*`,
        errorText: reason,
      })
      scrollCallback?.()
      return
    }

    // 发送接口已经同步落库：会话与占位消息 ID 立即可用，不必等第一个 SSE 事件。
    // 即使随后 SSE 一次都没连上，页面也知道这段消息属于哪个会话、是哪一行。
    if (generation.conversationId) {
      agentStore.currentConversationId = generation.conversationId
      agentStore.upsertConversation(generation.conversationId, generation.title || '')
      rememberConversation(generation.conversationId)
    }
    if (generation.userMessageId != null) {
      userMsg.messageId = String(generation.userMessageId)
    }
    if (generation.assistantMessageId != null) {
      assistantMsg.messageId = String(generation.assistantMessageId)
      agentStore.currentAssistantMessageId = String(generation.assistantMessageId)
    }
    if (generation.assistantSequenceNo != null) {
      assistantMsg.sequenceNo = generation.assistantSequenceNo
    }

    assistantMsg.generationId = generation.generationId
    // 发送与刷新恢复共用同一套“应用事件 / 断线重连 / done 定稿”逻辑。
    // 新生成从 0 开始记录快照；恢复路径会从快照的 lastSeq 开始。
    beginStreamSnapshot(generation.generationId,
      generation.conversationId || agentStore.currentConversationId, 0)
    await runGenerationStream(generation.generationId, assistantMsg)
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
    // 切换会话：旧会话的快照不再适用；同会话刷新则保留，交给 resumeActiveGeneration 使用
    const previousConversationId = agentStore.currentConversationId
    const storedSnapshot = loadAgentStreamSnapshot()
    if ((previousConversationId && previousConversationId !== conversationId)
      || (storedSnapshot?.conversationId && storedSnapshot.conversationId !== conversationId)) {
      clearStreamSnapshot()
    }
    // 切换会话：先断开旧的流式连接，避免旧生成的事件继续写进新会话的气泡
    if (activeStream) {
      activeStream.stop()
      activeStream = null
    }
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    activeGenerationId = null
    loadingHistory.value = true
    try {
      // 倒序分页：先查总数，再请求最后一页，确保最新消息一定加载
      const countResult = await agentApi.getConversationMessages(conversationId, 1, 1)
      const total = countResult.total || 0
      const pageSize = 200
      const lastPage = Math.max(1, Math.ceil(total / pageSize))
      const result = await agentApi.getConversationMessages(conversationId, lastPage, pageSize)
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
          status: 'done',
          messageId: msg.id != null ? String(msg.id) : undefined,
          traceId: msg.traceId || undefined,
          timestamp: new Date(msg.createTime).getTime(),
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
          if (msg.traceId) {
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

      messages.value = msgs
      agentStore.currentConversationId = conversationId
      rememberConversation(conversationId)
      resetPlanningStateForConversation(agentStore)

      // === 水合会话级目标规划快照 ===
      // 执行面板是会话级状态，不属于某条消息；历史会话打开时只恢复一个快照。
      try {
        const snapshot = await agentApi.getPlanningSnapshot(conversationId)
        hydratePlanningSnapshot(agentStore, snapshot)
      } catch (e) {
        console.warn('[useAgentChat] 查询规划快照失败，尝试 active-run 兜底:', e)
        try {
          const activeRun = await agentApi.getActiveRun(conversationId)
          hydratePlanningSnapshot(agentStore, {
            ...activeRun,
            executionDraftId: activeRun?.draftId,
          })
        } catch (fallbackError) {
          console.warn('[useAgentChat] 查询活跃计划状态失败（非关键）:', fallbackError)
        }
      }

      scrollCallback?.()

      // 刷新/重新进入会话时恢复进行中的生成：事件日志在 Redis，正文还没落 MySQL，
      // 不接回来的话页面上只会看到一条空的 assistant 消息。
      void resumeActiveGeneration(conversationId)
    } catch (e) {
      console.error('[useAgentChat] 加载对话消息失败:', e)
      // 会话被删除/无权访问时清掉本地记忆，避免每次刷新都去加载一个不存在的会话
      const message = String((e as any)?.message || '')
      if (/不存在|无权|删除|归档/.test(message)) {
        clearStreamSnapshot()
        forgetConversation()
      }
    } finally {
      loadingHistory.value = false
    }
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
  const startNewConversation = () => {
    clearStreamSnapshot()
    messages.value = []
    streamingMessage = null
    forgetConversation()
    agentStore.reset()
  }

  const clearMessages = () => {
    clearStreamSnapshot()
    messages.value = []
    streamingMessage = null
    forgetConversation()
    agentStore.reset()
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
    if (wasActive) {
      messages.value = []
    }
  }

  return {
    messages,
    loadingHistory,
    currentForceMode,
    sendMessage,
    stopGeneration,
    confirmPlan,
    cancelPlan,
    loadConversation,
    startNewConversation,
    clearMessages,
    deleteConversation,
    answerClarificationViaSSE,
    confirmGateViaSSE,
  }
}
