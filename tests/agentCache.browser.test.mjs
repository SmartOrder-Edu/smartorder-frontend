import test from 'node:test'
import assert from 'node:assert/strict'
import puppeteer from 'puppeteer'
import { build } from 'esbuild'
import { createServer } from 'node:http'
import { resolve } from 'node:path'

const bundle = await build({ entryPoints: ['src/db/agentCacheRepository.ts'], bundle: true,
  write: false, format: 'iife', globalName: 'AgentCacheBundle', platform: 'browser' })
const script = bundle.outputFiles[0].text
const streamBundle = await build({ entryPoints: ['tests/agentStreamHarness.ts'], bundle: true,
  write: false, format: 'iife', globalName: 'AgentStreamBundle', platform: 'browser',
  alias: { '@': resolve('src') }, define: { 'import.meta.env.VITE_API_BASE_URL': '"/api"' } })
let multiTabFixture = null
const server = createServer((request, response) => {
  if (multiTabFixture && request.url?.includes('/snapshot')) {
    const fixture = multiTabFixture
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ code: 0, data: { taskId: fixture.taskId,
      conversationId: fixture.taskId, streamVersion: fixture.streamVersion,
      status: fixture.status, snapshotEventId: fixture.status === 'COMPLETED' ? '1-2' : '0-0',
      snapshotRevision: fixture.status === 'COMPLETED' ? 2 : 0,
      messages: [{ messageId: 'm1', role: 'assistant',
        content: fixture.status === 'COMPLETED' ? 'A' : '',
        status: fixture.status, revision: 0 }] } }))
    return
  }
  if (multiTabFixture && request.url?.includes('/events')) {
    const fixture = multiTabFixture
    fixture.requests++
    response.writeHead(200, { 'Content-Type': 'text/event-stream' })
    setTimeout(() => {
      const delta = { taskId: fixture.taskId, streamVersion: fixture.streamVersion,
        eventId: '1-1', messageId: 'm1', content: 'A' }
      const terminal = { taskId: fixture.taskId, streamVersion: fixture.streamVersion,
        eventId: '1-2', status: 'COMPLETED' }
      response.write(`id: 1-1\nevent: agent.text.delta\ndata: ${JSON.stringify(delta)}\n\n`)
      fixture.status = 'COMPLETED'
      response.end(`id: 1-2\nevent: task_completed\ndata: ${JSON.stringify(terminal)}\n\n`)
    }, 300)
    return
  }
  response.writeHead(200, { 'Content-Type': 'text/html' })
  response.end('<html></html>')
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
const testUrl = `http://127.0.0.1:${address.port}`

async function browserPage() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.goto(testUrl, { waitUntil: 'domcontentloaded' })
  await page.addScriptTag({ content: script })
  return { browser, page }
}

test('快照替换、事件去重和数值游标顺序', async () => {
  const { browser, page } = await browserPage()
  try {
    const result = await page.evaluate(async () => {
      const cache = window.AgentCacheBundle.agentCache
      const scope = `test:${crypto.randomUUID()}`
      const taskId = crypto.randomUUID()
      const snapshot = content => ({ taskId, conversationId: taskId, status: 'RUNNING',
        streamVersion: `v1-${taskId}`, snapshotRevision: 1, snapshotEventId: '1-5',
        messages: [{ messageId: 'm1', role: 'assistant', content, status: 'STREAMING', revision: 1 }] })
      await cache.replaceSnapshot(scope, snapshot('12345'))
      for (const [id, content] of [['1-6', '6'], ['1-7', '7'], ['1-7', '7'], ['1-8', '8']]) {
        await cache.persistEvent(scope, { taskId, streamVersion: `v1-${taskId}`,
          eventId: id, type: 'agent.text.delta', messageId: 'm1', content })
      }
      const first = await cache.preview(scope, taskId)
      await cache.replaceSnapshot(scope, { ...snapshot('1234567'), snapshotEventId: '1-7', snapshotRevision: 2 })
      const protectedPreview = await cache.preview(scope, taskId)
      await cache.persistEvent(scope, { taskId, streamVersion: `v1-${taskId}`,
        eventId: '1-8', type: 'agent.text.delta', messageId: 'm1', content: '8' })
      const second = await cache.preview(scope, taskId)
      return { first: first.messages[0].baseContent, second: second.messages[0].baseContent,
        protectedContent: protectedPreview.messages[0].baseContent,
        protectedCursor: protectedPreview.checkpoints[0].lastAppliedEventId,
        cursor: second.checkpoints[0].lastAppliedEventId }
    })
    assert.deepEqual(result, { first: '12345678', second: '12345678',
      protectedContent: '12345678', protectedCursor: '1-8', cursor: '1-8' })
  } finally { await browser.close() }
})

