// ============================================================
// 学习空间相关类型定义 — 全局唯一类型源
// ============================================================

import type { LearningSpaceType, LearningSpaceStatus, LearningSpaceVO } from '@/api/learningSpace'

// Re-export from api/learningSpace for convenience
export type { LearningSpaceType, LearningSpaceStatus, LearningSpaceVO }

// ---- Risk & Progress ----

export type RiskStatus = 'good' | 'normal' | 'warning' | 'danger'

export interface PathProgress {
  completedNodes: number
  totalNodes: number
  currentNodeId: number | null
  percent: number
}

// ---- Task ----

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'
export type TaskType = 'daily' | 'milestone' | 'exam' | 'review'

export interface TaskVO {
  id: number
  spaceId: number
  pathNodeId: number | null
  title: string
  description: string
  taskType: TaskType
  priority: number // 1-5
  status: TaskStatus
  dueDate: string
  dueTime: string | null
  estimatedDurationMinutes: number | null
  actualDurationMinutes: number | null
  completedAt: string | null
  aiSuggestion: string | null
  isOverdue: boolean
  isToday: boolean
  metadata: Record<string, any>
}

// ---- Learning Path ----

export type PathNodeType = 'module' | 'stage' | 'objective' | 'knowledge_point'
export type PathNodeStatus = 'completed' | 'current' | 'locked'
export type EdgeType = 'prerequisite_of' | 'recommended_before'

export interface PathNodeVO {
  id: number
  spaceId: number
  title: string
  description: string
  nodeType: PathNodeType
  estimatedDurationMinutes: number
  difficultyLevel: string
  sortOrder: number
  isMilestone: boolean
  status: PathNodeStatus
}

export interface PathEdgeVO {
  id: number
  fromNodeId: number
  toNodeId: number
  edgeType: EdgeType
}

// ---- Resource ----

export type ResourceType =
  | 'ppt' | 'doc' | 'video' | 'mind_map' | 'quiz'
  | 'case_study' | 'flashcard_set' | 'image' | 'audio' | 'link'
export type ResourceSource = 'ai' | 'user' | 'curated'

export interface ResourceVO {
  id: number
  spaceId: number
  pathNodeId: number | null
  taskId: number | null
  title: string
  description: string
  resourceType: ResourceType
  url: string
  isAiGenerated: boolean
  source: ResourceSource
}

// ---- Learning Record ----

export interface LearningRecordVO {
  id: number
  recordDate: string // YYYY-MM-DD
  studyDurationMinutes: number
  tasksCompleted: number
  tasksPlanned: number
  focusLevel: number // 1-5
  mood: string | null
  selfRating: number | null
  aiReflection: string | null
}

// ---- Task Step (for Study Execution) ----

export type StepType = 'learn' | 'practice' | 'review' | 'rest'
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

export interface TaskStepVO {
  id: number
  taskId: number
  title: string
  description: string
  stepType: StepType
  content: string // markdown
  estimatedMinutes: number
  actualMinutes: number | null
  status: StepStatus
  sortOrder: number
  resourceId: number | null
}

// ---- Agent Action ----

export type AgentActionStatus = 'pending' | 'running' | 'success' | 'failed' | 'waiting_user_confirm'

export interface AgentActionVO {
  id: number
  agentType: string
  actionType: string
  targetType: string
  targetId: number | null
  reason: string
  status: AgentActionStatus
  createTime: string
}

// ---- Space Dashboard (aggregated) ----

export interface SpaceDashboardVO {
  space: LearningSpaceVO
  currentGoal: string
  todayTasks: TaskVO[]
  pendingTasks: TaskVO[]
  overdueTasks: TaskVO[]
  pathNodes: PathNodeVO[]
  pathEdges: PathEdgeVO[]
  pathProgress: PathProgress
  resources: ResourceVO[]
  recentRecords: LearningRecordVO[]
  agentInsight: string
  riskStatus: RiskStatus
  streakDays: number
  progress: number
  recentAgentActions: AgentActionVO[]
  daysRemaining: number
}

// ---- Space List (enhanced) ----

export interface LearningSpaceListVO extends LearningSpaceVO {
  todayTaskCount: number
  streakDays: number
  riskStatus: RiskStatus
  agentInsight: string
  progress: number
}

// ---- Daily Plan ----

export interface DailyTaskItem extends TaskVO {
  spaceName: string
  spaceType: LearningSpaceType
}

export interface SpaceDailySummary {
  spaceId: number
  spaceName: string
  spaceType: LearningSpaceType
  color: string
  todayTasks: TaskVO[]
  streakDays: number
  agentSuggestion: string
  riskStatus: RiskStatus
}

export interface DailyPlanVO {
  date: string
  yesterdaySummary: string
  yesterdayTasksCompleted: number
  yesterdayTasksPlanned: number
  yesterdayStudyMinutes: number
  tasks: DailyTaskItem[]
  agentAdjustments: string
  spaceSummaries: SpaceDailySummary[]
}
