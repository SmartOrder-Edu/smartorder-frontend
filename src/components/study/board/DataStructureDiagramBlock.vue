<template>
  <section
    class="structure-block"
    :class="[`structure-${structureType}`, `structure-action-${operationAction}`]"
    :style="structureStyle"
  >
    <div class="lesson-block-header" v-if="block.title || structureLabel">
      <div class="lesson-block-title" v-if="block.title">{{ block.title }}</div>
      <div class="structure-badges">
        <span class="structure-label">{{ structureLabel }}</span>
        <span v-if="operationLabel" class="operation-label">{{ operationLabel }}</span>
      </div>
    </div>

    <div v-if="structureType === 'stack'" class="stack-stage">
      <div v-if="isPushMoving" class="moving-token stack-push-token">{{ movingItemLabel }}</div>
      <div class="stack-view">
        <div
          v-for="item in reversedItems"
          :key="item.key"
          class="stack-cell"
          :class="cellClass(item.originalIndex)"
        >
          <span class="cell-value">{{ item.label }}</span>
          <span v-if="item.originalIndex === topIndex" class="cell-pointer">top</span>
        </div>
      </div>
      <div v-if="isPopMoving && topItem" class="moving-token stack-pop-token">{{ topItem.label }}</div>
      <div v-if="!phaseItems.length && !movingItemLabel" class="empty-structure">空{{ structureLabel }}</div>
    </div>

    <div v-else-if="structureType === 'linked_list'" class="linked-list-view">
      <template v-if="phaseItems.length">
        <div
          v-for="(item, index) in phaseItems"
          :key="item.key"
          class="list-node-wrap"
        >
          <div class="list-node" :class="cellClass(item.originalIndex)">
            <span class="node-index">{{ displayIndex(item.originalIndex) }}</span>
            <span class="node-value">{{ item.label }}</span>
          </div>
          <div
            v-if="index < phaseItems.length - 1"
            class="list-arrow"
            :class="{ active: isActive(item.originalIndex) || isActive(phaseItems[index + 1].originalIndex) }"
          >
            next
          </div>
        </div>
        <div
          v-if="isInsertMoving && Number.isFinite(targetIndex)"
          class="list-node-wrap list-insert-preview"
        >
          <div class="list-node active moving">
            <span class="node-index">{{ displayIndex(targetIndex) }}</span>
            <span class="node-value">{{ movingItemLabel }}</span>
          </div>
        </div>
        <div class="list-null">NULL</div>
      </template>
      <div v-else class="empty-structure">空{{ structureLabel }}</div>
    </div>

    <div v-else-if="structureType === 'hash_table'" class="hash-table-view">
      <div class="hash-formula" v-if="hashFormula">{{ hashFormula }}</div>
      <div class="hash-buckets">
        <div
          v-for="bucket in hashBuckets"
          :key="bucket.key"
          class="hash-bucket"
          :class="{
            active: isActive(bucket.originalIndex),
            compare: isCompare(bucket.originalIndex),
            processed: isProcessed(bucket.originalIndex),
            target: bucket.originalIndex === targetIndex,
          }"
        >
          <span class="bucket-index">{{ displayIndex(bucket.originalIndex) }}</span>
          <span class="bucket-value">{{ bucket.label || 'empty' }}</span>
          <span v-if="bucket.originalIndex === targetIndex && isMovingPhase" class="moving-token bucket-token">
            {{ movingItemLabel }}
          </span>
        </div>
      </div>
    </div>

    <div v-else-if="structureType === 'matrix'" class="matrix-view">
      <div
        class="matrix-grid"
        :style="{ gridTemplateColumns: `repeat(${matrixColumnCount}, minmax(44px, 1fr))` }"
      >
        <div
          v-for="cell in matrixCells"
          :key="cell.key"
          class="matrix-cell"
          :class="{
            active: isActiveMatrixCell(cell),
            compare: isCompareMatrixCell(cell),
            processed: isProcessed(cell.flatIndex),
          }"
        >
          <span class="cell-value">{{ cell.label }}</span>
          <span class="cell-index">{{ cell.row }},{{ cell.col }}</span>
        </div>
      </div>
    </div>

    <div v-else class="linear-view">
      <div class="linear-cells">
        <div
          v-for="item in linearCells"
          :key="item.key"
          class="linear-cell"
          :class="cellClass(item.originalIndex, item.ghost)"
        >
          <span
            v-if="isMovingPhase && item.originalIndex === targetIndex && movingItemLabel"
            class="moving-token linear-moving-token"
          >
            {{ movingItemLabel }}
          </span>
          <span class="cell-value">{{ item.label }}</span>
          <span class="cell-index">{{ item.ghost ? displayIndex(item.originalIndex) : displayIndex(item.originalIndex) }}</span>
          <span v-if="pointerNamesAt(item.originalIndex).length" class="pointer-stack">
            <span
              v-for="name in pointerNamesAt(item.originalIndex)"
              :key="name"
              class="pointer-chip"
              :class="{ moving: highlightedPointers.includes(name) }"
            >
              {{ name }}
            </span>
          </span>
        </div>
      </div>
      <div v-if="!linearCells.length" class="empty-structure">空{{ structureLabel }}</div>
    </div>

    <div v-if="phaseDots.length" class="phase-strip">
      <span
        v-for="phase in phaseDots"
        :key="phase.name"
        class="phase-dot"
        :class="{ active: phase.name === currentPhase.name }"
      >
        {{ phase.label }}
      </span>
    </div>

    <div v-if="pointerEntries.length" class="pointer-summary">
      <span v-for="entry in pointerEntries" :key="entry.name" class="summary-chip">
        {{ entry.name }} = {{ entry.value }}
      </span>
    </div>

    <p v-if="phaseNarration" class="structure-narration">{{ phaseNarration }}</p>
    <p v-else-if="block.caption || block.content" class="lesson-block-caption">
      {{ block.caption || block.content }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type {
  LessonSceneAction,
  TeachingStructureAnimation,
  TeachingStructureAnimationPhase,
  TeachingStructureBoardBlock,
} from '@/types/study'

const props = defineProps<{
  block: TeachingStructureBoardBlock
  sceneAction?: LessonSceneAction | null
}>()

interface DisplayItem {
  key: string
  label: string
  originalIndex: number
  ghost?: boolean
}

interface MatrixCell {
  key: string
  label: string
  row: number
  col: number
  flatIndex: number
}

const currentPhaseName = ref('after')
let timers: Array<ReturnType<typeof setTimeout>> = []

const blockRecord = computed<Record<string, unknown>>(() => props.block as unknown as Record<string, unknown>)
const structureType = computed(() => normalizeStructureType(
  readScenePayloadString('structureType') || props.block.structureType || 'array',
))
const animation = computed<TeachingStructureAnimation>(() => {
  const payloadAnimation = readScenePayloadObject('animation')
  return (payloadAnimation as TeachingStructureAnimation | null) || props.block.animation || {}
})
const operationAction = computed(() => String(animation.value.action || readScenePayloadString('action') || '').toLowerCase().replace(/[-\s]/g, '_') || 'state')
const durationMs = computed(() => Math.max(Number(animation.value.durationMs || props.sceneAction?.durationMs) || 1800, 720))
const baseItems = computed(() => readScenePayloadArray('items') || props.block.items || props.block.nodes || [])
const basePointers = computed(() => ({
  ...(props.block.pointers || {}),
  ...readScenePayloadRecord('pointers'),
}))
const phaseDefinitions = computed<TeachingStructureAnimationPhase[]>(() => {
  if (animation.value.phases?.length) return normalizePhases(animation.value.phases)
  return derivePhases(animation.value)
})
const currentPhase = computed<TeachingStructureAnimationPhase>(() => (
  phaseDefinitions.value.find((phase) => phase.name === currentPhaseName.value)
  || phaseDefinitions.value[0]
  || { name: 'after', startRatio: 0, items: baseItems.value, pointers: basePointers.value }
))
const phaseRawItems = computed(() => currentPhase.value.items || baseItems.value)
const phaseItems = computed<DisplayItem[]>(() => normalizeItems(phaseRawItems.value))
const reversedItems = computed(() => [...phaseItems.value].reverse())
const phasePointers = computed(() => ({
  ...basePointers.value,
  ...(currentPhase.value.pointers || {}),
}))
const activeIndices = computed(() => normalizeNumberArray(readScenePayloadArray('activeIndices') || props.block.activeIndices || []))
const compareIndices = computed(() => normalizeNumberArray([
  ...(readScenePayloadArray('compareIds') || props.block.compareIds || []),
  ...(readScenePayloadArray('compareIndices') || []),
]))
const swapIndices = computed(() => normalizeNumberArray(readScenePayloadArray('swapIndices') || props.block.swapIndices || []))
const processedRange = computed(() => {
  const range = normalizeRange(readScenePayloadArray('processedRange') || readScenePayloadArray('sortedRange') || blockRecord.value.processedRange || props.block.sortedRange)
  if (!range) return null
  const [a, b] = range
  return a <= b ? range : [b, a]
})
const topIndex = computed(() => {
  const pointerTop = Number(phasePointers.value.top)
  if (Number.isFinite(pointerTop)) return pointerTop
  return phaseItems.value.length - 1
})
const topItem = computed(() => phaseItems.value.find((item) => item.originalIndex === topIndex.value) || phaseItems.value.at(-1) || null)
const isMovingPhase = computed(() => currentPhase.value.name === 'moving' || currentPhase.value.name === 'swap' || currentPhase.value.name === 'probe')
const movingItem = computed(() => currentPhase.value.movingItem ?? animation.value.movingItem)
const movingItemLabel = computed(() => itemLabel(movingItem.value))
const targetIndex = computed(() => firstFiniteNumber(currentPhase.value.targetIndex, animation.value.to, phasePointers.value.rear, phaseItems.value.length))
const sourceIndex = computed(() => firstFiniteNumber(currentPhase.value.sourceIndex, animation.value.from, phasePointers.value.front, topIndex.value))
const highlightedPointers = computed(() => currentPhase.value.highlightPointers || [])
const pointerEntries = computed(() =>
  Object.entries(phasePointers.value)
    .filter(([, value]) => value !== undefined && value !== null && `${value}` !== '')
    .map(([name, value]) => ({ name, value })),
)
const linearCells = computed<DisplayItem[]>(() => {
  const cells = phaseItems.value.map((item) => ({ ...item, ghost: false }))
  if (shouldShowTargetGhost.value && !cells.some((item) => item.originalIndex === targetIndex.value)) {
    cells.push({
      key: `ghost-${targetIndex.value}`,
      label: operationAction.value === 'enqueue' ? '下一位' : '待写入',
      originalIndex: targetIndex.value,
      ghost: true,
    })
  }
  return cells
})
const shouldShowTargetGhost = computed(() =>
  isMovingPhase.value
  && ['insert', 'enqueue', 'push'].includes(operationAction.value)
  && Number.isFinite(targetIndex.value),
)
const isPushMoving = computed(() => isMovingPhase.value && operationAction.value === 'push' && !!movingItemLabel.value)
const isPopMoving = computed(() => isMovingPhase.value && operationAction.value === 'pop')
const isInsertMoving = computed(() => isMovingPhase.value && ['insert', 'delete'].includes(operationAction.value) && !!movingItemLabel.value)
const phaseDots = computed(() => phaseDefinitions.value.map((phase) => ({
  name: phase.name,
  label: phaseLabel(phase.name),
})))
const phaseNarration = computed(() => currentPhase.value.narrationHint || '')
const structureStyle = computed(() => ({
  '--structure-animation-duration': `${Math.max(durationMs.value * 0.34, 420)}ms`,
}))
const operationLabel = computed(() => {
  const labels: Record<string, string> = {
    state: '',
    compare: '比较',
    swap: '交换',
    insert: '插入',
    delete: '删除',
    push: '入栈',
    pop: '出栈',
    peek: '查看栈顶',
    enqueue: '入队',
    dequeue: '出队',
    traverse: '遍历',
    visit: '访问',
    search: '查找',
    probe: '探测',
    hash: '哈希定位',
    update: '更新',
  }
  return labels[operationAction.value] || operationAction.value
})
const structureLabel = computed(() => {
  const labels: Record<string, string> = {
    array: '数组',
    stack: '栈',
    queue: '队列',
    linked_list: '链表',
    hash_table: '哈希表',
    matrix: '矩阵',
  }
  return labels[structureType.value] || structureType.value || '数据结构'
})
const hashFormula = computed(() => {
  const raw = blockRecord.value.hashFormula ?? blockRecord.value.formula ?? props.block.caption
  return typeof raw === 'string' && raw.includes('hash') ? raw : ''
})
const hashBuckets = computed(() => linearCells.value.map((item) => ({
  ...item,
  key: `bucket-${item.originalIndex}`,
})))
const matrixRows = computed(() => normalizeMatrixRows(phaseRawItems.value))
const matrixColumnCount = computed(() => Math.max(...matrixRows.value.map((row) => row.length), 1))
const matrixCells = computed<MatrixCell[]>(() => {
  const columns = matrixColumnCount.value
  return matrixRows.value.flatMap((row, rowIndex) =>
    Array.from({ length: columns }, (_, colIndex) => ({
      key: `matrix-${rowIndex}-${colIndex}`,
      label: itemLabel(row[colIndex] ?? ''),
      row: rowIndex,
      col: colIndex,
      flatIndex: rowIndex * columns + colIndex,
    })),
  )
})

watch(
  () => animationSignature(animation.value, props.sceneAction?.actionId || '', structureType.value),
  () => restartAnimation(),
)

onMounted(restartAnimation)
onUnmounted(clearTimers)

function restartAnimation() {
  clearTimers()
  const phases = phaseDefinitions.value
  currentPhaseName.value = phases[0]?.name || 'after'
  phases.slice(1).forEach((phase) => {
    const delay = Math.max(0, Math.round((phase.startRatio ?? 0) * durationMs.value))
    timers.push(setTimeout(() => {
      currentPhaseName.value = phase.name
    }, delay))
  })
}

function clearTimers() {
  timers.forEach((timer) => clearTimeout(timer))
  timers = []
}

function normalizePhases(phases: TeachingStructureAnimationPhase[]): TeachingStructureAnimationPhase[] {
  return phases
    .filter((phase) => !!phase?.name)
    .map((phase, index) => ({
      ...phase,
      startRatio: phase.startRatio ?? (index === 0 ? 0 : index / phases.length),
    }))
    .sort((a, b) => (a.startRatio ?? 0) - (b.startRatio ?? 0))
}

function derivePhases(value: TeachingStructureAnimation): TeachingStructureAnimationPhase[] {
  const action = String(value.action || '').toLowerCase().replace(/[-\s]/g, '_')
  const previousItems = value.previous?.items || baseItems.value
  const previousPointers = value.previous?.pointers || value.previousPointers || basePointers.value
  const nextItems = value.next?.items || baseItems.value
  const nextPointers = value.next?.pointers || value.nextPointers || basePointers.value

  if (['push', 'enqueue', 'insert'].includes(action)) {
    return [
      { name: 'before', startRatio: 0, items: previousItems, pointers: previousPointers, narrationHint: `${operationLabelText(action)}前：先定位写入位置。` },
      { name: 'moving', startRatio: 0.34, items: previousItems, pointers: previousPointers, movingItem: value.movingItem, targetIndex: Number(value.to), narrationHint: `执行中：${itemLabel(value.movingItem) || '新元素'} 正在进入目标位置。` },
      { name: 'after', startRatio: 0.72, items: nextItems, pointers: nextPointers, narrationHint: `${operationLabelText(action)}后：结构状态和指针同步更新。` },
    ]
  }
  if (['pop', 'dequeue', 'delete'].includes(action)) {
    return [
      { name: 'before', startRatio: 0, items: previousItems, pointers: previousPointers, narrationHint: `${operationLabelText(action)}前：先确认要移除的元素。` },
      { name: 'moving', startRatio: 0.34, items: previousItems, pointers: previousPointers, sourceIndex: Number(value.from), narrationHint: '执行中：目标元素离开结构，其余关系准备收缩。' },
      { name: 'after', startRatio: 0.72, items: nextItems, pointers: nextPointers, narrationHint: `${operationLabelText(action)}后：空位被收回，指针移动到新位置。` },
    ]
  }
  if (action === 'swap') {
    return [
      { name: 'before', startRatio: 0, items: previousItems, pointers: previousPointers, narrationHint: '交换前：先锁定两个位置。' },
      { name: 'swap', startRatio: 0.35, items: previousItems, pointers: previousPointers, narrationHint: '执行中：两个元素互换位置。' },
      { name: 'after', startRatio: 0.72, items: nextItems, pointers: nextPointers, narrationHint: '交换后：继续检查新的局部关系。' },
    ]
  }
  if (['compare', 'search', 'probe', 'hash', 'visit', 'traverse', 'peek', 'update'].includes(action)) {
    return [
      { name: 'focus', startRatio: 0, items: baseItems.value, pointers: basePointers.value, narrationHint: operationLabelText(action) || '' },
    ]
  }
  return [{ name: 'after', startRatio: 0, items: baseItems.value, pointers: basePointers.value }]
}

function cellClass(index: number, ghost = false): Record<string, boolean> {
  return {
    active: isActive(index),
    compare: isCompare(index),
    swap: swapIndices.value.includes(index),
    source: index === sourceIndex.value && isMovingPhase.value,
    target: index === targetIndex.value && isMovingPhase.value,
    processed: isProcessed(index),
    top: index === topIndex.value,
    ghost,
  }
}

function isActive(index: number): boolean {
  return activeIndices.value.includes(index)
}

function isCompare(index: number): boolean {
  return compareIndices.value.includes(index)
}

function isProcessed(index: number): boolean {
  if (!processedRange.value) return false
  return index >= processedRange.value[0] && index <= processedRange.value[1]
}

function isActiveMatrixCell(cell: MatrixCell): boolean {
  return isActive(cell.flatIndex) || activeIndices.value.includes(cell.row) || activeIndices.value.includes(cell.col)
}

function isCompareMatrixCell(cell: MatrixCell): boolean {
  return isCompare(cell.flatIndex)
}

function pointerNamesAt(index: number): string[] {
  return Object.entries(phasePointers.value)
    .filter(([, value]) => Number(value) === index)
    .map(([name]) => name)
}

function normalizeItems(values: unknown[]): DisplayItem[] {
  return values.map((value, index) => ({
    key: `item-${index}-${itemLabel(value)}`,
    label: itemLabel(value),
    originalIndex: index,
  })).filter((item) => item.label !== '')
}

function normalizeMatrixRows(values: unknown[]): unknown[][] {
  if (!values.length) return []
  if (Array.isArray(values[0])) return values as unknown[][]
  const columns = Number(blockRecord.value.columns ?? blockRecord.value.colCount ?? Math.ceil(Math.sqrt(values.length)))
  const width = Math.max(1, Number.isFinite(columns) ? columns : values.length)
  const rows: unknown[][] = []
  for (let i = 0; i < values.length; i += width) rows.push(values.slice(i, i + width))
  return rows
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
  if (value === 'hashtable' || value === 'hashmap' || value === 'hash_map') return 'hash_table'
  return value || 'array'
}

function normalizeNumberArray(values: unknown[]): number[] {
  return Array.from(new Set(values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))))
}