test('事务写入中止时事件和游标一起回滚', async () => {
  const { browser, page } = await browserPage()
  try {
    const result = await page.evaluate(async () => {
      const cache = window.AgentCacheBundle.agentCache
      const scope = `test:${crypto.randomUUID()}`
      const taskId = crypto.randomUUID()
      await cache.replaceSnapshot(scope, { taskId, conversationId: taskId, status: 'RUNNING',
        streamVersion: `v1-${taskId}`, snapshotRevision: 0, snapshotEventId: '0-0',
        messages: [{ messageId: 'm1', role: 'assistant', content: '', status: 'STREAMING', revision: 0 }] })
      const original = IDBObjectStore.prototype.put
      IDBObjectStore.prototype.put = function (...args) {
        if (this.name === 'taskCheckpoints') throw new DOMException('quota', 'QuotaExceededError')
        return original.apply(this, args)
      }
      let failed = false
      try {
        await cache.persistEvent(scope, { taskId, streamVersion: `v1-${taskId}`,
          eventId: '1-1', type: 'agent.text.delta', messageId: 'm1', content: 'A' })
      } catch { failed = true }
      IDBObjectStore.prototype.put = original
      const preview = await cache.preview(scope, taskId)
      return { failed, content: preview.messages[0].baseContent,
        cursor: preview.checkpoints[0].lastAppliedEventId }
    })
    assert.deepEqual(result, { failed: true, content: '', cursor: '0-0' })
  } finally { await browser.close() }
})

test('历史分页不能覆盖活动任务的事件基线', async () => {
  const { browser, page } = await browserPage()
  try {
    const result = await page.evaluate(async () => {
      const cache = window.AgentCacheBundle.agentCache
      const scope = `test:${crypto.randomUUID()}`
      const taskId = crypto.randomUUID()
      await cache.replaceSnapshot(scope, { taskId, conversationId: taskId, status: 'RUNNING',
        streamVersion: `v1-${taskId}`, snapshotRevision: 1, snapshotEventId: '1-1',
        messages: [{ messageId: 'm1', role: 'assistant', content: 'A', status: 'STREAMING', revision: 1 }] })
      await cache.persistEvent(scope, { taskId, streamVersion: `v1-${taskId}`,
        eventId: '1-2', type: 'agent.text.delta', messageId: 'm1', content: 'B' })
      await cache.saveHistory(scope, taskId, [{ id: 'm1', role: 'assistant', content: 'A',
        status: 'RUNNING', updatedAt: Date.now() }])
      const preview = await cache.preview(scope, taskId)
      return { content: preview.messages[0].baseContent,
        taskId: preview.messages[0].taskId, cursor: preview.checkpoints[0].lastAppliedEventId }
    })
    assert.deepEqual(result.content, 'AB')
    assert.equal(result.taskId?.length > 0, true)
    assert.equal(result.cursor, '1-2')
  } finally { await browser.close() }
})

