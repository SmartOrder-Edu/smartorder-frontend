<template>
  <AppLayout>
    <div class="ai-tutor-page">
      <!-- 页面标题 + 上下文选择器 -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">AI 总学习伙伴</h1>
          <p class="page-desc">Agent 驱动的多空间学习助手——不只是回答问题，更能制定计划、生成资源、推动学习</p>
        </div>
        <div class="header-right">
          <el-button @click="clearChat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            清除对话
          </el-button>
        </div>
      </div>

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
        <!-- 聊天区域 -->
        <main class="chat-area">
          <div class="chat-messages" ref="chatContainer">
            <!-- 欢迎消息 -->
            <div class="welcome-message" v-if="messages.length === 0">
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
                  我正在管理你的 <strong>4 个学习空间</strong>。今天你预计可用 <strong>2小时30分钟</strong>。
                  高数和软件工程今天是重点，操作系统昨天已完成复习可以暂缓。
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
                <div class="message-bubble">
                  <p class="message-text">{{ msg.content }}</p>

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

                  <!-- 代码块 -->
                  <pre v-if="msg.code" class="message-code"><code>{{ msg.code }}</code></pre>
                </div>

                <!-- 操作按钮 -->
                <div class="message-actions" v-if="msg.role === 'ai'">
                  <button class="msg-action-btn" @click="copyMessage(msg.content)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    复制
                  </button>
                  <button class="msg-action-btn" @click="regenerateResponse(msg)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                      <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                    </svg>
                    重新生成
                  </button>
                </div>

                <span class="message-time">{{ msg.time }}</span>
              </div>
            </div>

            <!-- 加载指示器 -->
            <div class="message-wrapper ai loading-wrapper" v-if="isLoading">
              <div class="message-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </div>
              <div class="message-content">
                <div class="message-bubble loading-bubble">
                  <div class="loading-dots">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部输入 -->
          <div class="chat-input-area">
            <div class="input-tools">
              <button class="tool-btn" @click="showUploadDialog = true" title="上传文件">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              </button>
              <button class="tool-btn" @click="showContextDialog = true" title="设置上下文">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>
            </div>

            <div class="input-wrapper">
              <textarea
                v-model="inputMessage"
                placeholder="输入你的问题，AI 会结合你的学习画像给出个性化回答..."
                rows="1"
                @keydown.enter.exact.prevent="sendMessage"
                @input="autoResize"
                ref="inputRef"
              ></textarea>
              <button class="send-btn" :disabled="!inputMessage.trim() || isLoading" @click="sendMessage">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22,2 15,22 11,13 2,9"/>
                </svg>
              </button>
            </div>

            <div class="input-hints">
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
        </main>

        <!-- 右侧：快捷工具和历史 -->
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

          <div class="sidebar-section">
            <h3 class="section-title">对话历史</h3>
            <div class="history-list">
              <div
                v-for="(session, idx) in chatHistory"
                :key="idx"
                class="history-item"
                @click="loadSession(session)"
              >
                <div class="history-icon" v-html="session.icon"></div>
                <div class="history-info">
                  <span class="history-title">{{ session.title }}</span>
                  <span class="history-date">{{ session.date }}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import AppLayout from '@/components/layout/AppLayout.vue'

const userStore = useUserStore()

const inputMessage = ref('')
const isLoading = ref(false)
const messages = ref<any[]>([])
const chatContainer = ref<HTMLElement>()
const inputRef = ref<HTMLTextAreaElement>()
const tutorMode = ref('smart')
const showUploadDialog = ref(false)
const showContextDialog = ref(false)
const activeContext = ref('global')

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
  return `${timeGreeting}，${name}。我是你的 AI 总学习伙伴`
})

interface Message {
  role: 'ai' | 'user'
  content: string
  time: string
  resources?: any[]
  code?: string
}

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
  '我今天应该重点学什么？',
  '把高数和英语今天的任务压缩到1小时内',
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

const chatHistory = ref([
  {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    title: '进程与线程的区别',
    date: '今天 14:30'
  },
  {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    title: 'PV操作练习题',
    date: '今天 11:20'
  },
  {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="5" r="2"/><line x1="12" y1="9" x2="12" y2="3"/></svg>',
    title: '内存管理思维导图',
    date: '昨天 20:15'
  },
  {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>',
    title: '操作系统笔记整理',
    date: '昨天 16:45'
  },
  {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    title: '薄弱点分析报告',
    date: '5月7日'
  }
])

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

const autoResize = () => {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
    inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 120) + 'px'
  }
}

