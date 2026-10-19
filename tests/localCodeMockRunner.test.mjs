import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import ts from 'typescript'

const moduleUrl = new URL('../src/utils/localCodeMockRunner.ts', import.meta.url)
const source = await readFile(moduleUrl, 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2020
  }
})
const runnerModule = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
)

const { LOCAL_MOCK_RUN_DELAY_MS, resolveLocalMockRunOutput, runLinkedListInsertionSortMock } = runnerModule

const samples = [
  { input: '5\n3 1 4 2 5', output: '1 2 3 4 5' },
  { input: '3\n10 5 8', output: '5 8 10' }
]

test('local mock run returns sample output without extra text', () => {
  assert.equal(resolveLocalMockRunOutput('', samples), null)
  assert.equal(resolveLocalMockRunOutput('3\n10 5 8', samples), '5 8 10')
})

test('local mock run supports custom linked-list insertion sort input', () => {
  assert.equal(runLinkedListInsertionSortMock('4\n9 -1 9 0'), '-1 0 9 9')
  assert.equal(resolveLocalMockRunOutput('4\n9 -1 9 0', samples), '-1 0 9 9')
})

test('local mock run delays visible result for recording rhythm', () => {
  assert.equal(LOCAL_MOCK_RUN_DELAY_MS, 2000)
})
