// ============================================================
// 学习会话（Study Session）相关类型定义
// 对应讨论方案：Agent 教学画布学习界面
// 本轮为前端 mock，字段命名预留与后端 VO 对齐
// ============================================================

/** 学习会话模式（由入口决定，影响画布初始渲染） */
export type StudyMode =
  | 'learn'        // 默认学习
  | 'review'       // 复习（学过但不稳）
  | 'assessment'   // 测评（掌握较好，先测一下）
  | 'breakthrough' // 专项突破（Agent 判定薄弱）
  | 'preview'      // 预览（后置阶段，只读）

/** 学习入口来源（埋点用） */
export type StudyEntrySource =
  | 'dashboard_hero'      // 首页"开始今日学习"
  | 'dashboard_space'     // 首页空间卡片
  | 'dashboard_priority'  // 首页优先任务
  | 'daily_plan_task'     // 每日计划任务
  | 'daily_plan_total'    // 每日计划"开始今日总计划"
  | 'space_hero'          // 空间详情"继续学习"
  | 'space_task'          // 空间详情任务列表
  | 'path_node'           // 学习路径知识点
  | 'task_card'           // 任务卡片

/** 进入学习会话的参数 */
export interface EnterStudyOptions {
  mode?: StudyMode
  spaceId?: string
  pathNodeId?: string
  stepId?: string
  source?: StudyEntrySource
}

/** 启动学习会话请求 */
export interface StartStudySessionRequest {
  taskId?: string
  pathNodeId?: string
  spaceId?: string
  mode?: StudyMode
  entrySource?: StudyEntrySource
  stepId?: string
}

/** 学习脚本包生成状态 */
export type LessonBundleStatus =
  | 'not_generated'
  | 'generating'
  | 'ready'
  | 'failed'
  | 'expired'
  | 'needs_refresh'

export interface LessonBundleGenerateRequest {
  taskId?: string
  pathNodeId?: number | string
  spaceId?: string
  mode?: StudyMode
  forceRegenerate?: boolean
  generationTrigger?: 'manual' | 'after_complete' | 'system' | string
  generationReason?: string
}

export interface LessonBundleStatusBatchRequest {
  pathNodeIds: Array<number | string>
  spaceId?: string
  mode?: StudyMode
}

export interface LessonBundleStatusVO {
  bundleId?: string
  taskId?: string
  pathNodeId?: number | string | null
  spaceId?: string | null
  mode?: StudyMode | string
  status: LessonBundleStatus | string
  version?: number
  generationTrigger?: string
  generationReason?: string
  expiresAt?: string
  createTime?: string
  updateTime?: string
  errorMessage?: string
}

/** 学习脚本阶段。阶段由模板决定，不再固定为 6 段。 */
export type ScriptPhaseType = string

/** 学习脚本步骤（比 TaskStep 更细粒度的教学脚本） */
export interface ScriptStep {
  id: string
  phase: ScriptPhaseType
  /** 开放节点类型：diagnostic_quiz / concept_review / guided_practice / summary 等 */
  nodeType?: string
  title: string
  subtitle: string
  estimatedMinutes: number
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  /** 该步骤在画布上的渲染提示，驱动 CanvasContent 模板 */
  canvasType: CanvasType
  sortOrder?: number
  metadata?: Record<string, unknown>
}

/** 画布渲染类型 */
export type CanvasType =
  | 'concept'    // 概念讲解（markdown + mermaid）
  | 'derivation' // 公式推导
  | 'example'    // 动态例题（步骤式展开）
  | 'practice'   // 跟做答题
  | 'assessment' // 测评题
  | 'summary'    // 本次总结

/** 动态例题的步骤展开 */
export interface ExampleStep {
  id: string
  label: string
  markdown: string
}

/** 跟做答题题面 */
export interface PracticeQuestion {
  id: string
  prompt: string
  /** markdown 题面 */
  body: string
  answer: string
  hint: string
  /** 错误时 Agent 讲解 */
  errorExplanation: string
}

