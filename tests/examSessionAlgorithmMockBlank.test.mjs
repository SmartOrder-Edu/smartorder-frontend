import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../src/views/ExamSession/index.vue', import.meta.url), 'utf8')

test('algorithm mock session opens with an empty editor answer', () => {
  assert.doesNotMatch(source, /getMockAlgorithmDefaultAnswers/)
  assert.match(source, /answers\.value = \{\}/)
})
