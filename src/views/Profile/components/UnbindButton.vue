<template>
  <button
    :class="['unbind-button', bound ? 'to-unbind' : 'to-bind']"
    type="button"
    @click="handleClick"
  >
    {{ bound ? '解除绑定' : '立即绑定' }}
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  bound: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const handleClick = () => {
  emit('click')
}
</script>

<style scoped>
.unbind-button {
  min-width: 72px;
  height: 28px;
  margin-left: auto;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  box-sizing: border-box;
}

.unbind-button.to-unbind {
  color: #0f9f91;
  background: #ffffff;
  border: 1px solid #24b9aa;
}

.unbind-button.to-unbind:hover {
  color: #ffffff;
  background: #14b8a6;
  border-color: #14b8a6;
  box-shadow: 0 8px 20px rgba(20, 184, 166, 0.22);
}

.unbind-button.to-bind {
  color: #ffffff;
  background: #14b8a6;
  border: 1px solid #14b8a6;
}

.unbind-button.to-bind:hover {
  background: #0d9488;
  border-color: #0d9488;
  box-shadow: 0 8px 20px rgba(13, 148, 136, 0.22);
}

.unbind-button:active {
  transform: scale(0.96);
}

/* 深色模式适配 */
html[data-theme='dark'] .unbind-button.to-unbind {
  background: transparent;
  color: #24b9aa;
  border-color: #24b9aa;
}

html[data-theme='dark'] .unbind-button.to-unbind:hover {
  color: #ffffff;
  background: #14b8a6;
  border-color: #14b8a6;
  box-shadow: 0 8px 20px rgba(20, 184, 166, 0.3);
}

html[data-theme='dark'] .unbind-button.to-bind {
  background: #14b8a6;
  border-color: #14b8a6;
}

html[data-theme='dark'] .unbind-button.to-bind:hover {
  background: #0d9488;
  border-color: #0d9488;
  box-shadow: 0 8px 20px rgba(13, 148, 136, 0.3);
}
</style>
