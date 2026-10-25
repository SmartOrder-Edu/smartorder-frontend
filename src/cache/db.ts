/**
 * Agent 会话缓存的 IndexedDB 基础设施。
 *
 * <p>按用户分库：`smartorder-agent-cache-u{userId}`。这样“退出登录/切换账号”是删库，
 * 而不是靠每条查询都记得加 userId 过滤；少写一次过滤就是串号事故。</p>
 *
 * <p>所有调用都允许失败：隐私模式、配额为 0、浏览器禁用 IndexedDB 时返回 null，
 * 上层自动退回内存 / sessionStorage，不影响主流程。</p>
 */

export const AGENT_CACHE_VERSION = 1

export const AGENT_CACHE_DB_PREFIX = 'smartorder-agent-cache-u'

export const AGENT_CACHE_STORE = {
  meta: 'meta',
  conversations: 'conversations',
  messages: 'messages',
  conversationSync: 'conversationSync',
  streams: 'streams',
  streamEvents: 'streamEvents',
  outbox: 'outbox',
} as const

export type AgentCacheStoreName = typeof AGENT_CACHE_STORE[keyof typeof AGENT_CACHE_STORE]

const CACHE_ENABLED_KEY = 'smartorder:agent:cacheEnabled'

let dbPromise: Promise<IDBDatabase | null> | null = null
let dbUserId: string | null = null

export function isAgentCacheEnabled(): boolean {
  try {
    return localStorage.getItem(CACHE_ENABLED_KEY) !== '0'
  } catch {
    return true
  }
}

export function setAgentCacheEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(CACHE_ENABLED_KEY, enabled ? '1' : '0')
  } catch {
    // 隐私模式：设置不落盘也不影响本次内存行为
  }
}

export function isIndexedDbAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null
  } catch {
    return false
  }
}

export function agentCacheDbName(userId: string): string {
  const safe = String(userId).replace(/[^0-9A-Za-z_-]/g, '')
  return `${AGENT_CACHE_DB_PREFIX}${safe}`
}

function createSchema(db: IDBDatabase): void {
  if (!db.objectStoreNames.contains(AGENT_CACHE_STORE.meta)) {
    db.createObjectStore(AGENT_CACHE_STORE.meta, { keyPath: 'key' })
  }

  if (!db.objectStoreNames.contains(AGENT_CACHE_STORE.conversations)) {
    const store = db.createObjectStore(AGENT_CACHE_STORE.conversations, { keyPath: 'conversationId' })
    store.createIndex('byLastActiveTime', 'lastActiveTime')
  }

  if (!db.objectStoreNames.contains(AGENT_CACHE_STORE.messages)) {
    const store = db.createObjectStore(AGENT_CACHE_STORE.messages, { keyPath: 'key' })
    store.createIndex('byConversationSort', ['conversationId', 'sortKey'])
    store.createIndex('byConversation', 'conversationId')
  }

  if (!db.objectStoreNames.contains(AGENT_CACHE_STORE.conversationSync)) {
    db.createObjectStore(AGENT_CACHE_STORE.conversationSync, { keyPath: 'conversationId' })
  }

  if (!db.objectStoreNames.contains(AGENT_CACHE_STORE.streams)) {
    const store = db.createObjectStore(AGENT_CACHE_STORE.streams, { keyPath: 'generationId' })
    store.createIndex('byConversation', 'conversationId')
  }

  if (!db.objectStoreNames.contains(AGENT_CACHE_STORE.streamEvents)) {
    db.createObjectStore(AGENT_CACHE_STORE.streamEvents, { keyPath: ['generationId', 'seq'] })
  }

  if (!db.objectStoreNames.contains(AGENT_CACHE_STORE.outbox)) {
    const store = db.createObjectStore(AGENT_CACHE_STORE.outbox, { keyPath: 'clientRequestId' })
    store.createIndex('byCreatedAt', 'createdAt')
  }
}

/**
 * 打开当前用户的缓存库。失败返回 null，不抛异常。
 */
export function openAgentCacheDb(userId: string): Promise<IDBDatabase | null> {
  if (!isAgentCacheEnabled() || !userId || !isIndexedDbAvailable()) {
    return Promise.resolve(null)
  }
  if (dbPromise && dbUserId === userId) return dbPromise

  closeAgentCacheDb()
  dbUserId = userId

  const promise = new Promise<IDBDatabase | null>((resolve) => {
    let settled = false
    const finish = (db: IDBDatabase | null) => {
      if (settled) {
        db?.close()
        return
      }
      settled = true
      resolve(db)
    }

    let request: IDBOpenDBRequest
    try {
      request = indexedDB.open(agentCacheDbName(userId), AGENT_CACHE_VERSION)
    } catch (err) {
      console.warn('[agentCache] 打开缓存库失败:', err)
      finish(null)
      return
    }

    request.onupgradeneeded = () => {
      try {
        createSchema(request.result)
      } catch (err) {
        console.warn('[agentCache] 初始化缓存表失败:', err)
      }
    }

    request.onsuccess = () => {
      const db = request.result
      if (settled) {
        db.close()
        return
      }
      db.onversionchange = () => {
        db.close()
        if (dbUserId === userId) {
          dbPromise = null
          dbUserId = null
        }
      }
      finish(db)
    }

    request.onerror = () => {
      console.warn('[agentCache] 缓存库打开失败:', request.error)
      finish(null)
    }

    // 另一个标签页正在升级/占用：不阻塞页面，本次降级为无缓存
    request.onblocked = () => {
      console.warn('[agentCache] 缓存库被其他标签页占用，本次降级')
      finish(null)
    }

    setTimeout(() => finish(null), 3000)
  })

  dbPromise = promise.then((db) => {
    if (!db) {
      dbPromise = null
      dbUserId = null
    }
    return db
  })
  return dbPromise
}

export function closeAgentCacheDb(): void {
  const current = dbPromise
  dbPromise = null
  dbUserId = null
  current?.then((db) => db?.close()).catch(() => {
    // ignore
  })
}

export function deleteAgentCacheDb(userId: string): Promise<void> {
  if (!isIndexedDbAvailable() || !userId) return Promise.resolve()
  closeAgentCacheDb()
  return new Promise((resolve) => {
    try {
      const request = indexedDB.deleteDatabase(agentCacheDbName(userId))
      request.onsuccess = () => resolve()
      request.onerror = () => resolve()
      request.onblocked = () => resolve()
    } catch {
      resolve()
    }
  })
}

export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

export function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'))
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
  })
}

export async function estimateCacheUsage(): Promise<{ usage: number; quota: number } | null> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null
    const estimate = await navigator.storage.estimate()
    return {
      usage: estimate.usage ?? 0,
      quota: estimate.quota ?? 0,
    }
  } catch {
    return null
  }
}

export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false
    return await navigator.storage.persist()
  } catch {
    return false
  }
}
