<template>
  <div class="admin-layout" :class="{ 'light-theme': !isDark }">
    <!-- 动态科技背景 (仅在暗黑模式下渲染，保持明亮模式的纯净素雅) -->
    <AnimatedBackground v-if="isDark" />

    <div class="admin-layout-container">
      <!-- 管理端侧边栏 -->
      <aside class="admin-sidebar">
        <!-- Logo 区域 -->
        <div class="admin-logo-container" @click="goHome">
          <img src="/logo.png" alt="知序智学" class="admin-logo-img" />
          <div class="admin-logo-text">
            <span class="admin-logo-title admin-gradient-text">知序智学管理后台</span>
            <span class="admin-logo-subtitle">Admin Portal</span>
          </div>
        </div>

        <!-- 主题切换与返回入口 -->
        <div class="theme-switch-row">
          <span class="theme-label">{{ isDark ? '暗黑科技风' : '优雅明亮风' }}</span>
          <el-button type="primary" link class="theme-toggle-btn" @click="toggleTheme" title="切换黑白主题">
            <el-icon class="theme-toggle-icon">
              <Sunny v-if="isDark" />
              <Moon v-else />
            </el-icon>
          </el-button>
        </div>

        <!-- 侧边导航栏 -->
        <nav class="admin-sidebar-nav">
          <router-link v-for="item in menuItems" :key="item.id" :to="item.path" class="admin-nav-item"
            :class="{ active: isActive(item.path) }">
            <el-icon class="admin-nav-icon">
              <component :is="item.icon" />
            </el-icon>
            <span class="admin-nav-label">{{ item.label }}</span>
          </router-link>

          <div class="admin-nav-divider"></div>

          <!-- 返回用户端 -->
          <router-link to="/dashboard" class="admin-nav-item back-user-btn">
            <el-icon class="admin-nav-icon">
              <Back />
            </el-icon>
            <span class="admin-nav-label">返回学习空间</span>
          </router-link>
        </nav>

        <!-- 管理员信息 -->
        <div class="admin-sidebar-footer">
          <div class="admin-info">
            <img :src="userStore.userInfo?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'"
              alt="头像" class="admin-avatar" />
            <div class="admin-meta">
              <span class="admin-name">{{ userStore.userName || '超级管理员' }}</span>
              <span class="admin-role-badge">SYSTEM ADMIN</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 管理端主内容展示区 -->
      <main class="admin-main-content">
        <div class="admin-page-container">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import AnimatedBackground from '@/components/common/AnimatedBackground.vue'
import {
  Odometer,
  Cpu,
  Connection,
  UserFilled,
  ChatLineRound,
  Present,
  Back,
  Sunny,
  Moon
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 主题状态：默认从 localStorage 获取
const isDark = ref(localStorage.getItem('admin-theme') !== 'light')

// 向所有的子视图组件注入 isDark 状态
provide('isDark', isDark)

const toggleTheme = () => {
  isDark.value = !isDark.value
  localStorage.setItem('admin-theme', isDark.value ? 'dark' : 'light')
}

// 菜单配置
const menuItems = [
  { id: 'dashboard', label: '系统全局大盘', path: '/admin/dashboard', icon: Odometer },
  { id: 'agent', label: '智能体观测中心', path: '/admin/agent', icon: Cpu },
  { id: 'rag', label: 'RAG 引擎监控', path: '/admin/rag', icon: Connection },
  { id: 'users', label: '用户管理', path: '/admin/users', icon: UserFilled },
  { id: 'feedback', label: '用户反馈管理', path: '/admin/feedback', icon: ChatLineRound },
  { id: 'prize', label: '反馈奖品管理', path: '/admin/prize', icon: Present }
]

const isActive = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/')
}

const goHome = () => {
  router.push('/admin/dashboard').catch(() => { })
}
</script>

