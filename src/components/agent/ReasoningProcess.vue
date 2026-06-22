<template>
  <div class="reasoning-process" :class="{ collapsed: !expanded && !streaming, streaming }">
    <button class="reasoning-header" @click="toggleExpand" :aria-expanded="expanded">
      <span class="reasoning-icon">
        <svg v-if="streaming" class="reasoning-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">
          <circle cx="12" cy="12" r="10" stroke-dasharray="48" stroke-dashoffset="32" stroke-linecap="round" />
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
          <span class="reasoning-title">思考与执行过程</span>
          <span class="reasoning-stats-group">
            <span class="reasoning-stats" v-if="stepCount > 0">
              <span class="stats-sep">·</span>
              <span class="stats-num">{{ stepCount }}</span>
              <span class="stats-unit">步</span>
            </span>
            <span class="reasoning-stats" v-if="formattedDuration">
              <span class="stats-sep">·</span>
              <span class="stats-num">{{ formattedDuration }}</span>
            </span>
          </span>
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
  border-radius: 10px;
  background: rgba(11, 183, 170, 0.035);
  border: 1px solid rgba(11, 183, 170, 0.1);
  overflow: hidden;
  transition: background 0.2s, border-color 0.2s;
}

.reasoning-process.streaming {
  background: rgba(11, 183, 170, 0.055);
  border-color: rgba(11, 183, 170, 0.16);
}

.reasoning-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  transition: background 0.15s;
}

.reasoning-header:hover {
  background: rgba(11, 183, 170, 0.05);
}

.reasoning-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: #3b5bdb;
}

.reasoning-spinner {
  animation: rp-spin 1.2s linear infinite;
}

@keyframes rp-spin {
  to { transform: rotate(360deg); }
}

.reasoning-label {
  flex: 1;
  text-align: left;
  font-weight: 600;
  font-size: 0.8125rem;
  color: var(--text-dark, #303133);
  letter-spacing: 0.01em;
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.reasoning-title {
  flex-shrink: 0;
}

.reasoning-stats-group {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  flex-shrink: 0;
}

.reasoning-stats {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  font-weight: 400;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.stats-sep {
  opacity: 0.5;
  margin-right: 1px;
}

.stats-num {
  display: inline-block;
  min-width: 2.4em;
  text-align: left;
  font-variant-numeric: tabular-nums;
}

.stats-unit {
  margin-left: -1px;
}

.reasoning-chevron {
  display: flex;
  align-items: center;
  color: var(--text-muted);
  opacity: 0.55;
  transition: transform 0.2s;
}

.reasoning-process:not(.collapsed) .reasoning-chevron {
  transform: rotate(180deg);
}

.reasoning-body {
  padding: 4px 8px 8px 8px;
  border-top: 1px solid rgba(11, 183, 170, 0.08);
  position: relative;
}

/* 左侧 timeline 竖线 */
.reasoning-body::before {
  content: '';
  position: absolute;
  left: 18px;
  top: 8px;
  bottom: 8px;
  width: 1px;
  background: linear-gradient(
    to bottom,
    rgba(11, 183, 170, 0.18) 0%,
    rgba(11, 183, 170, 0.1) 100%
  );
  pointer-events: none;
}

.inline-tool-calls {
  display: flex;
  flex-direction: column;
}
</style>
