<template>
  <section class="structure-block" :class="`structure-${structureType}`">
    <div class="lesson-block-header" v-if="block.title || structureLabel">
      <div class="lesson-block-title" v-if="block.title">{{ block.title }}</div>
      <span class="structure-label">{{ structureLabel }}</span>
    </div>

    <div v-if="structureType === 'stack'" class="stack-view">
      <div
        v-for="(item, index) in reversedItems"
        :key="`stack-${index}`"
        class="stack-cell"
        :class="{ active: isActive(item.originalIndex), top: item.originalIndex === topIndex }"
      >
        <span class="cell-value">{{ item.label }}</span>
        <span v-if="item.originalIndex === topIndex" class="cell-pointer">top</span>
      </div>
      <div v-if="!items.length" class="empty-structure">空栈</div>
    </div>

    <div v-else-if="structureType === 'linked_list'" class="linked-list-view">
      <template v-if="items.length">
        <div
          v-for="(item, index) in items"
          :key="`node-${index}`"
          class="list-node-wrap"
        >
          <div class="list-node" :class="{ active: isActive(index) }">
            <span class="node-index">{{ index }}</span>
            <span class="node-value">{{ item.label }}</span>
          </div>
          <div v-if="index < items.length - 1" class="list-arrow">next</div>
        </div>
        <div class="list-null">NULL</div>
      </template>
      <div v-else class="empty-structure">空链表</div>
    </div>

    <div v-else class="linear-view">
      <div class="linear-cells">
        <div
          v-for="(item, index) in items"
          :key="`linear-${index}`"
          class="linear-cell"
          :class="{
            active: isActive(index),
            processed: isProcessed(index),
          }"
        >
          <span class="cell-value">{{ item.label }}</span>
          <span class="cell-index">{{ index }}</span>
          <span v-if="pointerNamesAt(index).length" class="pointer-stack">
            <span v-for="name in pointerNamesAt(index)" :key="name" class="pointer-chip">{{ name }}</span>
          </span>
        </div>
        <div v-if="queueRearAtTail" class="linear-cell ghost-cell">
          <span class="cell-value">下一位</span>
          <span class="cell-index">{{ items.length }}</span>
          <span class="pointer-stack">
            <span class="pointer-chip">rear</span>
          </span>
        </div>
      </div>
      <div v-if="!items.length" class="empty-structure">空数组</div>
    </div>

    <div v-if="pointerEntries.length" class="pointer-summary">
      <span v-for="entry in pointerEntries" :key="entry.name" class="summary-chip">
        {{ entry.name }} = {{ entry.value }}
      </span>
    </div>

    <p v-if="block.caption || block.content" class="lesson-block-caption">
      {{ block.caption || block.content }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LessonSceneAction, TeachingStructureBoardBlock } from '@/types/study'

const props = defineProps<{
  block: TeachingStructureBoardBlock
  sceneAction?: LessonSceneAction | null
}>()

interface DisplayItem {
  label: string
  originalIndex: number
}

const structureType = computed(() => normalizeStructureType(
  readScenePayloadString('structureType') || props.block.structureType || 'array',
))
const items = computed<DisplayItem[]>(() => normalizeItems(readScenePayloadArray('items') || props.block.items || props.block.nodes || []))
const reversedItems = computed(() => [...items.value].reverse())
const activeIndices = computed(() => normalizeNumberArray(readScenePayloadArray('activeIndices') || props.block.activeIndices || []))
const pointers = computed(() => ({
  ...(props.block.pointers || {}),
  ...readScenePayloadRecord('pointers'),
}))
const pointerEntries = computed(() =>
  Object.entries(pointers.value)
    .filter(([, value]) => value !== undefined && value !== null && `${value}` !== '')
    .map(([name, value]) => ({ name, value })),
)
const topIndex = computed(() => {
  const pointerTop = Number(pointers.value.top)
  if (Number.isFinite(pointerTop)) return pointerTop
  return items.value.length - 1
})
const queueRearAtTail = computed(() => structureType.value === 'queue' && Number(pointers.value.rear) === items.value.length)
const processedRange = computed(() => normalizeRange(readScenePayloadArray('processedRange')))
const structureLabel = computed(() => {
  const labels: Record<string, string> = {
    array: '数组',
    stack: '栈',
    queue: '队列',
    linked_list: '链表',
    tree: '树',
    heap: '堆',
    graph: '图',
  }
  return labels[structureType.value] || props.block.structureType || '数据结构'
})

function isActive(index: number): boolean {
  return activeIndices.value.includes(index)
}

function isProcessed(index: number): boolean {
  if (!processedRange.value) return false
  return index >= processedRange.value[0] && index <= processedRange.value[1]
}

