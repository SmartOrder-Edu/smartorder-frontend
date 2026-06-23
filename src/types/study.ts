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
  stepId?: string
  source?: StudyEntrySource
}

/** 学习脚本阶段类型（对应方案 6 阶段） */
export type ScriptPhaseType =
  | 'review'       // 1.回顾前置概念
  | 'example'      // 2.动态例子
  | 'practice'     // 3.跟做例题
  | 'assessment'   // 4.掌握判断
  | 'advanced'     // 5.提高或补基础
  | 'summary'      // 6.总结与画像更新

/** 学习脚本步骤（比 TaskStep 更细粒度的教学脚本） */
export interface ScriptStep {
  id: string
  phase: ScriptPhaseType
  title: string
  subtitle: string
  estimatedMinutes: number
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  /** 该步骤在画布上的渲染提示，驱动 CanvasContent 模板 */
  canvasType: CanvasType
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
}

// ---- 分段式教学流（v2 Agent 主动教学交互）----

/** 教学段类型 */
export type TeachingSegmentType = 'text' | 'formula' | 'diagram' | 'quiz' | 'pause'

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
}

/** 单个教学段（Agent 讲解的最小原子单元） */
export interface TeachingSegment {
  id: string
  type: TeachingSegmentType
  /** markdown 内容（quiz/pause 段可为空） */
  markdown: string
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
