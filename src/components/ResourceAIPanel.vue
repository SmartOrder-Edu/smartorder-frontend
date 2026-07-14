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
          <div class="msg-text">{{ msg.content }}</div>
        </div>
        <div v-if="streaming" class="chat-msg ai streaming">
          <div class="msg-text">{{ streamingText || '思考中...' }}</div>
        </div>
      </div>

      <div class="chat-input-row">
        <input
          ref="inputEl"
          v-model="inputText"
          type="text"
          placeholder="对资源内容提问..."
          @keydown.enter="sendMessage(inputText)"
          :disabled="streaming"
        />
        <button
          type="button"
          class="send-btn"
          :disabled="!inputText.trim() || streaming"
          @click="sendMessage(inputText)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/>
          </svg>
        </button>
        <button v-if="streaming" type="button" class="stop-btn" @click="stopStreaming">
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
            <rect x="4" y="4" width="16" height="16" rx="2"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { refreshAccessToken } from '@/api/request'

const props = defineProps<{
  resourceId: string
  resourceTitle: string
  resourceType: string
  knowledgePoint?: string
  content?: string
}>()

const expanded = ref(false)
const streaming = ref(false)
const streamingText = ref('')
const inputText = ref('')
const chatMessages = ref<{ role: 'user' | 'ai'; content: string }[]>([])
const messagesEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
let abortController: AbortController | null = null

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
  if (!trimmed || streaming.value) return

  chatMessages.value.push({ role: 'user', content: trimmed })
  inputText.value = ''
  streaming.value = true
  streamingText.value = ''

  const message = buildContextMessage(trimmed)

  let token: string
  try {
    token = await refreshAccessToken()
  } catch {
    streaming.value = false
    return
  }

  const base = import.meta.env.VITE_API_BASE_URL || '/api'
  abortController = new AbortController()

  try {
    await fetchEventSource(`${base}/agent/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        forceMode: 'REACT',
      }),
      openWhenHidden: true,
      signal: abortController.signal,

      onmessage(event) {
        if (!event.data) return

        if (event.event === 'done') {
          if (streamingText.value) {
            chatMessages.value.push({
              role: 'ai',
              content: streamingText.value,
            })
          } else if (!streamingText.value) {
            chatMessages.value.push({
              role: 'ai',
              content: '已处理完成。',
            })
          }
          streamingText.value = ''
          streaming.value = false
          abortController = null
          scrollMessagesToBottom()
          return
        }

        try {
          const data = JSON.parse(event.data)
          if (data?.payload?.text) {
            streamingText.value += data.payload.text
            scrollMessagesToBottom()
          }
        } catch {
          // ignore non-JSON
        }
      },

      onerror(err) {
        console.error('[ResourceAIPanel] SSE error:', err)
        if (streamingText.value) {
          chatMessages.value.push({
            role: 'ai',
            content: streamingText.value + '\n\n*[连接中断]*',
          })
        } else {
          chatMessages.value.push({
            role: 'ai',
            content: '*[连接中断，请重试]*',
          })
        }
        streamingText.value = ''
        streaming.value = false
        abortController = null
        scrollMessagesToBottom()
        throw err
      },
    })
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.error('[ResourceAIPanel] fetch error:', err)
      streaming.value = false
    }
    abortController = null
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
      content: streamingText.value + '\n\n*[已停止]*',
    })
  }
  streamingText.value = ''
  streaming.value = false
}
</script>

<style scoped lang="scss">
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

  // 问AI — 品牌色
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