/** 画布内容（驱动中心画布渲染） */
export interface CanvasContent {
  type: CanvasType
  /** 主 markdown 内容（概念/推导/总结） */
  markdown: string
  /** mermaid 图源码（可选） */
  mermaid?: string
  /** type=example 时：步骤式展开 */
  exampleSteps?: ExampleStep[]
  /** type=practice/assessment 时：题面 */
  question?: PracticeQuestion
  /** Agent 临时补充讲解（由反馈触发更新） */
  agentNote?: string
  /** v2: 分段式教学流（存在时走 Agent 教学模式，否则回退静态渲染） */
  teachingFlow?: TeachingFlow
  /** v3: 统一教学时间轴。后端就绪后可直接返回该结构，TeachingFlow 仅作为兼容输入。 */
  timeline?: LessonTimeline
}

// ---- 分段式教学流（v2 Agent 主动教学交互）----

/** 教学段类型。兼容旧 text/formula/quiz，同时支持课堂化脚本段。 */
export type TeachingSegmentType =
  | 'text'
  | 'formula'
  | 'diagram'
  | 'quiz'
  | 'pause'
  | 'hook'
  | 'recall'
  | 'explain'
  | 'analogy'
  | 'board_write'
  | 'worked_example'
  | 'teacher_question'
  | 'student_try'
  | 'diagnosis'
  | 'mistake_warning'
  | 'summary'
  | 'transition'
  | 'self_check'

/** 画布元素聚焦目标 */
export interface FocusTarget {
  /** CSS 选择器定位元素（如 .mermaid-block, .formula-block, .markdown-renderer h2） */
  selector: string
  /** 聚焦视觉特效 */
  effect: 'pulse' | 'glow-border' | 'scale' | 'none'
  /** 滚动行为 */
  scroll: 'smooth' | 'auto' | 'none'
}

/** 画布内嵌弹题（中途检验理解） */
export interface InlineQuiz {
  id: string
  prompt: string
  answerType: 'text' | 'single_select' | 'multi_select' | 'number'
  options?: { label: string; value: string }[]
  correctAnswer?: string
  /** 提交后展示的讲解（答对/答错通用） */
  explanation?: string
  feedbackWhenCorrect?: string
  feedbackWhenWrong?: string
}

export interface TeachingVisualHint {
  type: 'formula' | 'diagram' | 'code' | 'table' | 'timeline' | 'mindmap' | 'text' | string
  content: string
}

export interface TeachingInteraction {
  type: 'pause' | 'single_select' | 'multi_select' | 'text_answer' | 'predict' | 'self_check' | string
  prompt: string
  options?: { label: string; value: string }[]
  correctAnswer?: string
  feedbackWhenCorrect?: string
  feedbackWhenWrong?: string
}

export type TeachingBoardBlockType =
  | 'markdown'
  | 'code'
  | 'formula'
  | 'list'
  | 'quote'
  | 'diagram'
  | 'callout'
  | 'structure'
  | 'trace'
  | 'complexity'
  | string

export interface TeachingBaseBoardBlock {
  id?: string
  type: TeachingBoardBlockType
  title?: string
  content?: string
  caption?: string
  tone?: 'info' | 'warning' | 'success' | 'error' | string
}

export interface TeachingCodeBoardBlock extends TeachingBaseBoardBlock {
  type: 'code' | string
  language?: string
  content?: string
  highlights?: number[]
  focusLine?: number
  errorLines?: number[]
  noteLines?: number[]
}

export interface TeachingStructureBoardBlock extends TeachingBaseBoardBlock {
  type: 'structure' | string
  structureType?: 'array' | 'stack' | 'queue' | 'linked_list' | 'tree' | 'heap' | 'graph' | string
  items?: unknown[]
  nodes?: unknown[]
  edges?: unknown[]
  pointers?: Record<string, number | string>
  activeIndices?: number[]
  activeIds?: string[]
  visitedIds?: string[]
  frontierIds?: string[]
  pathIds?: string[]
  compareIds?: string[]
  rootId?: string
  directed?: boolean
  layout?: 'tree' | 'heap' | 'circle' | 'layered' | string
}

export interface TeachingTraceBoardBlock extends TeachingBaseBoardBlock {
  type: 'trace' | string
  algorithm?: string
  items?: unknown[]
  activeIndices?: number[]
  processedRange?: [number, number]
  action?: 'compare' | 'swap' | 'insert' | 'delete' | 'visit' | 'mark' | string
  explanation?: string
}

export interface TeachingComplexityBoardBlock extends TeachingBaseBoardBlock {
  type: 'complexity' | string
  time?: string
  space?: string
  cases?: Array<{
    label: string
    value: string
    description?: string
  }>
  reason?: string
}

