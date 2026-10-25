import {
  AGENT_CACHE_STORE,
  openAgentCacheDb,
  requestToPromise,
  transactionDone,
} from './db'
import type {
  CachedMessageRecord,
  CachedStreamEventRecord,
  CachedStreamRecord,
  ConversationSyncRecord,
} from './types'

/**
 * 流式快照 + 事件日志。
 *
 * <p>不变量：`snapshotSeq <= appliedSeq`；快照正文与 snapshotSeq 同一事务写入；
 * journal 覆盖 `(snapshotSeq, appliedSeq]`；低游标写入不能覆盖高游标。</p>
 *
 * <p>为什么不是每个 token 都写：文本快照 1~2 秒一次，事件日志批量写；
 * 每 token 写 IndexedDB 既慢又伤磁盘寿命。</p>
 */

const STREAMS = AGENT_CACHE_STORE.streams
const EVENTS = AGENT_CACHE_STORE.streamEvents
const MESSAGES = AGENT_CACHE_STORE.messages
const SYNC = AGENT_CACHE_STORE.conversationSync

function maxSeq(): number {
  return Number.MAX_SAFE_INTEGER
}

/** 去掉 Vue 响应式代理，保证 IndexedDB structured clone 不会抛 DataCloneError */
function cloneJson<T>(value: T): T {
  if (value === undefined || value === null) return value
  try {
    return JSON.parse(JSON.stringify(value)) as T
  } catch {
    return value
  }
}

function normalizeRecord(record: CachedStreamRecord): CachedStreamRecord {
  const snapshotSeq = Math.max(0, Math.floor(Number(record.snapshotSeq) || 0))
  const appliedSeq = Math.max(snapshotSeq, Math.floor(Number(record.appliedSeq) || 0))
  return {
    ...record,
    snapshotSeq,
    appliedSeq,
    answerText: record.answerText || '',
    thinkingText: record.thinkingText || '',
    thinkingDurationMs: record.thinkingDurationMs ?? null,
    toolCalls: cloneJson(record.toolCalls || []),
    reasoningSegments: cloneJson(record.reasoningSegments || []),
    traceEvents: cloneJson(record.traceEvents),
    routeResult: cloneJson(record.routeResult),
    ragSources: cloneJson(record.ragSources),
    webSearchReferences: cloneJson(record.webSearchReferences),
    mindMaps: cloneJson(record.mindMaps),
    updatedAt: record.updatedAt || Date.now(),
  }
}

/** 新生成开始：不存在才创建，避免覆盖另一个标签页更新的快照 */
export async function beginCachedStream(userId: string, record: CachedStreamRecord): Promise<boolean> {
  const db = await openAgentCacheDb(userId)
  if (!db) return false
  try {
    const tx = db.transaction(STREAMS, 'readwrite')
    const store = tx.objectStore(STREAMS)
    const current = await requestToPromise(store.get(record.generationId))
    if (!current) store.put(normalizeRecord(record))
    await transactionDone(tx)
    return true
  } catch (err) {
    console.warn('[agentCache] 创建流快照失败:', err)
    return false
  }
}

/** 批量写事件日志，并把 appliedSeq 推进到本批最大 seq */
export async function appendCachedStreamEvents(
  userId: string,
  generationId: string,
  events: CachedStreamEventRecord[],
  appliedSeq: number,
): Promise<boolean> {
  if (!generationId || (!events.length && !Number.isFinite(appliedSeq))) return false
  const db = await openAgentCacheDb(userId)
  if (!db) return false
  try {
    const tx = db.transaction([STREAMS, EVENTS], 'readwrite')
    const streamStore = tx.objectStore(STREAMS)
    const eventStore = tx.objectStore(EVENTS)
    const current = await requestToPromise(streamStore.get(generationId)) as CachedStreamRecord | undefined
    if (!current) {
      await transactionDone(tx)
      return false
    }

    const snapshotSeq = Number(current.snapshotSeq) || 0
    for (const event of events) {
      if (!Number.isFinite(event.seq) || event.seq <= 0) continue
      // 已经被完整快照覆盖的事件不再写回，避免“快照压缩后 journal 又复活”
      if (event.seq <= snapshotSeq) continue
      eventStore.put({ ...event, generationId })
    }

    const nextApplied = Math.max(
      Number(current.appliedSeq) || 0,
      Number.isFinite(appliedSeq) ? Math.floor(appliedSeq) : 0,
    )
    if (nextApplied > (Number(current.appliedSeq) || 0)) {
      streamStore.put({ ...current, appliedSeq: nextApplied, updatedAt: Date.now() })
    }
    await transactionDone(tx)
    return true
  } catch (err) {
    console.warn('[agentCache] 写事件日志失败:', err)
    return false
  }
}

/**
 * 提交完整快照并裁剪 `seq <= snapshotSeq` 的日志。
 * 低游标快照（另一个标签页更慢）直接放弃，避免正文/游标错位。
 */
export async function commitCachedStreamSnapshot(
  userId: string,
  snapshot: CachedStreamRecord,
): Promise<boolean> {
  const db = await openAgentCacheDb(userId)
  if (!db) return false
  try {
    const record = normalizeRecord(snapshot)
    const tx = db.transaction([STREAMS, EVENTS], 'readwrite')
    const streamStore = tx.objectStore(STREAMS)
    const current = await requestToPromise(streamStore.get(record.generationId)) as CachedStreamRecord | undefined
    // 两个标签页并发时，低游标/更旧快照都不能覆盖新快照。
    // 特别注意：只比 appliedSeq 不够——旧快照可能 appliedSeq 相同但 snapshotSeq 更小，
    // 覆盖后会把新快照已经删掉的 journal 区间重新变成“空洞”。
    if (current && (
      (Number(current.appliedSeq) || 0) > record.appliedSeq
      || (Number(current.snapshotSeq) || 0) > record.snapshotSeq
    )) {
      await transactionDone(tx)
      return false
    }

    streamStore.put({ ...record, updatedAt: Date.now() })
    if (record.snapshotSeq > 0) {
      const range = IDBKeyRange.bound(
        [record.generationId, 0],
        [record.generationId, record.snapshotSeq],
      )
      tx.objectStore(EVENTS).delete(range)
    }
    await transactionDone(tx)
    return true
  } catch (err) {
    console.warn('[agentCache] 提交流快照失败:', err)
    return false
  }
}

