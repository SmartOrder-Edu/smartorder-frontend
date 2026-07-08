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

    <div v-if="cases.length" class="complexity-cases" role="table" aria-label="复杂度分场景说明">
      <div class="case-row case-head" role="row">
        <span role="columnheader">{{ caseHeaders.label }}</span>
        <span role="columnheader">{{ caseHeaders.value }}</span>
        <span role="columnheader">{{ caseHeaders.description }}</span>
      </div>
      <div v-for="item in cases" :key="item.label" class="case-row" role="row">
        <span class="case-label" role="cell">{{ item.label }}</span>
        <strong class="case-value" :data-label="caseHeaders.value" role="cell">{{ item.value }}</strong>
        <span
          class="case-description"
          :class="{ muted: !item.description }"
          :data-label="caseHeaders.description"
          role="cell"
        >
          {{ item.description || '暂无补充说明' }}
        </span>
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
const caseHeaders = computed(() => {
  const payloadHeaders = props.sceneAction?.payload?.caseHeaders
  return normalizeCaseHeaders(payloadHeaders || props.block.caseHeaders)
})
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

function normalizeCaseHeaders(value: unknown) {
  const record = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
  return {
    label: typeof record.label === 'string' && record.label.trim() ? record.label : '场景',
    value: typeof record.value === 'string' && record.value.trim() ? record.value : '复杂度',
    description: typeof record.description === 'string' && record.description.trim() ? record.description : '说明',
  }
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
  font-size: 17px;
  font-weight: 820;
  line-height: 1.34;
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
  border: 1px solid rgba(15, 118, 110, 0.18);
  border-radius: 8px;
  background: linear-gradient(180deg, #ffffff, #f0fdfa);

  &.primary {
    border-color: rgba(15, 118, 110, 0.18);
    background: linear-gradient(180deg, #ffffff, #f0fdfa);
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
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.035);
}

.case-row {
  --case-gutter-bg: #fbfdff;
  display: grid;
  grid-template-columns: minmax(90px, 0.68fr) minmax(82px, 0.42fr) minmax(0, 2.4fr);
  gap: 0;
  align-items: center;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  background: #fff;
  font-size: 13px;

  &:last-child {
    border-bottom: 0;
  }

  > span,
  > strong {
    min-width: 0;
    min-height: 42px;
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border-right: 1px solid rgba(226, 232, 240, 0.9);
    overflow-wrap: anywhere;

    &:last-child {
      border-right: 0;
    }
  }
}

.case-head {
  background: #f8fafc;

  > span {
    min-height: 34px;
    justify-content: center;
    color: #334155;
    font-size: 12px;
    font-weight: 760;
    line-height: 1.35;
  }
}

.case-label {
  background: var(--case-gutter-bg);
  color: #334155;
  font-weight: 700;
}

.case-value {
  justify-content: center;
  color: #0f766e;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.35;
  white-space: nowrap;
}

.case-description {
  color: #64748b;
  line-height: 1.6;
  justify-content: flex-start;

  &.muted {
    color: #94a3b8;
  }
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
    align-items: stretch;
    margin: 8px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;

    &:last-child {
      margin-bottom: 8px;
    }

    > span,
    > strong {
      min-height: unset;
      justify-content: flex-start;
      border-right: 0;
      border-bottom: 1px solid #e2e8f0;

      &:last-child {
        border-bottom: 0;
      }
    }
  }

  .case-head {
    display: none;
  }

  .case-value::before,
  .case-description::before {
    flex: 0 0 48px;
    margin-right: 8px;
    color: #94a3b8;
    font-family: inherit;
    font-size: 12px;
    font-weight: 650;
  }

  .case-value::before {
    content: attr(data-label);
  }

  .case-description::before {
    content: attr(data-label);
  }
}
</style>
