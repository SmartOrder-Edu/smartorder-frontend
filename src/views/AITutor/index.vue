<template>
  <AppLayout>
    <div class="ai-tutor-page">
      <!-- 对话上下文选择器 -->
      <div class="context-switcher">
        <span class="context-label">当前对话范围：</span>
        <div class="context-chips">
          <button
            v-for="ctx in contextOptions"
            :key="ctx.id"
            class="context-chip"
            :class="{ active: activeContext === ctx.id }"
            @click="switchContext(ctx.id)"
          >
            <span class="chip-dot" :style="{ background: ctx.color }"></span>
            {{ ctx.label }}
          </button>
        </div>
      </div>

      <div class="tutor-container">
        <!-- 左侧：历史会话侧边栏 -->
        <aside class="history-sidebar" :class="{ open: historySidebarOpen }">
          <div class="history-sidebar-header">
            <span class="history-sidebar-title">对话历史</span>
            <button class="new-chat-btn-sidebar" @click="handleNewChat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              新对话
            </button>
          </div>
          <div class="history-sidebar-list">
            <div class="history-loading" v-if="agentStore.conversationsLoading">加载中...</div>
            <div class="history-empty" v-else-if="agentStore.conversations.length === 0">
              <p class="empty-text">暂无对话记录</p>
              <p class="empty-hint">发送一条消息开始对话</p>
            </div>
            <div
              v-for="conv in agentStore.conversations"
              :key="conv.conversationId"
              class="history-item"
              :class="{ active: conv.conversationId === agentStore.currentConversationId }"
              @click="loadConversationFromSidebar(conv)"
            >
              <div class="history-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div class="history-info">
                <span class="history-title">{{ conv.title || '未命名对话' }}</span>
                <span class="history-date">{{ formatDate(conv.lastActiveTime) }}</span>
              </div>
              <span class="history-count" v-if="conv.messageCount > 0">{{ conv.messageCount }}</span>
            </div>
          </div>
        </aside>

        <!-- 聊天区域 -->
        <main class="chat-area">
          <div class="chat-area-top-bar">
            <button class="history-toggle-btn" @click="historySidebarOpen = !historySidebarOpen" :title="historySidebarOpen ? '收起历史' : '展开历史'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span class="current-conv-title" v-if="currentConvTitle">{{ currentConvTitle }}</span>
          </div>
          <div class="chat-messages" ref="chatContainer" v-loading="loadingHistory">
            <!-- 欢迎消息 -->
            <div class="welcome-message" v-if="messages.length === 0 && !agentStore.loading">
              <div class="welcome-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </div>
              <div class="welcome-content">
                <h3>{{ greetingText }}</h3>
                <p class="welcome-summary">
                  我正在管理你的 <strong>{{ learningSpaceCount }} 个学习空间</strong>。今天你预计可用 <strong>{{ todayAvailableHours }}</strong>。
                  {{ todayFocusText }}
                </p>
                <div class="welcome-features">
                  <div class="feature-item" v-for="f in welcomeFeatures" :key="f.label" @click="sendQuickMessage(f.label)">
                    <span class="feature-icon" v-html="f.icon"></span>
                    <span>{{ f.label }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 消息列表 -->
            <div
              v-for="(msg, index) in messages"
              :key="index"
              class="message-wrapper"
              :class="msg.role"
            >
              <div class="message-avatar">
                <svg v-if="msg.role === 'ai'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div class="message-content">
                <div class="message-bubble" :class="{ 'user-bubble': msg.role === 'user' }">
                  <!-- 思考与工具调用交错展示 -->
                  <template v-if="msg.role === 'ai' && msg.reasoningSegments?.length">
                    <template v-for="(seg, segIdx) in msg.reasoningSegments" :key="'seg-' + segIdx">
                      <ThinkingBlock v-if="seg.thinkingText" :text="seg.thinkingText" />
                      <ToolCallCard v-if="seg.toolCall" v-bind="seg.toolCall" />
                    </template>
                  </template>
                  <template v-else>
                    <!-- 向后兼容：旧消息格式 -->
                    <ThinkingBlock
                      v-if="msg.role === 'ai' && msg.thinkingText"
                      :text="msg.thinkingText"
                      :duration-ms="msg.thinkingDurationMs"
                    />
                    <div v-if="msg.role === 'ai' && msg.toolCalls?.length" class="inline-tool-calls">
                      <ToolCallCard
                        v-for="tc in msg.toolCalls"
                        :key="tc.toolName + tc.startedAt"
                        v-bind="tc"
                      />
                    </div>
                  </template>
                  <!-- AI 消息使用 Markdown 渲染 -->
                  <MarkdownRenderer v-if="msg.role === 'ai'" :content="msg.content" />
                  <p v-else class="message-text">{{ msg.content }}</p>

                  <!-- 资源卡片 -->
                  <div v-if="msg.resources" class="message-resources">
                    <div
                      v-for="res in msg.resources"
                      :key="res.title"
                      class="resource-card-mini"
                    >
                      <span class="res-icon">{{ res.type }}</span>
                      <div class="res-info">
                        <span class="res-title">{{ res.title }}</span>
                        <span class="res-meta">{{ res.minutes }}分钟</span>
                      </div>
                      <button class="res-open-btn">打开</button>
                    </div>
                  </div>

                  <!-- 代码块（向后兼容旧数据结构） -->
                  <pre v-if="msg.code" class="message-code"><code>{{ msg.code }}</code></pre>
                </div>

                <!-- 操作按钮 -->
                <div class="message-actions" v-if="msg.role === 'ai'">
                  <button class="msg-action-btn" @click="copyMessage(msg.content)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    {{ copiedIndex === index ? '已复制' : '复制' }}
                  </button>
                  <button
                    class="msg-action-btn trace-btn"
                    v-if="msg.traceId && hasTraceEventsForMsg(msg)"
                    @click="openMsgTrace(msg)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                      <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
                    </svg>
                    查看详细执行过程
                  </button>
                </div>

                <!-- 计划创建卡片 -->
                <PlanCreatedCard v-if="msg.planSummary" :plan="msg.planSummary" />
                <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
              </div>
            </div>

            <!-- 流式加载指示器 -->
            <div class="message-wrapper ai loading-wrapper" v-if="agentStore.loading">
              <div class="message-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </div>
              <div class="message-content">
                <div class="message-bubble">
                  <!-- 思考与工具调用交错展示（流式） -->
                  <template v-if="agentStore.reasoningSegments.length">
                    <template v-for="(seg, segIdx) in agentStore.reasoningSegments" :key="'seg-live-' + segIdx">
                      <ThinkingBlock
                        v-if="seg.thinkingText"
                        :text="seg.thinkingText"
                        :streaming="seg.thinkingStreaming"
                      />
                      <ToolCallCard v-if="seg.toolCall" v-bind="seg.toolCall" />
                    </template>
                  </template>
                  <template v-else>
                    <!-- 向后兼容：无 think 事件的引擎 -->
                    <ThinkingBlock
                      v-if="agentStore.thinkingText"
                      :text="agentStore.thinkingText"
                      :streaming="true"
                    />
                    <div v-if="agentStore.toolCalls.length" class="inline-tool-calls">
                      <ToolCallCard
                        v-for="tc in agentStore.toolCalls"
                        :key="tc.toolName + tc.startedAt"
                        v-bind="tc"
                      />
                    </div>
                  </template>
                  <!-- 回答内容（流式） -->
                  <MarkdownRenderer v-if="agentStore.answerText" :content="agentStore.answerText" />
                  <span class="streaming-cursor" v-if="agentStore.answerText"></span>
                  <!-- 仅有 loading dots 的情况（还没有任何思考/工具/回答） -->
                  <div v-if="!agentStore.reasoningSegments.length && !agentStore.thinkingText && !agentStore.toolCalls.length && !agentStore.answerText" class="loading-dots">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部输入 -->
          <div class="chat-input-area">
            <div class="input-composer">
              <div class="composer-toolbar">
                <button class="toolbar-btn" @click="handleUploadClick" title="上传文件（即将上线）">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                  <span>上传</span>
                </button>
                <button class="toolbar-btn" @click="handleContextClick" title="设置上下文（即将上线）">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                  <span>上下文</span>
                </button>
              </div>
              <div class="composer-body">
                <textarea
                  v-model="inputMessage"
                  placeholder="输入你的问题，AI 会结合你的学习画像给出个性化回答…"
                  rows="1"
                  @keydown.enter.exact.prevent="sendMessage"
                  @keydown.enter.shift.exact.stop
                  @input="autoResize"
                  ref="inputRef"
                ></textarea>
                <div class="composer-actions">
                  <button
                    v-if="agentStore.loading"
                    class="action-btn stop-action"
                    @click="handleStopGeneration"
                    title="停止生成"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <rect x="6" y="6" width="12" height="12" rx="2"/>
                    </svg>
                  </button>
                  <button v-else class="action-btn send-action" :class="{ active: inputMessage.trim() }" :disabled="!inputMessage.trim()" @click="sendMessage">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22,2 15,22 11,13 2,9"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="composer-footer">
                <span class="footer-tip">Enter 发送 · Shift+Enter 换行</span>
                <div class="footer-hints">
                  <span
                    v-for="hint in quickHints"
                    :key="hint"
                    class="hint-chip"
                    @click="sendQuickMessage(hint)"
                  >
                    {{ hint }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>

        <!-- 右侧：快捷工具 -->
        <aside class="tutor-sidebar">
          <div class="sidebar-section">
            <h3 class="section-title">快捷工具</h3>
            <div class="tools-grid">
              <button
                v-for="tool in quickTools"
                :key="tool.id"
                class="tool-card"
                @click="sendQuickMessage(tool.prompt)"
              >
                <span class="tool-icon" v-html="tool.icon"></span>
                <span class="tool-label">{{ tool.label }}</span>
                <span class="tool-desc">{{ tool.desc }}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
      <!-- 移动端历史侧边栏遮罩 -->
      <div class="history-overlay" v-if="historySidebarOpen && isMobile" @click="historySidebarOpen = false"></div>
    </div>
    <!-- 追踪面板（抽屉式） -->
    <AgentTracePanel />

    <!-- 学习蓝图揭幕面板 -->
    <PlanRevealOverlay
      :visible="agentStore.planDialogVisible"
      :plan="agentStore.currentPlan"
      :draft-id="agentStore.currentDraftId"
      :loading="agentStore.planConfirmLoading"
      :execution-steps="agentStore.executionSteps"
      @confirm="confirmPlan"
      @cancel="cancelPlan"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useAgentChat } from '@/composables/useAgentChat'
import { useAgentStore } from '@/stores/agent'
import type { ConversationVO } from '@/api/agent'
import { agentApi } from '@/api/agent'
import type { AgentTraceEvent } from '@/stores/agent'
import PlanCreatedCard from '@/components/agent/PlanCreatedCard.vue'
import ThinkingBlock from '@/components/agent/ThinkingBlock.vue'
import ToolCallCard from '@/components/agent/ToolCallCard.vue'
import AgentTracePanel from '@/components/AgentTracePanel.vue'
import PlanRevealOverlay from '@/components/plan/PlanRevealOverlay.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import { useWindowSize } from '@/composables/useWindowSize'

const userStore = useUserStore()
const agentStore = useAgentStore()

const inputMessage = ref('')
const chatContainer = ref<HTMLElement>()
const inputRef = ref<HTMLTextAreaElement>()
const activeContext = ref('global')
const historySidebarOpen = ref(false)
const copiedIndex = ref<number | null>(null)

const { width: windowWidth } = useWindowSize()
const isMobile = computed(() => windowWidth.value < 768)

const currentConvTitle = computed(() => {
  if (!agentStore.currentConversationId) return ''
  const conv = agentStore.conversations.find(
    c => c.conversationId === agentStore.currentConversationId
  )
  return conv?.title || ''
})

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

const {
  messages,
  loadingHistory,
  sendMessage: agentSend,
  stopGeneration,
  confirmPlan,
  cancelPlan,
  loadConversation,
  startNewConversation,
  clearMessages: agentClear
} = useAgentChat(scrollToBottom)

const contextOptions = ref([
  { id: 'global', label: '全局学习', color: '#6b7280' },
  { id: 'math', label: '高等数学', color: '#3b82f6' },
  { id: 'english', label: '英语四级', color: '#10b981' },
  { id: 'se', label: '软件工程', color: '#f59e0b' },
  { id: 'os', label: '操作系统', color: '#8b5cf6' }
])

const switchContext = (ctxId: string) => {
  activeContext.value = ctxId
  const ctx = contextOptions.value.find(c => c.id === ctxId)
  if (ctxId === 'global') {
    ElMessage.success('已切换到全局学习上下文。总 Agent 将为你统筹所有学习空间。')
  } else if (ctx) {
    ElMessage.success(`已切换到"${ctx.label}"学习空间。空间 Agent 将专注于该领域的解答。`)
  }
}

const greetingText = computed(() => {
  const hour = new Date().getHours()
  const name = userStore.userName || '同学'
  let timeGreeting = ''
  if (hour < 6) timeGreeting = '夜深了'
  else if (hour < 12) timeGreeting = '早上好'
  else if (hour < 14) timeGreeting = '中午好'
  else if (hour < 18) timeGreeting = '下午好'
  else timeGreeting = '晚上好'
  return `${timeGreeting}，${name}。我是你的 AI 学习伙伴`
})

// 动态欢迎数据（后续接入 API 后可实时更新）
const learningSpaceCount = computed(() => {
  // TODO: 从 learningSpace store 获取真实数量
  return 4
})
const todayAvailableHours = computed(() => {
  // TODO: 从每日计划 API 获取真实数据
  return '2小时30分钟'
})
const todayFocusText = computed(() => {
  // TODO: 从学习计划 API 获取真实重点
  return '高等数学和软件工程今天是重点，操作系统昨天已完成复习可以暂缓。'
})

const welcomeFeatures = [
  {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    label: '解释知识点'
  },
  {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    label: '生成练习题'
  },
  {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="5" r="2"/><line x1="12" y1="9" x2="12" y2="3"/></svg>',
    label: '生成思维导图'
  },
  {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>',
    label: '整理学习笔记'
  },
  {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    label: '分析薄弱点'
  }
]

const quickHints = [
  '帮我制定一个学习计划',
  '我今天应该重点学什么？',
  '生成一组洛必达法则的练习题',
  '软件工程项目帮我拆一下任务',
  '帮我分析最近的薄弱点'
]

const quickTools = [
  {
    id: 1,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    label: '知识讲解',
    desc: '深入讲解概念',
    prompt: '请详细讲解进程和线程的区别，包括它们的定义、特点、优缺点和使用场景'
  },
  {
    id: 2,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    label: '生成练习',
    desc: '针对薄弱点',
    prompt: '请根据我的学习记录，生成10道关于进程同步与互斥的专项练习题'
  },
  {
    id: 3,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="5" r="2"/><line x1="12" y1="9" x2="12" y2="3"/></svg>',
    label: '思维导图',
    desc: '知识可视化',
    prompt: '请为我生成一份"操作系统进程管理"的知识思维导图'
  },
  {
    id: 4,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>',
    label: '整理笔记',
    desc: '自动归纳',
    prompt: '请根据我们之前的对话，帮我整理一份"线程同步"的学习笔记'
  },
  {
    id: 5,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    label: '薄弱分析',
    desc: '智能诊断',
    prompt: '分析我在"进程同步与互斥"这个章节的薄弱点，给出针对性的学习建议'
  },
  {
    id: 6,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>',
    label: '代码示例',
    desc: '代码辅助',
    prompt: '请给我一个用Python实现哲学家就餐问题的代码示例，并加上详细注释'
  }
]

const autoResize = () => {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
    inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 160) + 'px'
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || agentStore.loading) return
  const msg = inputMessage.value
  inputMessage.value = ''
  await agentSend(msg)
}

