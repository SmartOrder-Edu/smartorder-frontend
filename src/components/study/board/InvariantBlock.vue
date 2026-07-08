<template>
  <section class="invariant-block">
    <div class="lesson-block-header" v-if="block.title">
      <div class="lesson-block-title">{{ block.title }}</div>
      <span class="invariant-label">不变量</span>
    </div>

    <div v-if="statement" class="statement-card">
      <span class="statement-prefix">始终保持</span>
      <div class="statement-text">{{ statement }}</div>
    </div>

    <p v-if="whyItMatters" class="why-card">{{ whyItMatters }}</p>

    <div v-if="checkpoints.length" class="checkpoint-list">
      <div class="checkpoint-title">每一步都要检查</div>
      <div
        v-for="(item, index) in checkpoints"
        :key="`${item}-${index}`"
        class="checkpoint-item"
      >
        <span class="checkpoint-index">{{ index + 1 }}</span>
        <span>{{ item }}</span>
      </div>
    </div>

    <div v-if="examples.length" class="example-grid">
      <div
        v-for="(example, index) in examples"
        :key="`${example.value}-${index}`"
        class="example-card"
        :class="{ valid: example.valid === true, invalid: example.valid === false }"
      >
        <div class="example-head">
          <span>{{ example.label || `例 ${index + 1}` }}</span>
          <strong>{{ example.valid === false ? '破坏' : '满足' }}</strong>
        </div>
        <div class="example-value">{{ example.value }}</div>
        <p v-if="example.explanation">{{ example.explanation }}</p>
      </div>
    </div>

    <p v-if="commonMistake" class="mistake-card">
      <span>常见破坏方式</span>
      {{ commonMistake }}
    </p>
    <p v-if="block.caption || block.content" class="lesson-block-caption">
      {{ block.caption || block.content }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LessonSceneAction, TeachingInvariantBoardBlock } from '@/types/study'

const props = defineProps<{
  block: TeachingInvariantBoardBlock
  sceneAction?: LessonSceneAction | null
}>()

const statement = computed(() => readScenePayloadString('statement') || props.block.statement || '')
const whyItMatters = computed(() => readScenePayloadString('whyItMatters') || props.block.whyItMatters || '')
const commonMistake = computed(() => readScenePayloadString('commonMistake') || props.block.commonMistake || '')
const checkpoints = computed(() => normalizeStringArray(readScenePayloadArray('checkpoints') || props.block.checkpoints || []))
const examples = computed(() => normalizeExamples(readScenePayloadArray('examples') || props.block.examples || []))

function normalizeStringArray(values: unknown[]): string[] {
  return values
    .map((value) => value === undefined || value === null ? '' : String(value))
    .filter(Boolean)
}

function normalizeExamples(values: unknown[]) {
  return values
    .map((value) => {
      if (!value || typeof value !== 'object') {
        return { value: String(value || '') }
      }
      const record = value as Record<string, unknown>
      return {
        label: stringValue(record.label),
        value: stringValue(record.value),
        valid: typeof record.valid === 'boolean' ? record.valid : undefined,
        explanation: stringValue(record.explanation),
      }
    })
    .filter((item) => item.value)
}

function stringValue(value: unknown): string {
  return value === undefined || value === null ? '' : String(value)
}

function readScenePayloadString(key: string): string {
  const value = props.sceneAction?.payload?.[key]
  return typeof value === 'string' ? value : ''
}

function readScenePayloadArray(key: string): unknown[] | null {
  const value = props.sceneAction?.payload?.[key]
  return Array.isArray(value) ? value : null
}
</script>

<style scoped lang="scss">
.invariant-block {
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

.invariant-label {
  flex: 0 0 auto;
  padding: 3px 9px;
  border: 1px solid rgba(20, 184, 166, 0.2);
  border-radius: 999px;
  background: rgba(20, 184, 166, 0.08);
  color: #0f766e;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.45;
}

.statement-card {
  display: grid;
  gap: 6px;
  padding: 12px;
  border: 1px solid rgba(20, 184, 166, 0.22);
  border-radius: 8px;
  background: #f0fdfa;
}

.statement-prefix {
  color: #0f766e;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
}

.statement-text {
  color: #0f172a;
  font-size: 15px;
  font-weight: 760;
  line-height: 1.55;
}

.why-card,
.mistake-card,
.lesson-block-caption {
  margin: 0;
  color: #475569;
  font-size: 12px;
  line-height: 1.7;
}

.why-card {
  padding: 9px 11px;
  border-radius: 8px;
  background: #f8fafc;
}

.checkpoint-list {
  display: grid;
  gap: 7px;
}

.checkpoint-title {
  color: #334155;
  font-size: 12px;
  font-weight: 800;
}

.checkpoint-item {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  align-items: start;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #fff;
  box-shadow: inset 0 0 0 1px #e2e8f0;
  color: #334155;
  font-size: 12px;
  line-height: 1.65;
}

.checkpoint-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #ccfbf1;
  color: #0f766e;
  font-size: 11px;
  font-weight: 800;
}

.example-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
}

.example-card {
  display: grid;
  gap: 6px;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;

  &.valid {
    border-color: rgba(20, 184, 166, 0.24);
    background: #f0fdfa;
  }

  &.invalid {
    border-color: rgba(239, 68, 68, 0.22);
    background: #fff7ed;
  }

  p {
    margin: 0;
    color: #64748b;
    font-size: 11px;
    line-height: 1.6;
  }
}

.example-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;

  strong {
    color: #0f766e;
  }
}

.example-card.invalid .example-head strong {
  color: #dc2626;
}

.example-value {
  overflow-wrap: anywhere;
  color: #0f172a;
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.55;
}

.mistake-card {
  padding: 10px 12px;
  border-left: 3px solid #ef4444;
  border-radius: 0 8px 8px 0;
  background: #fff7ed;
  color: #9f1239;

  span {
    margin-right: 8px;
    font-weight: 800;
  }
}
</style>
