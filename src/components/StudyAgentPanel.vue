<template>
  <aside class="study-agent-panel" :class="{ collapsed: collapsed }">
    <!-- Agent header -->
    <div class="panel-top">
      <div class="agent-mini-header">
        <div class="agent-mini-avatar">
          <img :src="teacherAvatar" alt="学习伙伴" class="agent-mini-avatar-img" />
        </div>
        <span class="agent-mini-name">学习伙伴</span>
        <span class="agent-mini-status">在线</span>
        <button class="collapse-btn" @click="collapsed = !collapsed" title="收起面板" aria-label="收起学习伙伴面板">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <button class="trace-btn" @click="openTrace" title="查看 Agent 执行轨迹">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          轨迹
        </button>
      </div>
      <p class="agent-hint">点击下方按钮告诉 Agent 你的感受，或直接提问。Agent 会根据你的反馈调整讲解节奏。</p>
    </div>

    <!-- 教学继续按钮（教学暂停 + 非弹题时） -->
    <div class="teaching-continue-bar" v-if="stepStore.isTeachingPaused && !stepStore.quizState">
      <div class="continue-copy" v-if="isSegmentEndWaiting">
        <span class="continue-dot"></span>
        <span>本段讲解完成，准备好了点击继续。</span>
      </div>
      <button class="teaching-continue-btn" @click="stepStore.resumeTeaching()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polygon points="5,3 19,12 5,21"/></svg>
        {{ continueButtonLabel }}
      </button>
    </div>

    <!-- Feedback buttons grid -->
    <div class="feedback-grid">
      <button
        v-for="btn in feedbackButtons"
        :key="btn.type"
        class="feedback-btn"
        :class="btn.variant"
        @click="onFeedback(btn.type)"
        :disabled="stepStore.sendingFeedback"
      >
        <span class="fb-icon" v-html="btn.icon"></span>
        <span class="fb-label">{{ btn.label }}</span>
      </button>
    </div>

    <!-- Chat section -->
    <div class="chat-section">
      <div class="chat-messages" ref="chatEl">
        <div v-for="msg in stepStore.chatMessages" :key="msg.id" class="chat-msg" :class="msg.role">
          <template v-if="msg.role === 'agent' && msg.markdown">
            <div class="msg-bubble markdown-bubble">
              <MarkdownRenderer :content="msg.text" />
            </div>
          </template>
          <template v-else>
            <div class="msg-bubble">{{ msg.text }}</div>
          </template>
        </div>
        <div v-if="stepStore.sendingFeedback" class="chat-msg agent">
          <div class="msg-bubble typing">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Agent trace drawer -->
    <AgentTracePanel />
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import AgentTracePanel from '@/components/AgentTracePanel.vue'
import { useTaskStepStore } from '@/stores/taskStep'
import { useAgentStore } from '@/stores/agent'
import type { FeedbackType } from '@/types/study'
import teacherAvatar from '@/assets/teacher.png'

const collapsed = defineModel<boolean>('collapsed', { default: false })

const stepStore = useTaskStepStore()
const agentStore = useAgentStore()

const chatEl = ref<HTMLElement>()

const isSegmentEndWaiting = computed(() =>
  stepStore.timelineStatus === 'waiting_user'
  && stepStore.currentWaitReason === 'segment_end_check',
)

const continueButtonLabel = computed(() => {
  const flow = stepStore.currentTeachingFlow
  if (!flow) return '继续'
  if (flow.currentSegmentIndex >= flow.segments.length - 1) return '完成本步学习'
  return '继续讲解'
})

