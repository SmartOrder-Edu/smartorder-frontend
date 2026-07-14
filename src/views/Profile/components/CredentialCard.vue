<template>
  <div class="credential-card" :class="{ 'full-width': fullWidth }">
    <!-- 左侧圆形背景图标 -->
    <div class="credential-icon" :class="iconType">
      <svg v-if="iconType === 'id'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      <svg v-else-if="iconType === 'username'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      <svg v-else-if="iconType === 'email'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
      <svg v-else-if="iconType === 'bio'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    </div>

    <!-- 中间文字区域 -->
    <div class="credential-info">
      <div class="credential-label">{{ label }}</div>
      <div v-if="iconType === 'bio'" class="credential-value profile-description">
        {{ value || '这个同学很懒，什么都没有写~' }}
      </div>
      <div v-else class="credential-value">
        {{ value || '未设置' }}
      </div>
    </div>

    <!-- 右侧复制按钮 -->
    <CopyButton
      v-if="showCopy && value"
      :text="value"
      :label="label"
    />
  </div>
</template>

<script setup lang="ts">
import CopyButton from './CopyButton.vue'

defineProps<{
  iconType: 'id' | 'username' | 'email' | 'bio'
  label: string
  value: string
  showCopy: boolean
  fullWidth?: boolean
}>()
</script>

<style scoped>
.credential-card {
  min-height: 64px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: #ffffff;
  border: 1px solid #dfe7ee;
  border-radius: 10px;
  box-shadow: 0 3px 8px rgba(31, 45, 61, 0.03);
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
  box-sizing: border-box;
}

.credential-card:hover {
  border-color: rgba(20, 184, 166, 0.42);
  box-shadow: 0 6px 16px rgba(20, 184, 166, 0.05);
  transform: translateY(-0.5px);
}

.credential-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
}

/* 根据类型不同的浅色背景和图标颜色 */
.credential-icon.id {
  background: rgba(59, 130, 246, 0.08);
  color: #3b82f6;
}

.credential-icon.username {
  background: rgba(16, 185, 129, 0.08);
  color: #10b981;
}

.credential-icon.email {
  background: rgba(6, 182, 212, 0.08);
  color: #06b6d4;
}

.credential-icon.bio {
  background: rgba(16, 185, 129, 0.08);
  color: #10b981;
}

.credential-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.credential-label {
  margin-bottom: 2px;
  font-size: 11px;
  color: #667085;
  font-weight: 500;
}

.credential-value {
  font-size: 14px;
  font-weight: 550;
  line-height: 1.35;
  color: #111827;
  word-break: break-all;
}

.profile-description {
  line-height: 1.7;
  color: #344054;
  font-weight: 400;
  font-size: 16px;
}

/* 深色模式适配 */
html[data-theme='dark'] .credential-card {
  background: var(--account-card-bg, #1a222e);
  border-color: var(--account-border, #2c3745);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
}

html[data-theme='dark'] .credential-card:hover {
  background: var(--account-card-hover, #202a37);
  border-color: rgba(20, 184, 166, 0.45);
}

html[data-theme='dark'] .credential-label {
  color: var(--account-text-secondary, #b4bdca);
}

html[data-theme='dark'] .credential-value {
  color: var(--account-text-primary, #f5f7fa);
}

html[data-theme='dark'] .profile-description {
  color: var(--account-text-secondary, #b4bdca);
}

html[data-theme='dark'] .credential-icon.id {
  background: rgba(59, 130, 246, 0.12);
}

html[data-theme='dark'] .credential-icon.username {
  background: rgba(16, 185, 129, 0.12);
}

html[data-theme='dark'] .credential-icon.email {
  background: rgba(6, 182, 212, 0.12);
}

html[data-theme='dark'] .credential-icon.bio {
  background: rgba(16, 185, 129, 0.12);
}
</style>
