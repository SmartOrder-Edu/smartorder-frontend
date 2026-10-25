/**
 * 极简 SSE 解析器（纯逻辑，不依赖浏览器网络 API）。
 *
 * <p>为什么不用现成库：`@microsoft/fetch-event-source` 会直接丢弃 `:` 注释帧，
 * 客户端因此看不见服务端每 15 秒一次的心跳，也就无法判断 TCP 半开/代理静默丢包。
 * 这里保留注释回调，并支持连接超时、空闲超时所需的活动时间戳。</p>
 *
 * <p>解析规则按 SSE 规范：空行 dispatch；`data` 多行用 `\n` 连接；
 * `event`/`id`/`retry` 字段；行尾支持 `\n`、`\r\n`、`\r`；UTF-8 可跨 chunk 截断。</p>
 */

export interface SseFrame {
  id?: string
  event: string
  data: string
  retry?: number
}

export interface SseParserOptions {
  /** 一帧解析完成；返回 Promise 时解析器会等待，形成自然背压 */
  onFrame: (frame: SseFrame) => void | Promise<void>
  /** 注释帧（心跳）；不进入业务事件 */
  onComment?: (comment: string) => void
  /** 任意字节/行到达，用于刷新空闲计时 */
  onActivity?: () => void
}

export interface SseParser {
  feed(chunk: Uint8Array): Promise<void>
  end(): Promise<void>
}

export function createSseParser(options: SseParserOptions): SseParser {
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let started = false
  let ended = false

  let eventName = ''
  let dataBuffer: string | null = null
  let frameId: string | undefined
  let retry: number | undefined

  const resetMessage = () => {
    eventName = ''
    dataBuffer = null
    frameId = undefined
    retry = undefined
  }

  const dispatch = async () => {
    // 没有 data 字段的事件（例如只有注释）不派发
    if (dataBuffer === null) {
      resetMessage()
      return
    }
    const frame: SseFrame = {
      event: eventName || 'message',
      data: dataBuffer,
    }
    if (frameId !== undefined) frame.id = frameId
    if (retry !== undefined) frame.retry = retry
    resetMessage()
    await options.onFrame(frame)
  }

  const processLine = async (line: string) => {
    options.onActivity?.()

    if (line === '') {
      await dispatch()
      return
    }
    if (line.startsWith(':')) {
      options.onComment?.(line.slice(1))
      return
    }

    const colon = line.indexOf(':')
    const field = colon === -1 ? line : line.slice(0, colon)
    let value = colon === -1 ? '' : line.slice(colon + 1)
    // 规范：冒号后最多去掉一个前导空格
    if (value.startsWith(' ')) value = value.slice(1)

    switch (field) {
      case 'data':
        dataBuffer = dataBuffer === null ? value : `${dataBuffer}\n${value}`
        break
      case 'event':
        eventName = value
        break
      case 'id':
        // 含 NUL 的 id 按规范忽略
        if (!value.includes('\u0000')) frameId = value
        break
      case 'retry':
        if (/^\d+$/.test(value)) retry = Number(value)
        break
      default:
        // 未知字段忽略
        break
    }
  }

  /**
   * 从缓冲区中取完整行。`\r` 落在 chunk 末尾时要等下一块，
   * 否则会把 `\r\n` 拆成两个换行，产生一个空行并提前 dispatch。
   */
  const drain = async (final: boolean) => {
    while (buffer.length > 0) {
      let lineEnd = -1
      let consume = 0

      for (let i = 0; i < buffer.length; i += 1) {
        const code = buffer.charCodeAt(i)
        if (code === 10) {
          lineEnd = i
          consume = i + 1
          break
        }
        if (code === 13) {
          if (i + 1 >= buffer.length && !final) return
          lineEnd = i
          consume = i + 1 < buffer.length && buffer.charCodeAt(i + 1) === 10 ? i + 2 : i + 1
          break
        }
      }

      if (lineEnd === -1) {
        if (!final) return
        const line = buffer
        buffer = ''
        await processLine(line)
        break
      }

      const line = buffer.slice(0, lineEnd)
      buffer = buffer.slice(consume)
      await processLine(line)
    }

    // 服务端正常以空行结尾；异常断流时把最后半帧也派发，避免丢 done
    if (final) await dispatch()
  }

  return {
    async feed(chunk: Uint8Array): Promise<void> {
      if (ended) return
      let text = decoder.decode(chunk, { stream: true })
      if (!text) return
      if (!started) {
        started = true
        if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
      }
      options.onActivity?.()
      buffer += text
      await drain(false)
    },

    async end(): Promise<void> {
      if (ended) return
      ended = true
      const tail = decoder.decode()
      if (tail) buffer += tail
      if (!started && buffer.charCodeAt(0) === 0xfeff) buffer = buffer.slice(1)
      await drain(true)
    },
  }
}
