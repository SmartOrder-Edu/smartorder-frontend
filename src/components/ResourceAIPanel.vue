<template>
  <div class="resource-ai-panel" :class="{ expanded }">
    <!-- 收起状态：快捷操作按钮 -->
    <div v-if="!expanded" class="ai-quick-actions">
      <button
        class="ai-action-btn action-summary"
        type="button"
        @click="startQuickAction('summary')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        <span>总结</span>
      </button>
      <button
        class="ai-action-btn action-explain"
        type="button"
        @click="startQuickAction('explain')"
      >
        <svg viewBox="0 0 1024 1024" width="16" height="16">
          <path d="M510.153444 63.611783c-246.955508 0-447.140807 200.185298-447.140807 447.139783 0 246.955508 200.185298 447.140807 447.140807 447.140807 246.955508 0 447.139783-200.185298 447.139783-447.140807C957.293227 263.797082 757.108952 63.611783 510.153444 63.611783zM510.153444 913.179009c-222.273363 0-402.426419-180.152033-402.426419-402.427442 0-222.272339 180.152033-402.426419 402.426419-402.426419 222.273363 0 402.425396 180.153056 402.425396 402.426419C912.57884 733.024929 732.426807 913.179009 510.153444 913.179009zM510.153444 667.251923c-24.682146 0-44.714388 20.032242-44.714388 44.713364 0 24.682146 20.032242 44.713364 44.714388 44.713364 24.681122 0 44.713364-20.031219 44.713364-44.713364C554.866808 687.284165 534.834566 667.251923 510.153444 667.251923zM510.153444 264.825504c-74.091462 0-134.14214 60.051701-134.14214 134.14214l44.713364 0c0-49.364291 40.019459-89.427752 89.428775-89.427752s89.428775 40.063461 89.428775 89.427752c0 49.364291-40.018436 89.428775-89.428775 89.428775-7.78122 0-15.158235-1.297552-22.358217-3.174296l0 114.960265c0 12.340049 10.017144 22.356171 22.358217 22.356171 12.340049 0 22.357194-10.016121 22.357194-22.356171l0-69.307506c63.404052-10.730389 111.783923-65.460898 111.783923-131.906216C644.29456 324.876182 584.242859 264.825504 510.153444 264.825504z" fill="currentColor"/>
        </svg>
        <span>解释</span>
      </button>
      <button
        class="ai-action-btn action-quiz"
        type="button"
        @click="startQuickAction('quiz')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <span>出题</span>
      </button>
      <button
        class="ai-action-btn action-related"
        type="button"
        @click="startQuickAction('related')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span>查找</span>
      </button>
      <button
        class="ai-action-btn action-ppt"
        type="button"
        @click="emit('generate-ppt')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M4 4h16v11H4z"/><path d="M12 15v5"/><path d="M8 20h8"/><path d="M8 8h8"/><path d="M8 11h5"/>
        </svg>
        <span>PPT</span>
      </button>
      <button
        class="ai-action-btn chat-btn action-chat"
        type="button"
        @click="toggleChat"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>问AI</span>
      </button>
    </div>

    <!-- 展开状态：聊天面板 -->
    <div v-else class="ai-chat-panel">
      <div class="chat-header">
        <span>AI 伴读助手</span>
        <button type="button" class="close-btn" @click="expanded = false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="chat-messages" ref="messagesEl">
        <div v-if="chatMessages.length === 0 && !streaming" class="chat-hints">
          <p>我是基于当前资源内容的 AI 助手</p>
          <button v-for="hint in hints" :key="hint.label" type="button" class="hint-btn" @click="sendMessage(hint.prompt)">
            {{ hint.label }}
          </button>
        </div>
        <div
          v-for="(msg, i) in chatMessages"
          :key="i"
          class="chat-msg"
          :class="msg.role"
        >
          <div v-if="msg.role === 'ai'" class="msg-text markdown-text">
            <MarkdownRenderer :content="msg.content" />
          </div>
          <div v-else class="msg-text">{{ msg.content }}</div>
        </div>
        <div v-if="streaming" class="chat-msg ai streaming">
          <div class="msg-text markdown-text">
            <MarkdownRenderer :content="streamingText || '思考中...'" />
            <div v-if="connectionHint" class="connection-hint">{{ connectionHint }}</div>
          </div>
        </div>
      </div>

      <div class="chat-input-row">
        <input
          ref="inputEl"
          v-model="inputText"
          type="text"
          placeholder="对资源内容提问..."
          @keydown.enter="sendMessage(inputText)"
          :disabled="streaming || !!pendingReceipt"
        />
        <button
          type="button"
          class="send-btn"
          :disabled="!inputText.trim() || streaming || !!pendingReceipt"
          @click="sendMessage(inputText)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/>
          </svg>
        </button>
        <button v-if="streaming && pendingReceipt" type="button" class="stop-btn" title="停止接收，后台任务继续运行" @click="stopStreaming">
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
            <rect x="4" y="4" width="16" height="16" rx="2"/>
          </svg>
        </button>
        <button v-else-if="pendingReceipt" type="button" class="stop-btn" @click="restoreResourceTask">继续接收</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { sendAgentTaskMessage, resumeAgentTaskMessage } from '@/services/agentTaskMessage'