test('断网后用已提交 Last-Event-ID 续传，F5 快照不重复追加', async () => {
  const { browser, page } = await browserPage()
  try {
    await page.addScriptTag({ content: streamBundle.outputFiles[0].text })
    const result = await page.evaluate(async () => {
      const { agentCache: cache, followAgentTask } = window.AgentStreamBundle
      const scopeKey = `test:${crypto.randomUUID()}`
      const taskId = crypto.randomUUID()
      const streamVersion = `v1-${taskId}`
      const snapshot = { taskId, conversationId: taskId, status: 'RUNNING', streamVersion,
        snapshotRevision: 0, snapshotEventId: '0-0', messages: [{ messageId: 'm1',
          role: 'assistant', content: '', status: 'STREAMING', revision: 0 }] }
      await cache.replaceSnapshot(scopeKey, snapshot)
      const originalFetch = window.fetch
      const headers = []
      let calls = 0
      window.fetch = async (_, options) => {
        headers.push(options.headers['Last-Event-ID'])
        calls++
        const begin = calls === 1 ? 1 : 4
        const end = calls === 1 ? 3 : 8
        const frames = Array.from({ length: end - begin + 1 }, (_, index) => {
          const number = begin + index
          return `id: 1-${number}\nevent: agent.text.delta\ndata: ${JSON.stringify({
            taskId, streamVersion, eventId: `1-${number}`, messageId: 'm1', content: String(number),
          })}\n\n`
        }).join('')
        const body = new ReadableStream({ start(controller) {
          controller.enqueue(new TextEncoder().encode(frames))
          if (calls === 1) setTimeout(() => controller.error(new Error('simulated disconnect')), 50)
        } })
        return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } })
      }
      const abort = new AbortController()
      const seen = []
      await followAgentTask({ scopeKey, snapshot, signal: abort.signal,
        onSnapshot() {}, onState() {}, onEvent(frame) {
          seen.push(frame.id)
          if (frame.id === '1-8') abort.abort()
        } })
      window.fetch = originalFetch
      const first = await cache.preview(scopeKey, taskId)
      await cache.replaceSnapshot(scopeKey, { ...snapshot, snapshotRevision: 5,
        snapshotEventId: '1-5', messages: [{ ...snapshot.messages[0], content: '12345' }] })
      for (const number of [6, 7, 8]) await cache.persistEvent(scopeKey, {
        taskId, streamVersion, eventId: `1-${number}`, type: 'agent.text.delta',
        messageId: 'm1', content: String(number),
      })
      const refreshed = await cache.preview(scopeKey, taskId)
      return { headers, seen, first: first.messages[0].baseContent,
        cursor: first.checkpoints[0].lastAppliedEventId,
        refreshed: refreshed.messages[0].baseContent }
    })
    assert.deepEqual(result, { headers: ['0-0', '1-3'],
      seen: ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8'],
      first: '12345678', cursor: '1-8', refreshed: '12345678' })
  } finally { await browser.close() }
})

test('不同身份隔离缓存，登出清理原身份记录', async () => {
  const { browser, page } = await browserPage()
  try {
    const result = await page.evaluate(async () => {
      const cache = window.AgentCacheBundle.agentCache
      const conversationId = crypto.randomUUID()
      await cache.saveHistory('tenantA:user1', conversationId, [{ id: 'm1', role: 'user',
        content: 'A 私有消息', status: 'COMPLETED', updatedAt: Date.now() }])
      const other = await cache.preview('tenantB:user2', conversationId)
      await cache.clearScope('tenantA:user1')
      const cleared = await cache.preview('tenantA:user1', conversationId)
      return { other: other.messages.length, cleared: cleared.messages.length }
    })
    assert.deepEqual(result, { other: 0, cleared: 0 })
  } finally { await browser.close() }
})

test('双标签页只有 Leader 订阅事件，Follower 接管时读取终态快照', async () => {
  const { browser, page } = await browserPage()
  const follower = await browser.newPage()
  try {
    await follower.goto(testUrl, { waitUntil: 'domcontentloaded' })
    await page.addScriptTag({ content: streamBundle.outputFiles[0].text })
    await follower.addScriptTag({ content: streamBundle.outputFiles[0].text })
    const taskId = crypto.randomUUID()
    const streamVersion = `v1-${taskId}`
    multiTabFixture = { taskId, streamVersion, status: 'RUNNING', requests: 0 }
    const scopeKey = `test:${crypto.randomUUID()}`
    const snapshot = { taskId, conversationId: taskId, status: 'RUNNING', streamVersion,
      snapshotRevision: 0, snapshotEventId: '0-0', messages: [{ messageId: 'm1',
        role: 'assistant', content: '', status: 'STREAMING', revision: 0 }] }
    const input = { scopeKey, snapshot }
    await page.evaluate(async ({ scopeKey, snapshot }) => {
      await window.AgentStreamBundle.agentCache.replaceSnapshot(scopeKey, snapshot)
    }, input)
    const start = async target => target.evaluate(async ({ scopeKey, snapshot }) => {
      const { coordinateAgentTask, agentCache } = window.AgentStreamBundle
      const states = []
      await coordinateAgentTask({ scopeKey, snapshot, signal: new AbortController().signal,
        onSnapshot(value) { states.push(value.status) }, onEvent() {}, onState() {} })
      const preview = await agentCache.preview(scopeKey, snapshot.conversationId)
      return { states, content: preview.messages.find(item => item.taskId === snapshot.taskId)?.baseContent }
    }, input)
    const first = start(page)
    await new Promise(resolve => setTimeout(resolve, 60))
    const second = start(follower)
    const [leaderResult, followerResult] = await Promise.all([first, second])
    assert.equal(multiTabFixture.requests, 1)
    assert.equal(leaderResult.content, 'A')
    assert.equal(followerResult.content, 'A')
    assert.ok(followerResult.states.includes('COMPLETED'))
  } finally { multiTabFixture = null; await browser.close() }
})

test.after(() => server.close())
