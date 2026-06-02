import type { EvaluationQuestion } from '@/api/evaluationQuestion'

export interface NormalizedQuestionOption {
  label: string
  content: string
}

export function normalizeQuestionOptions(options?: Array<Record<string, unknown>>) {
  if (!Array.isArray(options)) return []

  return options
    .map((option, index) => ({
      label: String(option.label || String.fromCharCode(65 + index)),
      content: String(option.content || option.text || option.value || '')
    }))
    .filter(option => option.content)
}

export function getQuestionAnswerText(answer?: unknown): string {
  if (!answer || typeof answer !== 'object') return ''

  const answerMap = answer as Record<string, any>
  if (Array.isArray(answerMap.correctOptions)) {
    return answerMap.correctOptions.map(String).join('、')
  }

  if (typeof answerMap.correctValue === 'boolean') {
    return answerMap.correctValue ? '正确' : '错误'
  }

  if (Array.isArray(answerMap.blanks)) {
    return answerMap.blanks
      .map((blank: Record<string, unknown>) => blank.answer || blank.correctValue)
      .filter(Boolean)
      .map(String)
      .join('、')
  }

  const reference =
    answerMap.referenceAnswer ||
    answerMap.referenceSolution ||
    answerMap.referenceSql ||
    answerMap.answer ||
    answerMap.expectedResultDescription

  if (reference) return String(reference)

  return JSON.stringify(answerMap)
}

export function getQuestionTypeName(question: EvaluationQuestion) {
  return question.questionTypeName || String(question.questionType || '题目')
}
