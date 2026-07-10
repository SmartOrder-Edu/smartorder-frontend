import { fetchEventSource } from '@microsoft/fetch-event-source'
import { refreshAccessToken } from './request'
import request from './request'

export type QuestionTypeCode =
  | 'single_choice'
  | 'multiple_choice'
  | 'fill_blank'
  | 'judge'
  | 'short_answer'
  | 'code'
  | 'scenario'
  | 'sql'
  | 'multimodal'

export interface QuestionTypeCountConfig {
  questionType: QuestionTypeCode
  count: number
  difficulty: number
  optionCount?: number
  sort?: number
}

export interface GenerateQuestionPayload {
  learningSpaceId: string
  chapterId?: string
  knowledgePointId?: string
  courseName?: string
  topic?: string
  questionTypeCountList: QuestionTypeCountConfig[]
}

export interface QuestionGenerationJobCreatedEvent {
  jobId: string
  jobNo: string
  totalCount: number
  description?: string
}

export interface QuestionGenerationTokenEvent {
  jobId: string
  questionType: QuestionTypeCode
  chunk: string
}

export interface SessionCreatedEvent {
  sessionId: string
  title: string
  totalQuestionCount: number
  totalScore: number
}

export interface EvaluationQuestion {
  id: string
  questionCode?: string
  learningSpaceId?: string
  chapterId?: string
  knowledgePointId?: string
  questionType: QuestionTypeCode | string
  questionTypeName?: string
  sortOrder?: number
  difficulty?: number
  score?: number
  abilityDimension?: string
  stem: string
  /** 选项列表，对应后端 VO options 字段 */
  options?: Array<Record<string, unknown>>
  /** 标准答案，对应后端 VO correctAnswer 字段 */
  correctAnswer?: Record<string, unknown>
  standardAnswer?: unknown
  explanation?: string
  /** 常见错误分析，对应后端 VO commonMistakes 字段 */
  commonMistakes?: Array<Record<string, unknown>>
  /** 标签列表，对应后端 VO tags 字段 */
  tags?: string[]
  /** v2 新增：知识点标签 */
  knowledgePoints?: string[]
  /** v2 新增：能力标签 */
  abilityTags?: string[]
  /** v2 新增：题目分析（correct_reason + wrong_reason） */
  analysis?: Record<string, unknown>
  generationSource?: string
  status?: number
  createdAt?: string
  updatedAt?: string
}

export interface EvaluationSession {
  id: string
  userId: string
  learningSpaceId: string
  topic: string
  chapterId?: string
  description?: string
  targetKnowledgePoints?: string[]
  questionIds?: string[]
  difficultyDistribution?: Record<string, unknown>
  abilityDistribution?: Record<string, unknown>
  totalQuestionCount: number
  answeredCount: number
  totalScore?: number
  actualScore?: number
  accuracy?: number
  status: string // 'todo' | 'doing' | 'finished' | 'error'
  agentStrategyJson?: Record<string, unknown>
  startedAt?: string
  finishedAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface StreamQuestionGenerationHandlers {
  signal?: AbortSignal
  onJobCreated?: (payload: QuestionGenerationJobCreatedEvent) => void
  onToken?: (payload: QuestionGenerationTokenEvent) => void
  onSessionCreated?: (payload: SessionCreatedEvent) => void
}

function parsePayload<T>(data: string): T | null {
  try {
    return JSON.parse(data) as T
  } catch {
    return null
  }
}

export async function streamGenerateQuestions(
  payload: GenerateQuestionPayload,
  handlers: StreamQuestionGenerationHandlers = {}
) {
  const base = import.meta.env.VITE_API_BASE_URL || '/api'
  const token = await refreshAccessToken()

  await fetchEventSource(`${base}/evaluation/questions/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload),
    openWhenHidden: true,
    signal: handlers.signal,

    onopen(response) {
      if (!response.ok) {
        throw new Error(`题库生成请求失败：${response.status}`)
      }
      return Promise.resolve()
    },

    onmessage(event) {
      if (!event.data) return

      if (event.event === 'job-created' || event.event === 'question_job_start') {
        const data = parsePayload<QuestionGenerationJobCreatedEvent>(event.data)
        if (data) handlers.onJobCreated?.(data)
        return
      }

      if (event.event === 'session-created') {
        const data = parsePayload<SessionCreatedEvent>(event.data)
        if (data) handlers.onSessionCreated?.(data)
        return
      }

      if (event.event === 'quiz-token' || event.event === 'message' || !event.event) {
        const data = parsePayload<QuestionGenerationTokenEvent>(event.data)
        if (data) handlers.onToken?.(data)
        return
      }

      const data = parsePayload<QuestionGenerationTokenEvent>(event.data)
      if (data?.chunk && data?.questionType) {
        handlers.onToken?.(data)
      }
    }
  })
}

export function fetchEvaluationQuestions(params?: { learningSpaceId?: string; limit?: number; taskId?: string }) {
  return request.get<EvaluationQuestion[]>('/evaluation/questions', { params })
}

export function fetchEvaluationTasks(params?: { learningSpaceId?: string }) {
  return request.get<EvaluationSession[]>('/evaluation/questions/task', { params })
}
