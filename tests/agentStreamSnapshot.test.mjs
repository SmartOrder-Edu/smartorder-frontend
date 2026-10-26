import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import ts from 'typescript'

/**
 * 刷新快照的纯逻辑单测：lastSeq 归一化、数组克隆、sessionStorage 读写/清理/损坏兜底。
 */
class MemoryStorage {
  constructor() {
    this.map = new Map()
  }

  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null
  }

  setItem(key, value) {
    this.map.set(key, String(value))
  }

  removeItem(key) {
    this.map.delete(key)
  }
}

globalThis.sessionStorage = new MemoryStorage()

const moduleUrl = new URL('../src/utils/agentStreamSnapshot.ts', import.meta.url)
const source = await readFile(moduleUrl, 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2020,
  },
})
const snapshotModule = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
)

const {
  AGENT_STREAM_SNAPSHOT_KEY,
  buildAgentStreamSnapshot,
  loadAgentStreamSnapshot,
  saveAgentStreamSnapshot,
  clearAgentStreamSnapshot,
} = snapshotModule

const sampleInput = () => ({
  taskId: 'g-1',
  conversationId: 'c-1',
  lastSeq: 12.9,
  answerText: '回答',
  thinkingText: '思考',
  thinkingDurationMs: null,
  toolCalls: [{ toolName: 'webSearch', status: 'running', startedAt: 1 }],
  reasoningSegments: [{
    thinkingText: '思考',
    toolCall: { toolName: 'webSearch', status: 'running', startedAt: 1 },
  }],
})

test('build 快照时归一化 lastSeq 并克隆数组', () => {
  const input = sampleInput()
  const snapshot = buildAgentStreamSnapshot(input)

  assert.equal(snapshot.version, 2)
  assert.equal(snapshot.lastSeq, 12)
  assert.equal(snapshot.answerText, '回答')
  assert.notEqual(snapshot.toolCalls, input.toolCalls)
  assert.notEqual(snapshot.reasoningSegments, input.reasoningSegments)
  assert.notEqual(snapshot.reasoningSegments[0], input.reasoningSegments[0])
  assert.equal(snapshot.reasoningSegments[0].toolCall.toolName, 'webSearch')
})

test('快照可以写入、读回并清理', () => {
  clearAgentStreamSnapshot()
  const snapshot = buildAgentStreamSnapshot(sampleInput())

  assert.equal(saveAgentStreamSnapshot(snapshot), true)
  const loaded = loadAgentStreamSnapshot()
  assert.deepEqual(loaded, snapshot)

  clearAgentStreamSnapshot()
  assert.equal(loadAgentStreamSnapshot(), null)
})

test('损坏或版本不匹配的快照会被丢弃并清理', () => {
  clearAgentStreamSnapshot()
  globalThis.sessionStorage.setItem(AGENT_STREAM_SNAPSHOT_KEY, 'not-json')
  assert.equal(loadAgentStreamSnapshot(), null)
  assert.equal(globalThis.sessionStorage.getItem(AGENT_STREAM_SNAPSHOT_KEY), null)

  globalThis.sessionStorage.setItem(AGENT_STREAM_SNAPSHOT_KEY,
    JSON.stringify({ ...buildAgentStreamSnapshot(sampleInput()), version: 99 }))
  assert.equal(loadAgentStreamSnapshot(), null)
  assert.equal(globalThis.sessionStorage.getItem(AGENT_STREAM_SNAPSHOT_KEY), null)
})

test('taskId 为空或 lastSeq 非法的快照不会被接受', () => {
  clearAgentStreamSnapshot()
  globalThis.sessionStorage.setItem(AGENT_STREAM_SNAPSHOT_KEY,
    JSON.stringify({ ...buildAgentStreamSnapshot(sampleInput()), taskId: '' }))
  assert.equal(loadAgentStreamSnapshot(), null)

  globalThis.sessionStorage.setItem(AGENT_STREAM_SNAPSHOT_KEY,
    JSON.stringify({ ...buildAgentStreamSnapshot(sampleInput()), lastSeq: -1 }))
  assert.equal(loadAgentStreamSnapshot(), null)
})

test('写入配额异常返回 false，不抛到主流程', () => {
  const original = globalThis.sessionStorage.setItem
  globalThis.sessionStorage.setItem = () => {
    throw new Error('quota exceeded')
  }
  try {
    assert.equal(saveAgentStreamSnapshot(buildAgentStreamSnapshot(sampleInput())), false)
  } finally {
    globalThis.sessionStorage.setItem = original
  }
})
