<template>
  <div class="security-title-container">
    <h3 class="security-title">
      <!-- 盾牌图标 -->
      <svg class="security-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      账号与安全设置
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
  background: #e9eef3;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .security-title {
    padding: 16px 20px 10px;
    font-size: 18px;
  }
  .security-divider {
    margin: 0 20px;
  }
}

/* 深色模式适配 */
html[data-theme='dark'] .security-title {
  color: var(--account-text-primary, #f5f7fa);
}

html[data-theme='dark'] .security-divider {
  background: var(--account-border, #2c3745);
}
</style>
