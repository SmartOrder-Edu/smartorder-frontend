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
  currentNodeId: string | null
  percent: number
}

// ---- Task ----

export type TaskStatus = 'pending' | 'in_progress' | 'doing' | 'completed' | 'overdue' | 'cancelled'
export type TaskType = 'daily' | 'milestone' | 'exam' | 'review' | 'remedial' | 'project'
export type TaskActionType =
  | 'learn_script'
  | 'read_resource'
  | 'watch_video'
  | 'practice_set'
  | 'assessment'
  | 'mistake_review'
  | 'project_practice'
  | 'summary_reflection'
export type TaskTargetType =
  | 'lesson_bundle'
  | 'resource'
  | 'practice_session'
  | 'assessment_session'
  | 'knowledge_node'
  | 'path_node'
  | string

export interface TaskVO {
  id: string
  spaceId: string
  pathNodeId: string | null
  title: string
  description: string
  taskType: TaskType
  actionType?: TaskActionType
  targetType?: TaskTargetType | null
  targetId?: string | number | null
  priority: number // 1-5
  status: TaskStatus
  dueDate: string
  dueTime: string | null
  estimatedDurationMinutes: number | null
  actualDurationMinutes: number | null
  completedAt: string | null
  aiSuggestion: string | null
  agentReason?: string | null
  isOverdue: boolean
  isToday: boolean
  spaceName?: string
  metadata: string | Record<string, any> | null
}

// ---- Learning Path ----

export type PathNodeType = 'module' | 'stage' | 'objective' | 'knowledge_point'
export type PathNodeStatus = 'completed' | 'current' | 'locked'
export type EdgeType = 'prerequisite_of' | 'recommended_before' | 'contains'

export interface PathNodeVO {
  id: string
  spaceId: string
  parentNodeId: string | null
  kpUid: string | null
  title: string
  description: string
  nodeType: PathNodeType
  estimatedDurationMinutes: number | null
  plannedDurationDays: number | null
  difficultyLevel: string
  sortOrder: number
  isMilestone: boolean
  status: PathNodeStatus
}

export interface PathEdgeVO {
  id: string
  spaceId: string
  fromNodeId: string
  toNodeId: string
  edgeType: EdgeType
}

// ---- Resource ----

export type ResourceType =
  | 'ppt' | 'doc' | 'html' | 'video' | 'mind_map' | 'quiz'
  | 'animation_video' | 'case_study' | 'flashcard_set' | 'image' | 'audio' | 'link'
export type ResourceSource = 'ai' | 'user' | 'curated'
export type ResourceStatus = 'planned' | 'generating' | 'generated' | 'failed'
export type ResourceGenerationJobStatus = 'pending' | 'generating' | 'generated' | 'failed'

export interface ResourceVO {
  id: string
  spaceId: string
  pathNodeId: string | null
  taskId: string | null
  title: string
  description: string
  resourceType: ResourceType
  url: string
  fileFormat?: string
  coverUrl?: string
  isAiGenerated: boolean
  source: ResourceSource
  status?: ResourceStatus
  metadata?: string
  agentReason?: string
  knowledgePoint?: string
  studyScenario?: string
}

export interface ResourcePackageGenerateDTO {
  taskId?: string | null
  pathNodeId?: string | null
  knowledgePoint?: string
  resourceTypes?: ResourceType[]
  userIntent?: string
  packageMode?: 'task' | 'weakness' | 'review' | 'exam' | 'custom'
  targetMinutes?: number
}

export interface ResourcePackageVO {
  packageId: string
  spaceId: string
  taskId: string | null
  pathNodeId: string | null
  title: string
  reason: string
  knowledgePoint: string
  packageMode: string
  status: 'preview' | 'generating' | 'generated' | 'failed'
  resources: ResourceVO[]
  agentActions: AgentActionVO[]
}

export interface ResourceGenerationJobVO {
  id: string
  spaceId: string
  resourceId: string
  packageId: string | null
  resourceType: ResourceType
  title: string
  reason: string
  status: ResourceGenerationJobStatus
  retryCount: number
  errorMessage: string | null
  traceId: string | null
  createTime: string
  updateTime: string
}

export interface ResourceContentVO {
  id: string
  resourceId: string
  contentType: 'markdown' | 'html' | 'json' | 'external_link' | 'ppt_embed'
  content: string
  version: number
  status: string
  reviewResult: string | null
  createTime: string
  updateTime: string
}

export interface ResourceDetailVO {
  resource: ResourceVO
  content: ResourceContentVO | null
  spaceName: string
  taskTitle: string | null
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
  id: string
  taskId: string
  title: string
  description: string
  stepType: StepType
  content: string // markdown
  estimatedMinutes: number
  actualMinutes: number | null
  status: StepStatus
  sortOrder: number
  resourceId: string | null
}

// ---- Agent Action ----

export type AgentActionStatus = 'pending' | 'running' | 'success' | 'failed' | 'waiting_user_confirm'

export interface AgentActionVO {
  id: string
  agentType: string
  actionType: string
  targetType: string
  targetId: string | null
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
  spaceId: string
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
