import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import ts from 'typescript'

/**
 * 缓存消息合并的纯逻辑单测：
 * 服务端空占位不能覆盖本地正文、终态服务端优先、窗口内删除、本地待确认保留。
 */
const moduleUrl = new URL('../src/cache/messageMapping.ts', import.meta.url)
const source = await readFile(moduleUrl, 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2020,
  },
})
const {
  mergeChatMessages,
  toCachedMessage,
  fromCachedMessage,
  messageSortKey,
  canReuseCachedDisplay,
} = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
)

const NOW = Date.now()

function message(overrides = {}) {
  return {
    id: 'a_1',
    role: 'ai',
    content: '',
    status: 'done',
    timestamp: NOW,
    ...overrides,
  }
}

test('服务端 RUNNING 空占位不覆盖本地已累积正文与工具卡片', () => {
  const cached = message({
    id: 'local-cached',
    messageId: '2',
    sequenceNo: 2,
    status: 'streaming',
    content: '已经生成的部分',
    toolCalls: [{ toolName: 'webSearch', status: 'completed', startedAt: NOW }],
    cacheSyncedAt: NOW,
  })
  const server = message({
    messageId: '2',
    sequenceNo: 2,
    status: 'streaming',
    content: '',
  })
  const [merged] = mergeChatMessages([cached], [server])
  assert.equal(merged.content, '已经生成的部分')
  assert.equal(merged.status, 'streaming')
  assert.equal(merged.toolCalls.length, 1)
  assert.equal(merged.id, 'local-cached')
})

test('服务端终态完整正文覆盖缓存里的部分正文', () => {
  const cached = message({
    messageId: '2',
    sequenceNo: 2,
    status: 'error',
    content: '部分',
    localOnly: true,
    cacheSyncedAt: NOW,
  })
  const server = message({
    messageId: '2',
    sequenceNo: 2,
    status: 'done',
    content: '完整回答',
  })
  const [merged] = mergeChatMessages([cached], [server])
  assert.equal(merged.content, '完整回答')
  assert.equal(merged.localOnly, false)
})

test('本次校验窗口内服务端缺失的消息被移除，更早缓存保留', () => {
  const cached = [
    message({ id: 'one', messageId: '1', sequenceNo: 1, content: '一' }),
    message({ id: 'two', messageId: '2', sequenceNo: 2, content: '二' }),
    message({ id: 'three', messageId: '3', sequenceNo: 3, content: '三' }),
  ]
  const server = [
    message({ id: 's2', messageId: '2', sequenceNo: 2, content: '二' }),
    message({ id: 's3', messageId: '3', sequenceNo: 3, content: '三' }),
  ]

  // 默认窗口从服务端最小 seq=2 开始：seq=1 属于更早缓存，保留
  const keptOlder = mergeChatMessages(cached, server)
  assert.deepEqual(keptOlder.map(item => item.messageId), ['1', '2', '3'])

  // 窗口覆盖到 seq=1 时，服务端返回里没有 seq=1 才能判定为已删除
  const windowed = mergeChatMessages(cached, server, { serverWindowStartSortKey: 1 })
  assert.deepEqual(windowed.map(item => item.messageId), ['2', '3'])
})

test('流式气泡在服务端页面缺失时保留，且不复制对象', () => {
  const streaming = message({
    id: 'live',
    messageId: '9',
    sequenceNo: 9,
    status: 'streaming',
    content: '正在输出',
    generationId: 'g9',
  })
  const server = [message({ id: 's1', messageId: '1', sequenceNo: 1, content: '旧' })]
  const merged = mergeChatMessages([streaming], server)
  const live = merged.find(item => item.id === 'live')
  assert.equal(live, streaming)
})

test('本地待确认消息永远保留在尾部', () => {
  const local = message({
    id: 'local_1',
    clientRequestId: 'req-1',
    content: '刚发出',
    status: 'done',
  })
  const server = [message({ id: 's1', messageId: '1', sequenceNo: 1, content: '旧消息' })]
  const merged = mergeChatMessages([local], server)
  assert.equal(merged.length, 2)
  assert.equal(merged[1].clientRequestId, 'req-1')
})

test('按 sequenceNo 排序，本地待确认使用大 sortKey 排最后', () => {
  const older = message({ messageId: '1', sequenceNo: 1, content: '1' })
  const newer = message({ messageId: '2', sequenceNo: 2, content: '2' })
  const local = message({ clientRequestId: 'req', content: '3' })
  assert.ok(messageSortKey(local) > messageSortKey(newer))
  const merged = mergeChatMessages([local, newer], [older, newer])
  assert.deepEqual(merged.map(item => item.content), ['1', '2', '3'])
})

test('ChatMessage 写入缓存再读回保留可序列化字段', () => {
  const original = message({
    messageId: '9',
    sequenceNo: 9,
    content: '答案',
    toolCalls: [
      { toolName: 'rag', status: 'completed', result: { chunks: [1, 2] }, startedAt: NOW },
    ],
    reasoningSegments: [
      { thinkingText: '想一想', toolCall: { toolName: 'rag', status: 'completed', startedAt: NOW } },
    ],
    attachmentFileIds: [1, 2],
  })
  const record = toCachedMessage('c1', original, { serverSyncedAt: NOW })
  const restored = fromCachedMessage(record)
  assert.equal(restored.messageId, '9')
  assert.equal(restored.content, '答案')
  assert.equal(restored.toolCalls[0].toolName, 'rag')
  assert.deepEqual(restored.toolCalls[0].result, { chunks: [1, 2] })
  assert.deepEqual(restored.attachmentFileIds, [1, 2])
  assert.equal(restored.cacheSyncedAt, NOW)
})

test('缓存展示数据在有效期内可复用', () => {
  const withDisplay = message({
    messageId: '1',
    sequenceNo: 1,
    toolCalls: [{ toolName: 'webSearch', status: 'completed', startedAt: NOW }],
    cacheSyncedAt: Date.now(),
  })
  assert.equal(canReuseCachedDisplay(withDisplay, 60_000), true)
  const stale = { ...withDisplay, cacheSyncedAt: Date.now() - 120_000 }
  assert.equal(canReuseCachedDisplay(stale, 60_000), false)
})