const sendQuickMessage = (msg: string) => {
  inputMessage.value = msg
  sendMessage()
}

const handleNewChat = async () => {
  startNewConversation()
  await agentStore.fetchConversations()
}

const handleStopGeneration = () => {
  stopGeneration()
}

const handleUploadClick = () => {
  ElMessage.info('文件上传功能即将上线，敬请期待')
}

const handleContextClick = () => {
  ElMessage.info('上下文设置功能即将上线，敬请期待')
}

const formatTime = (ts: number) => {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (isoString: string) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  if (diffHour < 24) return `${diffHour}小时前`
  if (diffDay < 7) return `${diffDay}天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const copyMessage = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    // 找到当前 AI 消息的索引
    const idx = messages.value.findLastIndex(m => m.role === 'ai' && m.content === content)
    copiedIndex.value = idx
    setTimeout(() => { copiedIndex.value = null }, 2000)
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

const loadConversationFromSidebar = async (conv: ConversationVO) => {
  await loadConversation(conv.conversationId)
  if (isMobile.value) {
    historySidebarOpen.value = false
  }
}

const hasTraceEventsForMsg = (msg: any): boolean => {
  return !!(msg.traceEvents?.length) || !!msg.traceId
}

const openMsgTrace = async (msg: any) => {
  if (msg.traceEvents?.length) {
    agentStore.traceEvents = injectThinkEventIfMissing(msg.traceEvents, msg.thinkingText)
  } else if (msg.traceId) {
    try {
      const rawEvents: any[] = await agentApi.getTraceEvents(msg.traceId)
      // 标准化后端实体格式 → 前端 AgentTraceEvent 格式
      const normalized = (rawEvents || []).map((raw: any) => {
        let payload = raw.payload
        if (typeof payload === 'string') {
          try { payload = JSON.parse(payload) } catch { /* keep as string */ }
        }
        return {
          traceId: raw.traceId || '',
          conversationId: raw.conversationId || '',
          userId: raw.userId || 0,
          mode: raw.agentMode || raw.mode || '',
          eventType: raw.eventType || '',
          seq: raw.sequenceNum || raw.seq || 0,
          timestamp: raw.createTime ? new Date(raw.createTime).getTime() : (raw.timestamp || Date.now()),
          payload,
        }
      })
      const enriched = injectThinkEventIfMissing(normalized, msg.thinkingText)
      agentStore.traceEvents = enriched
      msg.traceEvents = enriched // 缓存（含合成 think 事件）
    } catch (e) {
      console.error('[AITutor] 获取 trace 失败:', e)
      agentStore.traceEvents = []
    }
  }
  agentStore.openTracePanel(msg.traceId)
}

/**
 * 历史 trace 中缺少 agent.think.delta（后端不持久化高频 delta 事件），
 * 导致抽屉时间线缺少"思考"节点。用 reasoningContent 合成一条虚拟事件补上。
 */
function injectThinkEventIfMissing(
  events: AgentTraceEvent[],
  thinkingText?: string,
): AgentTraceEvent[] {
  if (!thinkingText || events.length === 0) return events
  const hasThinkDelta = events.some(e => e.eventType === 'agent.think.delta')
  if (hasThinkDelta) return events

  const minSeq = Math.min(...events.map(e => e.seq))
  const ref = events[0]
  const synthetic: AgentTraceEvent = {
    traceId: ref.traceId,
    conversationId: ref.conversationId,
    userId: ref.userId,
    mode: ref.mode,
    eventType: 'agent.think.delta',
    seq: Math.max(0, minSeq - 1),
    timestamp: ref.timestamp,
    payload: { text: thinkingText },
  }
  return [synthetic, ...events]
}

onMounted(() => {
  agentStore.fetchConversations()
  if (window.innerWidth < 768) {
    historySidebarOpen.value = false
  }
})

watch(windowWidth, (newWidth) => {
  if (newWidth < 768) {
    historySidebarOpen.value = false
  }
})
</script>

<style scoped>
.ai-tutor-page {
  max-width: 1680px;
  display: flex;
  flex-direction: column;
  height: 100vh;
  margin: calc(var(--spacing-xl) * -1) calc(var(--spacing-2xl) * -1) calc(var(--spacing-xl) * -1);
  padding: var(--spacing-xs) var(--spacing-2xl) 0;
}

/* 上下文选择器 */
.context-switcher {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-lg);
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
}

.context-label {
  font-size: 0.6875rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.context-chips {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.context-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-light);
  background: white;
  font-size: 0.6875rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);

  .chip-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

  &:hover { border-color: var(--primary-color); color: var(--primary-color); }

  &.active {
    background: rgba(59, 91, 219, 0.08);
    border-color: var(--primary-color);
    color: var(--primary-color);
    font-weight: 600;
  }
}

.tutor-container {
  display: grid;
  grid-template-columns: auto 1fr 280px;
  gap: var(--spacing-md);
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 历史会话侧边栏 */
.history-sidebar {
  width: 0;
  overflow: hidden;
  opacity: 0;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.2s ease;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-light);
}

.history-sidebar.open {
  width: 260px;
  opacity: 1;
  overflow: hidden;
}

.history-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-md) var(--spacing-sm);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}

.history-sidebar-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-dark);
}

.new-chat-btn-sidebar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--primary-color);
  background: rgba(59, 91, 219, 0.06);
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--primary-color);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.new-chat-btn-sidebar:hover {
  background: rgba(59, 91, 219, 0.12);
}

.history-sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-xs);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 聊天区域 */
.chat-area {
  background: white;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.chat-area-top-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
  background: white;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

.history-toggle-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: transparent;
  border: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--text-secondary);
}

.history-toggle-btn:hover {
  background: var(--background-color-base);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.history-toggle-btn svg { width: 16px; height: 16px; }

.current-conv-title {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-dark);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* 欢迎消息 */
.welcome-message {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, rgba(59, 91, 219, 0.04), rgba(18, 184, 134, 0.04));
  border-radius: var(--radius-xl);
}

.welcome-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.welcome-avatar svg {
  width: 24px;
  height: 24px;
  color: white;
  stroke-width: 2;
}

.welcome-content h3 {
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0 0 4px;
  color: var(--text-dark);
}

.welcome-content p {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-sm);
}

.welcome-summary {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: var(--spacing-sm) 0 var(--spacing-lg);
  strong { color: var(--text-dark); font-weight: 600; }
}

.welcome-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-xs);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px var(--spacing-sm);
  background: white;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 0.75rem;
  color: var(--text-dark);
  border: 1px solid var(--border-light);
}

.feature-item:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

.feature-icon { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; }
.feature-icon :deep(svg) { width: 100%; height: 100%; }

/* 消息 */
.message-wrapper {
  display: flex;
  gap: var(--spacing-md);
  animation: fadeInUp 0.3s ease;
}

.message-wrapper.user { flex-direction: row-reverse; }

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--primary-color);
}

.message-avatar svg { width: 20px; height: 20px; stroke-width: 2; }

.message-wrapper.user .message-avatar { background: rgba(59, 91, 219, 0.15); }

.message-content {
  max-width: 85%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.message-bubble {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-xl);
  font-size: 0.9375rem;
}

.message-wrapper.ai .message-bubble {
  background: var(--background-color-base);
  border-bottom-left-radius: 4px;
}

.user-bubble {
  background: linear-gradient(135deg, #3b5bdb, #5c7cfa);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-text {
  white-space: pre-wrap;
  margin: 0;
}

/* 流式光标 */
.streaming-cursor {
  display: inline-block;
  width: 8px;
  height: 16px;
  background: var(--primary-color);
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: blink 0.8s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.message-resources {
  margin-top: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.resource-card-mini {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}

.res-icon { font-size: 1rem; }
.res-info { flex: 1; display: flex; flex-direction: column; }
.res-title { font-size: 0.8125rem; color: var(--text-dark); }
.res-meta { font-size: 0.625rem; color: var(--text-muted); }

.res-open-btn {
  padding: 2px 8px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.625rem;
  cursor: pointer;
}

.message-code {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: #1e1e1e;
  border-radius: var(--radius-lg);
  overflow-x: auto;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 0.8125rem;
  line-height: 1.6;
}

.message-code code { color: #d4d4d4; white-space: pre; }

.message-actions {
  display: flex;
  gap: var(--spacing-sm);
  padding-left: var(--spacing-sm);
}

.msg-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: transparent;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 0.625rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.msg-action-btn:hover {
  background: var(--background-color-base);
  color: var(--text-secondary);
}

.message-time {
  font-size: 0.625rem;
  color: var(--text-muted);
  padding-left: var(--spacing-sm);
}

.message-wrapper.user .message-time {
  text-align: right;
  padding-left: 0;
  padding-right: var(--spacing-sm);
}

/* 内联工具调用卡片列表 */
.inline-tool-calls {
  margin-bottom: 6px;
}

/* 加载 */
.loading-bubble {
  min-width: 60px;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-dots {
  display: flex;
  gap: 4px;
}

.loading-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: bounce 1.4s ease-in-out infinite;
}

.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(1); opacity: 0.4; }
  40% { transform: scale(1.2); opacity: 1; }
}

/* 输入区域 */
.chat-input-area {
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-md);
  border-top: 1px solid var(--border-light);
  background: white;
}

.input-composer {
  background: #f7f8fa;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.input-composer:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 91, 219, 0.08);
}

.composer-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 8px 0;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  background: transparent;
  border: none;
  font-size: 0.75rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toolbar-btn svg { width: 14px; height: 14px; }
.toolbar-btn:hover {
  background: rgba(59, 91, 219, 0.06);
  color: var(--primary-color);
}

.composer-body {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-xs);
  padding: 4px 8px 4px 12px;
}

.composer-body textarea {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--text-dark);
  background: transparent;
  max-height: 160px;
  min-height: 24px;
  padding: 6px 0;
  font-family: inherit;
}

.composer-body textarea::placeholder { color: #b0b8c9; }

.composer-actions {
  display: flex;
  align-items: center;
  padding-bottom: 4px;
}

.action-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.action-btn svg { width: 18px; height: 18px; }

.send-action {
  background: #d1d5db;
  color: white;
}

.send-action.active {
  background: var(--primary-color);
  color: white;
}

.send-action.active:hover {
  background: #2c4fcc;
  transform: scale(1.05);
}

.send-action:disabled {
  cursor: not-allowed;
}

.stop-action {
  background: #ef4444;
  color: white;
}

.stop-action:hover {
  background: #dc2626;
  transform: scale(1.05);
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: 2px 12px 8px;
}

.footer-tip {
  font-size: 0.6875rem;
  color: #b0b8c9;
  white-space: nowrap;
  flex-shrink: 0;
}

.footer-hints {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.hint-chip {
  padding: 2px 10px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.hint-chip:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: rgba(59, 91, 219, 0.04);
}

/* 侧边栏 */
.tutor-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-height: 0;
  overflow-y: auto;
}

.sidebar-section {
  background: white;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-light);
  padding: var(--spacing-md);
}

.section-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-sm);
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-xs);
}

.tool-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--spacing-sm);
  background: var(--background-color-base);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.tool-card:hover {
  background: white;
  border-color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

.tool-icon { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; }
.tool-icon :deep(svg) { width: 100%; height: 100%; }
.tool-label { font-size: 0.6875rem; font-weight: 600; color: var(--text-dark); }
.tool-desc { font-size: 0.5625rem; color: var(--text-muted); }

.history-list { display: flex; flex-direction: column; gap: 2px; }

.history-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 6px var(--spacing-sm);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.history-item:hover { background: var(--background-color-base); }

.history-item.active {
  background: rgba(59, 91, 219, 0.08);
  border: 1px solid rgba(59, 91, 219, 0.15);
}

.history-icon { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; color: var(--primary-color); flex-shrink: 0; }
.history-icon :deep(svg) { width: 100%; height: 100%; }

.history-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.history-title { font-size: 0.75rem; color: var(--text-dark); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.history-date { font-size: 0.5625rem; color: var(--text-muted); }

.history-count {
  font-size: 0.5625rem;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  background: var(--background-color-base);
  color: var(--text-muted);
  flex-shrink: 0;
}

.history-loading, .history-empty {
  padding: var(--spacing-lg) var(--spacing-sm);
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.empty-hint { font-size: 0.6875rem; margin-top: 4px; color: var(--text-muted); }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .tutor-container { grid-template-columns: 1fr; }
  .tutor-sidebar { display: none; }
  .history-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px !important;
    z-index: 200;
    border-radius: 0;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: none;
    opacity: 1;
  }
  .history-sidebar.open {
    transform: translateX(0);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
  }
  .history-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 199;
  }
  .welcome-features { grid-template-columns: repeat(2, 1fr); }
  .composer-footer {
    flex-direction: column;
    align-items: flex-start;
  }
  .footer-hints {
    justify-content: flex-start;
    overflow-x: auto;
    flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;
  }
}
</style>
