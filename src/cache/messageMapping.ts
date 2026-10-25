import type { ChatMessage } from '@/composables/useAgentChat'
import type {
  CachedMessageRecord,
  CachedMessageStatus,
  CachedReasoningSegment,
  CachedToolCall,
} from './types'

/**
 * ChatMessage ↔ IndexedDB 记录的纯映射与合并逻辑。
 *
 * <p>不直接存 ChatMessage：里面可能有 Map（taskExecutionMap）和 Vue 响应式代理，
 * 直接 structuredClone 会抛 DataCloneError；这里只挑可序列化字段。</p>
 */

const LOCAL_SORT_BASE = 1_000_000_000_000_000

export function messageSortKey(message: Pick<ChatMessage, 'sequenceNo' | 'timestamp'>): number {
  if (typeof message.sequenceNo === 'number' && Number.isFinite(message.sequenceNo) && message.sequenceNo > 0) {
    return message.sequenceNo
  }
  return LOCAL_SORT_BASE + (Number(message.timestamp) || Date.now())
}

function cloneJson<T>(value: T): T {
  if (value === undefined || value === null) return value
  try {
    return JSON.parse(JSON.stringify(value)) as T
  } catch {
    return value
  }
}

function estimateBytes(record: CachedMessageRecord): number {
  try {
    return JSON.stringify(record).length * 2
  } catch {
    return 0
  }
}

/** 本地待确认消息的稳定 key；user/assistant 同属一个 clientRequestId，必须带 role 区分 */
export function buildLocalMessageKey(
  clientRequestId: string,
  role: 'user' | 'ai',
): string {
  return `local:${clientRequestId}:${role}`
}

export function buildMessageKey(conversationId: string, message: ChatMessage): string {
  if (message.messageId) return `${conversationId}:${message.messageId}`
  return buildLocalMessageKey(message.clientRequestId || message.id, message.role)
}

export interface ToCachedMessageOptions {
  /** 本次从服务端拉取的时间；本地待确认消息不传 */
  serverSyncedAt?: number
}

export function toCachedMessage(
  conversationId: string,
  message: ChatMessage,
  options: ToCachedMessageOptions = {},
): CachedMessageRecord {
  const record: CachedMessageRecord = {
    key: buildMessageKey(conversationId, message),
    conversationId,
    id: message.id,
    messageId: message.messageId,
    clientRequestId: message.clientRequestId,
    sequenceNo: message.sequenceNo,
    sortKey: messageSortKey(message),
    role: message.role,
    content: message.content || '',
    status: message.status as CachedMessageStatus,
    reconnecting: message.reconnecting === true,
    generationId: message.generationId,
    traceId: message.traceId,
    timestamp: Number(message.timestamp) || Date.now(),
    thinkingText: message.thinkingText,
    thinkingDurationMs: message.thinkingDurationMs ?? null,
    toolCalls: cloneJson(message.toolCalls) as CachedToolCall[] | undefined,
    reasoningSegments: cloneJson(message.reasoningSegments) as CachedReasoningSegment[] | undefined,
    traceEvents: cloneJson(message.traceEvents),
    routeResult: cloneJson(message.routeResult),
    planSummary: cloneJson(message.planSummary),
    executionSteps: cloneJson(message.executionSteps),
    attachmentFileIds: cloneJson(message.attachmentFileIds),
    taskList: cloneJson(message.taskList),
    pauseInfo: cloneJson(message.pauseInfo),
    clarificationAnsweredValue: message.clarificationAnsweredValue,
    planExecuting: message.planExecuting,
    references: cloneJson(message.references),
    webSearchReferences: cloneJson(message.webSearchReferences),
    ragSources: cloneJson(message.ragSources),
    mindMaps: cloneJson(message.mindMaps),
    learningSpaceCards: cloneJson(message.learningSpaceCards),
    resources: cloneJson(message.resources),
    code: message.code,
    localOnly: message.localOnly === true,
    serverSyncedAt: options.serverSyncedAt,
    bytes: 0,
  }
  record.bytes = estimateBytes(record)
  return record
}

