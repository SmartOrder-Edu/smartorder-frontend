import request from './request'
import type { EvaluationQuestion } from './evaluationQuestion'
import type { TaskSubmitResultVO, SubmitTaskPayload } from './task'

export interface AnswerItem {
  questionId: number
  userAnswer: Record<string, unknown>
  answerDurationSeconds?: number
  usedHint?: number
}

export interface SubmitAnswersPayload {
  answers: AnswerItem[]
}

export interface AnswerDetailVO {
  questionId: number
  isCorrect: boolean | null
  score: number
  status: 'graded' | 'pending_review'
  userAnswer?: Record<string, unknown>
  judgeResult?: Record<string, unknown>
}

export interface SessionResultVO {
  sessionId: number
  totalScore: number
  actualScore: number
  accuracy: number
  objectiveScore: number
  objectiveTotal: number
  subjectivePending: number
  detail: AnswerDetailVO[]
}

export interface SessionReportVO {
  sessionId: number
  reportId: number
  title: string
  reportType: string
  status?: 'not_started' | 'waiting_grading' | 'generating' | 'ready' | 'failed' | string
  message?: string
  pendingCount?: number
  errorMessage?: string
  totalScore: number
  actualScore: number
  accuracy: number
  masterySummary?: Record<string, unknown>
  weakPoints?: Array<Record<string, unknown>>
  strongPoints?: Array<Record<string, unknown>>
  abilityEvaluation?: Record<string, unknown>
  learningSuggestions?: Array<Record<string, unknown>>
  nextRecommendationJson?: Record<string, unknown>
  reportContent?: string
  generatedBy?: string
  createdAt?: string
  finishedAt?: string
}

/** 获取试卷题目列表 */
export function fetchSessionQuestions(sessionId: number | string) {
  return request.get<EvaluationQuestion[]>(`/evaluation/session/${sessionId}/questions`)
}

/** 开始答题 */
export function startSession(sessionId: number | string) {
  return request.put<void>(`/evaluation/session/${sessionId}/start`)
}

/** 提交全部答案 */
export function submitAnswers(sessionId: number | string, payload: SubmitAnswersPayload) {
  return request.post<SessionResultVO>(`/evaluation/session/${sessionId}/submit`, payload)
}

/** 查看判分结果 */
export function getSessionResult(sessionId: number | string) {
  return request.get<SessionResultVO>(`/evaluation/session/${sessionId}/result`)
}

/** 查看学习报告 */
export function getSessionReport(sessionId: number | string) {
  return request.get<SessionReportVO>(`/evaluation/session/${sessionId}/report`)
}

// ======================== 自动保存与草稿恢复 ========================

export interface DraftAnswerVO {
  questionId: number
  userAnswer: Record<string, unknown>
  updatedAt: string
}

/** 保存答题进度（草稿，不判分） */
export function saveProgress(sessionId: number | string, payload: SubmitAnswersPayload) {
  return request.post<void>(`/evaluation/session/${sessionId}/save-progress`, payload)
}

/** 获取草稿答案（用于恢复答题进度） */
export function fetchDraftAnswers(sessionId: number | string) {
  return request.get<DraftAnswerVO[]>(`/evaluation/session/${sessionId}/draft`)
}

// ======================== 直接提交（无 session，任务模式） ========================

/** 直接提交测评答案（无需预先创建 session） */
export function submitExamAnswers(taskId: number, spaceId: number, payload: SubmitTaskPayload) {
  return request.post<TaskSubmitResultVO>('/evaluation/submit', payload, {
    params: { taskId, spaceId }
  })
}

/** 查询测评判分结果（主观题轮询） */
export function getExamResult(taskId: number) {
  return request.get<TaskSubmitResultVO>('/evaluation/result', { params: { taskId } })
}
