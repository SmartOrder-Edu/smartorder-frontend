import { agentApi, type AgentChatRequest } from '../api/agent'
import { refreshAccessToken } from '../api/request'
import { coordinateAgentTask, followAgentTask } from './agentTaskStream'
import { executeAgentTaskMessage, type AgentTaskMessageOptions,
  resumeAgentTaskMessage as followExistingTask, type AgentTaskReceipt,
  type AgentTaskMessageResult, type AgentTaskMessageClient } from './agentTaskMessageFlow'

interface PendingTask {
  requestId: string
  body: AgentChatRequest & { conversationId: string }
  receipt?: AgentTaskReceipt
}

/** 创建和恢复共用同一只读订阅器，事件去重与游标提交仍由原服务负责。 */
const client: AgentTaskMessageClient = {
  createTask: request => agentApi.createTask(request),
  getSnapshot: taskId => agentApi.getTaskSnapshot(taskId),
  async follow(stream) {
    const scopeKey = await agentApi.getCacheScope().then(value => value.scopeKey).catch(() => '')
    if (scopeKey) await coordinateAgentTask({ ...stream, scopeKey })
    else await followAgentTask({ ...stream, scopeKey: '' }, false)
  },
}

/** 页面统一发送入口：任务终结前保留 requestId，失败重试仍绑定原任务。 */
export async function sendAgentTaskMessage(
  body: AgentChatRequest & { conversationId: string },
  options: AgentTaskMessageOptions,
): Promise<AgentTaskMessageResult> {
  const pendingKey = `agent-request:${body.conversationId}:${body.message}`
  let pending: PendingTask | null = null
  try { pending = JSON.parse(sessionStorage.getItem(pendingKey) || 'null') as PendingTask | null } catch { /* 缓存损坏时重新建立幂等记录。 */ }
  if (!pending?.requestId || !pending.body) {
    pending = { requestId: crypto.randomUUID(), body }
    sessionStorage.setItem(pendingKey, JSON.stringify(pending))
  }
  const task = pending
  await refreshAccessToken()

  const result = task.receipt
    ? await followExistingTask(client, task.receipt, options)
    : await executeAgentTaskMessage(client, task.body, task.requestId, {
      ...options,
      onReceipt(receipt) {
        task.receipt = receipt
        sessionStorage.setItem(pendingKey, JSON.stringify(task))
        options.onReceipt?.(receipt)
      },
    })
  // 仅终态清除幂等键；快照或 SSE 暂时失败时，下次提交不会启动第二个 Agent。
  sessionStorage.removeItem(pendingKey)
  return result
}

/** 页面刷新后按任务标识恢复；此函数不会发起 POST。 */
export async function resumeAgentTaskMessage(
  receipt: AgentTaskReceipt,
  options: AgentTaskMessageOptions,
): Promise<AgentTaskMessageResult> {
  await refreshAccessToken()
  return followExistingTask(client, receipt, options)
}