import type { AgentTaskReceipt } from '@/services/agentTaskMessageFlow'
import type { AgentChatRequest } from '@/api/agent'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'

const props = defineProps<{
  resourceId: string
  resourceTitle: string
  resourceType: string
  knowledgePoint?: string
  content?: string
}>()

const emit = defineEmits<{
  (e: 'generate-ppt'): void
}>()

const expanded = ref(false)
const streaming = ref(false)
const streamingText = ref('')
const connectionHint = ref('')
const inputText = ref('')
const chatMessages = ref<{ role: 'user' | 'ai'; content: string }[]>([])
const messagesEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
let abortController: AbortController | null = null
let resourceConversationId = ''
const pendingReceipt = ref<AgentTaskReceipt | null>(null)
const resourceTaskKey = (id: string) => `agent-resource-task:${id}`
const resourceConversationKey = (id: string) => `agent-resource-conversation:${id}`

/** 资源切换或页面刷新后从同一资源的任务回执恢复。 */
function loadResourceState() {
  resourceConversationId = sessionStorage.getItem(resourceConversationKey(props.resourceId)) || ''
  try { pendingReceipt.value = JSON.parse(sessionStorage.getItem(resourceTaskKey(props.resourceId)) || 'null')?.receipt || null }
  catch { sessionStorage.removeItem(resourceTaskKey(props.resourceId)); pendingReceipt.value = null }
  if (sessionStorage.getItem(resourceTaskKey(props.resourceId))) void restoreResourceTask()
}
onMounted(loadResourceState)
onUnmounted(() => abortController?.abort())

/** 切换资源时停止旧订阅并隔离会话，避免旧回答写到新资源面板。 */
watch(() => props.resourceId, () => {
  abortController?.abort()
  abortController = null
  resourceConversationId = ''
  pendingReceipt.value = null
  chatMessages.value = []
  streamingText.value = ''
  connectionHint.value = ''
  streaming.value = false
  loadResourceState()
})

const hints = [
  { label: '这篇文章的核心内容是什么？', prompt: '请基于当前资源内容，总结核心知识点和要点' },
  { label: '有哪些重要的概念需要掌握？', prompt: '请提取当前资源中的关键概念，并逐个解释' },
  { label: '帮我出几道练习题', prompt: '请基于当前资源内容，出3道练习题（包含答案和解析）' },
]

const QUICK_ACTION_PROMPTS: Record<string, string> = {
  summary: '请对当前学习资源进行系统总结：提炼核心知识点、梳理逻辑结构，并用简洁的语言复述要点。',
  explain: '请提取当前资源中的关键概念，为每个概念提供通俗易懂的解释，包含具体的例子或类比。',
  quiz: '请基于当前资源内容，出3~5道练习题（选择题或简答题），每道题附参考答案和解析。',
  related: '请根据当前资源的知识点，推荐相关的延伸学习内容或资源。',
}

