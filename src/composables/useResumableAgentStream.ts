import { fetchEventSource } from '@microsoft/fetch-event-source'
import { agentApi } from '@/api/agent'
import { refreshAccessToken } from '@/api/request'
import {
  DEFAULT_BACKOFF,
  computeBackoffDelay,
  createSeqGate,
  decideRetry,
  parseEventSeq,
  parseRetryAfter,
  type BackoffOptions,
} from './resumableStreamCore'

/**
 * 可恢复的 Agent 事件流（SSE）。
 *
 * 设计要点：
 * 1. 连接由外层循环控制，每次重连都带“已成功应用”的 seq 游标，服务端只补发之后的事件；
 * 2. 收到 done 才算结束——HTTP 正常 EOF 但没有 done 也视为中断，继续恢复；
 * 3. 事件先应用、成功后才推进游标；应用失败不推进，下次会重新拉到同一条；
 * 4. 1s→2s→4s→8s→15s 指数退避 + 抖动，两分钟窗口；浏览器离线时暂停并等恢复；
 * 5. 401 刷新 token 后重试，403/404/410 直接失败，429 遵守 Retry-After。
 */

export type StreamConnectionState =
  | 'idle'
  | 'connecting'
  | 'streaming'
  | 'reconnecting'
  | 'closed'
  | 'failed'

export interface StreamFailure {
  kind: 'window-exceeded' | 'fatal-http' | 'auth' | 'bad-event' | 'unknown'
  message: string
  status?: number | null
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
   * 刷新快照必须在这里记录 lastSeq，保证“文本已应用”与“游标”同一时刻。
   */
  onApplied?: (seq: number) => void
  /** 终态事件 done */
  onTerminal: (payload: any, seq: number) => void
  onStateChange?: (state: StreamConnectionState, detail?: StreamStateDetail) => void
  /** 自动恢复彻底失败，需要 UI 提示“重试” */
  onFailure?: (failure: StreamFailure) => void
}

