<template>
  <div
    class="ai-assistant"
    :class="{ expanded: assistantExpanded }"
    :style="floatingStyle"
  >
    <div 
      class="assistant-header" 
      @mousedown="startDrag"
      @click="toggleAssistant"
    >
      <div class="assistant-avatar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="avatar-svg dynamic-ai-svg">
          <defs>
            <radialGradient id="ai-core-grad-v2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ffffff"/>
              <stop offset="60%" stop-color="#f0f4ff"/>
              <stop offset="100%" stop-color="#c7d2fe"/>
            </radialGradient>
            <filter id="ai-glow-v2" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.8" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
          </defs>
          <circle cx="12" cy="12" r="9.5" stroke="rgba(255,255,255,0.5)" stroke-width="1" fill="none" stroke-dasharray="6 4 2 4">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="14s" repeatCount="indefinite"/>
          </circle>
          <g>
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="-360 12 12" dur="8s" repeatCount="indefinite"/>
            <circle cx="12" cy="4.5" r="1.8" fill="rgba(255,255,255,0.95)" stroke="none" filter="url(#ai-glow-v2)">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite"/>
            </circle>
            <circle cx="18.5" cy="12" r="1.4" fill="rgba(255,255,255,0.75)" stroke="none">
              <animate attributeName="opacity" values="0.5;0.9;0.5" dur="3.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="12" cy="19.5" r="1.8" fill="rgba(255,255,255,0.95)" stroke="none" filter="url(#ai-glow-v2)">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="2.8s" repeatCount="indefinite"/>
            </circle>
            <circle cx="5.5" cy="12" r="1.4" fill="rgba(255,255,255,0.75)" stroke="none">
              <animate attributeName="opacity" values="0.5;0.9;0.5" dur="3.2s" repeatCount="indefinite"/>
            </circle>
          </g>
          <circle cx="12" cy="12" r="3.5" fill="url(#ai-core-grad-v2)" stroke="none" filter="url(#ai-glow-v2)">
            <animate attributeName="r" values="3;4.2;3" dur="2.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"/>
            <animate attributeName="opacity" values="0.8;1;0.8" dur="2.4s" repeatCount="indefinite"/>
          </circle>
        </svg>
        <span class="online-dot animate-pulse"></span>
      </div>
      <div class="assistant-info" v-if="assistantExpanded">
        <span class="assistant-name">学习助手</span>
        <span class="assistant-status">在线 · 随时帮你</span>
      </div>
      <!-- 收起状态悬浮提示文字 -->
      <span class="hover-label" v-if="!assistantExpanded">AI 学习助手</span>
      <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="18,15 12,9 6,15" v-if="assistantExpanded"/>
      </svg>
    </div>

    <transition name="expand">
      <div class="assistant-body" v-if="assistantExpanded">
        <div class="chat-messages" ref="chatContainer">
          <div
            v-for="(msg, index) in chatMessages"
            :key="index"
            class="chat-message"
            :class="msg.role"
          >
            <div class="msg-avatar" v-if="msg.role === 'ai'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: #4f6ef6;">
                <defs>
                  <radialGradient id="ai-msg-grad-v2" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#4f6ef6"/>
                    <stop offset="100%" stop-color="#3b5bdb"/>
                  </radialGradient>
                </defs>
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-dasharray="6 3" opacity="0.5">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="12s" repeatCount="indefinite"/>
                </circle>
                <circle cx="12" cy="6" r="1.6" fill="currentColor" stroke="none" opacity="0.8">
                  <animate attributeName="opacity" values="0.5;0.9;0.5" dur="3s" repeatCount="indefinite"/>
                </circle>
                <circle cx="18" cy="12" r="1.2" fill="currentColor" stroke="none" opacity="0.6">
                  <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="12" cy="18" r="1.6" fill="currentColor" stroke="none" opacity="0.8">
                  <animate attributeName="opacity" values="0.5;0.9;0.5" dur="3.2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="6" cy="12" r="1.2" fill="currentColor" stroke="none" opacity="0.6">
                  <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.8s" repeatCount="indefinite"/>
                </circle>
                <circle cx="12" cy="12" r="3" fill="url(#ai-msg-grad-v2)" stroke="none">
                  <animate attributeName="r" values="2.6;3.6;2.6" dur="2.4s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.8;1;0.8" dur="2.4s" repeatCount="indefinite"/>
                </circle>
              </svg>
            </div>
            <div class="msg-bubble">
              <p class="msg-text">{{ msg.content }}</p>
              <span class="msg-time" v-if="msg.time">{{ msg.time }}</span>
            </div>
          </div>
        </div>

        <div class="quick-actions">
          <button
            v-for="action in quickActions"
            :key="action.id"
            class="quick-action-btn"
            @click="handleQuickAction(action)"
          >
            <span class="action-icon" v-html="action.icon"></span>
            {{ action.label }}
          </button>
        </div>

        <div class="chat-input-wrapper">
          <input
            type="text"
            class="chat-input"
            :placeholder="chatPlaceholder"
            v-model="chatMessage"
            @keyup.enter="sendMessage"
          />
          <button class="send-btn" @click="sendMessage">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22,2 15,22 11,13 2,9"/>
            </svg>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const chatMessage = ref('')
const chatContainer = ref<HTMLElement | null>(null)

// ===== 状态持久化记忆 =====
// 初始化展开状态（默认不展开或者保持上次状态）
const storedExpanded = localStorage.getItem('aiAssistExpanded')
const assistantExpanded = ref(storedExpanded ? storedExpanded === 'true' : false)

watch(assistantExpanded, (val) => {
  localStorage.setItem('aiAssistExpanded', String(val))
})

// === 悬浮框拖拽逻辑与位置记忆 ===
const defaultFloatingStyle = {
  bottom: '2rem',
  right: '2rem',
  top: 'auto',
  left: 'auto',
  transform: 'none'
}
const storedStyle = localStorage.getItem('aiAssistPosition')
const floatingStyle = ref(storedStyle ? JSON.parse(storedStyle) : { ...defaultFloatingStyle })

// 保存位置
watch(floatingStyle, (val) => {
  localStorage.setItem('aiAssistPosition', JSON.stringify(val))
}, { deep: true })

let isDragging = false
let startX = 0
let startY = 0
let initialLeft = 0
let initialTop = 0
let animationFrameId: number | null = null
let preventClick = false

const startDrag = (e: MouseEvent) => {
  isDragging = true
  preventClick = false
  startX = e.clientX
  startY = e.clientY
  
  const floatingEl = document.querySelector('.ai-assistant') as HTMLElement
  if (floatingEl) {
    const rect = floatingEl.getBoundingClientRect()
    // 如果是第一次拖拽或当前使用 bottom/right 的绝对定位，计算转换成 left/top
    if (floatingStyle.value.left === 'auto') {
      initialLeft = rect.left
      initialTop = rect.top
      floatingStyle.value.bottom = 'auto'
      floatingStyle.value.right = 'auto'
      floatingStyle.value.left = `${initialLeft}px`
      floatingStyle.value.top = `${initialTop}px`
      floatingStyle.value.transform = 'none'
      floatingEl.style.transition = 'none'
    } else {
      initialLeft = parseFloat(floatingStyle.value.left) || rect.left
      initialTop = parseFloat(floatingStyle.value.top) || rect.top
    }
  }

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  e.preventDefault()
}

const onDrag = (e: MouseEvent) => {
  if (!isDragging) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
    preventClick = true
  }
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  
  animationFrameId = requestAnimationFrame(() => {
    let newLeft = initialLeft + dx
    let newTop = initialTop + dy
    
    // 边界限制
    const floatingEl = document.querySelector('.ai-assistant') as HTMLElement
    if (floatingEl) {
      const rect = floatingEl.getBoundingClientRect()
      const maxLeft = window.innerWidth - rect.width
      const maxTop = window.innerHeight - rect.height
      
      newLeft = Math.max(0, Math.min(newLeft, maxLeft))
      newTop = Math.max(0, Math.min(newTop, maxTop))
    }
    
    floatingStyle.value.left = `${newLeft}px`
    floatingStyle.value.top = `${newTop}px`
  })
}

