<template>
  <section class="trace-block">
    <div class="lesson-block-header" v-if="block.title || actionLabel">
      <div class="lesson-block-title" v-if="block.title">{{ block.title }}</div>
      <span class="trace-action">{{ actionLabel }}</span>
    </div>

    <div class="trace-array" v-if="items.length">
      <div
        v-for="(item, index) in items"
        :key="`trace-${index}`"
        class="trace-cell"
        :class="{
          active: activeIndices.includes(index),
          processed: isProcessed(index),
        }"
      >
        <span class="trace-value">{{ item }}</span>
        <span class="trace-index">{{ index }}</span>
      </div>
    </div>

    <div v-if="activeIndices.length" class="trace-focus">
      <span v-for="index in activeIndices" :key="index" class="trace-focus-chip">
        当前下标 {{ index }}
      </span>
    </div>

    <p v-if="explanation" class="trace-explanation">{{ explanation }}</p>
    <p v-else-if="block.caption || block.content" class="trace-explanation">
      {{ block.caption || block.content }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LessonSceneAction, TeachingTraceBoardBlock } from '@/types/study'

const props = defineProps<{
  block: TeachingTraceBoardBlock
  sceneAction?: LessonSceneAction | null
}>()

const items = computed(() => normalizeItems(readScenePayloadArray('items') || props.block.items || []))
const activeIndices = computed(() => normalizeNumberArray(readScenePayloadArray('activeIndices') || props.block.activeIndices || []))
const processedRange = computed(() => normalizeRange(readScenePayloadArray('processedRange') || props.block.processedRange || null))
const action = computed(() => readScenePayloadString('action') || props.block.action || 'mark')
const explanation = computed(() => readScenePayloadString('explanation') || props.block.explanation || '')
const actionLabel = computed(() => {
  const labels: Record<string, string> = {
    compare: '比较',
    swap: '交换',
    insert: '插入',
    delete: '删除',
    visit: '访问',
    mark: '标记',
  }
  return labels[action.value] || action.value || '过程'
})

function isProcessed(index: number): boolean {
  if (!processedRange.value) return false
  return index >= processedRange.value[0] && index <= processedRange.value[1]
}

function normalizeItems(values: unknown[]): string[] {
  return values.map((value) => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') {
      const record = value as Record<string, unknown>
      const label = record.label ?? record.value ?? record.name ?? record.id
      return label === undefined ? JSON.stringify(value) : String(label)
    }
    return String(value)
  })
}

function normalizeNumberArray(values: unknown[]): number[] {
  return values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
}

function normalizeRange(values: unknown[] | [number, number] | null): [number, number] | null {
  if (!values || values.length < 2) return null
  const start = Number(values[0])
  const end = Number(values[1])
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  return [start, end]
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
.trace-block {
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

.trace-action,
.trace-focus-chip {
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.45;
}

.trace-action {
  flex: 0 0 auto;
  padding: 3px 9px;
  border: 1px solid rgba(245, 158, 11, 0.2);
  background: rgba(245, 158, 11, 0.1);
  color: #b45309;
}

.trace-array {
  display: flex;
  align-items: flex-start;
  overflow-x: auto;
  padding: 6px 2px 12px;
}

.trace-cell {
  position: relative;
  display: grid;
  place-items: center;
  min-width: 54px;
  min-height: 54px;
  padding: 8px 10px 18px;
  border: 1px solid #cbd5e1;
  border-right-width: 0;
  background: #fff;
  color: #0f172a;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;

  &:first-child {
    border-radius: 8px 0 0 8px;
  }

  &:last-child {
    border-right-width: 1px;
    border-radius: 0 8px 8px 0;
  }

  &.active {
    z-index: 1;
    transform: translateY(-4px);
    border-color: #d97706;
    background: #fffbeb;
    box-shadow: 0 8px 18px rgba(217, 119, 6, 0.14);
  }

  &.processed {
    background: #f8fafc;
    color: #64748b;
  }
}

.trace-value {
  font-size: 15px;
  font-weight: 760;
  line-height: 1.2;
}

.trace-index {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 3px;
  color: #94a3b8;
  font-size: 10px;
  text-align: center;
}

.trace-focus {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.trace-focus-chip {
  padding: 3px 8px;
  background: #f1f5f9;
  color: #475569;
}

.trace-explanation {
  margin: 0;
  padding: 10px 12px;
  border-left: 3px solid #f59e0b;
  border-radius: 0 8px 8px 0;
  background: rgba(245, 158, 11, 0.08);
  color: #475569;
  font-size: 13px;
  line-height: 1.7;
}
</style>
