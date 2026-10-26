import type { ReasoningSegment, ToolCallState } from '@/stores/agent'

/**
 * 刷新恢复用的流式快照。
 *
 * <p>为什么需要：任务进行中的正文只在服务端事件日志里，刷新后从 seq=0 回放整轮
 * 既慢又浪费。把“已应用到的 lastSeq + 当时可见的流式状态”一起落盘，
 * 恢复时先画快照，再只订阅 seq &gt; lastSeq 的增量。</p>
 *
 * <p>一致性约束：lastSeq 必须与文本/工具/分段在同一时刻采集。
 * 写入由 useAgentChat 在事件 commit 后节流触发，并在一次同步调用里
 * 读取 store 与 lastSeq 后立即序列化，因此不会出现“新文本 + 旧游标”。</p>
 */

export const AGENT_STREAM_SNAPSHOT_KEY = 'smartorder:agent:streamSnapshot:v2'

export const AGENT_STREAM_SNAPSHOT_VERSION = 2

/** 超过 sessionStorage 安全预算时放弃本次写入，继续用旧快照（旧游标仍然自洽） */
export const AGENT_STREAM_SNAPSHOT_MAX_CHARS = 2_000_000

let snapshotWriteWarningLogged = false

export interface AgentStreamSnapshot {
  version: 2
  taskId: string
  conversationId: string
  lastSeq: number
  answerText: string
  thinkingText: string
  thinkingDurationMs: number | null
  toolCalls: ToolCallState[]
  reasoningSegments: ReasoningSegment[]
  savedAt: number
}

export interface AgentStreamSnapshotInput {
  taskId: string
  conversationId: string
  lastSeq: number
  answerText: string
  thinkingText: string
  thinkingDurationMs: number | null
  toolCalls: ToolCallState[]
  reasoningSegments: ReasoningSegment[]
}

export function buildAgentStreamSnapshot(input: AgentStreamSnapshotInput): AgentStreamSnapshot {
  return {
    version: AGENT_STREAM_SNAPSHOT_VERSION,
    taskId: input.taskId,
    conversationId: input.conversationId || '',
    lastSeq: Math.max(0, Math.floor(Number(input.lastSeq) || 0)),
    answerText: input.answerText || '',
    thinkingText: input.thinkingText || '',
    thinkingDurationMs: input.thinkingDurationMs ?? null,
    toolCalls: (input.toolCalls || []).map(tool => ({ ...tool })),
    reasoningSegments: (input.reasoningSegments || []).map(segment => ({
      ...segment,
      toolCall: segment.toolCall ? { ...segment.toolCall } : undefined,
    })),
    savedAt: Date.now(),
  }
}

export function isValidAgentStreamSnapshot(value: any): value is AgentStreamSnapshot {
  if (!value || typeof value !== 'object') return false
  if (value.version !== AGENT_STREAM_SNAPSHOT_VERSION) return false
  if (typeof value.taskId !== 'string' || value.taskId.length === 0) return false
  if (value.conversationId != null && typeof value.conversationId !== 'string') return false
  if (!Number.isFinite(value.lastSeq) || value.lastSeq < 0) return false
  if (typeof value.answerText !== 'string' || typeof value.thinkingText !== 'string') return false
  if (value.thinkingDurationMs != null && !Number.isFinite(value.thinkingDurationMs)) return false
  if (!Array.isArray(value.toolCalls) || !Array.isArray(value.reasoningSegments)) return false
  return true
}

export function loadAgentStreamSnapshot(): AgentStreamSnapshot | null {
  try {
    if (typeof sessionStorage === 'undefined') return null
    const raw = sessionStorage.getItem(AGENT_STREAM_SNAPSHOT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!isValidAgentStreamSnapshot(parsed)) {
      clearAgentStreamSnapshot()
      return null
    }
    return parsed
  } catch {
    clearAgentStreamSnapshot()
    return null
  }
}

export function saveAgentStreamSnapshot(snapshot: AgentStreamSnapshot): boolean {
  try {
    if (typeof sessionStorage === 'undefined') return false
    const serialized = JSON.stringify(snapshot)
    if (serialized.length > AGENT_STREAM_SNAPSHOT_MAX_CHARS) {
      if (!snapshotWriteWarningLogged) {
        snapshotWriteWarningLogged = true
        console.warn('[agentSnapshot] 快照超过 sessionStorage 预算，跳过本次写入')
      }
      return false
    }
    sessionStorage.setItem(AGENT_STREAM_SNAPSHOT_KEY, serialized)
    snapshotWriteWarningLogged = false
    return true
  } catch (err) {
    // 配额满/序列化失败：保留上一份快照，游标与文本仍然自洽
    if (!snapshotWriteWarningLogged) {
      snapshotWriteWarningLogged = true
      console.warn('[agentSnapshot] 快照写入失败:', err)
    }
    return false
  }
}

export function clearAgentStreamSnapshot(): void {
  try {
    if (typeof sessionStorage === 'undefined') return
    sessionStorage.removeItem(AGENT_STREAM_SNAPSHOT_KEY)
  } catch {
    // ignore
  }
}