function pointerNamesAt(index: number): string[] {
  return pointerEntries.value
    .filter((entry) => Number(entry.value) === index)
    .map((entry) => entry.name)
}

function normalizeItems(values: unknown[]): DisplayItem[] {
  return values.map((value, index) => ({
    label: itemLabel(value),
    originalIndex: index,
  }))
}

function itemLabel(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const label = record.label ?? record.value ?? record.name ?? record.id
    return label === undefined ? JSON.stringify(value) : String(label)
  }
  return String(value)
}

function normalizeStructureType(type: string): string {
  const value = type.trim().toLowerCase().replace(/[-\s]/g, '_')
  if (value === 'linkedlist' || value === 'list') return 'linked_list'
  return value || 'array'
}

function normalizeNumberArray(values: unknown[]): number[] {
  return values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
}

function normalizeRange(values: unknown[] | null): [number, number] | null {
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

function readScenePayloadRecord(key: string): Record<string, number | string> {
  const value = props.sceneAction?.payload?.[key]
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, number | string>
}

</script>

<style scoped lang="scss">
.structure-block {
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

.structure-label,
.summary-chip,
.pointer-chip {
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.45;
}

.structure-label {
  flex: 0 0 auto;
  padding: 3px 9px;
  border: 1px solid rgba(37, 99, 235, 0.18);
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
}

.linear-view {
  overflow-x: auto;
  padding: 6px 2px 14px;
}

.linear-cells {
  display: flex;
  align-items: flex-start;
  min-width: max-content;
}

.linear-cell {
  position: relative;
  display: grid;
  place-items: center;
  min-width: 58px;
  min-height: 58px;
  padding: 8px 10px 18px;
  border: 1px solid #cbd5e1;
  border-right-width: 0;
  background: #fff;
  color: #0f172a;
  transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;

  &:first-child {
    border-radius: 8px 0 0 8px;
  }

  &:last-child {
    border-right-width: 1px;
    border-radius: 0 8px 8px 0;
  }

  &.active {
    z-index: 1;
    border-color: #0f766e;
    background: #ecfdf5;
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.12);
  }

  &.processed {
    background: #f8fafc;
    color: #64748b;
  }
}

.ghost-cell {
  color: #94a3b8;
  background: #f8fafc;
  border-style: dashed;
}

.cell-value {
  font-weight: 760;
  font-size: 15px;
  line-height: 1.2;
}

.cell-index {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 3px;
  color: #94a3b8;
  font-size: 10px;
  text-align: center;
}

.pointer-stack {
  position: absolute;
  left: 50%;
  bottom: -24px;
  display: flex;
  gap: 4px;
  transform: translateX(-50%);
}

.pointer-chip {
  padding: 2px 6px;
  background: #0f766e;
  color: #fff;
  white-space: nowrap;

}

.pointer-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.summary-chip {
  padding: 3px 8px;
  background: #f1f5f9;
  color: #475569;
}

.stack-view {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: min(220px, 100%);
  border-bottom: 3px solid #334155;
}

.stack-cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  border: 1px solid #cbd5e1;
  border-bottom: 0;
  background: #fff;

  &.active,
  &.top {
    background: #ecfdf5;
    border-color: #0f766e;
  }
}

.cell-pointer {
  position: absolute;
  right: -48px;
  color: #0f766e;
  font-size: 12px;
  font-weight: 750;
}

.linked-list-view {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow-x: auto;
  padding: 8px 2px 12px;
}

.list-node-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
}

.list-node {
  display: grid;
  grid-template-columns: 34px minmax(44px, auto);
  overflow: hidden;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;

  &.active {
    border-color: #0f766e;
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.12);
  }
}

.node-index,
.node-value {
  min-height: 38px;
  display: grid;
  place-items: center;
}

.node-index {
  background: #f1f5f9;
  color: #64748b;
  font-size: 11px;
}

.node-value {
  padding: 0 12px;
  color: #0f172a;
  font-weight: 760;
}

.list-arrow {
  position: relative;
  padding-right: 22px;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;

  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: 50%;
    width: 18px;
    height: 1px;
    background: #94a3b8;
  }

  &::before {
    content: '';
    position: absolute;
    right: 0;
    top: calc(50% - 4px);
    width: 8px;
    height: 8px;
    border-top: 1px solid #94a3b8;
    border-right: 1px solid #94a3b8;
    transform: rotate(45deg);
  }
}

.list-null {
  flex: 0 0 auto;
  color: #94a3b8;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  font-weight: 700;
}

.empty-structure {
  padding: 18px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #94a3b8;
  text-align: center;
  font-size: 13px;
}

.lesson-block-caption {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.65;
}

</style>
