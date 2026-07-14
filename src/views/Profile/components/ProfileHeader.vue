<template>
  <div class="profile-header">
    <div class="header-content">
      <!-- 头像组件 -->
      <AvatarUploader
        :avatar="userInfo.avatar"
        :uploading="uploading"
        @change="handleAvatarChange"
      />

      <!-- 用户详细信息 -->
      <div class="user-profile-info">
        <div class="name-row">
          <h2 class="profile-name">{{ userInfo.name }}</h2>
          <span class="identity-tag" v-if="userInfo.identity">{{ userInfo.identity }}</span>
        </div>

        <div class="meta-row">
          <div class="meta-item" v-if="userInfo.goal">
            <!-- 靶心/目标图标 -->
            <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
            <span class="meta-label">学习目标：</span>
            <span class="meta-value">{{ userInfo.goal }}</span>
          </div>

          <div class="meta-item" v-if="userInfo.weeklyMinutes">
            <!-- 时钟图标 -->
            <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span class="meta-label">学习时间：</span>
            <span class="meta-value">每周 {{ userInfo.weeklyMinutes }} 分钟</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧装饰元素 (盾牌/锁/点阵/光晕) -->
    <div class="header-decorations">
      <!-- 盾牌与锁的装饰线 -->
      <svg class="decor-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <rect x="9" y="11" width="6" height="5" rx="1"/>
        <path d="M10 11V9a2 2 0 1 1 4 0v2"/>
      </svg>
      <!-- 点阵装饰 -->
      <div class="decor-dots"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AvatarUploader from './AvatarUploader.vue'

defineProps<{
  userInfo: {
    name: string
    avatar: string
    identity: string
    goal: string
    weeklyMinutes: number
  }
  uploading: boolean
}>()

const emit = defineEmits<{
  (e: 'avatar-change', event: Event): void
}>()

const handleAvatarChange = (event: Event) => {
  emit('avatar-change', event)
}
</script>

<style scoped>
.profile-header {
  min-height: 180px;
  display: flex;
  align-items: center;
  position: relative;
  padding: 24px 44px;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 88% 45%,
      rgba(45, 212, 191, 0.16),
      transparent 28%
    ),
    linear-gradient(
      135deg,
      #ffffff 0%,
      #f8fcfd 60%,
      #effafa 100%
    );
  border-bottom: 1px solid #e5ebf1;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 24px;
  position: relative;
  z-index: 2;
  flex: 1;
}

.user-profile-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.profile-name {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.3;
  color: #111827;
  margin: 0;
  word-break: break-all;
}

.identity-tag {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  border-radius: 6px;
  color: #16a34a;
  background: #ecfdf3;
  border: 1px solid #bbf7d0;
  font-size: 13px;
  font-weight: 500;
  flex-shrink: 0;
}

.meta-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #374151;
  min-width: 0;
}

.meta-icon {
  width: 16px;
  height: 16px;
  color: #14b8a6;
  margin-right: 8px;
  flex-shrink: 0;
}

.meta-label {
  font-weight: 600;
  color: #1f2937;
  flex-shrink: 0;
  margin-right: 4px;
}

.meta-value {
  color: #4b5563;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 装饰性元素样式 */
.header-decorations {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.decor-shield {
  position: absolute;
  right: 8%;
  top: 50%;
  transform: translateY(-50%);
  width: 130px;
  height: 130px;
  color: rgba(20, 184, 166, 0.08);
}

.decor-dots {
  position: absolute;
  right: 4%;
  top: 15%;
  width: 60px;
  height: 60px;
  background-image: radial-gradient(rgba(20, 184, 166, 0.2) 1.5px, transparent 1.5px);
  background-size: 10px 10px;
  opacity: 0.6;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .profile-header {
    padding: 24px 20px;
  }
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  .name-row {
    justify-content: center;
  }
  .meta-row {
    align-items: center;
  }
  .decor-shield, .decor-dots {
    display: none;
  }
}

/* 深色模式适配 */
html[data-theme='dark'] .profile-header {
  background:
    radial-gradient(
      circle at 88% 45%,
      rgba(20, 184, 166, 0.12),
      transparent 32%
    ),
    linear-gradient(
      135deg,
      #151b25 0%,
      #121820 60%,
      #0d1117 100%
    );
  border-bottom-color: #2c3745;
}

html[data-theme='dark'] .profile-name {
  color: #f5f7fa;
}

html[data-theme='dark'] .identity-tag {
  color: #4ade80;
  background: rgba(22, 163, 74, 0.15);
  border-color: rgba(74, 222, 128, 0.3);
}

html[data-theme='dark'] .meta-item {
  color: #b4bdca;
}

html[data-theme='dark'] .meta-label {
  color: #f5f7fa;
}

html[data-theme='dark'] .meta-value {
  color: #98a2b3;
}

html[data-theme='dark'] .decor-shield {
  color: rgba(20, 184, 166, 0.05);
}
</style>