function normalizeRange(value: unknown): [number, number] | null {
  if (!Array.isArray(value) || value.length < 2) return null
  const start = Number(value[0])
  const end = Number(value[1])
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  return [start, end]
}

function firstFiniteNumber(...values: unknown[]): number {
  for (const value of values) {
    const number = Number(value)
    if (Number.isFinite(number)) return number
  }
  return Number.NaN
}

function displayIndex(index: number): number {
  const base = Number(readScenePayloadValue('indexBase') ?? blockRecord.value.indexBase ?? 0)
  return base === 1 ? index + 1 : index
}

function phaseLabel(name: string): string {
  const labels: Record<string, string> = {
    before: '操作前',
    moving: '执行中',
    swap: '交换中',
    probe: '探测中',
    focus: '聚焦',
    after: '完成后',
    done: '完成',
  }
  return labels[name] || name
}

function operationLabelText(action: string): string {
  const labels: Record<string, string> = {
    push: '入栈',
    pop: '出栈',
    enqueue: '入队',
    dequeue: '出队',
    insert: '插入',
    delete: '删除',
    swap: '交换',
    compare: '比较',
    search: '查找',
    probe: '探测',
    hash: '哈希定位',
    visit: '访问',
    traverse: '遍历',
    peek: '查看栈顶',
    update: '更新',
  }
  return labels[action] || action
}