<style scoped>
/* 声明管理后台的全局 CSS 变量 */
.admin-layout {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;

  /* 暗黑主题变量定义 */
  --admin-bg: #0b0f19;
  --admin-card-bg: rgba(30, 41, 59, 0.35);
  --admin-card-border: rgba(255, 255, 255, 0.08);
  --admin-text-primary: #ffffff;
  --admin-text-secondary: rgba(255, 255, 255, 0.55);
  --admin-sidebar-bg: rgba(15, 23, 42, 0.45);
  --admin-table-header-bg: rgba(15, 23, 42, 0.4);
  --admin-table-hover-bg: rgba(99, 102, 241, 0.08);
  --admin-input-bg: rgba(15, 23, 42, 0.45);
  --admin-input-border: rgba(255, 255, 255, 0.1);
  --admin-pre-bg: #0f172a;
  --admin-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  --admin-accent: #6366f1;

  background-color: var(--admin-bg);
  color: var(--admin-text-primary);
  font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 覆盖明亮主题 (白色背景) 的 CSS 变量 */
.admin-layout.light-theme {
  --admin-bg: #f8fafc;
  --admin-card-bg: rgba(255, 255, 255, 0.75);
  --admin-card-border: rgba(99, 102, 241, 0.08);
  --admin-text-primary: #0f172a;
  --admin-text-secondary: #475569;
  --admin-sidebar-bg: rgba(241, 245, 249, 0.85);
  --admin-table-header-bg: rgba(241, 245, 249, 0.9);
  --admin-table-hover-bg: rgba(99, 102, 241, 0.05);
  --admin-input-bg: #ffffff;
  --admin-input-border: rgba(0, 0, 0, 0.1);
  --admin-pre-bg: #f1f5f9;
  --admin-shadow: 0 10px 30px -10px rgba(99, 102, 241, 0.08);
  --admin-accent: #4f46e5;
}

.admin-layout-container {
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

/* 侧边栏样式 */
.admin-sidebar {
  width: 260px;
  height: 100%;
  background: var(--admin-sidebar-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid var(--admin-card-border);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  transition: background 0.3s ease, border-color 0.3s ease;
}

.admin-logo-container {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--admin-card-border);
}

.admin-logo-img {
  width: 38px;
  height: 38px;
  filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.5));
}

.admin-logo-text {
  display: flex;
  flex-direction: column;
}

.admin-logo-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.admin-gradient-text {
  background: linear-gradient(135deg, #818cf8 0%, #34d399 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.admin-logo-subtitle {
  font-size: 10px;
  color: var(--admin-text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* 主题切换栏 */
.theme-switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  border-bottom: 1px solid var(--admin-card-border);
  background: rgba(0, 0, 0, 0.05);
}

.theme-label {
  font-size: 12px;
  color: var(--admin-text-secondary);
  font-weight: 600;
}

.theme-toggle-btn {
  font-size: 18px;
  padding: 6px;
  color: var(--admin-accent) !important;
  transition: transform 0.3s ease;
}

.theme-toggle-btn:hover {
  transform: rotate(30deg);
}

.admin-sidebar-nav {
  flex: 1;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: var(--admin-text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
}

.admin-nav-item:hover {
  color: var(--admin-text-primary);
  background: rgba(99, 102, 241, 0.05);
  transform: translateX(4px);
}

.admin-nav-item.active {
  color: var(--admin-text-primary);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.04) 100%);
  border: 1px solid rgba(99, 102, 241, 0.2);
  box-shadow: var(--admin-shadow);
}

.admin-nav-icon {
  font-size: 18px;
}

.admin-nav-divider {
  height: 1px;
  background: var(--admin-card-border);
  margin: 16px 0;
}

.back-user-btn {
  margin-top: auto;
  color: #34d399;
}

.back-user-btn:hover {
  background: rgba(52, 211, 153, 0.1);
  color: #34d399;
}

.admin-sidebar-footer {
  padding: 20px;
  border-top: 1px solid var(--admin-card-border);
  background: rgba(0, 0, 0, 0.1);
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(99, 102, 241, 0.2);
  background: #1e293b;
}

.admin-meta {
  display: flex;
  flex-direction: column;
}

.admin-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--admin-text-primary);
}

.admin-role-badge {
  font-size: 9px;
  color: #34d399;
  background: rgba(52, 211, 153, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
  margin-top: 2px;
  align-self: flex-start;
  letter-spacing: 0.5px;
}

/* 主内容区 */
.admin-main-content {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  padding: 30px;
  box-sizing: border-box;
}

.admin-page-container {
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100%;
}
</style>
