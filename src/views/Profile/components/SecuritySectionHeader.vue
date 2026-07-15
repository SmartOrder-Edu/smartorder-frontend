<template>
  <div class="security-title-container">
    <h3 class="security-title">
      <!-- 个人信息图标 -->
      <svg class="security-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      个人信息
    </h3>
    <div class="security-divider"></div>
  </div>
</template>

<style scoped>
.security-title {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 44px 12px;
  font-size: 20px;
  font-weight: 650;
  color: #182230;
  margin: 0;
}

.security-icon {
  width: 22px;
  height: 22px;
  color: #14b8a6;
  flex-shrink: 0;
}

.security-divider {
  height: 1px;
  margin: 0 44px;
  background: linear-gradient(to right, rgba(20, 184, 166, 0.35), #e9eef3 25%, #e9eef3 80%, rgba(233, 238, 243, 0));
}

/* 响应式适配 */
@media (max-width: 768px) {
  .security-title {
    padding: 16px 20px 10px;
    font-size: 18px;
  }
  .security-divider {
    margin: 0 20px;
    background: linear-gradient(to right, rgba(20, 184, 166, 0.35), #e9eef3 15%, #e9eef3 85%, rgba(233, 238, 243, 0));
  }
}

/* 深色模式适配 */
html[data-theme='dark'] .security-title {
  color: var(--account-text-primary, #f5f7fa);
}

html[data-theme='dark'] .security-divider {
  background: linear-gradient(to right, rgba(20, 184, 166, 0.35), var(--account-border, #2c3745) 25%, var(--account-border, #2c3745) 80%, transparent);
}
</style>
