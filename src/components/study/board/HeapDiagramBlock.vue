<template>
  <section class="heap-block" :class="`heap-kind-${heapKind}`">
    <div class="lesson-block-header" v-if="block.title">
      <div class="lesson-block-title">{{ block.title }}</div>
      <div class="heap-badges">
        <span class="structure-label">堆</span>
        <span class="heap-kind-label">{{ heapKindLabel }}</span>
      </div>
    </div>

    <div v-if="heapNodes.length" class="heap-layout">
      <div class="heap-visual-panel">
        <div class="heap-tree-scroll">
          <div class="heap-tree-stage" :style="{ width: `${stageSize.width}px`, height: `${stageSize.height}px` }">
            <svg
              class="heap-lines"
              :width="stageSize.width"
              :height="stageSize.height"
              :viewBox="`0 0 ${stageSize.width} ${stageSize.height}`"
              aria-hidden="true"
            >
              <line
                v-for="edge in heapEdges"
                :key="`${edge.from}-${edge.to}`"
                :x1="edge.fromX"
                :y1="edge.fromY"
                :x2="edge.toX"
                :y2="edge.toY"
                class="heap-edge"
                :class="{
                  compare: isCompareEdge(edge.from, edge.to),
                  path: isPathEdge(edge.from, edge.to),
                  swap: isSwapEdge(edge.from, edge.to),
                  violation: isViolationEdge(edge.from, edge.to),
                  muted: !edge.inHeap,
                }"
              />
            </svg>

            <div
              v-for="node in heapNodes"
              :key="node.id"
              class="heap-node"
              :class="nodeClass(node)"
              :style="{ left: `${node.x}px`, top: `${node.y}px` }"
              :title="`index ${node.index}: ${node.label}`"
            >
              <span class="node-value">{{ node.label }}</span>
              <span class="node-index">{{ node.index }}</span>
            </div>
          </div>
        </div>

        <div class="heap-array-map">
          <div
            v-for="item in items"
            :key="`heap-array-${item.index}`"
            class="array-cell"
            :class="indexClass(item.index)"
            :title="`index ${item.index}: ${item.label}`"
          >
            <span class="array-value">{{ item.label }}</span>
            <span class="array-index">{{ item.index }}</span>
          </div>
        </div>
      </div>

      <aside class="heap-inspector">
        <div class="heap-rule">
          <span class="rule-title">{{ heapKindLabel }}性质</span>
          <span class="rule-text">{{ heapRuleText }}</span>
        </div>

        <div class="heap-formulas">
          <span>parent(i) = floor((i - 1) / 2)</span>
          <span>left(i) = 2i + 1</span>
          <span>right(i) = 2i + 2</span>
        </div>

        <div class="heap-focus-list" v-if="focusRows.length">
          <div v-for="row in focusRows" :key="row.key" class="focus-row" :class="row.key">
            <span class="focus-label">{{ row.label }}</span>
            <span class="focus-value">{{ row.value }}</span>
          </div>
        </div>
      </aside>
    </div>

    <div v-else class="empty-structure">暂无堆元素</div>

    <p v-if="block.caption || block.content" class="lesson-block-caption">
      {{ block.caption || block.content }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LessonSceneAction, TeachingStructureAnimation, TeachingStructureBoardBlock } from '@/types/study'

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
  inHeap: boolean
  x: number
  y: number
}

interface HeapEdge {
  from: string
  to: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  inHeap: boolean
}

interface FocusRow {
  key: string
  label: string
  value: string
}

interface HeapTreeLayout {
  stageSize: {
    width: number
    height: number
  }
  nodes: HeapNode[]
}

const NODE_SIZE = 52
const LEVEL_GAP = 88
const LEVEL_SLOT_WIDTH = 74
const MIN_STAGE_WIDTH = 520
const STAGE_PADDING_X = 34
const STAGE_PADDING_Y = 24

const blockRecord = computed<Record<string, unknown>>(() => props.block as unknown as Record<string, unknown>)
const animation = computed<TeachingStructureAnimation>(() => {
  const payloadAnimation = readPayloadValue('animation')
  return (payloadAnimation && typeof payloadAnimation === 'object'
    ? payloadAnimation as TeachingStructureAnimation
    : props.block.animation) || {}
})
const rawItems = computed(() => readPayloadArray('items') || props.block.items || props.block.nodes || [])
const items = computed<HeapItem[]>(() => rawItems.value
  .map((value, index) => ({ label: itemLabel(value), index }))
  .filter((item) => item.label !== ''))
