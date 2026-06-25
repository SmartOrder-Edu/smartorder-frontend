import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { taskStepApi } from '@/api/spaceDashboard'
import { studySessionApi } from '@/api/studySession'
import { ElMessage } from 'element-plus'
import { useTimelinePlayer } from '@/composables/useTimelinePlayer'
import type { TaskStepVO, StepStatus } from '@/types/learningSpace'
import type {
  CanvasContent,
  FeedbackType,
  LessonCue,
  LessonSceneAction,
  LessonTimeline,
  MasteryJudge,
  QuizState,
  ScriptStep,
  StudyEventRequest,
  StudyEventReceipt,
  StudySessionVO,
  StudyChatMessage,
  StudyMode,
  StudyTeachingAction,
  TeachingFlow,
  TeachingSegment,
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
  const sessionId = ref<string>('')
  const lessonBundleId = ref<string>('')
  const sessionTimelines = ref<Record<string, LessonTimeline>>({})
  const mastery = ref<MasteryJudge | null>(null)
  const chatMessages = ref<StudyChatMessage[]>([])
  const sendingFeedback = ref(false)
  const completing = ref(false)

  // ---- 教学流状态（v2 Agent 主动教学交互）----
  const teachingActive = ref(false)
  const quizState = ref<QuizState | null>(null)
  const activeSceneActions = ref<LessonSceneAction[]>([])
  const sceneActionTimers: ReturnType<typeof setTimeout>[] = []

  const timelinePlayer = useTimelinePlayer({
    applyCue: applyTimelineCue,
    resetScene: resetTimelineScene,
    onEnded: handleTimelineEnded,
  })

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

  /** 当前教学流 */
  const currentTeachingFlow = computed<TeachingFlow | null>(
    () => canvasContent.value?.teachingFlow || null,
  )
  /** 当前时间轴 */
  const currentTimeline = computed<LessonTimeline | null>(
    () => canvasContent.value?.timeline || null,
  )
  /** 当前教学段 */
  const currentSegment = computed<TeachingSegment | null>(() => {
    const flow = currentTeachingFlow.value
    if (!flow?.segments.length) return null
    return flow.segments[flow.currentSegmentIndex] || null
  })
  /** 教学流是否暂停 */
  const isTeachingPaused = computed(
    () => currentTeachingFlow.value?.isPaused || false,
  )

  // =============================================================
  // 教学流控制方法
  // =============================================================

  /** 启动 Agent 教学流 */
  function startTeaching() {
    const timeline = currentTimeline.value
    if (!timeline) return

    timelinePlayer.stop()
    resetTimelineScene()
    teachingActive.value = true
    timelinePlayer.load(timeline)
    void timelinePlayer.play()
  }

  /** 推进到下一段 */
  function advanceSegment() {
    void timelinePlayer.continueFromWait()
  }

  /** 处理时间轴触发的教学段：弹题暂停 / 自动推进 / 手动暂停 */
  function processSegment(index: number, cue: LessonCue) {
    const flow = currentTeachingFlow.value
    if (!flow) return
    const seg = flow.segments[index]
    if (!seg) return

    flow.currentSegmentIndex = index
    flow.isActive = true
    flow.isPaused = false
    teachingActive.value = true
    quizState.value = null

    // 弹题：暂停教学流
    if (seg.type === 'quiz' && seg.quiz) {
      flow.isPaused = true
      quizState.value = {
        quizId: seg.quiz.id,
        userAnswer: '',
        correct: false,
        answered: false,
      }
      timelinePlayer.waitForUser()
      pushSegmentCommentary(seg, cue.id)
      return
    }

    // 聚焦
    if (seg.focusTarget?.scroll && seg.focusTarget.scroll !== 'none') {
      // 聚焦效果由 TeachingSegmentView 的 onMounted 处理
    }

    // 0 表示等待用户确认，>0 的自动推进由 TimelinePlayer 主时钟负责
    if (seg.autoAdvanceMs <= 0) {
      flow.isPaused = true
      timelinePlayer.waitForUser()
    }

    pushSegmentCommentary(seg, cue.id)
  }

  /** 提交弹题答案 */
  function submitQuizAnswer(answer: string): { correct: boolean; explanation: string } {
    const seg = currentSegment.value
    if (!seg?.quiz || !quizState.value) {
      return { correct: false, explanation: '' }
    }
    const quiz = seg.quiz
    const correct = answer === quiz.correctAnswer
    quizState.value = {
      ...quizState.value,
      userAnswer: answer,
      correct,
      answered: true,
      explanation: quiz.explanation || (correct ? '回答正确！' : '答案不太对，再看看。'),
    }
      void reportStudyEvent({
        eventType: 'quiz_answered',
      targetType: 'quiz',
      targetId: quiz.id,
      payload: {
        answer,
        correct,
        answerType: quiz.answerType,
        currentSegmentId: seg.id,
      },
    })
    return { correct, explanation: quizState.value.explanation }
  }

  /** 恢复教学（答题后或手动点继续） */
  function resumeTeaching() {
    const flow = currentTeachingFlow.value
    if (!flow) return
    flow.isPaused = false
    quizState.value = null
    void reportStudyEvent({
      eventType: 'resume_clicked',
      targetType: 'timeline',
      targetId: currentTimeline.value?.id,
      payload: {
        statusBeforeResume: timelinePlayer.status.value,
      },
    })
    if (timelinePlayer.status.value === 'paused') {
      void timelinePlayer.play()
      return
    }
    void timelinePlayer.continueFromWait()
  }

  /** 暂停 Timeline 播放 */
  function pauseTeaching() {
    void reportStudyEvent({
      eventType: 'pause_clicked',
      targetType: 'timeline',
      targetId: currentTimeline.value?.id,
    })
    timelinePlayer.pause()
    const flow = currentTeachingFlow.value
    if (flow) {
      flow.isPaused = true
    }
  }

  /** 重放当前教学时间轴 */
  function replayTeaching() {
    startTeaching()
  }

  /** 结束教学流 */
  function endTeaching() {
    timelinePlayer.stop()
    teachingActive.value = false
    const flow = currentTeachingFlow.value
    if (flow) {
      flow.isActive = false
      flow.isPaused = false
    }
    quizState.value = null
  }

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
      const backendSession = await startBackendStudySession(id, options)
      scriptSteps.value = backendSession?.scriptSteps?.length
        ? backendSession.scriptSteps
        : getMockScriptSteps(id)
      sessionId.value = backendSession?.sessionId || ''
      lessonBundleId.value = backendSession?.lessonBundleId || ''
      sessionTimelines.value = backendSession?.timelinesByStepId || {}

      // assessment 模式：直接跳到第 4 步（掌握判断）
      const startIndex = mode.value === 'assessment' ? 3 : 0
      const backendCurrentIndex = backendSession?.currentStepId
        ? scriptSteps.value.findIndex(s => s.id === backendSession.currentStepId)
        : -1
      const firstIncomplete = scriptSteps.value.findIndex(s => s.status !== 'completed')
      currentStepIndex.value =
        backendCurrentIndex >= 0
          ? backendCurrentIndex
          : firstIncomplete >= 0
            ? Math.max(startIndex, Math.min(firstIncomplete, scriptSteps.value.length - 1))
            : 0
      if (scriptSteps.value[currentStepIndex.value]?.status === 'pending') {
        scriptSteps.value[currentStepIndex.value].status = 'in_progress'
      }
      canvasContent.value = prepareCanvasContent(scriptSteps.value[currentStepIndex.value])
      mastery.value = backendSession?.mastery || getMockMasteryJudge(mode.value)
      chatMessages.value = getInitialChatMessages()
      void reportStudyEvent({
        eventType: 'session_started',
        targetType: 'task',
        targetId: taskId.value,
        payload: {
          mode: mode.value,
          spaceId: spaceId.value,
          lessonBundleId: lessonBundleId.value,
          source: backendSession ? 'backend_session' : 'local_mock',
        },
      })
      reportStepEntered(scriptSteps.value[currentStepIndex.value], 'session_start')
    } finally {
      loading.value = false
    }
  }

  function goToStep(index: number) {
    if (index < 0 || index >= scriptSteps.value.length) return
    endTeaching()
    const cur = scriptSteps.value[currentStepIndex.value]
    if (cur && cur.status === 'in_progress') {
      cur.status = 'completed'
      reportStepCompleted(cur, 'jump')
    }
    currentStepIndex.value = index
    const next = scriptSteps.value[index]
    if (next && next.status === 'pending') next.status = 'in_progress'
    refreshCanvas()
    reportStepEntered(next, 'jump')
    startTeaching()
  }

  function nextStep() {
    if (currentStepIndex.value >= scriptSteps.value.length - 1) return
    endTeaching()
    const cur = scriptSteps.value[currentStepIndex.value]
    if (cur && cur.status === 'in_progress') {
      cur.status = 'completed'
      reportStepCompleted(cur, 'next')
    }
    currentStepIndex.value++
    const next = scriptSteps.value[currentStepIndex.value]
    if (next && next.status === 'pending') next.status = 'in_progress'
    refreshCanvas()
    reportStepEntered(next, 'next')
    startTeaching()
  }

  function prevStep() {
    if (currentStepIndex.value <= 0) return
    endTeaching()
    currentStepIndex.value--
    refreshCanvas()
    reportStepEntered(scriptSteps.value[currentStepIndex.value], 'prev')
    startTeaching()
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
    if (step) canvasContent.value = prepareCanvasContent(step)
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
      const receipt = await reportStudyEvent({
        eventType: 'feedback_clicked',
        targetType: 'feedback',
        targetId: type,
        payload: {
          feedbackType: type,
          label: labels[type],
        },
      })
      const handledByBackend = !!receipt?.actions?.length
      // 模拟网络延迟
      await new Promise(r => setTimeout(r, 400))
      if (!handledByBackend) {
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
      void reportStudyEvent({
        eventType: 'custom_message_submitted',
        targetType: 'chat',
        payload: {
          text: text.trim(),
        },
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
      void reportStudyEvent({
        eventType: 'session_completed',
        targetType: 'session',
        targetId: sessionId.value,
        payload: {
          actualMinutes: minutes,
          completedSteps: completedSteps.value,
          totalSteps: scriptSteps.value.length,
        },
      })
      // 预留：后端就绪后接入
      // await spaceDashboardStore.completeTask(taskId.value, minutes)
      ElMessage.success(`本次学习已保存（${minutes} 分钟），画像已更新。`)
      return true
    } finally {
      completing.value = false
    }
  }

  function reset() {
    clearSceneActions()
    endTeaching()
    steps.value = []
    scriptSteps.value = []
    canvasContent.value = null
    sessionId.value = ''
    lessonBundleId.value = ''
    sessionTimelines.value = {}
    mastery.value = null
    chatMessages.value = []
    currentStepIndex.value = 0
    taskId.value = ''
    spaceId.value = null
    mode.value = 'learn'
    teachingActive.value = false
    quizState.value = null
  }

  function prepareCanvasContent(step: ScriptStep): CanvasContent {
    const content = getMockCanvasContent(step, mode.value)
    const backendTimeline = sessionTimelines.value[step.id]
    if (backendTimeline) {
      return {
        ...content,
        timeline: backendTimeline,
      }
    }
    if (content.timeline || !content.teachingFlow) return content

    return {
      ...content,
      timeline: buildTimelineFromTeachingFlow(step.id, content.teachingFlow),
    }
  }

  async function startBackendStudySession(
    id: string,
    options: { mode?: StudyMode; spaceId?: string },
  ): Promise<StudySessionVO | null> {
    try {
      return await studySessionApi.start({
        taskId: id,
        spaceId: options.spaceId,
        mode: options.mode || 'learn',
      })
    } catch (error) {
      console.warn('[StudySession] 后端学习会话接口暂不可用，回退本地 mock。', error)
      return null
    }
  }

  function buildTimelineFromTeachingFlow(sceneId: string, flow: TeachingFlow): LessonTimeline {
    let cursorMs = 0
    const cues: LessonCue[] = []
    flow.segments.forEach((segment, index) => {
      const startMs = cursorMs
      cursorMs += Math.max(segment.autoAdvanceMs, 800)
      const sceneAction = buildSceneActionFromSegment(segment, index, startMs)
      cues.push({
        id: `${segment.id}-reveal`,
        type: 'segment_reveal',
        startMs,
        endMs: cursorMs,
        payload: {
          segmentId: segment.id,
          segmentIndex: index,
          segmentType: segment.type,
          waitForUser: segment.autoAdvanceMs <= 0 || segment.type === 'quiz',
          sceneAction,
        },
      })
      cues.push({
        id: `${segment.id}-scene-action`,
        type: 'scene_action',
        startMs,
        endMs: Math.min(cursorMs, startMs + sceneAction.durationMs),
        payload: sceneAction,
      })
    })

    return {
      id: `timeline-${sceneId}`,
      sceneId,
      clockSource: 'internal',
      durationMs: Math.max(cursorMs, 800),
      cues,
      metadata: {
        source: 'teaching_flow_compat',
      },
    }
  }

  function applyTimelineCue(cue: LessonCue) {
    reportTimelineCuePlayed(cue)

    if (cue.type === 'scene_action') {
      applySceneActionCue(cue)
      return
    }

    if (cue.type !== 'segment_reveal') return
    const index = Number(cue.payload.segmentIndex)
    if (!Number.isInteger(index)) return
    applySceneActionPayload(cue.payload.sceneAction, cue.startMs)
    processSegment(index, cue)
  }

  function resetTimelineScene() {
    clearSceneActions()
    const flow = currentTeachingFlow.value
    if (flow) {
      flow.currentSegmentIndex = -1
      flow.isActive = false
      flow.isPaused = false
    }
    quizState.value = null
  }

  function handleTimelineEnded() {
    const flow = currentTeachingFlow.value
    if (flow) {
      flow.isActive = false
      flow.isPaused = false
    }
    quizState.value = null
    teachingActive.value = true
  }

  function buildSceneActionFromSegment(segment: TeachingSegment, index: number, startMs: number): LessonSceneAction {
    const actionTypeBySegment: Record<string, string> = {
      text: 'text_fade_in',
      formula: 'formula_write',
      diagram: 'diagram_trace',
      quiz: 'quiz_mount',
      pause: 'narration',
    }
    const instructionBySegment: Record<string, string> = {
      text: '逐段淡入文字讲解',
      formula: '按推导顺序书写公式',
      diagram: '沿节点关系绘制图示',
      quiz: '挂载互动题并等待学生作答',
      pause: '展示过渡提示',
    }

    return {
      actionId: `${segment.id}-action`,
      actionType: actionTypeBySegment[segment.type] || 'text_fade_in',
      targetType: segment.type === 'diagram' ? 'diagram' : segment.type === 'quiz' ? 'quiz' : 'segment',
      targetId: segment.id,
      layer: segment.type === 'quiz' ? 'overlay' : 'content',
      startMs,
      durationMs: Math.min(Math.max(segment.autoAdvanceMs || 1800, 1200), 5200),
      instruction: instructionBySegment[segment.type] || '播放场景动作',
      payload: {
        segmentIndex: index,
        segmentType: segment.type,
        focusTarget: segment.focusTarget,
      },
    }
  }

  function applySceneActionCue(cue: LessonCue) {
    applySceneActionPayload(cue.payload, cue.startMs)
  }

  function applySceneActionPayload(value: unknown, fallbackStartMs: number) {
    if (!value || typeof value !== 'object') return
    const payload = value as Record<string, unknown>
    const actionId = String(payload.actionId || '')
    const actionType = String(payload.actionType || '')
    if (!actionId || !actionType) return

    const action: LessonSceneAction = {
      actionId,
      actionType,
      targetType: payload.targetType ? String(payload.targetType) : undefined,
      targetId: payload.targetId ? String(payload.targetId) : undefined,
      layer: payload.layer ? String(payload.layer) : undefined,
      startMs: Number(payload.startMs ?? fallbackStartMs),
      durationMs: Math.max(Number(payload.durationMs ?? 1800), 600),
      instruction: payload.instruction ? String(payload.instruction) : undefined,
      payload: typeof payload.payload === 'object' && payload.payload
        ? payload.payload as Record<string, unknown>
        : undefined,
    }

    activeSceneActions.value = [
      action,
      ...activeSceneActions.value.filter(item => item.actionId !== action.actionId),
    ].slice(0, 4)

    const timer = setTimeout(() => {
      activeSceneActions.value = activeSceneActions.value.filter(item => item.actionId !== action.actionId)
    }, action.durationMs)
    sceneActionTimers.push(timer)
  }

  function clearSceneActions() {
    while (sceneActionTimers.length) {
      const timer = sceneActionTimers.pop()
      if (timer) clearTimeout(timer)
    }
    activeSceneActions.value = []
  }

  function reportTimelineCuePlayed(cue: LessonCue) {
    void reportStudyEvent({
      eventType: 'timeline_cue_played',
      targetType: 'cue',
      targetId: cue.id,
      timelineTimeMs: Math.round(timelinePlayer.currentTimeMs.value),
      payload: {
        cueType: cue.type,
        startMs: cue.startMs,
        endMs: cue.endMs,
        segmentIndex: cue.payload.segmentIndex,
        segmentType: cue.payload.segmentType,
        waitForUser: cue.payload.waitForUser,
        actionType: cue.payload.actionType,
        targetId: cue.payload.targetId,
      },
    })
  }

  function pushSegmentCommentary(segment: TeachingSegment, cueId: string) {
    if (!segment.agentCommentary) return
    chatMessages.value.push({
      id: `agent-teach-${cueId}`,
      role: 'agent',
      text: segment.agentCommentary,
      markdown: false,
      createTime: Date.now(),
    })
  }

  function reportStepEntered(step: ScriptStep | undefined, reason: string) {
    if (!step) return
    void reportStudyEvent({
      eventType: 'step_entered',
      targetType: 'script_step',
      targetId: step.id,
      payload: {
        reason,
        phase: step.phase,
        canvasType: step.canvasType,
        title: step.title,
      },
    })
  }

  function reportStepCompleted(step: ScriptStep, reason: string) {
    void reportStudyEvent({
      eventType: 'step_completed',
      targetType: 'script_step',
      targetId: step.id,
      payload: {
        reason,
        phase: step.phase,
        canvasType: step.canvasType,
        title: step.title,
      },
    })
  }

  async function reportStudyEvent(event: StudyEventRequest): Promise<StudyEventReceipt | null> {
    if (!sessionId.value) return null

    const payload: StudyEventRequest = {
      ...event,
      clientTimeMs: event.clientTimeMs ?? Date.now(),
      timelineTimeMs: event.timelineTimeMs ?? Math.round(timelinePlayer.currentTimeMs.value),
      currentStepId: event.currentStepId ?? currentScriptStep.value?.id,
      currentTimelineId: event.currentTimelineId ?? currentTimeline.value?.id,
      payload: {
        ...(event.payload || {}),
        taskId: taskId.value,
        spaceId: spaceId.value,
        mode: mode.value,
      },
    }

    try {
      const receipt = await studySessionApi.reportEvent(sessionId.value, payload)
      applyTeachingActions(receipt.actions || [])
      return receipt
    } catch (error) {
      console.warn('[StudyEvent] 上报失败，已忽略。', error)
      return null
    }
  }

  function applyTeachingActions(actions: StudyTeachingAction[]) {
    actions.forEach(action => {
      switch (action.actionType) {
        case 'agent_reply':
          chatMessages.value.push({
            id: `action-${action.actionId}`,
            role: 'agent',
            text: String(action.payload.text || ''),
            markdown: action.payload.markdown !== false,
            createTime: Date.now(),
          })
          break

        case 'append_agent_note':
          appendAgentNote(String(action.payload.note || ''))
          break

        case 'mark_current_step_skipped': {
          const cur = scriptSteps.value[currentStepIndex.value]
          if (cur) cur.status = 'skipped'
          break
        }
      }
    })
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
    sessionId,
    lessonBundleId,
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
    // 教学流
    teachingActive,
    quizState,
    activeSceneActions,
    currentTeachingFlow,
    currentTimeline,
    currentSegment,
    isTeachingPaused,
    timelineStatus: timelinePlayer.status,
    timelineCurrentTimeMs: timelinePlayer.currentTimeMs,
    timelinePlaybackRate: timelinePlayer.playbackRate,
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
    // 教学流方法
    startTeaching,
    advanceSegment,
    pauseTeaching,
    replayTeaching,
    submitQuizAnswer,
    resumeTeaching,
    endTeaching,
  }
})
