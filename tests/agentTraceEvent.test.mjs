import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import ts from 'typescript'

/**
 * 批量 trace 精简 DTO 与旧单条实体的归一化兼容测试。
 */
const moduleUrl = new URL('../src/utils/agentTraceEvent.ts', import.meta.url)
const source = await readFile(moduleUrl, 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2020,
  },
})
const { normalizeAgentTraceEvent } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
)

test('批量精简 DTO 可归一化并解析 payload', () => {
  const event = normalizeAgentTraceEvent({
    traceId: 't-1',
    eventType: 'agent.tool.completed',
    seq: 3,
    timestamp: 1700000000000,
    payload: '{"toolName":"webSearch"}',
  })

  assert.deepEqual(event, {
    traceId: 't-1',
    conversationId: '',
    userId: 0,
    mode: '',
    eventType: 'agent.tool.completed',
    seq: 3,
    timestamp: 1700000000000,
    payload: { toolName: 'webSearch' },
  })
})

test('旧单条实体字段仍然兼容', () => {
  const event = normalizeAgentTraceEvent({
    traceId: 't-2',
    conversationId: 'c-1',
    userId: 7,
    agentMode: 'REACT',
    eventType: 'agent.route.completed',
    sequenceNum: 2,
    createTime: '2026-10-25T12:00:00',
    payload: 'not-json',
  })

  assert.equal(event.traceId, 't-2')
  assert.equal(event.conversationId, 'c-1')
  assert.equal(event.userId, 7)
  assert.equal(event.mode, 'REACT')
  assert.equal(event.seq, 2)
  assert.ok(event.timestamp > 0)
  assert.equal(event.payload, 'not-json')
})