const heapKind = computed(() => {
  const raw = stringValue(readPayloadValue('heapType') ?? blockRecord.value.heapType ?? '')
    .toLowerCase()
    .replace(/\s/g, '')
  if (raw === 'min' || raw === 'minheap' || raw === '小根堆' || raw === '最小堆') return 'min'
  return 'max'
})
const heapKindLabel = computed(() => heapKind.value === 'min' ? '最小堆' : '最大堆')
const heapRuleText = computed(() => heapKind.value === 'min'
  ? '父节点值不大于任一孩子节点值'
  : '父节点值不小于任一孩子节点值')
const effectiveHeapSize = computed(() => {
  const raw = numberValue(readPayloadValue('heapSize') ?? blockRecord.value.heapSize, items.value.length)
  return Math.max(0, Math.min(items.value.length, raw))
})
const activeIndices = computed(() => normalizeIndexArray(readPayloadArray('activeIndices') || props.block.activeIndices || []))
const compareIds = computed(() => normalizeStringArray(readPayloadArray('compareIds') || props.block.compareIds || []))
const compareIndices = computed(() => normalizeIndexArray(compareIds.value))
const pathIds = computed(() => normalizeStringArray(readPayloadArray('pathIds') || props.block.pathIds || []))
const pathIndices = computed(() => normalizeIndexArray(pathIds.value))
const parentIndex = computed(() => {
  const raw = numberValue(readPayloadValue('parentIndex') ?? blockRecord.value.parentIndex, Number.NaN)
  if (Number.isFinite(raw)) return raw
  if (compareIndices.value.length >= 2) return Math.min(...compareIndices.value)
  return Number.NaN
})
const childIndices = computed(() => {
  const explicit = normalizeIndexArray(readPayloadArray('childIndices') || blockRecord.value.childIndices || [])
  if (explicit.length) return explicit
  if (!Number.isFinite(parentIndex.value)) return []
  return [parentIndex.value * 2 + 1, parentIndex.value * 2 + 2].filter((index) => index < items.value.length)
})
const swapIndices = computed(() => {
  const explicit = normalizeIndexArray(readPayloadArray('swapIndices') || blockRecord.value.swapIndices || [])
  if (explicit.length) return explicit
  if (String(animation.value.action || '').toLowerCase() !== 'swap') return []
  return normalizeIndexArray([animation.value.from, animation.value.to])
})
const violationIndices = computed(() => normalizeIndexArray(
  readPayloadArray('violationIndices') || blockRecord.value.violationIndices || [],
))
const sortedRange = computed(() => {
  const explicit = normalizeRange(readPayloadArray('sortedRange') || blockRecord.value.sortedRange)
  if (explicit) return explicit
  if (effectiveHeapSize.value < items.value.length) {
    return [effectiveHeapSize.value, items.value.length - 1] as [number, number]
  }
  return null
})
const operationLabel = computed(() => {
  const action = String(animation.value.action || readPayloadValue('action') || '').toLowerCase()
  const labels: Record<string, string> = {
    compare: '比较父子节点',
    swap: '交换节点',
    sift_up: '上浮调整',
    siftup: '上浮调整',
    sift_down: '下沉调整',
    siftdown: '下沉调整',
    heapify: '建堆调整',
    insert: '插入元素',
    delete: '删除堆顶',
    extract: '取出堆顶',
  }
  return labels[action] || ''
})
const treeLayout = computed<HeapTreeLayout>(() => buildHeapTreeLayout(items.value))
const stageSize = computed(() => treeLayout.value.stageSize)
const heapNodes = computed<HeapNode[]>(() => treeLayout.value.nodes)
const nodeById = computed(() => new Map(heapNodes.value.map((node) => [node.id, node])))
const heapEdges = computed<HeapEdge[]>(() => heapNodes.value
  .filter((node) => node.index > 0)
  .map((node) => {
    const parentId = String(Math.floor((node.index - 1) / 2))
    const parent = nodeById.value.get(parentId)
    if (!parent) return null
    const clipped = clipEdge(parent, node)
    return {
      from: parent.id,
      to: node.id,
      ...clipped,
      inHeap: parent.inHeap && node.inHeap,
    }
  })
  .filter((edge): edge is HeapEdge => !!edge))