function buildContextMessage(userMsg: string): string {
  const parts: string[] = []
  parts.push('[资源上下文]')
  parts.push(`标题：${props.resourceTitle}`)
  parts.push(`类型：${props.resourceType}`)
  if (props.knowledgePoint) parts.push(`知识点：${props.knowledgePoint}`)
  if (props.content) {
    const summary = props.content.substring(0, 3000)
    parts.push(`内容摘要：${summary}`)
  }
  parts.push('')
  parts.push('[用户问题]')
  parts.push(userMsg)
  return parts.join('\n')
}

function startQuickAction(type: string) {
  const prompt = QUICK_ACTION_PROMPTS[type]
  if (prompt) {
    expanded.value = true
    nextTick(() => {
      sendMessage(prompt)
    })
  }
}

function toggleChat() {
  expanded.value = true
  nextTick(() => {
    inputEl.value?.focus()
  })
}

function scrollMessagesToBottom() {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  })
}

async function sendMessage(text: string) {
  const trimmed = text.trim()
  if (!trimmed || streaming.value || pendingReceipt.value) return

  chatMessages.value.push({ role: 'user', content: trimmed })
  inputText.value = ''
  streaming.value = true
  streamingText.value = ''
  connectionHint.value = ''

  const message = buildContextMessage(trimmed)

  // 同一个资源面板复用会话；确认响应丢失时重试仍使用原会话和幂等键。
  resourceConversationId ||= crypto.randomUUID()
  const resourceId = props.resourceId
  sessionStorage.setItem(resourceConversationKey(resourceId), resourceConversationId)
  const body: AgentChatRequest & { conversationId: string } = { message,
    conversationId: resourceConversationId, forceMode: 'REACT' }
  // POST 回执未到时也保留原请求，刷新重试沿用服务端幂等键与请求摘要。
  sessionStorage.setItem(resourceTaskKey(resourceId), JSON.stringify({ question: trimmed, body }))
  const controller = new AbortController()
  abortController = controller

  try {
    const result = await sendAgentTaskMessage(body, {
      signal: controller.signal,
      onReceipt(receipt) {
        // 即使页面已卸载，也保留回执供 F5 恢复；旧资源回调不改写当前面板。
        sessionStorage.setItem(resourceTaskKey(resourceId), JSON.stringify({ receipt, question: trimmed, body }))
        if (props.resourceId === resourceId) {
          resourceConversationId = receipt.conversationId
          sessionStorage.setItem(resourceConversationKey(resourceId), receipt.conversationId)
          pendingReceipt.value = receipt
        }
      },
      onText(content) {
        if (controller.signal.aborted || props.resourceId !== resourceId) return
        streamingText.value = content
        scrollMessagesToBottom()
      },
      onState(state) {
        if (controller.signal.aborted || props.resourceId !== resourceId) return
        connectionHint.value = state === 'OFFLINE' || state === 'RECONNECTING'
          ? '连接中断，正在恢复…' : ''
      },
    })
    // 终态以服务端快照为准，FAILED/CANCELLED 都明确告知用户。
    const failed = result.status !== 'COMPLETED'
    if (controller.signal.aborted || props.resourceId !== resourceId) return
    sessionStorage.removeItem(resourceTaskKey(resourceId))
    pendingReceipt.value = null
    chatMessages.value.push({ role: 'ai', content: failed
      ? `${result.content || ''}\n\n*[Agent 执行失败，请重试]*`.trim()
      : result.content || '已处理完成。' })
  } catch (error: any) {
    if (error?.name !== 'AbortError' && props.resourceId === resourceId) {
      console.error('[ResourceAIPanel] 任务对话失败:', error)
      chatMessages.value.push({ role: 'ai', content: `${streamingText.value}\n\n*[请求或连接失败，请重试]*`.trim() })
    }
  } finally {
    if (abortController === controller) {
      abortController = null
      streamingText.value = ''
      connectionHint.value = ''
      streaming.value = false
    }
    scrollMessagesToBottom()
  }
}

