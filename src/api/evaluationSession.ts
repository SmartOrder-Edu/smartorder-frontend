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
  totalScore: number
  actualScore: number
  accuracy: number
  masterySummary?: Record<string, unknown>
  weakPoints?: Array<Record<string, unknown>>
  strongPoints?: Array<Record<string, unknown>>
  learningSuggestions?: Array<Record<string, unknown>>
  reportContent?: string
  generatedBy?: string
  createdAt?: string
}

/** 获取试卷题目列表 */
export function fetchSessionQuestions(sessionId: number) {
  return request.get<EvaluationQuestion[]>(`/evaluation/session/${sessionId}/questions`)
}

/** 开始答题 */
export function startSession(sessionId: number) {
  return request.put<void>(`/evaluation/session/${sessionId}/start`)
}

/** 提交全部答案 */
export function submitAnswers(sessionId: number, payload: SubmitAnswersPayload) {
  return request.post<SessionResultVO>(`/evaluation/session/${sessionId}/submit`, payload)
}

/** 查看判分结果 */
export function getSessionResult(sessionId: number) {
  return request.get<SessionResultVO>(`/evaluation/session/${sessionId}/result`)
}

/** 查看学习报告 */
export function getSessionReport(sessionId: number) {
  return request.get<SessionReportVO>(`/evaluation/session/${sessionId}/report`)
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
