<template>
  <div class="app-layout">
    <div class="layout-container" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <!-- 左侧边栏 -->
      <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
        <!-- Logo -->
        <div class="sidebar-logo" @click="goHome">
          <img src="/logo.png" alt="知序智学" class="sidebar-logo-img" />
          <div class="sidebar-logo-text" v-if="!sidebarCollapsed">
            <span class="sidebar-logo-title gradient-text">知序智学</span>
            <span class="sidebar-logo-subtitle">AI Learning OS</span>
          </div>
          <button class="collapse-btn" @click.stop="sidebarCollapsed = !sidebarCollapsed" :title="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline v-if="!sidebarCollapsed" points="15,18 9,12 15,6"/>
              <polyline v-else points="9,18 15,12 9,6"/>
            </svg>
          </button>
        </div>

        <nav class="sidebar-nav">
          <!-- 核心入口 -->
          <router-link
            v-for="item in topMenuItems"
            :key="item.id"
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
          >
            <span class="nav-icon" v-html="item.icon"></span>
            <span class="nav-label" v-if="!sidebarCollapsed">{{ item.label }}</span>
          </router-link>

          <div class="nav-divider" v-if="!sidebarCollapsed"></div>

          <!-- 学习空间 -->
          <div class="nav-section" v-if="!sidebarCollapsed">
            <div class="nav-section-header">
              <span class="nav-section-title">学习空间</span>
              <button class="nav-section-action" @click="showCreateSpace = true" title="新建学习空间">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>
            <router-link
              v-for="space in learningSpaces"
              :key="space.id"
              :to="`/space/${space.id}`"
              class="nav-item nav-space-item"
              :class="{ active: isActiveSpace(space.id) }"
              :title="space.name"
            >
              <span class="space-indicator" :class="space.status" :style="{ background: space.color }"></span>
              <span class="nav-label nav-space-label">{{ space.name }}</span>
              <span class="space-progress-text">{{ space.progress }}%</span>
            </router-link>
            <button class="nav-item nav-add-space" @click="showCreateSpace = true">
              <span class="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </span>
              <span class="nav-label">新建学习空间</span>
            </button>
          </div>
          <div class="nav-section-mini" v-else>
            <div
              v-for="space in learningSpaces"
              :key="space.id"
              class="nav-item"
              :class="{ active: isActiveSpace(space.id) }"
              :title="space.name"
              @click="$router.push(`/space/${space.id}`)"
            >
              <span class="space-mini-dot" :class="space.status" :style="{ background: space.color }"></span>
            </div>
            <div class="nav-item" title="新建学习空间" @click="showCreateSpace = true">
              <span class="nav-icon" style="width:18px;height:18px">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </span>
            </div>
          </div>

          <div class="nav-divider" v-if="!sidebarCollapsed"></div>

          <!-- 功能页面 -->
          <router-link
            v-for="item in bottomMenuItems"
            :key="item.id"
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
          >
            <span class="nav-icon" v-html="item.icon"></span>
            <span class="nav-label" v-if="!sidebarCollapsed">{{ item.label }}</span>
          </router-link>
        </nav>

        <div class="sidebar-footer">
          <!-- 用户区 -->
          <div class="sidebar-user" v-if="!sidebarCollapsed">
            <div class="sidebar-user-info" @click="showUserMenu = !showUserMenu">
              <img :src="userStore.userInfo?.avatarUrl || '/default-avatar.png'" alt="头像" class="sidebar-avatar" />
              <span class="sidebar-username">{{ userStore.userName || '用户' }}</span>
            </div>
          </div>
          <div class="sidebar-user-mini" v-else>
            <img :src="userStore.userInfo?.avatarUrl || '/default-avatar.png'" alt="头像" class="sidebar-avatar-mini" @click="showUserMenu = !showUserMenu" />
          </div>

          <!-- 用户下拉菜单 -->
          <transition name="slide-up">
            <div class="sidebar-user-menu" v-if="showUserMenu && !sidebarCollapsed">
              <button class="user-menu-item" @click="goProfile">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                个人中心
              </button>
              <button class="user-menu-item" @click="goSettings">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                设置
              </button>
              <button class="user-menu-item" @click="goFeedback">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                问题反馈
              </button>
              <div class="user-menu-divider"></div>
              <button class="user-menu-item logout" @click="handleLogout">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                退出登录
              </button>
            </div>
          </transition>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="main-content">
        <div class="page-container">
          <slot />
        </div>
      </main>
    </div>

    <!-- 通知悬浮按钮 -->
    <div class="notif-fab" :class="{ 'has-unread': unreadCount > 0 }">
      <button class="notif-fab-btn" @click="showNotifications = !showNotifications" :title="unreadCount > 0 ? `${unreadCount} 条未读通知` : '通知'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span class="notif-fab-badge" v-if="unreadCount > 0">{{ unreadCount }}</span>
      </button>
      <!-- 通知面板 -->
      <transition name="notif-panel">
        <div class="notif-fab-panel" v-if="showNotifications">
          <div class="notif-panel-header">
            <span>通知</span>
            <button class="mark-read-btn" @click="markAllRead">全部已读</button>
          </div>
          <div class="notif-panel-list">
            <div class="notif-panel-item unread">
              <p class="notif-panel-text">规划助理已为你调整本周任务</p>
              <span class="notif-panel-time">10分钟前</span>
            </div>
            <div class="notif-panel-item unread">
              <p class="notif-panel-text">资源生成完成</p>
              <span class="notif-panel-time">30分钟前</span>
            </div>
            <div class="notif-panel-item">
              <p class="notif-panel-text">测评报告已生成：本周正确率提升 8%</p>
              <span class="notif-panel-time">2小时前</span>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- AI 助手悬浮框 -->
    <div class="ai-assistant" :class="{ expanded: assistantExpanded }">
      <div class="assistant-header" @click="toggleAssistant">
        <div class="assistant-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="avatar-svg">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
          <span class="online-dot"></span>
        </div>
        <div class="assistant-info" v-if="assistantExpanded">
          <span class="assistant-name">学习助手</span>
          <span class="assistant-status">在线 · 随时帮你</span>
        </div>
        <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="18,15 12,9 6,15"/>
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true')
watch(() => sidebarCollapsed.value, (val) => {
  localStorage.setItem('sidebarCollapsed', String(val))
})
const assistantExpanded = ref(true)
const chatMessage = ref('')
const showNotifications = ref(false)
const showUserMenu = ref(false)
const unreadCount = ref(2)

