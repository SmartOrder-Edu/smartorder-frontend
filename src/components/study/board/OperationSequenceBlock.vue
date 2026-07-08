<template>
  <section class="operation-block">
    <div class="lesson-block-header" v-if="block.title || operationLabel">
      <div class="lesson-block-title" v-if="block.title">{{ block.title }}</div>
      <span class="operation-label">{{ operationLabel }}</span>
    </div>

    <div v-if="steps.length" class="operation-steps">
      <article
        v-for="(step, index) in steps"
        :key="`${step.label || index}-${step.action}`"
        class="operation-step"
        :class="{ active: index === activeIndex, done: index < activeIndex }"
      >
        <div class="step-marker">
          <span>{{ step.label || index + 1 }}</span>
        </div>
        <div class="step-body">
          <div class="step-action">{{ step.action }}</div>
          <p v-if="step.description" class="step-description">{{ step.description }}</p>
          <div v-if="step.before || step.after" class="state-change">
            <span v-if="step.before" class="state-pill before">{{ step.before }}</span>
            <span v-if="step.before && step.after" class="state-arrow">→</span>
            <span v-if="step.after" class="state-pill after">{{ step.after }}</span>
          </div>
          <p v-if="step.why" class="step-why">{{ step.why }}</p>
        </div>
      </article>
    </div>

    <div v-else-if="block.content" class="operation-fallback">{{ block.content }}</div>

    <p v-if="invariant" class="operation-invariant">
      <span>保持规则</span>
      {{ invariant }}
    </p>
    <p v-if="block.caption && block.caption !== invariant" class="lesson-block-caption">{{ block.caption }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  LessonSceneAction,
  TeachingOperationSequenceBoardBlock,
  TeachingOperationSequenceStep,
} from '@/types/study'

const props = defineProps<{
  block: TeachingOperationSequenceBoardBlock
  sceneAction?: LessonSceneAction | null
}>()

const steps = computed(() => normalizeSteps(readScenePayloadArray('steps') || props.block.steps || []))
const activeIndex = computed(() => {
  const value = readScenePayloadNumber('currentStep')
    ?? (props.block.currentStep === undefined ? null : Number(props.block.currentStep))
    ?? 0
  return normalizeCurrentStep(value, steps.value.length)
})
const operationLabel = computed(() => readScenePayloadString('operation') || props.block.operation || '操作序列')
const invariant = computed(() => readScenePayloadString('invariant') || props.block.invariant || '')

function normalizeSteps(values: unknown[]): TeachingOperationSequenceStep[] {
  return values
    .map((value, index) => {
      if (!value || typeof value !== 'object') {
        return { label: String(index + 1), action: String(value || '') }
      }
      const record = value as Record<string, unknown>
      return {
        label: stringValue(record.label),
        action: stringValue(record.action) || stringValue(record.title) || `步骤 ${index + 1}`,
        description: stringValue(record.description),
        before: stringValue(record.before),
        after: stringValue(record.after),
        why: stringValue(record.why),
      }
    })
    .filter((step) => step.action || step.description)
}

function normalizeCurrentStep(value: number, total: number): number {
  if (!Number.isFinite(value) || total <= 0) return 0
  const step = Math.trunc(value)
  if (step >= 1 && step <= total) return step - 1
  return Math.max(0, Math.min(total - 1, step))
}

function stringValue(value: unknown): string {
  return value === undefined || value === null ? '' : String(value)
}

function readScenePayloadString(key: string): string {
  const value = props.sceneAction?.payload?.[key]
  return typeof value === 'string' ? value : ''
}

function readScenePayloadNumber(key: string): number | null {
  const value = props.sceneAction?.payload?.[key]
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function readScenePayloadArray(key: string): unknown[] | null {
  const value = props.sceneAction?.payload?.[key]
  return Array.isArray(value) ? value : null
}
</script>

<style scoped lang="scss">
.operation-block {
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

.operation-label {
  flex: 0 0 auto;
  padding: 3px 9px;
  border: 1px solid rgba(14, 165, 233, 0.18);
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.08);
  color: #0369a1;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.45;
}

.operation-steps {
  display: grid;
  gap: 8px;
}

.operation-step {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 10px;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;

  &.done {
    background: #f8fafc;
  }

  &.active {
    border-color: rgba(14, 165, 233, 0.45);
    background: #f0f9ff;
    box-shadow: 0 8px 18px rgba(14, 165, 233, 0.1);
  }
}

.step-marker {
  display: grid;
  place-items: start center;

  span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 999px;
    background: #e2e8f0;
    color: #475569;
    font-size: 11px;
    font-weight: 800;
  }
}

.operation-step.active .step-marker span {
  background: #0284c7;
  color: #fff;
}

.operation-step.done .step-marker span {
  background: #14b8a6;
  color: #fff;
}

.step-body {
  min-width: 0;
  display: grid;
  gap: 6px;
}

.step-action {
  color: #0f172a;
  font-size: 13px;
  font-weight: 760;
  line-height: 1.45;
}

.step-description,
.step-why,
.lesson-block-caption,
.operation-fallback {
  margin: 0;
  color: #475569;
  font-size: 12px;
  line-height: 1.7;
}

.state-change {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.state-pill {
  max-width: 100%;
  overflow-wrap: anywhere;
  padding: 3px 8px;
  border-radius: 6px;
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.45;

  &.before {
    background: #f1f5f9;
    color: #475569;
  }

  &.after {
    background: #ecfdf5;
    color: #0f766e;
  }
}

.state-arrow {
  color: #94a3b8;
  font-weight: 800;
}

.step-why {
  padding-left: 8px;
  border-left: 2px solid rgba(14, 165, 233, 0.28);
}

.operation-invariant {
  margin: 0;
  padding: 10px 12px;
  border-left: 3px solid #14b8a6;
  border-radius: 0 8px 8px 0;
  background: rgba(20, 184, 166, 0.07);
  color: #0f766e;
  font-size: 12px;
  line-height: 1.7;

  span {
    margin-right: 8px;
    font-weight: 800;
  }
}
</style>
