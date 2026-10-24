import { compareStreamIds, toEventOrderKey } from '../services/agentStreamProtocol'

/** 服务端任务状态与快照的前后端共享契约。 */
export type AgentTaskStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
export interface AgentTaskSnapshot {
  taskId: string
  conversationId: string
  status: AgentTaskStatus
  streamVersion: string
  snapshotRevision: number
  snapshotEventId: string
  messages: Array<{ messageId: string; role: string; content: string; status: string;
    revision: number; sequenceNo?: number }>
}
export interface PersistedAgentEvent {
  schemaVersion?: number
  taskId: string
  streamVersion: string
  eventId: string
  chunkId?: string
  messageId?: string
  content?: string
  type: string
  payload?: unknown
  status?: AgentTaskStatus
}
export interface CachedMessage {
  scopeKey: string
  messageId: string
  conversationId: string
  taskId?: string
  role: string
  baseContent: string
  status: string
  version: number
  baseEventId: string
  updatedAt: number
  sequenceNo?: number
}
export interface TaskCheckpoint {
  scopeKey: string
  taskId: string
  conversationId: string
  streamVersion: string
  lastAppliedEventId: string
  snapshotRevision: number
  status: AgentTaskStatus
  updatedAt: number
}
interface EventRecord {
  scopeKey: string
  taskId: string
  eventOrderKey: string
  eventId: string
  eventType: string
  messageId?: string
  chunkId?: string
  payload: PersistedAgentEvent
  createdAt: number
}

const DB_NAME = 'agent-chat-cache'
const DB_VERSION = 1
let opening: Promise<IDBDatabase> | undefined

/** 打开可丢弃的本地缓存；升级失败由调用方切换服务器恢复模式。 */
function openDb(): Promise<IDBDatabase> {
  if (opening) return opening
  opening = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      const conversations = db.createObjectStore('conversations', { keyPath: ['scopeKey', 'conversationId'] })
      conversations.createIndex('byScopeUpdated', ['scopeKey', 'updatedAt'])
      const messages = db.createObjectStore('messages', { keyPath: ['scopeKey', 'messageId'] })
      messages.createIndex('byConversation', ['scopeKey', 'conversationId'])
      messages.createIndex('byTask', ['scopeKey', 'taskId'])
      const checkpoints = db.createObjectStore('taskCheckpoints', { keyPath: ['scopeKey', 'taskId'] })
      checkpoints.createIndex('byConversation', ['scopeKey', 'conversationId'])
      const events = db.createObjectStore('eventCache', { keyPath: ['scopeKey', 'taskId', 'eventOrderKey'] })
      events.createIndex('byTask', ['scopeKey', 'taskId'])
      events.createIndex('byMessage', ['scopeKey', 'messageId'])
      db.createObjectStore('cacheMeta', { keyPath: 'key' })
    }
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close()
      resolve(request.result)
    }
    request.onerror = () => { opening = undefined; reject(request.error) }
    request.onblocked = () => { opening = undefined; reject(new Error('INDEXED_DB_BLOCKED')) }
  })
  return opening
}

/** 将 IDBRequest 接入 Promise；事务内只等待 IDB 请求，不能等待网络。 */
function result<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** 只有 complete 事件代表内容与游标都已成功提交。 */
function completed(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onabort = () => reject(tx.error || new Error('INDEXED_DB_ABORTED'))
    tx.onerror = () => reject(tx.error || new Error('INDEXED_DB_ERROR'))
  })
}