const markAllRead = () => {
  unreadCount.value = 0
}

// 点击外部关闭通知面板
const handleClickOutside = (e: MouseEvent) => {
  const fab = document.querySelector('.notif-fab')
  if (showNotifications.value && fab && !fab.contains(e.target as Node)) {
    showNotifications.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  if (userStore.isLogin && !userStore.userInfo) {
    userStore.fetchUserInfo().catch(() => {})
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

interface LearningSpace {
  id: string
  name: string
  icon: string
  progress: number
  status: 'normal' | 'warning' | 'danger' | 'good'
  color: string
}

const learningSpaces = ref<LearningSpace[]>([
  { id: 'math', name: '高等数学', icon: '📐', progress: 42, status: 'warning', color: '#3b82f6' },
  { id: 'english', name: '英语四级', icon: '📝', progress: 61, status: 'normal', color: '#10b981' },
  { id: 'se', name: '软件工程', icon: '💻', progress: 35, status: 'danger', color: '#f59e0b' },
  { id: 'os', name: '操作系统', icon: '⚙️', progress: 70, status: 'good', color: '#8b5cf6' }
])

const showCreateSpace = ref(false)

interface ChatMessage {
  role: 'ai' | 'user'
  content: string
  time?: string
}

const chatMessages = ref<ChatMessage[]>([
  {
    role: 'ai',
    content: '你好！我是你的 AI 学习伙伴。有什么不懂的知识点或者需要帮助的地方，随时告诉我。',
    time: '刚刚'
  }
])

const topMenuItems = [
  {
    id: 'dashboard',
    label: '总学习指挥台',
    path: '/dashboard',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>'
  },
  {
    id: 'ai-partner',
    label: 'AI 学习伙伴',
    path: '/ai-tutor',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>'
  },
  {
    id: 'daily-plan',
    label: '今日总计划',
    path: '/daily-plan',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
  }
]

const bottomMenuItems = [
  {
    id: 'tasks',
    label: '任务日程',
    path: '/tasks',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>'
  },
  {
    id: 'resources',
    label: '资源广场',
    path: '/resources',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'
  },
  {
    id: 'exam',
    label: '练习测评',
    path: '/exam',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
  },
  {
    id: 'profile',
    label: '成长画像',
    path: '/profile',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
  },
  {
    id: 'cloud-drive',
    label: '个人云盘',
    path: '/cloud-drive',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>'
  }
]

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

const isActive = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/')
}

const isActiveSpace = (spaceId: string) => {
  return route.path === `/space/${spaceId}` || route.path.startsWith(`/space/${spaceId}/`)
}

const goHome = () => router.push('/ai-tutor')
const goProfile = () => {
  showUserMenu.value = false
  router.push('/profile')
}
const goSettings = () => {
  showUserMenu.value = false
  ElMessage.info('设置页面开发中')
}
const goFeedback = () => {
  showUserMenu.value = false
  ElMessage.info('问题反馈页面开发中')
}
const toggleAssistant = () => { assistantExpanded.value = !assistantExpanded.value }

const handleLogout = async () => {
  showUserMenu.value = false
  try {
    await userStore.logout()
    ElMessage.success('已退出登录')
  } catch {
    // 即使接口失败也清除本地状态
  }
  router.push('/login')
}

const handleQuickAction = (_action: any, _e?: any) => {
  chatMessage.value = _action.label
  sendMessage()
}

const sendMessage = (_e?: any) => {
  if (!chatMessage.value.trim()) return

  chatMessages.value.push({
    role: 'user',
    content: chatMessage.value,
    time: '刚刚'
  })

  const userMsg = chatMessage.value
  chatMessage.value = ''

  // 模拟 AI 响应
  setTimeout(() => {
    let response = ''
    if (userMsg.includes('解释') || userMsg.includes('概念')) {
      response = '好的，让我为你详细解释这个知识点。进程是程序的一次执行实例，是操作系统进行资源分配和调度的基本单位；线程是CPU调度的最小单位，同一进程内的线程共享进程的地址空间和资源。'
    } else if (userMsg.includes('练习') || userMsg.includes('题')) {
      response = '我已为你生成了5道专项练习题，涵盖进程同步、互斥、PV操作等核心考点。点击"开始练习"按钮即可开始。'
    } else if (userMsg.includes('笔记') || userMsg.includes('总结')) {
      response = '正在为你整理笔记... 已根据你的学习记录提取了本节核心知识点，包括：1. 进程与线程的区别 2. 同步与互斥 3. PV操作原理。'
    } else if (userMsg.includes('思维导图')) {
      response = '正在为你生成"线程与同步"的知识思维导图，预计需要10秒生成完毕。'
    } else {
      response = '我理解你的问题。让我结合你的学习画像为你详细解答。如果你有具体的知识点不理解，可以直接描述出来，我会针对性地帮你讲解。'
    }

    chatMessages.value.push({
      role: 'ai',
      content: response,
      time: '刚刚'
    })
  }, 800)
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: var(--bg-primary);
  position: relative;
}

/* 布局容器 */
.layout-container {
  display: flex;
  min-height: 100vh;
}

/* 侧边栏 */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  flex-direction: column;
  background: white;
  border-right: 1px solid var(--border-light);
  overflow: visible;
  transition: width var(--transition-base);
  z-index: 90;
}

/* 侧边栏 Logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0 var(--spacing-sm) var(--spacing-xs);
  margin-bottom: 0;
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
}

.sidebar.collapsed .sidebar-logo {
  flex-direction: column;
  justify-content: center;
  padding: var(--spacing-xs) 0 var(--spacing-md);
  gap: var(--spacing-sm);
}

.sidebar-logo-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
  flex-shrink: 0;
}

.sidebar-logo-text {
  display: flex;
  flex-direction: column;
}

.sidebar-logo-title {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.sidebar-logo-subtitle {
  font-size: 0.5625rem;
  color: var(--text-muted);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
  padding: var(--spacing-lg) var(--spacing-xs);
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: var(--spacing-sm);
}

.sidebar.collapsed .nav-label {
  display: none;
}

.sidebar.collapsed .sidebar-nav {
  padding-top: 20px;
}

.sidebar-nav {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  position: relative;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all var(--transition-base);
  white-space: nowrap;
}

.nav-item .nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-item .nav-icon svg {
  width: 100%;
  height: 100%;
}

.nav-item .nav-label {
  font-size: 0.8125rem;
  font-weight: 500;
}

.nav-item:hover {
  background: rgba(59, 91, 219, 0.06);
  color: var(--primary-color);
}

.nav-item.active {
  background: rgba(59, 91, 219, 0.1);
  color: var(--primary-color);
  font-weight: 600;
}

/* 导航分隔线 */
.nav-divider {
  height: 1px;
  background: var(--border-light);
  margin: var(--spacing-sm) 0;
}

/* 导航分组 */
.nav-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.nav-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xs) var(--spacing-sm);
}