const sendMessage = () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  const userMsg: Message = {
    role: 'user',
    content: inputMessage.value,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  messages.value.push(userMsg)
  const question = inputMessage.value
  inputMessage.value = ''
  isLoading.value = true
  scrollToBottom()

  // 模拟 AI 响应
  setTimeout(() => {
    const aiResp = generateResponse(question)
    messages.value.push(aiResp)
    isLoading.value = false
    scrollToBottom()
  }, 1500)
}

const sendQuickMessage = (msg: string) => {
  inputMessage.value = msg
  sendMessage()
}

const generateResponse = (question: string): Message => {
  const q = question.toLowerCase()

  if (q.includes('进程') && q.includes('线程') && (q.includes('区别') || q.includes('不同'))) {
    return {
      role: 'ai',
      content: '好的，让我从多个维度为你对比进程和线程的区别：\n\n**1. 基本概念**\n• 进程：程序的一次执行实例，是资源分配的基本单位\n• 线程：CPU调度的最小单位，是进程中的一个执行流\n\n**2. 资源占用**\n• 进程：拥有独立的地址空间，资源开销大\n• 线程：共享进程的地址空间，资源开销小\n\n**3. 并发性**\n• 进程：进程间切换开销大\n• 线程：线程间切换开销小，并发性更好\n\n**4. 通信方式**\n• 进程：需要 IPC（管道、消息队列、共享内存等）\n• 线程：可直接读写共享数据\n\n结合你的学习画像，我发现你更适合通过图解来理解这个概念。',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      resources: [
        { type: 'mind', title: '进程与线程对比图', minutes: 8 },
        { type: 'video', title: '线程概念动画讲解', minutes: 10 }
      ]
    }
  } else if (q.includes('练习') || q.includes('题')) {
    return {
      role: 'ai',
      content: '已为你生成 10 道进程同步与互斥专项练习题：\n\n1. PV 操作用于解决什么问题的？\n2. 当信号量 S > 0 时表示？\n3. P 操作的本质是？\n4. V 操作的本质是？\n5. 二值信号量的取值范围？\n6. 临界区必须满足哪三个条件？\n7. 互斥锁与二元信号量的区别？\n8. 哲学家就餐问题中死锁的成因？\n9. 什么是忙等待？如何避免？\n10. 管程机制的主要特点？',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      resources: [
        { type: 'quiz', title: '完整练习题集（含解析）', minutes: 20 }
      ]
    }
  } else if (q.includes('思维导图') || q.includes('导图')) {
    return {
      role: 'ai',
      content: '正在为你生成"线程同步"知识思维导图...\n\n**核心节点：**\n\n线程同步\n├── 同步机制\n│   ├── 互斥锁（Mutex）\n│   ├── 信号量（Semaphore）\n│   ├── 条件变量\n│   └── 管程\n├── 互斥与同步\n│   ├── 互斥：独占资源\n│   └── 同步：协调执行顺序\n├── 经典问题\n│   ├── 生产者-消费者\n│   ├── 哲学家就餐\n│   ├── 读者-写者\n│   └── 吸烟者问题\n└── 实现技术\n    ├── 软件方法\n    ├── 硬件方法\n    └── 操作系统支持',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      resources: [
        { type: 'mind', title: '完整思维导图（可编辑）', minutes: 12 }
      ]
    }
  } else if (q.includes('笔记') || q.includes('总结')) {
    return {
      role: 'ai',
      content: '已为你整理"线程同步与互斥"学习笔记：\n\n## 核心概念\n\n### 进程同步\n进程同步是指多个进程在执行过程中，为协调彼此而建立的一种制约关系。\n\n### 临界区\n进程中访问共享资源的代码区域，必须互斥访问。\n\n### PV 操作\n• P(wait)：申请资源，S--，若 S<0 则阻塞\n• V(signal)：释放资源，S++，若 S<=0 则唤醒\n\n### 重要公式\n`S.value >= 0` 表示可用资源数\n`S.value < 0` 表示等待队列长度\n\n**记忆口诀：** P 是"拿"（减少资源），V 是"还"（增加资源）',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      code: `# PV操作Python实现
import threading

class Semaphore:
    def __init__(self, value=1):
        self.value = value
        self.lock = threading.Lock()
        self.queue = []

    def wait(self):
        with self.lock:
            self.value -= 1
            if self.value < 0:
                # 阻塞当前线程
                self.queue.append(threading.current_thread())
                self.lock.release()
                # ... 阻塞逻辑

    def signal(self):
        with self.lock:
            self.value += 1
            if self.value <= 0 and self.queue:
                # 唤醒一个等待线程
                thread = self.queue.pop(0)
                # ... 唤醒逻辑`
    }
  }

  return {
    role: 'ai',
    content: '我理解你的问题。让我结合你的学习画像为你详细解答。\n\n根据你的学习记录，你目前在"线程同步"章节的掌握度为 56%，在 PV 操作相关题目上的正确率为 65%，低于平均水平。\n\n我的建议是：\n1. 先理解 PV 操作的核心原理\n2. 结合生活实例记忆（比如停车场的例子）\n3. 多做针对性练习\n\n如果需要，我可以为你生成专项练习题，或者推荐一些可视化讲解资源。',
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    resources: [
      { type: 'doc', title: 'PV操作详解', minutes: 15 },
      { type: 'video', title: '信号量动画演示', minutes: 10 }
    ]
  }
}

