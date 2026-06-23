import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { taskStepApi } from '@/api/spaceDashboard'
import { ElMessage } from 'element-plus'
import type { TaskStepVO, StepStatus } from '@/types/learningSpace'
import type {
  CanvasContent,
  FeedbackType,
  MasteryJudge,
  ScriptStep,
  StudyChatMessage,
  StudyMode,
} from '@/types/study'
import {
  getInitialChatMessages,
  getMockCanvasContent,
  getMockFeedbackReply,
  getMockMasteryJudge,
  getMockScriptSteps,
} from '@/mocks/studySession'

export const useTaskStepStore = defineStore('taskStep', () => {
  // ---- 原有步骤状态 ----
  const steps = ref<TaskStepVO[]>([])
  const currentStepIndex = ref(0)
  const loading = ref(false)

  const currentStep = computed(() => steps.value[currentStepIndex.value] || null)

  // ---- 学习会话状态（新增）----
  const taskId = ref<string>('')
  const spaceId = ref<string | null>(null)
  const mode = ref<StudyMode>('learn')
  const scriptSteps = ref<ScriptStep[]>([])
  const canvasContent = ref<CanvasContent | null>(null)
  const mastery = ref<MasteryJudge | null>(null)
  const chatMessages = ref<StudyChatMessage[]>([])
  const sendingFeedback = ref(false)
  const completing = ref(false)

  const currentScriptStep = computed<ScriptStep | null>(
    () => scriptSteps.value[currentStepIndex.value] || null,
  )
  const totalEstimatedMinutes = computed(() =>
    scriptSteps.value.reduce((s, st) => s + st.estimatedMinutes, 0),
  )
  const completedSteps = computed(
    () => scriptSteps.value.filter(s => s.status === 'completed').length,
  )
  const progressPercent = computed(() => {
    if (!scriptSteps.value.length) return 0
    return Math.round((completedSteps.value / scriptSteps.value.length) * 100)
  })

  /**
   * 拉取任务步骤 + 初始化学习会话
   * mock 阶段：复用现有 taskStepApi.getSteps（mock），并基于 taskId 生成 6 阶段脚本与画布内容
   * 后端就绪后：替换为 /study-sessions/:taskId 真实接口
   */
  async function fetchSteps(id: string, options: { mode?: StudyMode; spaceId?: string } = {}) {
    loading.value = true
    try {
      taskId.value = id
      mode.value = options.mode || 'learn'
      spaceId.value = options.spaceId || null

      // 原有 task steps（保留以兼容）
      steps.value = await taskStepApi.getSteps(id)

      // 学习会话脚本与画布
      scriptSteps.value = getMockScriptSteps(id)
      // assessment 模式：直接跳到第 4 步（掌握判断）
      const startIndex = mode.value === 'assessment' ? 3 : 0
      const firstIncomplete = scriptSteps.value.findIndex(s => s.status !== 'completed')
      currentStepIndex.value =
        firstIncomplete >= 0 ? Math.max(startIndex, Math.min(firstIncomplete, scriptSteps.value.length - 1)) : 0
      if (scriptSteps.value[currentStepIndex.value]?.status === 'pending') {
        scriptSteps.value[currentStepIndex.value].status = 'in_progress'
      }
      canvasContent.value = getMockCanvasContent(scriptSteps.value[currentStepIndex.value], mode.value)
      mastery.value = getMockMasteryJudge(mode.value)
      chatMessages.value = getInitialChatMessages()
    } finally {
      loading.value = false
    }
  }

  function goToStep(index: number) {
    if (index < 0 || index >= scriptSteps.value.length) return
    const cur = scriptSteps.value[currentStepIndex.value]
    if (cur && cur.status === 'in_progress') cur.status = 'completed'
    currentStepIndex.value = index
    const next = scriptSteps.value[index]
    if (next && next.status === 'pending') next.status = 'in_progress'
    refreshCanvas()
  }

  function nextStep() {
    if (currentStepIndex.value >= scriptSteps.value.length - 1) return
    const cur = scriptSteps.value[currentStepIndex.value]
    if (cur && cur.status === 'in_progress') cur.status = 'completed'
    currentStepIndex.value++
    const next = scriptSteps.value[currentStepIndex.value]
    if (next && next.status === 'pending') next.status = 'in_progress'
    refreshCanvas()
  }

  function prevStep() {
    if (currentStepIndex.value <= 0) return
    currentStepIndex.value--
    refreshCanvas()
  }

  function updateStepStatus(index: number, status: StepStatus) {
    if (index >= 0 && index < scriptSteps.value.length) {
      scriptSteps.value[index].status = status
    }
  }

  function skipStep(index: number) {
    updateStepStatus(index, 'skipped')
    if (index === currentStepIndex.value) nextStep()
  }

  function refreshCanvas() {
    const step = scriptSteps.value[currentStepIndex.value]
    if (step) canvasContent.value = getMockCanvasContent(step, mode.value)
  }

  /** 在当前画布追加 Agent 临时补充讲解（不改步骤） */
  function appendAgentNote(note: string) {
    if (!canvasContent.value) return
    canvasContent.value = { ...canvasContent.value, agentNote: note }
  }

  /**
   * 发送反馈到 Agent 陪伴面板
   * mock 阶段：本地生成回复；后端就绪后：调用 useAgentChat 发起 study-scoped SSE
   */
  async function sendFeedback(type: FeedbackType) {
    const labels: Record<FeedbackType, string> = {
      dont_understand: '我没看懂',
      slower: '讲慢一点',
      another_example: '换个例子',
      draw_diagram: '画图解释',
      similar_question: '出一道类似题',
      already_mastered: '我已经会了',
      add_review: '加入复习',
      skip: '跳过这个知识点',
    }
    sendingFeedback.value = true
    try {
      chatMessages.value.push({
        id: `u-${Date.now()}`,
        role: 'user',
        text: labels[type],
        markdown: false,
        createTime: Date.now(),
      })
      // 模拟网络延迟
      await new Promise(r => setTimeout(r, 400))
      const reply = getMockFeedbackReply(type)
      chatMessages.value.push({
        id: `a-${Date.now()}`,
        role: 'agent',
        text: reply,
        markdown: true,
        createTime: Date.now(),
      })
      // 部分反馈影响画布与脚本
      if (type === 'already_mastered') {
        appendAgentNote('Agent：已标记本步为掌握，可直接进入下一步。')
      } else if (type === 'skip') {
        const cur = scriptSteps.value[currentStepIndex.value]
        if (cur) cur.status = 'skipped'
      }
    } finally {
      sendingFeedback.value = false
    }
  }

  /** 用户在右侧自由输入消息 */
  async function sendCustomMessage(text: string) {
    if (!text.trim()) return
    sendingFeedback.value = true
    try {
      chatMessages.value.push({
        id: `u-${Date.now()}`,
        role: 'user',
        text: text.trim(),
        markdown: false,
        createTime: Date.now(),
      })
      await new Promise(r => setTimeout(r, 400))
      chatMessages.value.push({
        id: `a-${Date.now()}`,
        role: 'agent',
        text: `收到你的问题：「${text.trim()}」\n\nAgent 正在结合本次学习上下文分析。这是一个 mock 回复，后端 study-scoped SSE 接入后会给出真实讲解。`,
        markdown: true,
        createTime: Date.now(),
      })
    } finally {
      sendingFeedback.value = false
    }
  }

  /** 提交答题（practice / assessment 步骤） */
  function submitPracticeAnswer(answer: string): { correct: boolean; explanation: string } {
    const q = canvasContent.value?.question
    if (!q) return { correct: false, explanation: '当前步骤没有题目。' }
    const correct = answer.trim() === q.answer || answer.trim() === q.answer.replace(/\s/g, '')
    if (correct) {
      ElMessage.success('回答正确！Agent 已记录掌握情况。')
      const cur = scriptSteps.value[currentStepIndex.value]
      if (cur && cur.status === 'in_progress') cur.status = 'completed'
    } else {
      ElMessage.warning('答案不对，Agent 给出讲解。')
    }
    return { correct, explanation: correct ? '正确！' : q.errorExplanation }
  }

  /**
   * 完成本次学习会话
   * mock 阶段：标记全部步骤完成 + 提示；后端就绪后：调用 spaceDashboardStore.completeTask
   */
  async function completeStudySession(actualMinutes?: number) {
    completing.value = true
    try {
      scriptSteps.value.forEach(s => {
        if (s.status !== 'skipped') s.status = 'completed'
      })
      const minutes = actualMinutes ?? totalEstimatedMinutes.value
      // 预留：后端就绪后接入
      // await spaceDashboardStore.completeTask(taskId.value, minutes)
      ElMessage.success(`本次学习已保存（${minutes} 分钟），画像已更新。`)
      return true
    } finally {
      completing.value = false
    }
  }

  function reset() {
    steps.value = []
    scriptSteps.value = []
    canvasContent.value = null
    mastery.value = null
    chatMessages.value = []
    currentStepIndex.value = 0
    taskId.value = ''
    spaceId.value = null
    mode.value = 'learn'
  }

  return {
    // 原有
    steps,
    currentStepIndex,
    currentStep,
    loading,
    // 新增
    taskId,
    spaceId,
    mode,
    scriptSteps,
    currentScriptStep,
    canvasContent,
    mastery,
    chatMessages,
    sendingFeedback,
    completing,
    totalEstimatedMinutes,
    completedSteps,
    progressPercent,
    // 方法
    fetchSteps,
    goToStep,
    nextStep,
    prevStep,
    updateStepStatus,
    skipStep,
    sendFeedback,
    sendCustomMessage,
    submitPracticeAnswer,
    completeStudySession,
    reset,
  }
})
