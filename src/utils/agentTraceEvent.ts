import type { AgentTraceEvent } from '@/stores/agent'

/**
 * 把后端 trace 事件（单条完整实体 / 批量精简 DTO）统一成前端结构。
 *
 * 批量接口返回 {traceId, eventType, seq, timestamp, payload}；
 * 旧的单条接口返回实体字段（sequenceNum / createTime / agentMode），这里都兼容。
 */
export function normalizeAgentTraceEvent(raw: any): AgentTraceEvent {
  let payload = raw?.payload
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload)
    } catch {
      // 保持原字符串，调用方自行容错
    }
  }

  const timestamp = typeof raw?.timestamp === 'number'
    ? raw.timestamp
    : raw?.createTime
      ? new Date(raw.createTime).getTime()
      : Date.now()

  return {
    traceId: raw?.traceId || '',
    conversationId: raw?.conversationId || '',
    userId: raw?.userId || 0,
    mode: raw?.agentMode || raw?.mode || '',
    eventType: raw?.eventType || '',
    seq: raw?.sequenceNum ?? raw?.seq ?? 0,
    timestamp,
    payload,
  }
}
