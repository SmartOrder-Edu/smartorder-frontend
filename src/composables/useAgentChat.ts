import { ref, watch } from 'vue'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useAgentStore, type AgentTraceEvent, type ToolCallState, type ReasoningSegment } from '@/stores/agent'
import { agentApi, type ExecutionStep, type PlanSummary } from '@/api/agent'
import { refreshAccessToken } from '@/api/request'
import type { TaskList, TaskExecutionState, PlanPauseInfo, PauseReason, ClarificationInfo } from '@/types/planExecute'

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

export interface ChatMessage {
  role: 'user' | 'ai'
  content: string
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
}

function computeTotalWeeks(plan: any): number {
  if (!plan?.phases) return 0
  return plan.phases.reduce((sum: number, p: any) => sum + (p.weeks || 0), 0)
}

function computeTotalKPs(plan: any): number {
  if (!plan?.phases) return 0
  return plan.phases.reduce((sum: number, p: any) => sum + (p.knowledgePoints?.length || 0), 0)
}

/**
 * 从 traceEvents 中重建每个 task 的 reasoningSegments
 */
function rebuildTaskReasoningFromTrace(
  execMap: Map<string, TaskExecutionState>,
  traceEvents: AgentTraceEvent[],
) {
  type Range = { startIdx: number; endIdx: number }
  const taskRanges = new Map<string, Range>()
  let activeTaskId: string | null = null
  let activeStart = -1

  for (let i = 0; i < traceEvents.length; i++) {
    const et = traceEvents[i].eventType || ''
    if (et === 'agent.plan.task.started') {
      activeTaskId = traceEvents[i].payload?.taskId || ''
      activeStart = i
    } else if (
      (et === 'agent.plan.task.completed' || et === 'agent.plan.task.failed') &&
      activeTaskId
    ) {
      taskRanges.set(activeTaskId, { startIdx: activeStart, endIdx: i })
      activeTaskId = null
    }
  }
  // 最后一个 task 未正常结束，延伸到尾部
  if (activeTaskId) {
    taskRanges.set(activeTaskId, { startIdx: activeStart, endIdx: traceEvents.length - 1 })
  }

  for (const [taskId, { startIdx, endIdx }] of taskRanges) {
    const execState = execMap.get(taskId)
    if (!execState) continue

    const segments: ReasoningSegment[] = []
    let currentThinkText = ''

    for (let i = startIdx; i <= endIdx; i++) {
      const evt = traceEvents[i]
      const et = evt.eventType || ''

      if (et === 'agent.think.delta' && evt.payload?.text) {
        currentThinkText += evt.payload.text
      } else if (et === 'agent.tool.started') {
        segments.push({
          thinkingText: currentThinkText,
          toolCall: {
            toolName: evt.payload?.toolName || '未知工具',
            status: 'running',
            arguments: evt.payload?.arguments,
            startedAt: evt.timestamp,
          },
        })
        currentThinkText = ''
      } else if (et === 'agent.tool.completed' || et === 'agent.tool.failed') {
        for (let s = segments.length - 1; s >= 0; s--) {
          const tc = segments[s].toolCall
          if (tc && tc.toolName === (evt.payload?.toolName || '') && tc.status === 'running') {
            tc.status = et === 'agent.tool.completed' ? 'completed' : 'failed'
            if (et === 'agent.tool.completed') tc.result = evt.payload?.result
            tc.durationMs = evt.payload?.durationMs
            break
          }
        }
      }
    }

    if (currentThinkText) {
      segments.push({ thinkingText: currentThinkText })
    }

    execState.reasoningSegments = segments
  }
}

