<template>
  <div class="app-layout">
    <!-- 动态背景 -->
    <AnimatedBackground />

    <div class="layout-container" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <!-- 左侧边栏 -->
      <aside 
        class="sidebar" 
        :class="{ collapsed: sidebarCollapsed }"
        @mouseenter="sidebarHovered = true"
        @mouseleave="sidebarHovered = false"
      >
        <!-- Logo / 展开控制区 -->
        <div 
          class="sidebar-logo-container"
          :class="{ 'is-collapsed': sidebarCollapsed }"
        >
          <!-- 非折叠状态下正常显示 Logo 和折叠按钮 -->
          <div v-if="!sidebarCollapsed" class="sidebar-logo" @click="goHome">
            <img src="/logo.png" alt="知序智学" class="sidebar-logo-img" />
            <div class="sidebar-logo-text">
              <span class="sidebar-logo-title gradient-text">知序智学</span>
              <span class="sidebar-logo-subtitle">AI Learning OS</span>
            </div>
            <button class="collapse-btn" @click.stop="handleCollapse" title="收起侧边栏">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
            </button>
          </div>

          <!-- 折叠状态下 -->
          <div v-else class="sidebar-logo-collapsed">
            <!-- 鼠标悬停在侧边栏区域时显示“打开边栏”图标，否则显示星星 Logo -->
            <el-tooltip
              :disabled="!sidebarCollapsed || !sidebarHovered"
              content="打开边栏"
              placement="right"
              effect="dark"
              :show-after="50"
            >
              <div class="sidebar-logo-collapsed-inner" @click.stop="handleLogoClick">
                <transition name="fade-icon" mode="out-in">
                  <div v-if="sidebarHovered" class="expand-action-btn" key="expand">
                    <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M9 3v18" />
                      <path d="m14 9 3 3-3 3" />
                    </svg>
                  </div>
                  
                  <div v-else class="sidebar-logo-mini" key="logo">
                    <img src="/logo.png" alt="知序智学" class="sidebar-logo-img" />
                  </div>
                </transition>
              </div>
            </el-tooltip>
          </div>
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
            <AnimatedIcon :type="item.type" :isActive="isActive(item.path)" />
            <span class="nav-label" v-if="!sidebarCollapsed">{{ item.label }}</span>
          </router-link>

          <div class="nav-divider" v-if="!sidebarCollapsed"></div>

          <!-- 学习空间 -->
          <div class="space-workspace" v-if="!sidebarCollapsed">
            <div class="space-workspace-header">
              <div class="space-workspace-title">
                <span class="space-title-icon">
                  <AnimatedIcon type="spaces" :isActive="isSpacesRoute" />
                </span>
                <div class="space-title-copy">
                  <router-link to="/spaces" class="space-title-link">学习空间</router-link>
                  <span class="space-title-meta">{{ spaceStore.spaceCount }} 个进行中</span>
                </div>
              </div>
              <button class="space-create-btn" @click="showCreateSpace = true" title="新建学习空间">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>

            <div class="space-empty" v-if="!spaceStore.loading && displayedSpaces.length === 0">
              <span>还没有进行中的空间</span>
              <button @click="showCreateSpace = true">新建</button>
            </div>

            <div class="nav-space-list" v-else>
              <router-link
                v-for="space in displayedSpaces"
                :key="space.id"
                :to="`/space/${space.id}`"
                class="nav-space-card"
                :class="[`health-${space.healthStatus}`, { active: isActiveSpace(space.id) }]"
                :title="space.name"
              >
                <span class="space-row-dot" :style="{ background: space.color }"></span>
                <span class="space-row-name">{{ space.name }}</span>
                <span class="space-row-meta" :class="space.healthStatus">
                  {{ formatProgress(space.progress) }}%
                </span>
              </router-link>
            </div>

            <div class="space-workspace-footer">
              <router-link
                to="/spaces"
                class="space-manage-link"
              >
                <span>{{ hiddenSpaceCount > 0 ? `查看全部，还有 ${hiddenSpaceCount} 个` : '管理全部空间' }}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9,6 15,12 9,18"/>
                </svg>
              </router-link>
            </div>
          </div>
          <div class="nav-section-mini space-mini-rail" v-else>
            <router-link
              to="/spaces"
              class="nav-item space-mini-home"
              :class="{ active: isSpacesRoute }"
              :title="`学习空间${spaceStore.spaceCount ? `（${spaceStore.spaceCount} 个进行中）` : ''}`"
            >
              <AnimatedIcon type="spaces" :isActive="isSpacesRoute" />
              <span v-if="spaceStore.spaceCount > 0" class="space-mini-count">{{ spaceStore.spaceCount }}</span>
            </router-link>
            <div class="nav-item space-mini-add" title="新建学习空间" @click="showCreateSpace = true">
              <span class="space-mini-plus">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
            <AnimatedIcon :type="item.type" :isActive="isActive(item.path)" />
            <span class="nav-label" v-if="!sidebarCollapsed">{{ item.label }}</span>
          </router-link>
        </nav>

        <div class="sidebar-footer">
          <!-- 用户区 -->
          <div class="sidebar-user" v-if="!sidebarCollapsed">
            <div class="sidebar-user-info" @click="showUserMenu = !showUserMenu">
              <div class="sidebar-avatar-wrap">
                <img :src="userStore.userInfo?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'" alt="头像" class="sidebar-avatar" />
                <span v-if="!userStore.profileInitialized" class="profile-dot" title="画像未完善"></span>
              </div>
              <span class="sidebar-username">{{ userStore.userName || '用户' }}</span>
            </div>
          </div>
          <div class="sidebar-user-mini" v-else>
            <div class="sidebar-avatar-wrap">
              <img :src="userStore.userInfo?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'" alt="头像" class="sidebar-avatar-mini" @click="showUserMenu = !showUserMenu" />
              <span v-if="!userStore.profileInitialized" class="profile-dot-mini" title="画像未完善"></span>
            </div>
          </div>

          <!-- 用户下拉菜单 -->
          <transition name="slide-up">
            <div class="sidebar-user-menu" v-if="showUserMenu" :class="{ 'is-collapsed': sidebarCollapsed }">
              <button
                v-if="!userStore.profileInitialized"
                class="user-menu-item profile-init-item"
                @click="goOnboarding"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                完善学习画像
              </button>
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
import AnimatedBackground from '@/components/common/AnimatedBackground.vue'
import AnimatedIcon from '@/components/common/AnimatedIcon.vue'

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

