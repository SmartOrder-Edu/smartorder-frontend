<template>
  <section class="complexity-block">
    <div class="lesson-block-header" v-if="block.title">
      <div class="lesson-block-title">{{ block.title }}</div>
    </div>

    <div class="complexity-main">
      <div v-if="time" class="complexity-card primary">
        <span class="metric-label">时间复杂度</span>
        <strong class="metric-value">{{ time }}</strong>
      </div>
      <div v-if="space" class="complexity-card">
        <span class="metric-label">空间复杂度</span>
        <strong class="metric-value">{{ space }}</strong>
      </div>
    </div>

    <div v-if="cases.length" class="complexity-cases">
      <div v-for="item in cases" :key="item.label" class="case-row">
        <span class="case-label">{{ item.label }}</span>
        <strong class="case-value">{{ item.value }}</strong>
        <span v-if="item.description" class="case-description">{{ item.description }}</span>
      </div>
    </div>

    <p v-if="reason" class="complexity-reason">{{ reason }}</p>
    <p v-else-if="block.caption || block.content" class="complexity-reason">
      {{ block.caption || block.content }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LessonSceneAction, TeachingComplexityBoardBlock } from '@/types/study'

const props = defineProps<{
  block: TeachingComplexityBoardBlock
  sceneAction?: LessonSceneAction | null
}>()

const time = computed(() => readScenePayloadString('time') || props.block.time || '')
const space = computed(() => readScenePayloadString('space') || props.block.space || '')
const reason = computed(() => readScenePayloadString('reason') || props.block.reason || '')
const cases = computed(() => {
  const payloadCases = props.sceneAction?.payload?.cases
  if (Array.isArray(payloadCases)) return normalizeCases(payloadCases)
  return normalizeCases(props.block.cases || [])
})

function normalizeCases(values: unknown[]) {
  return values
    .map((value) => {
      if (!value || typeof value !== 'object') return null
      const record = value as Record<string, unknown>
      const label = record.label === undefined ? '' : String(record.label)
      const caseValue = record.value === undefined ? '' : String(record.value)
      const description = record.description === undefined ? '' : String(record.description)
      if (!label && !caseValue) return null
      return { label, value: caseValue, description }
    })
    .filter((value): value is { label: string; value: string; description: string } => !!value)
}

function readScenePayloadString(key: string): string {
  const value = props.sceneAction?.payload?.[key]
  return typeof value === 'string' ? value : ''
}
</script>

<style scoped lang="scss">
.complexity-block {
  display: grid;
  gap: 12px;
}

.lesson-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.lesson-block-title {
  min-width: 0;
  color: #0f172a;
  font-size: 14px;
  font-weight: 760;
  line-height: 1.4;
}

.complexity-main {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.complexity-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border: 1px solid rgba(37, 99, 235, 0.16);
  border-radius: 8px;
  background: #f8fafc;

  &.primary {
    border-color: rgba(15, 118, 110, 0.2);
    background: #ecfdf5;
  }
}

.metric-label {
  color: #64748b;
  font-size: 12px;
  line-height: 1.3;
}

.metric-value {
  color: #0f172a;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 24px;
  line-height: 1.1;
}

.complexity-cases {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.case-row {
  display: grid;
  grid-template-columns: minmax(78px, 0.8fr) minmax(76px, 0.7fr) minmax(0, 2fr);
  gap: 10px;
  align-items: center;
  padding: 9px 12px;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
  font-size: 13px;

  &:last-child {
    border-bottom: 0;
  }
}

.case-label {
  color: #475569;
  font-weight: 650;
}

.case-value {
  color: #0f766e;
  font-family: 'Fira Code', 'Consolas', monospace;
}

.case-description {
  color: #64748b;
  line-height: 1.55;
}

.complexity-reason {
  margin: 0;
  padding: 10px 12px;
  border-left: 3px solid #0f766e;
  border-radius: 0 8px 8px 0;
  background: rgba(20, 184, 166, 0.08);
  color: #475569;
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 640px) {
  .complexity-main {
    grid-template-columns: 1fr;
  }

  .case-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
