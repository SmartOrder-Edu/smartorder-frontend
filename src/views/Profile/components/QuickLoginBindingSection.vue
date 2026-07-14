<template>
  <div class="quick-login-binding-section">
    <h4 class="section-title">快捷登录绑定</h4>
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
