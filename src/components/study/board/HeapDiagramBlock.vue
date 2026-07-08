<template>
  <section class="heap-block">
    <div class="lesson-block-header" v-if="block.title">
      <div class="lesson-block-title">{{ block.title }}</div>
      <span class="structure-label">堆</span>
    </div>

    <div v-if="heapNodes.length" class="heap-tree-scroll">
      <div class="heap-tree-stage" :style="{ width: `${stageSize.width}px`, height: `${stageSize.height}px` }">
        <svg class="heap-lines" :viewBox="`0 0 ${stageSize.width} ${stageSize.height}`" aria-hidden="true">
          <line
            v-for="edge in heapEdges"
            :key="`${edge.from}-${edge.to}`"
            :x1="edge.fromX"
            :y1="edge.fromY"
            :x2="edge.toX"
            :y2="edge.toY"
            class="heap-edge"
            :class="{ compare: isCompare(edge.from) && isCompare(edge.to) }"
          />
        </svg>

        <div
          v-for="node in heapNodes"
          :key="node.id"
          class="heap-node"
          :class="{
            active: isActiveIndex(node.index),
            compare: isCompare(node.id),
            path: isPath(node.id),
          }"
          :style="{ left: `${node.x}px`, top: `${node.y}px` }"
        >
          <span class="node-value">{{ node.label }}</span>
          <span class="node-index">{{ node.index }}</span>
        </div>
      </div>
    </div>

    <div v-else class="empty-structure">暂无堆元素</div>

    <div v-if="items.length" class="heap-array">
      <div
        v-for="(item, index) in items"
        :key="`heap-array-${index}`"
        class="array-cell"
        :class="{ active: isActiveIndex(index), compare: isCompare(String(index)) }"
      >
        <span class="array-value">{{ item.label }}</span>
        <span class="array-index">{{ index }}</span>
      </div>
    </div>

    <div class="heap-hint" v-if="compareIds.length || activeIndices.length">
      <span v-if="activeIndices.length">当前下标：{{ activeIndices.join(', ') }}</span>
      <span v-if="compareIds.length">比较节点：{{ compareIds.join(', ') }}</span>
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

interface HeapItem {
  label: string
  index: number
}

interface HeapNode extends HeapItem {
  id: string
  depth: number
  order: number
  x: number
  y: number
}

const rawItems = computed(() => readPayloadArray('items') || props.block.items || props.block.nodes || [])
const items = computed<HeapItem[]>(() => rawItems.value
  .map((value, index) => ({ label: itemLabel(value), index }))
  .filter((item) => item.label !== ''))
const activeIndices = computed(() => normalizeNumberArray(readPayloadArray('activeIndices') || props.block.activeIndices || []))
const compareIds = computed(() => normalizeStringArray(readPayloadArray('compareIds') || props.block.compareIds || []))
const pathIds = computed(() => normalizeStringArray(readPayloadArray('pathIds') || props.block.pathIds || []))
const stageSize = computed(() => {
  const maxDepth = items.value.length ? Math.floor(Math.log2(items.value.length)) : 0
  const maxWidth = Math.max(1, 2 ** maxDepth)
  return {
    width: Math.max(560, maxWidth * 82),
    height: Math.max(160, (maxDepth + 1) * 82),
  }
})
const heapNodes = computed<HeapNode[]>(() => items.value.map((item) => {
  const depth = Math.floor(Math.log2(item.index + 1))
  const firstIndex = 2 ** depth - 1
  const order = item.index - firstIndex
  const levelCount = 2 ** depth
  return {
    ...item,
    id: String(item.index),
    depth,
    order,
    x: ((order + 1) * stageSize.value.width) / (levelCount + 1),
    y: depth * 82 + 28,
  }
}))
const nodeById = computed(() => new Map(heapNodes.value.map((node) => [node.id, node])))
const heapEdges = computed(() => heapNodes.value
  .filter((node) => node.index > 0)
  .map((node) => {
    const parentId = String(Math.floor((node.index - 1) / 2))
    const parent = nodeById.value.get(parentId)
    if (!parent) return null
    return {
      from: parent.id,
      to: node.id,
      fromX: parent.x,
      fromY: parent.y + 22,
      toX: node.x,
      toY: node.y - 22,
    }
  })
  .filter((edge): edge is { from: string; to: string; fromX: number; fromY: number; toX: number; toY: number } => !!edge))

function isActiveIndex(index: number): boolean {
  return activeIndices.value.includes(index)
}

function isCompare(id: string): boolean {
  return compareIds.value.includes(id)
}

function isPath(id: string): boolean {
  return pathIds.value.includes(id)
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

function normalizeNumberArray(values: unknown[]): number[] {
  return values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
}

function normalizeStringArray(values: unknown[]): string[] {
  return values.map((value) => String(value)).filter(Boolean)
}

function readPayloadArray(key: string): unknown[] | null {
  const value = props.sceneAction?.payload?.[key]
  return Array.isArray(value) ? value : null
}
</script>

<style scoped lang="scss">
.heap-block {
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

.structure-label {
  flex: 0 0 auto;
  padding: 3px 9px;
  border: 1px solid rgba(37, 99, 235, 0.18);
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 700;
}

.heap-tree-scroll {
  overflow-x: auto;
  padding: 4px 2px 10px;
}

.heap-tree-stage {
  position: relative;
  min-width: 100%;
}

.heap-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.heap-edge {
  stroke: #cbd5e1;
  stroke-width: 2;

  &.compare {
    stroke: #d97706;
    stroke-width: 3;
  }
}

.heap-node {
  position: absolute;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  margin-left: -23px;
  margin-top: -23px;
  border: 2px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
  color: #0f172a;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;

  &.path {
    border-color: #2563eb;
    background: #eff6ff;
  }

  &.compare {
    border-color: #d97706;
    background: #fffbeb;
  }

  &.active {
    z-index: 2;
    transform: scale(1.08);
    border-color: #0f766e;
    background: #ecfdf5;
    box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.14), 0 10px 18px rgba(15, 118, 110, 0.12);
  }
}

.node-value {
  font-size: 15px;
  font-weight: 780;
  line-height: 1;
}

.node-index {
  margin-top: -5px;
  color: #94a3b8;
  font-size: 9px;
  line-height: 1;
}

.heap-array {
  display: flex;
  align-items: flex-start;
  overflow-x: auto;
  padding: 4px 2px 16px;
}

.array-cell {
  position: relative;
  display: grid;
  place-items: center;
  min-width: 50px;
  min-height: 46px;
  padding: 7px 9px 16px;
  border: 1px solid #cbd5e1;
  border-right-width: 0;
  background: #fff;

  &:first-child {
    border-radius: 8px 0 0 8px;
  }

  &:last-child {
    border-right-width: 1px;
    border-radius: 0 8px 8px 0;
  }

  &.compare {
    background: #fffbeb;
    border-color: #d97706;
  }

  &.active {
    z-index: 1;
    background: #ecfdf5;
    border-color: #0f766e;
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.12);
  }
}

.array-value {
  color: #0f172a;
  font-weight: 760;
  line-height: 1.1;
}

.array-index {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 2px;
  color: #94a3b8;
  font-size: 10px;
  text-align: center;
}

.heap-hint {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: #64748b;
  font-size: 12px;
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