function stopStreaming() {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
  if (streamingText.value) {
    chatMessages.value.push({
      role: 'ai',
      content: streamingText.value + '\n\n*[已停止接收；后台任务仍在运行，可继续接收]*',
    })
  }
  streamingText.value = ''
  connectionHint.value = ''
  streaming.value = false
}

/** 读取服务端快照后继续订阅已有任务，绝不重新提交用户问题。 */
async function restoreResourceTask() {
  const resourceId = props.resourceId
  const key = resourceTaskKey(resourceId)
  let saved: { receipt?: AgentTaskReceipt; question: string;
    body?: AgentChatRequest & { conversationId: string } } | null = null
  try { saved = JSON.parse(sessionStorage.getItem(key) || 'null') } catch { sessionStorage.removeItem(key) }
  if ((!saved?.receipt?.taskId && !saved?.body) || streaming.value) return
  pendingReceipt.value = saved.receipt || null
  resourceConversationId = saved.receipt?.conversationId || saved.body!.conversationId
  if (!chatMessages.value.length) chatMessages.value.push({ role: 'user', content: saved.question })
  expanded.value = true
  streaming.value = true
  const controller = new AbortController()
  abortController = controller
  try {
    const options = { signal: controller.signal,
      onReceipt(receipt: AgentTaskReceipt) {
        sessionStorage.setItem(key, JSON.stringify({ ...saved, receipt }))
        if (props.resourceId === resourceId) pendingReceipt.value = receipt
      },
      onText(content: string) { if (!controller.signal.aborted && props.resourceId === resourceId) streamingText.value = content },
      onState(state: string) { if (props.resourceId === resourceId) connectionHint.value = state === 'OFFLINE' ? '连接中断，正在恢复…' : '' },
    }
    const result = saved.receipt
      ? await resumeAgentTaskMessage(saved.receipt, options)
      : await sendAgentTaskMessage(saved.body!, options)
    if (controller.signal.aborted || props.resourceId !== resourceId) return
    sessionStorage.removeItem(key)
    pendingReceipt.value = null
    chatMessages.value.push({ role: 'ai', content: result.status === 'COMPLETED'
      ? result.content || '已处理完成。' : `${result.content}\n\n*[Agent 执行失败，请重试]*`.trim() })
  } catch (error) {
    if (!controller.signal.aborted && props.resourceId === resourceId) {
      connectionHint.value = '连接失败，可点击继续接收重试'
      console.warn('[ResourceAIPanel] 恢复失败。', error)
    }
  } finally {
    if (abortController === controller) { abortController = null; streaming.value = false; streamingText.value = '' }
  }
}
</script>

<style scoped lang="scss">
.connection-hint {
  margin-top: 6px;
  color: #b45309;
  font-size: 12px;
}

.resource-ai-panel {
  position: sticky;
  top: 24px;
  width: 56px;
  flex-shrink: 0;
  z-index: 10;

  &.expanded {
    width: 320px;
  }
}

/* 收起状态 */
.ai-quick-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 12px;
  padding: 6px;
}

.ai-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
  padding: 8px 4px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 0.625rem;

  &:hover {
    background: rgba(148, 163, 184, 0.08);
    color: #475569;
  }

  // 总结 — 蓝色
  &.action-summary {
    color: #5b7cfa;

    &:hover {
      background: rgba(91, 124, 250, 0.1);
      color: #3b5bdb;
    }
  }

  // 解释 — 琥珀色
  &.action-explain {
    color: #f59e0b;

    &:hover {
      background: rgba(245, 158, 11, 0.1);
      color: #d97706;
    }
  }

  // 出题 — 绿色
  &.action-quiz {
    color: #10b981;

    &:hover {
      background: rgba(16, 185, 129, 0.1);
      color: #059669;
    }
  }

  // 查找 — 紫色
  &.action-related {
    color: #8b5cf6;

    &:hover {
      background: rgba(139, 92, 246, 0.1);
      color: #7c3aed;
    }
  }

  &.action-ppt {
    color: #ef4444;

    &:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
    }
  }

  // 问AI – 品牌色
  &.action-chat {
    color: #0a9e94;

    &:hover {
      background: rgba(10, 158, 148, 0.1);
      color: #08857d;
    }
  }

  &.chat-btn {
    margin-top: 4px;
    padding-top: 10px;
    border-top: 1px solid rgba(148, 163, 184, 0.14);
    border-radius: 0 0 8px 8px;
  }
}

