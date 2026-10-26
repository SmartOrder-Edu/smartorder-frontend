import { agentApi } from '@/api/agent'
import { refreshAccessToken } from '@/api/request'
import { createSseParser, type SseFrame } from './sseParser'
import {
  DEFAULT_BACKOFF,
  DEFAULT_STREAM_TIMING,
  classifyHttpStatus,
  computeBackoffDelay,
  createSeqGate,
  parseEventSeq,
  parseRetryAfter,
  type BackoffOptions,
  type StreamTimingOptions,
} from './resumableStreamCore'

/**
 * 可恢复的 Agent 任务事件流（SSE）。
 *
 * 相比旧实现，这一版补上了四个“极致”所需的细节：
 * 1. 自研解析器能看见 `:` 注释心跳，从而检测半开连接；
 * 2. 连接超时 + 空闲超时，避免 fetch 永久挂起；
 * 3. 连接稳定 10 秒后重置退避窗口与 attempt，长生成断线不再被误判超时；
 * 4. 400/404/410/EOF-without-done 不再一律失败，交给上层查状态做终态对账。
 *
 * 连接由外层循环控制，每次重连都带“已成功应用”的 seq 游标；收到 done 才算结束。
 */

export type StreamConnectionState =
  | 'idle'
  | 'connecting'
  | 'streaming'
  | 'reconnecting'
  | 'closed'
  | 'failed'

export type StreamFailureKind =
  | 'window-exceeded'
  | 'fatal-http'
  | 'auth'
  | 'bad-event'
  | 'not-found'
  | 'cursor-expired'
  | 'cursor-invalid'
  | 'ended-without-terminal'
  | 'unknown'

export interface StreamFailure {
  kind: StreamFailureKind
  message: string
  status?: number | null
  retryable?: boolean
  /** 失败时已成功应用的最大 seq，便于上层决定对账/续传 */
  lastSeq?: number
}

export interface StreamStateDetail {
  attempt?: number
  delayMs?: number
  status?: number | null
  message?: string
}

export interface ResumableStreamHandlers {
  /** 业务事件：必须保证同步应用成功；抛错会阻止游标推进并按坏事件重试 */
  onEvent: (eventName: string, data: any, seq: number) => void
  /**
   * 事件已应用且游标已 commit 之后调用。
   * 本地快照/日志必须在这里记录 seq，保证“文本已应用”与“游标”同一时刻。
   */
  onApplied?: (seq: number) => void
  /** 终态事件 done */
  onTerminal: (payload: any, seq: number) => void
  onStateChange?: (state: StreamConnectionState, detail?: StreamStateDetail) => void
  /** 自动恢复彻底失败，需要 UI 提示“重试”或上层做终态对账 */
  onFailure?: (failure: StreamFailure) => void
}

export interface RunStreamOptions extends ResumableStreamHandlers {
  taskId: string
  /** 外部取消（切换会话 / 组件卸载） */
  signal?: AbortSignal
  /** 从指定游标之后开始（页面刷新恢复时可用） */
  initialAfterSeq?: number
  backoff?: Partial<BackoffOptions>
  timing?: Partial<StreamTimingOptions>
}

export interface ResumableStream {
  run(options: RunStreamOptions): Promise<void>
  stop(): void
  state(): StreamConnectionState
}

/** 非 2xx 或非事件流响应 */
class HttpStreamError extends Error {
  constructor(
    readonly status: number,
    readonly retryAfter: string | null = null,
    message = `HTTP ${status}`,
  ) {
    super(message)
    this.name = 'HttpStreamError'
  }
}

/** 连接结束但没有收到终态事件 */
class StreamEndedError extends Error {
  constructor(message = '事件流已结束但未收到 done') {
    super(message)
    this.name = 'StreamEndedError'
  }
}

/** 业务应用事件时抛错（游标不推进） */
class StreamApplyError extends Error {
  constructor(readonly seq: number, readonly cause: unknown) {
    super(cause instanceof Error ? cause.message : String(cause))
    this.name = 'StreamApplyError'
  }
}

/** 首字节/响应头超时 */
class ConnectTimeoutError extends Error {
  constructor() {
    super('连接超时')
    this.name = 'ConnectTimeoutError'
  }
}

/** 空闲超时：连接还在，但长时间没有任何字节（含心跳） */
class IdleTimeoutError extends Error {
  constructor() {
    super('连接空闲超时')
    this.name = 'IdleTimeoutError'
  }
}