export interface RunStreamOptions extends ResumableStreamHandlers {
  generationId: string
  /** 外部取消（切换会话 / 组件卸载） */
  signal?: AbortSignal
  /** 从指定游标之后开始（页面刷新恢复时可用） */
  initialAfterSeq?: number
  backoff?: Partial<BackoffOptions>
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

export function createResumableStream(): ResumableStream {
  let controller: AbortController | null = null
  let stopped = false
  let state: StreamConnectionState = 'idle'
  let wake: (() => void) | null = null

  const stop = () => {
    stopped = true
    wake?.()
    wake = null
    controller?.abort()
  }

  const run = async (options: RunStreamOptions): Promise<void> => {
    const backoff: BackoffOptions = { ...DEFAULT_BACKOFF, ...options.backoff }
    const gate = createSeqGate(options.initialAfterSeq ?? 0)
    const setState = (next: StreamConnectionState, detail?: StreamStateDetail) => {
      state = next
      options.onStateChange?.(next, detail)
    }

    let attempt = 0
    let windowStart = Date.now()
    let terminal = false
    let lastFailedSeq: number | null = null
    let lastFailedCount = 0

    const fail = (failure: StreamFailure) => {
      setState('failed', { message: failure.message, status: failure.status })
      options.onFailure?.(failure)
    }

    const sleep = (ms: number) => new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        wake = null
        resolve()
      }, ms)
      wake = () => {
        clearTimeout(timer)
        resolve()
      }
    })

    const waitForOnline = () => new Promise<void>((resolve) => {
      if (typeof window === 'undefined' || typeof navigator === 'undefined' || navigator.onLine !== false) {
        resolve()
        return
      }
      const done = () => {
        window.removeEventListener('online', done)
        wake = null
        resolve()
      }
      window.addEventListener('online', done, { once: true })
      wake = () => {
        window.removeEventListener('online', done)
        resolve()
      }
    })

    const onExternalAbort = () => stop()
    options.signal?.addEventListener('abort', onExternalAbort, { once: true })

    // 已经被外部取消（切换会话/组件卸载）：不再发起任何请求
    if (options.signal?.aborted) {
      stopped = true
      setState('closed')
      options.signal?.removeEventListener('abort', onExternalAbort)
      return
    }

    try {
      while (!stopped) {
        // 浏览器离线：暂停重试、暂停重试窗口计时，等网络恢复
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          setState('reconnecting', { attempt, message: '网络已断开，等待恢复…' })
          const pausedAt = Date.now()
          await waitForOnline()
          windowStart += Date.now() - pausedAt
          if (stopped) break
        }

        setState(attempt === 0 ? 'connecting' : 'reconnecting', { attempt })

        let failure: unknown = null
        try {
          const token = await resolveToken()
          if (stopped) break

          const attemptController = new AbortController()
          controller = attemptController
          const forwardAbort = () => attemptController.abort()
          options.signal?.addEventListener('abort', forwardAbort, { once: true })

          try {
            await fetchEventSource(
              agentApi.generationEventsUrl(options.generationId, gate.lastSeq()),
              {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: 'text/event-stream',
                },
                signal: attemptController.signal,
                openWhenHidden: true,

                async onopen(response) {
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
                  setState('streaming')
                },

                onmessage(message) {
                  const seq = parseEventSeq(message.id)
                  // 没有 id 的事件是“即时事件”（如异步生成的会话标题）：
                  // 照常应用，但不参与断点游标——回放里不会重放它们
                  if (seq === null) {
                    if (!message.event || !message.data) return
                    try {
                      options.onEvent(message.event, parseJson(message.data), 0)
                    } catch (applyError) {
                      console.warn('[useResumableAgentStream] 即时事件应用失败:', message.event, applyError)
                    }
                    return
                  }
                  if (!gate.shouldApply(seq)) return
                  const data = parseJson(message.data)
                  try {
                    if (message.event === 'done') {
                      options.onTerminal(data, seq)
                      gate.commit(seq)
                      terminal = true
                      // 终态已拿到，主动收尾，避免依赖服务端关连接
                      attemptController.abort()
                      return
                    }
                    options.onEvent(message.event, data, seq)
                    gate.commit(seq)
                    // 顺序很重要：先应用、再提交游标、最后才允许写快照
                    options.onApplied?.(seq)
                  } catch (applyError) {
                    throw new StreamApplyError(seq, applyError)
                  }
                },

                onclose() {
                  // 正常结束但没有终态：不能当成功，走恢复流程
                  throw new StreamEndedError()
                },

                onerror(error) {
                  // 关掉库自带的重试，由外层按游标统一控制
                  throw error
                },
              },
            )
            failure = new StreamEndedError('事件流已结束')
          } catch (error) {
            failure = error
          } finally {
            options.signal?.removeEventListener('abort', forwardAbort)
            if (controller === attemptController) controller = null
          }
        } catch (error) {
          // resolveToken 失败
          failure = error
        }

        if (stopped || terminal) break
        if (failure instanceof DOMException && failure.name === 'AbortError' && !stopped) {
          // 服务端/浏览器主动断开（非用户停止），按中断处理
          failure = new StreamEndedError('连接被中断')
        }

        const status = failure instanceof HttpStreamError ? failure.status : null
        const decision = decideRetry(status)

        if (decision === 'stop') {
          fail({
            kind: 'fatal-http',
            status,
            message: buildFailureMessage(status),
          })
          return
        }

        if (decision === 'refresh-token') {
          try {
            await refreshAccessToken()
          } catch {
            fail({ kind: 'auth', status, message: '登录状态已过期，请重新登录' })
            return
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
            })
            return
          }
        }

        attempt += 1
        const retryAfterMs = failure instanceof HttpStreamError
          ? parseRetryAfter(failure.retryAfter)
          : null
        const backoffDelay = computeBackoffDelay(attempt, backoff)
        const delay = retryAfterMs !== null ? Math.min(retryAfterMs, backoff.windowMs) : backoffDelay
        const elapsed = Date.now() - windowStart

        if (elapsed + delay > backoff.windowMs) {
          fail({
            kind: 'window-exceeded',
            status,
            message: '连接中断，自动重连已超时，请手动重试',
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
      return '没有权限访问这次生成'
    case 404:
      return '生成记录不存在或已过期'
    case 410:
      return '可以回放的事件已过期，无法继续接着生成'
    case 400:
      return '断点游标无效，请重新发起对话'
    default:
      return status ? `订阅失败（HTTP ${status}）` : '订阅失败'
  }
}

export function useResumableAgentStream(): ResumableStream {
  return createResumableStream()
}