.nav-section-title {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  font-weight: 600;
}

.nav-section-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.nav-section-action:hover {
  background: rgba(59, 91, 219, 0.08);
  color: var(--primary-color);
}

/* 学习空间导航项 */
.nav-space-item {
  padding: var(--spacing-xs) var(--spacing-sm);
  gap: var(--spacing-xs);
}

.space-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: all var(--transition-base);
}

.space-indicator.warning { opacity: 0.85; }
.space-indicator.danger { animation: blink-warn 1s ease-in-out infinite; }
.space-indicator.good { box-shadow: 0 0 6px currentColor; }

.nav-space-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8125rem;
}

.space-progress-text {
  font-size: 0.6875rem;
  color: var(--text-muted);
  font-weight: 500;
  flex-shrink: 0;
}

.nav-add-space {
  color: var(--text-muted);
  cursor: pointer;
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-md);
  margin-top: 2px;
}

.nav-add-space:hover {
  color: var(--primary-color);
  border-color: var(--primary-color);
  background: rgba(59, 91, 219, 0.04);
}

/* 收起时的迷你空间 */
.nav-section-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-xs) 0;
}

.space-mini-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.space-mini-dot.danger { animation: blink-warn 1s ease-in-out infinite; }

@keyframes blink-warn {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.sidebar-footer {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-light);
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  margin-left: auto;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.collapse-btn svg {
  width: 16px;
  height: 16px;
}

.collapse-btn:hover {
  background: rgba(59, 91, 219, 0.08);
  color: var(--primary-color);
}

.sidebar.collapsed .collapse-btn {
  margin-left: 0;
}

.sidebar.collapsed .collapse-btn svg {
  width: 18px;
  height: 18px;
}


/* 侧边栏用户区域 */
.sidebar-user {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-xs);
}