const sidebarHovered = ref(false)

const handleLogoClick = () => {
  if (sidebarCollapsed.value) {
    sidebarCollapsed.value = false
    sidebarHovered.value = false
  } else {
    goHome()
  }
}

const handleCollapse = () => {
  sidebarCollapsed.value = true
  sidebarHovered.value = false
  setTimeout(() => {
    const sidebarEl = document.querySelector('.sidebar')
    if (sidebarEl && sidebarEl.matches(':hover')) {
      sidebarHovered.value = true
    }
  }, 50)
}

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

const isSpacesRoute = computed(() => route.path === '/spaces' || route.name === 'LearningSpace')

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

const hiddenSpaceCount = computed(() => {
  return Math.max(spaceStore.activeSpaces.length - displayedSpaces.value.length, 0)
})

const formatProgress = (progress: number | null | undefined) => {
  const value = Math.round(Number(progress) || 0)
  return Math.min(100, Math.max(0, value))
}

const topMenuItems = [
  { id: 'dashboard', label: '总学习指挥台', path: '/dashboard', type: 'dashboard' },
  { id: 'ai-partner', label: 'AI 学习伙伴', path: '/ai-tutor', type: 'ai-tutor' },
  { id: 'daily-plan', label: '今日总计划', path: '/daily-plan', type: 'daily-plan' },
  { id: 'messages', label: '消息', path: '/messages', type: 'messages' }
]

const bottomMenuItems = [
  { id: 'tasks', label: '任务日程', path: '/tasks', type: 'tasks' },
  { id: 'resources', label: '资源广场', path: '/resources', type: 'resources' },
  { id: 'knowledge-base', label: '知识库管理', path: '/knowledge-base', type: 'knowledge-base' },
  { id: 'exam', label: '练习测评', path: '/exam', type: 'exam' },
  { id: 'profile', label: '成长画像', path: '/profile', type: 'profile' },
  { id: 'cloud-drive', label: '个人云盘', path: '/cloud-drive', type: 'cloud-drive' }
]

const isActive = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/')
}

const isActiveSpace = (spaceId: string) => {
  return String(route.params.spaceId || '') === String(spaceId)
}

const goHome = () => {
  if (route.path !== '/ai-tutor') {
    router.push('/ai-tutor').catch(() => {})
  }
}
const goOnboarding = () => {
  showUserMenu.value = false
  router.push('/onboarding')
}
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
  router.push('/feedback')
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