const feedbackButtons: { type: FeedbackType; label: string; variant: string; icon: string }[] = [
  { type: 'dont_understand', label: '没看懂', variant: 'default', icon: '<svg viewBox="0 0 1024 1024" width="16" height="16"><path d="M510.153444 63.611783c-246.955508 0-447.140807 200.185298-447.140807 447.139783 0 246.955508 200.185298 447.140807 447.140807 447.140807 246.955508 0 447.139783-200.185298 447.139783-447.140807C957.293227 263.797082 757.108952 63.611783 510.153444 63.611783zM510.153444 913.179009c-222.273363 0-402.426419-180.152033-402.426419-402.427442 0-222.272339 180.152033-402.426419 402.426419-402.426419 222.273363 0 402.425396 180.153056 402.425396 402.426419C912.57884 733.024929 732.426807 913.179009 510.153444 913.179009zM510.153444 667.251923c-24.682146 0-44.714388 20.032242-44.714388 44.713364 0 24.682146 20.032242 44.713364 44.714388 44.713364 24.681122 0 44.713364-20.031219 44.713364-44.713364C554.866808 687.284165 534.834566 667.251923 510.153444 667.251923zM510.153444 264.825504c-74.091462 0-134.14214 60.051701-134.14214 134.14214l44.713364 0c0-49.364291 40.019459-89.427752 89.428775-89.427752s89.428775 40.063461 89.428775 89.427752c0 49.364291-40.018436 89.428775-89.428775 89.428775-7.78122 0-15.158235-1.297552-22.358217-3.174296l0 114.960265c0 12.340049 10.017144 22.356171 22.358217 22.356171 12.340049 0 22.357194-10.016121 22.357194-22.356171l0-69.307506c63.404052-10.730389 111.783923-65.460898 111.783923-131.906216C644.29456 324.876182 584.242859 264.825504 510.153444 264.825504z" fill="currentColor"/></svg>' },
  { type: 'slower', label: '讲慢一点', variant: 'default', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>' },
  { type: 'another_example', label: '换个例子', variant: 'default', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="8" cy="18" r="1"/></svg>' },
  { type: 'draw_diagram', label: '画图解释', variant: 'default', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>' },
  { type: 'similar_question', label: '出类似题', variant: 'accent', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
  { type: 'already_mastered', label: '我已经会了', variant: 'success', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20,6 9,17 4,12"/></svg>' },
  { type: 'add_review', label: '加入复习', variant: 'warn', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>' },
  { type: 'skip', label: '跳过', variant: 'default', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19"/></svg>' },
]

async function onFeedback(type: FeedbackType) {
  await stepStore.sendFeedback(type)
  scrollBottom()
}

function openTrace() {
  agentStore.tracePanelVisible = true
}

function scrollBottom() {
  nextTick(() => {
    if (chatEl.value) chatEl.value.scrollTop = chatEl.value.scrollHeight
  })
}

watch(() => stepStore.chatMessages.length, scrollBottom)
</script>

<script lang="ts">
export default { name: 'StudyAgentPanel' }
</script>

<style scoped lang="scss">
.study-agent-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  width: 320px;
  flex-shrink: 0;
  background: var(--color-card-bg-secondary);
  backdrop-filter: blur(10px);
  border-left: 1px solid rgba(15, 23, 42, 0.06);
  overflow: hidden;
  transition: width 0.3s ease;

  &.collapsed {
    width: 0;
    border-left: none;
  }

  @media (max-width: 1024px) {
    width: 100% !important;
    border-left: none;
    border-top: 1px solid rgba(15, 23, 42, 0.06);
  }
}

.panel-top {
  padding: 16px 16px 6px;
}

.teaching-continue-bar {
  display: grid;
  gap: 8px;
  padding: 0 16px 8px;
}

.continue-copy {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(11, 183, 170, 0.16);
  background: rgba(240, 253, 250, 0.72);
  color: #0f766e;
  font-size: 12px;
  line-height: 1.45;
}

.continue-dot {
  width: 7px;
  height: 7px;
  margin-top: 5px;
  border-radius: 999px;
  background: #0bb7aa;
  animation: agentDotPulse 1s ease-in-out infinite;
  flex-shrink: 0;
}

.teaching-continue-btn {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 0;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(11, 183, 170, 0.25);
  transition: all 0.15s ease;
  animation: continuePulse 1.8s ease-in-out infinite;
  &:hover { transform: translateY(-1px); }
}

.agent-mini-header {
  display: flex;
  align-items: center;
  gap: 6px;

  .collapse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: 1px solid rgba(15, 23, 42, 0.08);
    background: #fff;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
    margin-left: auto;

    &:hover {
      border-color: #0bb7aa;
      color: #0bb7aa;
      background: rgba(11, 183, 170, 0.08);
    }
  }

  .trace-btn {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 3px 8px;
    border-radius: 6px;
    border: 1px solid rgba(15, 23, 42, 0.1);
    background: #fff;
    color: #64748b;
    font-size: 11px;
    cursor: pointer;
    &:hover { border-color: #0bb7aa; color: #0bb7aa; }
  }
}

.agent-mini-avatar {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  overflow: hidden;
}

.agent-mini-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
  display: block;
}

.agent-mini-name {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
}

.agent-mini-status {
  font-size: 10px;
  color: #10b981;
  &::before { content: '• '; }
}

.agent-hint {
  font-size: 12px;
  color: #64748b;
  margin: 8px 0 0;
  line-height: 1.5;
}

.feedback-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 4px 16px 8px;
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
  .fb-label { font-size: 12px; white-space: nowrap; }

  &:hover:not(:disabled) { border-color: #0bb7aa; background: rgba(11, 183, 170, 0.06); color: #0bb7aa; }

  &.accent { background: #ecfeff; border-color: #a5f3fc; color: #0e7490; &:hover:not(:disabled) { background: #cffafe; } }
  &.success { background: #ecfdf5; border-color: #a7f3d0; color: #047857; &:hover:not(:disabled) { background: #d1fae5; } }
  &.warn { background: #fef3c7; border-color: #fcd34d; color: #92400e; &:hover:not(:disabled) { background: #fef08a; } }
  &:disabled { opacity: 0.5; cursor: default; }
}

.chat-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 16px;
  min-height: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
}

.chat-msg {
  display: flex;

  &.user { justify-content: flex-end; }
  &.agent { justify-content: flex-start; }

  &.user .msg-bubble {
    background: linear-gradient(135deg, #0bb7aa, #0284c7);
    color: #fff;
    border-radius: 12px 12px 4px 12px;
    max-width: 85%;
  }
  &.agent .msg-bubble {
    background: #f1f5f9;
    color: #1e293b;
    border-radius: 12px 12px 12px 4px;
    max-width: 90%;
  }

  .msg-bubble.typing {
    display: inline-flex;
    gap: 3px;
    padding: 10px 12px;
    .dot {
      width: 5px; height: 5px;
      border-radius: 50%;
      background: #94a3b8;
      animation: typing 1.2s infinite ease-in-out;
      &:nth-child(2) { animation-delay: 0.15s; }
      &:nth-child(3) { animation-delay: 0.3s; }
    }
  }
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
  30% { transform: translateY(-4px); opacity: 1; }
}

.msg-bubble {
  padding: 7px 11px;
  font-size: 12px;
  line-height: 1.55;

  &.markdown-bubble {
    padding: 10px 12px;
    :deep(.markdown-renderer) {
      font-size: 12px;
      p { margin: 4px 0; }
      h1, h2, h3 { font-size: 13px; margin: 6px 0 4px; }
      pre { font-size: 11px; }
      code { font-size: 11px; }
    }
  }
}

</style>
