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
              <router-link to="/spaces" class="nav-section-title-link">学习空间</router-link>
              <button class="nav-section-action" @click="showCreateSpace = true" title="新建学习空间">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>
            <div class="nav-space-list">
              <router-link
                v-for="space in displayedSpaces"
                :key="space.id"
                :to="`/space/${space.id}`"
                class="nav-item nav-space-item"
                :class="{ active: isActiveSpace(space.id) }"
                :title="space.name"
              >
                <span class="space-indicator" :class="space.healthStatus" :style="{ background: space.color }"></span>
                <span class="nav-label nav-space-label">{{ space.name }}</span>
                <span class="space-progress-text">{{ Math.round(space.progress) }}%</span>
              </router-link>
            </div>
            <router-link
              v-if="spaceStore.activeSpaces.length > maxVisibleSpaces"
              to="/spaces"
              class="nav-space-more"
            >
              还有 {{ spaceStore.activeSpaces.length - maxVisibleSpaces }} 个空间
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <polyline points="9,6 15,12 9,18"/>
              </svg>
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
              v-for="space in displayedSpaces"
              :key="space.id"
              class="nav-item"
              :class="{ active: isActiveSpace(space.id) }"
              :title="space.name"
              @click="$router.push(`/space/${space.id}`)"
            >
              <span class="space-mini-dot" :class="space.healthStatus" :style="{ background: space.color }"></span>
            </div>
            <router-link
              v-if="spaceStore.activeSpaces.length > maxVisibleSpaces"
              to="/spaces"
              class="nav-item space-mini-more"
              title="查看全部学习空间"
            >
              <span class="space-mini-more-text">+{{ spaceStore.activeSpaces.length - maxVisibleSpaces }}</span>
            </router-link>
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
    <AIAssistant />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useLearningSpaceStore } from '@/stores/learningSpace'
import { chatWebSocket } from '@/utils/websocket'
import AIAssistant from '@/components/common/AIAssistant.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const spaceStore = useLearningSpaceStore()

onMounted(() => {
  if (userStore.isLogin) {
    chatWebSocket.connect()
  }
})

onBeforeUnmount(() => {
})

const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true')
watch(() => sidebarCollapsed.value, (val) => {
  localStorage.setItem('sidebarCollapsed', String(val))
})

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
  spaceStore.fetchSpaces('active')
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

const showCreateSpace = ref(false)
const maxVisibleSpaces = 5

const displayedSpaces = computed(() => {
  const all = spaceStore.activeSpaces
  if (all.length <= maxVisibleSpaces) {
    return all
  }
  // 显示前 N 个，但确保当前空间可见
  const currentSpaceId = route.params.spaceId
  const visible = all.slice(0, maxVisibleSpaces)
  if (currentSpaceId && !visible.some(s => String(s.id) === String(currentSpaceId))) {
    const currentSpace = all.find(s => String(s.id) === String(currentSpaceId))
    if (currentSpace) {
      visible.pop()
      visible.push(currentSpace)
    }
  }
  return visible
})

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
    id: 'knowledge-base',
    label: '知识库管理',
    path: '/knowledge-base',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>'
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
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>'
  }
]

const isActive = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/')
}

const isActiveSpace = (spaceId: number) => {
  const pathId = Number(route.params.spaceId)
  return pathId === spaceId
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
  padding: var(--spacing-sm) var(--spacing-lg);
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border-right: 1px solid var(--border-soft);
  box-shadow: var(--shadow-sm);
  overflow: visible;
  transition: width var(--transition-base), padding var(--transition-base);
  z-index: 90;
}

/* 侧边栏 Logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0 var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-soft);
  cursor: pointer;
}

.sidebar.collapsed .sidebar-logo {
  flex-direction: column;
  justify-content: center;
  padding: var(--spacing-md) 0;
  gap: var(--spacing-sm);
}

.sidebar-logo-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  flex-shrink: 0;
}

.sidebar-logo-text {
  display: flex;
  flex-direction: column;
}

.sidebar-logo-title {
  font-size: 1.125rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
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
  padding: 6px;
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
  scrollbar-gutter: stable;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: 7px 14px;
  border-radius: var(--radius-xl);
  color: var(--text-regular);
  text-decoration: none;
  transition: all var(--transition-base);
  white-space: nowrap;
  font-weight: 500;
}

.nav-item .nav-icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}

.nav-item .nav-icon svg {
  width: 100%;
  height: 100%;
}

.nav-item .nav-label {
  font-size: 0.9375rem;
  letter-spacing: 0.02em;
}

.nav-item:hover {
  background: var(--bg-secondary);
  color: var(--primary-color);
  transform: translateX(4px);
}

.nav-item:hover .nav-icon {
  transform: scale(1.1) translateY(-2px);
  animation: float 2s ease-in-out infinite;
}

.nav-item.active {
  background: var(--primary-color);
  color: #fff;
  font-weight: 600;
  box-shadow: var(--shadow-md);
}

.nav-item.active .nav-icon {
  color: #fff;
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

.nav-section-title,
.nav-section-title-link {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  font-weight: 600;
}
.nav-section-title-link {
  text-decoration: none;
  transition: color 0.15s;
}
.nav-section-title-link:hover {
  color: var(--primary-color, #3b5bdb);
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

/* 学习空间列表：独立滚动区域 */
.nav-space-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  max-height: calc(5 * 40px);
  overflow-y: auto;
  scrollbar-gutter: stable;
}

/* 查看更多空间 */
.nav-space-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  padding: var(--spacing-xs) 0;
  font-size: 0.6875rem;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.15s;
}

.nav-space-more:hover {
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

.nav-item .nav-space-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
}

.space-progress-text {
  font-size: 0.625rem;
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

.space-mini-more {
  text-decoration: none;
  cursor: pointer;
}

.space-mini-more-text {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary, #94a3b8);
  line-height: 1;
}

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

.notif-fab-btn:hover svg {
  animation: bell-swing 1s ease-in-out infinite;
  transform-origin: top center;
}

@keyframes bell-swing {
  0% { transform: rotate(0); }
  20% { transform: rotate(15deg); }
  40% { transform: rotate(-10deg); }
  60% { transform: rotate(5deg); }
  80% { transform: rotate(-2deg); }
  100% { transform: rotate(0); }
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
