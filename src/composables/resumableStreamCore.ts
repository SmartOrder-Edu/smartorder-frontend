/**
 * SSE 断线重连的纯逻辑内核（不依赖 Vue / 浏览器 API，便于单测）。
 *
 * 三件事：
 * 1. 指数退避 + 抖动 + 重试窗口；
 * 2. HTTP 状态码 → 重试策略（刷新 token / 立即停止 / 退避重试 / 遵守 Retry-After）；
 * 3. seq 游标闸门：只有成功应用之后才推进游标，重复或更旧的事件直接丢弃。
 */

export interface BackoffOptions {
  /** 首次重试等待（毫秒） */
  baseDelayMs: number
  /** 单次等待上限（毫秒） */
  maxDelayMs: number
  /** 抖动比例：0.2 表示 ±20% */
  jitterRatio: number
  /** 自动重试总窗口（毫秒），超过后交还给用户手动恢复 */
  windowMs: number
}

export const DEFAULT_BACKOFF: BackoffOptions = {
  baseDelayMs: 1000,
  maxDelayMs: 15_000,
  jitterRatio: 0.2,
  windowMs: 120_000,
}

/**
 * 第 attempt 次重试的等待时间（attempt 从 1 开始）。
 * 1s → 2s → 4s → 8s → 15s（封顶），并叠加 ±jitterRatio 的随机抖动，避免大量客户端同时重连。
 */
export function computeBackoffDelay(
  attempt: number,
  options: BackoffOptions = DEFAULT_BACKOFF,
  random: () => number = Math.random,
): number {
  const safeAttempt = Math.max(1, Math.floor(attempt))
  const exponential = Math.min(options.maxDelayMs, options.baseDelayMs * Math.pow(2, safeAttempt - 1))
  const jitter = exponential * options.jitterRatio * (random() * 2 - 1)
  return Math.max(0, Math.round(exponential + jitter))
}

export type RetryDecision = 'retry' | 'refresh-token' | 'stop'

/**
 * 根据 HTTP 状态码决定下一步：
 * - 401：刷新 token 后有限重试；
 * - 403/404/410：无权访问 / 生成不存在 / 游标已过期，重试没有意义；
 * - 429/5xx/网络错误：退避重试；
 * - 其他 4xx：客户端错误，停止。
 */
export function decideRetry(status: number | null): RetryDecision {
  if (status === null) return 'retry'
  if (status === 401) return 'refresh-token'
  if (status === 403 || status === 404 || status === 410) return 'stop'
  if (status === 429) return 'retry'
  if (status >= 500) return 'retry'
  if (status >= 400) return 'stop'
  return 'retry'
}

/**
 * 解析 Retry-After（秒数或 HTTP 日期），返回毫秒等待时间；无法解析返回 null。
 */
export function parseRetryAfter(value: string | null | undefined, now: number = Date.now()): number | null {
  if (value === null || value === undefined) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) * 1000
  }
  const date = Date.parse(trimmed)
  if (Number.isNaN(date)) return null
  return Math.max(0, date - now)
}

export interface SeqGate {
  /** 当前已成功应用的游标（重连时作为 after 参数） */
  lastSeq(): number
  /** 是否应该应用这条事件（比游标新） */
  shouldApply(seq: number): boolean
  /** 事件成功应用后推进游标 */
  commit(seq: number): void
  /** 重新定位游标（换会话/换生成时重置） */
  reset(seq?: number): void
}

/**
 * seq 游标闸门。
 *
 * 关键点：先 shouldApply 再执行业务，执行业务成功后才 commit。
 * 如果应用过程中抛错，游标不前进，下一次重连会重新拉到这条事件。
 */
export function createSeqGate(initialSeq = 0): SeqGate {
  let applied = Math.max(0, Math.floor(initialSeq))
  return {
    lastSeq: () => applied,
    shouldApply: (seq: number) => Number.isFinite(seq) && seq > applied,
    commit: (seq: number) => {
      if (Number.isFinite(seq) && seq > applied) applied = seq
    },
    reset: (seq = 0) => {
      applied = Math.max(0, Math.floor(seq))
    },
  }
}

/**
 * 解析 SSE 事件 id（服务端把 seq 放在 id: 行）。
 */
export function parseEventSeq(id: string | null | undefined): number | null {
  if (id === null || id === undefined || id === '') return null
  const value = Number(String(id).trim())
  if (!Number.isFinite(value) || value <= 0) return null
  return Math.floor(value)
}

/**
 * 刷新后是否需要把任务事件流接回来。
 *
 * 只有 CREATED / RUNNING 需要：正文此时还只在事件日志里，MySQL 的 assistant 行要等
 * 生成结束才收尾。终态（COMPLETED/FAILED/CANCELLED）说明消息已落库，直接读历史即可。
 */
export function shouldResumeTask(status: string | null | undefined): boolean {
  return status === 'CREATED' || status === 'RUNNING'
}

/**
 * SSE 连接的时间参数。
 *
 * <p>服务端心跳是 15 秒一次；空闲超时取 3 倍心跳，既能发现半开连接，
 * 又不会因为一次心跳丢失就误判断线。</p>
 */
export interface StreamTimingOptions {
  /** 从发起到拿到响应头的上限 */
  connectTimeoutMs: number
  /** 多久没收到任何字节（含注释心跳）就认为连接已死 */
  idleTimeoutMs: number
  /** 连接稳定多久后重置退避窗口与 attempt */
  stableResetMs: number
  /** 快速重试窗口用尽后的慢探测间隔 */
  slowProbeIntervalMs: number
  /** 单次订阅的总时长上限（不含离线暂停） */
  maxTotalMs: number
}

export const DEFAULT_STREAM_TIMING: StreamTimingOptions = {
  connectTimeoutMs: 12_000,
  idleTimeoutMs: 45_000,
  stableResetMs: 10_000,
  slowProbeIntervalMs: 45_000,
  maxTotalMs: 30 * 60_000,
}

export type HttpRetryAction = 'retry' | 'refresh-token' | 'reconcile' | 'stop'

/**
 * HTTP 状态码的恢复语义。
 *
 * <p>与 {@link decideRetry} 的区别：400/404/410 不再一律 stop，
 * 而是交给上层做终态对账（查生成状态 / 读历史消息），对账后可能直接完成。</p>
 */
export function classifyHttpStatus(status: number | null): HttpRetryAction {
  if (status === null) return 'retry'
  if (status === 401) return 'refresh-token'
  if (status === 400 || status === 404 || status === 410) return 'reconcile'
  if (status === 403) return 'stop'
  if (status === 429) return 'retry'
  if (status >= 500) return 'retry'
  if (status >= 400) return 'stop'
  return 'retry'
}

/**
 * 连接稳定一段时间后，才允许重置重试窗口。
 *
 * <p>关键修复：旧实现从 run() 开始计时且成功后不重置，
 * 生成超过两分钟后第一次断线会直接判定“重连超时”。</p>
 */
export function shouldResetRetryWindow(connectedForMs: number, stableResetMs: number): boolean {
  return Number.isFinite(connectedForMs) && connectedForMs >= stableResetMs
}
