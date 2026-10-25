import type { ChatMessage } from '@/composables/useAgentChat'
import {
  AGENT_CACHE_STORE,
  openAgentCacheDb,
  requestToPromise,
  transactionDone,
} from './db'
import { fromCachedMessage, toCachedMessage } from './messageMapping'
import type { CachedMessageRecord } from './types'

/**
 * 消息物化视图的读写。
 *
 * <p>所有方法失败都返回空/ false，不向上抛：缓存是加速器，不能阻断对话。</p>
 */

const MESSAGES = AGENT_CACHE_STORE.messages

function maxSortKey(): number {
  return Number.MAX_SAFE_INTEGER
}

export async function saveCachedMessages(
  userId: string,
  conversationId: string,
  messages: ChatMessage[],
  options: { syncedAt?: number } = {},
): Promise<boolean> {
  if (!conversationId || messages.length === 0) return false
  const db = await openAgentCacheDb(userId)
  if (!db) return false

  try {
    const tx = db.transaction(MESSAGES, 'readwrite')
    const store = tx.objectStore(MESSAGES)
    for (const message of messages) {
      const record = toCachedMessage(conversationId, message, {
        serverSyncedAt: message.messageId ? (options.syncedAt ?? Date.now()) : undefined,
      })
      store.put(record)
    }
    await transactionDone(tx)
    return true
  } catch (err) {
    console.warn('[agentCache] 保存消息失败:', err)
    return false
  }
}

export async function saveCachedMessage(
  userId: string,
  conversationId: string,
  message: ChatMessage,
  options: { syncedAt?: number } = {},
): Promise<boolean> {
  return saveCachedMessages(userId, conversationId, [message], options)
}

async function readMessages(
  userId: string,
  conversationId: string,
  limit: number,
  beforeSortKey?: number,
): Promise<ChatMessage[]> {
  const db = await openAgentCacheDb(userId)
  if (!db) return []

  try {
    const tx = db.transaction(MESSAGES, 'readonly')
    const index = tx.objectStore(MESSAGES).index('byConversationSort')
    const upper = beforeSortKey === undefined ? maxSortKey() : Math.max(0, beforeSortKey - 1)
    const range = IDBKeyRange.bound([conversationId, 0], [conversationId, upper])
    const records: CachedMessageRecord[] = []

    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor(range, 'prev')
      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor || records.length >= limit) {
          resolve()
          return
        }
        records.push(cursor.value as CachedMessageRecord)
        cursor.continue()
      }
      request.onerror = () => reject(request.error ?? new Error('读取消息失败'))
    })

    await transactionDone(tx)
    return records.reverse().map(fromCachedMessage)
  } catch (err) {
    console.warn('[agentCache] 读取消息失败:', err)
    return []
  }
}

/** 取最近 N 条消息（正序返回） */
export function getCachedMessages(userId: string, conversationId: string, limit = 200): Promise<ChatMessage[]> {
  return readMessages(userId, conversationId, Math.max(1, limit))
}

/** 取比 beforeSortKey 更早的一页（正序返回） */
export function getCachedMessagesBefore(
  userId: string,
  conversationId: string,
  beforeSortKey: number,
  limit = 50,
): Promise<ChatMessage[]> {
  return readMessages(userId, conversationId, Math.max(1, limit), beforeSortKey)
}

export async function getCachedMessageByKey(
  userId: string,
  messageKey: string,
): Promise<ChatMessage | null> {
  const db = await openAgentCacheDb(userId)
  if (!db) return null
  try {
    const tx = db.transaction(MESSAGES, 'readonly')
    const record = await requestToPromise(tx.objectStore(MESSAGES).get(messageKey))
    await transactionDone(tx)
    return record ? fromCachedMessage(record as CachedMessageRecord) : null
  } catch {
    return null
  }
}

export async function deleteCachedMessage(userId: string, messageKey: string): Promise<boolean> {
  const db = await openAgentCacheDb(userId)
  if (!db) return false
  try {
    const tx = db.transaction(MESSAGES, 'readwrite')
    tx.objectStore(MESSAGES).delete(messageKey)
    await transactionDone(tx)
    return true
  } catch {
    return false
  }
}

export async function clearCachedMessages(userId: string, conversationId: string): Promise<boolean> {
  const db = await openAgentCacheDb(userId)
  if (!db) return false
  try {
    const tx = db.transaction(MESSAGES, 'readwrite')
    const index = tx.objectStore(MESSAGES).index('byConversation')
    const range = IDBKeyRange.only(conversationId)
    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor(range)
      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor) {
          resolve()
          return
        }
        cursor.delete()
        cursor.continue()
      }
      request.onerror = () => reject(request.error ?? new Error('清理消息失败'))
    })
    await transactionDone(tx)
    return true
  } catch (err) {
    console.warn('[agentCache] 清理消息失败:', err)
    return false
  }
}

export async function countCachedMessages(userId: string, conversationId: string): Promise<number> {
  const db = await openAgentCacheDb(userId)
  if (!db) return 0
  try {
    const tx = db.transaction(MESSAGES, 'readonly')
    const index = tx.objectStore(MESSAGES).index('byConversation')
    const count = await requestToPromise(index.count(IDBKeyRange.only(conversationId)))
    await transactionDone(tx)
    return count
  } catch {
    return 0
  }
}