export function fromCachedMessage(record: CachedMessageRecord): ChatMessage {
  return {
    id: record.id || `cached_${record.key}`,
    role: record.role,
    content: record.content || '',
    status: record.status,
    reconnecting: record.reconnecting,
    generationId: record.generationId,
    messageId: record.messageId,
    clientRequestId: record.clientRequestId,
    sequenceNo: record.sequenceNo,
    traceId: record.traceId,
    traceEvents: record.traceEvents,
    thinkingText: record.thinkingText,
    thinkingDurationMs: record.thinkingDurationMs,
    toolCalls: record.toolCalls as ChatMessage['toolCalls'],
    reasoningSegments: record.reasoningSegments as ChatMessage['reasoningSegments'],
    routeResult: record.routeResult,
    timestamp: record.timestamp,
    planSummary: record.planSummary,
    executionSteps: record.executionSteps,
    attachmentFileIds: record.attachmentFileIds,
    taskList: record.taskList,
    pauseInfo: record.pauseInfo,
    clarificationAnsweredValue: record.clarificationAnsweredValue,
    planExecuting: record.planExecuting,
    references: record.references,
    webSearchReferences: record.webSearchReferences,
    ragSources: record.ragSources,
    mindMaps: record.mindMaps,
    learningSpaceCards: record.learningSpaceCards,
    resources: record.resources,
    code: record.code,
    localOnly: record.localOnly,
    cacheSyncedAt: record.serverSyncedAt ?? record.timestamp,
  }
}

function hasAnyDisplay(message: ChatMessage): boolean {
  return !!(
    message.toolCalls?.length
    || message.reasoningSegments?.length
    || message.traceEvents?.length
    || message.routeResult
    || message.ragSources
    || message.webSearchReferences?.length
    || message.mindMaps?.length
    || message.learningSpaceCards?.length
  )
}

function mergeOne(server: ChatMessage, cached: ChatMessage | undefined): ChatMessage {
  // 没有缓存命中时直接复用服务端对象：加载更早消息发生在流式过程中时，
  // streamingMessage 仍指向列表里的同一个对象，不会被“复制一份”打断。
  if (!cached) return server

  // 两边都还在流式：保留缓存对象引用（streamingMessage 指向它），只同步服务端新增字段
  if (cached.status === 'streaming' && server.status === 'streaming') {
    if (server.messageId) cached.messageId = server.messageId
    if (server.sequenceNo) cached.sequenceNo = server.sequenceNo
    if (server.traceId) cached.traceId = server.traceId
    if (server.content) cached.content = server.content
    cached.cacheSyncedAt = cached.cacheSyncedAt ?? server.cacheSyncedAt
    return cached
  }

  const merged: ChatMessage = { ...server }

  // 复用本地稳定 ID：刷新/合并后 v-for key 不变，气泡不会重建
  if (cached.id) merged.id = cached.id

  // 服务端 assistant 行在生成结束前是空占位；不能用空内容覆盖本地已累积正文
  const serverIsStreamingPlaceholder = server.status === 'streaming' && !server.content
  if (serverIsStreamingPlaceholder && cached.content) {
    merged.content = cached.content
    merged.status = cached.status === 'done' ? 'streaming' : cached.status
    merged.reconnecting = cached.reconnecting
  } else if (!server.content && cached.content && server.status !== 'done') {
    merged.content = cached.content
  }

  // 服务端只回落库字段，工具/思考/引用等展示数据在客户端；缓存里有就复用
  if (!merged.toolCalls?.length && cached.toolCalls?.length) merged.toolCalls = cached.toolCalls
  if (!merged.reasoningSegments?.length && cached.reasoningSegments?.length) {
    merged.reasoningSegments = cached.reasoningSegments
  }
  if (!merged.traceEvents?.length && cached.traceEvents?.length) merged.traceEvents = cached.traceEvents
  if (!merged.routeResult && cached.routeResult) merged.routeResult = cached.routeResult
  if (!merged.ragSources && cached.ragSources) merged.ragSources = cached.ragSources
  if (!merged.webSearchReferences?.length && cached.webSearchReferences?.length) {
    merged.webSearchReferences = cached.webSearchReferences
  }
  if (!merged.mindMaps?.length && cached.mindMaps?.length) merged.mindMaps = cached.mindMaps
  if (!merged.learningSpaceCards?.length && cached.learningSpaceCards?.length) {
    merged.learningSpaceCards = cached.learningSpaceCards
  }
  if (!merged.thinkingText && cached.thinkingText) merged.thinkingText = cached.thinkingText
  if (merged.thinkingDurationMs == null && cached.thinkingDurationMs != null) {
    merged.thinkingDurationMs = cached.thinkingDurationMs
  }
  if (!merged.planSummary && cached.planSummary) merged.planSummary = cached.planSummary
  if (!merged.executionSteps?.length && cached.executionSteps?.length) {
    merged.executionSteps = cached.executionSteps
  }
  if (!merged.attachmentFileIds?.length && cached.attachmentFileIds?.length) {
    merged.attachmentFileIds = cached.attachmentFileIds
  }

  merged.cacheSyncedAt = cached.cacheSyncedAt
  // 服务端已经给出完整终态内容时，缓存里的“本地部分内容”标记必须摘掉
  merged.localOnly = server.content ? false : cached.localOnly
  merged.generationId = server.generationId || cached.generationId
  merged.clientRequestId = server.clientRequestId || cached.clientRequestId
  return merged
}

