/**
 * 追踪事件的存储策略（纯逻辑，方便单测）。
 *
 * 逐 token 的 agent.text.delta / agent.think.delta 只驱动正文与思考的累积渲染，
 * 不进入 traceEvents：一次回答可能有上千条，断线回放时每一条都 push 进响应式数组、
 * 定稿时再整份复制，是前端最大的一块无用功。
 *
 * 追踪面板需要的“思考”节点不依赖 delta 行：实时/历史打开面板时由
 * thinkingText / reasoningSegments 合成（见 AITutor 的 injectThinkEventIfMissing）。
 */

/** 只驱动流式渲染、不应进入追踪时间线的 token 级事件 */
const TOKEN_DELTA_EVENTS: ReadonlySet<string> = new Set([
  'agent.text.delta',
  'agent.think.delta',
])

export function isTokenDeltaEvent(eventName: string): boolean {
  return TOKEN_DELTA_EVENTS.has(eventName)
}

interface SeqEvent {
  seq: number
}

/**
 * 把一条事件追加进追踪数组。
 *
 * - token 级 delta 直接丢弃，返回 false；
 * - 服务端按 seq 顺序推送时直接追加（O(1)），只有补发/乱序才真正排序；
 * - 返回是否追加，调用方无需再判断事件名。
 */
export function appendTraceEvent<T extends SeqEvent>(
  events: T[],
  eventName: string,
  event: T,
): boolean {
  if (isTokenDeltaEvent(eventName)) return false

  const previous = events[events.length - 1]
  events.push(event)
  if (previous && previous.seq > event.seq) {
    events.sort((a, b) => a.seq - b.seq)
  }
  return true
}

/**
 * 定稿时挂到消息上的追踪事件。
 *
 * delta 已被 appendTraceEvent 过滤，数组里只剩少量过程事件（路由/工具/计划），
 * 因此直接共享引用，不再整份复制。startNewTurn / resetStreamingState 会整体换成
 * 新数组，旧消息手里的引用不会被后续轮次追加污染。
 *
 * 约定：调用方只读，不要原地修改返回的数组。
 */
export function traceEventsForMessage<T>(events: T[]): T[] | undefined {
  return events.length ? events : undefined
}

interface MergeableTraceEvent {
  traceId?: string
  eventType: string
  seq: number
}

/**
 * 合并历史 trace 与本次订阅新收到的事件。
 *
 * 刷新快照恢复时，历史里可能有 lastSeq 之前的事件，本地只回放了之后的；
 * 直接覆盖会丢掉前半段工具/路由卡片。
 *
 * 若历史数组已经被追踪面板缓存成“合成 think.delta + 原始事件”的展示数组，
 * 则直接以本次 store 的原始事件为准，避免合成 seq 与真实 seq 混排。
 */
export function mergeTraceEventsForMessage<T extends MergeableTraceEvent>(
  existing: T[] | undefined,
  incoming: T[],
): T[] | undefined {
  if (!existing?.length) {
    return traceEventsForMessage(incoming)
  }
  if (existing.some(event => event.eventType === 'agent.think.delta')) {
    return traceEventsForMessage(incoming)
  }

  const merged = [...existing]
  const seen = new Set(existing.map(event => `${event.traceId || ''}:${event.seq}`))
  for (const event of incoming) {
    const key = `${event.traceId || ''}:${event.seq}`
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(event)
  }
  merged.sort((a, b) => a.seq - b.seq)
  return merged
}
