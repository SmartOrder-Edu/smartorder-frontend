<template>
  <div class="credential-section">
    <div class="section-header">
      <h4 class="section-title">
        <span class="section-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="16" height="16">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </span>
        个人信息
      </h4>
      <div class="header-actions">
        <!-- 编辑信息 -->
        <button class="action-btn edit-btn" @click="emit('edit')" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="12" height="12">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          编辑信息
        </button>
        <!-- 修改邮箱 -->
        <button class="action-btn email-btn" @click="emit('changeEmail')" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="12" height="12">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          修改邮箱
        </button>
      </div>
    </div>
    
    <div class="credential-grid">
      <!-- 系统昵称 (半宽) -->
      <CredentialCard
        icon-type="username"
        label="系统昵称"
        :value="userInfo.username"
        :show-copy="true"
      />

      <!-- 绑定邮箱 (半宽) -->
      <CredentialCard
        icon-type="email"
        label="绑定邮箱"
        :value="userInfo.email"
        :show-copy="true"
      />

      <!-- 个人简介 (整行) -->
      <CredentialCard
        icon-type="bio"
        label="个人简介"
        :value="userInfo.bio"
        :show-copy="false"
        :full-width="true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import CredentialCard from './CredentialCard.vue'

defineProps<{
  userInfo: {
    id: string
    username: string
    email: string
    bio?: string
  }
}>()

const emit = defineEmits<{
  (e: 'changeEmail'): void
  (e: 'edit'): void
}>()
</script>

<style scoped>
.credential-section {
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 650;
  color: #182230;
  margin: 0;
}

.section-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(20, 184, 166, 0.08);
  color: #14b8a6;
  flex-shrink: 0;
}

.section-icon svg {
  display: block;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  box-sizing: border-box;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn svg {
  flex-shrink: 0;
}

/* 编辑信息按钮样式：微带背景或主色 */
.action-btn.edit-btn {
  color: #ffffff;
  background: #14b8a6;
  border: 1px solid #14b8a6;
}

.action-btn.edit-btn:hover {
  background: #0d9488;
  border-color: #0d9488;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.2);
}

.action-btn.edit-btn:active {
  transform: scale(0.96);
}

/* 修改邮箱按钮样式：线框型 */
.action-btn.email-btn {
  color: #14b8a6;
  background: #ffffff;
  border: 1px solid #14b8a6;
}

.action-btn.email-btn:hover {
  background: #ecfdfb;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.1);
}

.action-btn.email-btn:active {
  transform: scale(0.96);
}

.credential-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.full-width {
  grid-column: 1 / -1;
}

/* 响应式 */
@media (max-width: 700px) {
  .credential-grid {
    grid-template-columns: 1fr;
  }
}

/* 深色模式适配 */
html[data-theme='dark'] .section-title {
  color: var(--account-text-primary, #f5f7fa);
}

html[data-theme='dark'] .action-btn.edit-btn {
  background: #14b8a6;
  border-color: #14b8a6;
}

html[data-theme='dark'] .action-btn.edit-btn:hover {
  background: #0d9488;
  border-color: #0d9488;
}

html[data-theme='dark'] .action-btn.email-btn {
  color: #14b8a6;
  background: transparent;
  border-color: #14b8a6;
}

html[data-theme='dark'] .action-btn.email-btn:hover {
  background: rgba(20, 184, 166, 0.15);
}
</style>
