<template>
  <div class="reasoning-process" :class="{ collapsed: !expanded && !streaming, streaming }">
    <button class="reasoning-header" @click="toggleExpand" :aria-expanded="expanded">
      <span class="reasoning-icon">
        <svg v-if="streaming" class="reasoning-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/>
          <line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
      </span>
      <span class="reasoning-label">
        <template v-if="streaming">思考与执行中...</template>
        <template v-else>
          思考与执行过程
          <span class="reasoning-stats" v-if="stepCount > 0">· {{ stepCount }}步</span>
          <span class="reasoning-stats" v-if="formattedDuration">· {{ formattedDuration }}</span>
        </template>
      </span>
      <span class="reasoning-chevron">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </span>
    </button>
    <div class="reasoning-body" v-show="expanded || streaming">
      <!-- 新格式：分段推理序列 -->
      <template v-if="segments.length">
        <template v-for="(seg, segIdx) in segments" :key="'seg-' + segIdx">
          <ThinkingBlock
            v-if="seg.thinkingText"
            :text="seg.thinkingText"
            :streaming="streaming && seg.thinkingStreaming"
          />
          <ToolCallCard v-if="seg.toolCall" v-bind="seg.toolCall" />
        </template>
      </template>
      <!-- 向后兼容：旧格式 -->
      <template v-else>
        <ThinkingBlock
          v-if="thinkingText"
          :text="thinkingText"
          :duration-ms="durationMs"
        />
        <div v-if="toolCalls.length" class="inline-tool-calls">
          <ToolCallCard
            v-for="tc in toolCalls"
            :key="tc.toolName + tc.startedAt"
            v-bind="tc"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ReasoningSegment, ToolCallState } from '@/stores/agent'
import ThinkingBlock from '@/components/agent/ThinkingBlock.vue'
import ToolCallCard from '@/components/agent/ToolCallCard.vue'

const props = defineProps<{
  segments?: ReasoningSegment[]
  thinkingText?: string
  toolCalls?: ToolCallState[]
  streaming?: boolean
  durationMs?: number | null
}>()

const expanded = ref(false)

const stepCount = computed(() => {
  if (props.segments && props.segments.length) {
    let count = 0
    for (const seg of props.segments) {
      if (seg.thinkingText) count++
      if (seg.toolCall) count++
    }
    return count
  }
  let count = 0
  if (props.thinkingText) count++
  count += (props.toolCalls || []).length
  return count
})

const formattedDuration = computed(() => {
  if (!props.durationMs) return ''
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
.reasoning-process {
  margin-bottom: 10px;
  border-radius: 8px;
  background: rgba(59, 91, 219, 0.025);
  border: 1px solid rgba(59, 91, 219, 0.08);
  overflow: hidden;
  transition: background 0.2s;
}

.reasoning-process.streaming {
  background: rgba(59, 91, 219, 0.04);
  border-color: rgba(59, 91, 219, 0.12);
}

.reasoning-header {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--text-secondary);
  transition: background 0.15s;
}

.reasoning-header:hover {
  background: rgba(59, 91, 219, 0.04);
}

.reasoning-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: var(--primary-color, #3b5bdb);
}

.reasoning-spinner {
  animation: rp-spin 1.4s linear infinite;
  opacity: 0.7;
}

@keyframes rp-spin {
  to { transform: rotate(360deg); }
}

.reasoning-label {
  flex: 1;
  text-align: left;
  font-weight: 500;
  color: var(--text-muted);
}

.reasoning-stats {
  font-weight: 400;
  opacity: 0.7;
}

.reasoning-chevron {
  display: flex;
  align-items: center;
  color: var(--text-muted);
  opacity: 0.5;
  transition: transform 0.2s;
}

.reasoning-process:not(.collapsed) .reasoning-chevron {
  transform: rotate(180deg);
}

.reasoning-body {
  padding: 0 8px 6px 8px;
  border-top: 1px solid rgba(59, 91, 219, 0.06);
}

.inline-tool-calls {
  display: flex;
  flex-direction: column;
}
</style>
