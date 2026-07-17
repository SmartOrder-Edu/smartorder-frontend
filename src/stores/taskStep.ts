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
  TemporaryBoardNote,
  TeachingBoardBlock,
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
  const pathNodeId = ref<string | null>(null)
  const mode = ref<StudyMode>('learn')
  const scriptSteps = ref<ScriptStep[]>([])
  const canvasContent = ref<CanvasContent | null>(null)
  const sessionId = ref<string>('')
  const lessonBundleId = ref<string>('')
  const sessionScenes = ref<Record<string, StudySessionVO['currentScene']>>({})
  const sessionTimelines = ref<Record<string, LessonTimeline>>({})
  const mastery = ref<MasteryJudge | null>(null)
  const chatMessages = ref<StudyChatMessage[]>([])
  const temporaryBoardNotes = ref<TemporaryBoardNote[]>([])
  const sendingFeedback = ref(false)
  const completing = ref(false)

  // ---- 教学流状态（v2 Agent 主动教学交互）----
  const teachingActive = ref(false)
  const quizState = ref<QuizState | null>(null)
  const currentSubtitle = ref('')
  const activeSceneActions = ref<LessonSceneAction[]>([])
  const revealedBoardBlockIndexes = ref<Record<string, number>>({})
  const revealedBoardItemIndexes = ref<Record<string, Record<string, number>>>({})
  const feedbackVisualEffect = ref<{ type: string; segmentId?: string; ts: number } | null>(null)
  const quickContinueCount = ref(0)
  const segmentWaitStartedAtMs = ref(0)
  const currentWaitReason = ref('')
  const skipNextSegmentEndPause = ref(false)
  const sceneActionTimers = new Map<string, ReturnType<typeof setTimeout>>()

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
  const timelineEnded = computed(() => timelinePlayer.status.value === 'ended')

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

    const waitImmediately = cue.payload.waitForUserImmediate === true

    // 弹题：先展示题面，是否暂停由时间轴 pause cue 控制
    if (isInteractiveSegment(seg.type) && seg.quiz) {
      flow.isPaused = waitImmediately
      quizState.value = {
        quizId: seg.quiz.id,
        userAnswer: '',
        correct: false,
        answered: false,
      }
      if (waitImmediately) {
        markTimelineWaiting(String(cue.payload.reason || 'interaction'))
      }
      pushSegmentCommentary(seg, cue.id)
      return
    }

    // 聚焦
    if (seg.focusTarget?.scroll && seg.focusTarget.scroll !== 'none') {
      // 聚焦效果由 TeachingSegmentView 的 onMounted 处理
    }

    if (waitImmediately) {
      markTimelineWaiting(String(cue.payload.reason || 'segment_end_check'))
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
    return { correct, explanation: quizState.value.explanation || '' }
  }

  /** 恢复教学（答题后或手动点继续） */
  function resumeTeaching() {
    const flow = currentTeachingFlow.value
    if (!flow) return
    trackContinueRhythm()
    flow.isPaused = false
    quizState.value = null
    currentWaitReason.value = ''
    segmentWaitStartedAtMs.value = 0
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
    currentWaitReason.value = 'manual_pause'
    segmentWaitStartedAtMs.value = 0
  }

  /** 重放当前教学时间轴 */
  function replayTeaching() {
    startTeaching()
  }

  /** 结束教学流 */
  function endTeaching() {
    timelinePlayer.stop()
    teachingActive.value = false
    resetContinueRhythm()
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
  async function fetchSteps(
    id: string,
    options: { mode?: StudyMode; spaceId?: string; pathNodeId?: string; source?: string; stepId?: string } = {},
  ) {
    loading.value = true
    try {
      taskId.value = id
      mode.value = options.mode || 'learn'
      spaceId.value = options.spaceId || null
      pathNodeId.value = options.pathNodeId || null

      // 原有 task steps（保留以兼容）
      steps.value = await taskStepApi.getSteps(id)

      // 学习会话脚本与画布
      const backendSession = await startBackendStudySession(id, options)
      applyBackendSession(backendSession, id)
      chatMessages.value = getInitialChatMessages()
      void reportStudyEvent({
        eventType: 'session_started',
        targetType: 'task',
        targetId: taskId.value,
        payload: {
          mode: mode.value,
          spaceId: spaceId.value,
          pathNodeId: pathNodeId.value,
          lessonBundleId: lessonBundleId.value,
          source: backendSession ? 'backend_session' : 'local_mock',
        },
      })
      reportStepEntered(scriptSteps.value[currentStepIndex.value], 'session_start')
    } finally {
      loading.value = false
    }
  }

  async function loadSession(id: string) {
    loading.value = true
    try {
      const backendSession = await studySessionApi.get(id)
      taskId.value = backendSession.taskId
      mode.value = backendSession.mode || 'learn'
      spaceId.value = backendSession.spaceId || null
      pathNodeId.value = backendSession.pathNodeId || null
      steps.value = await taskStepApi.getSteps(backendSession.taskId)
      applyBackendSession(backendSession, backendSession.taskId)
      chatMessages.value = getInitialChatMessages()
      reportStepEntered(scriptSteps.value[currentStepIndex.value], 'session_restore')
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

  /** 在当前画布追加一张临时板书卡片（来自自由提问或后端教学动作） */
  function appendTemporaryBoardNote(note: {
    title?: string
    content: string
    sourceQuestion?: string
  }) {
    const content = note.content.trim()
    if (!content) return
    temporaryBoardNotes.value = [
      ...temporaryBoardNotes.value,
      {
        id: `board-note-${Date.now()}-${temporaryBoardNotes.value.length}`,
        title: note.title?.trim() || 'Agent 补充板书',
        content,
        sourceQuestion: note.sourceQuestion?.trim(),
        createTime: Date.now(),
      },
    ].slice(-4)
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
        triggerFeedbackVisualEffect(type)
        if (type === 'slower') {
          setTimelinePlaybackRate(0.75)
        }
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
    const question = text.trim()
    if (!question) return
    sendingFeedback.value = true
    try {
      chatMessages.value.push({
        id: `u-${Date.now()}`,
        role: 'user',
        text: question,
        markdown: false,
        createTime: Date.now(),
      })
      const receipt = await reportStudyEvent({
        eventType: 'custom_message_submitted',
        targetType: 'chat',
        payload: {
          text: question,
        },
      })
      if (receipt?.actions?.length) return
      await new Promise(r => setTimeout(r, 400))
      const reply = buildMockCustomReply(question)
      chatMessages.value.push({
        id: `a-${Date.now()}`,
        role: 'agent',
        text: reply.chat,
        markdown: true,
        createTime: Date.now(),
      })
      appendTemporaryBoardNote({
        title: '临时补充板书',
        content: reply.board,
        sourceQuestion: question,
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
      if (sessionId.value) {
        const completion = await studySessionApi.complete(sessionId.value, {
          actualMinutes: minutes,
          payload: {
            completedSteps: completedSteps.value,
            totalSteps: scriptSteps.value.length,
            taskId: taskId.value,
            spaceId: spaceId.value,
            pathNodeId: pathNodeId.value,
            mode: mode.value,
          },
        })
        if (completion?.summary) {
          mastery.value = {
            level: (completion.masteryLevel as any) || mastery.value?.level || 'unknown',
            levelLabel: mastery.value?.levelLabel || '已完成',
            hint: mastery.value?.hint || '本次学习会话已完成。',
            nextSuggestion: completion.nextSuggestion || mastery.value?.nextSuggestion || '',
          }
        }
      }
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
    sessionScenes.value = {}
    sessionTimelines.value = {}
    mastery.value = null
    chatMessages.value = []
    temporaryBoardNotes.value = []
    currentStepIndex.value = 0
    taskId.value = ''
    spaceId.value = null
    pathNodeId.value = null
    mode.value = 'learn'
    teachingActive.value = false
    quizState.value = null
    revealedBoardBlockIndexes.value = {}
    revealedBoardItemIndexes.value = {}
    feedbackVisualEffect.value = null
    resetContinueRhythm()
  }

  function prepareCanvasContent(step: ScriptStep): CanvasContent {
    temporaryBoardNotes.value = []
    const backendScene = sessionScenes.value[step.id]
    const backendContent = toCanvasContent(backendScene?.content)
    if (backendContent) {
      return {
        ...backendContent,
        timeline: sessionTimelines.value[step.id] || backendContent.timeline,
      }
    }

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

  function applyBackendSession(backendSession: StudySessionVO | null, fallbackTaskId: string) {
    scriptSteps.value = backendSession?.scriptSteps?.length
      ? backendSession.scriptSteps
      : getMockScriptSteps(fallbackTaskId)
    sessionId.value = backendSession?.sessionId || ''
    lessonBundleId.value = backendSession?.lessonBundleId || ''
    sessionScenes.value = backendSession?.scenesByStepId || buildSingleSceneMap(backendSession)
    sessionTimelines.value = backendSession?.timelinesByStepId || {}

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
  }

  function buildSingleSceneMap(backendSession: StudySessionVO | null): Record<string, StudySessionVO['currentScene']> {
    if (!backendSession?.currentScene?.stepId) return {}
    return {
      [backendSession.currentScene.stepId]: backendSession.currentScene,
    }
  }

  function toCanvasContent(value: unknown): CanvasContent | null {
    if (!value || typeof value !== 'object') return null
    const raw = value as Record<string, unknown>
    const type = raw.type
    const markdown = raw.markdown
    if (typeof type !== 'string' || typeof markdown !== 'string') {
      return null
    }
    return {
      type: type as CanvasContent['type'],
      markdown,
      mermaid: typeof raw.mermaid === 'string' ? raw.mermaid : undefined,
      exampleSteps: Array.isArray(raw.exampleSteps) ? raw.exampleSteps as CanvasContent['exampleSteps'] : undefined,
      question: raw.question && typeof raw.question === 'object'
        ? raw.question as CanvasContent['question']
        : undefined,
      agentNote: typeof raw.agentNote === 'string' ? raw.agentNote : undefined,
      teachingFlow: raw.teachingFlow && typeof raw.teachingFlow === 'object'
        ? raw.teachingFlow as CanvasContent['teachingFlow']
        : undefined,
      timeline: raw.timeline && typeof raw.timeline === 'object'
        ? raw.timeline as CanvasContent['timeline']
        : undefined,
    }
  }

  async function startBackendStudySession(
    id: string,
    options: { mode?: StudyMode; spaceId?: string; pathNodeId?: string; source?: string; stepId?: string },
  ): Promise<StudySessionVO | null> {
    try {
      return await studySessionApi.start({
        taskId: id,
        pathNodeId: options.pathNodeId,
        spaceId: options.spaceId,
        mode: options.mode || 'learn',
        entrySource: options.source as any,
        stepId: options.stepId,
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
      const segmentDurationMs = resolveSegmentDurationMs(segment)
      const endMs = startMs + segmentDurationMs
      const waitForUser = true
      const sceneAction = buildSceneActionFromSegment(segment, index, startMs)
      sceneAction.durationMs = Math.min(Math.max(segmentDurationMs, 1200), 5200)
      sceneAction.payload = {
        ...(sceneAction.payload || {}),
        speechStartMs: startMs,
        speechEndMs: endMs,
      }
      cues.push({
        id: `${segment.id}-reveal`,
        type: 'segment_reveal',
        startMs,
        endMs,
        payload: {
          segmentId: segment.id,
          segmentIndex: index,
          segmentType: segment.type,
          waitForUser: false,
          waitForUserAtEnd: waitForUser,
          speechText: segmentSpeechText(segment),
          speechStartMs: startMs,
          speechEndMs: endMs,
          sceneAction,
        },
      })
      cues.push({
        id: `${segment.id}-scene-action`,
        type: 'scene_action',
        startMs,
        endMs: Math.min(endMs, startMs + sceneAction.durationMs),
        payload: sceneAction as unknown as Record<string, unknown>,
      })
      appendBoardRevealCues(cues, segment, index, startMs, segmentDurationMs)
      if (waitForUser) {
        cues.push({
          id: `${segment.id}-wait`,
          type: 'pause',
          startMs: endMs,
          endMs,
          payload: {
            segmentId: segment.id,
            segmentIndex: index,
            segmentType: segment.type,
            waitForUser: true,
            reason: isInteractiveSegment(segment.type) ? 'interaction' : 'segment_end_check',
          },
        })
      }
      cursorMs = endMs
    })

    return {
      id: `timeline-${sceneId}`,
      sceneId,
      clockSource: 'internal',
      durationMs: Math.max(cursorMs, 800),
      cues,
      metadata: {
        source: 'teaching_flow_compat',
        capabilities: [
          'segment_reveal',
          'scene_action',
          'pause_at_segment_end',
          'board_block_reveal',
          'board_item_reveal',
        ],
      },
    }
  }

  function appendBoardRevealCues(
    cues: LessonCue[],
    segment: TeachingSegment,
    segmentIndex: number,
    segmentStartMs: number,
    segmentDurationMs: number,
  ) {
    const blocks = segment.boardBlocks || []
    if (!blocks.length) return

    const blockIntervalMs = revealIntervalMs(segmentDurationMs, blocks.length)
    blocks.forEach((block, blockIndex) => {
      const blockStartMs = Math.min(
        segmentStartMs + segmentDurationMs - 1,
        segmentStartMs + blockIndex * blockIntervalMs,
      )
      const blockId = boardBlockTimelineId(segment.id, block, blockIndex)
      cues.push({
        id: `${segment.id}-block-${blockIndex}-reveal`,
        type: 'board_block_reveal',
        startMs: blockStartMs,
        endMs: blockStartMs,
        payload: {
          segmentId: segment.id,
          segmentIndex,
          blockId,
          blockIndex,
          blockType: block.type,
        },
      })
      appendBoardItemRevealCues(cues, segment.id, segmentIndex, block, blockId, blockIndex, blockStartMs, blockIntervalMs)
    })
  }

  function appendBoardItemRevealCues(
    cues: LessonCue[],
    segmentId: string,
    segmentIndex: number,
    block: TeachingBoardBlock,
    blockId: string,
    blockIndex: number,
    blockStartMs: number,
    blockWindowMs: number,
  ) {
    const itemKind = boardRevealItemKind(block)
    if (!itemKind) return

    const items = (block as unknown as Record<string, unknown>)[itemKind]
    if (!Array.isArray(items) || !items.length) return

    const itemIntervalMs = revealIntervalMs(Math.max(blockWindowMs, 900), items.length)
    items.forEach((_, itemIndex) => {
      const itemStartMs = blockStartMs + Math.min(blockWindowMs - 1, itemIndex * itemIntervalMs)
      cues.push({
        id: `${segmentId}-block-${blockIndex}-item-${itemIndex}-reveal`,
        type: 'board_item_reveal',
        startMs: itemStartMs,
        endMs: itemStartMs,
        payload: {
          segmentId,
          segmentIndex,
          blockId,
          blockIndex,
          itemIndex,
          itemKind,
        },
      })
    })
  }

  function revealIntervalMs(durationMs: number, count: number): number {
    if (count <= 1) return Math.max(600, durationMs)
    return Math.max(600, Math.floor(durationMs / count))
  }

  function boardBlockTimelineId(segmentId: string, block: TeachingBoardBlock, blockIndex: number): string {
    return block.id || `${segmentId}-block-${blockIndex}`
  }

  function boardRevealItemKind(block: TeachingBoardBlock): string {
    const type = normalizeBoardBlockType(block.type)
    const record = block as unknown as Record<string, unknown>
    if (type === 'reasoning_steps' || type === 'operation_sequence') {
      return Array.isArray(record.steps) ? 'steps' : ''
    }
    if (type === 'concept_breakdown') {
      if (Array.isArray(record.points)) return 'points'
      return Array.isArray(record.items) ? 'items' : ''
    }
    if (type === 'numbered_points' || type === 'ordered_checklist') {
      if (Array.isArray(record.items)) return 'items'
      return Array.isArray(record.points) ? 'points' : ''
    }
    if (type === 'invariant') {
      return Array.isArray(record.checkpoints) ? 'checkpoints' : ''
    }
    return ''
  }

  function normalizeBoardBlockType(type: string): string {
    return (type || '').toLowerCase().replace(/[-\s]/g, '_')
  }

  function resolveSegmentDurationMs(segment: TeachingSegment): number {
    const speechMs = estimateSpeechDurationMs(segmentSpeechText(segment))
    const explicitMs = Number(segment.autoAdvanceMs || 0)
    let base = Math.max(speechMs, explicitMs)
    const blocks = segment.boardBlocks || []
    const denseTypes = ['comparison', 'vs_compare', 'code', 'formula', 'structure', 'trace']
    const denseBlockCount = blocks.filter(block => denseTypes.includes(normalizeBoardBlockType(block.type))).length
    if (denseBlockCount >= 3) {
      base *= 2
    } else if (denseBlockCount >= 2) {
      base *= 1.5
    }
    const totalTextSize = blocks.reduce((sum, block) => sum + boardBlockTextSize(block), 0)
    if (totalTextSize > 800) {
      base *= 1.3
    }
    return Math.max(1200, Math.min(30000, base))
  }

  function boardBlockTextSize(block: TeachingBoardBlock): number {
    const record = block as unknown as Record<string, unknown>
    const textParts: unknown[] = [
      block.title,
      block.content,
      block.caption,
      record.term,
      record.definition,
      record.intuition,
      record.formal,
      record.lead,
      record.question,
      record.summary,
      record.conclusion,
      record.rule,
      record.context,
      record.reminder,
      record.explanation,
      record.invariant,
      record.statement,
      record.whyItMatters,
      record.time,
      record.space,
      record.reason,
      compactBoardText(record.items),
      compactBoardText(record.points),
      compactBoardText(record.steps),
      compactBoardText(record.keyPoints),
      compactBoardText(record.examples),
      compactBoardText(record.cases),
      compactBoardText(record.criteria),
    ]
    return textParts.reduce<number>((sum, value) => sum + stringValue(value).length, 0)
  }

  function compactBoardText(value: unknown): string {
    if (!Array.isArray(value)) return ''
    return value
      .map((item) => {
        if (item === null || item === undefined) return ''
        if (typeof item === 'string') return item
        if (typeof item !== 'object') return String(item)
        return Object.values(item as Record<string, unknown>).map(stringValue).join(' ')
      })
      .join(' ')
  }

  function stringValue(value: unknown): string {
    if (value === null || value === undefined) return ''
    return typeof value === 'string' ? value : String(value)
  }

  function segmentSpeechText(segment: TeachingSegment): string {
    return segment.teacherTalk
      || segment.agentCommentary
      || segment.markdown
      || segment.boardContent
      || ''
  }

  function estimateSpeechDurationMs(text: string): number {
    const length = text.trim().length
    if (length <= 0) return 1800
    return Math.max(1800, Math.min(30000, length * 220))
  }

  function applyTimelineCue(cue: LessonCue) {
    reportTimelineCuePlayed(cue)

    if (cue.type === 'scene_action') {
      applySceneActionCue(cue)
      return
    }

    if (cue.type === 'subtitle' || cue.type === 'speech') {
      currentSubtitle.value = String(cue.payload.text || cue.payload.subtitle || '')
      return
    }

    if (cue.type === 'board_block_reveal') {
      applyBoardBlockRevealCue(cue)
      return
    }

    if (cue.type === 'board_item_reveal') {
      applyBoardItemRevealCue(cue)
      return
    }

    if (cue.type === 'segment_reveal' || cue.type === 'text_reveal') {
      const index = Number(cue.payload.segmentIndex)
      if (Number.isInteger(index)) {
        applySceneActionPayload(cue.payload.sceneAction, cue.startMs)
        processSegment(index, cue)
        return
      }
    }

    applyGenericTimelineCue(cue)
  }

  function applyBoardBlockRevealCue(cue: LessonCue) {
    const segmentId = String(cue.payload.segmentId || '')
    const blockIndex = Number(cue.payload.blockIndex)
    if (!segmentId || !Number.isInteger(blockIndex)) return

    revealedBoardBlockIndexes.value = {
      ...revealedBoardBlockIndexes.value,
      [segmentId]: Math.max(revealedBoardBlockIndexes.value[segmentId] ?? -1, blockIndex),
    }
  }

  function applyBoardItemRevealCue(cue: LessonCue) {
    const segmentId = String(cue.payload.segmentId || '')
    const blockIndex = Number(cue.payload.blockIndex)
    const itemIndex = Number(cue.payload.itemIndex)
    if (!segmentId || !Number.isInteger(blockIndex) || !Number.isInteger(itemIndex)) return

    const blockId = String(cue.payload.blockId || '')
    const existing = revealedBoardItemIndexes.value[segmentId] || {}
    const nextSegmentItems = { ...existing }
    const keys = [`index:${blockIndex}`]
    if (blockId) keys.push(blockId)
    keys.forEach((key) => {
      nextSegmentItems[key] = Math.max(nextSegmentItems[key] ?? -1, itemIndex)
    })
    revealedBoardItemIndexes.value = {
      ...revealedBoardItemIndexes.value,
      [segmentId]: nextSegmentItems,
    }
  }

  function getRevealedBoardBlockIndex(segmentId: string): number | null {
    if (!hasBoardRevealCue(segmentId, 'board_block_reveal')) return null
    return revealedBoardBlockIndexes.value[segmentId] ?? -1
  }

  function getRevealedBoardItemIndexes(segmentId: string): Record<string, number> {
    if (!hasBoardRevealCue(segmentId, 'board_item_reveal')) return {}
    return revealedBoardItemIndexes.value[segmentId] || {}
  }

  function hasBoardRevealCue(segmentId: string, cueType: 'board_block_reveal' | 'board_item_reveal'): boolean {
    const timeline = currentTimeline.value
    if (!timeline) return false
    return timeline.cues.some((cue) => cue.type === cueType && cue.payload.segmentId === segmentId)
  }

  function resetTimelineScene() {
    clearSceneActions()
    currentSubtitle.value = ''
    revealedBoardBlockIndexes.value = {}
    revealedBoardItemIndexes.value = {}
    currentWaitReason.value = ''
    segmentWaitStartedAtMs.value = 0
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
  }

  function setTimelineAudioElement(element: HTMLAudioElement | null) {
    timelinePlayer.audioRef.value = element
  }

  function buildSceneActionFromSegment(segment: TeachingSegment, index: number, startMs: number): LessonSceneAction {
    const actionTypeBySegment: Record<string, string> = {
      text: 'text_fade_in',
      hook: 'teacher_speak',
      recall: 'text_fade_in',
      explain: 'text_fade_in',
      analogy: 'teacher_speak',
      board_write: 'board_write',
      worked_example: 'board_write',
      formula: 'formula_write',
      diagram: 'diagram_trace',
      quiz: 'quiz_mount',
      teacher_question: 'ask_question',
      student_try: 'ask_question',
      self_check: 'ask_question',
      diagnosis: 'correct_mistake',
      mistake_warning: 'show_mistake',
      summary: 'summary_pin',
      transition: 'teacher_speak',
      pause: 'narration',
    }
    const instructionBySegment: Record<string, string> = {
      text: '逐段淡入文字讲解',
      hook: '老师导入问题',
      recall: '唤起前置知识',
      explain: '老师展开讲解',
      analogy: '用类比降低理解难度',
      board_write: '像板书一样逐步写出关键内容',
      worked_example: '分镜拆解例题',
      formula: '按推导顺序书写公式',
      diagram: '沿节点关系绘制图示',
      quiz: '挂载互动题并等待学生作答',
      teacher_question: '课堂提问并等待学生思考',
      student_try: '让学生先尝试作答',
      self_check: '自我检查理解程度',
      diagnosis: '诊断答案和错因',
      mistake_warning: '展示并纠正常见误区',
      summary: '固定本段结论',
      transition: '过渡到下一段',
      pause: '展示过渡提示',
    }

    return {
      actionId: `${segment.id}-action`,
      actionType: actionTypeBySegment[segment.type] || 'text_fade_in',
      targetType: segment.type === 'diagram'
        ? 'diagram'
        : isInteractiveSegment(segment.type)
          ? 'quiz'
          : segment.type === 'board_write' || segment.type === 'worked_example'
            ? 'board'
            : 'segment',
      targetId: segment.id,
      layer: isInteractiveSegment(segment.type) ? 'overlay' : 'content',
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

  function isInteractiveSegment(type: string): boolean {
    return type === 'quiz'
      || type === 'teacher_question'
      || type === 'student_try'
      || type === 'self_check'
  }

  function applySceneActionCue(cue: LessonCue) {
    applySceneActionPayload(cue.payload, cue.startMs)
  }

  function applyGenericTimelineCue(cue: LessonCue) {
    const actionTypeByCue: Record<string, string> = {
      focus: 'focus_pulse',
      highlight: 'highlight',
      underline: 'underline',
      draw: 'draw',
      quiz: 'quiz_mount',
      pause: 'narration',
      text_reveal: 'text_fade_in',
    }
    const rawTarget = cue.payload.target || cue.payload.targetId || cue.payload.nodeId || cue.payload.segmentId
    const durationMs = Number(cue.payload.durationMs ?? (cue.endMs ? cue.endMs - cue.startMs : 1200))

    applySceneActionPayload({
      actionId: `${cue.id}-action`,
      actionType: actionTypeByCue[cue.type] || cue.type,
      targetType: cue.type === 'draw' ? 'canvas' : cue.type === 'quiz' ? 'quiz' : 'segment',
      targetId: rawTarget ? String(rawTarget) : undefined,
      layer: cue.type === 'quiz' ? 'overlay' : 'content',
      startMs: cue.startMs,
      durationMs,
      instruction: String(cue.payload.instruction || ''),
      payload: {
        ...cue.payload,
        cueType: cue.type,
      },
    }, cue.startMs)

    if (cue.type === 'pause' || cue.payload.waitForUser === true) {
      const reason = String(cue.payload.reason || '')
      if (reason === 'segment_end_check' && skipNextSegmentEndPause.value) {
        skipNextSegmentEndPause.value = false
        return
      }
      markTimelineWaiting(reason || 'manual_continue')
    }
  }

  function markTimelineWaiting(reason: string) {
    const flow = currentTeachingFlow.value
    if (flow) flow.isPaused = true
    currentWaitReason.value = reason
    segmentWaitStartedAtMs.value = Date.now()
    timelinePlayer.waitForUser()
  }

  function trackContinueRhythm() {
    if (timelinePlayer.status.value !== 'waiting_user' || currentWaitReason.value !== 'segment_end_check') {
      return
    }

    const elapsedMs = segmentWaitStartedAtMs.value ? Date.now() - segmentWaitStartedAtMs.value : Number.POSITIVE_INFINITY
    if (elapsedMs <= 2000) {
      quickContinueCount.value += 1
    } else {
      quickContinueCount.value = 0
    }

    if (quickContinueCount.value >= 3) {
      skipNextSegmentEndPause.value = true
      quickContinueCount.value = 0
      chatMessages.value.push({
        id: `agent-rhythm-${Date.now()}`,
        role: 'agent',
        text: '我注意到你节奏很快，下一小段会顺着讲完，不额外停顿。',
        markdown: false,
        createTime: Date.now(),
      })
    }
  }

  function resetContinueRhythm() {
    quickContinueCount.value = 0
    segmentWaitStartedAtMs.value = 0
    currentWaitReason.value = ''
    skipNextSegmentEndPause.value = false
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

    const nextActions = [
      action,
      ...activeSceneActions.value.filter(item => item.actionId !== action.actionId),
    ]
    if (nextActions.length > 4) {
      nextActions.slice(4).forEach((item) => {
        const timer = sceneActionTimers.get(item.actionId)
        if (timer) {
          clearTimeout(timer)
          sceneActionTimers.delete(item.actionId)
        }
      })
    }
    activeSceneActions.value = nextActions.slice(0, 4)

    const existedTimer = sceneActionTimers.get(action.actionId)
    if (existedTimer) {
      clearTimeout(existedTimer)
    }
    const timer = setTimeout(() => {
      activeSceneActions.value = activeSceneActions.value.filter(item => item.actionId !== action.actionId)
      sceneActionTimers.delete(action.actionId)
    }, action.durationMs)
    sceneActionTimers.set(action.actionId, timer)
  }

  function clearSceneActions() {
    sceneActionTimers.forEach(timer => clearTimeout(timer))
    sceneActionTimers.clear()
    activeSceneActions.value = []
  }

  function getActiveSceneAction(targetId?: string, segmentIndex?: number): LessonSceneAction | null {
    return activeSceneActions.value.find(action => {
      if (targetId && action.targetId === targetId) return true
      if (!Number.isInteger(segmentIndex)) return false
      return Number(action.payload?.segmentIndex) === segmentIndex
    }) || null
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
        pathNodeId: pathNodeId.value,
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
      try {
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

          case 'append_board_note':
            appendTemporaryBoardNote({
              title: String(action.payload.title || ''),
              content: String(action.payload.content || action.payload.markdown || ''),
              sourceQuestion: String(action.payload.sourceQuestion || ''),
            })
            break

          case 'mark_current_step_skipped': {
            const cur = scriptSteps.value[currentStepIndex.value]
            if (cur) cur.status = 'skipped'
            break
          }

          case 'trigger_feedback_visual_effect':
            triggerFeedbackVisualEffect(String(action.payload.type || ''))
            break

          case 'set_playback_rate':
            setTimelinePlaybackRate(Number(action.payload.rate || 1))
            break
        }
        void reportTeachingActionStatus(action.actionId, 'applied', {
          actionType: action.actionType,
          appliedAt: Date.now(),
        })
      } catch (error) {
        void reportTeachingActionStatus(
          action.actionId,
          'failed',
          { actionType: action.actionType },
          error instanceof Error ? error.message : String(error),
        )
      }
    })
  }

  function triggerFeedbackVisualEffect(type: string) {
    if (!type) return
    feedbackVisualEffect.value = {
      type,
      segmentId: currentSegment.value?.id,
      ts: Date.now(),
    }
  }

  function setTimelinePlaybackRate(rate: number) {
    if (!Number.isFinite(rate) || rate <= 0) return
    timelinePlayer.setPlaybackRate(rate)
  }

  function buildMockCustomReply(question: string): { chat: string; board: string } {
    const segment = currentSegment.value
    const title = segment?.boardContent || segment?.markdown || currentScriptStep.value?.title || '当前知识点'
    const compactTitle = title.replace(/\s+/g, ' ').slice(0, 42)
    return {
      chat: `可以，我换个角度再讲一遍。\n\n你问的是：「${question}」。先抓住当前这一步的核心：${compactTitle}。我会把它拆成“先看目标、再看条件、最后看为什么这样做”三层，你可以先对照中间板书看一遍。`,
      board: `### 再讲一遍：${compactTitle}\n\n1. **先看目标**：这一步要解决的是“我现在到底要证明、计算或判断什么”。\n2. **再看条件**：把题目或概念里已经给出的条件逐条摆出来，不急着套公式。\n3. **最后看连接**：找到条件通向目标的那条最短链路；如果卡住，通常是少了一步中间转换。\n\n> 你的问题：${question}`,
    }
  }

  async function reportTeachingActionStatus(
    actionId: string,
    status: 'applied' | 'failed',
    payload?: Record<string, unknown>,
    errorMessage?: string,
  ) {
    if (!sessionId.value || !actionId) return
    try {
      await studySessionApi.updateActionStatus(sessionId.value, actionId, {
        status,
        errorMessage,
        payload,
      })
    } catch (error) {
      console.warn('[StudyAction] 状态回写失败，已忽略。', error)
    }
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
    pathNodeId,
    sessionId,
    lessonBundleId,
    mode,
    scriptSteps,
    currentScriptStep,
    canvasContent,
    temporaryBoardNotes,
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
    currentSubtitle,
    activeSceneActions,
    feedbackVisualEffect,
    getActiveSceneAction,
    getRevealedBoardBlockIndex,
    getRevealedBoardItemIndexes,
    currentTeachingFlow,
    currentTimeline,
    currentSegment,
    isTeachingPaused,
    timelineEnded,
    quickContinueCount,
    currentWaitReason,
    timelineStatus: timelinePlayer.status,
    timelineCurrentTimeMs: timelinePlayer.currentTimeMs,
    timelinePlaybackRate: timelinePlayer.playbackRate,
    // 方法
    fetchSteps,
    loadSession,
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
    setTimelineAudioElement,
    handleTimelineAudioEnded: timelinePlayer.handleAudioEnded,
  }
})
