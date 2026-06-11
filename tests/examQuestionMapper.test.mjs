import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import ts from 'typescript'

const moduleUrl = new URL('../src/utils/examQuestionMapper.ts', import.meta.url)
const source = await readFile(moduleUrl, 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2020
  }
})
const mapperModule = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
)

const { getQuestionAnswerText, normalizeQuestionOptions } = mapperModule

test('normalizes generated choice options for rendering', () => {
  const options = normalizeQuestionOptions([
    { label: 'A', content: '稳定排序' },
    { label: 'B', content: '不稳定排序' }
  ])

  assert.deepEqual(options, [
    { label: 'A', content: '稳定排序' },
    { label: 'B', content: '不稳定排序' }
  ])
})

test('formats generated standard answers for display', () => {
  assert.equal(getQuestionAnswerText({ correctOptions: ['A', 'C'] }), 'A、C')
  assert.equal(getQuestionAnswerText({ correctValue: false }), '错误')
  assert.equal(
    getQuestionAnswerText({ blanks: [{ answer: 'FIFO' }, { answer: '队列' }] }),
    'FIFO、队列'
  )
  assert.equal(getQuestionAnswerText({ referenceAnswer: '冒泡排序每轮把最大元素交换到末尾。' }), '冒泡排序每轮把最大元素交换到末尾。')
})
