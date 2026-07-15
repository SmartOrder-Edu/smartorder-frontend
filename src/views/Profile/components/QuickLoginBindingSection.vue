<template>
  <div class="quick-login-binding-section">
    <h4 class="section-title">
      <span class="section-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="16" height="16">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      </span>
      快捷登录绑定
    </h4>
    <div class="binding-list">
      <!-- Gitee 卡片 -->
      <BindingCard
        provider="gitee"
        :bound="giteeBound"
        :provider-info="giteeInfo"
        @bind="emit('bind', 'gitee')"
        @unbind="emit('unbind', 'gitee')"
      />

      <!-- GitHub 卡片 -->
      <BindingCard
        provider="github"
        :bound="githubBound"
        :provider-info="githubInfo"
        @bind="emit('bind', 'github')"
        @unbind="emit('unbind', 'github')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import BindingCard from './BindingCard.vue'

defineProps<{
  giteeBound: boolean
  githubBound: boolean
  giteeInfo?: any
  githubInfo?: any
}>()

const emit = defineEmits<{
  (e: 'bind', provider: 'gitee' | 'github'): void
  (e: 'unbind', provider: 'gitee' | 'github'): void
}>()
</script>

<style scoped>
.quick-login-binding-section {
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

.binding-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* 深色模式适配 */
html[data-theme='dark'] .section-title {
  color: var(--account-text-primary, #f5f7fa);
}
</style>
