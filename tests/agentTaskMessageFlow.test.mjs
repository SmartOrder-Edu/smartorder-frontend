import test from 'node:test'
import assert from 'node:assert/strict'
import { executeAgentTaskMessage, resumeAgentTaskMessage } from '../src/services/agentTaskMessageFlow.ts'

const receipt = { taskId: 'task-1', messageId: 'message-1', conversationId: 'conversation-1',
  streamVersion: 'v1-task-1', status: 'QUEUED' }
const snapshot = (status, content) => ({ ...receipt, status, snapshotEventId: '0-0',
  snapshotRevision: 0, messages: [{ messageId: receipt.messageId, role: 'assistant',
    content, status, revision: 0 }] })

test('创建一次任务后先通知确认，再订阅事件并以终态快照定稿', async () => {
  const steps = []
  const client = {
    async createTask(body) {
      steps.push(`POST:${body.requestId}`)
      return receipt
    },
    async getSnapshot(taskId) {
      steps.push(`SNAPSHOT:${taskId}`)
      return snapshot('RUNNING', '你')
    },
    async follow(options) {
      steps.push(`SSE:${options.snapshot.taskId}`)
      options.onEvent({ id: '1-1', event: 'agent.text.delta',
        data: JSON.stringify({ content: '好' }) })
      options.onSnapshot(snapshot('COMPLETED', '你好'))
    },
  }
  const result = await executeAgentTaskMessage(client,
    { message: '测试', conversationId: 'conversation-1' }, 'request-1', {
      signal: new AbortController().signal,
      onReceipt(value) { steps.push(`RECEIPT:${value.messageId}`) },
      onText(value) { steps.push(`TEXT:${value}`) },
    })

  assert.deepEqual(steps, ['POST:request-1', 'RECEIPT:message-1',
    'SNAPSHOT:task-1', 'TEXT:你', 'SSE:task-1', 'TEXT:你好', 'TEXT:你好'])
  assert.deepEqual(result, { ...receipt, status: 'COMPLETED', content: '你好' })
})

test('服务端任务失败时返回失败终态，不把失败当成正常完成', async () => {
  const client = {
    async createTask() { return receipt },
    async getSnapshot() { return snapshot('FAILED', '部分内容') },
    async follow() { assert.fail('终态任务不应再次订阅') },
  }
  const result = await executeAgentTaskMessage(client,
    { message: '测试', conversationId: 'conversation-1' }, 'request-1',
    { signal: new AbortController().signal })
  assert.equal(result.status, 'FAILED')
  assert.equal(result.content, '部分内容')
})

test('SSE 无法恢复时抛出错误，让页面显示失败而非假装完成', async () => {
  const client = {
    async createTask() { return receipt },
    async getSnapshot() { return snapshot('RUNNING', '') },
    async follow() { throw new Error('STREAM_READ_FAILED') },
  }
  await assert.rejects(() => executeAgentTaskMessage(client,
    { message: '测试', conversationId: 'conversation-1' }, 'request-1',
    { signal: new AbortController().signal }), /STREAM_READ_FAILED/)
})

test('流式生成部分正文后收到失败终态，保留服务端快照并报告失败', async () => {
  const client = {
    async createTask() { return receipt },
    async getSnapshot() { return snapshot('RUNNING', '') },
    async follow(options) {
      options.onEvent({ id: '1-1', event: 'agent.text.delta',
        data: JSON.stringify({ content: '部分' }) })
      options.onSnapshot(snapshot('FAILED', '部分'))
    },
  }
  const result = await executeAgentTaskMessage(client,
    { message: '测试', conversationId: 'conversation-1' }, 'request-1',
    { signal: new AbortController().signal })
  assert.equal(result.status, 'FAILED')
  assert.equal(result.content, '部分')
})

test('订阅意外结束但任务仍运行时，不返回成功结果', async () => {
  const client = {
    async createTask() { return receipt },
    async getSnapshot() { return snapshot('RUNNING', '') },
    async follow() {},
  }
  await assert.rejects(() => executeAgentTaskMessage(client,
    { message: '测试', conversationId: 'conversation-1' }, 'request-1',
    { signal: new AbortController().signal }), /AGENT_TASK_STREAM_INCOMPLETE/)
})

test('刷新恢复只读取原任务快照和事件，不再次 POST', async () => {
  const steps = []
  const client = {
    async createTask() { assert.fail('恢复不得新建 Agent 任务') },
    async getSnapshot(id) { steps.push(`GET:${id}`); return snapshot('RUNNING', '旧') },
    async follow(options) {
      steps.push('SSE')
      options.onSnapshot(snapshot('COMPLETED', '旧答案'))
    },
  }
  const result = await resumeAgentTaskMessage(client, receipt,
    { signal: new AbortController().signal })
  assert.deepEqual(steps, ['GET:task-1', 'SSE'])
  assert.equal(result.content, '旧答案')
})

test('订阅已中止时不读取快照或追加事件', async () => {
  const controller = new AbortController()
  controller.abort()
  const client = {
    async createTask() { assert.fail('不应 POST') },
    async getSnapshot() { assert.fail('不应 GET') },
    async follow() { assert.fail('不应订阅') },
  }
  await assert.rejects(() => resumeAgentTaskMessage(client, receipt,
    { signal: controller.signal }), { name: 'AbortError' })
})

test('创建请求失败时不订阅 SSE，错误交给页面显示', async () => {
  const client = {
    async createTask() { throw new Error('POST_FAILED') },
    async getSnapshot() { assert.fail('不应查询快照') },
    async follow() { assert.fail('不应订阅') },
  }
  await assert.rejects(() => executeAgentTaskMessage(client,
    { message: '测试', conversationId: 'conversation-1' }, 'request-1',
    { signal: new AbortController().signal }), /POST_FAILED/)
})

test('收到确认但快照查询失败时不订阅 SSE，保留确认用于稍后恢复', async () => {
  let confirmed = null
  const client = {
    async createTask() { return receipt },
    async getSnapshot() { throw new Error('SNAPSHOT_FAILED') },
    async follow() { assert.fail('不应订阅') },
  }
  await assert.rejects(() => executeAgentTaskMessage(client,
    { message: '测试', conversationId: 'conversation-1' }, 'request-1', {
      signal: new AbortController().signal,
      onReceipt(value) { confirmed = value },
    }), /SNAPSHOT_FAILED/)
  assert.deepEqual(confirmed, receipt)
})
