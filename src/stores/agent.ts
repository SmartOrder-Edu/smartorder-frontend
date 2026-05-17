import { defineStore } from 'pinia'
import { ref } from 'vue'
import { agentApi, type ConversationVO } from '@/api/agent'

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

/**
 * Agent 对话状态管理
 */
export const useAgentStore = defineStore('agent', () => {
  // 当前对话 ID
  const currentConversationId = ref<string>('')

  // 当前追踪 ID
  const currentTraceId = ref<string>('')

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

  // === 追踪面板状态 ===
  const tracePanelVisible = ref(false)
  const activeTraceId = ref<string>('')

  // === 对话历史列表 ===
  const conversations = ref<ConversationVO[]>([])
  const conversationsLoading = ref(false)

  /**
   * 开始新的对话轮次
   */
  function startNewTurn() {
    answerText.value = ''
    thinkingText.value = ''
    thinkingStartTime.value = null
    thinkingDurationMs.value = null
    toolCalls.value = []
    routeResult.value = null
    traceEvents.value = []
    loading.value = true
    planDialogVisible.value = false
    currentDraftId.value = ''
    currentPlan.value = null
    tracePanelVisible.value = false
  }

  /**
   * 处理 SSE 事件
   */
  function handleEvent(eventName: string, data: AgentTraceEvent) {
    traceEvents.value.push(data)
    // 按 seq 排序
    traceEvents.value.sort((a, b) => a.seq - b.seq)

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
      case 'agent.text.delta':
        if (data.payload?.text) {
          answerText.value += data.payload.text
        }
        break

      case 'agent.think.delta':
        if (data.payload?.text) {
          if (!thinkingStartTime.value) {
            thinkingStartTime.value = Date.now()
          }
          thinkingText.value += data.payload.text
        }
        break

      case 'agent.tool.started':
        toolCalls.value.push({
          toolName: data.payload?.toolName || '未知工具',
          status: 'running',
          arguments: data.payload?.arguments,
          startedAt: Date.now(),
        })
        break

      case 'agent.tool.completed': {
        const tc = toolCalls.value.find(
          t => t.toolName === data.payload?.toolName && t.status === 'running'
        )
        if (tc) {
          tc.status = 'completed'
          tc.result = data.payload?.result
          tc.durationMs = data.payload?.durationMs
        }
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
        break
      }

      case 'agent.route.completed':
        routeResult.value = data.payload
        break

      case 'agent.plan.created':
        currentDraftId.value = data.payload?.draftId || ''
        currentPlan.value = data.payload?.plan || null
        planDialogVisible.value = true
        break

      case 'agent.error':
        if (data.payload?.message) {
          answerText.value += `\n\n[错误] ${data.payload.message}`
        }
        break
    }
  }

  /**
   * 完成当前轮次
   */
  function finishTurn() {
    loading.value = false
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
   * 获取对话列表
   */
  async function fetchConversations() {
    conversationsLoading.value = true
    try {
      const data = await agentApi.getConversations()
      conversations.value = data || []
    } catch (e) {
      console.error('[AgentStore] 获取对话列表失败:', e)
    } finally {
      conversationsLoading.value = false
    }
  }

  function reset() {
    currentConversationId.value = ''
    currentTraceId.value = ''
    currentMode.value = ''
    answerText.value = ''
    thinkingText.value = ''
    thinkingStartTime.value = null
    thinkingDurationMs.value = null
    toolCalls.value = []
    routeResult.value = null
    traceEvents.value = []
    loading.value = false
    planDialogVisible.value = false
    currentDraftId.value = ''
    currentPlan.value = null
    tracePanelVisible.value = false
  }

  return {
    currentConversationId,
    currentTraceId,
    currentMode,
    answerText,
    thinkingText,
    thinkingStartTime,
    thinkingDurationMs,
    toolCalls,
    routeResult,
    traceEvents,
    loading,
    planDialogVisible,
    currentDraftId,
    currentPlan,
    planConfirmLoading,
    tracePanelVisible,
    activeTraceId,
    conversations,
    conversationsLoading,
    startNewTurn,
    handleEvent,
    finishTurn,
    openTracePanel,
    closeTracePanel,
    getCurrentMessageTraceEvents,
    fetchConversations,
    reset,
  }
})
