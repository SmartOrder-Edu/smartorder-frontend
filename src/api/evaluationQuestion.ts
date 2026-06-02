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
  learningSpaceId: number
  chapterId?: number
  knowledgePointId?: number
  courseName?: string
  topic?: string
  questionTypeCountList: QuestionTypeCountConfig[]
}

export interface QuestionGenerationJobCreatedEvent {
  jobId: number
  jobNo: string
  totalCount: number
  description?: string
}

export interface QuestionGenerationTokenEvent {
  jobId: number
  questionType: QuestionTypeCode
  chunk: string
}

export interface EvaluationQuestion {
  id: number
  questionCode?: string
  learningSpaceId?: number
  chapterId?: number
  knowledgePointId?: number
  questionType: QuestionTypeCode | string
  questionTypeName?: string
  difficulty?: number
  score?: number
  abilityDimension?: string
  stem: string
  optionsJson?: Array<Record<string, unknown>>
  answerJson?: Record<string, unknown>
  standardAnswer?: unknown
  explanation?: string
  tagsJson?: string[]
  generationSource?: string
  status?: number
  createdAt?: string
  updatedAt?: string
}

export interface StreamQuestionGenerationHandlers {
  signal?: AbortSignal
  onJobCreated?: (payload: QuestionGenerationJobCreatedEvent) => void
  onToken?: (payload: QuestionGenerationTokenEvent) => void
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

export function fetchEvaluationQuestions(params?: { learningSpaceId?: number; limit?: number }) {
  return request.get<EvaluationQuestion[]>('/evaluation/questions', { params })
}