/* 动态背景效果 */
.app-layout::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.12), transparent),
    radial-gradient(ellipse 60% 40% at 80% 60%, rgba(139, 92, 246, 0.1), transparent),
    radial-gradient(ellipse 50% 30% at 20% 80%, rgba(59, 130, 246, 0.08), transparent),
    radial-gradient(ellipse 40% 30% at 90% 20%, rgba(236, 72, 153, 0.06), transparent);
  z-index: -1;
  animation: bg-shift 20s ease-in-out infinite alternate;
  pointer-events: none;
}

@keyframes bg-shift {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(20deg); }
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
  background: #ffffff;
  border-right: 1px solid rgba(139, 92, 246, 0.15);
  box-shadow:
    4px 0 30px rgba(139, 92, 246, 0.1),
    inset -1px 0 0 rgba(255, 255, 255, 0.5);
  overflow: visible;
  transition: width var(--transition-base), padding var(--transition-base);
  z-index: 90;
}

/* 新的 Logo 容器 */
.sidebar-logo-container {
  margin-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-soft);
  height: 64px; 
  display: flex;
  align-items: center;
  transition: all var(--transition-base);
}

.sidebar-logo-container.is-collapsed {
  justify-content: center;
  border-bottom: none; /* 折叠时去除底边框 */
  margin-bottom: 0;
  height: 64px;
}

/* 侧边栏 Logo */
.sidebar-logo {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  width: 100%;
  padding: 8px 12px;
  border-radius: 16px;
  transition: all 0.3s ease;
}



/* 折叠后的 Logo 区域 */
.sidebar-logo-collapsed {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* 折叠后的 Logo 区域内部包裹层 */
.sidebar-logo-collapsed-inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* 迷你 Logo 状态 */
.sidebar-logo-mini {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  transition: all var(--transition-base);
}

/* 打开边栏的 Hover 动作按钮 */
.expand-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-xl);
  background: var(--bg-secondary);
  color: var(--primary-color);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-soft);
  transition: all var(--transition-base);
}

.expand-action-btn:hover {
  background: var(--primary-color);
  color: #ffffff;
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

.expand-icon {
  width: 20px;
  height: 20px;
  transition: transform var(--transition-base);
}

.expand-action-btn:hover .expand-icon {
  transform: translateX(1px);
}

/* 图标淡入淡出动画 */
.fade-icon-enter-active,
.fade-icon-leave-active {
  transition: opacity 0.08s cubic-bezier(0.4, 0, 0.2, 1), transform 0.08s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-icon-enter-from,
.fade-icon-leave-to {
  opacity: 0;
  transform: scale(0.92);
}

.sidebar-logo-img {
  position: relative;
  width: 44px;
  height: 44px;
  object-fit: contain;
  flex-shrink: 0;
  z-index: 1;
  transition: all 0.3s ease;
}



.sidebar-logo-text {
  position: relative;
  z-index: 1;
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
  background-clip: text;
  filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.3));
}

.sidebar-logo-subtitle {
  font-size: 0.5625rem;
  color: var(--text-muted);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: 10px 14px;
  border-radius: var(--radius-xl);
  color: var(--text-regular);
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  font-weight: 500;
  overflow: hidden;
}

/* 动态图标容器：纯布局，视觉由AnimatedIcon组件自身管理 */


.nav-item .nav-label {
  font-size: 0.9375rem;
  letter-spacing: 0.02em;
}

.nav-item:hover {
  background: rgba(139, 92, 246, 0.12);
  color: #8b5cf6;
  transform: translateX(4px);
}

.nav-item:hover .nav-icon {
  background: rgba(139, 92, 246, 0.2);
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.4);
}

.nav-item:hover .nav-icon svg {
  transform: scale(1.1);
}

.nav-item.active {
  background: rgba(139, 92, 246, 0.12);
  color: #8b5cf6;
  font-weight: 600;
  box-shadow: none;
}

/* 选中态下图标跟随文字颜色，不强制变白 */
.nav-item.active :deep(.animated-icon.active) svg,
.nav-item.active :deep(.animated-icon.active) svg * {
  stroke: currentColor !important;
}
.nav-item.active :deep(.animated-icon.active) svg circle[fill="currentColor"] {
  fill: currentColor !important;
}

