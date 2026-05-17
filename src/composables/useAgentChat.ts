import { ref } from 'vue'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useAgentStore, type AgentTraceEvent } from '@/stores/agent'
import { agentApi } from '@/api/agent'
import { refreshAccessToken } from '@/api/request'

export type AgentRunMode = 'REACT' | 'PLAN_EXECUTE' | 'MULTI_AGENT'

export interface ChatMessage {
  role: 'user' | 'ai'
  content: string
  traceId?: string
  timestamp: number
}

export function useAgentChat(scrollCallback?: () => void) {
  const agentStore = useAgentStore()
  const messages = ref<ChatMessage[]>([])
  const loadingHistory = ref(false)

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

        onmessage(event) {
          if (!event.data) return

          if (event.event === 'done') {
            // 将 AI 回复添加到消息列表
            if (agentStore.answerText) {
              messages.value.push({
                role: 'ai',
                content: agentStore.answerText,
                traceId: agentStore.currentTraceId,
                timestamp: Date.now(),
              })
            }
            agentStore.finishTurn()
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
          scrollCallback?.()
          throw err
        },
      })
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[useAgentChat] fetch error:', err)
        agentStore.finishTurn()
      }
    }
  }

  /**
   * 确认学习规划
   */
  const confirmPlan = async (draftId: string) => {
    agentStore.planConfirmLoading = true
    const base = import.meta.env.VITE_API_BASE_URL || '/api'

    // SSE 请求前主动刷新 accessToken
    let token: string
    try {
      token = await refreshAccessToken()
    } catch {
      agentStore.planConfirmLoading = false
      return
    }

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

        onmessage(event) {
          if (!event.data) return

          if (event.event === 'done') {
            agentStore.planConfirmLoading = false
            agentStore.planDialogVisible = false
            // 添加执行结果消息
            if (agentStore.answerText) {
              messages.value.push({
                role: 'ai',
                content: agentStore.answerText,
                traceId: agentStore.currentTraceId,
                timestamp: Date.now(),
              })
              agentStore.answerText = ''
            }
            agentStore.finishTurn()
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
          throw err
        },
      })
    } catch (err: any) {
      console.error('[confirmPlan] error:', err)
      agentStore.planConfirmLoading = false
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
        traceId: undefined,
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
    confirmPlan,
    cancelPlan,
    loadConversation,
    startNewConversation,
    clearMessages,
  }
}
