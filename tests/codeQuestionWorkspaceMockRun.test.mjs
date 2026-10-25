import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(
  new URL('../src/views/ExamSession/components/CodeQuestionWorkspace.vue', import.meta.url),
  'utf8'
)

test('CodeQuestionWorkspace exposes copyable samples and pure mock run output', () => {
  assert.match(source, /copySampleText\(sample\.input\)/)
  assert.match(source, /copySampleText\(sample\.output\)/)
  assert.match(source, /resolveLocalMockRunOutput\(customInput\.value, sampleBlocks\.value\)/)
})

test('CodeQuestionWorkspace delays mock output and clears pending run timer', () => {
  assert.match(source, /LOCAL_MOCK_RUN_DELAY_MS/)
  assert.match(source, /window\.setTimeout/)
  assert.match(source, /window\.clearTimeout/)
})

test('CodeQuestionWorkspace shows algorithm judging spinner before success prompt', () => {
  assert.match(source, /:class="\[runStatus, \{ running: isRunningLocal \}\]"/)
  assert.match(source, /class="loading-spinner"/)
  assert.match(source, /return '正在评测'/)
  assert.match(source, /return '算法题测试成功'/)
  assert.match(source, /ElMessage\.success\('算法题测试成功'\)/)
  assert.doesNotMatch(source, /time: '2s'/)
})

test('CodeQuestionWorkspace only shows a short C hint when editor is empty', () => {
  assert.doesNotMatch(source, /correctAnswer\?\.starterCode/)
  assert.doesNotMatch(source, /#include <stdio\.h>\\n\\nint main/)
  assert.match(source, /\/\/ 请输入 C 语言代码/)
})