.nav-item.active .nav-icon {
  background: rgba(255, 255, 255, 0.2);
  box-shadow:
    0 0 20px rgba(255, 255, 255, 0.3),
    inset 0 0 10px rgba(255, 255, 255, 0.1);
}

.nav-item.active .nav-icon svg {
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8));
}

/* 导航分隔线 */
.nav-divider {
  position: relative;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(139, 92, 246, 0.3) 50%,
    transparent 100%
  );
  margin: var(--spacing-md) 0;
}

.nav-divider::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 4px;
  background: var(--gradient-primary);
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.6);
}

/* 学习空间工作区 */
.space-workspace {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border: 1px solid rgba(11, 183, 170, 0.14);
  border-radius: 12px;
  background:
    linear-gradient(180deg, rgba(236, 253, 251, 0.9) 0%, rgba(255, 255, 255, 0.95) 44%),
    #ffffff;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
}

.space-workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.space-workspace-title {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}

.space-title-icon {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(11, 183, 170, 0.1);
  color: var(--primary-color);
  flex-shrink: 0;
}

.space-title-icon :deep(.animated-icon) {
  width: 24px;
  height: 24px;
}

.space-title-icon :deep(.animated-icon svg) {
  width: 18px;
  height: 18px;
}

.space-title-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;
}

.space-title-link {
  width: fit-content;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-dark);
  text-decoration: none;
}

.space-title-link:hover {
  color: var(--primary-color);
}

.space-title-meta {
  margin-top: 2px;
  font-size: 0.625rem;
  color: var(--text-muted);
}

.space-create-btn {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  color: var(--primary-color);
  background: #ffffff;
  border: 1px solid rgba(11, 183, 170, 0.18);
  box-shadow: var(--shadow-xs);
  transition: all var(--transition-fast);
}

.space-create-btn svg {
  width: 14px;
  height: 14px;
}

.space-create-btn:hover {
  color: #ffffff;
  background: var(--primary-color);
  border-color: var(--primary-color);
  box-shadow: 0 8px 16px rgba(11, 183, 170, 0.22);
}

.space-empty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 42px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(248, 250, 252, 0.9);
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.space-empty button {
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 7px;
  background: rgba(11, 183, 170, 0.1);
  color: var(--primary-color);
  font-size: 0.75rem;
  font-weight: 600;
}

.nav-space-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 210px;
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding-right: 1px;
}

.nav-space-card {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 36px;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 9px;
  color: var(--text-primary);
  text-decoration: none;
  background: transparent;
  border: 1px solid transparent;
  overflow: hidden;
  transition: background var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
}

.nav-space-card:hover {
  transform: translateX(2px);
  background: rgba(11, 183, 170, 0.06);
  border-color: rgba(11, 183, 170, 0.12);
  box-shadow: none;
}

.nav-space-card.active {
  background: rgba(11, 183, 170, 0.1);
  border-color: rgba(11, 183, 170, 0.18);
  box-shadow: inset 3px 0 0 var(--primary-color);
}

.space-row-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.1);
}

.nav-space-card.health-warning .space-row-dot,
.nav-space-card.health-danger .space-row-dot {
  animation: blink-warn 1.4s ease-in-out infinite;
}

.space-row-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
  font-size: 0.75rem;
  font-weight: 600;
}

.nav-space-card.active .space-row-name {
  color: var(--text-dark);
}

.space-row-meta {
  flex-shrink: 0;
  min-width: 34px;
  text-align: right;
  color: var(--text-muted);
  font-size: 0.625rem;
  font-weight: 700;
  line-height: 1;
}

.space-row-meta.warning {
  color: #b45309;
}

.space-row-meta.danger {
  color: #dc2626;
}

.space-row-meta.good {
  color: #059669;
}

.space-workspace-footer {
  padding-top: 2px;
}

.space-manage-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 8px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.6875rem;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.space-manage-link svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.space-manage-link:hover {
  color: var(--primary-color);
  background: rgba(11, 183, 170, 0.07);
}

/* 收起时的学习空间轨道 */
.nav-section-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: var(--spacing-xs) 0;
}

.space-mini-rail {
  padding: 8px 0;
  border-top: 1px solid var(--border-soft);
  border-bottom: 1px solid var(--border-soft);
}

.space-mini-home :deep(.animated-icon) {
  width: 30px;
  height: 30px;
}

.space-mini-home :deep(.animated-icon svg) {
  width: 22px;
  height: 22px;
}

.space-mini-home {
  position: relative;
}

