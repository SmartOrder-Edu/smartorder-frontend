import type { ConversationVO } from '@/api/agent'
import {
  AGENT_CACHE_STORE,
  estimateCacheUsage,
  openAgentCacheDb,
  requestToPromise,
  transactionDone,
} from './db'
import type { CachedConversationRecord, ConversationSyncRecord } from './types'

const CONVERSATIONS = AGENT_CACHE_STORE.conversations
const SYNC = AGENT_CACHE_STORE.conversationSync
const MESSAGES = AGENT_CACHE_STORE.messages

export async function getCachedConversations(userId: string): Promise<ConversationVO[]> {
  const db = await openAgentCacheDb(userId)
  if (!db) return []
  try {
    const tx = db.transaction(CONVERSATIONS, 'readonly')
    const index = tx.objectStore(CONVERSATIONS).index('byLastActiveTime')
    const records: CachedConversationRecord[] = []
    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor(null, 'prev')
      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor) {
          resolve()
          return
        }
        records.push(cursor.value as CachedConversationRecord)
        cursor.continue()
      }
      request.onerror = () => reject(request.error ?? new Error('读取会话列表失败'))
    })
    await transactionDone(tx)
    return records.map(record => ({
      conversationId: record.conversationId,
      title: record.title,
      lastMessage: record.lastMessage,
      messageCount: record.messageCount,
      lastActiveTime: record.lastActiveTime,
    }))
  } catch (err) {
    console.warn('[agentCache] 读取会话列表失败:', err)
    return []
  }
}

export async function saveCachedConversations(
  userId: string,
  conversations: ConversationVO[],
): Promise<boolean> {
  if (!conversations.length) return false
  const db = await openAgentCacheDb(userId)
  if (!db) return false
  try {
    const tx = db.transaction(CONVERSATIONS, 'readwrite')
    const store = tx.objectStore(CONVERSATIONS)
    const now = Date.now()
    for (const conversation of conversations) {
      if (!conversation.conversationId) continue
      const record: CachedConversationRecord = {
        conversationId: conversation.conversationId,
        title: conversation.title ?? null,
        lastMessage: conversation.lastMessage ?? null,
        messageCount: Number(conversation.messageCount) || 0,
        lastActiveTime: conversation.lastActiveTime || new Date(now).toISOString(),
        cachedAt: now,
      }
      store.put(record)
    }
    await transactionDone(tx)
    return true
  } catch (err) {
    console.warn('[agentCache] 保存会话列表失败:', err)
    return false
  }
}

export async function upsertCachedConversation(
  userId: string,
  conversation: ConversationVO,
): Promise<boolean> {
  return saveCachedConversations(userId, [conversation])
}

export async function removeCachedConversation(userId: string, conversationId: string): Promise<void> {
  const db = await openAgentCacheDb(userId)
  if (!db) return
  try {
    const tx = db.transaction([CONVERSATIONS, SYNC, MESSAGES], 'readwrite')
    tx.objectStore(CONVERSATIONS).delete(conversationId)
    tx.objectStore(SYNC).delete(conversationId)
    const index = tx.objectStore(MESSAGES).index('byConversation')
    const request = index.openCursor(IDBKeyRange.only(conversationId))
    request.onsuccess = () => {
      const cursor = request.result
      if (!cursor) return
      cursor.delete()
      cursor.continue()
    }
    await transactionDone(tx)
  } catch (err) {
    console.warn('[agentCache] 删除会话缓存失败:', err)
  }
}

export async function getConversationSync(
  userId: string,
  conversationId: string,
): Promise<ConversationSyncRecord | null> {
  const db = await openAgentCacheDb(userId)
  if (!db) return null
  try {
    const tx = db.transaction(SYNC, 'readonly')
    const record = await requestToPromise(tx.objectStore(SYNC).get(conversationId))
    await transactionDone(tx)
    return (record as ConversationSyncRecord | undefined) ?? null
  } catch {
    return null
  }
}

export async function saveConversationSync(
  userId: string,
  record: ConversationSyncRecord,
): Promise<boolean> {
  const db = await openAgentCacheDb(userId)
  if (!db) return false
  try {
    const tx = db.transaction(SYNC, 'readwrite')
    tx.objectStore(SYNC).put(record)
    await transactionDone(tx)
    return true
  } catch (err) {
    console.warn('[agentCache] 保存会话同步元数据失败:', err)
    return false
  }
}

export async function clearAllCachedData(userId: string): Promise<void> {
  const db = await openAgentCacheDb(userId)
  if (!db) return
  try {
    const stores = [
      CONVERSATIONS,
      SYNC,
      MESSAGES,
      AGENT_CACHE_STORE.streams,
      AGENT_CACHE_STORE.streamEvents,
      AGENT_CACHE_STORE.outbox,
      AGENT_CACHE_STORE.meta,
    ]
    const tx = db.transaction(stores, 'readwrite')
    for (const store of stores) {
      tx.objectStore(store).clear()
    }
    await transactionDone(tx)
  } catch (err) {
    console.warn('[agentCache] 清空缓存失败:', err)
  }
}

export interface CacheGcOptions {
  /** 最多保留多少个会话的消息 */
  maxConversations?: number
  /** 保留当前打开的会话，不参与回收 */
  keepConversationId?: string
}

/**
 * 轻量 GC：只处理“会话数量超限”和磁盘用量过高两种情况。
 * 不做复杂 LRU 评分，避免误删用户正在看的会话。
 */
export async function runCacheGc(userId: string, options: CacheGcOptions = {}): Promise<void> {
  const maxConversations = options.maxConversations ?? 20
  const db = await openAgentCacheDb(userId)
  if (!db) return

  try {
    const conversations = await getCachedConversations(userId)
    let allowed = maxConversations
    if (conversations.length <= maxConversations) {
      const estimate = await estimateCacheUsage()
      if (!estimate || !estimate.quota || estimate.usage / estimate.quota < 0.8) return
      // 配额吃紧时即使会话数没超限，也主动收缩到一半，给后续写入留空间
      allowed = Math.max(1, Math.floor(maxConversations * 0.5))
    }

    const ordered = [...conversations].sort((a, b) => {
      const left = a.lastActiveTime || ''
      const right = b.lastActiveTime || ''
      return left.localeCompare(right)
    })

    const keep = new Set<string>()
    if (options.keepConversationId) keep.add(options.keepConversationId)
    for (let i = ordered.length - 1; i >= 0 && keep.size < allowed; i -= 1) {
      keep.add(ordered[i].conversationId)
    }

    for (const conversation of ordered) {
      if (keep.has(conversation.conversationId)) continue
      await removeCachedConversation(userId, conversation.conversationId)
    }
  } catch (err) {
    console.warn('[agentCache] 缓存回收失败:', err)
  }
}