/** 快照替换和事件提交共用同一数据库连接。 */
export const agentCache = {
  /** 读取已提交快照与增量，供 F5 时先显示可撤销的本地预览。 */
  async preview(scopeKey: string, conversationId: string) {
    const db = await openDb()
    const tx = db.transaction(['messages', 'taskCheckpoints', 'eventCache'], 'readonly')
    const messages = await result(tx.objectStore('messages').index('byConversation').getAll([scopeKey, conversationId])) as CachedMessage[]
    const checkpoints = await result(tx.objectStore('taskCheckpoints').index('byConversation').getAll([scopeKey, conversationId])) as TaskCheckpoint[]
    const allEvents: EventRecord[] = []
    for (const checkpoint of checkpoints) {
      const rows = await result(tx.objectStore('eventCache').index('byTask').getAll([scopeKey, checkpoint.taskId])) as EventRecord[]
      allEvents.push(...rows)
    }
    await completed(tx)
    allEvents.sort((a, b) => compareStreamIds(a.eventId, b.eventId))
    const projected = messages.map(message => ({ ...message }))
    for (const event of allEvents) {
      // 任务创建时占位 messageId 可能早于 MySQL 正式消息 ID；同任务只投影一个助手回答。
      const message = projected.find(item => item.taskId === event.taskId && item.role === 'assistant')
      if (message && event.eventType === 'agent.text.delta') message.baseContent += event.payload.content || ''
      if (message && event.eventType === 'task_completed') message.status = 'COMPLETED'
    }
    return { messages: projected.sort((a, b) => a.sequenceNo != null && b.sequenceNo != null
      ? a.sequenceNo - b.sequenceNo : a.updatedAt - b.updatedAt), checkpoints }
  },

  /** 快照、旧事件删除和 checkpoint 重置必须在同一事务。 */
  async replaceSnapshot(scopeKey: string, snapshot: AgentTaskSnapshot): Promise<boolean> {
    const db = await openDb()
    const tx = db.transaction(['messages', 'taskCheckpoints', 'eventCache', 'conversations'], 'readwrite')
    const done = completed(tx)
    try {
      const checkpointStore = tx.objectStore('taskCheckpoints')
      const previous = await result(checkpointStore.get([scopeKey, snapshot.taskId])) as TaskCheckpoint | undefined
      // 服务端快照落后于本地已提交事件时，保留消息与游标的同一前缀。
      const terminal = ['COMPLETED', 'FAILED', 'CANCELLED'].includes(snapshot.status)
      if (previous && previous.streamVersion === snapshot.streamVersion && !terminal
          && (compareStreamIds(previous.lastAppliedEventId, snapshot.snapshotEventId) > 0
            || previous.snapshotRevision > snapshot.snapshotRevision)) {
        await done
        return false
      }
      // 终态以 MySQL 正文为准，仍保留已经提交的最大游标，避免终态事件回退进度。
      if (previous && previous.streamVersion === snapshot.streamVersion && terminal) {
        snapshot = { ...snapshot,
          snapshotEventId: compareStreamIds(previous.lastAppliedEventId, snapshot.snapshotEventId) > 0
            ? previous.lastAppliedEventId : snapshot.snapshotEventId,
          snapshotRevision: Math.max(previous.snapshotRevision, snapshot.snapshotRevision) }
      }
      const messages = tx.objectStore('messages')
      const events = tx.objectStore('eventCache')
      const oldMessages = await result(messages.index('byTask').getAllKeys([scopeKey, snapshot.taskId]))
      const oldEvents = await result(events.index('byTask').getAllKeys([scopeKey, snapshot.taskId]))
      for (const key of oldMessages) messages.delete(key)
      for (const key of oldEvents) events.delete(key)
      for (const message of snapshot.messages) {
        messages.put({ scopeKey, messageId: message.messageId, conversationId: snapshot.conversationId,
          taskId: snapshot.taskId, role: message.role, baseContent: message.content, status: message.status,
          version: message.revision, baseEventId: snapshot.snapshotEventId,
          sequenceNo: message.sequenceNo, updatedAt: Date.now() } satisfies CachedMessage)
      }
      checkpointStore.put({ scopeKey, taskId: snapshot.taskId,
        conversationId: snapshot.conversationId, streamVersion: snapshot.streamVersion,
        lastAppliedEventId: snapshot.snapshotEventId, snapshotRevision: snapshot.snapshotRevision,
        status: snapshot.status, updatedAt: Date.now() } satisfies TaskCheckpoint)
      tx.objectStore('conversations').put({ scopeKey, conversationId: snapshot.conversationId,
        updatedAt: Date.now(), lastAccessAt: Date.now(), revision: snapshot.snapshotRevision })
      await done
      return true
    } catch (error) { tx.abort(); throw error }
  },

  /** 事件和进度在一个读写事务提交；重复或倒退事件不改变内容。 */
  async persistEvent(scopeKey: string, event: PersistedAgentEvent): Promise<boolean> {
    const db = await openDb()
    const tx = db.transaction(['eventCache', 'taskCheckpoints'], 'readwrite')
    const done = completed(tx)
    try {
      const checkpoints = tx.objectStore('taskCheckpoints')
      const checkpoint = await result(checkpoints.get([scopeKey, event.taskId])) as TaskCheckpoint | undefined
      if (!checkpoint) throw new Error('CHECKPOINT_MISSING')
      if (checkpoint.streamVersion !== event.streamVersion) throw new Error('STREAM_VERSION_MISMATCH')
      if (compareStreamIds(event.eventId, checkpoint.lastAppliedEventId) <= 0) {
        await done
        return false
      }
      tx.objectStore('eventCache').put({ scopeKey, taskId: event.taskId,
        eventOrderKey: toEventOrderKey(event.eventId), eventId: event.eventId,
        eventType: event.type, messageId: event.messageId, chunkId: event.chunkId,
        payload: event, createdAt: Date.now() } satisfies EventRecord)
      checkpoints.put({ ...checkpoint, lastAppliedEventId: event.eventId,
        status: event.status && ['COMPLETED', 'FAILED', 'CANCELLED'].includes(event.status)
          ? event.status : 'RUNNING', updatedAt: Date.now() } satisfies TaskCheckpoint)
      await done
      return true
    } catch (error) { tx.abort(); throw error }
  },

  /** 权威历史消息写入本地，缓存丢失时仍可由服务端重新建立。 */
  async saveHistory(scopeKey: string, conversationId: string,
                    history: Array<{ id: string; role: string; content: string; status: string;
                      updatedAt: number; sequenceNo?: number }>) {
    const db = await openDb()
    const tx = db.transaction(['messages', 'conversations'], 'readwrite')
    const done = completed(tx)
    for (const item of history) {
      const messages = tx.objectStore('messages')
      const existing = await result(messages.get([scopeKey, item.id])) as CachedMessage | undefined
      // 活动任务消息由快照和事件维护，历史接口不能清除其 taskId 与基线游标。
      if (existing?.taskId) continue
      messages.put({ scopeKey, conversationId,
        messageId: item.id, role: item.role, baseContent: item.content,
        status: item.status, version: 0, baseEventId: '0-0', updatedAt: item.updatedAt,
        sequenceNo: item.sequenceNo } satisfies CachedMessage)
    }
    tx.objectStore('conversations').put({ scopeKey, conversationId,
      updatedAt: Date.now(), lastAccessAt: Date.now(), revision: 0 })
    await done
  },

  /** 服务端确认会话删除后清理该会话全部缓存。 */
  async clearConversation(scopeKey: string, conversationId: string) {
    const db = await openDb()
    const preview = await this.preview(scopeKey, conversationId)
    const tx = db.transaction(['conversations', 'messages', 'taskCheckpoints', 'eventCache'], 'readwrite')
    const done = completed(tx)
    tx.objectStore('conversations').delete([scopeKey, conversationId])
    for (const message of preview.messages) tx.objectStore('messages').delete([scopeKey, message.messageId])
    for (const checkpoint of preview.checkpoints) {
      tx.objectStore('taskCheckpoints').delete([scopeKey, checkpoint.taskId])
      const keys = await result(tx.objectStore('eventCache').index('byTask').getAllKeys([scopeKey, checkpoint.taskId]))
      for (const key of keys) tx.objectStore('eventCache').delete(key)
    }
    await done
  },

  /** 登出时立即清除身份作用域下的所有对象仓库记录。 */
  async clearScope(scopeKey: string) {
    const db = await openDb()
    const tx = db.transaction(['conversations', 'messages', 'taskCheckpoints', 'eventCache'], 'readwrite')
    const done = completed(tx)
    for (const name of ['conversations', 'messages', 'taskCheckpoints', 'eventCache']) {
      const store = tx.objectStore(name)
      const keys = await result(store.getAllKeys(IDBKeyRange.bound([scopeKey], [scopeKey, []], false, true)))
      for (const key of keys) store.delete(key)
    }
    await done
  },

  /** 只淘汰已完成的旧会话，不触碰仍在运行的 checkpoint。 */
  async cleanup(scopeKey: string, maxConversations = 50, maxAgeMs = 30 * 24 * 60 * 60 * 1000) {
    const db = await openDb()
    const tx = db.transaction('conversations', 'readonly')
    const rows = await result(tx.objectStore('conversations').index('byScopeUpdated').getAll(
      IDBKeyRange.bound([scopeKey, 0], [scopeKey, Number.MAX_SAFE_INTEGER]))) as Array<{ conversationId: string; updatedAt: number }>
    await completed(tx)
    const old = rows.sort((a, b) => b.updatedAt - a.updatedAt)
      .filter((row, index) => index >= maxConversations || Date.now() - row.updatedAt > maxAgeMs)
    for (const row of old) {
      const preview = await this.preview(scopeKey, row.conversationId)
      if (preview.checkpoints.some(item => item.status === 'RUNNING' || item.status === 'QUEUED')) continue
      await this.clearConversation(scopeKey, row.conversationId)
    }
  },
}