const stopDrag = () => {
  isDragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  const floatingEl = document.querySelector('.ai-assistant') as HTMLElement
  if (floatingEl) {
    floatingEl.style.transition = ''
  }
}

// 展开/收起助手
const toggleAssistant = () => {
  if (preventClick) return
  assistantExpanded.value = !assistantExpanded.value
}

// ===== 聊天数据逻辑 =====
interface ChatMessage {
  role: 'ai' | 'user'
  content: string
  time?: string
}

const storedMessages = localStorage.getItem('aiAssistMessages')
const chatMessages = ref<ChatMessage[]>(storedMessages ? JSON.parse(storedMessages) : [
  {
    role: 'ai',
    content: '你好！我是你的 AI 学习伙伴。有什么不懂的知识点或者需要帮助的地方，随时告诉我。',
    time: '刚刚'
  }
])

watch(chatMessages, (val) => {
  localStorage.setItem('aiAssistMessages', JSON.stringify(val))
}, { deep: true })

const quickActions = [
  {
    id: 1,
    label: '解释当前知识点',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  },
  {
    id: 2,
    label: '生成练习题',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>'
  },
  {
    id: 3,
    label: '帮我总结笔记',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>'
  },
  {
    id: 4,
    label: '生成思维导图',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="5" r="2"/><line x1="12" y1="9" x2="12" y2="3"/></svg>'
  }
]

