import request from './request'
import type { AnswerItem } from './evaluationSession'

/** 任务提交判分结果（与 SessionResultVO 结构相同，使用 taskId） */
export interface TaskSubmitResultVO {
  taskId: number
  totalScore: number
  actualScore: number
  accuracy: number
  objectiveScore: number
  objectiveTotal: number
  subjectivePending: number
  detail: TaskAnswerDetailVO[]
}

export interface TaskAnswerDetailVO {
  questionId: number
  isCorrect: boolean | null
  score: number
  status: 'graded' | 'pending_review'
  userAnswer?: Record<string, unknown>
  judgeResult?: Record<string, unknown>
}

/** 提交任务答案 payload */
export interface SubmitTaskPayload {
  answers: AnswerItem[]
}

/**
 * 提交任务（含答案）
 * @param taskId 任务ID
 * @param payload 答案数据
 */
export function submitTask(taskId: number, payload: SubmitTaskPayload) {
  return request.post<TaskSubmitResultVO>(`/tasks/${taskId}/submit`, payload)
}

/**
 * 查询任务判分结果（轮询主观题判分进度）
 * @param taskId 任务ID
 */
export function getTaskResult(taskId: number) {
  return request.get<TaskSubmitResultVO>(`/tasks/${taskId}/result`)
}