function animationSignature(value: TeachingStructureAnimation, actionId: string, type: string): string {
  return `${type}:${actionId}:${JSON.stringify(value)}`
}

function readScenePayloadValue(key: string): unknown {
  return props.sceneAction?.payload?.[key]
}

function readScenePayloadString(key: string): string {
  const value = readScenePayloadValue(key)
  return typeof value === 'string' ? value : ''
}

function readScenePayloadArray(key: string): unknown[] | null {
  const value = readScenePayloadValue(key)
  return Array.isArray(value) ? value : null
}

function readScenePayloadObject(key: string): Record<string, unknown> | null {
  const value = readScenePayloadValue(key)
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readScenePayloadRecord(key: string): Record<string, number | string> {
  const value = readScenePayloadValue(key)
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, number | string>
}
</script>

<style scoped lang="scss">
.structure-block {
  --structure-animation-duration: 620ms;
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
  font-weight: 800;
  line-height: 1.34;
}

.structure-badges {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
}

.structure-label,
.operation-label,
.summary-chip,
.pointer-chip,
.phase-dot {
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.45;
}

.structure-label {
  padding: 3px 9px;
  border: 1px solid rgba(37, 99, 235, 0.18);
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
}

.operation-label {
  padding: 3px 8px;
  border: 1px solid rgba(15, 118, 110, 0.18);
  background: #f0fdfa;
  color: #0f766e;
}

.linear-view,
.hash-table-view,
.matrix-view {
  overflow-x: auto;
  padding: 28px 2px 28px;
}

.linear-cells,
.hash-buckets {
  display: flex;
  align-items: flex-start;
  min-width: max-content;
}

.linear-cell,
.hash-bucket,
.matrix-cell {
  position: relative;
  display: grid;
  place-items: center;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #0f172a;
  transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;

  &.active {
    z-index: 1;
    border-color: #0f766e;
    background: #ecfdf5;
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.12);
    animation: structurePulse var(--structure-animation-duration) ease-out;
  }

  &.compare {
    border-color: #d97706;
    background: #fffbeb;
    animation: comparePulse var(--structure-animation-duration) ease-out;
  }

  &.swap {
    border-color: #7c3aed;
    background: #f5f3ff;
    animation: swapJiggle var(--structure-animation-duration) ease-out;
  }

  &.source {
    border-color: #dc2626;
    background: #fef2f2;

    .cell-value,
    .bucket-value {
      animation: removeLift var(--structure-animation-duration) ease-out;
    }
  }

  &.target {
    border-color: #0f766e;
    background: #f0fdfa;
  }

  &.processed {
    background: #f8fafc;
    color: #64748b;
  }

  &.ghost {
    color: #94a3b8;
    background: #f8fafc;
    border-style: dashed;
  }
}