const chatPlaceholder = computed(() => {
  const placeholders = [
    '告诉我你卡在哪里...',
    '帮我解释这个概念...',
    '生成一些练习题...'
  ]
  return placeholders[Math.floor(Math.random() * placeholders.length)]
})

const scrollToBottom = async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const sendMessage = () => {
  if (!chatMessage.value.trim()) return
  
  const text = chatMessage.value
  chatMessage.value = ''
  
  chatMessages.value.push({
    role: 'user',
    content: text,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  })
  
  scrollToBottom()
  
  setTimeout(() => {
    chatMessages.value.push({
      role: 'ai',
      content: '收到你的消息了，这是一个模拟回复。AI 服务正在连接中...',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    })
    scrollToBottom()
  }, 1000)
}

const handleQuickAction = (action: any) => {
  chatMessage.value = action.label
  sendMessage()
}

  const checkBounds = () => {
    // 如果没有使用绝对定位则不需要处理
    if (floatingStyle.value.left === 'auto' || floatingStyle.value.top === 'auto') return
    
    const floatingEl = document.querySelector('.ai-assistant') as HTMLElement
    if (floatingEl) {
      const rect = floatingEl.getBoundingClientRect()
      const maxLeft = window.innerWidth - rect.width
      const maxTop = window.innerHeight - rect.height
      let currentLeft = parseInt(floatingStyle.value.left) || 0
      let currentTop = parseInt(floatingStyle.value.top) || 0
      
      let changed = false
      if (currentLeft < 0) { currentLeft = 0; changed = true; }
      if (currentLeft > maxLeft && maxLeft > 0) { currentLeft = maxLeft; changed = true; }
      if (currentTop < 0) { currentTop = 0; changed = true; }
      if (currentTop > maxTop && maxTop > 0) { currentTop = maxTop; changed = true; }
      
      if (changed) {
        floatingStyle.value.left = `${currentLeft}px`
        floatingStyle.value.top = `${currentTop}px`
      }
    }
  }

  const handleResize = () => checkBounds()

  onMounted(() => {
    scrollToBottom()
    // 延迟检查边界，等元素渲染
    nextTick(() => {
      checkBounds()
    })
    window.addEventListener('resize', handleResize)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
  })
