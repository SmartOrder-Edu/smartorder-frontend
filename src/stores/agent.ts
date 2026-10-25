import { defineStore } from 'pinia'
import { ref } from 'vue'
import { agentApi, type ConversationVO, type ExecutionStep, type PlanSummary } from '@/api/agent'
import { useUserStore } from './user'
import {
  getCachedConversations,
  saveCachedConversations,
  upsertCachedConversation,
  removeCachedConversation,
} from '@/cache/conversationCache'
import type {
  TaskList,
  TaskItem,
  TaskExecutionState,
  PauseReason,
  PlanPauseInfo,
  ClarificationInfo,
  LearningPlanDraft,
  PhaseInfo,
} from '@/types/planExecute'
import type { RagSourcePayload, WebSearchReference } from '@/composables/useAgentChat'
import type { MindMapData } from '@/types/mindMap'
import { appendTraceEvent } from '@/utils/agentTrace'

export interface AgentTraceEvent<T = any> {
  traceId: string
  conversationId: string
  userId: number
  mode: string
  eventType: string
  seq: number
  timestamp: number
  payload: T
}

export interface TraceNode {
  seq: number
  eventType: string
  mode: string
  payload: any
  timestamp: number
}

export interface ToolCallState {
  toolName: string
  status: 'running' | 'completed' | 'failed'
  arguments?: any
  result?: any
  durationMs?: number
  startedAt: number
}

/** 一轮 ReAct 推理：思考文本 + 可选的工具调用 */
export interface ReasoningSegment {
  thinkingText: string
  toolCall?: ToolCallState
  thinkingStreaming?: boolean
}

/**
 * Agent 对话状态管理
 */
