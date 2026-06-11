import { ref, watch } from 'vue'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useAgentStore, type AgentTraceEvent, type ToolCallState, type ReasoningSegment } from '@/stores/agent'
import { agentApi, type ExecutionStep, type PlanSummary } from '@/api/agent'
import { refreshAccessToken } from '@/api/request'

export type AgentRunMode = 'REACT' | 'PLAN_EXECUTE' | 'MULTI_AGENT'

export interface RagReference {
  id: string
  name: string
  type: 'kb' | 'file'
  kbId?: string
  kbName?: string
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
  references?: RagReference[]
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
  const sendMessage = async (message: string, references?: RagReference[]) => {
    if (!message.trim() || agentStore.loading) return

    // 添加用户消息到本地列表
    messages.value.push({
      role: 'user',
      content: message,
      timestamp: Date.now(),
      references: references && references.length > 0 ? [...references] : undefined,
    })

    agentStore.startNewTurn()
    scrollCallback?.()

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
        // 提取文件ID（type为'file'的引用）
        const files = references.filter(r => r.type === 'file')
        if (files.length > 0) {
          fileIds = files.map(r => parseInt(r.id))
        }

        // 提取知识库ID（type为'kb'的引用）
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
    sendMessage,
    stopGeneration,
    confirmPlan,
    cancelPlan,
    loadConversation,
    startNewConversation,
    clearMessages,
    deleteConversation,
  }
}