.linear-cell {
  min-width: 58px;
  min-height: 58px;
  padding: 8px 10px 18px;
  border-right-width: 0;

  &:first-child {
    border-radius: 8px 0 0 8px;
  }

  &:last-child {
    border-right-width: 1px;
    border-radius: 0 8px 8px 0;
  }
}

.cell-value {
  max-width: 72px;
  overflow: hidden;
  color: inherit;
  font-size: 15px;
  font-weight: 760;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-index,
.bucket-index {
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

  &.moving {
    background: #2563eb;
    animation: pointerSlideHint var(--structure-animation-duration) ease-out;
  }
}

.moving-token {
  position: absolute;
  z-index: 3;
  display: grid;
  place-items: center;
  min-width: 34px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: #0f766e;
  color: #fff;
  font-size: 12px;
  font-weight: 780;
  box-shadow: 0 8px 16px rgba(15, 118, 110, 0.18);
  pointer-events: none;
}

.linear-moving-token {
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  animation: insertDrop var(--structure-animation-duration) ease-out forwards;
}

.stack-stage {
  position: relative;
  display: inline-grid;
  justify-items: start;
  width: min(260px, 100%);
  min-height: 84px;
  padding: 28px 42px 24px 2px;
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
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;

  &.processed {
    background: #f8fafc;
    color: #64748b;
  }

  &.active,
  &.top {
    background: #ecfdf5;
    border-color: #0f766e;
  }

  &.source .cell-value {
    animation: stackPopValue var(--structure-animation-duration) ease-out;
  }
}

.stack-push-token {
  top: 0;
  left: 82px;
  animation: stackPushDrop var(--structure-animation-duration) ease-out forwards;
}

.stack-pop-token {
  top: 0;
  left: 82px;
  background: #d97706;
  animation: stackPopLift var(--structure-animation-duration) ease-out forwards;
}

.cell-pointer {
  position: absolute;
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.linked-list-view {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow-x: auto;
  padding: 22px 2px 16px;
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

  &.processed {
    background: #f8fafc;

    .node-value {
      color: #64748b;
    }
  }

  &.active,
  &.target {
    border-color: #0f766e;
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.12);
    animation: structurePulse var(--structure-animation-duration) ease-out;
  }

  &.source .node-value {
    animation: removeLift var(--structure-animation-duration) ease-out;
  }

  &.moving {
    animation: linkedInsertSlide var(--structure-animation-duration) ease-out;
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
  font-weight: 700;
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

  &.active {
    color: #0f766e;

    &::after,
    &::before {
      background: #0f766e;
      border-color: #0f766e;
      animation: edgeTrace var(--structure-animation-duration) ease-out;
    }
  }
}

.list-insert-preview {
  margin-left: -6px;
  margin-right: -6px;
}

.list-null {
  flex: 0 0 auto;
  color: #94a3b8;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  font-weight: 700;
}

.hash-formula {
  display: inline-flex;
  margin-bottom: 10px;
  padding: 5px 9px;
  border-radius: 7px;
  background: #f8fafc;
  color: #334155;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
}

.hash-bucket {
  min-width: 74px;
  min-height: 62px;
  padding: 8px 10px 18px;
  border-right-width: 0;

  &:first-child {
    border-radius: 8px 0 0 8px;
  }

  &:last-child {
    border-right-width: 1px;
    border-radius: 0 8px 8px 0;
  }
}

.bucket-value {
  max-width: 62px;
  overflow: hidden;
  color: inherit;
  font-size: 13px;
  font-weight: 760;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bucket-token {
  top: -28px;
  left: 50%;
  transform: translateX(-50%);
  animation: insertDrop var(--structure-animation-duration) ease-out forwards;
}

.matrix-grid {
  display: grid;
  min-width: max-content;
  width: max-content;
}

.matrix-cell {
  min-width: 46px;
  min-height: 46px;
  padding: 6px 8px 15px;
  border-right-width: 0;
  border-bottom-width: 0;

  &:nth-child(1) {
    border-radius: 8px 0 0 0;
  }
}

.matrix-grid .matrix-cell:nth-child(n) {
  border-right-width: 1px;
  border-bottom-width: 1px;
}

.phase-strip,
.pointer-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.phase-dot {
  padding: 3px 8px;
  background: #f1f5f9;
  color: #64748b;

  &.active {
    background: #ecfdf5;
    color: #0f766e;
  }
}

.summary-chip {
  padding: 3px 8px;
  background: #f1f5f9;
  color: #475569;
}

.structure-narration,
.lesson-block-caption {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.65;
}

.structure-narration {
  padding: 8px 10px;
  border-left: 3px solid #0f766e;
  border-radius: 0 8px 8px 0;
  background: rgba(20, 184, 166, 0.08);
  color: #475569;
}

.empty-structure {
  padding: 18px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #94a3b8;
  text-align: center;
  font-size: 13px;
}

@keyframes insertDrop {
  0% {
    opacity: 0;
    transform: translate(-50%, -18px) scale(0.92);
  }
  42% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, 34px) scale(0.98);
  }
}

@keyframes removeLift {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  58% {
    opacity: 0.28;
    transform: translateY(-16px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes stackPushDrop {
  0% {
    opacity: 0;
    transform: translateY(-18px) scale(0.92);
  }
  46% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(38px) scale(0.98);
  }
}

@keyframes stackPopLift {
  0% {
    opacity: 0;
    transform: translateY(36px) scale(0.98);
  }
  24% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-18px) scale(0.92);
  }
}

@keyframes stackPopValue {
  0%, 100% {
    opacity: 1;
  }
  55% {
    opacity: 0.25;
  }
}

@keyframes structurePulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(20, 184, 166, 0);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.16);
  }
}

@keyframes comparePulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(217, 119, 6, 0);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.16);
  }
}

@keyframes swapJiggle {
  0%, 100% {
    transform: translateX(0);
  }
  30% {
    transform: translateX(-8px);
  }
  70% {
    transform: translateX(8px);
  }
}

@keyframes linkedInsertSlide {
  from {
    opacity: 0;
    transform: translateY(-18px) scale(0.94);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes edgeTrace {
  from {
    opacity: 0.3;
    transform: scaleX(0.4);
  }
  to {
    opacity: 1;
    transform: scaleX(1);
  }
}

@keyframes pointerSlideHint {
  0% {
    transform: translateY(6px);
    opacity: 0.5;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