.sidebar-user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  width: 100%;
  min-width: 0;
  padding: 4px 8px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);

  &:hover { background: var(--background-color-base); }
}

.sidebar-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.sidebar-username {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-dark);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-user-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.sidebar-avatar-mini {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}

/* 通知悬浮按钮 */
.notif-fab {
  position: fixed;
  top: var(--spacing-sm);
  right: var(--spacing-lg);
  z-index: 95;
}

.notif-fab-btn {
  position: relative;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-full);
  background: white;
  border: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  transition: all var(--transition-base);
}

.notif-fab-btn:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  color: var(--primary-color);
  border-color: rgba(59, 91, 219, 0.3);
  transform: scale(1.05);
}

/* 未读状态脉冲动画 */
.notif-fab.has-unread .notif-fab-btn {
  color: var(--primary-color);
  border-color: rgba(59, 91, 219, 0.3);
  animation: notif-pulse 2s ease-in-out infinite;
}

@keyframes notif-pulse {
  0%, 100% { box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06), 0 0 0 0 rgba(59, 91, 219, 0.3); }
  50% { box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06), 0 0 0 6px rgba(59, 91, 219, 0); }
}

.notif-fab-badge {
  position: absolute;
  top: -3px;
  right: -3px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: var(--danger-color);
  border-radius: var(--radius-full);
  font-size: 9px;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

/* 通知面板 */
.notif-fab-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 360px;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--border-light);
  overflow: hidden;
  z-index: 300;
}

/* 面板弹出动画 */
.notif-panel-enter-active,
.notif-panel-leave-active {
  transition: all 0.25s ease;
}

.notif-panel-enter-from,
.notif-panel-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
  transform-origin: top right;
}

.notif-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--border-light);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-dark);
}

.notif-panel-list {
  max-height: 240px;
  overflow-y: auto;
}

