import { ref, watch } from 'vue'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useAgentStore, type AgentTraceEvent, type ToolCallState, type ReasoningSegment } from '@/stores/agent'
import { agentApi, type ExecutionStep, type PlanSummary } from '@/api/agent'
import { refreshAccessToken } from '@/api/request'

export type AgentRunMode = 'REACT' | 'PLAN_EXECUTE' | 'MULTI_AGENT'

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
}

function computeTotalWeeks(plan: any): number {
  if (!plan?.phases) return 0
  return plan.phases.reduce((sum: number, p: any) => sum + (p.weeks || 0), 0)
}

function computeTotalKPs(plan: any): number {
  if (!plan?.phases) return 0
  return plan.phases.reduce((sum: number, p: any) => sum + (p.knowledgePoints?.length || 0), 0)
}

export function useAgentChat(scrollCallback?: () => void) {
  const agentStore = useAgentStore()
  const messages = ref<ChatMessage[]>([])
  const loadingHistory = ref(false)
  let abortController: AbortController | null = null

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
    if (agentStore.answerText) {
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
      })
    }
    agentStore.finishTurn()
    scrollCallback?.()
  }

  /**
   * 发送消息给 Agent（使用 fetch-event-source POST SSE）
   */
  const sendMessage = async (message: string) => {
    if (!message.trim() || agentStore.loading) return

    // 添加用户消息到本地列表
    messages.value.push({
      role: 'user',
      content: message,
      timestamp: Date.now(),
    })

    agentStore.startNewTurn()

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
      await fetchEventSource(`${base}/agent/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          conversationId: agentStore.currentConversationId || undefined,
        }),
        openWhenHidden: true,
        signal: abortController.signal,

        onmessage(event) {
          if (!event.data) return

          if (event.event === 'done') {
            // 将 AI 回复添加到消息列表
            if (agentStore.answerText) {
              messages.value.push({
                role: 'ai',
                content: agentStore.answerText,
                traceId: agentStore.currentTraceId,
                traceEvents: [...agentStore.traceEvents],
                thinkingText: agentStore.thinkingText || undefined,
                thinkingDurationMs: agentStore.thinkingDurationMs,
                toolCalls: agentStore.toolCalls.length ? [...agentStore.toolCalls] : undefined,
                reasoningSegments: agentStore.reasoningSegments?.length
                  ? [...agentStore.reasoningSegments] : undefined,
                routeResult: agentStore.routeResult || undefined,
                timestamp: Date.now(),
              })
            }
            agentStore.finishTurn()
            abortController = null
            scrollCallback?.()
            return
          }

          try {
            const data = JSON.parse(event.data) as AgentTraceEvent
            agentStore.handleEvent(event.event, data)

            // plan.created 时立即推送 AI 消息占位
            if (event.event === 'agent.plan.created') {
              if (agentStore.answerText) {
                messages.value.push({
                  role: 'ai',
                  content: agentStore.answerText,
                  traceId: agentStore.currentTraceId,
                  traceEvents: [...agentStore.traceEvents],
                  reasoningSegments: agentStore.reasoningSegments?.length
                    ? [...agentStore.reasoningSegments] : undefined,
                  timestamp: Date.now(),
                })
                agentStore.answerText = ''
              }
            }
          } catch {
            // 非 JSON 忽略
          }
        },

        onerror(err) {
          console.error('[useAgentChat] SSE error:', err)
          agentStore.finishTurn()
          abortController = null
          scrollCallback?.()
          throw err
        },
      })
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[useAgentChat] fetch error:', err)
        agentStore.finishTurn()
      }
      abortController = null
    }
  }

  /**
   * 确认学习规划
   */
  const confirmPlan = async (draftId: string) => {
    agentStore.planConfirmLoading = true
    agentStore.resetExecutionSteps()
    const base = import.meta.env.VITE_API_BASE_URL || '/api'

    // SSE 请求前主动刷新 accessToken
    let token: string
    try {
      token = await refreshAccessToken()
    } catch {
      agentStore.planConfirmLoading = false
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
              })
              agentStore.answerText = ''
            }
            agentStore.finishTurn()
            abortController = null
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
          abortController = null
          throw err
        },
      })
    } catch (err: any) {
      console.error('[confirmPlan] error:', err)
      agentStore.planConfirmLoading = false
      abortController = null
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
   * 加载指定对话的历史消息
   */
  const loadConversation = async (conversationId: string) => {
    loadingHistory.value = true
    try {
      const result = await agentApi.getConversationMessages(conversationId, 1, 200)
      const msgs = result.list.map((msg) => ({
        role: (msg.role === 'user' ? 'user' : 'ai') as 'user' | 'ai',
        content: msg.content || '',
        traceId: msg.traceId || undefined,
        timestamp: new Date(msg.createTime).getTime(),
      }))
      messages.value = msgs
      agentStore.currentConversationId = conversationId
      scrollCallback?.()
    } catch (e) {
      console.error('[useAgentChat] 加载对话消息失败:', e)
    } finally {
      loadingHistory.value = false
    }
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

  return {
    messages,
    loadingHistory,
    sendMessage,
    stopGeneration,
    confirmPlan,
    cancelPlan,
    loadConversation,
    startNewConversation,
    clearMessages,
  }
}