export function useAgentChat(scrollCallback?: () => void) {
  const agentStore = useAgentStore()
  const messages = ref<ChatMessage[]>([])
  const loadingHistory = ref(false)
  let abortController: AbortController | null = null

  /** 用户手动选择的运行模式，null 表示走意图路由 */
  const currentForceMode = ref<'REACT' | 'PLAN_AND_EXECUTE' | null>('REACT')

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
   */
  const stopGeneration = () => {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    // 将当前已累积的文本保存为消息
    if (agentStore.answerText || agentStore.currentTaskList) {
      messages.value.push({
        role: 'ai',
        content: agentStore.answerText + '\n\n*[已停止生成]*',
        traceId: agentStore.currentTraceId,
        traceEvents: [...agentStore.traceEvents],
        thinkingText: agentStore.thinkingText || undefined,
        thinkingDurationMs: agentStore.thinkingDurationMs,
        toolCalls: agentStore.toolCalls.length ? [...agentStore.toolCalls] : undefined,
        reasoningSegments: agentStore.reasoningSegments?.length
          ? [...agentStore.reasoningSegments] : undefined,
        routeResult: agentStore.routeResult || undefined,
        timestamp: Date.now(),
        // Plan-and-Execute: 附加计划状态到消息
        taskList: agentStore.currentTaskList || undefined,
        taskExecutionMap: agentStore.taskExecutionMap.size
          ? new Map(agentStore.taskExecutionMap) : undefined,
        pauseInfo: agentStore.planPauseInfo,
        planExecuting: agentStore.planExecuting,
        webSearchReferences: agentStore.currentWebSearchReferences.length
          ? [...agentStore.currentWebSearchReferences] : undefined,
      })
    }
    agentStore.finishTurn()
    agentStore.planExecuting = false
    scrollCallback?.()
  }

  /**
   * 发送消息给 Agent（使用 fetch-event-source POST SSE）
   */
  const sendMessage = async (message: string, references?: RagReference[]) => {
    if (!message.trim() || agentStore.loading) return

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

    // 添加用户消息到本地列表
    messages.value.push({
      role: 'user',
      content: message,
      timestamp: Date.now(),
      attachmentFileIds: attachmentFileIds && attachmentFileIds.length > 0 ? attachmentFileIds : undefined,
      references: references && references.length > 0 ? [...references] : undefined,
    })

    agentStore.startNewTurn({ preservePlanState: isClarificationReply })

    const base = import.meta.env.VITE_API_BASE_URL || '/api'

    // SSE 请求前主动刷新 accessToken，确保长连接期间 token 不会过期
    let token: string
    try {
      token = await refreshAccessToken()
    } catch {
      return // refresh 内部已处理跳转登录页
    }

    // 创建新的 AbortController
    abortController = new AbortController()

    try {
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

      await fetchEventSource(`${base}/agent/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          conversationId: agentStore.currentConversationId || undefined,
          fileIds: fileIds && fileIds.length > 0 ? fileIds : undefined,
          knowledgeBaseIds: knowledgeBaseIds && knowledgeBaseIds.length > 0 ? knowledgeBaseIds : undefined,
          forceMode: isClarificationReply ? undefined : (currentForceMode.value || undefined),
          clarificationAnswerJson,
        }),
        openWhenHidden: true,
        signal: abortController.signal,

        onmessage(event) {
          if (!event.data) return

          if (event.event === 'done') {
            // 提前解析 done payload — 需要在消息保存前获取 clarificationPayload
            let donePayload: any = null
            try { donePayload = JSON.parse(event.data) } catch { /* ignore */ }

            // 将 AI 回复添加到消息列表（ReAct / Plan-and-Execute）
            const hasReActClarification = !!donePayload?.clarificationPayload
              && !agentStore.currentTaskList
            if (agentStore.answerText || agentStore.currentTaskList || hasReActClarification) {
              messages.value.push({
                role: 'ai',
                content: agentStore.answerText || (hasReActClarification
                  ? (donePayload.clarificationPayload.question || '请提供更多信息')
                  : ''),
                traceId: agentStore.currentTraceId,
                traceEvents: [...agentStore.traceEvents],
                thinkingText: agentStore.thinkingText || undefined,
                thinkingDurationMs: agentStore.thinkingDurationMs,
                toolCalls: agentStore.toolCalls.length ? [...agentStore.toolCalls] : undefined,
                reasoningSegments: agentStore.reasoningSegments?.length
                  ? [...agentStore.reasoningSegments] : undefined,
                routeResult: agentStore.routeResult || undefined,
                timestamp: Date.now(),
                // Plan-and-Execute: 附加计划状态到消息
                taskList: agentStore.currentTaskList || undefined,
                taskExecutionMap: agentStore.taskExecutionMap.size
                  ? new Map(agentStore.taskExecutionMap) : undefined,
                pauseInfo: agentStore.planPauseInfo,
                planExecuting: agentStore.planExecuting,
                webSearchReferences: agentStore.currentWebSearchReferences.length
                  ? [...agentStore.currentWebSearchReferences] : undefined,
              })
            }
            agentStore.finishTurn()
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
            abortController = null
            scrollCallback?.()
            return
          }

          try {
            const data = JSON.parse(event.data) as AgentTraceEvent
            agentStore.handleEvent(event.event, data)

            // plan.created 时根据 taskList.status 推导 planExecuting
            // （后端 EXECUTING 状态时不应强制改为 false）
            if (event.event === 'agent.plan.created') {
              const tl = data.payload?.taskList
              if (tl) {
                agentStore.planExecuting = tl.status === 'EXECUTING'
              }
            }
          } catch {
            // 非 JSON 忽略
          }
        },

        onerror(err) {
          console.error('[useAgentChat] SSE error:', err)
          // 保存已累积的内容，避免渲染突然消失（与 stopGeneration 一致）
          if (agentStore.answerText || agentStore.currentTaskList) {
            messages.value.push({
              role: 'ai',
              content: agentStore.answerText + '\n\n*[连接中断]*',
              traceId: agentStore.currentTraceId,
              traceEvents: [...agentStore.traceEvents],
              thinkingText: agentStore.thinkingText || undefined,
              thinkingDurationMs: agentStore.thinkingDurationMs,
              toolCalls: agentStore.toolCalls.length ? [...agentStore.toolCalls] : undefined,
              reasoningSegments: agentStore.reasoningSegments?.length
                ? [...agentStore.reasoningSegments] : undefined,
              routeResult: agentStore.routeResult || undefined,
              timestamp: Date.now(),
              taskList: agentStore.currentTaskList || undefined,
              taskExecutionMap: agentStore.taskExecutionMap.size
                ? new Map(agentStore.taskExecutionMap) : undefined,
              pauseInfo: agentStore.planPauseInfo,
              planExecuting: agentStore.planExecuting,
              webSearchReferences: agentStore.currentWebSearchReferences.length
                ? [...agentStore.currentWebSearchReferences] : undefined,
            })
          }
          agentStore.finishTurn()
          // 错误时暂停态也应保持，但连接中断时安全起见重置
          agentStore.planExecuting = false
          abortController = null
          scrollCallback?.()
          throw err
        },
      })
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[useAgentChat] fetch error:', err)
        agentStore.finishTurn()
        agentStore.planExecuting = false
      }
      abortController = null
    }
  }

  /**
   * 确认学习规划
   */
  const confirmPlan = async (draftId: string) => {
    if (!draftId || confirmPlanLocked.value) return
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
              spaceId: payload?.spaceId || 0,
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
                role: 'ai',
                content: agentStore.answerText,
                traceId: agentStore.currentTraceId,
                traceEvents: [...agentStore.traceEvents],
                reasoningSegments: agentStore.reasoningSegments?.length
                  ? [...agentStore.reasoningSegments] : undefined,
                timestamp: Date.now(),
                planSummary,
                executionSteps: [...agentStore.executionSteps],
                taskList: agentStore.currentTaskList || undefined,
                taskExecutionMap: agentStore.taskExecutionMap.size
                  ? new Map(agentStore.taskExecutionMap) : undefined,
                pauseInfo: agentStore.planPauseInfo,
                planExecuting: agentStore.planExecuting,
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
      role: 'user',
      content: displayAnswer,
      timestamp: Date.now(),
    })

    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    let token: string
    try { token = await refreshAccessToken() } catch { agentStore.finishTurn(); return false }
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
              // 处理与 sendMessage done 类似
              if (agentStore.answerText || agentStore.currentTaskList) {
                messages.value.push({
                  role: 'ai',
                  content: agentStore.answerText,
                  traceId: agentStore.currentTraceId,
                  traceEvents: [...agentStore.traceEvents],
                  reasoningSegments: agentStore.reasoningSegments?.length
                    ? [...agentStore.reasoningSegments] : undefined,
                  timestamp: Date.now(),
                  taskList: agentStore.currentTaskList || undefined,
                  taskExecutionMap: agentStore.taskExecutionMap.size
                    ? new Map(agentStore.taskExecutionMap) : undefined,
                  pauseInfo: agentStore.planPauseInfo,
                  planExecuting: agentStore.planExecuting,
                })
                agentStore.answerText = ''
              }
              agentStore.finishTurn()
              const pausedStatuses = ['PAUSED_CLARIFICATION', 'PAUSED_CONFIRMATION']
              const terminalStatuses = ['COMPLETED', 'FAILED', 'PARTIAL_COMPLETED']
              let donePayload: any = null
              try { donePayload = JSON.parse(event.data) } catch { /* ignore */ }
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
            } catch { /* ignore */ }
          },
          onerror(err) {
            console.error('[answerClarification] SSE error:', err)
            if (agentStore.answerText || agentStore.currentTaskList) {
              messages.value.push({
                role: 'ai',
                content: agentStore.answerText + '\n\n*[连接中断]*',
                traceId: agentStore.currentTraceId,
                traceEvents: [...agentStore.traceEvents],
                timestamp: Date.now(),
                taskList: agentStore.currentTaskList || undefined,
                taskExecutionMap: agentStore.taskExecutionMap.size
                  ? new Map(agentStore.taskExecutionMap) : undefined,
                pauseInfo: agentStore.planPauseInfo,
                planExecuting: false,
              })
            }
            agentStore.finishTurn()
            agentStore.planExecuting = false
            abortController = null
            throw err
          },
        },
      )
      return true
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[answerClarification] fetch error:', err)
        agentStore.finishTurn()
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
    agentStore.startNewTurn({ preservePlanState: true })
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    let token: string
    try { token = await refreshAccessToken() } catch { agentStore.finishTurn(); return }
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
              if (agentStore.answerText || agentStore.currentTaskList) {
                messages.value.push({
                  role: 'ai',
                  content: agentStore.answerText,
                  traceId: agentStore.currentTraceId,
                  traceEvents: [...agentStore.traceEvents],
                  reasoningSegments: agentStore.reasoningSegments?.length
                    ? [...agentStore.reasoningSegments] : undefined,
                  timestamp: Date.now(),
                  taskList: agentStore.currentTaskList || undefined,
                  taskExecutionMap: agentStore.taskExecutionMap.size
                    ? new Map(agentStore.taskExecutionMap) : undefined,
                  pauseInfo: agentStore.planPauseInfo,
                  planExecuting: agentStore.planExecuting,
                })
                agentStore.answerText = ''
              }
              agentStore.finishTurn()
              const pausedStatuses = ['PAUSED_CLARIFICATION', 'PAUSED_CONFIRMATION']
              const terminalStatuses = ['COMPLETED', 'FAILED', 'PARTIAL_COMPLETED']
              let donePayload: any = null
              try { donePayload = JSON.parse(event.data) } catch { /* ignore */ }
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
            } catch { /* ignore */ }
          },
          onerror(err) {
            console.error('[confirmGate] SSE error:', err)
            agentStore.finishTurn()
            agentStore.planExecuting = false
            abortController = null
            throw err
          },
        },
      )
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[confirmGate] fetch error:', err)
        agentStore.finishTurn()
        agentStore.planExecuting = false
      }
      abortController = null
    }
  }

  /**
   * 加载指定对话的历史消息
   */
  const loadConversation = async (conversationId: string) => {
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
          role: (msg.role === 'user' ? 'user' : 'ai') as 'user' | 'ai',
          content: msg.content || '',
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

      // 第二遍：并行拉取所有 trace 事件
      if (traceJobs.length > 0) {
        const traceResults = await Promise.all(
          traceJobs.map(j =>
            agentApi.getTraceEvents(j.traceId).catch(e => {
              console.warn('[useAgentChat] 获取 trace 事件失败:', j.traceId, e)
              return null
            }),
          ),
        )

        for (let j = 0; j < traceJobs.length; j++) {
          const chatMsg = msgs[traceJobs[j].msgIndex]
          const events = traceResults[j]
          if (!events || !Array.isArray(events)) continue

          const toolCalls: ToolCallState[] = []
          const traceEvents: AgentTraceEvent[] = []
          // 用 seq 做 key 避免同名工具调用互相覆盖
          const pendingTools: Map<number, { toolName: string; arguments?: any; startedAt: number }> = new Map()

          for (const raw of events) {
            let payload = raw.payload
            if (typeof payload === 'string') {
              try { payload = JSON.parse(payload) } catch { /* keep as string */ }
            }

            const evt: AgentTraceEvent = {
              traceId: raw.traceId || '',
              conversationId: raw.conversationId || '',
              userId: raw.userId || 0,
              mode: raw.agentMode || raw.mode || '',
              eventType: raw.eventType || '',
              seq: raw.sequenceNum || raw.seq || 0,
              timestamp: raw.createTime ? new Date(raw.createTime).getTime() : (raw.timestamp || Date.now()),
              payload,
            }

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
              // ===== Plan-and-Execute 事件：恢复计划 / 任务状态 =====
              case 'agent.plan.created': {
                const tl = evt.payload?.taskList as TaskList | undefined
                if (tl && tl.tasks) {
                  chatMsg.taskList = tl
                  const execMap = new Map<string, TaskExecutionState>()
                  for (const task of tl.tasks) {
                    execMap.set(task.taskId, {
                      taskItem: task,
                      status: (task.status?.toLowerCase() as TaskExecutionState['status']) || 'pending',
                      retryCount: task.retryCount || 0,
                      reasoningSegments: [],
                      thinkText: '',
                    })
                  }
                  chatMsg.taskExecutionMap = execMap
                  chatMsg.planExecuting = tl.status === 'EXECUTING'
                }
                break
              }
              case 'agent.plan.task.started': {
                const taskId = evt.payload?.taskId || ''
                if (chatMsg.taskExecutionMap) {
                  const es = chatMsg.taskExecutionMap.get(taskId)
                  if (es) { es.status = 'running'; es.startedAt = evt.timestamp }
                }
                if (chatMsg.taskList) {
                  const t = chatMsg.taskList.tasks.find(tk => tk.taskId === taskId)
                  if (t) t.status = 'RUNNING'
                }
                chatMsg.planExecuting = true
                break
              }
              case 'agent.plan.task.completed': {
                const taskId = evt.payload?.taskId || ''
                if (chatMsg.taskExecutionMap) {
                  const es = chatMsg.taskExecutionMap.get(taskId)
                  if (es) {
                    es.status = 'completed'
                    es.resultSummary = evt.payload?.resultSummary || ''
                    es.completedAt = evt.timestamp
                  }
                }
                if (chatMsg.taskList) {
                  const t = chatMsg.taskList.tasks.find(tk => tk.taskId === taskId)
                  if (t) { t.status = 'COMPLETED'; t.resultSummary = evt.payload?.resultSummary || '' }
                }
                break
              }
              case 'agent.plan.task.failed': {
                const taskId = evt.payload?.taskId || ''
                if (chatMsg.taskExecutionMap) {
                  const es = chatMsg.taskExecutionMap.get(taskId)
                  if (es) {
                    es.status = 'failed'
                    es.errorMessage = evt.payload?.errorMessage || ''
                  }
                }
                if (chatMsg.taskList) {
                  const t = chatMsg.taskList.tasks.find(tk => tk.taskId === taskId)
                  if (t) { t.status = 'FAILED'; t.errorMessage = evt.payload?.errorMessage || '' }
                }
                break
              }
              case 'agent.plan.paused': {
                chatMsg.pauseInfo = {
                  reason: evt.payload?.reason || 'CLARIFICATION',
                  taskId: evt.payload?.taskId || '',
                  question: evt.payload?.question || '',
                  clarification: evt.payload?.clarification as ClarificationInfo | undefined,
                }
                if (chatMsg.taskExecutionMap) {
                  const es = chatMsg.taskExecutionMap.get(evt.payload?.taskId || '')
                  if (es) es.status = 'paused'
                }
                if (chatMsg.taskList) {
                  const reason = evt.payload?.reason
                  if (reason === 'CLARIFICATION') {
                    chatMsg.taskList.status = 'PAUSED_CLARIFICATION'
                  } else if (reason === 'CONFIRMATION') {
                    chatMsg.taskList.status = 'PAUSED_CONFIRMATION'
                  }
                }
                break
              }
              case 'agent.plan.resumed': {
                chatMsg.pauseInfo = null
                if (chatMsg.taskList) {
                  chatMsg.taskList.status = 'EXECUTING'
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
          }
          if (traceEvents.length > 0) {
            chatMsg.traceEvents = traceEvents
          }

          // 重建每个 task 的推理过程（从 trace events 中提取 think/tool 事件）
          if (chatMsg.taskExecutionMap && chatMsg.taskExecutionMap.size > 0) {
            rebuildTaskReasoningFromTrace(chatMsg.taskExecutionMap, traceEvents)
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

      // 后处理：为有 pauseInfo（CLARIFICATION）的历史消息匹配用户回答（只读回放用）
      for (let i = 0; i < msgs.length; i++) {
        const msg = msgs[i]
        if (msg.role === 'ai' && msg.pauseInfo?.clarification) {
          // 查找下一条用户消息作为回答
          let answeredValue = ''
          for (let k = i + 1; k < msgs.length; k++) {
            if (msgs[k].role === 'user') {
              answeredValue = msgs[k].content
              break
            }
            // 如果遇到下一条 AI 消息（含 pauseInfo 或 taskList），说明用户已在下一个澄清阶段回答
            if (msgs[k].role === 'ai' && (msgs[k].pauseInfo || msgs[k].taskList)) {
              break
            }
          }
          msg.clarificationAnsweredValue = answeredValue
        }
      }

      messages.value = msgs
      agentStore.currentConversationId = conversationId

      // === 水合活跃计划状态 ===
      // 查询后端是否有未完成的计划运行态，恢复 agentStore 中的关键状态
      try {
        const activeRunRes = await agentApi.getActiveRun(conversationId)
        const activeRun = activeRunRes?.data ?? activeRunRes // 兼容 Result 包装
        if (activeRun) {
          // 活跃计划 → 恢复 agentStore 状态
          if (activeRun.taskList) {
            const s = activeRun.status
            const activeStatuses = ['EXECUTING', 'PAUSED_CLARIFICATION', 'PAUSED_CONFIRMATION', 'DRAFT', 'PENDING_CONFIRM', 'WAITING_CONFIRMATION']
            if (activeStatuses.includes(s)) {
              agentStore.currentDraftId = activeRun.draftId || ''
              agentStore.currentTaskList = activeRun.taskList
              agentStore.planPauseInfo = activeRun.pauseInfo || null
              agentStore.planExecuting = s === 'EXECUTING'
              agentStore.planNeedsConfirmation = ['DRAFT', 'PENDING_CONFIRM', 'WAITING_CONFIRMATION', 'PAUSED_CONFIRMATION'].includes(s)
              // 重建 taskExecutionMap
              if (activeRun.taskList.tasks) {
                const map = new Map<string, any>()
                for (const task of activeRun.taskList.tasks) {
                  map.set(task.taskId, { status: task.status?.toLowerCase() || 'pending' })
                }
                agentStore.taskExecutionMap = map
              }
            }
          }
          // 已完成的计划但有 spaceCreated → 恢复到最后一条含 taskList 的消息（恢复"学习空间已创建"banner）
          if (activeRun.spaceCreated && (activeRun.spaceCreated as any).spaceId) {
            const spaceInfo = activeRun.spaceCreated as { spaceId: number; spaceName: string }
            for (let i = msgs.length - 1; i >= 0; i--) {
              if (msgs[i].role === 'ai' && msgs[i].taskList) {
                msgs[i].taskList = {
                  ...msgs[i].taskList,
                  spaceCreated: spaceInfo,
                }
                break
              }
            }
          }
        }
      } catch (e) {
        console.warn('[useAgentChat] 查询活跃计划状态失败（非关键）:', e)
      }

      scrollCallback?.()
    } catch (e) {
      console.error('[useAgentChat] 加载对话消息失败:', e)
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
    messages.value = []
    agentStore.reset()
  }

  const clearMessages = () => {
    messages.value = []
    agentStore.reset()
  }

  /**
   * 删除对话并清理本地状态
   */
  const deleteConversation = async (conversationId: string) => {
    const wasActive = agentStore.currentConversationId === conversationId
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