export type TeachingBoardBlock =
  | TeachingCodeBoardBlock
  | TeachingStructureBoardBlock
  | TeachingTraceBoardBlock
  | TeachingComplexityBoardBlock
  | TeachingBaseBoardBlock

/** 单个教学段（Agent 讲解的最小原子单元） */
export interface TeachingSegment {
  id: string
  type: TeachingSegmentType
  /** 老师真实说出口的话。TTS 启用后应优先播报该字段。 */
  teacherTalk?: string
  /** 黑板/画布上出现的精炼内容。 */
  boardContent?: string
  /** 结构化板书块。存在时前端优先按块类型渲染，boardContent 仅作为兼容兜底。 */
  boardBlocks?: TeachingBoardBlock[]
  /** markdown 内容（quiz/pause 段可为空） */
  markdown: string
  /** 本段教学设计意图，前端可作为弱提示展示。 */
  teachingIntent?: string
  emotionTone?: 'encourage' | 'serious' | 'curious' | 'warning' | 'summary' | string
  visualHint?: TeachingVisualHint
  interaction?: TeachingInteraction
  /** 需要聚焦/高亮的画布元素 */
  focusTarget?: FocusTarget
  /** type=quiz 时的题面 */
  quiz?: InlineQuiz
  /** 0=等待用户点击"继续"，>0=自动推进毫秒数 */
  autoAdvanceMs: number
  /** Agent 在右侧面板同步的"台词" */
  agentCommentary?: string
}

/** 教学流（一个 CanvasContent 内的分段序列） */
export interface TeachingFlow {
  segments: TeachingSegment[]
  currentSegmentIndex: number
  isActive: boolean
  isPaused: boolean
}

// ---- 教学时间轴（v3 Timeline Player）----

/** 时间轴时钟来源。无语音时使用 internal；接入 TTS 后由 audio.currentTime 驱动。 */
export type LessonClockSource = 'internal' | 'audio'

/** 教学时间轴 Cue 类型。保留通用动作，避免未来每加一种场景都改播放器核心。 */
export type LessonCueType =
  | 'segment_reveal'
  | 'scene_action'
  | 'speech'
  | 'subtitle'
  | 'text_reveal'
  | 'focus'
  | 'highlight'
  | 'underline'
  | 'draw'
  | 'pause'
  | 'quiz'
  | 'scene_change'

/** 时间轴中的最小可执行动作 */
export interface LessonCue {
  id: string
  type: LessonCueType
  startMs: number
  endMs?: number
  payload: Record<string, unknown>
}

/** 场景动作类型。它是动画生成协议的稳定层，不绑定具体渲染引擎。 */
export type LessonSceneActionType =
  | 'narration'
  | 'teacher_speak'
  | 'text_fade_in'
  | 'board_write'
  | 'formula_write'
  | 'formula_step_write'
  | 'diagram_trace'
  | 'focus_pulse'
  | 'quiz_mount'
  | 'ask_question'
  | 'wait_student'
  | 'show_mistake'
  | 'correct_mistake'
  | 'summary_pin'

/** 时间轴驱动的场景动作。后续可映射到 Canvas、Manim、视频或字幕生成。 */
export interface LessonSceneAction {
  actionId: string
  actionType: LessonSceneActionType | string
  targetType?: 'segment' | 'formula' | 'diagram' | 'quiz' | 'canvas' | string
  targetId?: string
  layer?: 'content' | 'overlay' | 'agent' | string
  startMs: number
  durationMs: number
  instruction?: string
  payload?: Record<string, unknown>
}

/** 单个教学场景的播放时间轴 */
export interface LessonTimeline {
  id: string
  sceneId: string
  clockSource: LessonClockSource
  audioUrl?: string
  durationMs: number
  cues: LessonCue[]
  metadata?: Record<string, unknown>
}

/** Timeline 播放器状态 */
export interface TimelinePlayerState {
  status: 'idle' | 'ready' | 'playing' | 'paused' | 'waiting_user' | 'ended'
  currentTimeMs: number
  playbackRate: number
  activeTimelineId: string | null
  firedCueIds: Set<string>
}