.notif-panel-item {
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  transition: background var(--transition-fast);

  &:hover { background: var(--background-color-base); }
  &.unread { background: rgba(59, 91, 219, 0.02); }
}

.notif-panel-text {
  font-size: 0.8125rem;
  color: var(--text-dark);
  margin: 0 0 2px;
  line-height: 1.4;
}

.notif-panel-time {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

/* 侧边栏用户菜单 */
.sidebar-user-menu {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 100%;
  margin-bottom: 4px;
  width: 100%;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--border-light);
  overflow: hidden;
  z-index: 300;
}

.user-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: none;
  border: none;
  font-size: 0.8125rem;
  color: var(--text-regular);
  cursor: pointer;
  transition: background var(--transition-fast);

  &:hover { background: var(--background-color-base); }
  &.logout { color: var(--danger-color); }
  &.logout:hover { background: rgba(239, 68, 68, 0.06); }
}

.user-menu-divider {
  height: 1px;
  background: var(--border-light);
  margin: var(--spacing-xs) 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* 主内容 */
.main-content {
  flex: 1;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  transition: margin-left var(--transition-base), max-width var(--transition-base);
}

.page-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--spacing-xl) var(--spacing-2xl) var(--spacing-xl);
}

.layout-container.sidebar-collapsed .main-content {
  margin-left: var(--sidebar-collapsed-width);
}

/* AI 助手悬浮框 */
.ai-assistant {
  position: fixed;
  bottom: var(--spacing-xl);
  right: var(--spacing-xl);
  width: 340px;
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 100;
  border: 1px solid var(--border-light);
  transition: all var(--transition-base);
}

.ai-assistant .assistant-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: linear-gradient(135deg, #3b5bdb 0%, #5c7cfa 100%);
  cursor: pointer;
}

.assistant-avatar {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.assistant-avatar .avatar-svg {
  width: 24px;
  height: 24px;
  color: white;
  stroke-width: 2;
}

.assistant-avatar .online-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  background: #22c55e;
  border: 2px solid white;
  border-radius: 50%;
}

.assistant-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.assistant-info .assistant-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
}

.assistant-info .assistant-status {
  font-size: 0.6875rem;
  color: rgba(255, 255, 255, 0.8);
}

.expand-icon {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.8);
  transition: transform var(--transition-base);
}

.ai-assistant.expanded .expand-icon {
  transform: rotate(180deg);
}

.assistant-body {
  border-top: 1px solid var(--border-light);
  transition: all var(--transition-base);
}

/* 聊天消息 */
.chat-messages {
  max-height: 350px;
  overflow-y: auto;
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.chat-message {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.chat-message.user {
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(59, 91, 219, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.msg-bubble {
  max-width: 220px;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-lg);
}

.chat-message.ai .msg-bubble {
  background: var(--background-color-base);
  border-bottom-left-radius: 4px;
}

.chat-message.user .msg-bubble {
  background: linear-gradient(135deg, #3b5bdb 0%, #5c7cfa 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.msg-text {
  font-size: 0.8125rem;
  line-height: 1.5;
  margin: 0;
}

.msg-time {
  display: block;
  font-size: 0.625rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.chat-message.user .msg-time {
  color: rgba(255, 255, 255, 0.6);
  text-align: right;
}

/* 快捷操作 */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--spacing-sm);
  background: var(--background-color-base);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: 0.6875rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-base);
}

.quick-action-btn .action-icon {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-action-btn .action-icon svg {
  width: 100%;
  height: 100%;
}

.quick-action-btn:hover {
  background: rgba(59, 91, 219, 0.08);
  color: var(--primary-color);
  border-color: rgba(59, 91, 219, 0.2);
}

.chat-input-wrapper {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--border-light);
}

.chat-input {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--background-color-base);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
}

.chat-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.send-btn {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #3b5bdb 0%, #5c7cfa 100%);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-base);
  flex-shrink: 0;
}

.send-btn svg {
  width: 14px;
  height: 14px;
  color: white;
}

.send-btn:hover {
  transform: scale(1.1);
}

/* 过渡动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

@media (max-width: 992px) {
  .sidebar {
    display: none;
  }

  .main-content {
    margin-left: 0 !important;
  }

  .page-container {
    padding: var(--spacing-lg);
  }
}
</style>
