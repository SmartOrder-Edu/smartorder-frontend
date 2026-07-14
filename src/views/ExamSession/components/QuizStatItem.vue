<template>
  <div class="stat-box" :class="{ 'full-width': isCoverage }">
    <div class="stat-label">
      <span>{{ label }}</span>
      <el-tooltip v-if="tooltip" :content="tooltip" placement="top">
        <el-icon class="info-icon"><InfoFilled /></el-icon>
      </el-tooltip>
    </div>
    <div class="stat-content">
      <template v-if="!isCoverage">
        <div class="stat-value">
          <slot>{{ value }}</slot>
        </div>
      </template>
      <template v-else>
        <div class="knowledge-tags">
          <slot></slot>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { InfoFilled } from '@element-plus/icons-vue'

defineProps<{
  label: string
  value?: string | number
  tooltip?: string
  isCoverage?: boolean
}>()
</script>

<style scoped>
.stat-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 700;
  color: #667085;
  transition: color 0.3s ease;
}

.info-icon {
  font-size: 14px;
  color: #98a2b3;
  cursor: help;
  transition: color 0.2s ease;
}

.info-icon:hover {
  color: #667085;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: #182230;
  display: flex;
  align-items: baseline;
  line-height: 1.2;
  transition: color 0.3s ease;
}

:deep(.unit) {
  font-size: 14px;
  font-weight: 700;
  color: #667085;
  margin-left: 4px;
  transition: color 0.3s ease;
}

:deep(.text-desc) {
  font-size: 16px;
  font-weight: 750;
  color: #344054;
  transition: color 0.3s ease;
}

.knowledge-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 窄屏或满宽处理 */
.stat-box.full-width {
  grid-column: span 1;
}

@media (max-width: 1024px) {
  .stat-value {
    font-size: 20px;
  }
}

/* 深色模式适配 */
html[data-theme='dark'] .stat-label {
  color: #94a3b8;
}

html[data-theme='dark'] .stat-value {
  color: #f4f7fb;
}

html[data-theme='dark'] :deep(.unit) {
  color: #94a3b8;
}

html[data-theme='dark'] :deep(.text-desc) {
  color: #cbd5e1;
}
</style>
