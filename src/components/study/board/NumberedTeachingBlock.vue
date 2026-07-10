<template>
  <section class="numbered-teaching-block" :class="[`mode-${mode}`]">
    <div v-if="block.title || eyebrow || leadText" class="numbered-header">
      <div>
        <span v-if="eyebrow" class="numbered-eyebrow">{{ eyebrow }}</span>
        <div v-if="block.title" class="numbered-title">{{ block.title }}</div>
      </div>
      <p v-if="leadText" class="numbered-lead">{{ leadText }}</p>
    </div>

    <div v-if="mode === 'concept_breakdown' && term" class="concept-line">
      <strong>{{ term }}</strong>
      <span v-if="summaryText">{{ summaryText }}</span>
    </div>

    <ol v-if="visibleDisplayItems.length" class="numbered-list">
      <li
        v-for="(item, index) in visibleDisplayItems"
        :key="`${item.title || item.content}-${index}`"
        class="numbered-item"
      >
        <span class="number-marker">{{ index + 1 }}</span>
        <div class="numbered-body">
          <div class="item-heading">
            <span v-if="item.label" class="item-label">{{ item.label }}</span>
            <strong>{{ item.title || fallbackTitle(index) }}</strong>
          </div>
          <p v-if="item.content" class="item-content">{{ item.content }}</p>
          <div v-if="item.reason || item.result || item.check" class="reason-grid">
            <span v-if="item.reason"><b>为什么：</b>{{ item.reason }}</span>
            <span v-if="item.result"><b>得到：</b>{{ item.result }}</span>
            <span v-if="item.check"><b>检查：</b>{{ item.check }}</span>
          </div>
          <p v-if="item.example" class="item-example">{{ item.example }}</p>
        </div>
      </li>
    </ol>

    <p v-if="endingText" class="numbered-ending">{{ endingText }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  LessonSceneAction,
  TeachingNumberedBoardBlock,
  TeachingNumberedPointItem,
  TeachingReasoningStepItem,
} from '@/types/study'

interface DisplayItem {
  label: string
  title: string
  content: string
  reason: string
  result: string
  check: string
  example: string
}

const props = defineProps<{
  block: TeachingNumberedBoardBlock
  sceneAction?: LessonSceneAction | null
  revealedItemIndex?: number | null
}>()

const mode = computed(() => normalizeType(props.block.type))
const term = computed(() => readString('term') || props.block.term || '')
const summaryText = computed(() => readString('summary') || props.block.summary || props.block.content || '')
const leadText = computed(() => readString('lead') || props.block.lead || questionText.value || contextText.value)
const questionText = computed(() => readString('question') || props.block.question || '')
const contextText = computed(() => readString('context') || props.block.context || '')
const endingText = computed(() =>
  readString('conclusion')
  || props.block.conclusion
  || readString('rule')
  || props.block.rule
  || readString('reminder')
  || props.block.reminder
  || '',
)

const eyebrow = computed(() => {
  const labels: Record<string, string> = {
    numbered_points: '要点',
    reasoning_steps: '推理',
    concept_breakdown: '拆解',
    ordered_checklist: '检查',
  }
  return labels[mode.value] || ''
})

const displayItems = computed<DisplayItem[]>(() => {
  if (mode.value === 'reasoning_steps') {
    return normalizeReasoningSteps(readArray('steps') || props.block.steps || [])
  }
  if (mode.value === 'concept_breakdown') {
    return normalizePointItems(readArray('points') || props.block.points || props.block.items || [])
  }
  return normalizePointItems(readArray('items') || props.block.items || props.block.points || [])
})
const visibleDisplayItems = computed(() => {
  if (props.revealedItemIndex === null || props.revealedItemIndex === undefined) {
    return displayItems.value
  }
  const visibleCount = Math.max(0, props.revealedItemIndex + 1)
  return displayItems.value.slice(0, visibleCount)
})

function normalizeType(type: string): string {
  return (type || 'numbered_points').toLowerCase().replace(/[-\s]/g, '_')
}

function fallbackTitle(index: number): string {
  if (mode.value === 'ordered_checklist') return `检查项 ${index + 1}`
  if (mode.value === 'reasoning_steps') return `推理步骤 ${index + 1}`
  return `要点 ${index + 1}`
}

function readString(field: string): string {
  const value = (props.sceneAction?.payload || {})[field]
  return typeof value === 'string' ? value.trim() : ''
}

function readArray(field: string): unknown[] | null {
  const value = (props.sceneAction?.payload || {})[field]
  return Array.isArray(value) ? value : null
}

