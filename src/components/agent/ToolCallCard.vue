<template>
  <div class="tool-call-card" :class="'status-' + status">
    <div class="tool-call-row">
      <span class="tool-icon">
        <svg v-if="status === 'running'" class="tool-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32" />
        </svg>
        <svg v-else-if="status === 'completed'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <polyline points="20,6 9,17 4,12"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </span>
      <span class="tool-name">{{ displayName }}</span>
      <span class="tool-status-tag" :class="status">{{ statusLabel }}</span>
      <span class="tool-duration" v-if="status !== 'running' && formattedDuration">
        {{ formattedDuration }}
      </span>
      <button
        v-if="status !== 'running' && (hasDetail)"
        class="tool-toggle-btn"
        @click="expanded = !expanded"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10" :class="{ rotated: expanded }">
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </button>
    </div>
    <div class="tool-detail" v-if="expanded">
      <div class="tool-detail-section" v-if="argumentsStr">
        <span class="detail-label">入参</span>
        <pre class="detail-code">{{ argumentsStr }}</pre>
      </div>
      <div class="tool-detail-section" v-if="resultStr">
        <span class="detail-label">结果</span>
        <pre class="detail-code">{{ resultStr }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  toolName: string
  status: 'running' | 'completed' | 'failed'
  arguments?: any
  result?: any
  durationMs?: number
}>()

const expanded = ref(false)

const displayName = computed(() => {
  const nameMap: Record<string, string> = {
    'profile_tool': '查询学习画像',
    'learning_plan_tool': '生成学习计划',
    'resource_gen_tool': '生成学习资源',
    'assessment_tool': '生成练习题',
    'knowledge_search_tool': '搜索知识库',
  }
  return nameMap[props.toolName] || props.toolName
})

const statusLabel = computed(() => {
  if (props.status === 'running') return '运行中'
  if (props.status === 'completed') return '完成'
  return '失败'
})

const formattedDuration = computed(() => {
  if (!props.durationMs) return ''
  const ms = props.durationMs
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m${Math.round((ms % 60000) / 1000)}s`
})

const hasDetail = computed(() => {
  return !!(props.arguments || props.result)
})

const argumentsStr = computed(() => {
  if (!props.arguments) return ''
  try {
    return typeof props.arguments === 'string' ? props.arguments : JSON.stringify(props.arguments, null, 2)
  } catch {
    return String(props.arguments)
  }
})

const resultStr = computed(() => {
  if (!props.result) return ''
  try {
    return typeof props.result === 'string' ? props.result : JSON.stringify(props.result, null, 2)
  } catch {
    return String(props.result)
  }
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
  padding: 4px 8px;
}

.tool-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.status-completed .tool-icon {
  color: #67c23a;
}

.status-running .tool-icon {
  color: #409eff;
}

.status-failed .tool-icon {
  color: #f56c6c;
}

.tool-spinner {
  animation: tool-spin 1.2s linear infinite;
}

@keyframes tool-spin {
  to { transform: rotate(360deg); }
}

.tool-name {
  font-weight: 500;
  color: var(--text-dark);
  flex: 1;
}

.tool-status-tag {
  font-size: 0.625rem;
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: 500;
}

.tool-status-tag.running {
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.tool-status-tag.completed {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.tool-status-tag.failed {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.tool-duration {
  font-size: 0.625rem;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
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
}

.tool-toggle-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.tool-toggle-btn svg {
  transition: transform 0.2s;
}

.tool-toggle-btn svg.rotated {
  transform: rotate(180deg);
}

.tool-detail {
  padding: 0 8px 6px 28px;
  border-top: 1px solid rgba(59, 130, 246, 0.06);
}

.tool-detail-section {
  margin-top: 6px;
}

.detail-label {
  font-size: 0.625rem;
  color: var(--text-muted);
  display: block;
  margin-bottom: 2px;
}

.detail-code {
  margin: 0;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  font-size: 0.6875rem;
  font-family: 'Fira Code', 'Consolas', monospace;
  line-height: 1.5;
  max-height: 160px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--text-dark);
}
</style>
