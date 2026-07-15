<template>
  <span :class="['binding-status', bound ? 'bound' : 'unbound']">
    {{ bound ? '已绑定' : '未绑定' }}
  </span>
</template>

<script setup lang="ts">
defineProps<{
  bound: boolean
}>()
</script>

<style scoped>
.binding-status {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  margin-left: 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 0;
}

.binding-status.bound {
  color: #16a34a;
  background: #ecfdf3;
  border: 1px solid #bbf7d0;
}

.binding-status.unbound {
  color: #667085;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
}

/* 深色模式适配 */
html[data-theme='dark'] .binding-status.bound {
  color: #4ade80;
  background: rgba(22, 163, 74, 0.15);
  border-color: rgba(74, 222, 128, 0.3);
}

html[data-theme='dark'] .binding-status.unbound {
  color: var(--account-text-secondary, #b4bdca);
  background: rgba(100, 116, 139, 0.15);
  border-color: rgba(148, 163, 184, 0.2);
}
</style>