const focusRows = computed<FocusRow[]>(() => {
  const rows: FocusRow[] = []
  if (operationLabel.value) rows.push({ key: 'operation', label: '当前动作', value: operationLabel.value })
  if (Number.isFinite(parentIndex.value)) rows.push({ key: 'parent', label: '父节点', value: formatIndex(parentIndex.value) })
  if (childIndices.value.length) rows.push({ key: 'child', label: '孩子节点', value: childIndices.value.map(formatIndex).join(', ') })
  if (compareIndices.value.length) rows.push({ key: 'compare', label: '比较节点', value: compareIndices.value.map(formatIndex).join(', ') })
  if (swapIndices.value.length) rows.push({ key: 'swap', label: '交换节点', value: swapIndices.value.map(formatIndex).join(', ') })
  if (violationIndices.value.length) rows.push({ key: 'violation', label: '待修复', value: violationIndices.value.map(formatIndex).join(', ') })
  if (sortedRange.value) rows.push({ key: 'sorted', label: '有序区间', value: `[${sortedRange.value[0]}, ${sortedRange.value[1]}]` })
  if (effectiveHeapSize.value < items.value.length) rows.push({ key: 'heap-size', label: '有效堆区', value: `[0, ${Math.max(effectiveHeapSize.value - 1, 0)}]` })
  return rows
})

function nodeClass(node: HeapNode): Record<string, boolean> {
  return {
    active: isActiveIndex(node.index),
    compare: isCompare(node.id, node.index),
    path: isPath(node.id, node.index),
    parent: node.index === parentIndex.value,
    child: childIndices.value.includes(node.index),
    swap: swapIndices.value.includes(node.index),
    violation: violationIndices.value.includes(node.index),
    sorted: isSortedIndex(node.index),
    muted: !node.inHeap,
  }
}

function indexClass(index: number): Record<string, boolean> {
  return {
    active: isActiveIndex(index),
    compare: isCompare(String(index), index),
    path: isPath(String(index), index),
    parent: index === parentIndex.value,
    child: childIndices.value.includes(index),
    swap: swapIndices.value.includes(index),
    violation: violationIndices.value.includes(index),
    sorted: isSortedIndex(index),
    muted: index >= effectiveHeapSize.value,
  }
}

function isActiveIndex(index: number): boolean {
  return activeIndices.value.includes(index)
}

function isCompare(id: string, index: number): boolean {
  return compareIds.value.includes(id) || compareIndices.value.includes(index)
}

function isPath(id: string, index: number): boolean {
  return pathIds.value.includes(id) || pathIndices.value.includes(index)
}

function isSortedIndex(index: number): boolean {
  return !!sortedRange.value && index >= sortedRange.value[0] && index <= sortedRange.value[1]
}

function isCompareEdge(from: string, to: string): boolean {
  return isCompare(from, Number(from)) && isCompare(to, Number(to))
}

function isPathEdge(from: string, to: string): boolean {
  return isPath(from, Number(from)) && isPath(to, Number(to))
}

function isSwapEdge(from: string, to: string): boolean {
  return swapIndices.value.includes(Number(from)) && swapIndices.value.includes(Number(to))
}

function isViolationEdge(from: string, to: string): boolean {
  return violationIndices.value.includes(Number(from)) || violationIndices.value.includes(Number(to))
}

function formatIndex(index: number): string {
  const item = items.value[index]
  return item ? `${index}:${item.label}` : String(index)
}