.space-mini-count {
  position: absolute;
  right: 7px;
  top: 5px;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--primary-color);
  color: #ffffff;
  border: 1px solid #ffffff;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
}

.space-mini-add {
  cursor: pointer;
}

.space-mini-plus {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
}

.space-mini-plus svg {
  width: 16px;
  height: 16px;
}

.space-mini-add:hover .space-mini-plus {
  background: rgba(11, 183, 170, 0.1);
  color: var(--primary-color);
}

@keyframes blink-warn {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}

.sidebar-footer {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-md);
  margin-top: var(--spacing-sm);
  border-top: 1px solid rgba(139, 92, 246, 0.15);
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(139, 92, 246, 0.03) 100%
  );
}

.collapse-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-lg);
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.15);
  cursor: pointer;
  color: var(--cyber-purple);
  margin-left: auto;
  flex-shrink: 0;
  transition: all 0.3s ease;
  overflow: hidden;
}

.collapse-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--gradient-primary);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.collapse-btn svg {
  position: relative;
  z-index: 1;
  width: 18px;
  height: 18px;
  transition: all 0.3s ease;
}

.collapse-btn:hover {
  background: var(--gradient-primary);
  color: white;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
  transform: scale(1.05);
}

.collapse-btn:hover::before {
  opacity: 1;
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
}

.sidebar-user-info:hover {
  background: var(--background-color-base);
}

.sidebar-avatar-wrap {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
}

.profile-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f59e0b;
  border: 2px solid white;
}

.profile-dot-mini {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f59e0b;
  border: 2px solid white;
}

.sidebar-avatar {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid var(--primary-color);
  transition: all 0.3s ease;
}

.sidebar-avatar:hover {
  border-color: var(--primary-color);
}

.sidebar-username {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #000000;
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
  width: 42px;
  height: 42px;
  border-radius: var(--radius-full);
  background: var(--color-card-bg);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  box-shadow:
    0 4px 20px rgba(139, 92, 246, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.notif-fab-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--gradient-primary);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.notif-fab-btn:hover {
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow:
    0 0 25px rgba(139, 92, 246, 0.4),
    0 0 50px rgba(139, 92, 246, 0.2);
  transform: scale(1.08);
}

.notif-fab-btn:hover::before {
  opacity: 0.1;
}

.notif-fab-btn:hover svg {
  color: #8b5cf6;
  filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.6));
  animation: bell-bounce 0.6s ease-in-out;
}

@keyframes bell-bounce {
  0%, 100% { transform: rotate(0) scale(1); }
  25% { transform: rotate(15deg) scale(1.1); }
  50% { transform: rotate(-10deg) scale(1.05); }
  75% { transform: rotate(5deg) scale(1.02); }
}

.notif-fab-btn svg {
  position: relative;
  z-index: 1;
  width: 20px;
  height: 20px;
  transition: all 0.3s ease;
}

/* 未读状态脉冲动画 */
.notif-fab.has-unread .notif-fab-btn {
  border-color: rgba(139, 92, 246, 0.5);
  color: #8b5cf6;
  animation: notif-pulse-enhanced 2s ease-in-out infinite;
}

@keyframes notif-pulse-enhanced {
  0%, 100% {
    box-shadow:
      0 4px 20px rgba(139, 92, 246, 0.15),
      0 0 0 0 rgba(139, 92, 246, 0.4);
  }
  50% {
    box-shadow:
      0 4px 20px rgba(139, 92, 246, 0.15),
      0 0 0 10px rgba(139, 92, 246, 0);
  }
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
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}

.notif-panel-item:hover {
  background: var(--background-color-base);
}

.notif-panel-item.unread {
  background: rgba(99, 102, 241, 0.05);
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

/* 侧边栏收起时，菜单需要扩展到侧边栏外部 */
.sidebar-user-menu.is-collapsed {
  left: 0;
  width: 200px;
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
}

.user-menu-item:hover {
  background: var(--background-color-base);
}

.user-menu-item.logout {
  color: var(--danger-color);
}

.user-menu-item.logout:hover {
  background: rgba(239, 68, 68, 0.06);
}

.user-menu-item.profile-init-item {
  color: #f59e0b;
}

.user-menu-item.profile-init-item:hover {
  background: rgba(245, 158, 11, 0.06);
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
  overflow-x: hidden;
  padding: var(--spacing-xl) var(--spacing-2xl) var(--spacing-xl) var(--spacing-2xl);
  scrollbar-gutter: stable;
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
