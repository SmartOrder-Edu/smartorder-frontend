/**
 * Profile page local type definitions
 * Complements the API types from @/api/studentProfile
 */

/** 核心指标 */
export interface HeroMetric {
  key: string
  label: string
  value: string
  icon: string
  color: string
  bg: string
  trend?: string
  trendUp?: boolean | null
}

/** 画像概览 Hero 数据 */
export interface HeroData {
  name: string
  avatar: string
  identity: string
  direction: string
  level: string
  goal: string
  weeklyMinutes: number
  overallMastery: number
  overallLevel: string
}

/** 学习目标 */
export interface GoalProgressItem {
  id: string
  name: string
  description: string
  percent: number
  color: string
  status: string
  priority: string
}

/** 雷达图维度 */
export interface RadarDimension {
  name: string
  score: number
}

/** 学科掌握度 */
export interface SubjectBarItem {
  name: string
  mastery: number
  lastTestTime: string
  trend: 'up' | 'down' | 'stable'
}

/** 学习偏好环形图项 */
export interface PreferenceItem {
  name: string
  value: number
}

/** 错题项 */
export interface MistakeItem {
  id: string
  name: string
  percent: number
  color: string
  count: number
  lastObserved?: string
  recommendation?: string
}

/** 当前学习状态 */
export interface CurrentStatus {
  icon: string
  name: string
  description: string
  focusLevel: number
  bestStudyTime: string
}

/** 学习建议 */
export interface LearningSuggestion {
  icon: string
  title: string
  description: string
  actionLabel: string
  actionLink?: string
}

/** 元认知维度 */
export interface MetacognitiveItem {
  name: string
  value: number
  level: string
  description: string
  trend: string
}

/** 知识点分布 */
export interface KnowledgeDistribution {
  mastered: number
  basic: number
  weak: number
  unlearned: number
  total: number
}

/** 薄弱知识点项 */
export interface WeakKnowledgeItem {
  id: string
  name: string
  subject: string
  percent: number
}

/** 热力图数据点 */
export interface HeatmapPoint {
  rowIndex: number
  colIndex: number
  value: number
}

/** 学习趋势数据 */
export interface TrendData {
  dates: string[]
  values: number[]
}

/** 阶段学习总结 */
export interface StageSummary {
  period: string
  totalHours: number
  completedTasks: number
  accuracy: number
  improvement: number
  highlights: string[]
}

/** 学习路径步骤 */
export interface PathStep {
  label: string
  status: 'completed' | 'in_progress' | 'pending'
  percent: number
}

/** 推荐资源 */
export interface RecommendedResource {
  id: string
  title: string
  type: string
  duration: string
  difficulty: string
  matchReason: string
}

/** 路径快照节点 */
export interface PathSnapshotNode {
  id: string
  label: string
  status: 'completed' | 'in_progress' | 'pending'
  children?: PathSnapshotNode[]
}
