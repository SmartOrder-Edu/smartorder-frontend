import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import ts from 'typescript'

/**
 * SSE 解析器单测：行尾、跨 chunk、UTF-8、多行 data、注释心跳、EOF 半帧。
 */
const moduleUrl = new URL('../src/composables/sseParser.ts', import.meta.url)
const source = await readFile(moduleUrl, 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2020,
  },
})
const { createSseParser } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
)

function toBytes(text) {
  return new TextEncoder().encode(text)
}

async function parse(chunks, options = {}) {
  const frames = []
  const comments = []
  let activity = 0
  const parser = createSseParser({
    onFrame: frame => frames.push(frame),
    onComment: comment => comments.push(comment),
    onActivity: () => { activity += 1 },
    ...options,
  })
  for (const chunk of chunks) {
    await parser.feed(typeof chunk === 'string' ? toBytes(chunk) : chunk)
  }
  await parser.end()
  return { frames, comments, activity }
}

test('解析基本事件与 id', async () => {
  const { frames } = await parse([
    'id: 1\nevent: agent.text.delta\ndata: {"text":"你"}\n\n',
  ])
  assert.deepEqual(frames, [
    { id: '1', event: 'agent.text.delta', data: '{"text":"你"}' },
  ])
})

test('注释心跳不产生业务事件，但会触发 onComment/onActivity', async () => {
  const { frames, comments, activity } = await parse([
    ':ping\n\n',
    'id: 2\nevent: done\ndata: {"status":"COMPLETED"}\n\n',
  ])
  assert.deepEqual(comments, ['ping'])
  assert.equal(frames.length, 1)
  assert.equal(frames[0].event, 'done')
  assert.ok(activity >= 2)
})

test('CRLF 被任意切分也不会多出空帧', async () => {
  const sourceText = 'id: 3\r\nevent: agent.text.delta\r\ndata: hi\r\n\r\n'
  const bytes = toBytes(sourceText)
  const { frames } = await parse(Array.from(bytes, byte => new Uint8Array([byte])))
  assert.deepEqual(frames, [
    { id: '3', event: 'agent.text.delta', data: 'hi' },
  ])
})

test('UTF-8 跨 chunk 截断仍能正确解码', async () => {
  const text = 'id: 4\nevent: agent.text.delta\ndata: 学习建议\n\n'
  const bytes = toBytes(text)
  // 把“学习建议”拆到 byte 级，制造中文跨 chunk
  const chunks = []
  for (let i = 0; i < bytes.length; i += 1) {
    chunks.push(bytes.slice(i, i + 1))
  }
  const { frames } = await parse(chunks)
  assert.equal(frames.length, 1)
  assert.equal(frames[0].data, '学习建议')
})

test('多行 data 用换行连接', async () => {
  const { frames } = await parse([
    'id: 5\nevent: note\ndata: line1\ndata: line2\n\n',
  ])
  assert.deepEqual(frames, [
    { id: '5', event: 'note', data: 'line1\nline2' },
  ])
})

test('EOF 前没有空行时也派发最后一帧', async () => {
  const { frames } = await parse(['id: 6\nevent: done\ndata: {"ok":true}'])
  assert.equal(frames.length, 1)
  assert.equal(frames[0].event, 'done')
})

test('没有 id 的事件不会继承上一条 id', async () => {
  const { frames } = await parse([
    'id: 7\nevent: a\ndata: 1\n\n',
    'event: b\ndata: 2\n\n',
  ])
  assert.equal(frames[0].id, '7')
  assert.equal(frames[1].id, undefined)
})

test('retry 字段被解析，注释不影响后续事件', async () => {
  const { frames } = await parse([
    'retry: 3000\n\n',
    ':keep-alive\n\n',
    'id: 8\nevent: done\ndata: {}\n\n',
  ])
  assert.equal(frames.length, 1)
  assert.equal(frames[0].event, 'done')
})

test('没有 data 的 event 行不派发', async () => {
  const { frames } = await parse([
    'event: empty\n\n',
    'id: 9\nevent: done\ndata: {}\n\n',
  ])
  assert.equal(frames.length, 1)
  assert.equal(frames[0].id, '9')
})
