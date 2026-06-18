// ============================================================
// Plan-and-Execute 相关类型定义 — 与后端 DTO 对齐
// ============================================================

/** 任务门控类型 */
export type GateType = 'NORMAL' | 'CLARIFICATION' | 'CONFIRMATION'

/** 任务风险等级 */
export type RiskLevel = 'READ' | 'WRITE_DRAFT' | 'WRITE_CONFIRMED'

/** 任务项状态 */
export type TaskItemStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'PAUSED'

/** 计划整体状态 */
export type TaskListStatus =
  | 'DRAFT'
  | 'PENDING_CONFIRM'
  | 'WAITING_CONFIRMATION'
  | 'EXECUTING'
  | 'PAUSED_CLARIFICATION'
  | 'PAUSED_CONFIRMATION'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

/** 单个计划任务项 — 对应后端 TaskItem DTO */
export interface TaskItem {
  /** 任务ID，格式 task-1, task-2 ... */
  taskId: string
  /** 任务描述 */
  description: string
  /** 需要的工具列表 */
  requiredTools: string[]
  /** 依赖的前置任务ID列表 */
  dependsOn: string[]
  /** 门控类型 */
  gate: GateType
  /** 风险等级 */
  riskLevel: RiskLevel
  /** 预期输出 */
  expectedOutput: string
  /** 当前状态 */
  status: TaskItemStatus
  /** 执行结果摘要 */
  resultSummary: string
  /** 错误信息 */
  errorMessage: string
  /** 重试次数 */
  retryCount: number
}

/** 任务列表（计划）— 对应后端 TaskList DTO */
export interface TaskList {
  /** 用户原始目标 */
  userGoal: string
  /** 计划ID */
  planId: string
  /** 所有任务（拓扑排序后） */
  tasks: TaskItem[]
  /** 计划状态 */
  status: TaskListStatus
  /** 当前执行到的任务索引 */
  currentTaskIndex: number
  /** 已完成任务输出 key=taskId, value=结果摘要 */
  taskOutputs: Record<string, string>
  /** 创建时间 */
  createdAt: number
  /** 澄清问题（PAUSED_CLARIFICATION 时填写） */
  clarificationQuestion: string
  /** 确认草稿ID（PAUSED_CONFIRMATION 时填写） */
  confirmationDraftId: string
  /** 学习空间创建成功后返回的信息 */
  spaceCreated?: {
    spaceId: number
    spaceName: string
  }
}

/** 任务执行状态（前端扩展，用于跟踪实时执行细节） */
export interface TaskExecutionState {
  /** 原始 TaskItem */
  taskItem: TaskItem
  /** 简化的状态（与 TaskItemStatus 对齐，额外支持 paused） */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'paused'
  /** 执行结果摘要 */
  resultSummary?: string
  /** 错误信息 */
  errorMessage?: string
  /** 重试计数 */
  retryCount: number
  /** 当前任务的 ReAct 推理过程 */
  reasoningSegments: import('@/stores/agent').ReasoningSegment[]
  /** 当前任务的思考文本 */
  thinkText: string
  /** 开始时间 */
  startedAt?: number
  /** 完成时间 */
  completedAt?: number
}

/** Gate 暂停原因 */
export type PauseReason = 'CLARIFICATION' | 'CONFIRMATION'

/** 澄清答案类型 */
export type ClarificationAnswerType = 'TEXT' | 'SINGLE_SELECT' | 'MULTI_SELECT' | 'NUMBER'

/** 澄清选项 */
export interface ClarificationOption {
  label: string
  value: string
}

/** 结构化澄清信息 —— PLAN_PAUSED SSE 事件中的 clarification 字段 */
export interface ClarificationInfo {
  /** 澄清记录唯一 ID */
  clarificationId: string
  /** 槽位标识 (如 target_scope, current_level) */
  slotKey: string
  /** 向用户提出的问题 */
  question: string
  /** 答案类型：TEXT | SINGLE_SELECT | MULTI_SELECT | NUMBER */
  answerType: ClarificationAnswerType
  /** 选项列表（仅 SELECT 类型有值） */
  options?: ClarificationOption[]
  /** 槽位优先级（数字越小越先问） */
  slotPriority: number
}

/** 暂停信息 */
export interface PlanPauseInfo {
  /** 暂停原因 */
  reason: PauseReason
  /** 暂停的任务ID */
  taskId: string
  /** 暂停时的问题 */
  question: string
  /** 结构化澄清信息（仅 reason=CLARIFICATION 时有值） */
  clarification?: ClarificationInfo
}

// ============================================================
// LEARNING_PLAN 草稿类型 — 用户审阅用
// ============================================================

/** 学习计划草稿（用户审阅用，非 Agent 执行计划） */
export interface LearningPlanDraft {
  draftId: string
  spaceName: string
  type: string
  description: string
  goals: string[]
  startDate: string
  targetEndDate: string
  phases: PhaseInfo[]
  knowledgeGraph: KnowledgeGraphInfo
}

export interface PhaseInfo {
  phaseIndex: number
  phaseName: string
  knowledgePoints: string[]
  weeks: number
  resources: ResourceInfo[]
}

export interface ResourceInfo {
  resourceType: string
  title: string
}

export interface KnowledgeGraphInfo {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
}

export interface KnowledgeNode {
  name: string
  description: string
  category: string
  importance: number
}

export interface KnowledgeEdge {
  from: string
  to: string
  type: string
}