export interface LoadedCachedStream {
  record: CachedStreamRecord
  events: CachedStreamEventRecord[]
  /** journal 是否连续；不连续时从 snapshotSeq 重新回放更安全 */
  complete: boolean
  /** 本地已应用到哪，订阅时应从这里之后开始 */
  resumeSeq: number
}

export async function loadCachedStream(
  userId: string,
  generationId: string,
): Promise<LoadedCachedStream | null> {
  if (!generationId) return null
  const db = await openAgentCacheDb(userId)
  if (!db) return null

  try {
    const tx = db.transaction([STREAMS, EVENTS], 'readonly')
    const record = await requestToPromise(tx.objectStore(STREAMS).get(generationId)) as CachedStreamRecord | undefined
    if (!record) {
      await transactionDone(tx)
      return null
    }

    const lower = Math.max(1, Number(record.snapshotSeq) + 1)
    const range = IDBKeyRange.bound([generationId, lower], [generationId, maxSeq()])
    const events: CachedStreamEventRecord[] = []
    await new Promise<void>((resolve, reject) => {
      const request = tx.objectStore(EVENTS).openCursor(range, 'next')
      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor) {
          resolve()
          return
        }
        events.push(cursor.value as CachedStreamEventRecord)
        cursor.continue()
      }
      request.onerror = () => reject(request.error ?? new Error('读取流事件失败'))
    })
    await transactionDone(tx)

    let complete = true
    let expected = lower
    let lastSeq = Number(record.snapshotSeq) || 0
    for (const event of events) {
      if (event.seq !== expected) {
        complete = false
        break
      }
      expected += 1
      lastSeq = event.seq
    }
    if (complete && lastSeq < (Number(record.appliedSeq) || 0)) {
      complete = false
    }

    return {
      record,
      events,
      complete,
      resumeSeq: complete ? Math.max(lastSeq, Number(record.appliedSeq) || 0) : Number(record.snapshotSeq) || 0,
    }
  } catch (err) {
    console.warn('[agentCache] 读取流快照失败:', err)
    return null
  }
}

/** 终态：写最终消息、更新会话同步元数据、删除流与日志 */
export async function finalizeCachedStream(
  userId: string,
  generationId: string,
  message: CachedMessageRecord,
  sync?: ConversationSyncRecord,
): Promise<boolean> {
  const db = await openAgentCacheDb(userId)
  if (!db) return false
  try {
    const tx = db.transaction([MESSAGES, STREAMS, EVENTS, SYNC], 'readwrite')
    tx.objectStore(MESSAGES).put(message)
    if (sync) tx.objectStore(SYNC).put(sync)
    tx.objectStore(STREAMS).delete(generationId)
    tx.objectStore(EVENTS).delete(
      IDBKeyRange.bound([generationId, 0], [generationId, maxSeq()]),
    )
    await transactionDone(tx)
    return true
  } catch (err) {
    console.warn('[agentCache] 终结流快照失败:', err)
    return false
  }
}

export async function clearCachedStream(userId: string, generationId: string): Promise<void> {
  const db = await openAgentCacheDb(userId)
  if (!db) return
  try {
    const tx = db.transaction([STREAMS, EVENTS], 'readwrite')
    tx.objectStore(STREAMS).delete(generationId)
    tx.objectStore(EVENTS).delete(
      IDBKeyRange.bound([generationId, 0], [generationId, maxSeq()]),
    )
    await transactionDone(tx)
  } catch (err) {
    console.warn('[agentCache] 清理流快照失败:', err)
  }
}

/** 会话最近一次未终结的流（刷新恢复时与 active-generation 交叉校验） */
export async function findLatestCachedStream(
  userId: string,
  conversationId: string,
): Promise<CachedStreamRecord | null> {
  const db = await openAgentCacheDb(userId)
  if (!db) return null
  try {
    const tx = db.transaction(STREAMS, 'readonly')
    const index = tx.objectStore(STREAMS).index('byConversation')
    const records = await requestToPromise(index.getAll(IDBKeyRange.only(conversationId)))
    await transactionDone(tx)
    const list = (records as CachedStreamRecord[]) || []
    if (!list.length) return null
    list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    return list[0]
  } catch {
    return null
  }
}

/** 清理超过保留期的终态/僵尸流 */
export async function pruneCachedStreams(userId: string, retentionMs = 24 * 60 * 60_000): Promise<void> {
  const db = await openAgentCacheDb(userId)
  if (!db) return
  try {
    const cutoff = Date.now() - retentionMs
    const tx = db.transaction(STREAMS, 'readwrite')
    const store = tx.objectStore(STREAMS)
    const request = store.openCursor()
    request.onsuccess = () => {
      const cursor = request.result
      if (!cursor) return
      const record = cursor.value as CachedStreamRecord
      if (record.updatedAt < cutoff) {
        cursor.delete()
      }
      cursor.continue()
    }
    await transactionDone(tx)
  } catch (err) {
    console.warn('[agentCache] 清理过期流失败:', err)
  }
}