export interface MergeMessagesOptions {
  /** 本次服务端窗口的最小 sortKey；窗口内缺失的消息视为服务端已删除 */
  serverWindowStartSortKey?: number
}

/**
 * 合并缓存消息与服务端消息。
 *
 * <p>规则：同一 messageId 服务端优先；服务端空占位不覆盖本地正文；
 * 本地待确认消息保留；窗口内服务端缺失的消息删除；更早的缓存保留。</p>
 */
export function mergeChatMessages(
  cached: ChatMessage[],
  server: ChatMessage[],
  options: MergeMessagesOptions = {},
): ChatMessage[] {
  if (server.length === 0) return [...cached]

  const cachedByMessageId = new Map<string, ChatMessage>()
  for (const message of cached) {
    if (message.messageId) cachedByMessageId.set(String(message.messageId), message)
  }

  const serverIds = new Set<string>()
  const merged: ChatMessage[] = []
  let minServerSortKey = Number.POSITIVE_INFINITY

  for (const serverMessage of server) {
    if (serverMessage.messageId) serverIds.add(String(serverMessage.messageId))
    minServerSortKey = Math.min(minServerSortKey, messageSortKey(serverMessage))
    merged.push(mergeOne(
      serverMessage,
      serverMessage.messageId ? cachedByMessageId.get(String(serverMessage.messageId)) : undefined,
    ))
  }

  const windowStart = options.serverWindowStartSortKey ?? minServerSortKey

  for (const cachedMessage of cached) {
    if (cachedMessage.messageId && serverIds.has(String(cachedMessage.messageId))) continue

    // 本地待确认（还没有服务端 ID）：永远保留，创建响应回来后会迁移 key
    if (!cachedMessage.messageId) {
      merged.push(cachedMessage)
      continue
    }

    // 正在流式的气泡（或已经拿到 generationId 但服务端页面还没读到）不能被合并掉：
    // 网络校验与用户发送可能并发，这里保留它，下一次页面会按 messageId 去重。
    if (cachedMessage.status === 'streaming' || cachedMessage.generationId) {
      merged.push(cachedMessage)
      continue
    }

    // 本次只校验了最后一页：比窗口更早的缓存不能推断为“已删除”
    if (messageSortKey(cachedMessage) < windowStart) {
      merged.push(cachedMessage)
    }
  }

  // 稳定排序：sortKey 相同再按时间，保证刷新前后顺序一致
  merged.sort((a, b) => {
    const diff = messageSortKey(a) - messageSortKey(b)
    if (diff !== 0) return diff
    return (a.timestamp || 0) - (b.timestamp || 0)
  })
  return merged
}

/** 是否可以直接复用缓存里的工具/思考展示数据（避免重复拉 trace） */
export function canReuseCachedDisplay(message: ChatMessage, maxAgeMs = 10 * 60_000): boolean {
  if (!hasAnyDisplay(message)) return false
  if (!message.cacheSyncedAt) return false
  return Date.now() - message.cacheSyncedAt <= maxAgeMs
}
