/**
 * IndexedDB 缓存的记录类型。
 *
 * <p>这里刻意不直接引用 `ChatMessage`：缓存是序列化格式，必须与 Vue 响应式对象、
 * Map（taskExecutionMap）解耦；展示层再用映射函数转回 ChatMessage。</p>
 */

export type CachedMessageStatus = 'streaming' | 'done' | 'stopped' | 'error'

export interface CachedToolCall {
  toolName: string
  status: 'running' | 'completed' | 'failed'
  arguments?: any
  result?: any
  durationMs?: number
  startedAt: number
}

export interface CachedReasoningSegment {
  thinkingText: string
  toolCall?: CachedToolCall
  thinkingStreaming?: boolean
}

export interface CachedMessageRecord {
  /** 服务端消息：`${conversationId}:${messageId}`；本地待确认：`local:${clientRequestId}` */
  key: string
  conversationId: string
  /** 前端本地 ID，用于恢复 v-for key，避免气泡重建 */
  id: string
  messageId?: string
  clientRequestId?: string
  sequenceNo?: number
  /** 排序键：服务端 sequenceNo；本地待确认用 1e15 + timestamp，保证在尾部 */
  sortKey: number
  role: 'user' | 'ai'
  content: string
  status: CachedMessageStatus
  reconnecting?: boolean
  taskId?: string
  traceId?: string
  timestamp: number
  thinkingText?: string
  thinkingDurationMs?: number | null
  toolCalls?: CachedToolCall[]
  reasoningSegments?: CachedReasoningSegment[]
  traceEvents?: any[]
  routeResult?: any
  planSummary?: any
  executionSteps?: any[]
  attachmentFileIds?: number[]
  taskList?: any
  pauseInfo?: any
  clarificationAnsweredValue?: string
  planExecuting?: boolean
  references?: any[]
  webSearchReferences?: any[]
  ragSources?: any
  mindMaps?: any[]
  learningSpaceCards?: any[]
  resources?: any[]
  code?: string
  /** 服务端尚未落正文、仅本地保存的部分内容 */
  localOnly?: boolean
  /** 服务端该消息的状态（用于判断本地内容是否还是“部分回答”） */
  serverStatus?: string
  /** 展示数据被裁剪过，可后台补拉 */
  displayPartial?: boolean
  /** 最近一次与服务端对齐的时间 */
  serverSyncedAt?: number
  /** 估算字节数，用于配额回收 */
  bytes: number
}

export interface CachedConversationRecord {
  conversationId: string
  title: string | null
  lastMessage: string | null
  messageCount: number
  lastActiveTime: string
  cachedAt: number
}

export interface ConversationSyncRecord {
  conversationId: string
  total: number
  newestMessageId?: string
  newestSequenceNo?: number
  oldestSequenceNo?: number
  hasMoreOlder: boolean
  lastSyncedAt: number
  /** 最近一次完整校验的页码/范围，便于判断缓存窗口 */
  lastFullSyncAt?: number
}

export interface CachedStreamRecord {
  taskId: string
  conversationId: string
  assistantMessageId?: string
  status: string
  /** 快照正文对应的 seq */
  snapshotSeq: number
  /** 已成功应用的最大 seq；journal 覆盖 (snapshotSeq, appliedSeq] */
  appliedSeq: number
  answerText: string
  thinkingText: string
  thinkingDurationMs: number | null
  toolCalls: CachedToolCall[]
  reasoningSegments: CachedReasoningSegment[]
  traceEvents?: any[]
  routeResult?: any
  ragSources?: any
  webSearchReferences?: any[]
  mindMaps?: any[]
  updatedAt: number
  terminal?: boolean
  error?: string
  replayable?: boolean
}

export interface CachedStreamEventRecord {
  taskId: string
  seq: number
  eventName: string
  data: any
  receivedAt: number
}

export type OutboxStatus = 'pending' | 'failed'

export interface OutboxRecord {
  clientRequestId: string
  conversationId?: string
  payload: any
  createdAt: number
  attempts: number
  status: OutboxStatus
  lastError?: string
}
