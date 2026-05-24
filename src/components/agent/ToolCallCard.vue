<template>
  <div class="tool-call-card" :class="'status-' + status">
    <!-- 轻量状态行 -->
    <div class="tool-call-row">
      <span class="tool-icon">
        <el-icon v-if="status === 'running'" class="tool-spinner"><Loading /></el-icon>
        <el-icon v-else-if="status === 'completed'" class="icon-completed"><CircleCheck /></el-icon>
        <el-icon v-else class="icon-failed"><CircleClose /></el-icon>
      </span>
      <span class="tool-action-text">{{ actionText }}</span>
      <span class="tool-duration" v-if="status !== 'running' && formattedDuration">
        · {{ formattedDuration }}
      </span>
      <button
        v-if="status !== 'running' && hasResultText"
        class="tool-toggle-btn"
        @click="expanded = !expanded"
      >
        <el-icon :class="{ rotated: expanded }"><ArrowDown /></el-icon>
      </button>
    </div>

    <!-- 结果句 + 草稿说明（展开后 / 失败时默认展开） -->
    <div class="tool-result-area" v-if="shouldShowResultArea">
      <div class="tool-result-text" v-if="resultText">{{ resultText }}</div>
      <div class="tool-draft-note" v-if="draftNote && status === 'completed'">
        <el-icon :size="12"><InfoFilled /></el-icon>
        <span>{{ draftNote }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  formatRunningText,
  formatCompletedText,
  formatResultText,
  formatDraftNote,
  formatFailedText,
} from '@/utils/agentToolDisplay'

const props = defineProps<{
  toolName: string
  status: 'running' | 'completed' | 'failed'
  arguments?: any
  result?: any
  durationMs?: number
}>()

const expanded = ref(false)

const actionText = computed(() => {
  if (props.status === 'running') return formatRunningText(props.toolName, props.arguments)
  if (props.status === 'completed') return formatCompletedText(props.toolName, props.arguments)
  return formatFailedText(props.toolName)
})

const resultText = computed(() => {
  if (props.status !== 'completed') return null
  return formatResultText(props.toolName, props.result)
})

const draftNote = computed(() => {
  if (props.status !== 'completed') return null
  return formatDraftNote(props.toolName)
})

const hasResultText = computed(() => {
  return !!(resultText.value || draftNote.value)
})

const shouldShowResultArea = computed(() => {
  if (props.status === 'failed') return false
  if (props.status === 'running') return false
  return expanded.value || hasResultText.value
})

const formattedDuration = computed(() => {
  if (!props.durationMs) return ''
  const ms = props.durationMs
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m${Math.round((ms % 60000) / 1000)}s`
})
</script>

<style scoped>
.tool-call-card {
  margin-bottom: 4px;
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.03);
  border: 1px solid rgba(59, 130, 246, 0.08);
  overflow: hidden;
  font-size: 0.75rem;
}

.tool-call-card.status-failed {
  background: rgba(245, 108, 108, 0.04);
  border-color: rgba(245, 108, 108, 0.12);
}

.tool-call-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
}

.tool-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.icon-completed {
  color: #67c23a;
}

.icon-failed {
  color: #f56c6c;
}

.tool-spinner {
  animation: tool-spin 1.2s linear infinite;
  color: #409eff;
}

@keyframes tool-spin {
  to { transform: rotate(360deg); }
}

.tool-action-text {
  font-weight: 500;
  color: var(--text-dark);
  flex: 1;
  line-height: 1.4;
}

.tool-duration {
  font-size: 0.625rem;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.tool-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--text-muted);
  border-radius: 4px;
  padding: 0;
  transition: background 0.15s;
  flex-shrink: 0;
}

.tool-toggle-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.tool-toggle-btn .el-icon {
  transition: transform 0.2s;
}

.tool-toggle-btn .el-icon.rotated {
  transform: rotate(180deg);
}

/* 结果区域 */
.tool-result-area {
  padding: 0 8px 6px 28px;
  border-top: 1px solid rgba(59, 130, 246, 0.06);
  margin-top: 0;
  padding-top: 4px;
}

.tool-result-text {
  font-size: 0.6875rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.tool-draft-note {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 3px;
  font-size: 0.625rem;
  color: #e6a23c;
}
</style>