</script>

<style scoped>
  /* AI */
  .ai-assistant {
    position: fixed;
  width: 360px;
  border-radius: 14px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  z-index: 1000;
  border: 1px solid var(--border-light);
  background: #ffffff;
  backdrop-filter: blur(20px);
  transition: width 0.32s cubic-bezier(0.4, 0, 0.2, 1),
              border-radius 0.32s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.3s ease;
}

/* 收起状态：完美圆形悬浮球 */
.ai-assistant:not(.expanded) {
  width: 56px;
  border-radius: 50%;
  box-shadow: 
    0 8px 24px rgba(79, 110, 246, 0.28),
    0 0 0 2px rgba(79, 110, 246, 0.12);
  transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
              border-radius 0.35s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.3s ease;
  animation: orbBreathing 3s infinite ease-in-out;
}

@keyframes orbBreathing {
  0%, 100% {
    box-shadow: 
      0 8px 24px rgba(79, 110, 246, 0.28),
      0 0 0 2px rgba(79, 110, 246, 0.12);
  }
  50% {
    box-shadow: 
      0 12px 30px rgba(79, 110, 246, 0.42),
      0 0 0 4px rgba(79, 110, 246, 0.22);
  }
}

.ai-assistant:not(.expanded):hover {
  width: 146px; /* 悬停展开长条形 */
  border-radius: 28px;
  box-shadow: 
    0 10px 28px rgba(79, 110, 246, 0.38),
    0 0 0 2px rgba(79, 110, 246, 0.2);
  animation: none; /* 悬停时停止呼吸阴影 */
}

/* 交互点击缩放反馈，应用在内部 header 上以避免 transform 冲突 */
.ai-assistant:not(.expanded) .assistant-header:active {
  transform: scale(0.95);
}

/* header 条 */
.ai-assistant .assistant-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: 12px var(--spacing-lg);
  background: linear-gradient(135deg, #4f6ef6 0%, #3b5bdb 50%, #6366f1 100%);
  cursor: grab;
  user-select: none;
  transition: gap 0.32s cubic-bezier(0.4, 0, 0.2, 1),
              padding 0.32s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-assistant .assistant-header:active {
  cursor: grabbing;
}

.ai-assistant:not(.expanded) .assistant-header {
  gap: 0;
  padding: 10px;
  justify-content: center;
  background: linear-gradient(135deg, #4f6ef6 0%, #10b981 50%, #6366f1 100%);
  background-size: 200% 200%;
  animation: dynamicBg 5s ease infinite;
}

@keyframes dynamicBg {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* 头像 */
.assistant-avatar {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(4px);
}

.assistant-avatar .avatar-svg {
  width: 22px;
  height: 22px;
  color: white;
}

.assistant-avatar .online-dot {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 10px;
  height: 10px;
  background: #10b981;
  border: 2px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 4px rgba(16, 185, 129, 0.4); }
  50% { box-shadow: 0 0 10px rgba(16, 185, 129, 0.7); }
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}

.ai-assistant:not(.expanded) .assistant-avatar .online-dot {
  border-color: rgba(255, 255, 255, 0.8);
}

/* 悬停文本提示样式 */
.hover-label {
  color: white;
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0;
  max-width: 0;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.03em;
}

.ai-assistant:not(.expanded):hover .hover-label {
  opacity: 1;
  max-width: 90px;
  margin-left: 6px;
}

/* 展开时的文本和图标 */
.assistant-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  transition: opacity 0.2s ease;
}

.ai-assistant:not(.expanded) .assistant-info {
  opacity: 0;
  width: 0;
  height: 0;
  overflow: hidden;
}

.assistant-info .assistant-name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: white;
  line-height: 1.2;
  letter-spacing: 0.02em;
}

