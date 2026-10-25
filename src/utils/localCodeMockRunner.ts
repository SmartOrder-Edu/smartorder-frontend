export interface LocalCodeSample {
  input: string
  output: string
}

export const LOCAL_MOCK_RUN_DELAY_MS = 2000

const normalizeInput = (value: string) => value.replace(/\r\n/g, '\n').trim()

/**
 * 前端 mock 判题使用的插入排序结果生成器：只根据输入生成标准输出，不拼接任何提示文案。
 */
export function runLinkedListInsertionSortMock(input: string): string | null {
  const numbers = normalizeInput(input)
    .split(/\s+/)
    .filter(Boolean)
    .map(item => Number(item))

  if (numbers.length === 0 || numbers.some(item => Number.isNaN(item))) {
    return null
  }

  const n = numbers[0]
  if (!Number.isInteger(n) || n < 1 || numbers.length < n + 1) {
    return null
  }

  return numbers
    .slice(1, n + 1)
    .sort((a, b) => a - b)
    .join(' ')
}

/**
 * 本地演示运行规则：优先匹配题目样例，空输入默认使用样例一，最终输出只保留正确答案文本。
 */
export function resolveLocalMockRunOutput(input: string, samples: LocalCodeSample[]): string | null {
  const normalizedInput = normalizeInput(input)
  const normalizedSamples = samples.map(sample => ({
    input: normalizeInput(sample.input),
    output: String(sample.output ?? '').trim()
  }))

  if (!normalizedInput) {
    return null
  }

  const matchedSample = normalizedSamples.find(sample => sample.input === normalizedInput)
  if (matchedSample) {
    return matchedSample.output
  }

  return runLinkedListInsertionSortMock(normalizedInput)
}
