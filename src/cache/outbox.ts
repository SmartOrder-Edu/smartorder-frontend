import {
  AGENT_CACHE_STORE,
  openAgentCacheDb,
  requestToPromise,
  transactionDone,
} from './db'
import type { OutboxRecord } from './types'

/**
 * 发送意图 outbox。
 *
 * <p>发送前先落盘 `clientRequestId + payload`，创建响应丢失时可以用同一个幂等键重放；
 * 服务端会命中幂等直接返回原任务，不会重复开轮或重复调用模型。</p>
 *
 * <p>注意：本地 IndexedDB 的主键字段仍叫 `clientRequestId`（历史库兼容），
 * 它的值就是服务端的 `taskRequestId`；请求 payload 里传的是 `taskRequestId`。</p>
 */

const OUTBOX = AGENT_CACHE_STORE.outbox

export async function putCachedOutbox(userId: string, record: OutboxRecord): Promise<boolean> {
  const db = await openAgentCacheDb(userId)
  if (!db) return false
  try {
    const tx = db.transaction(OUTBOX, 'readwrite')
    tx.objectStore(OUTBOX).put(record)
    await transactionDone(tx)
    return true
  } catch (err) {
    console.warn('[agentCache] 保存发送意图失败:', err)
    return false
  }
}

export async function removeCachedOutbox(userId: string, clientRequestId: string): Promise<void> {
  const db = await openAgentCacheDb(userId)
  if (!db) return
  try {
    const tx = db.transaction(OUTBOX, 'readwrite')
    tx.objectStore(OUTBOX).delete(clientRequestId)
    await transactionDone(tx)
  } catch {
    // ignore
  }
}

export async function listCachedOutbox(userId: string): Promise<OutboxRecord[]> {
  const db = await openAgentCacheDb(userId)
  if (!db) return []
  try {
    const tx = db.transaction(OUTBOX, 'readonly')
    const records = await requestToPromise(tx.objectStore(OUTBOX).getAll())
    await transactionDone(tx)
    return ((records as OutboxRecord[]) || []).sort((a, b) => a.createdAt - b.createdAt)
  } catch {
    return []
  }
}

export async function markCachedOutboxFailed(
  userId: string,
  clientRequestId: string,
  errorMessage: string,
): Promise<void> {
  const db = await openAgentCacheDb(userId)
  if (!db) return
  try {
    const tx = db.transaction(OUTBOX, 'readwrite')
    const store = tx.objectStore(OUTBOX)
    const current = await requestToPromise(store.get(clientRequestId)) as OutboxRecord | undefined
    if (current) {
      store.put({
        ...current,
        status: 'failed',
        attempts: (current.attempts || 0) + 1,
        lastError: errorMessage,
      })
    }
    await transactionDone(tx)
  } catch {
    // ignore
  }
}

export async function pruneCachedOutbox(userId: string, maxAgeMs = 30 * 60_000): Promise<void> {
  const db = await openAgentCacheDb(userId)
  if (!db) return
  try {
    const cutoff = Date.now() - maxAgeMs
    const tx = db.transaction(OUTBOX, 'readwrite')
    const store = tx.objectStore(OUTBOX)
    const request = store.openCursor()
    request.onsuccess = () => {
      const cursor = request.result
      if (!cursor) return
      const record = cursor.value as OutboxRecord
      if (record.createdAt < cutoff) cursor.delete()
      cursor.continue()
    }
    await transactionDone(tx)
  } catch {
    // ignore
  }
}
