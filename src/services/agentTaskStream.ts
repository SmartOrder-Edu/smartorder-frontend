import { agentApi } from '../api/agent'
import { agentCache, type AgentTaskSnapshot, type PersistedAgentEvent } from '../db/agentCacheRepository'
import { compareStreamIds } from './agentStreamProtocol'
import { refreshAccessToken } from '../api/request'

export interface StreamFrame { id: string; event: string; data: string }
export interface TaskStreamOptions {
  scopeKey: string
  snapshot: AgentTaskSnapshot
  signal: AbortSignal
  onSnapshot: (snapshot: AgentTaskSnapshot) => void
  onEvent: (frame: StreamFrame) => void
  onState: (state: string) => void
  onCacheChanged?: () => void
}

/** 权威快照旧于本地已提交前缀时，从事务内保留的 checkpoint 构造续传起点。 */
async function committedSnapshot(scopeKey: string, authority: AgentTaskSnapshot,
                                 replaced: boolean): Promise<AgentTaskSnapshot> {
  if (replaced) return authority
  const preview = await agentCache.preview(scopeKey, authority.conversationId)
  const checkpoint = preview.checkpoints.find(item => item.taskId === authority.taskId)
  const message = preview.messages.find(item => item.taskId === authority.taskId && item.role === 'assistant')
  if (!checkpoint || !message) return authority
  return { ...authority, status: checkpoint.status,
    snapshotEventId: checkpoint.lastAppliedEventId, snapshotRevision: checkpoint.snapshotRevision,
    messages: [{ messageId: message.messageId, role: message.role, content: message.baseContent,
      status: message.status, revision: message.version }] }
}

/** 按字节流逐帧解析 SSE，上一帧提交 IndexedDB 后才读取下一帧。 */
async function consumeFrames(response: Response, signal: AbortSignal,
                             onFrame: (frame: StreamFrame) => Promise<boolean>) {
  if (!response.body) throw new Error('SSE_EMPTY_BODY')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let frame: StreamFrame = { id: '', event: '', data: '' }
  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read()
      if (done) return
      buffer += decoder.decode(value, { stream: true })
      while (true) {
        let end = -1
        for (let i = 0; i < buffer.length; i++) {
          if (buffer[i] === '\n' || (buffer[i] === '\r' && i < buffer.length - 1)) { end = i; break }
        }
        if (end < 0) break
        const line = buffer.slice(0, end)
        const size = buffer[end] === '\r' && buffer[end + 1] === '\n' ? 2 : 1
        buffer = buffer.slice(end + size)
        if (!line) {
          if (frame.data || frame.event) {
            const proceed = await onFrame({ ...frame, data: frame.data.replace(/\n$/, '') })
            if (!proceed) return
          }
          frame = { id: '', event: '', data: '' }
        } else if (!line.startsWith(':')) {
          const colon = line.indexOf(':')
          const field = colon < 0 ? line : line.slice(0, colon)
          const raw = colon < 0 ? '' : line.slice(colon + 1)
          const content = raw.startsWith(' ') ? raw.slice(1) : raw
          if (field === 'id') frame.id = content
          if (field === 'event') frame.event = content
          if (field === 'data') frame.data += `${content}\n`
        }
      }
    }
  } finally { await reader.cancel().catch(() => undefined) }
}

