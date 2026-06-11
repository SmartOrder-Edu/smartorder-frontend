import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import ts from 'typescript'

const moduleUrl = new URL('../src/utils/questionStreamPreview.ts', import.meta.url)
const source = await readFile(moduleUrl, 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2020
  }
})
const previewModule = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
)

const { formatQuestionStreamPreview } = previewModule

test('hides structural json fragments while streaming', () => {
  assert.equal(formatQuestionStreamPreview('questions":[{"'), '')
})

test('turns content fragments into readable preview text', () => {
  assert.equal(formatQuestionStreamPreview('content":"BCA'), '内容：BCA')
})

test('labels answer and analysis fragments', () => {
  assert.equal(formatQuestionStreamPreview('answer":"A","analysis":"因为'), '答案：A 解析：因为')
})