/* 展开状态 */
.ai-chat-panel {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
  max-height: 600px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  font-size: 0.8125rem;
  font-weight: 700;
  color: #0f172a;
  flex-shrink: 0;
}

.close-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;

  &:hover {
    background: rgba(148, 163, 184, 0.12);
    color: #475569;
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chat-hints {
  text-align: center;

  p {
    font-size: 0.75rem;
    color: #94a3b8;
    margin: 24px 0 12px;
  }
}

.hint-btn {
  display: block;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
  font-size: 0.75rem;
  cursor: pointer;
  text-align: left;
  margin-bottom: 6px;
  transition: all 0.15s;

  &:hover {
    border-color: rgba(10, 158, 148, 0.24);
    background: rgba(10, 158, 148, 0.04);
    color: #0a9e94;
  }
}

.chat-msg {
  max-width: 92%;

  &.user {
    align-self: flex-end;

    .msg-text {
      background: #0a9e94;
      color: #ffffff;
      border-radius: 12px 12px 4px 12px;
    }
  }

  &.ai {
    align-self: flex-start;

    .msg-text {
      background: #f1f5f9;
      color: #1f2937;
      border-radius: 12px 12px 12px 4px;
    }
  }

  &.streaming .msg-text {
    background: #f1f5f9;
  }
}

.msg-text {
  padding: 8px 12px;
  font-size: 0.78rem;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

/* AI Markdown 渲染：交给 MarkdownRenderer 处理换行与排版 */
.msg-text.markdown-text {
  white-space: normal;

  :deep(.markdown-renderer) {
    font-size: 0.78rem;
    line-height: 1.55;
  }

  :deep(.markdown-renderer p) {
    margin: 0 0 0.5em;
  }

  :deep(.markdown-renderer p:last-child) {
    margin-bottom: 0;
  }

  :deep(.markdown-renderer ul),
  :deep(.markdown-renderer ol) {
    margin: 0.3em 0;
    padding-left: 1.3em;
  }

  :deep(.markdown-renderer li) {
    margin: 0.15em 0;
  }

  :deep(.markdown-renderer h1),
  :deep(.markdown-renderer h2),
  :deep(.markdown-renderer h3),
  :deep(.markdown-renderer h4) {
    margin: 0.6em 0 0.35em;
    font-size: 0.85rem;
  }

  :deep(.markdown-renderer code:not(pre code)) {
    font-size: 0.74rem;
  }

  :deep(.markdown-renderer pre) {
    font-size: 0.74rem;
  }

  :deep(.markdown-renderer .code-block-wrapper) {
    margin: 0.5em 0;
  }

  :deep(.markdown-renderer blockquote) {
    margin: 0.4em 0;
    padding: 2px 10px;
    font-size: 0.74rem;
  }

  :deep(.markdown-renderer table) {
    font-size: 0.74rem;
  }

  :deep(.markdown-renderer table th),
  :deep(.markdown-renderer table td) {
    padding: 4px 8px;
  }
}

.chat-input-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.14);
  flex-shrink: 0;

  input {
    flex: 1;
    min-width: 0;
    padding: 8px 10px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 8px;
    font-size: 0.78rem;
    background: #f8fafc;
    color: #0f172a;
    outline: none;

    &:focus {
      border-color: rgba(10, 158, 148, 0.35);
      background: #ffffff;
    }

    &::placeholder {
      color: #94a3b8;
    }

    &:disabled {
      background: #f1f5f9;
    }
  }
}

.send-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  background: #0a9e94;
  color: #ffffff;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    background: #0bb7aa;
  }

  &:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
  }
}

.stop-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 6px;
  background: #fef2f2;
  color: #dc2626;
  cursor: pointer;
  flex-shrink: 0;
}
</style>
