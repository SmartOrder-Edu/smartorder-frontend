<template>
  <div class="credential-section">
    <h4 class="section-title">账户凭证</h4>
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
    bio: string
  }
}>()
</script>

<style scoped>
.credential-section {
  display: flex;
  flex-direction: column;
}

.section-title {
  position: relative;
  padding-left: 18px;
  font-size: 20px;
  font-weight: 650;
  color: #182230;
  margin: 0 0 20px 0;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 3px;
  width: 4px;
  height: 24px;
  border-radius: 999px;
  background: #14b8a6;
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
</style>
