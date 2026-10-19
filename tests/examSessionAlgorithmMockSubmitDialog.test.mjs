import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../src/views/ExamSession/index.vue', import.meta.url), 'utf8')

test('algorithm mock submit uses a delayed testing dialog instead of backend placeholder copy', () => {
  assert.doesNotMatch(source, /算法题已本地提交（mock），后端判题接口暂未接入/)
  assert.match(source, /const ALGORITHM_MOCK_SUBMIT_DELAY_MS = 2000/)
  assert.match(source, /showAlgorithmMockSubmitDialog/)
  assert.match(source, /algorithmMockSubmitText/)
  assert.match(source, /'正在测试中'/)
  assert.match(source, /'算法题测试成功，答案正确'/)
  assert.match(source, /window\.setTimeout/)
  assert.match(source, /handleAlgorithmMockSubmit\(\)/)
  assert.match(source, /clearAlgorithmMockSubmitTimer/)
})
