/**
 * 学习周报相关类型定义
 * 对应后端接口：GET /learning-report/weekly（待接入）
 */

/** 风险等级 */
export type RiskLevel = 'high' | 'medium' | 'low'

/** 算法依据分节 key */
export type EvidenceKey = 'mastery' | 'weakness' | 'adjustments' | 'review'

/** 顶部指标卡 */
export interface ReportMetric {
  label: string
  value: string
}

/** 掌握度趋势点 */
export interface TrendPoint {
  day: string
  value: number
}

/** 知识点掌握变化 */
export interface MasteryItem {
  name: string
  start: number
  current: number
  delta: number
}

/** 薄弱点 */
export interface WeaknessItem {
  rank: string
  name: string
  reason: string
  count: number
  trend: string
  risk: RiskLevel
}

/** 错因解释 */
export interface CauseItem {
  title: string
  desc: string
}

/** 系统智能调整时间线条目 */
export interface AdjustmentItem {
  time: string
  title: string
  action: string
  status: string
}

/** 复习风险条目 */
export interface ReviewRiskItem {
  name: string
  risk: RiskLevel
  advice: string
  status: string
}

/** 评级项 */
export interface GradeItem {
  label: string
  value: string
}

/** 算法依据单项 */
export interface EvidenceItem {
  label: string
  value: string
}

/** 算法依据分节 */
export interface EvidenceSection {
  title: string
  items: EvidenceItem[]
}

/** 周报完整数据 */
export interface WeeklyLearningReport {
  studentName: string
  range: string
  mainConclusion: string
  metrics: ReportMetric[]
  trend: TrendPoint[]
  mastery: MasteryItem[]
  weaknesses: WeaknessItem[]
  causes: CauseItem[]
  adjustments: AdjustmentItem[]
  reviewRisks: ReviewRiskItem[]
  nextWeek: string[]
  nextWeekSummary: string
  agentSummary: string
  grades: GradeItem[]
}

/** 算法依据映射 */
export type EvidenceMap = Record<EvidenceKey, EvidenceSection>

/** 接口返回结构 */
export interface WeeklyReportResponse {
  report: WeeklyLearningReport
  evidenceMap: EvidenceMap
}