.assistant-info .assistant-status {
  font-size: 0.6875rem;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
}

/* 展开箭头 */
.expand-icon {
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.9);
  flex-shrink: 0;
  transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.15s ease,
              width 0.25s ease;
  cursor: pointer;
  padding: 3px;
  border-radius: 6px;
}
.expand-icon:hover {
  background: rgba(255, 255, 255, 0.15);
}

.ai-assistant:not(.expanded) .expand-icon {
  opacity: 0;
  width: 0;
  padding: 0;
}

.ai-assistant.expanded .expand-icon {
  transform: rotate(180deg);
}

/* 助手主体展开区 */
.assistant-body {
  height: 460px;
  display: flex;
  flex-direction: column;
  background: #fafbfc;
}

/* 展开收起动画 (高度) */
.expand-enter-active,
.expand-leave-active {
  transition: height 0.32s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  height: 460px;
  opacity: 1;
}

/* body 收起时保留宽度 */
.ai-assistant:not(.expanded) .assistant-body {
  min-width: 360px;
}

/* 聊天历史区 */
.chat-messages {
  flex: 1;
  padding: var(--spacing-md);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  scroll-behavior: smooth;
}

.chat-messages::-webkit-scrollbar {
  width: 4px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.35);
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.55);
}

.chat-message {
  display: flex;
  gap: 8px;
  max-width: 88%;
  animation: msgSlideIn 0.25s ease-out;
}

@keyframes msgSlideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-message.user {
  margin-left: auto;
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.msg-avatar svg {
  width: 18px;
  height: 18px;
}

.msg-bubble {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.msg-text {
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--text-primary);
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin: 0;
  word-break: break-word;
}

.chat-message.user .msg-text {
  background: linear-gradient(135deg, #4f6ef6, #3b5bdb);
  color: #ffffff;
  border-top-right-radius: 6px;
  box-shadow: 0 2px 8px rgba(59, 91, 219, 0.2);
}

.chat-message.ai .msg-text {
  border-top-left-radius: 6px;
}

.msg-time {
  font-size: 0.625rem;
  color: var(--text-muted);
  padding: 0 4px;
}

.chat-message.user .msg-time {
  align-self: flex-end;
}

/* 快捷操作区 */
.quick-actions {
  padding: 10px var(--spacing-md);
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  background: #ffffff;
  border-top: 1px solid var(--border-soft);
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid var(--border-soft);
  background: #f8fafc;
  font-size: 0.75rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.quick-action-btn:hover {
  background: rgba(79, 110, 246, 0.06);
  color: #4f6ef6;
  border-color: rgba(79, 110, 246, 0.25);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(79, 110, 246, 0.08);
}

.quick-action-btn:active {
  transform: translateY(0) scale(0.97);
}

.action-icon {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.action-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

/* 输入区 */
.chat-input-wrapper {
  padding: 10px var(--spacing-md);
  background: #ffffff;
  border-top: 1px solid var(--border-soft);
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-input {
  flex: 1;
  border: 1.5px solid var(--border-soft);
  background: #f8fafc;
  padding: 9px 14px;
  border-radius: 22px;
  font-size: 0.85rem;
  color: var(--text-primary);
  transition: all 0.2s ease;
  outline: none;
}

.chat-input::placeholder {
  color: var(--text-muted);
}

.chat-input:focus {
  border-color: rgba(79, 110, 246, 0.4);
  box-shadow: 0 0 0 3px rgba(79, 110, 246, 0.08);
  background: #ffffff;
}

.send-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f6ef6, #3b5bdb);
  color: #ffffff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.send-btn svg {
  width: 16px;
  height: 16px;
}

.send-btn:hover {
  background: linear-gradient(135deg, #5c7cfa, #4f6ef6);
  transform: scale(1.08);
  box-shadow: 0 4px 14px rgba(79, 110, 246, 0.35);
}

.send-btn:active {
  transform: scale(0.94);
}
</style>
