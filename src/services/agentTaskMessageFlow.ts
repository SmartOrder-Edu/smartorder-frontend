import type { AgentChatRequest } from '../api/agent'
import type { AgentTaskSnapshot, AgentTaskStatus } from '../db/agentCacheRepository'

/** 页面只关心确认标识、完整正文和最终状态；SSE 游标由现有订阅器管理。 */
export interface AgentTaskReceipt {
  taskId: string
  conversationId: string
  messageId: string
  streamVersion: string
  status: AgentTaskStatus
}

export interface AgentTaskMessageResult extends AgentTaskReceipt {
  content: string
}

export interface AgentTaskMessageOptions {
  signal: AbortSignal
  onReceipt?: (receipt: AgentTaskReceipt) => void
  onText?: (content: string) => void
  onState?: (state: string) => void
}

interface TaskFrame { id: string; event: string; data: string }
interface TaskFollowOptions {
  snapshot: AgentTaskSnapshot
  signal: AbortSignal
  onSnapshot: (snapshot: AgentTaskSnapshot) => void
  onEvent: (frame: TaskFrame) => void
  onState: (state: string) => void
}

export interface AgentTaskMessageClient {
  createTask: (body: AgentChatRequest & { requestId: string }) => Promise<AgentTaskReceipt>
  getSnapshot: (taskId: string) => Promise<AgentTaskSnapshot>
  follow: (options: TaskFollowOptions) => Promise<void>
}

/** 创建任务只调用一次；快照与事件订阅只读取已有任务，失败显式交给页面处理。 */
export async function executeAgentTaskMessage(
  client: AgentTaskMessageClient,
  body: AgentChatRequest,
  requestId: string,
  options: AgentTaskMessageOptions,
): Promise<AgentTaskMessageResult> {
  if (options.signal.aborted) throw new DOMException('已停止接收', 'AbortError')
  const receipt = await client.createTask({ ...body, requestId })
  options.onReceipt?.(receipt)
  return resumeAgentTaskMessage(client, receipt, options)
}

/** 已有任务只读取快照和事件，刷新或重试时绝不再次创建 Agent。 */
export async function resumeAgentTaskMessage(
  client: AgentTaskMessageClient,
  receipt: AgentTaskReceipt,
  options: AgentTaskMessageOptions,
): Promise<AgentTaskMessageResult> {
  if (options.signal.aborted) throw new DOMException('已停止接收', 'AbortError')
  let content = ''
  let status: AgentTaskStatus = receipt.status
  const applySnapshot = (snapshot: AgentTaskSnapshot) => {
    content = snapshot.messages.find(message => message.role === 'assistant')?.content || ''
    status = snapshot.status
    options.onText?.(content)
  }
  const snapshot = await client.getSnapshot(receipt.taskId)
  if (options.signal.aborted) throw new DOMException('已停止接收', 'AbortError')
  applySnapshot(snapshot)

  if (!['COMPLETED', 'FAILED', 'CANCELLED'].includes(status)) {
    await client.follow({ snapshot, signal: options.signal,
      onSnapshot: applySnapshot,
      onState: state => options.onState?.(state),
      onEvent(frame) {
        if (frame.event !== 'agent.text.delta') return
        const event = JSON.parse(frame.data)
        const delta = event.content ?? event.payload?.text
        if (typeof delta === 'string') {
          content += delta
          options.onText?.(content)
        }
      },
    })
  }
  if (options.signal.aborted) throw new DOMException('已停止接收', 'AbortError')
  if (!['COMPLETED', 'FAILED', 'CANCELLED'].includes(status)) {
    throw new Error('AGENT_TASK_STREAM_INCOMPLETE')
  }
  return { ...receipt, status, content }
}
