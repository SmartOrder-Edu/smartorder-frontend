import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import ts from 'typescript'

/**
 * 纯逻辑单测：token 级 delta 不进入 traceEvents，过程事件保持 seq 有序，
 * 定稿时共享已过滤的数组而不是整份复制。
 */
const moduleUrl = new URL('../src/utils/agentTrace.ts', import.meta.url)
const source = await readFile(moduleUrl, 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2020,
  },
})
const trace = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
)

const {
  isTokenDeltaEvent,
  appendTraceEvent,
  traceEventsForMessage,
  mergeTraceEventsForMessage,
} = trace

test('只有 text/think delta 算 token 级噪声', () => {
  assert.equal(isTokenDeltaEvent('agent.text.delta'), true)
  assert.equal(isTokenDeltaEvent('agent.think.delta'), true)
  assert.equal(isTokenDeltaEvent('agent.tool.completed'), false)
  assert.equal(isTokenDeltaEvent('agent.route.completed'), false)
  assert.equal(isTokenDeltaEvent('agent.plan.created'), false)
  assert.equal(isTokenDeltaEvent('agent.status'), false)
})

test('回放 2000 条 delta 不会让 traceEvents 增长', () => {
  const events = []
  for (let seq = 1; seq <= 2000; seq++) {
    const eventName = seq % 3 === 0 ? 'agent.think.delta' : 'agent.text.delta'
    const appended = appendTraceEvent(events, eventName, { seq, eventType: eventName })
    assert.equal(appended, false)
  }
  assert.equal(events.length, 0)
})

test('过程事件正常追加，补发乱序时才排序', () => {
  const events = []
  assert.equal(appendTraceEvent(events, 'agent.trace.started', { seq: 1 }), true)
  assert.equal(appendTraceEvent(events, 'agent.tool.started', { seq: 5 }), true)
  // 断线重连补发一条更旧的事件：插入后整体按 seq 有序
  assert.equal(appendTraceEvent(events, 'agent.route.completed', { seq: 3 }), true)
  assert.deepEqual(events.map(e => e.seq), [1, 3, 5])
})

test('顺序追加不触发 sort', () => {
  const events = []
  let sortCalls = 0
  const nativeSort = events.sort
  events.sort = (...args) => {
    sortCalls += 1
    return nativeSort.apply(events, args)
  }
  appendTraceEvent(events, 'agent.tool.started', { seq: 1 })
  appendTraceEvent(events, 'agent.tool.completed', { seq: 2 })
  appendTraceEvent(events, 'agent.phase.change', { seq: 3 })
  assert.equal(sortCalls, 0)
  assert.deepEqual(events.map(e => e.seq), [1, 2, 3])
})

test('定稿共享已过滤的追踪数组，不再复制', () => {
  const events = [{ seq: 1 }, { seq: 2 }]
  assert.equal(traceEventsForMessage(events), events)
  assert.equal(traceEventsForMessage([]), undefined)
})

test('历史 trace 与增量 trace 合并去重并按 seq 排序', () => {
  const existing = [
    { traceId: 't1', eventType: 'agent.route.completed', seq: 1 },
    { traceId: 't1', eventType: 'agent.tool.completed', seq: 3 },
  ]
  const incoming = [
    { traceId: 't1', eventType: 'agent.tool.started', seq: 2 },
    { traceId: 't1', eventType: 'agent.tool.completed', seq: 3 },
    { traceId: 't1', eventType: 'done', seq: 4 },
  ]

  const merged = mergeTraceEventsForMessage(existing, incoming)

  assert.deepEqual(merged.map(event => event.seq), [1, 2, 3, 4])
  assert.equal(merged.filter(event => event.eventType === 'agent.tool.completed').length, 1)
})

test('没有历史事件时直接共享增量数组', () => {
  const incoming = [{ traceId: 't1', eventType: 'done', seq: 1 }]
  assert.equal(mergeTraceEventsForMessage(undefined, incoming), incoming)
  assert.equal(mergeTraceEventsForMessage([], incoming), incoming)
})

test('追踪面板合成过 think.delta 的数组不再与真实事件混排', () => {
  const existing = [
    { traceId: 't1', eventType: 'agent.think.delta', seq: 0 },
    { traceId: 't1', eventType: 'agent.tool.completed', seq: 2 },
  ]
  const incoming = [{ traceId: 't1', eventType: 'done', seq: 3 }]

  assert.equal(mergeTraceEventsForMessage(existing, incoming), incoming)
})