/** 后端返回的当前教学场景。content 第一阶段仍可为空，由前端兼容 mock 渲染。 */
export interface StudyScene {
  sceneId: string
  sceneType: CanvasType | string
  stepId: string
  content: Record<string, unknown>
}

/** 后端学习会话 VO */
export interface StudySessionVO {
  sessionId: string
  lessonBundleId: string
  userId?: string
  taskId: string
  pathNodeId?: string | null
  spaceId?: string | null
  mode: StudyMode
  status: 'created' | 'active' | 'paused' | 'completed' | 'abandoned' | string
  currentStepId: string
  currentScene?: StudyScene
  currentTimeline?: LessonTimeline
  scriptSteps: ScriptStep[]
  scenesByStepId?: Record<string, StudyScene>
  timelinesByStepId?: Record<string, LessonTimeline>
  mastery?: MasteryJudge
}

export interface CompleteStudySessionRequest {
  actualMinutes?: number
  focusLevel?: number
  mood?: number
  selfRating?: number
  notes?: string
  payload?: Record<string, unknown>
}

export interface StudySessionCompleteVO {
  sessionId: string
  status: 'completed' | string
  actualMinutes: number
  completedSteps: number
  totalSteps: number
  masteryLevel?: MasteryLevel | string
  nextSuggestion?: string
  summary?: Record<string, unknown>
}

/** 学习过程事件类型。后端第一版只接收和记录，后续 TeachingPolicy 基于这些事件做决策。 */
export type StudyEventType =
  | 'session_started'
  | 'step_entered'
  | 'step_completed'
  | 'timeline_cue_played'
  | 'pause_clicked'
  | 'resume_clicked'
  | 'feedback_clicked'
  | 'quiz_answered'
  | 'custom_message_submitted'
  | 'session_completed'

export interface StudyEventRequest {
  eventType: StudyEventType
  targetType?: string
  targetId?: string
  clientTimeMs?: number
  timelineTimeMs?: number
  currentStepId?: string
  currentTimelineId?: string
  payload?: Record<string, unknown>
}

export interface StudyEventReceipt {
  eventId: string
  sessionId: string
  eventType: StudyEventType | string
  status: 'accepted' | string
  acceptedAtMs: number
  actions?: StudyTeachingAction[]
}

export type StudyTeachingActionType =
  | 'agent_reply'
  | 'append_agent_note'
  | 'mark_current_step_skipped'
  | 'insert_timeline_patch'

export interface StudyTeachingAction {
  actionId: string
  actionType: StudyTeachingActionType | string
  sceneType?: string
  reason?: string
  payload: Record<string, unknown>
}

export interface StudyTeachingActionStatusRequest {
  status: 'applied' | 'failed' | 'pending'
  errorMessage?: string
  payload?: Record<string, unknown>
}

/** 弹题回答状态 */
export interface QuizState {
  quizId: string
  userAnswer: string
  correct: boolean
  answered: boolean
  explanation?: string
}

/** 掌握判断等级 */
export type MasteryLevel = 'mastered' | 'progressing' | 'weak' | 'unknown'

/** 掌握判断结果（底部进度反馈） */
export interface MasteryJudge {
  level: MasteryLevel
  /** 等级中文标签 */
  levelLabel: string
  /** Agent 判断依据 */
  hint: string
  /** 下一步建议 */
  nextSuggestion: string
}

/** Agent 陪伴面板反馈类型 */
export type FeedbackType =
  | 'dont_understand'  // 没看懂
  | 'slower'           // 讲慢一点
  | 'another_example'  // 换个例子
  | 'draw_diagram'     // 画图解释
  | 'similar_question' // 出一道类似题
  | 'already_mastered' // 我已经会了
  | 'add_review'       // 加入复习
  | 'skip'             // 跳过这个知识点

/** Agent 陪伴面板聊天消息 */
export interface StudyChatMessage {
  id: string
  role: 'user' | 'agent'
  text: string
  /** markdown 标记 */
  markdown?: boolean
  createTime: number
}

/** 学习会话整体状态（mock 阶段在 taskStepStore 内管理） */
export interface StudySessionState {
  taskId: string
  spaceId: string | null
  mode: StudyMode
  scriptSteps: ScriptStep[]
  currentIndex: number
  canvasContent: CanvasContent
  mastery: MasteryJudge
  chatMessages: StudyChatMessage[]
}