function normalizePointItems(items: Array<TeachingNumberedPointItem | string | unknown>): DisplayItem[] {
  return items
    .map((item) => {
      if (typeof item === 'string') {
        return displayItem('', item, '', '', '', '', '')
      }
      if (!item || typeof item !== 'object') {
        return null
      }
      const record = item as TeachingNumberedPointItem
      if (mode.value === 'ordered_checklist') {
        return displayItem(
          stringValue(record.label),
          stringValue(record.text) || stringValue(record.title) || stringValue(record.name),
          stringValue(record.detail) || stringValue(record.description) || stringValue(record.content),
          stringValue(record.why),
          '',
          '',
          stringValue(record.example),
        )
      }
      if (mode.value === 'concept_breakdown') {
        return displayItem(
          stringValue(record.label),
          stringValue(record.name) || stringValue(record.title),
          stringValue(record.detail) || stringValue(record.description) || stringValue(record.content) || stringValue(record.text),
          stringValue(record.why),
          '',
          '',
          stringValue(record.example),
        )
      }
      return displayItem(
        stringValue(record.label),
        stringValue(record.title) || stringValue(record.name) || stringValue(record.text),
        stringValue(record.content) || stringValue(record.detail) || stringValue(record.description),
        stringValue(record.why),
        '',
        '',
        stringValue(record.example),
      )
    })
    .filter((item): item is DisplayItem => !!item && hasDisplayText(item))
}

function normalizeReasoningSteps(items: Array<TeachingReasoningStepItem | unknown>): DisplayItem[] {
  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as TeachingReasoningStepItem
      return displayItem(
        stringValue(record.label),
        stringValue(record.title) || stringValue(record.step),
        stringValue(record.content),
        stringValue(record.reason),
        stringValue(record.result),
        stringValue(record.check),
        '',
      )
    })
    .filter((item): item is DisplayItem => !!item && hasDisplayText(item))
}

function displayItem(label: string, title: string, content: string, reason: string, result: string, check: string, example: string): DisplayItem {
  return { label, title, content, reason, result, check, example }
}

function hasDisplayText(item: DisplayItem): boolean {
  return !!(item.label || item.title || item.content || item.reason || item.result || item.check || item.example)
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
</script>

<style scoped lang="scss">
.numbered-teaching-block {
  display: grid;
  gap: 14px;
  color: var(--board-text, #334155);
}

.numbered-header {
  display: grid;
  gap: 6px;
}

.numbered-eyebrow {
  display: inline-flex;
  color: var(--board-info, #0369a1);
  font-size: 12px;
  font-weight: 760;
  line-height: 1.4;
}

.numbered-title {
  margin-top: 2px;
  color: var(--board-heading, #0f172a);
  font-size: 18px;
  font-weight: 820;
  line-height: 1.32;
}

.numbered-lead,
.numbered-ending,
.concept-line {
  margin: 0;
  color: var(--board-muted, #64748b);
  font-size: 13px;
  line-height: 1.7;
}

.concept-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--board-line, rgba(226, 232, 240, 0.86));

  strong {
    color: var(--board-heading, #0f172a);
    font-size: 17px;
  }
}

.numbered-list {
  display: grid;
  gap: 16px;
  margin: 0;
  padding: 2px 0 0 8px;
  list-style: none;
  counter-reset: none;
}

.numbered-item {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
  margin: 0;
  padding: 0 0 16px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.64);
  animation: numberedItemReveal 0.26s ease both;

  &:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }
}

@keyframes numberedItemReveal {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.number-marker {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(14, 165, 233, 0.3);
  background: rgba(14, 165, 233, 0.1);
  color: var(--board-info, #0369a1);
  font-size: 16px;
  font-weight: 860;
  line-height: 1;
}

.numbered-body {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.item-heading {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  align-items: baseline;
  color: var(--board-heading, #0f172a);
  line-height: 1.45;

  strong {
    font-size: 15px;
    font-weight: 780;
  }
}

.item-label {
  color: var(--board-info, #0369a1);
  font-size: 12px;
  font-weight: 760;
}

.item-content,
.item-example {
  margin: 0;
  color: var(--board-text, #334155);
  font-size: 14px;
  line-height: 1.78;
}

.item-example {
  color: var(--board-muted, #64748b);
}

.reason-grid {
  display: grid;
  gap: 4px;
  color: var(--board-text, #334155);
  font-size: 14px;
  line-height: 1.72;

  b {
    color: var(--board-heading, #0f172a);
    font-weight: 750;
  }
}

.numbered-ending {
  padding-top: 2px;
  color: var(--board-success, #0f766e);
  font-weight: 650;
}

.mode-ordered_checklist {
  .number-marker {
    border-color: rgba(16, 185, 129, 0.28);
    background: rgba(16, 185, 129, 0.08);
    color: var(--board-success, #0f766e);
  }
}

.mode-concept_breakdown {
  .number-marker {
    border-color: rgba(20, 184, 166, 0.28);
    background: rgba(20, 184, 166, 0.08);
    color: var(--board-accent, #0f766e);
  }
}

@media (max-width: 640px) {
  .numbered-item {
    grid-template-columns: 30px minmax(0, 1fr);
    gap: 10px;
  }

  .number-marker {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }
}
</style>
