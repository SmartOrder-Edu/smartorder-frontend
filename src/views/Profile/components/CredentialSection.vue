<template>
  <div class="credential-section">
    <h4 class="section-title">
      <span class="section-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="16" height="16">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </span>
      个人信息
    </h4>
    <div class="credential-grid">
      <!-- 系统昵称 (半宽) -->
      <CredentialCard
        icon-type="username"
        label="系统昵称"
        :value="userInfo.username"
        :show-copy="true"
      />

      <!-- 绑定邮箱 (半宽，带修改入口) -->
      <div class="email-card-wrapper">
        <CredentialCard
          icon-type="email"
          label="绑定邮箱"
          :value="userInfo.email"
          :show-copy="true"
        />
        <button class="email-edit-link" @click="$emit('changeEmail')">修改</button>
      </div>

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

defineEmits<{
  (e: 'changeEmail'): void
}>()
</script>

<style scoped>
.credential-section {
  display: flex;
  flex-direction: column;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 650;
  color: #182230;
  margin: 0 0 20px 0;
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

.email-card-wrapper {
  position: relative;
}

.email-edit-link {
  position: absolute;
  top: 12px;
  right: 14px;
  padding: 0;
  border: none;
  background: none;
  color: #14b8a6;
  font-size: 12px;
  cursor: pointer;
  z-index: 1;
}

.email-edit-link:hover {
  text-decoration: underline;
}

html[data-theme='dark'] .email-edit-link {
  color: #14b8a6;
}

/* 深色模式适配 */
html[data-theme='dark'] .section-title {
  color: var(--account-text-primary, #f5f7fa);
}
</style>
