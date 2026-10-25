<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="440px"
    top="25vh"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="status === 'completed' || status === 'failed' || status === 'cancelled'"
    @update:model-value="$emit('update:visible', $event)"
    @closed="$emit('closed')"
  >
    <div class="export-progress-body">
      <!-- 进度条 -->
      <el-progress
        :percentage="percent"
        :status="progressStatus"
        :stroke-width="12"
        :text-inside="false"
      />

      <!-- 文件计数 -->
      <div class="export-stats">
        <span class="stat-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
          </svg>
          {{ processedFiles }} / {{ totalFiles }} 个文件
        </span>
        <span class="stat-item" v-if="totalBytes > 0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
          {{ formatSize(processedBytes) }} / {{ formatSize(totalBytes) }}
        </span>
      </div>

      <!-- 状态文本 -->
      <p class="export-status-text">{{ statusText }}</p>
    </div>

    <template #footer>
      <div class="export-dialog-footer">
        <template v-if="status === 'exporting'">
          <el-button @click="$emit('cancel')" :loading="false">取消打包</el-button>
          <el-button type="primary" @click="$emit('minimize')">后台运行</el-button>
        </template>
        <template v-else-if="status === 'completed'">
          <el-button type="primary" @click="$emit('update:visible', false)">完成</el-button>
        </template>
        <template v-else-if="status === 'failed'">
          <el-button @click="$emit('update:visible', false)">关闭</el-button>
        </template>
        <template v-else>
          <el-button @click="$emit('update:visible', false)">关闭</el-button>
        </template>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ExportStatus } from '@/composables/useExportTask'

const props = defineProps<{
  visible: boolean
  status: ExportStatus
  folderName: string
  percent: number
  processedFiles: number
  totalFiles: number
  processedBytes: number
  totalBytes: number
  errorMessage: string
}>()

defineEmits<{
  'update:visible': [value: boolean]
  cancel: []
  minimize: []
  closed: []
}>()

const dialogTitle = computed(() => {
  if (props.status === 'completed') return '打包完成'
  if (props.status === 'failed') return '打包失败'
  if (props.status === 'cancelled') return '已取消'
  return `正在打包「${props.folderName}」`
})

const progressStatus = computed(() => {
  if (props.status === 'completed') return 'success' as const
  if (props.status === 'failed') return 'exception' as const
  if (props.status === 'cancelled') return 'warning' as const
  return undefined
})

const statusText = computed(() => {
  switch (props.status) {
    case 'exporting':
      return '正在压缩文件，请耐心等待...'
    case 'completed':
      return '打包完成，浏览器正在下载...'
    case 'failed':
      return props.errorMessage || '打包失败，请重试'
    case 'cancelled':
      return '打包已取消'
    default:
      return ''
  }
})

function formatSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}
</script>

<style scoped>
.export-progress-body {
  padding: 8px 0;
}

.export-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  font-size: 13px;
  color: #606266;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.export-status-text {
  margin-top: 12px;
  text-align: center;
  font-size: 13px;
  color: #909399;
}

.export-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
