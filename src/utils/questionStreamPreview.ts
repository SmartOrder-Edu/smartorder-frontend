const FIELD_LABELS: Record<string, string> = {
  content: '内容',
  question: '题干',
  stem: '题干',
  title: '题干',
  option: '选项',
  options: '选项',
  answer: '答案',
  correctAnswer: '答案',
  analysis: '解析',
  explanation: '解析',
  difficulty: '难度',
  score: '分值',
  type: '题型',
  questionType: '题型',
  knowledge_points: '知识点',
  knowledgePoints: '知识点',
  ability_tags: '能力标签',
  abilityTags: '能力标签',
  correct_reason: '正确解析',
  wrong_reason: '错误分析'
}

const STRUCTURE_FIELDS = new Set(['questions', 'items', 'list'])

const decodeStreamEscapes = (value: string) =>
  value
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 16))
    )
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\\\/g, '\\')

const compactPreview = (value: string) =>
  value
    .replace(/[{}[\]]/g, ' ')
    .replace(/["']/g, '')
    .replace(/\s*[,，]\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(?:内容|题干|选项|答案|解析|难度|分值)：(?=\s|$)/g, '')
    .trim()

export function formatQuestionStreamPreview(chunk: string, maxLength = 220) {
  if (!chunk) return ''

  const labeled = decodeStreamEscapes(chunk).replace(
    /["']?([A-Za-z_][\w-]*)["']?\s*:\s*/g,
    (_, key: string) => {
      if (STRUCTURE_FIELDS.has(key)) return ''
      const label = FIELD_LABELS[key]
      return label ? `${label}：` : ''
    }
  )
  const preview = compactPreview(labeled)

  if (preview.length <= maxLength) return preview
  return `...${preview.slice(-maxLength)}`
}
