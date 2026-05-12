/**
 * Agent 对话 API — SSE 流式接口
 */
export interface AgentChatRequest {
  message: string
  conversationId?: string
}

export interface PlanSummary {
  spaceId: number
  spaceName: string
  spaceType: string
  nodeCount: number
  taskCount: number
  kgNodeCount: number
  startDate: string
  targetEndDate: string
}

export type SseEventType = 'token' | 'done' | 'error'

export interface SseEvent {
  type: SseEventType
  data: string
}

/**
 * SSE 流式请求 Agent 对话
 * @returns AbortController 用于中断请求
 */
export function streamAgentChat(
  req: AgentChatRequest,
  onToken: (token: string) => void,
  onPlanResult: (plan: PlanSummary) => void,
  onDone: (conversationId: string) => void,
  onError: (error: string) => void
): AbortController {
  const controller = new AbortController()
  const token = localStorage.getItem('token')
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

  fetch(`${baseURL}/agent/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      message: req.message,
      conversationId: req.conversationId || undefined
    }),
    signal: controller.signal
  })
    .then(async (response) => {
      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(`HTTP ${response.status}: ${text}`)
      }
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // 解析 SSE 事件
        const lines = buffer.split('\n')
        buffer = ''
        let currentEvent = ''
        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.substring(6).trim()
          } else if (line.startsWith('data:')) {
            const data = line.substring(5).trim()
            if (!data) continue

            if (currentEvent === 'token') {
              // 判断是否为特殊标记
              if (data.startsWith('[STATUS]')) {
                // 状态更新忽略（不做特殊处理）
                continue
              } else if (data.startsWith('[PLAN_RESULT]')) {
                try {
                  const planJson = data.substring('[PLAN_RESULT]'.length)
                  const plan = JSON.parse(planJson) as PlanSummary
                  onPlanResult(plan)
                } catch {
                  // ignore parse errors
                }
              } else if (data.startsWith('[ERROR]')) {
                onError(data.substring('[ERROR]'.length))
              } else {
                onToken(data)
              }
            } else if (currentEvent === 'done') {
              try {
                const doneData = JSON.parse(data)
                onDone(doneData.conversationId || '')
              } catch {
                onDone('')
              }
            } else if (currentEvent === 'error') {
              try {
                const errData = JSON.parse(data)
                onError(errData.message || 'Unknown error')
              } catch {
                onError(data)
              }
            }
            currentEvent = ''
          } else if (line.trim() === '') {
            currentEvent = ''
          } else {
            // 非标准 event/data 行，可能是 data 的延续
            buffer += line + '\n'
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError(err.message || 'Network error')
      }
    })

  return controller
}

export default { streamAgentChat }
