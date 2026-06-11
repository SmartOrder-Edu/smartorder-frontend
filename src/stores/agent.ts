import { defineStore } from 'pinia'
import { ref } from 'vue'
import { agentApi, type ConversationVO, type ExecutionStep, type PlanSummary } from '@/api/agent'

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
    reasoningSegments.value = []
    routeResult.value = null
    traceEvents.value = []
    loading.value = true
    planDialogVisible.value = false
    currentDraftId.value = ''
    currentPlan.value = null
    tracePanelVisible.value = false
    executionSteps.value = []
    planConfirmResult.value = null
    planDialogClosing.value = false
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
          s => s.toolCall?.toolName === data.payload?.toolName && s.toolCall.status === 'running'
        )
        if (seg?.toolCall) {
          seg.toolCall.status = 'completed'
          seg.toolCall.result = data.payload?.result
          seg.toolCall.durationMs = data.payload?.durationMs
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
        // 同步更新 reasoningSegments
        const segF = reasoningSegments.value.find(
          s => s.toolCall?.toolName === data.payload?.toolName && s.toolCall.status === 'running'
        )
        if (segF?.toolCall) {
          segF.toolCall.status = 'failed'
          segF.toolCall.durationMs = data.payload?.durationMs
        }
        break
      }

      case 'agent.route.completed':
        routeResult.value = data.payload
        break

      case 'agent.plan.created':
        currentDraftId.value = data.payload?.draftId || ''
        currentPlan.value = data.payload?.taskList || data.payload?.plan || null
        planDialogVisible.value = true
        break

      // ====== PlanThenReAct 新增事件 ======

      case 'agent.plan.task.started':
        addExecutionStep({
          stepName: `${data.payload?.taskId || ''} - ${data.payload?.description || ''}`,
          status: 'running',
          startedAt: Date.now(),
        })
        break

      case 'agent.plan.task.completed':
        addExecutionStep({
          stepName: `${data.payload?.taskId || ''} - ${data.payload?.description || ''}`,
          status: 'completed',
          completedAt: Date.now(),
        })
        break

      case 'agent.plan.task.failed':
        addExecutionStep({
          stepName: `${data.payload?.taskId || ''} - ${data.payload?.description || ''}`,
          status: 'failed',
          message: data.payload?.errorMessage,
        })
        break

      case 'agent.plan.paused':
        if (data.payload?.reason === 'CLARIFICATION') {
          // 澄清暂停：将追问文本追加到回答
          const question = data.payload?.question || '请提供更多信息'
          answerText.value += '\n\n' + question
        }
        break

      case 'agent.plan.resumed':
        // 计划恢复，无需特殊处理
        break

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

      // agent.status 在 plan confirm SSE 中可能包含执行步骤信息
      case 'agent.status':
        if (data.payload?.message) {
          addExecutionStep({
            stepName: data.payload.message,
            status: 'running',
            startedAt: Date.now(),
          })
        }
        break

      case 'agent.error':
        if (data.payload?.message) {
          answerText.value += `\n\n[错误] ${data.payload.message}`
        }
        break
    }
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

  /**
   * 删除指定对话
   */
  async function deleteConversation(conversationId: string) {
    await agentApi.deleteConversation(conversationId)
    conversations.value = conversations.value.filter(c => c.conversationId !== conversationId)
    if (currentConversationId.value === conversationId) {
      currentConversationId.value = ''
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
    deleteConversation,
    reset,
  }
})