export const useAgentStore = defineStore('agent', () => {
  // 当前对话 ID
  const currentConversationId = ref<string>('')

  // 当前追踪 ID
  const currentTraceId = ref<string>('')

  // 当前轮的助手占位消息 ID（后端 agent.message.created 下发，done 时用于定稿）
  const currentAssistantMessageId = ref<string>('')

  // 本轮是否新建了会话（agent.conversation.created 置 true，用于避免消息数重复累加）
  const conversationCreatedThisTurn = ref(false)

  // 当前运行模式
  const currentMode = ref<string>('')

  // AI 回答文本（累积）
  const answerText = ref('')

  // 思考文本（累积 agent.think.delta）
  const thinkingText = ref('')
  const thinkingStartTime = ref<number | null>(null)
  const thinkingDurationMs = ref<number | null>(null)

  // 工具调用状态（合并 started/completed/failed）
  const toolCalls = ref<ToolCallState[]>([])

  // 按轮分段的推理过程（思考 + 工具调用配对）
  const reasoningSegments = ref<ReasoningSegment[]>([])

  // 路由结果
  const routeResult = ref<any>(null)

  // 追溯事件列表
  const traceEvents = ref<AgentTraceEvent[]>([])

  // 是否正在加载
  const loading = ref(false)

  // === 规划相关状态 ===
  const planDialogVisible = ref(false)
  const currentDraftId = ref('')
  const currentPlan = ref<any>(null)
  const planConfirmLoading = ref(false)

  // === 执行步骤状态（plan confirm 期间） ===
  const executionSteps = ref<ExecutionStep[]>([])
  const planConfirmResult = ref<PlanSummary | null>(null)
  const planDialogClosing = ref(false)

  // === Plan-and-Execute 状态 ===
  const currentTaskList = ref<TaskList | null>(null)
  const taskExecutionMap = ref<Map<string, TaskExecutionState>>(new Map())
  const planPauseInfo = ref<PlanPauseInfo | null>(null)
  /** 已提交回答的 clarificationId 集合（用于判断 GateCard 只读态） */
  const clarificationAnsweredIds = ref<Set<string>>(new Set())
  /** 计划执行阶段是否正在运行（区别于普通 loading） */
  const planExecuting = ref(false)
  /** 计划是否需要用户确认（CONFIRMATION gate 为 true，全 NORMAL 为 false） */
  const planNeedsConfirmation = ref(false)
  /** 当前阶段（PLANNING / EXECUTING 等） */
  const currentPhase = ref<string>('')

  // === 学习计划草稿状态（LEARNING_PLAN 类型） ===
  const learningPlanDraft = ref<LearningPlanDraft | null>(null)
  const showLearningPlanPreview = ref(false)
  const learningPlanPreviewReadonly = ref(false)
  const learningPlanSpaceCreated = ref<{ spaceId: string; spaceName: string } | null>(null)

  // === 网络搜索引用状态 ===
  const currentWebSearchReferences = ref<WebSearchReference[]>([])

  // === RAG 检索来源状态 ===
  const currentRagSources = ref<RagSourcePayload | null>(null)

  // === 思维导图状态（本轮生成的思维导图列表） ===
  const currentMindMaps = ref<MindMapData[]>([])

  // === 追踪面板状态 ===
  const tracePanelVisible = ref(false)
  const activeTraceId = ref<string>('')

  // === 对话历史列表 ===
  const conversations = ref<ConversationVO[]>([])
  const conversationsLoading = ref(false)

  /** 当前用户 ID（缓存按用户分库）；未登录/加载中返回 null，自动降级为不缓存 */
  function cacheUserId(): string | null {
    try {
      const id = useUserStore().userInfo?.id
      return id ? String(id) : null
    } catch {
      return null
    }
  }

  /**
   * 开始新的对话轮次
   */
  function startNewTurn(options?: { preservePlanState?: boolean }) {
    answerText.value = ''
    thinkingText.value = ''
    thinkingStartTime.value = null
    thinkingDurationMs.value = null
    toolCalls.value = []
    reasoningSegments.value = []
    routeResult.value = null
    traceEvents.value = []
    currentAssistantMessageId.value = ''
    conversationCreatedThisTurn.value = false
    loading.value = true
    planDialogVisible.value = false
    tracePanelVisible.value = false
    executionSteps.value = []
    planConfirmResult.value = null
    planDialogClosing.value = false
    currentPhase.value = ''
    // Plan-and-Execute 状态在 preservePlanState 时跨消息保持（多轮澄清等场景）
    if (!options?.preservePlanState) {
      currentDraftId.value = ''
      currentPlan.value = null
      currentTaskList.value = null
      taskExecutionMap.value = new Map()
      planPauseInfo.value = null
      planNeedsConfirmation.value = false
      clarificationAnsweredIds.value.clear()
    }
    // 学习计划草稿状态——每次新对话重置
    learningPlanDraft.value = null
    showLearningPlanPreview.value = false
    learningPlanPreviewReadonly.value = false
    learningPlanSpaceCreated.value = null
    // 网络搜索引用状态——每次新对话重置
    currentWebSearchReferences.value = []
    // RAG 检索来源状态——每次新对话重置
    currentRagSources.value = null
    // 思维导图状态——每次新对话重置
    currentMindMaps.value = []
  }

  /**
   * 将全局 reasoningSegments 同步到当前运行中 task 的 execState
   */
  function syncReasoningToRunningTask() {
    if (!taskExecutionMap.value || taskExecutionMap.value.size === 0) return
    for (const [, execState] of taskExecutionMap.value) {
      if (execState.status === 'running') {
        execState.reasoningSegments = reasoningSegments.value.map(seg => ({
          ...seg,
          toolCall: seg.toolCall ? { ...seg.toolCall } : undefined,
        }))
        break
      }
    }
  }

  /**
   * 处理 SSE 事件
   */
  function handleEvent(eventName: string, data: AgentTraceEvent) {
    // token 级 delta（text/think）只驱动正文与思考渲染，不进入追踪时间线。
    // 断线回放几千条事件时，逐条 push 进响应式数组是前端最大的一块无用功。
    appendTraceEvent(traceEvents.value, eventName, data)

    if (data.traceId) {
      currentTraceId.value = data.traceId
    }
    if (data.conversationId) {
      currentConversationId.value = data.conversationId
    }
    if (data.mode) {
      currentMode.value = data.mode
    }

    switch (eventName) {
      /**
       * 首条消息：后端已建好会话并下发兜底标题。
       * 前端据此把会话 upsert 到侧边栏头部，避免"发完第一条消息左侧没有这条会话"。
       */
      case 'agent.conversation.created': {
        const cid = data.payload?.conversationId || data.conversationId
        if (cid) {
          currentConversationId.value = cid
          conversationCreatedThisTurn.value = true
          upsertConversation(cid, data.payload?.title || '')
        }
        break
      }

      /** 模型压缩标题异步生成完成：更新侧边栏与顶栏标题 */
      case 'agent.conversation.title': {
        const cid = data.payload?.conversationId || data.conversationId
        const title = data.payload?.title
        if (cid && title) {
          upsertConversation(cid, title)
        }
        break
      }

      /** 助手占位消息已创建（status=RUNNING），记住 messageId 用于 done 定稿 */
      case 'agent.message.created': {
        if (data.payload?.messageId != null) {
          currentAssistantMessageId.value = String(data.payload.messageId)
        }
        break
      }

      case 'agent.text.delta':
        if (data.payload?.text) {
          answerText.value += data.payload.text
        }
        // 思考结束，回答开始
        {
          const lastSeg = reasoningSegments.value[reasoningSegments.value.length - 1]
          if (lastSeg) lastSeg.thinkingStreaming = false
        }
        break

      case 'agent.think.delta':
        if (data.payload?.text) {
          if (!thinkingStartTime.value) {
            thinkingStartTime.value = Date.now()
          }
          thinkingText.value += data.payload.text

          // 按轮分段：若最后一个 segment 无 toolCall，追加到同一轮；否则开新轮
          const lastSeg = reasoningSegments.value[reasoningSegments.value.length - 1]
          if (!lastSeg || lastSeg.toolCall) {
            reasoningSegments.value.push({
              thinkingText: data.payload.text,
              thinkingStreaming: true,
            })
          } else {
            lastSeg.thinkingText += data.payload.text
          }
        }
        syncReasoningToRunningTask()
        break

      case 'agent.tool.started': {
        const newTool: ToolCallState = {
          toolName: data.payload?.toolName || '未知工具',
          status: 'running',
          arguments: data.payload?.arguments,
          startedAt: Date.now(),
        }
        toolCalls.value.push(newTool)

        // 挂载到当前 segment 或创建新的（无思考的工具调用）
        const lastSeg = reasoningSegments.value[reasoningSegments.value.length - 1]
        if (lastSeg && !lastSeg.toolCall) {
          lastSeg.thinkingStreaming = false
          lastSeg.toolCall = newTool
        } else {
          reasoningSegments.value.push({
            thinkingText: '',
            toolCall: newTool,
          })
        }
        syncReasoningToRunningTask()
        break
      }

      case 'agent.tool.completed': {
        const tc = toolCalls.value.find(
          t => t.toolName === data.payload?.toolName && t.status === 'running'
        )
        if (tc) {
          tc.status = 'completed'
          tc.result = data.payload?.result
          tc.durationMs = data.payload?.durationMs
        }
        // 同步更新 reasoningSegments
        const seg = reasoningSegments.value.find(
          s => s.toolCall?.toolName === data.payload?.toolName && s.toolCall?.status === 'running'
        )
        if (seg?.toolCall) {
          seg.toolCall.status = 'completed'
          seg.toolCall.result = data.payload?.result
          seg.toolCall.durationMs = data.payload?.durationMs
        }
        // 提取网络搜索引用（完整数据，不截断）
        if (data.payload?.toolName === 'webSearch' && data.payload?.webSearchReferences) {
          currentWebSearchReferences.value = data.payload.webSearchReferences
          // 注入到 toolCall.result 中，避免 ToolCallCard 内联展示受 ToolResultTruncator 截断影响
          // （后端截断后 result 变成非法 JSON 字符串，normalizeResult 无法解析）
          const wsr = data.payload.webSearchReferences
          ;[tc, seg?.toolCall].forEach((t) => {
            if (!t) return
            if (t.result && typeof t.result === 'object' && !Array.isArray(t.result)) {
              t.result = { ...t.result, webSearchReferences: wsr }
            } else {
              t.result = { webSearchReferences: wsr }
            }
          })
        }
        syncReasoningToRunningTask()
        break
      }

      case 'agent.tool.failed': {
        const tf = toolCalls.value.find(
          t => t.toolName === data.payload?.toolName && t.status === 'running'
        )
        if (tf) {
          tf.status = 'failed'
          tf.durationMs = data.payload?.durationMs
        }
        // 同步更新 reasoningSegments
        const segF = reasoningSegments.value.find(
          s => s.toolCall?.toolName === data.payload?.toolName && s.toolCall?.status === 'running'
        )
        if (segF?.toolCall) {
          segF.toolCall.status = 'failed'
          segF.toolCall.durationMs = data.payload?.durationMs
        }
        syncReasoningToRunningTask()
        break
      }

      case 'agent.route.completed':
        routeResult.value = data.payload
        break

      case 'agent.rag.chunks': {
        const chunks = Array.isArray(data.payload?.chunks) ? data.payload.chunks : []
        currentRagSources.value = {
          chunks,
          chunkCount: data.payload?.chunkCount ?? chunks.length,
          usedRetrievalMode: data.payload?.usedRetrievalMode || 'unknown',
          degraded: data.payload?.degraded === true,
        }
        break
      }

      case 'agent.phase.change':
        currentPhase.value = data.payload?.phase || ''
        break

      case 'agent.plan.created': {
        currentDraftId.value = data.payload?.draftId || ''
        currentPlan.value = data.payload?.taskList || data.payload?.plan || null
        planNeedsConfirmation.value = data.payload?.needsConfirmation === true

        // 如果携带 TaskList（新架构 TASK_LIST 类型），初始化或增量更新执行状态
        const taskList = data.payload?.taskList
        if (taskList && taskList.tasks) {
          currentTaskList.value = taskList as TaskList
          if (!taskExecutionMap.value || taskExecutionMap.value.size === 0) {
            // 首次创建：全量初始化
            taskExecutionMap.value = new Map()
            for (const task of taskList.tasks as TaskItem[]) {
              taskExecutionMap.value.set(task.taskId, {
                taskItem: task,
                status: (task.status?.toLowerCase() as TaskExecutionState['status']) || 'pending',
                retryCount: task.retryCount || 0,
                reasoningSegments: [],
                thinkText: '',
              })
            }
          } else {
            // 后续快照：增量更新，保留已有执行状态（时间、推理过程等）
            for (const task of taskList.tasks as TaskItem[]) {
              const existing = taskExecutionMap.value.get(task.taskId)
              if (existing) {
                existing.taskItem = task
                // 如果后端状态比前端更新，同步过来
                const backendStatus = task.status?.toLowerCase()
                if (backendStatus && backendStatus !== existing.status && backendStatus !== 'running') {
                  existing.status = backendStatus as TaskExecutionState['status']
                }
                existing.retryCount = task.retryCount || 0
              } else {
                taskExecutionMap.value.set(task.taskId, {
                  taskItem: task,
                  status: (task.status?.toLowerCase() as TaskExecutionState['status']) || 'pending',
                  retryCount: task.retryCount || 0,
                  reasoningSegments: [],
                  thinkText: '',
                })
              }
            }
          }
          planPauseInfo.value = null
          planExecuting.value = taskList.status === 'EXECUTING'
          // TASK_LIST 模式不打开 PlanRevealOverlay（使用 PlanChecklist 代替）
          planDialogVisible.value = false
        } else {
          // LEGACY 模式使用 PlanRevealOverlay
          planDialogVisible.value = true
        }
        break
      }

      case 'agent.learning_plan.created': {
        const plan = data.payload?.plan
        if (plan) {
          learningPlanDraft.value = {
            draftId: data.payload?.draftId || '',
            spaceName: plan.spaceName || '',
            type: plan.type || 'course',
            description: plan.description || '',
            goals: parseGoals(plan.goals),
            startDate: plan.startDate || '',
            targetEndDate: plan.targetEndDate || '',
            phases: parsePhases(plan.phases) || [],
            knowledgeGraph: plan.knowledgeGraph || { nodes: [], edges: [] },
          }
          showLearningPlanPreview.value = true
          learningPlanPreviewReadonly.value = false
          learningPlanSpaceCreated.value = null
          // 互斥：学习计划草稿出现时，执行计划不再需要确认。
          // 学习计划草稿的确认由 LearningPlanPreview 卡片承担，
          // 清空执行计划确认态避免 autoConfirm 等逻辑确认错对象。
          planNeedsConfirmation.value = false
          planPauseInfo.value = null
          planExecuting.value = false
          if (currentTaskList.value) {
            currentTaskList.value.status = 'COMPLETED'
          }
        }
        break
      }

      case 'agent.mindmap.created': {
        const mm = data.payload as MindMapData
        if (mm && Array.isArray(mm.nodes) && mm.nodes.length > 0) {
          // 快照恢复时历史 trace 已种入同一张导图，重放事件按内容去重
          const key = mindMapKey(mm)
          if (!currentMindMaps.value.some(existing => mindMapKey(existing) === key)) {
            currentMindMaps.value.push(mm)
          }
        }
        break
      }

      // ====== Plan-and-Execute 事件 ======

      case 'agent.plan.task.started': {
        const taskId = data.payload?.taskId || ''
        const execState = taskExecutionMap.value.get(taskId)
        if (execState) {
          execState.status = 'running'
          execState.startedAt = Date.now()
          execState.reasoningSegments = []
          execState.thinkText = ''
        }
        if (currentTaskList.value) {
          const task = currentTaskList.value.tasks.find(t => t.taskId === taskId)
          if (task) task.status = 'RUNNING'
        }
        planExecuting.value = true
        addExecutionStep({
          stepName: `${taskId} - ${data.payload?.description || ''}`,
          status: 'running',
          startedAt: Date.now(),
        })
        break
      }

      case 'agent.plan.task.completed': {
        const taskId = data.payload?.taskId || ''
        const execState = taskExecutionMap.value.get(taskId)
        if (execState) {
          execState.status = 'completed'
          execState.resultSummary = data.payload?.resultSummary || ''
          execState.completedAt = Date.now()
        }
        if (currentTaskList.value) {
          const task = currentTaskList.value.tasks.find(t => t.taskId === taskId)
          if (task) {
            task.status = 'COMPLETED'
            task.resultSummary = data.payload?.resultSummary || ''
          }
        }
        addExecutionStep({
          stepName: `${taskId} - ${data.payload?.description || ''}`,
          status: 'completed',
          completedAt: Date.now(),
        })
        break
      }

      case 'agent.plan.task.failed': {
        const taskId = data.payload?.taskId || ''
        const execState = taskExecutionMap.value.get(taskId)
        if (execState) {
          execState.status = 'failed'
          execState.errorMessage = data.payload?.errorMessage || ''
          execState.completedAt = Date.now()
        }
        if (currentTaskList.value) {
          const task = currentTaskList.value.tasks.find(t => t.taskId === taskId)
          if (task) {
            task.status = 'FAILED'
            task.errorMessage = data.payload?.errorMessage || ''
          }
        }
        addExecutionStep({
          stepName: `${taskId} - ${data.payload?.description || ''}`,
          status: 'failed',
          message: data.payload?.errorMessage,
        })
        break
      }

      case 'agent.plan.paused': {
        const reason = data.payload?.reason as PauseReason
        if (showLearningPlanPreview.value && learningPlanDraft.value) {
          break
        }
        const taskId = data.payload?.taskId || ''
        const question = data.payload?.question || ''
        const clarification = data.payload?.clarification as ClarificationInfo | undefined
        planPauseInfo.value = { reason, taskId, question, clarification }

        const execState = taskExecutionMap.value.get(taskId)
        if (execState) {
          execState.status = 'paused'
        }
        if (currentTaskList.value) {
          if (reason === 'CLARIFICATION') {
            currentTaskList.value.status = 'PAUSED_CLARIFICATION'
            currentTaskList.value.clarificationQuestion = question
          } else if (reason === 'CONFIRMATION') {
            currentTaskList.value.status = 'PAUSED_CONFIRMATION'
          }
        }

        if (reason === 'CLARIFICATION') {
          const q = question || '请提供更多信息'
          answerText.value += '\n\n' + q
        }
        break
      }

      case 'agent.gate.answered': {
        const answeredClarificationId = data.payload?.clarificationId as string
        if (answeredClarificationId) {
          clarificationAnsweredIds.value.add(answeredClarificationId)
        }
        // 全部回答完毕时，planPauseInfo 会在后续 agent.plan.resumed 中清除
        // 还有更多待回答时，planPauseInfo 会在后续 agent.plan.paused 中更新
        break
      }

      case 'agent.plan.resumed': {
        planPauseInfo.value = null
        const taskId = data.payload?.taskId || ''
        const execState = taskExecutionMap.value.get(taskId)
        if (execState && !['completed', 'failed', 'skipped'].includes(execState.status)) {
          execState.status = 'running'
        }
        if (currentTaskList.value) {
          currentTaskList.value.status = 'EXECUTING'
        }
        break
      }

      case 'agent.plan.step.started':
        addExecutionStep({
          stepName: data.payload?.stepName || '未知步骤',
          status: 'running',
          startedAt: Date.now(),
        })
        break

      case 'agent.plan.step.completed':
        addExecutionStep({
          stepName: data.payload?.stepName || '',
          status: 'completed',
          completedAt: Date.now(),
        })
        break

      case 'agent.plan.step.failed':
        addExecutionStep({
          stepName: data.payload?.stepName || '',
          status: 'failed',
          message: data.payload?.message,
        })
        break

      case 'agent.status': {
        const payload = data.payload
        if (payload?.type === 'learning_plan_waiting_confirmation') {
          planExecuting.value = false
          if (currentTaskList.value) {
            currentTaskList.value.status = 'COMPLETED'
          }
          break
        }
        if (payload?.type === 'task_retry') {
          const taskId = payload.taskId || ''
          const execState = taskExecutionMap.value.get(taskId)
          if (execState) {
            execState.retryCount = payload.attempt || (execState.retryCount + 1)
            execState.reasoningSegments = []
            execState.thinkText = ''
            execState.status = 'running'
          }
        }
        if (payload?.type === 'space_created') {
          // 学习空间创建成功：更新 TaskList 和回答文本
          if (currentTaskList.value) {
            currentTaskList.value.spaceCreated = {
              spaceId: String(payload.spaceId),
              spaceName: payload.spaceName || '',
            }
          }
          if (payload.message) {
            answerText.value += '\n\n' + payload.message
          }
          // 隐藏学习计划预览（LEARNING_PLAN 路径确认后）
          showLearningPlanPreview.value = false
        }
        if (payload?.type === 'plan_replanned') {
          const newTaskList = payload?.taskList as TaskList | undefined
          if (newTaskList && newTaskList.tasks) {
            currentTaskList.value = newTaskList
            const newMap = new Map<string, TaskExecutionState>()
            for (const task of newTaskList.tasks) {
              const existing = taskExecutionMap.value.get(task.taskId)
              if (existing && (existing.status === 'completed' || existing.status === 'failed')) {
                newMap.set(task.taskId, { ...existing, taskItem: task })
              } else {
                newMap.set(task.taskId, {
                  taskItem: task,
                  status: (task.status?.toLowerCase() as TaskExecutionState['status']) || 'pending',
                  retryCount: task.retryCount || 0,
                  reasoningSegments: [],
                  thinkText: '',
                })
              }
            }
            taskExecutionMap.value = newMap
          }
          if (currentTaskList.value) {
            currentTaskList.value.status = 'EXECUTING'
          }
        }
        if (payload?.message) {
          addExecutionStep({
            stepName: payload.message,
            status: 'running',
            startedAt: Date.now(),
          })
        }
        break
      }

      case 'agent.error':
        if (data.payload?.message) {
          answerText.value += `\n\n[错误] ${data.payload.message}`
        }
        loading.value = false
        planExecuting.value = false
        break
    }
  }

  /**
   * 把会话 upsert 到列表（首条消息时后端下发 conversation.created）。
   * 新建的会话排到最前；已有会话只更新标题/活跃时间，不改变顺序。
   */
  function upsertConversation(conversationId: string, title?: string) {
    const list = conversations.value
    const idx = list.findIndex(c => c.conversationId === conversationId)
    if (idx >= 0) {
      const conv = list[idx]
      if (title) conv.title = title
      conv.lastActiveTime = new Date().toISOString()
      const uid = cacheUserId()
      if (uid) void upsertCachedConversation(uid, conv)
      return conv
    }
    const created: ConversationVO = {
      conversationId,
      title: title || '',
      lastMessage: '',
      messageCount: 2,
      lastActiveTime: new Date().toISOString(),
    }
    list.unshift(created)
    const uid = cacheUserId()
    if (uid) void upsertCachedConversation(uid, created)
    return list[0]
  }

  /** 更新当前会话的最后活跃时间与消息数（一轮对话结束后调用） */
  function touchConversation(messageCountDelta = 0) {
    const cid = currentConversationId.value
    if (!cid) return
    const conv = conversations.value.find(c => c.conversationId === cid)
    if (!conv) return
    conv.lastActiveTime = new Date().toISOString()
    if (messageCountDelta) {
      conv.messageCount = (conv.messageCount || 0) + messageCountDelta
    }
    const uid = cacheUserId()
    if (uid) void upsertCachedConversation(uid, conv)
  }

  function addExecutionStep(step: ExecutionStep) {
    const existing = executionSteps.value.find(s => s.stepName === step.stepName)
    if (existing) {
      Object.assign(existing, step)
    } else {
      executionSteps.value.push(step)
    }
  }

  function resetExecutionSteps() {
    executionSteps.value = []
  }

  function closePlanDialog() {
    planDialogClosing.value = true
    setTimeout(() => {
      planDialogVisible.value = false
      planDialogClosing.value = false
      resetExecutionSteps()
    }, 300)
  }

  /**
   * 完成当前轮次
   */
  function finishTurn() {
    loading.value = false
    answerText.value = ''
    currentPhase.value = ''
    planExecuting.value = false
    if (thinkingStartTime.value) {
      thinkingDurationMs.value = Date.now() - thinkingStartTime.value
    }
  }

  /**
   * 打开追踪面板
   */
  function openTracePanel(traceId?: string) {
    activeTraceId.value = traceId || currentTraceId.value
    tracePanelVisible.value = true
  }

  /**
   * 关闭追踪面板
   */
  function closeTracePanel() {
    tracePanelVisible.value = false
  }

  /**
   * 获取当前 AI 消息关联的追踪事件
   */
  function getCurrentMessageTraceEvents(): AgentTraceEvent[] {
    return traceEvents.value.filter(e => e.traceId === currentTraceId.value)
  }

  /**
   * 获取对话列表（整表刷新）
   *
   * 会置 `conversationsLoading`，侧边栏会显示"加载中..."。
   * 只在首次进入页面等"必须整表重建"的场景使用；
   * 日常操作（新建对话、删除对话）请用 `syncConversations()`。
   */
  async function fetchConversations() {
    // 缓存已经渲染出列表时不要整表 loading，避免侧边栏闪一下
    conversationsLoading.value = conversations.value.length === 0
    try {
      const data = await agentApi.getConversations()
      conversations.value = data || []
      const uid = cacheUserId()
      if (uid && conversations.value.length > 0) {
        void saveCachedConversations(uid, conversations.value)
      }
    } catch (e) {
      // 网络失败时保留缓存渲染结果，不清空侧边栏
      console.error('[AgentStore] 获取对话列表失败:', e)
    } finally {
      conversationsLoading.value = false
    }
  }

  /**
   * 启动时先用 IndexedDB 缓存渲染侧边栏，再后台拉服务端列表。
   * 缓存为空/不可用时什么都不做，保持原有 loading 行为。
   */
  async function hydrateCachedConversations() {
    if (conversations.value.length > 0) return
    const uid = cacheUserId()
    if (!uid) return
    try {
      const cached = await getCachedConversations(uid)
      if (cached.length > 0 && conversations.value.length === 0) {
        conversations.value = cached
      }
    } catch (err) {
      console.warn('[AgentStore] 读取会话列表缓存失败:', err)
    }
  }

  /** 静默同步是否进行中（防重入，不影响任何 loading UI） */
  const conversationsSyncing = ref(false)
  /** 上次静默同步的时间戳（用于节流，避免频繁拉列表） */
  let lastConversationsSyncAt = 0

  /**
   * 静默增量同步对话列表
   *
   * 与 `fetchConversations` 的区别（这正是点"新建对话"时不该整表刷新的原因）：
   * 1. 不置 `conversationsLoading` —— 侧边栏不会闪一下"加载中..."；
   * 2. 不替换整个数组 —— 逐条比对，只把**新增的**插进去、只更新**变了的**字段，
   *    已有列表项的引用保持不变，v-for 复用 DOM，没有任何重建/闪烁；
   * 3. 远端没有但本地有的会话（刚创建、列表接口还没读到）保留下来，不会被"刷没"。
   *
   * 这是**兜底**通道：主路径是 SSE 的 `agent.conversation.created` / `.title` 事件，
   * 只有事件丢了（断线、别的标签页新建）才需要它来对齐。
   *
   * @param options.minIntervalMs 节流窗口，窗口内重复调用直接跳过（默认不节流）
   */
  async function syncConversations(options?: { minIntervalMs?: number }) {
    const minInterval = options?.minIntervalMs ?? 0
    if (minInterval > 0 && Date.now() - lastConversationsSyncAt < minInterval) return
    if (conversationsSyncing.value) return
    conversationsSyncing.value = true
    lastConversationsSyncAt = Date.now()
    try {
      const latest = (await agentApi.getConversations()) || []
      mergeConversations(latest)
      const uid = cacheUserId()
      if (uid && conversations.value.length > 0) {
        void saveCachedConversations(uid, conversations.value)
      }
    } catch (e) {
      // 静默失败：保持现有列表不动，不打扰用户
      console.error('[AgentStore] 同步对话列表失败:', e)
    } finally {
      conversationsSyncing.value = false
    }
  }

  /** 把远端列表合并进本地（新增插入 / 变更原地更新 / 无变化则完全不动） */
  function mergeConversations(latest: ConversationVO[]) {
    const localMap = new Map(conversations.value.map(c => [c.conversationId, c]))
    const remoteIds = new Set(latest.map(c => c.conversationId))
    let changed = false

    const merged: ConversationVO[] = latest.map(remote => {
      const local = localMap.get(remote.conversationId)
      if (!local) {
        changed = true
        return remote
      }
      // 原地改字段，不换对象引用 → 对应列表项不会重新渲染
      if (remote.title && remote.title !== local.title) {
        local.title = remote.title
        changed = true
      }
      if (remote.lastMessage !== local.lastMessage) {
        local.lastMessage = remote.lastMessage
        changed = true
      }
      if (typeof remote.messageCount === 'number' && remote.messageCount !== local.messageCount) {
        local.messageCount = remote.messageCount
        changed = true
      }
      if (remote.lastActiveTime && remote.lastActiveTime !== local.lastActiveTime) {
        local.lastActiveTime = remote.lastActiveTime
        changed = true
      }
      return local
    })

    // 本地有、远端没有的（通常是刚创建还没进列表接口的会话）放到最前面
    const localOnly = conversations.value.filter(c => !remoteIds.has(c.conversationId))
    if (localOnly.length > 0) changed = true

    if (!changed) return
    conversations.value = [...localOnly, ...merged]
  }

  /**
   * 删除指定对话
   */
  async function deleteConversation(conversationId: string) {
    await agentApi.deleteConversation(conversationId)
    conversations.value = conversations.value.filter(c => c.conversationId !== conversationId)
    const uid = cacheUserId()
    if (uid) void removeCachedConversation(uid, conversationId)
    if (currentConversationId.value === conversationId) {
      currentConversationId.value = ''
    }
  }

  /** 思维导图内容指纹：同一张导图在快照 + 重放路径下只保留一份 */
  function mindMapKey(mm: MindMapData): string {
    try {
      return JSON.stringify(mm)
    } catch {
      return `${mm?.topic || ''}|${mm?.nodes?.length || 0}`
    }
  }

  /** 解析 goals（可能为数组或 JSON 字符串） */
  function parseGoals(goals: any): string[] {
    if (Array.isArray(goals)) return goals
    if (typeof goals === 'string') {
      try { return JSON.parse(goals) } catch { return [] }
    }
    return []
  }

  /** 解析 phases（可能为数组或 JSON 字符串） */
  function parsePhases(phases: any): PhaseInfo[] {
    if (Array.isArray(phases)) return phases
    if (typeof phases === 'string') {
      try { return JSON.parse(phases) } catch { return [] }
    }
    return []
  }

  function reset() {
    currentConversationId.value = ''
    currentTraceId.value = ''
    currentAssistantMessageId.value = ''
    conversationCreatedThisTurn.value = false
    currentMode.value = ''
    answerText.value = ''
    thinkingText.value = ''
    thinkingStartTime.value = null
    thinkingDurationMs.value = null
    toolCalls.value = []
    reasoningSegments.value = []
    routeResult.value = null
    traceEvents.value = []
    loading.value = false
    planDialogVisible.value = false
    currentDraftId.value = ''
    currentPlan.value = null
    tracePanelVisible.value = false
    executionSteps.value = []
    planConfirmResult.value = null
    planDialogClosing.value = false
    currentTaskList.value = null
    taskExecutionMap.value = new Map()
    planPauseInfo.value = null
    clarificationAnsweredIds.value.clear()
    planExecuting.value = false
    planNeedsConfirmation.value = false
    currentPhase.value = ''
    learningPlanDraft.value = null
    showLearningPlanPreview.value = false
    learningPlanPreviewReadonly.value = false
    learningPlanSpaceCreated.value = null
    currentWebSearchReferences.value = []
    currentRagSources.value = null
    currentMindMaps.value = []
  }

  return {
    currentConversationId,
    currentTraceId,
    currentAssistantMessageId,
    conversationCreatedThisTurn,
    currentMode,
    answerText,
    thinkingText,
    thinkingStartTime,
    thinkingDurationMs,
    toolCalls,
    reasoningSegments,
    routeResult,
    traceEvents,
    loading,
    planDialogVisible,
    currentDraftId,
    currentPlan,
    planConfirmLoading,
    executionSteps,
    planConfirmResult,
    planDialogClosing,
    tracePanelVisible,
    activeTraceId,
    conversations,
    conversationsLoading,
    // Plan-and-Execute
    currentTaskList,
    taskExecutionMap,
    planPauseInfo,
    clarificationAnsweredIds,
    planExecuting,
    planNeedsConfirmation,
    currentPhase,
    learningPlanDraft,
    showLearningPlanPreview,
    learningPlanPreviewReadonly,
    learningPlanSpaceCreated,
    currentWebSearchReferences,
    currentRagSources,
    currentMindMaps,
    startNewTurn,
    handleEvent,
    finishTurn,
    addExecutionStep,
    resetExecutionSteps,
    closePlanDialog,
    openTracePanel,
    closeTracePanel,
    getCurrentMessageTraceEvents,
    fetchConversations,
    hydrateCachedConversations,
    syncConversations,
    deleteConversation,
    upsertConversation,
    touchConversation,
    reset,
  }
})