function buildHeapTreeLayout(values: HeapItem[]): HeapTreeLayout {
  if (!values.length) {
    return {
      stageSize: { width: MIN_STAGE_WIDTH, height: 180 },
      nodes: [],
    }
  }

  const maxIndex = Math.max(...values.map((item) => item.index))
  const maxDepth = Math.floor(Math.log2(maxIndex + 1))
  const bottomSlotCount = 2 ** maxDepth
  const baseWidth = Math.max(MIN_STAGE_WIDTH, bottomSlotCount * LEVEL_SLOT_WIDTH + STAGE_PADDING_X * 2)
  const innerWidth = baseWidth - STAGE_PADDING_X * 2

  const rawNodes = values.map((item) => {
    const depth = Math.floor(Math.log2(item.index + 1))
    const firstIndex = 2 ** depth - 1
    const order = item.index - firstIndex
    const span = 2 ** (maxDepth - depth)
    return {
      ...item,
      id: String(item.index),
      depth,
      order,
      inHeap: item.index < effectiveHeapSize.value,
      x: STAGE_PADDING_X + ((order * span + span / 2) * innerWidth) / bottomSlotCount,
      y: STAGE_PADDING_Y + NODE_SIZE / 2 + depth * LEVEL_GAP,
    }
  })

  const minX = Math.min(...rawNodes.map((node) => node.x))
  const maxX = Math.max(...rawNodes.map((node) => node.x))
  const centerSpan = maxX - minX
  const stageWidth = Math.max(MIN_STAGE_WIDTH, centerSpan + (STAGE_PADDING_X + NODE_SIZE) * 2)
  const stageHeight = Math.max(180, STAGE_PADDING_Y * 2 + NODE_SIZE + maxDepth * LEVEL_GAP)
  const xOffset = centerSpan <= 0 ? stageWidth / 2 : (stageWidth - centerSpan) / 2
  const normalizedNodes = rawNodes.map((node) => ({
    ...node,
    x: node.x - minX + xOffset,
  }))

  return {
    stageSize: {
      width: Math.ceil(stageWidth),
      height: Math.ceil(stageHeight),
    },
    nodes: normalizedNodes,
  }
}

function clipEdge(from: HeapNode, to: HeapNode) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
  const offset = NODE_SIZE / 2
  return {
    fromX: from.x + (dx / length) * offset,
    fromY: from.y + (dy / length) * offset,
    toX: to.x - (dx / length) * offset,
    toY: to.y - (dy / length) * offset,
  }
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

function normalizeIndexArray(values: unknown): number[] {
  const list = Array.isArray(values) ? values : []
  return Array.from(new Set(list
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0)))
}

function normalizeStringArray(values: unknown[]): string[] {
  return values.map((value) => String(value)).filter(Boolean)
}

function normalizeRange(value: unknown): [number, number] | null {
  if (!Array.isArray(value) || value.length < 2) return null
  const start = Number(value[0])
  const end = Number(value[1])
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start) return null
  return [start, Math.min(end, Math.max(items.value.length - 1, 0))]
}

function numberValue(value: unknown, fallback: number): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function stringValue(value: unknown): string {
  return value === null || value === undefined ? '' : String(value)
}

function readPayloadValue(key: string): unknown {
  return props.sceneAction?.payload?.[key]
}