/** 普通网络重连始终以应用已提交游标发送 Last-Event-ID，不使用未落库的浏览器游标。 */
export async function followAgentTask(options: TaskStreamOptions, persistent = true): Promise<void> {
  let snapshot = options.snapshot
  let cursor = snapshot.snapshotEventId
  let resyncAttempts = 0
  let failures = 0
  let token = localStorage.getItem('token') || ''
  while (!options.signal.aborted) {
    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(snapshot.status)) return
    const controller = new AbortController()
    const cancel = () => controller.abort()
    options.signal.addEventListener('abort', cancel, { once: true })
    let resyncReason = ''
    let terminalReceived = false
    try {
      options.onState(failures ? 'RECONNECTING' : 'CONNECTING')
      const response = await fetch(agentApi.taskEventsUrl(snapshot.taskId, snapshot.snapshotEventId,
        snapshot.streamVersion, snapshot.messages[0]?.messageId), { method: 'GET', signal: controller.signal,
        headers: { Authorization: `Bearer ${token}`, 'Last-Event-ID': cursor,
          Accept: 'text/event-stream' }, cache: 'no-store' })
      if (response.status === 401) {
        try { token = await refreshAccessToken() }
        catch { options.onState('AUTH_EXPIRED'); return }
        continue
      }
      if (response.status === 403 || response.status === 404) throw new Error('TASK_FORBIDDEN')
      if (!response.ok || !response.headers.get('content-type')?.includes('text/event-stream')) {
        throw new Error(`SSE_HTTP_${response.status}`)
      }
      options.onState('STREAMING')
      await consumeFrames(response, controller.signal, async frame => {
        if (frame.event === 'resync_required') {
          resyncReason = JSON.parse(frame.data).reason || 'SNAPSHOT_REQUIRED'
          return false
        }
        if (!frame.id || !frame.data) return true
        const payload = JSON.parse(frame.data)
        if (frame.id !== payload.eventId || payload.taskId !== snapshot.taskId
            || payload.streamVersion !== snapshot.streamVersion) {
          resyncReason = 'EVENT_CONTRACT_MISMATCH'
          return false
        }
        if (compareStreamIds(frame.id, cursor) <= 0) return true
        const event: PersistedAgentEvent = { ...payload, type: frame.event, eventId: frame.id }
        try {
          if (persistent) {
            const committed = await agentCache.persistEvent(options.scopeKey, event)
            if (!committed) return true
          }
        } catch (error) {
          options.onState('DEGRADED')
          persistent = false
          resyncReason = 'INDEXED_DB_FAILURE'
          return false
        }
        cursor = frame.id
        options.onEvent(frame)
        options.onCacheChanged?.()
        if (['task_completed', 'task_failed', 'task_cancelled'].includes(frame.event)) {
          options.onState(payload.status || 'COMPLETED')
          terminalReceived = true
          return false
        }
        return true
      })
      if (terminalReceived) {
        const finalSnapshot = await agentApi.getTaskSnapshot(snapshot.taskId)
        if (persistent) await agentCache.replaceSnapshot(options.scopeKey, finalSnapshot)
        options.onSnapshot(finalSnapshot)
        options.onCacheChanged?.()
        return
      }
      if (!resyncReason) failures++
    } catch (error) {
      if (options.signal.aborted) return
      if ((error as Error).message === 'TASK_FORBIDDEN') {
        options.onState('FORBIDDEN')
        return
      }
      failures++
      options.onState(navigator.onLine ? 'RECONNECTING' : 'OFFLINE')
    } finally {
      controller.abort()
      options.signal.removeEventListener('abort', cancel)
    }
    if (resyncReason || failures >= 5) {
      options.onState('RESYNCING')
      try {
        const authority = await agentApi.getTaskSnapshot(snapshot.taskId)
        const replaced = persistent ? await agentCache.replaceSnapshot(options.scopeKey, authority) : true
        snapshot = persistent ? await committedSnapshot(options.scopeKey, authority, replaced) : authority
        cursor = snapshot.snapshotEventId
        options.onSnapshot(snapshot)
        options.onCacheChanged?.()
        failures = 0
        resyncAttempts++
        if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(authority.status)) return
        if (resyncAttempts > 3) { options.onState('DEGRADED'); return }
      } catch {
        options.onState(navigator.onLine ? 'DEGRADED' : 'OFFLINE')
      }
    }
    if (!options.signal.aborted) await new Promise<void>(resolve => setTimeout(resolve,
      navigator.onLine ? Math.min(3000 * Math.max(failures, 1), 15000) : 3000))
  }
}

/** Web Locks 保证同一任务只有一个标签页写缓存；通知只用于触发重新读取。 */
export async function coordinateAgentTask(options: TaskStreamOptions): Promise<void> {
  if (!navigator.locks || typeof BroadcastChannel === 'undefined') {
    options.onState('DEGRADED')
    await followAgentTask(options, false)
    return
  }
  const channel = new BroadcastChannel(`agent-task:${options.scopeKey}:${options.snapshot.taskId}`)
  channel.onmessage = async () => {
    try {
      const preview = await agentCache.preview(options.scopeKey, options.snapshot.conversationId)
      const task = preview.messages.find(item => item.taskId === options.snapshot.taskId)
      const checkpoint = preview.checkpoints.find(item => item.taskId === options.snapshot.taskId)
      if (task && checkpoint) options.onSnapshot({ ...options.snapshot,
        status: checkpoint.status, streamVersion: checkpoint.streamVersion,
        snapshotRevision: checkpoint.snapshotRevision,
        snapshotEventId: checkpoint.lastAppliedEventId,
        messages: [{ messageId: task.messageId, role: task.role, content: task.baseContent,
          status: task.status, revision: task.version }] })
    } catch { options.onState('DEGRADED') }
  }
  try {
    await navigator.locks.request(`agent-task:${options.scopeKey}:${options.snapshot.taskId}`,
      { signal: options.signal }, async () => {
        if (options.signal.aborted) return
        let current = await agentApi.getTaskSnapshot(options.snapshot.taskId)
        try {
          const replaced = await agentCache.replaceSnapshot(options.scopeKey, current)
          current = await committedSnapshot(options.scopeKey, current, replaced)
        } catch {
          options.onState('DEGRADED')
          options.onSnapshot(current)
          await followAgentTask({ ...options, snapshot: current }, false)
          return
        }
        options.onSnapshot(current)
        channel.postMessage({ type: 'snapshot' })
        await followAgentTask({ ...options, snapshot: current,
          onCacheChanged: () => channel.postMessage({ type: 'event' }) }, true)
      })
  } catch (error) {
    if (!options.signal.aborted) throw error
  } finally { channel.close() }
}
