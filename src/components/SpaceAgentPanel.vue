<template>
  <aside class="agent-sidebar">
    <!-- Header -->
    <div class="as-header">
      <div class="as-avatar">
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
          <path d="M483.002182 188.043636h51.2v114.036364H483.002182z" fill="#40e3c2"/>
          <path d="M510.929455 143.825455m-128 0a128 128 0 1 0 256 0 128 128 0 1 0-256 0Z" fill="#40e3c2"/>
          <path d="M679.098182 301.963636c139.636364 13.963636 223.418182 79.127273 253.672727 197.818182 46.545455 179.2 34.909091 267.636364 32.581818 283.927273-2.327273 18.618182-30.254545 123.345455-160.581818 174.545454-83.781818 32.581818-172.218182 55.854545-293.236364 53.527273v-535.272727 535.272727c-116.363636 2.327273-204.8-18.618182-286.254545-48.872727l-9.309091-4.654546c-130.327273-53.527273-158.254545-158.254545-160.581818-174.545454-4.654545-16.290909-13.963636-104.727273 30.254545-283.927273 30.254545-118.690909 114.036364-186.181818 251.345455-200.145454 37.236364-2.327273 93.090909-6.981818 172.218182-6.981819h9.309091c74.472727 0 128 4.654545 160.581818 9.309091z" fill="#C5C5C5"/>
          <path d="M139.170909 723.2c0 2.327273 0 2.327273 0 0 0 4.654545 2.327273 6.981818 2.327273 9.309091 4.654545 9.309091 9.309091 16.290909 16.290909 25.6 18.618182 23.272727 46.545455 44.218182 83.781818 58.181818l4.654546 2.327273 4.654545 2.327273c53.527273 18.618182 107.054545 30.254545 165.236364 37.236363 58.181818 4.654545 123.345455 4.654545 183.854545 0 58.181818-4.654545 111.709091-18.618182 165.236364-37.236363l4.654545-2.327273c41.890909-13.963636 69.818182-34.909091 88.436364-60.509091 6.981818-9.309091 11.636364-18.618182 16.290909-25.6 0-2.327273 2.327273-4.654545 2.327273-6.981818v-2.327273c0-2.327273 0-6.981818 2.327272-11.636364v-2.327272-39.563637c-2.327273-44.218182-13.963636-97.745455-32.581818-162.909091-18.618182-74.472727-72.145455-111.709091-174.545454-121.018121-53.527273-4.654545-93.090909-6.981818-148.945455-6.981819H502.225455c-58.181818 0-97.745455 2.327273-155.927273 6.981819-102.4 9.309091-153.6 46.545455-174.545455 118.690909-18.618182 65.163636-27.927273 118.690909-32.581818 162.909091 0 16.290909-2.327273 30.254545 0 39.563636v16.290909z" fill="#14254E"/>
          <path d="M509.207273 695.272727c-27.927273 0-55.854545 11.636364-55.854546 20.945455s11.636364 39.563636 55.854546 39.563636c41.890909 0 51.2-23.272727 55.854545-39.563636 0-13.963636-27.927273-20.945455-55.854545-20.945455z" fill="#40E3C2"/>
          <path d="M295.936 578.373818a72.145455 53.527273 90 1 0 107.054545 0 72.145455 53.527273 90 1 0-107.054545 0Z" fill="#40E3C2"/>
          <path d="M617.099636 578.373818a72.145455 53.527273 90 1 0 107.054546 0 72.145455 53.527273 90 1 0-107.054546 0Z" fill="#40E3C2"/>
        </svg>
        <span class="as-status-dot"></span>
      </div>
      <div class="as-header-info">
        <span class="as-agent-name">Space Agent</span>
        <span class="as-agent-status">{{ contextLabel }}</span>
      </div>
    </div>

    <!-- Context-aware guidance -->
    <div class="as-context">
      <p class="as-context-text">{{ contextMessage }}</p>
    </div>

    <!-- Thinking flow -->
    <div class="as-section" v-if="decisionSteps && decisionSteps.length">
      <span class="as-section-label">Agent 思考</span>
      <div class="as-thinking-flow">
        <div
          v-for="(step, index) in decisionSteps"
          :key="step.label"
          class="as-thinking-step"
          :class="step.status"
          :style="{ '--thinking-delay': `${index * 95}ms` }"
        >
          <span class="as-thinking-dot"></span>
          <div>
            <strong>{{ step.label }}</strong>
            <em>{{ step.detail }}</em>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="as-section">
      <span class="as-section-label">快捷操作</span>
      <div class="as-quick-actions">
        <button
          v-for="q in currentQuickActions"
          :key="q.label"
          class="as-quick-btn"
          @click="$emit('quickAction', q.label)"
        >
          <span class="as-quick-icon" v-html="q.icon"></span>
          <span class="as-quick-label">{{ q.label }}</span>
        </button>
      </div>
    </div>

    <!-- Chat messages -->
    <div class="as-chat" ref="chatContainer">
      <span class="as-section-label">对话</span>
      <div class="as-chat-messages" v-if="messages.length">
        <div v-for="(msg, i) in messages" :key="i" class="as-chat-msg" :class="msg.role">
          <div class="as-msg-content">
            <p>{{ msg.text }}</p>
            <div class="as-msg-actions" v-if="msg.actions && msg.actions.length">
              <button
                v-for="act in msg.actions"
                :key="act.label"
                class="as-msg-action-btn"
                :class="act.variant || 'default'"
                @click="$emit('agentAction', act)"
              >
                {{ act.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="as-chat-empty" v-else>
        <p>按 <kbd>Ctrl K</kbd> 或在底部命令栏向 Agent 提问</p>
      </div>
    </div>

    <!-- Agent action log (collapsible) -->
    <div class="as-log" :class="{ expanded: logExpanded }" v-if="agentActions && agentActions.length">
      <button class="as-log-toggle" @click="logExpanded = !logExpanded">
        <svg class="as-log-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12">
          <polyline points="9 6 15 12 9 18"/>
        </svg>
        <span>Agent 操作日志</span>
        <span class="as-log-count">{{ agentActions.length }}</span>
      </button>
      <div class="as-log-body" v-show="logExpanded">
        <AgentActionLog :actions="agentActions" />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { AgentActionVO } from '@/types/learningSpace'
import AgentActionLog from './AgentActionLog.vue'

interface ChatMessage {
  role: 'user' | 'agent'
  text: string
  actions?: { label: string; variant?: string }[]
}

interface DecisionStep {
  label: string
  detail: string
  status: string
}

const props = defineProps<{
  spaceName?: string
  insight?: string
  agentActions?: AgentActionVO[]
  decisionSteps?: DecisionStep[]
  activeTab?: string
}>()

const emit = defineEmits<{
  quickAction: [label: string]
  agentAction: [action: { label: string; variant?: string }]
}>()

const messages = ref<ChatMessage[]>([])
const chatContainer = ref<HTMLElement>()
const logExpanded = ref(false)

// Context-aware content
const contextLabel = computed(() => {
  const labels: Record<string, string> = {
    today: '正在分析今日任务',
    plan: '正在审视学习计划',
    path: '正在跟踪学习路径',
    resources: '正在匹配学习资源',
    records: '正在回顾学习记录',
    insight: '正在洞察学习数据',
  }
  return labels[props.activeTab || ''] || '在线 · 守护学习中'
})

const contextMessage = computed(() => {
  const messages: Record<string, string> = {
    today: '当前是今日任务视图。我根据你的薄弱点和进度安排了这些任务，优先处理标记为"高优"的项。',
    plan: '这是你的个性化学习计划。我会根据你的掌握度动态调整每个阶段的节奏。',
    path: '这是你的知识学习路径。绿色节点已掌握，带⚠标记的节点需要重点关注。',
    resources: '我根据你的学习进度推荐这些资源。点击"生成资源包"可让 Agent 为你定制学习材料。',
    records: '这是你的学习记录。连续学习是提升效果的关键，保持当前节奏。',
    insight: '这是你的学情洞察报告。我通过分析你的学习行为、测评结果和专注度变化来生成这些建议。',
  }
  return messages[props.activeTab || ''] || messages.today
})

const baseQuickActions = [
  { label: '薄弱分析', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' },
  { label: '调整计划', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>' },
  { label: '生成测试', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
  { label: '推荐资源', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
]

const tabQuickActions: Record<string, typeof baseQuickActions> = {
  today: [
    { label: '调整今日安排', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>' },
    { label: '薄弱分析', icon: baseQuickActions[0].icon },
    { label: '生成测试', icon: baseQuickActions[2].icon },
    { label: '调整计划', icon: baseQuickActions[1].icon },
  ],
  plan: [
    { label: '调整计划', icon: baseQuickActions[1].icon },
    { label: '查看路径', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' },
    { label: '薄弱分析', icon: baseQuickActions[0].icon },
    { label: '推荐资源', icon: baseQuickActions[3].icon },
  ],
  path: [
    { label: '节点详情', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' },
    { label: '生成脚本', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>' },
    { label: '薄弱分析', icon: baseQuickActions[0].icon },
    { label: '推荐资源', icon: baseQuickActions[3].icon },
  ],
  resources: [
    { label: '生成资源包', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' },
    { label: '推荐资源', icon: baseQuickActions[3].icon },
    { label: '生成测试', icon: baseQuickActions[2].icon },
    { label: '薄弱分析', icon: baseQuickActions[0].icon },
  ],
  records: [
    { label: '薄弱分析', icon: baseQuickActions[0].icon },
    { label: '调整计划', icon: baseQuickActions[1].icon },
    { label: '生成测试', icon: baseQuickActions[2].icon },
    { label: '推荐资源', icon: baseQuickActions[3].icon },
  ],
  insight: [
    { label: '调整计划', icon: baseQuickActions[1].icon },
    { label: '薄弱分析', icon: baseQuickActions[0].icon },
    { label: '生成测试', icon: baseQuickActions[2].icon },
    { label: '推荐资源', icon: baseQuickActions[3].icon },
  ],
}

const currentQuickActions = computed(() => {
  return tabQuickActions[props.activeTab || ''] || tabQuickActions.today
})

function mockAgentResponse(question: string): string {
  if (question.includes('薄弱')) return '根据最近的学习记录，你在**洛必达法则适用条件**上错误率较高（正确率42%），其次是**无穷小阶数比较**。建议优先完成洛必达法则专项练习。'
  if (question.includes('测试') || question.includes('题')) return '已为你生成10道极限与连续的综合测试题，涵盖洛必达法则、极限运算、连续性判定。'
  if (question.includes('计划') || question.includes('安排')) return '建议将今天的任务调整为：1.洛必达法则专项练习（25分钟）2.连续与间断预习（20分钟）。当前空间进度正常。'
  if (question.includes('资源') || question.includes('导图') || question.includes('资料')) return '为你推荐3项资源：1.洛必达法则思维导图 2.无穷小阶数比较图解 3.B站相关讲解视频。需要我生成资源包吗？'
  return '收到你的问题。我会结合学习数据和你的个人画像给出针对性建议。'
}

function receiveMessage(text: string) {
  messages.value.push({ role: 'user', text })
  emit('sendMessage', text)

  setTimeout(() => {
    messages.value.push({
      role: 'agent',
      text: mockAgentResponse(text),
      actions: text.includes('薄弱') || text.includes('错题')
        ? [{ label: '开始练习', variant: 'primary' }, { label: '查看报告', variant: 'default' }]
        : text.includes('测试') || text.includes('题')
          ? [{ label: '开始测试', variant: 'primary' }]
          : text.includes('计划') || text.includes('安排')
            ? [{ label: '查看计划', variant: 'primary' }, { label: '调整任务', variant: 'default' }]
            : text.includes('资源') || text.includes('资料') || text.includes('导图')
              ? [{ label: '生成资源', variant: 'primary' }]
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

// Watch activeTab to reset context message display
watch(() => props.activeTab, () => {
  // messages stay - they're the conversation history
})

defineExpose({
  receiveMessage,
})
</script>

<style scoped lang="scss">
.agent-sidebar {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: calc(100vh - 120px);
  position: sticky;
  top: 100px;
  padding: 16px;
  background: var(--color-card-bg);
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

/* ===== Header ===== */
.as-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.as-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 13px;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 10px 20px rgba(11, 183, 170, 0.22);
  flex-shrink: 0;
}

.as-status-dot {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid white;
}

.as-header-info {
  min-width: 0;
}

.as-agent-name {
  display: block;
  font-size: 0.9rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.3;
}

.as-agent-status {
  font-size: 0.7rem;
  color: #64748b;
}

/* ===== Context Message ===== */
.as-context {
  padding: 12px 13px;
  background: linear-gradient(135deg, #ecfdfb, #f0f9ff);
  border-radius: 13px;
  border: 1px solid rgba(11, 183, 170, 0.16);
  border-left: 3px solid #0bb7aa;
}

.as-context-text {
  margin: 0;
  font-size: 0.78rem;
  color: #334155;
  line-height: 1.6;
}

/* ===== Section Label ===== */
.as-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.as-section-label {
  font-size: 0.68rem;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* ===== Thinking Flow ===== */
.as-thinking-flow {
  display: grid;
  gap: 6px;
}

.as-thinking-step {
  position: relative;
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr);
  gap: 8px;
  align-items: flex-start;
  padding: 7px 10px;
  border-radius: 11px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.12);
  animation: thinkingStepIn 0.38s ease both;
  animation-delay: var(--thinking-delay);

  strong {
    display: block;
    color: #0f172a;
    font-size: 0.72rem;
    line-height: 1.3;
  }

  em {
    display: -webkit-box;
    margin-top: 2px;
    overflow: hidden;
    color: #64748b;
    font-size: 0.64rem;
    font-style: normal;
    line-height: 1.3;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  &.active {
    background: linear-gradient(135deg, #ecfdfb, #f0f9ff);
    border-color: rgba(11, 183, 170, 0.22);
  }

  &.warn .as-thinking-dot {
    background: #f59e0b;
    box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.12);
  }

  &.pending {
    opacity: 0.65;
  }
}

.as-thinking-dot {
  width: 9px;
  height: 9px;
  margin-top: 3px;
  border-radius: 50%;
  background: #0bb7aa;
  box-shadow: 0 0 0 4px rgba(11, 183, 170, 0.12);
  flex-shrink: 0;
}

@keyframes thinkingStepIn {
  from { opacity: 0; transform: translateX(8px); }
  to { opacity: 1; transform: translateX(0); }
}

/* ===== Quick Actions ===== */
.as-quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.as-quick-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 10px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: var(--color-card-bg-secondary);
  cursor: pointer;
  transition: all 0.18s ease;
  text-align: left;

  &:hover {
    border-color: rgba(11, 183, 170, 0.3);
    background: #ecfdfb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(11, 183, 170, 0.08);
  }
}

.as-quick-icon {
  display: flex;
  align-items: center;
  color: #0a9e94;
  flex-shrink: 0;
}

.as-quick-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== Chat ===== */
.as-chat {
  flex: 1;
  overflow-y: auto;
  min-height: 100px;
  max-height: 200px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.as-chat-messages {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.as-chat-msg {
  &.user .as-msg-content {
    background: linear-gradient(135deg, #ecfdfb, #e0f2fe);
    border-radius: 12px 12px 4px 12px;
    color: #075985;
    margin-left: 20px;
  }

  &.agent .as-msg-content {
    background: #f8fafc;
    border-radius: 12px 12px 12px 4px;
    margin-right: 20px;
    border: 1px solid rgba(148, 163, 184, 0.12);
  }
}

.as-msg-content {
  padding: 7px 11px;
  font-size: 0.78rem;
  line-height: 1.5;

  p { margin: 0; }
}

.as-msg-actions {
  display: flex;
  gap: 5px;
  margin-top: 7px;
  flex-wrap: wrap;
}

.as-msg-action-btn {
  padding: 3px 10px;
  border-radius: 99px;
  border: 1px solid #e5e7eb;
  background: white;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &.primary {
    background: #0bb7aa;
    border-color: transparent;
    color: white;
    &:hover { opacity: 0.9; }
  }

  &.default:hover {
    border-color: #0bb7aa;
    color: #0a9e94;
  }
}

.as-chat-empty {
  padding: 12px 0;
  text-align: center;

  p {
    font-size: 0.75rem;
    color: #9ca3af;
    margin: 0;
  }
}

/* ===== Action Log ===== */
.as-log {
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  padding-top: 8px;

  &.expanded {
    flex: 1 1 200px;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}

.as-log-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  padding: 3px 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  span { flex: 1; text-align: left; }

  &:hover { color: #0a9e94; }
}

.as-log-caret {
  flex-shrink: 0;
  transition: transform 0.2s;
}

.as-log.expanded .as-log-caret { transform: rotate(90deg); }

.as-log-count {
  font-size: 0.65rem;
  font-weight: 700;
  color: #0bb7aa;
  background: #ecfdfb;
  padding: 1px 7px;
  border-radius: 99px;
  text-transform: none;
  letter-spacing: 0;
}

.as-log-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  margin-top: 6px;
}

.as-log.expanded :deep(.log-title) { display: none; }

// Shrink chat when log expanded
.agent-sidebar:has(.as-log.expanded) .as-chat {
  flex: 0 1 90px;
  min-height: 70px;
  max-height: 120px;
}
</style>
