<template>
  <div class="space-agent-panel">
    <!-- Toggle button (mobile) -->
    <button class="agent-toggle-fab" @click="open = !open" v-if="!open">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
        <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>
        <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
    </button>

    <!-- Panel overlay (mobile) -->
    <div class="agent-overlay" v-if="open && isMobile" @click="open = false"></div>

    <!-- Panel content -->
    <aside class="agent-panel" :class="{ open, mobile: isMobile, 'log-expanded': logExpanded }">
      <div class="panel-header">
        <div class="panel-header-left">
          <div class="agent-avatar">
            <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
              <path d="M483.002182 188.043636h51.2v114.036364H483.002182z" fill="#40e3c2"/>
              <path d="M510.929455 143.825455m-128 0a128 128 0 1 0 256 0 128 128 0 1 0-256 0Z" fill="#40e3c2"/>
              <path d="M475.83125977 148.45865723v5.05620769h37.07885744v11.79781821h-16.8540259v23.59563642h16.8540259v11.79781817h-16.8540259V207.44774823l8.42701331 28.65184483h8.42701259v10.1124154h-15.16862307l-5.05620773-20.22483152L485.94367591 246.21200846H469.08964929v-11.7978182h11.79781818L485.94367591 207.44774823v-8.42701259H469.08964929v-11.79781893h18.5394287V163.62728031h-15.1686231L465.71884437 156.88566981v-8.42701258h10.1124154z m82.58472817 3.37080486v82.58472817l-10.1124154 11.79781822H519.65172773V151.82946209h38.76426021z m-11.79781819 11.79781822h-16.85402591v70.78690995h16.85402591V163.62728031z" fill="#40e3c2"/>
              <path d="M679.098182 301.963636c139.636364 13.963636 223.418182 79.127273 253.672727 197.818182 46.545455 179.2 34.909091 267.636364 32.581818 283.927273-2.327273 18.618182-30.254545 123.345455-160.581818 174.545454-83.781818 32.581818-172.218182 55.854545-293.236364 53.527273v-535.272727 535.272727c-116.363636 2.327273-204.8-18.618182-286.254545-48.872727l-9.309091-4.654546c-130.327273-53.527273-158.254545-158.254545-160.581818-174.545454-4.654545-16.290909-13.963636-104.727273 30.254545-283.927273 30.254545-118.690909 114.036364-186.181818 251.345455-200.145454 37.236364-2.327273 93.090909-6.981818 172.218182-6.981819h9.309091c74.472727 0 128 4.654545 160.581818 9.309091z" fill="#C5C5C5"/>
              <path d="M139.170909 723.2c0 2.327273 0 2.327273 0 0 0 4.654545 2.327273 6.981818 2.327273 9.309091 4.654545 9.309091 9.309091 16.290909 16.290909 25.6 18.618182 23.272727 46.545455 44.218182 83.781818 58.181818l4.654546 2.327273 4.654545 2.327273c53.527273 18.618182 107.054545 30.254545 165.236364 37.236363 58.181818 4.654545 123.345455 4.654545 183.854545 0 58.181818-4.654545 111.709091-18.618182 165.236364-37.236363l4.654545-2.327273c41.890909-13.963636 69.818182-34.909091 88.436364-60.509091 6.981818-9.309091 11.636364-18.618182 16.290909-25.6 0-2.327273 2.327273-4.654545 2.327273-6.981818v-2.327273c0-2.327273 0-6.981818 2.327272-11.636364v-2.327272-39.563637c-2.327273-44.218182-13.963636-97.745455-32.581818-162.909091-18.618182-74.472727-72.145455-111.709091-174.545454-121.018181-53.527273-4.654545-93.090909-6.981818-148.945455-6.981819H502.225455c-58.181818 0-97.745455 2.327273-155.927273 6.981819-102.4 9.309091-153.6 46.545455-174.545455 118.690909-18.618182 65.163636-27.927273 118.690909-32.581818 162.909091 0 16.290909-2.327273 30.254545 0 39.563636v16.290909z" fill="#14254E"/>
              <path d="M509.207273 695.272727c-27.927273 0-55.854545 11.636364-55.854546 20.945455s11.636364 39.563636 55.854546 39.563636c41.890909 0 51.2-23.272727 55.854545-39.563636 0-13.963636-27.927273-20.945455-55.854545-20.945455z" fill="#40E3C2"/>
              <path d="M295.936 578.373818a72.145455 53.527273 90 1 0 107.054545 0 72.145455 53.527273 90 1 0-107.054545 0Z" fill="#40E3C2"/>
              <path d="M617.099636 578.373818a72.145455 53.527273 90 1 0 107.054546 0 72.145455 53.527273 90 1 0-107.054546 0Z" fill="#40E3C2"/>
            </svg>
          </div>
          <div>
            <span class="panel-title">Space Agent</span>
            <span class="panel-subtitle">在线 · {{ spaceName }}</span>
          </div>
        </div>
        <button class="panel-close" v-if="isMobile" @click="open = false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Agent insight -->
      <div class="panel-insight" v-if="insight">
        <p>{{ insight }}</p>
      </div>

      <!-- Quick actions -->
      <div class="panel-quick-actions">
        <button class="quick-action-btn" v-for="q in quickActions" :key="q.label" @click="$emit('quickAction', q.label)">
          <span v-html="q.icon"></span>
          {{ q.label }}
        </button>
      </div>

      <!-- Chat messages -->
      <div class="panel-chat" ref="chatContainer">
        <div class="chat-messages" v-if="messages.length">
          <div v-for="(msg, i) in messages" :key="i" class="chat-msg" :class="msg.role">
            <div class="msg-content">
              <p>{{ msg.text }}</p>
              <!-- Action buttons from agent -->
              <div class="msg-actions" v-if="msg.actions && msg.actions.length">
                <button
                  v-for="act in msg.actions"
                  :key="act.label"
                  class="msg-action-btn"
                  :class="act.variant || 'default'"
                  @click="$emit('agentAction', act)"
                >
                  {{ act.label }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="chat-empty" v-else>
          <p>向 Agent 提问或点击快捷按钮</p>
        </div>
      </div>

      <!-- Chat input -->
      <div class="panel-input">
        <input
          v-model="input"
          class="chat-input"
          placeholder="输入问题..."
          @keyup.enter="sendMessage"
        />
        <button class="chat-send" @click="sendMessage" :disabled="!input.trim()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/>
          </svg>
        </button>
      </div>

      <!-- Agent action log -->
      <div class="panel-log" :class="{ expanded: logExpanded }" v-if="agentActions && agentActions.length">
        <button class="log-header-btn" @click="logExpanded = !logExpanded">
          <svg class="log-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="9 6 15 12 9 18"/></svg>
          <span class="log-header-title">Agent 操作日志</span>
          <span class="log-count-badge">{{ agentActions.length }}</span>
        </button>
        <div class="log-expanded-body" v-show="logExpanded">
          <AgentActionLog :actions="agentActions" />
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import type { AgentActionVO } from '@/types/learningSpace'
import AgentActionLog from './AgentActionLog.vue'

interface ChatMessage {
  role: 'user' | 'agent'
  text: string
  actions?: { label: string; variant?: string }[]
}

const props = defineProps<{
  spaceName?: string
  insight?: string
  agentActions?: AgentActionVO[]
}>()

const emit = defineEmits<{
  quickAction: [label: string]
  agentAction: [action: { label: string; variant?: string }]
  sendMessage: [text: string]
}>()

const open = ref(false)
const isMobile = ref(window.innerWidth <= 1024)
const input = ref('')
const messages = ref<ChatMessage[]>([])
const chatContainer = ref<HTMLElement>()
const logExpanded = ref(false)

const quickActions = [
  { label: '我在哪里薄弱？', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' },
  { label: '调整我的计划', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>' },
  { label: '生成测试题', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
  { label: '推荐学习资源', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
]

function sendMessage() {
  const text = input.value.trim()
  if (!text) return
  messages.value.push({ role: 'user', text })
  input.value = ''
  emit('sendMessage', text)

  // Simulate Agent response (replace with SSE streaming)
  setTimeout(() => {
    messages.value.push({
      role: 'agent',
      text: mockAgentResponse(text),
      actions: text.includes('薄弱') || text.includes('错题')
        ? [{ label: '开始练习', variant: 'primary' }, { label: '查看报告', variant: 'default' }]
        : text.includes('测试')
          ? [{ label: '开始测试', variant: 'primary' }]
          : undefined,
    })
    nextTick(() => {
      if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    })
  }, 600)

  nextTick(() => {
    if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  })
}

function openPanel() {
  open.value = true
}

function mockAgentResponse(question: string): string {
  if (question.includes('薄弱')) return '根据最近的学习记录，你在**洛必达法则适用条件**上错误率较高（正确率42%），其次是**无穷小阶数比较**。建议优先完成洛必达法则专项练习。'
  if (question.includes('测试')) return '已为你生成10道极限与连续的综合测试题，涵盖洛必达法则、极限运算、连续性判定。'
  if (question.includes('计划')) return '建议将今天的任务调整为：1.洛必达法则专项练习（25分钟）2.连续与间断预习（20分钟）。高数空间当前进度正常，无需调整整体计划。'
  return '收到你的问题。我会结合学习数据和你的个人画像给出针对性建议。'
}

function onResize() {
  isMobile.value = window.innerWidth <= 1024
}

onMounted(() => {
  window.addEventListener('resize', onResize)
  open.value = !isMobile.value
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})

defineExpose({
  open: openPanel,
})
</script>

<script lang="ts">
export default { name: 'SpaceAgentPanel' }
</script>

<style scoped lang="scss">
.space-agent-panel {
  // Container for positioning
}

.agent-toggle-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  border: none;
  color: white;
  cursor: pointer;
  box-shadow: 0 14px 28px rgba(11, 183, 170, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 90;
  transition: transform 0.2s;

  &:hover { transform: scale(1.05); }
}

.agent-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 95;
}

.agent-panel {
  width: 340px;
  background: var(--color-card-bg);
  backdrop-filter: blur(16px);
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(100vh - 120px);
  position: sticky;
  top: 100px;
  overflow: hidden;
  box-shadow: 0 20px 44px rgba(15, 23, 42, 0.08);

  &.mobile {
    position: fixed;
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    max-height: 80vh;
    border-radius: 20px 20px 0 0;
    z-index: 96;
    transform: translateY(100%);
    transition: transform 0.3s ease;

    &.open { transform: translateY(0); }
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 2px;
}

.panel-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.agent-avatar {
  width: 38px;
  height: 38px;
  border-radius: 13px;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 10px 20px rgba(11, 183, 170, 0.22);
}

.panel-title {
  display: block;
  font-size: 0.875rem;
  font-weight: 800;
  color: #0f172a;
}

.panel-subtitle {
  font-size: 0.6875rem;
  color: #64748b;
}

.panel-close {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: #f3f4f6;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.panel-insight {
  padding: 0 16px;

  p {
    font-size: 0.8125rem;
    color: #334155;
    line-height: 1.6;
    margin: 0;
    padding: 12px 13px;
    background: linear-gradient(135deg, #ecfdfb, #f8fafc);
    border-radius: 13px;
    border: 1px solid rgba(11, 183, 170, 0.16);
    border-left: 3px solid #0bb7aa;
  }
}

.panel-quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 16px;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: var(--color-card-bg-secondary);
  font-size: 0.75rem;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: rgba(11, 183, 170, 0.32);
    color: #0a9e94;
    background: #ecfdfb;
  }
}

.panel-chat {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
  min-height: 130px;
  max-height: 240px;
}

.chat-messages {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chat-msg {
  &.user .msg-content {
    background: linear-gradient(135deg, #ecfdfb, #e0f2fe);
    border-radius: 12px 12px 4px 12px;
    color: #075985;
    margin-left: 24px;
  }

  &.agent .msg-content {
    background: #f8fafc;
    border-radius: 12px 12px 12px 4px;
    margin-right: 24px;
    border: 1px solid rgba(148, 163, 184, 0.14);
  }
}

.msg-content {
  padding: 8px 12px;
  font-size: 0.8125rem;
  line-height: 1.5;

  p { margin: 0; }
}

.msg-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.msg-action-btn {
  padding: 4px 12px;
  border-radius: 99px;
  border: 1px solid #e5e7eb;
  background: white;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;

  &.primary { background: #0bb7aa; border-color: transparent; color: white; }
  &.default:hover { border-color: #0bb7aa; color: #0a9e94; }
}

.chat-empty {
  padding: 20px 0;
  text-align: center;

  p { font-size: 0.8125rem; color: #9ca3af; margin: 0; }
}

.panel-input {
  display: flex;
  gap: 6px;
  padding: 2px 16px 16px;
}

.chat-input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  font-size: 0.8125rem;
  color: #334155;
  background: #f8fafc;
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: #0bb7aa;
    background: white;
    box-shadow: 0 0 0 3px rgba(11, 183, 170, 0.1);
  }
}

.chat-send {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.15s;

  &:disabled { opacity: 0.4; cursor: default; }
  &:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(11, 183, 170, 0.2);
  }
}

.panel-log {
  padding: 10px 16px 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.14);

  &.expanded {
    flex: 1 1 240px;
    min-height: 240px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}

.log-header-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 4px 2px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  &:hover { color: #0a9e94; }
}

.log-caret {
  flex-shrink: 0;
  transition: transform 0.2s;
}

.panel-log.expanded .log-caret { transform: rotate(90deg); }

.log-header-title {
  flex: 1;
  text-align: left;
}

.log-count-badge {
  font-size: 0.6875rem;
  font-weight: 700;
  color: #0bb7aa;
  background: #ecfdfb;
  padding: 1px 8px;
  border-radius: 99px;
  min-width: 20px;
  text-align: center;
  text-transform: none;
  letter-spacing: 0;
}

.log-expanded-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  margin-top: 8px;
}

// hide AgentActionLog's own title to avoid duplication with the toggle bar
.panel-log.expanded :deep(.log-title) { display: none; }

// shrink chat when the log is expanded so the log gets the bulk of the space
.agent-panel.log-expanded .panel-chat {
  flex: 0 1 110px;
  min-height: 80px;
  max-height: 150px;
}

@media (max-width: 1200px) {
  .space-agent-panel {
    width: 100%;
  }

  .agent-panel:not(.mobile) {
    width: 100%;
    position: static;
    max-height: none;
  }
}
</style>
