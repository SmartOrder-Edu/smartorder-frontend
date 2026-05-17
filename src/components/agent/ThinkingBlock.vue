<template>
  <div class="thinking-block" :class="{ collapsed: !expanded && !streaming }">
    <button class="thinking-header" @click="toggleExpand" :aria-expanded="expanded">
      <span class="thinking-icon">
        <svg v-if="streaming" class="thinking-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/>
          <line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
      </span>
      <span class="thinking-label">
        <template v-if="streaming">思考中...</template>
        <template v-else>思考了 {{ formattedDuration }}</template>
      </span>
      <span class="thinking-chevron">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </span>
    </button>
    <div class="thinking-body" v-show="expanded || streaming">
      <p class="thinking-text">{{ text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  text: string
  durationMs?: number | null
  streaming?: boolean
}>()

const expanded = ref(false)

const formattedDuration = computed(() => {
  if (!props.durationMs) return '...'
  const seconds = props.durationMs / 1000
  if (seconds < 1) return `${props.durationMs}毫秒`
  if (seconds < 60) return `${seconds.toFixed(1)}秒`
  const minutes = Math.floor(seconds / 60)
  const remainSec = Math.floor(seconds % 60)
  return `${minutes}分${remainSec}秒`
})

function toggleExpand() {
  expanded.value = !expanded.value
}
</script>

<style scoped>
.thinking-block {
  margin-bottom: 8px;
  border-radius: 8px;
  background: rgba(59, 91, 219, 0.03);
  border: 1px solid rgba(59, 91, 219, 0.08);
  overflow: hidden;
}

.thinking-header {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 6px 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--text-secondary);
  transition: background 0.15s;
}

.thinking-header:hover {
  background: rgba(59, 91, 219, 0.04);
}

.thinking-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: var(--primary-color);
}

.thinking-spinner {
  animation: think-spin 1.4s linear infinite;
  opacity: 0.7;
}

@keyframes think-spin {
  to { transform: rotate(360deg); }
}

.thinking-label {
  flex: 1;
  text-align: left;
  font-weight: 500;
  color: var(--text-muted);
}

.thinking-chevron {
  display: flex;
  align-items: center;
  color: var(--text-muted);
  opacity: 0.5;
  transition: transform 0.2s;
}

.thinking-block:not(.collapsed) .thinking-chevron {
  transform: rotate(180deg);
}

.thinking-body {
  padding: 0 10px 8px 30px;
  border-top: 1px solid rgba(59, 91, 219, 0.06);
}

.thinking-text {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.6;
  color: var(--text-muted);
  white-space: pre-wrap;
}
</style>
