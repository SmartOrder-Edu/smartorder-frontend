<template>
  <transition name="bubble-fade">
    <div
      v-if="visible && (status === 'exporting' || status === 'completed' || status === 'failed')"
      class="floating-export-bubble"
      :class="{ 'is-error': status === 'failed', 'is-done': status === 'completed' }"
      @click="$emit('restore')"
    >
      <!-- 图标 -->
      <div class="bubble-icon">
        <template v-if="status === 'exporting'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"
            class="spin">
            <circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" />
          </svg>
        </template>
        <template v-else-if="status === 'completed'">
          <svg viewBox="0 0 24 24" fill="none" stroke="#12b886" stroke-width="2" width="18" height="18">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22,4 12,14.01 9,11.01" />
          </svg>
        </template>
        <template v-else>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" width="18" height="18">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </template>
      </div>

      <!-- 内容 -->
      <div class="bubble-content">
        <p class="bubble-title">
          {{ status === 'completed' ? '打包完成' : status === 'failed' ? '打包失败' : '正在打包...' }}
        </p>
        <p class="bubble-sub" v-if="status === 'exporting'">{{ percent }}% · {{ folderName }}</p>
        <p class="bubble-sub" v-else>{{ folderName }}</p>
      </div>

      <!-- 进度环 -->
      <div class="bubble-progress" v-if="status === 'exporting'">
        <svg viewBox="0 0 32 32" width="32" height="32">
          <circle cx="16" cy="16" r="14" fill="none" stroke="#e5e7eb" stroke-width="3" />
          <circle cx="16" cy="16" r="14" fill="none" stroke="#3b5bdb" stroke-width="3"
            :stroke-dasharray="2 * Math.PI * 14" :stroke-dashoffset="2 * Math.PI * 14 * (1 - percent / 100)"
            stroke-linecap="round" transform="rotate(-90 16 16)" />
        </svg>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import type { ExportStatus } from '@/composables/useExportTask'

defineProps<{
  visible: boolean
  status: ExportStatus
  folderName: string
  percent: number
}>()

defineEmits<{
  restore: []
}>()
</script>

<style scoped>
.floating-export-bubble {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 3000;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  user-select: none;
  max-width: 300px;
  border: 1px solid #e5e7eb;
  transition: transform 0.2s, box-shadow 0.2s;
}

.floating-export-bubble:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.1);
}

.floating-export-bubble.is-error {
  border-color: #fecaca;
  background: #fef2f2;
}

.floating-export-bubble.is-done {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.bubble-icon {
  flex-shrink: 0;
}

.spin {
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.bubble-content {
  flex: 1;
  min-width: 0;
}

.bubble-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bubble-sub {
  font-size: 11px;
  color: #9ca3af;
  margin: 2px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bubble-progress {
  flex-shrink: 0;
}

/* === transition === */
.bubble-fade-enter-active,
.bubble-fade-leave-active {
  transition: all 0.3s ease;
}

.bubble-fade-enter-from,
.bubble-fade-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>
