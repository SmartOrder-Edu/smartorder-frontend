import type { EvaluationQuestion } from '@/api/evaluationQuestion'

export interface NormalizedQuestionOption {
  label: string
  content: string
}

export function normalizeQuestionOptions(options?: unknown) {
  let parsed = options
  if (typeof options === 'string') {
    try {
      parsed = JSON.parse(options)
    } catch (e) {
      // ignore
    }
  }

  if (!Array.isArray(parsed)) return []

  return parsed
    .map((option, index) => {
      let content = ''
      let label = String.fromCharCode(65 + index)
      
      if (typeof option === 'string') {
        content = option
      } else if (option && typeof option === 'object') {
        label = String(option.label || label)
        content = String(
          option.content || 
          option.text || 
          option.value || 
          Object.values(option)[0] || 
          ''
        )
      }
      
      return { label, content }
    })
    .filter(option => option.content || option.label)
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

export const QuestionTypeMap: Record<string, string> = {
  single_choice: '单选题',
  multiple_choice: '多选题',
  fill_blank: '填空题',
  judge: '判断题',
  short_answer: '简答题',
  code: '编程题',
  scenario: '场景题',
  sql: 'SQL题',
  multimodal: '多模态题',
  essay: '论述题'
}

export function getQuestionTypeName(question: EvaluationQuestion) {
  if (question.questionTypeName) return question.questionTypeName
  const type = String(question.questionType || '')
  return QuestionTypeMap[type] || type || '题目'
}