const clearChat = () => {
  messages.value = []
}

const copyMessage = (content: string) => {
  navigator.clipboard.writeText(content)
}

const regenerateResponse = (msg: any) => {
  const index = messages.value.indexOf(msg)
  if (index > -1) {
    messages.value.splice(index, 1)
    isLoading.value = true
    setTimeout(() => {
      const newResp = generateResponse('regenerate')
      messages.value.splice(index, 0, newResp)
      isLoading.value = false
    }, 1500)
  }
}

const loadSession = (session: any) => {
  inputMessage.value = `查看之前的对话：${session.title}`
}
</script>

<style scoped>
.ai-tutor-page {
  max-width: 1400px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--spacing-md) - var(--spacing-xl));
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
  gap: var(--spacing-lg);
}

.page-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0 0 2px;
}

.page-desc {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
}

.header-right {
  display: flex;
  gap: var(--spacing-sm);
}

.header-right .el-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* 上下文选择器 */
.context-switcher {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
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

/* 欢迎摘要 */
.welcome-summary {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: var(--spacing-sm) 0 var(--spacing-lg);
  strong { color: var(--text-dark); font-weight: 600; }
}

.tutor-container {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: var(--spacing-lg);
  flex: 1;
  min-height: 0;
  overflow: hidden;
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

.message-wrapper.user {
  flex-direction: row-reverse;
}

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

.message-avatar svg {
  width: 20px;
  height: 20px;
  stroke-width: 2;
}

.message-wrapper.user .message-avatar {
  background: rgba(59, 91, 219, 0.15);
}

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
  line-height: 1.7;
  color: var(--text-dark);
}

.message-wrapper.ai .message-bubble {
  background: var(--background-color-base);
  border-bottom-left-radius: 4px;
}

.message-wrapper.user .message-bubble {
  background: linear-gradient(135deg, #3b5bdb, #5c7cfa);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-text {
  white-space: pre-wrap;
  margin: 0;
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

.res-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

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

.message-code code {
  color: #d4d4d4;
  white-space: pre;
}

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
  padding: var(--spacing-md);
  border-top: 1px solid var(--border-light);
  background: var(--background-color-base);
}

.input-tools {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
}

.tool-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  background: white;
  border: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tool-btn svg { width: 14px; height: 14px; color: var(--text-muted); }
.tool-btn:hover { border-color: var(--primary-color); }
.tool-btn:hover svg { color: var(--primary-color); }

.input-wrapper {
  display: flex;
  gap: var(--spacing-xs);
  align-items: flex-end;
  background: white;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: 6px var(--spacing-sm);
  transition: border-color var(--transition-fast);
}

.input-wrapper:focus-within {
  border-color: var(--primary-color);
}

.input-wrapper textarea {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--text-dark);
  background: transparent;
  max-height: 120px;
  font-family: inherit;
}

.input-wrapper textarea::placeholder {
  color: var(--text-muted);
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b5bdb, #5c7cfa);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-base);
  flex-shrink: 0;
}

.send-btn svg { width: 16px; height: 16px; color: white; }
.send-btn:hover:not(:disabled) { transform: scale(1.1); }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.input-hints {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
}

.hint-chip {
  padding: 2px 10px;
  background: white;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.hint-chip:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
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

.history-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

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

.history-icon { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; color: var(--primary-color); }
.history-icon :deep(svg) { width: 100%; height: 100%; }

.history-info {
  display: flex;
  flex-direction: column;
}

.history-title { font-size: 0.75rem; color: var(--text-dark); }
.history-date { font-size: 0.5625rem; color: var(--text-muted); }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .tutor-container {
    grid-template-columns: 1fr;
  }
  .tutor-sidebar { display: none; }
  .welcome-features { grid-template-columns: repeat(2, 1fr); }
}
</style>