interface NetworkInformationLike {
  addEventListener?: (type: string, listener: () => void) => void
  removeEventListener?: (type: string, listener: () => void) => void
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

function parseJson(raw: string): any {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

function buildFailureMessage(status: number | null): string {
  switch (status) {
    case 403:
      return '没有权限访问这次任务'
    case 404:
      return '任务记录不存在或已过期'
    case 410:
      return '可以回放的事件已过期，无法继续接着任务'
    case 400:
      return '断点游标无效，请重新发起对话'
    default:
      return status ? `订阅失败（HTTP ${status}）` : '订阅失败'
  }
}

function failureKindForStatus(status: number): StreamFailureKind {
  if (status === 404) return 'not-found'
  if (status === 410) return 'cursor-expired'
  if (status === 400) return 'cursor-invalid'
  return 'fatal-http'
}

export function createResumableStream(): ResumableStream {
  let controller: AbortController | null = null
  let stopped = false
  let state: StreamConnectionState = 'idle'
  let wake: (() => void) | null = null

  const stop = () => {
    stopped = true
    const currentWake = wake
    wake = null
    currentWake?.()
    controller?.abort()
  }

  const run = async (options: RunStreamOptions): Promise<void> => {
    const backoff: BackoffOptions = { ...DEFAULT_BACKOFF, ...options.backoff }
    const timing: StreamTimingOptions = { ...DEFAULT_STREAM_TIMING, ...options.timing }
    const gate = createSeqGate(options.initialAfterSeq ?? 0)

    const setState = (next: StreamConnectionState, detail?: StreamStateDetail) => {
      state = next
      try {
        options.onStateChange?.(next, detail)
      } catch (err) {
        console.warn('[useResumableAgentStream] onStateChange 异常:', err)
      }
    }

    let attempt = 0
    let windowStart = Date.now()
    const runStartedAt = Date.now()
    let totalPausedMs = 0
    let slowMode = false
    let terminal = false
    let refreshCount = 0
    let lastFailedSeq: number | null = null
    let lastFailedCount = 0
    let endedWithoutTerminalCount = 0

    const fail = (failure: StreamFailure) => {
      setState('failed', { message: failure.message, status: failure.status })
      try {
        options.onFailure?.(failure)
      } catch (err) {
        console.warn('[useResumableAgentStream] onFailure 异常:', err)
      }
    }

    const sleep = (ms: number) => new Promise<void>((resolve) => {
      let timer: ReturnType<typeof setTimeout> | null = null
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        if (timer !== null) clearTimeout(timer)
        if (wake === finish) wake = null
        resolve()
      }
      timer = setTimeout(finish, ms)
      wake = finish
    })

    const waitForOnline = () => new Promise<void>((resolve) => {
      if (typeof navigator === 'undefined' || navigator.onLine !== false) {
        resolve()
        return
      }
      if (typeof window === 'undefined') {
        resolve()
        return
      }
      const done = () => {
        window.removeEventListener('online', done)
        if (wake === done) wake = null
        resolve()
      }
      window.addEventListener('online', done, { once: true })
      wake = () => {
        window.removeEventListener('online', done)
        resolve()
      }
    })

    const wakeForRetry = () => {
      // 只有在等待重连时才打断退避；正在正常收流时不要重连
      if (state === 'reconnecting') wake?.()
    }

    const onlineHandler = () => {
      if (typeof navigator === 'undefined' || navigator.onLine !== false) {
        wakeForRetry()
      }
    }
    const visibilityHandler = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        wakeForRetry()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', onlineHandler)
      window.addEventListener('pageshow', onlineHandler)
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', visibilityHandler)
    }
    const connection = typeof navigator !== 'undefined'
      ? (navigator as Navigator & { connection?: NetworkInformationLike }).connection
      : undefined
    connection?.addEventListener?.('change', onlineHandler)

    const onExternalAbort = () => stop()
    options.signal?.addEventListener('abort', onExternalAbort, { once: true })

    if (options.signal?.aborted) {
      stopped = true
      setState('closed')
      options.signal?.removeEventListener('abort', onExternalAbort)
      return
    }

    /** 处理一帧；先应用、再 commit，应用失败不推进游标 */
    const handleFrame = async (frame: SseFrame, attemptController: AbortController) => {
      // done 之后同一 chunk 里不应再有业务事件；即使有也不能再应用
      if (terminal) return
      const seq = parseEventSeq(frame.id)
      if (seq === null) {
        // 没有 id 的即时事件（如异步生成的会话标题）：照常应用，但不参与游标
        if (!frame.event || !frame.data) return
        try {
          options.onEvent(frame.event, parseJson(frame.data), 0)
        } catch (err) {
          console.warn('[useResumableAgentStream] 即时事件应用失败:', frame.event, err)
        }
        return
      }
      if (!gate.shouldApply(seq)) return

      const data = parseJson(frame.data)
      try {
        if (frame.event === 'done') {
          options.onTerminal(data, seq)
          gate.commit(seq)
          terminal = true
          // 终态已拿到，主动收尾，避免依赖服务端关连接
          attemptController.abort()
          return
        }
        options.onEvent(frame.event, data, seq)
        gate.commit(seq)
        // 顺序很重要：先应用、再提交游标、最后才允许写快照/日志
        options.onApplied?.(seq)
      } catch (err) {
        throw new StreamApplyError(seq, err)
      }
    }

    const connectOnce = async (token: string) => {
      const attemptController = new AbortController()
      controller = attemptController

      let abortReason: Error | null = null
      let lastActivityAt = Date.now()
      let connectTimer: ReturnType<typeof setTimeout> | null = null
      let idleTimer: ReturnType<typeof setInterval> | null = null
      let stableTimer: ReturnType<typeof setTimeout> | null = null

      const clearTimers = () => {
        if (connectTimer !== null) {
          clearTimeout(connectTimer)
          connectTimer = null
        }
        if (idleTimer !== null) {
          clearInterval(idleTimer)
          idleTimer = null
        }
        if (stableTimer !== null) {
          clearTimeout(stableTimer)
          stableTimer = null
        }
        if (controller === attemptController) controller = null
      }

      try {
        // 连接/首字节超时：代理挂住时不能无限等
        connectTimer = setTimeout(() => {
          abortReason = new ConnectTimeoutError()
          attemptController.abort()
        }, timing.connectTimeoutMs)

        const response = await fetch(agentApi.taskEventsUrl(options.taskId, gate.lastSeq()), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
            // 与 query 中的 after 保持一致：服务端二者冲突会返回 400
            'Last-Event-ID': String(gate.lastSeq()),
          },
          signal: attemptController.signal,
          cache: 'no-store',
        })

        if (connectTimer !== null) {
          clearTimeout(connectTimer)
          connectTimer = null
        }

        if (!response.ok) {
          throw new HttpStreamError(
            response.status,
            response.headers.get('Retry-After'),
            `订阅失败: HTTP ${response.status}`,
          )
        }
        const contentType = response.headers.get('content-type') || ''
        if (!contentType.includes('text/event-stream')) {
          throw new HttpStreamError(response.status, null, '响应不是事件流')
        }
        if (!response.body) {
          throw new HttpStreamError(response.status, null, '响应没有可读流')
        }

        setState('streaming')
        lastActivityAt = Date.now()

        // 空闲超时：任何字节（包括注释心跳）都会刷新 lastActivityAt
        idleTimer = setInterval(() => {
          if (Date.now() - lastActivityAt > timing.idleTimeoutMs) {
            abortReason = new IdleTimeoutError()
            attemptController.abort()
          }
        }, Math.max(1000, Math.min(5000, Math.floor(timing.idleTimeoutMs / 3))))

        // 连接稳定后重置退避窗口，避免长生成后的首次断线被误判超时
        stableTimer = setTimeout(() => {
          attempt = 0
          windowStart = Date.now()
          slowMode = false
          refreshCount = 0
          endedWithoutTerminalCount = 0
        }, timing.stableResetMs)

        const parser = createSseParser({
          onActivity: () => {
            lastActivityAt = Date.now()
          },
          onFrame: (frame) => handleFrame(frame, attemptController),
        })

        const reader = response.body.getReader()
        try {
          while (!stopped && !terminal) {
            const { done, value } = await reader.read()
            if (done) break
            lastActivityAt = Date.now()
            await parser.feed(value)
          }
          if (!terminal && !stopped) {
            await parser.end()
          }
        } finally {
          try {
            await reader.cancel()
          } catch {
            // 流已经结束时 cancel 可能抛错，忽略
          }
        }

        if (terminal || stopped) return
        if (abortReason) throw abortReason
        throw new StreamEndedError()
      } catch (error) {
        if (terminal || stopped) return
        // fetch 被 abort 时通常只抛 AbortError，用 abortReason 还原真实原因
        if (abortReason && (isAbortError(error) || error === abortReason)) {
          throw abortReason
        }
        throw error
      } finally {
        clearTimers()
      }
    }

    try {
      while (!stopped) {
        if (Date.now() - runStartedAt - totalPausedMs > timing.maxTotalMs) {
          fail({
            kind: 'window-exceeded',
            message: '连接中断，自动恢复已超时，请点击重试',
            lastSeq: gate.lastSeq(),
          })
          return
        }

        // 浏览器离线：暂停重试、暂停重试窗口计时，等网络恢复
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          setState('reconnecting', { attempt, message: '网络已断开，等待恢复…' })
          const pausedAt = Date.now()
          await waitForOnline()
          const paused = Date.now() - pausedAt
          windowStart += paused
          totalPausedMs += paused
          if (stopped) break
        }

        setState(attempt === 0 ? 'connecting' : 'reconnecting', { attempt })

        let failure: unknown = null
        try {
          const token = await resolveToken()
          if (stopped) break
          await connectOnce(token)
        } catch (error) {
          failure = error
        }

        if (stopped || terminal) break

        const status = failure instanceof HttpStreamError ? failure.status : null
        let retryAfterMs: number | null = null

        if (failure instanceof HttpStreamError) {
          const action = classifyHttpStatus(status)
          retryAfterMs = parseRetryAfter(failure.retryAfter)

          if (action === 'stop') {
            fail({
              kind: 'fatal-http',
              status,
              message: buildFailureMessage(status),
              lastSeq: gate.lastSeq(),
            })
            return
          }

          if (action === 'reconcile') {
            fail({
              kind: failureKindForStatus(status ?? 0),
              status,
              message: buildFailureMessage(status),
              retryable: false,
              lastSeq: gate.lastSeq(),
            })
            return
          }

          if (action === 'refresh-token') {
            refreshCount += 1
            if (refreshCount > 2) {
              fail({
                kind: 'auth',
                status,
                message: '登录状态已过期，请重新登录',
                retryable: false,
                lastSeq: gate.lastSeq(),
              })
              return
            }
            try {
              await refreshAccessToken()
            } catch {
              fail({
                kind: 'auth',
                status,
                message: '登录状态已过期，请重新登录',
                retryable: false,
                lastSeq: gate.lastSeq(),
              })
              return
            }
          }
        }

        // 同一条事件连续两次应用失败：不再无限重连，明确报错
        if (failure instanceof StreamApplyError) {
          if (lastFailedSeq === failure.seq) {
            lastFailedCount += 1
          } else {
            lastFailedSeq = failure.seq
            lastFailedCount = 1
          }
          if (lastFailedCount >= 2) {
            fail({
              kind: 'bad-event',
              status,
              message: `事件 seq=${failure.seq} 无法应用: ${failure.message}`,
              retryable: false,
              lastSeq: gate.lastSeq(),
            })
            return
          }
        }

        // 正常 EOF 但没有 done：给几次重连机会；仍不行则交给上层对账
        if (failure instanceof StreamEndedError) {
          endedWithoutTerminalCount += 1
          if (endedWithoutTerminalCount >= 3) {
            fail({
              kind: 'ended-without-terminal',
              status,
              message: '事件流已结束但没有收到完成标记',
              retryable: false,
              lastSeq: gate.lastSeq(),
            })
            return
          }
        }

        attempt += 1
        const backoffDelay = computeBackoffDelay(attempt, backoff)
        // 429/503 的 Retry-After 优先；允许超过常规退避上限，但不超过 5 分钟
        let delay = retryAfterMs !== null ? Math.min(retryAfterMs, 5 * 60_000) : backoffDelay
        const elapsed = Date.now() - windowStart

        // 快速窗口用尽：进入慢探测，避免两分钟后直接放弃仍在运行的长任务。
        // Retry-After 是服务端明确要求，不能被慢探测间隔覆盖。
        if (!slowMode && retryAfterMs === null && elapsed + delay > backoff.windowMs) {
          slowMode = true
          delay = timing.slowProbeIntervalMs
        }

        const totalElapsed = Date.now() - runStartedAt - totalPausedMs
        if (totalElapsed + delay > timing.maxTotalMs) {
          fail({
            kind: 'window-exceeded',
            status,
            message: '连接中断，自动恢复已超时，请点击重试',
            lastSeq: gate.lastSeq(),
          })
          return
        }

        setState('reconnecting', { attempt, delayMs: delay, status })
        await sleep(delay)
      }

      if (terminal) {
        setState('closed')
      } else if (stopped && state !== 'failed') {
        // 主动停止：通知 UI 结束重连态（气泡由调用方定稿）
        setState('closed')
      }
    } finally {
      options.signal?.removeEventListener('abort', onExternalAbort)
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', onlineHandler)
        window.removeEventListener('pageshow', onlineHandler)
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', visibilityHandler)
      }
      connection?.removeEventListener?.('change', onlineHandler)
      controller = null
    }
  }

  return { run, stop, state: () => state }
}

async function resolveToken(): Promise<string> {
  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) return token
  }
  return refreshAccessToken()
}

export function useResumableAgentStream(): ResumableStream {
  return createResumableStream()
}
