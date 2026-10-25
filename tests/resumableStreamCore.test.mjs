import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import ts from 'typescript'

/**
 * 纯逻辑单测：断线重连的退避、重试策略、Retry-After、seq 游标去重。
 * 与页面/浏览器无关，直接转译 TS 源文件后导入。
 */
const moduleUrl = new URL('../src/composables/resumableStreamCore.ts', import.meta.url)
const source = await readFile(moduleUrl, 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2020,
  },
})
const core = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
)

const {
  computeBackoffDelay,
  decideRetry,
  parseRetryAfter,
  createSeqGate,
  parseEventSeq,
  shouldResumeGeneration,
} = core

const NO_JITTER = { baseDelayMs: 1000, maxDelayMs: 15000, jitterRatio: 0, windowMs: 120000 }
const JITTER = { ...NO_JITTER, jitterRatio: 0.2 }

test('退避按 1s→2s→4s→8s→15s 递增并封顶', () => {
  const delays = [1, 2, 3, 4, 5, 6, 7].map(attempt => computeBackoffDelay(attempt, NO_JITTER, () => 0.5))
  assert.deepEqual(delays, [1000, 2000, 4000, 8000, 15000, 15000, 15000])
})

test('抖动不会把等待时间抖出上下界', () => {
  const fast = [1, 2, 3, 4, 5].map(attempt => computeBackoffDelay(attempt, JITTER, () => 0))
  const slow = [1, 2, 3, 4, 5].map(attempt => computeBackoffDelay(attempt, JITTER, () => 1))
  assert.deepEqual(fast, [800, 1600, 3200, 6400, 12000])
  assert.deepEqual(slow, [1200, 2400, 4800, 9600, 18000])
  for (const delay of [...fast, ...slow]) {
    assert.ok(delay >= 0)
  }
})

test('HTTP 状态码映射到正确的重试策略', () => {
  assert.equal(decideRetry(null), 'retry')        // 网络错误
  assert.equal(decideRetry(0), 'retry')
  assert.equal(decideRetry(401), 'refresh-token')
  assert.equal(decideRetry(403), 'stop')
  assert.equal(decideRetry(404), 'stop')
  assert.equal(decideRetry(410), 'stop')          // 事件日志过期，重试无意义
  assert.equal(decideRetry(429), 'retry')         // 限流，遵守 Retry-After
  assert.equal(decideRetry(500), 'retry')
  assert.equal(decideRetry(502), 'retry')
  assert.equal(decideRetry(422), 'stop')
})

test('Retry-After 支持秒数与 HTTP 日期', () => {
  assert.equal(parseRetryAfter('3'), 3000)
  assert.equal(parseRetryAfter('0'), 0)
  assert.equal(parseRetryAfter(null), null)
  assert.equal(parseRetryAfter('not-a-date'), null)
  const now = Date.parse('2026-10-25T12:00:00Z')
  assert.equal(parseRetryAfter('Sun, 25 Oct 2026 12:00:05 GMT', now), 5000)
  // 已经过去的时间不应产生负等待
  assert.equal(parseRetryAfter('Sun, 25 Oct 2026 11:59:00 GMT', now), 0)
})

test('seq 游标只在应用成功后推进，重复/更旧事件被丢弃', () => {
  const gate = createSeqGate(0)

  assert.equal(gate.shouldApply(1), true)
  gate.commit(1)
  assert.equal(gate.lastSeq(), 1)

  // 重连后服务端从 after=1 补发，不会重复给 1；万一重复也不应再应用
  assert.equal(gate.shouldApply(1), false)
  assert.equal(gate.shouldApply(0), false)

  // 应用失败：不 commit，下次仍会重新拉到同一条
  assert.equal(gate.shouldApply(2), true)
  assert.equal(gate.lastSeq(), 1)

  gate.commit(2)
  assert.equal(gate.lastSeq(), 2)
  assert.equal(gate.shouldApply(3), true)

  gate.reset(5)
  assert.equal(gate.lastSeq(), 5)
  assert.equal(gate.shouldApply(5), false)
  assert.equal(gate.shouldApply(6), true)
})

test('非法 seq 不推进游标', () => {
  const gate = createSeqGate()
  assert.equal(gate.shouldApply(Number.NaN), false)
  gate.commit(Number.NaN)
  assert.equal(gate.lastSeq(), 0)
})

test('event id 解析为 seq', () => {
  assert.equal(parseEventSeq('12'), 12)
  assert.equal(parseEventSeq(' 7 '), 7)
  assert.equal(parseEventSeq(''), null)
  assert.equal(parseEventSeq(null), null)
  assert.equal(parseEventSeq('0'), null)
  assert.equal(parseEventSeq('-3'), null)
  assert.equal(parseEventSeq('abc'), null)
})

test('刷新后只对未完成生成接流', () => {
  assert.equal(shouldResumeGeneration('CREATED'), true)
  assert.equal(shouldResumeGeneration('RUNNING'), true)
  assert.equal(shouldResumeGeneration('COMPLETED'), false)
  assert.equal(shouldResumeGeneration('FAILED'), false)
  assert.equal(shouldResumeGeneration('CANCELLED'), false)
  assert.equal(shouldResumeGeneration('INTERRUPTED'), false)
  assert.equal(shouldResumeGeneration(null), false)
})