function readPayloadArray(key: string): unknown[] | null {
  const value = readPayloadValue(key)
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

.heap-badges {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
}

.structure-label,
.heap-kind-label {
  border-radius: 999px;
  font-size: 11px;
  font-weight: 760;
  line-height: 1.45;
}

.structure-label {
  padding: 3px 9px;
  border: 1px solid rgba(37, 99, 235, 0.18);
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
}

.heap-kind-label {
  padding: 3px 8px;
  border: 1px solid rgba(15, 118, 110, 0.18);
  background: rgba(240, 253, 250, 0.9);
  color: #0f766e;
}

.heap-layout {
  display: grid;
  grid-template-columns: minmax(560px, 1fr) minmax(220px, 280px);
  gap: 14px;
  align-items: stretch;
}

.heap-visual-panel,
.heap-inspector {
  border: 1px solid rgba(203, 213, 225, 0.76);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
}

.heap-visual-panel {
  min-width: 0;
  display: grid;
  gap: 10px;
  padding: 12px;
}

.heap-tree-scroll {
  overflow-x: auto;
  padding: 2px 2px 8px;
}

.heap-tree-stage {
  position: relative;
  flex: 0 0 auto;
  margin: 0 auto;
  border-radius: 8px;
  background: rgba(248, 250, 252, 0.72);
}

.heap-lines {
  position: absolute;
  inset: 0;
}

.heap-edge {
  stroke: #cbd5e1;
  stroke-width: 2;

  &.compare {
    stroke: #d97706;
    stroke-width: 3;
  }

  &.path {
    stroke: #2563eb;
    stroke-width: 3;
  }

  &.swap {
    stroke: #7c3aed;
    stroke-width: 3;
  }

  &.violation {
    stroke: #dc2626;
    stroke-width: 3;
  }

  &.muted {
    stroke-dasharray: 5 5;
    opacity: 0.45;
  }
}

.heap-node {
  position: absolute;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  margin-left: -26px;
  margin-top: -26px;
  border: 2px solid #cbd5e1;
  border-radius: 12px;
  background: #fff;
  color: #0f172a;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease, opacity 0.18s ease;

  &.parent {
    border-color: #0f766e;
    background: #f0fdfa;
  }

  &.child {
    border-color: #0284c7;
    background: #f0f9ff;
  }

  &.path {
    border-color: #2563eb;
    background: #eff6ff;
  }

  &.compare {
    border-color: #d97706;
    background: #fffbeb;
  }

  &.swap {
    border-color: #7c3aed;
    background: #f5f3ff;
  }

  &.violation {
    border-color: #dc2626;
    background: #fef2f2;
  }

  &.sorted,
  &.muted {
    opacity: 0.56;
    background: #f8fafc;
  }

  &.active {
    z-index: 2;
    transform: scale(1.08);
    border-color: #0f766e;
    background: #ecfdf5;
    box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.14), 0 10px 18px rgba(15, 118, 110, 0.12);
  }
}

.node-value,
.array-value {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #0f172a;
  font-weight: 780;
  line-height: 1.05;
}

.node-value {
  max-width: 42px;
  font-size: 15px;
}

.node-index {
  margin-top: -5px;
  color: #94a3b8;
  font-size: 9px;
  line-height: 1;
}

.heap-array-map {
  display: flex;
  align-items: stretch;
  overflow-x: auto;
  padding: 2px 2px 8px;
}

.array-cell {
  position: relative;
  display: grid;
  place-items: center;
  min-width: 54px;
  min-height: 48px;
  padding: 8px 10px 17px;
  border: 1px solid #cbd5e1;
  border-right-width: 0;
  background: #fff;
  transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;

  &:first-child {
    border-radius: 8px 0 0 8px;
  }

  &:last-child {
    border-right-width: 1px;
    border-radius: 0 8px 8px 0;
  }

  &.parent {
    background: #f0fdfa;
    border-color: #0f766e;
  }

  &.child {
    background: #f0f9ff;
    border-color: #0284c7;
  }

  &.compare {
    background: #fffbeb;
    border-color: #d97706;
  }

  &.swap {
    background: #f5f3ff;
    border-color: #7c3aed;
  }

  &.violation {
    background: #fef2f2;
    border-color: #dc2626;
  }

  &.sorted,
  &.muted {
    background: #f8fafc;
    color: #94a3b8;
    opacity: 0.68;
  }

  &.active {
    z-index: 1;
    background: #ecfdf5;
    border-color: #0f766e;
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.12);
  }
}

.array-value {
  max-width: 42px;
  font-size: 14px;
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

.heap-inspector {
  display: grid;
  align-content: start;
  gap: 10px;
  padding: 12px;
}

.heap-rule {
  display: grid;
  gap: 5px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
}

.rule-title {
  color: #0f172a;
  font-size: 13px;
  font-weight: 820;
}

.rule-text {
  color: #475569;
  font-size: 12px;
  line-height: 1.55;
}

.heap-formulas {
  display: grid;
  gap: 5px;
  color: #334155;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 11px;
  line-height: 1.5;
}

.heap-focus-list {
  display: grid;
  gap: 6px;
}

.focus-row {
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  padding: 6px 8px;
  border-radius: 7px;
  background: #f8fafc;
  color: #475569;
  font-size: 12px;

  &.compare {
    background: #fffbeb;
    color: #92400e;
  }

  &.swap {
    background: #f5f3ff;
    color: #6d28d9;
  }

  &.violation {
    background: #fef2f2;
    color: #b91c1c;
  }
}

.focus-label {
  color: #64748b;
  font-weight: 740;
}

.focus-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 760;
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
