<template>
  <aside class="study-agent-panel">
    <!-- Agent header -->
    <div class="panel-top">
      <div class="agent-mini-header">
        <div class="agent-mini-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </div>
        <span class="agent-mini-name">学习伙伴</span>
        <span class="agent-mini-status">在线</span>
      </div>
      <p class="agent-hint" v-if="hint">{{ hint }}</p>
    </div>

    <!-- Feedback buttons grid -->
    <div class="feedback-grid">
      <button
        v-for="btn in feedbackButtons"
        :key="btn.label"
        class="feedback-btn"
        :class="btn.variant"
        @click="$emit('feedback', btn.label)"
        :disabled="btn.label === '我已经会了' && loadingComplete"
      >
        <span class="fb-icon" v-html="btn.icon"></span>
        <span class="fb-label">{{ btn.label }}</span>
      </button>
    </div>

    <!-- Chat section -->
    <div class="chat-section">
      <div class="chat-messages" ref="chatEl">
        <div v-for="(msg, i) in messages" :key="i" class="chat-msg" :class="msg.role">
          <div class="msg-bubble">{{ msg.text }}</div>
        </div>
      </div>
      <div class="chat-input-row">
        <input
          v-model="input"
          class="chat-input"
          placeholder="随时向学习伙伴提问..."
          @keyup.enter="sendMessage"
        />
        <button class="chat-send" @click="sendMessage" :disabled="!input.trim()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Complete study button -->
    <button class="complete-btn" @click="$emit('complete')" :disabled="loadingComplete">
      {{ loadingComplete ? '正在完成...' : '完成学习' }}
    </button>
  </aside>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = defineProps<{
  hint?: string
  loadingComplete?: boolean
}>()

const emit = defineEmits<{
  feedback: [label: string]
  sendMessage: [text: string]
  complete: []
}>()

const input = ref('')
const messages = ref<{ role: 'user' | 'agent'; text: string }[]>([])
const chatEl = ref<HTMLElement>()

const feedbackButtons = [
  { label: '看不懂', variant: 'default', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>' },
  { label: '讲简单点', variant: 'default', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="4,7 12,3 20,7"/><polyline points="4,12 12,8 20,12"/><polyline points="4,17 12,13 20,17"/></svg>' },
  { label: '换个例子', variant: 'default', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="8" cy="18" r="1"/></svg>' },
  { label: '生成图解', variant: 'default', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>' },
  { label: '出几道题', variant: 'accent', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
  { label: '我已经会了', variant: 'success', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20,6 9,17 4,12"/></svg>' },
  { label: '加入错题', variant: 'warn', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' },
  { label: '稍后复习', variant: 'default', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>' },
]

function sendMessage() {
  const text = input.value.trim()
  if (!text) return
  messages.value.push({ role: 'user', text })
  input.value = ''
  emit('sendMessage', text)

  // Simulate agent response
  setTimeout(() => {
    const response = getMockAgentResponse(text)
    messages.value.push({ role: 'agent', text: response })
    nextTick(() => {
      if (chatEl.value) chatEl.value.scrollTop = chatEl.value.scrollHeight
    })
  }, 500)

  nextTick(() => {
    if (chatEl.value) chatEl.value.scrollTop = chatEl.value.scrollHeight
  })
}

function getMockAgentResponse(question: string): string {
  if (question.includes('不懂') || question.includes('解释')) return '让我换一种方式解释：洛必达法则的核心思想是用导数的比值来代替函数比值求极限。你可以把它理解为一个"极限计算器"——当遇到0/0或∞/∞的不定式时，就可以用这个工具。'
  if (question.includes('例子')) return '好的，换个例子：求 lim(x→∞) x/e^x。这是∞/∞型，用洛必达法则求导后得到 lim(x→∞) 1/e^x = 0。说明指数函数增长远快于任何幂函数。'
  if (question.includes('图解')) return '已为你生成洛必达法则的图解说明：想象两条曲线在a处都经过0点，它们的比值极限就等于它们导数（切线斜率）的比值。'
  return '我理解你的问题，让我结合你当前的学习进度给出针对性解答。'
}
</script>

<script lang="ts">
export default { name: 'StudyAgentPanel' }
</script>

<style scoped lang="scss">
.study-agent-panel {
  width: 300px;
  background: white;
  border-radius: 14px;
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: fit-content;
  max-height: calc(100vh - 100px);
  position: sticky;
  top: 100px;
  overflow: hidden;

  @media (max-width: 1024px) {
    width: 100%;
    position: static;
    max-height: none;
  }
}

.panel-top {
  padding: 14px 16px 0;
}

.agent-mini-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.agent-mini-avatar {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: linear-gradient(135deg, #10b981, #34d399);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.agent-mini-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1a1a2e;
}

.agent-mini-status {
  font-size: 0.625rem;
  color: #10b981;
  &::before { content: '• '; }
}

.agent-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 6px 0 0;
  line-height: 1.4;
}

.feedback-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 0 16px;
}

.feedback-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
  cursor: pointer;
  transition: all 0.15s;
  color: #374151;

  .fb-icon { display: flex; align-items: center; flex-shrink: 0; }
  .fb-label { font-size: 0.75rem; white-space: nowrap; }

  &:hover:not(:disabled) { border-color: #3b82f6; background: #f9fafb; }

  &.accent {
    background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8;
    &:hover:not(:disabled) { background: #dbeafe; }
  }
  &.success {
    background: #ecfdf5; border-color: #a7f3d0; color: #047857;
    &:hover:not(:disabled) { background: #d1fae5; }
  }
  &.warn {
    background: #fef3c7; border-color: #fcd34d; color: #92400e;
    &:hover:not(:disabled) { background: #fef08a; }
  }
  &:disabled { opacity: 0.5; cursor: default; }
}

.chat-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 16px;
  min-height: 120px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  max-height: 160px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
}

.chat-msg {
  &.user .msg-bubble {
    background: #eff6ff; color: #1e40af;
    border-radius: 10px 10px 4px 10px;
    margin-left: 16px;
  }
  &.agent .msg-bubble {
    background: #f9fafb; color: #374151;
    border-radius: 10px 10px 10px 4px;
    margin-right: 16px;
  }
}

.msg-bubble {
  padding: 6px 10px;
  font-size: 0.75rem;
  line-height: 1.5;
}

.chat-input-row {
  display: flex;
  gap: 6px;
  padding: 8px 0;
}

.chat-input {
  flex: 1;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  font-size: 0.75rem;
  color: #374151;
  background: #f9fafb;
  outline: none;
  &:focus { border-color: #3b82f6; background: white; }
}

.chat-send {
  width: 30px; height: 30px;
  border-radius: 8px;
  border: none;
  background: #10b981;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  &:disabled { opacity: 0.4; cursor: default; }
}

.complete-btn {
  margin: 0 16px 16px;
  padding: 10px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  &:disabled { opacity: 0.5; cursor: default; }
  &:not(:disabled):hover { opacity: 0.9; }
}
</style>
