<template>
  <section class="queue-block">
    <div class="lesson-block-header" v-if="block.title">
      <div class="lesson-block-title">{{ block.title }}</div>
      <span class="structure-label">队列</span>
    </div>

    <div class="queue-stage" :style="queueStyle">
      <div class="queue-cells">
        <div
          v-for="cell in renderCells"
          :key="cell.key"
          class="queue-cell"
          :class="{
            active: activeIndices.includes(cell.index),
            ghost: cell.ghost,
            'enqueue-target': isEnqueueTarget(cell.index),
            'dequeue-source': isDequeueSource(cell.index),
          }"
        >
          <span
            v-if="isMovingPhase && isEnqueueTarget(cell.index)"
            class="queue-motion-token enqueue-token"
          >
            {{ movingItemLabel }}
          </span>
          <span class="cell-value">{{ cell.label }}</span>
          <span class="cell-index">{{ cell.index }}</span>
          <span v-if="pointerNamesAt(cell.index).length" class="pointer-stack">
            <span
              v-for="name in pointerNamesAt(cell.index)"
              :key="name"
              class="pointer-chip"
              :class="{ moving: emphasizedPointers.includes(name) }"
            >
              {{ name }}
            </span>
          </span>
        </div>
      </div>

      <div v-if="!renderCells.length" class="empty-structure">空队列</div>
    </div>

    <div class="queue-phase-strip" v-if="phaseItems.length">
      <span
        v-for="item in phaseItems"
        :key="item.name"
        class="phase-dot"
        :class="{ active: item.name === currentPhase.name }"
      >
        {{ item.label }}
      </span>
    </div>

    <p v-if="phaseNarration" class="queue-narration">{{ phaseNarration }}</p>
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

interface QueueCell {
  key: string
  label: string
  index: number
  ghost: boolean
}

const currentPhaseName = ref('before')
let timers: Array<ReturnType<typeof setTimeout>> = []

const animation = computed<TeachingStructureAnimation>(() => {
  const payloadAnimation = readPayloadObject('animation')
  return (payloadAnimation as TeachingStructureAnimation | null) || props.block.animation || {}
})
const durationMs = computed(() => Math.max(Number(animation.value.durationMs) || 1800, 720))
const phaseDefinitions = computed<TeachingStructureAnimationPhase[]>(() => {
  if (animation.value.phases?.length) {
    return normalizePhases(animation.value.phases)
  }
  return derivePhases(animation.value)
})
const currentPhase = computed(() => (
  phaseDefinitions.value.find((phase) => phase.name === currentPhaseName.value)
  || phaseDefinitions.value[0]
  || { name: 'after', items: displayBlockItems.value, pointers: displayBlockPointers.value }
))
const displayBlockItems = computed(() => readPayloadArray('items') || props.block.items || [])
const displayBlockPointers = computed(() => ({
  ...(props.block.pointers || {}),
  ...readPayloadRecord('pointers'),
}))
const displayItems = computed(() => currentPhase.value.items || displayBlockItems.value)
const displayPointers = computed(() => currentPhase.value.pointers || displayBlockPointers.value)
const activeIndices = computed(() => normalizeNumberArray(readPayloadArray('activeIndices') || props.block.activeIndices || []))
const isMovingPhase = computed(() => currentPhase.value.name === 'moving')
const movingItem = computed(() => currentPhase.value.movingItem ?? animation.value.movingItem)
const movingItemLabel = computed(() => itemLabel(movingItem.value))
const targetIndex = computed(() => {
  const phaseTarget = Number(currentPhase.value.targetIndex)
  if (Number.isFinite(phaseTarget)) return phaseTarget
  const to = Number(animation.value.to)
  if (Number.isFinite(to)) return to
  const previousRear = Number(previousPointers.value.rear)
  return Number.isFinite(previousRear) ? previousRear : displayItems.value.length
})
const sourceIndex = computed(() => {
  const phaseSource = Number(currentPhase.value.sourceIndex)
  if (Number.isFinite(phaseSource)) return phaseSource
  const from = Number(animation.value.from)
  if (Number.isFinite(from)) return from
  const previousFront = Number(previousPointers.value.front)
  return Number.isFinite(previousFront) ? previousFront : Number(displayPointers.value.front)
})
const previousPointers = computed(() => ({
  ...(animation.value.previous?.pointers || {}),
  ...(animation.value.previousPointers || {}),
}))
const movedPointers = computed(() => Object.entries(previousPointers.value)
  .filter(([name, previous]) => Number(previous) !== Number(displayPointers.value[name]))
  .map(([name]) => name))
const phaseHighlightedPointers = computed(() => currentPhase.value.highlightPointers || [])
const emphasizedPointers = computed(() => Array.from(new Set([
  ...movedPointers.value,
  ...phaseHighlightedPointers.value,
])))
const renderCells = computed<QueueCell[]>(() => {
  const cells = normalizeItems(displayItems.value).map((item, index) => ({
    key: `item-${index}`,
    label: item,
    index,
    ghost: false,
  }))
  if (isMovingPhase.value && animation.value.action === 'enqueue' && targetIndex.value >= cells.length) {
    cells.push({
      key: `ghost-${targetIndex.value}`,
      label: '待写入',
      index: targetIndex.value,
      ghost: true,
    })
  }
  const rear = Number(displayPointers.value.rear)
  if (!isMovingPhase.value && Number.isFinite(rear) && rear === cells.length) {
    cells.push({
      key: `rear-ghost-${rear}`,
      label: '下一位',
      index: rear,
      ghost: true,
    })
  }
  return cells
})
const phaseItems = computed(() => phaseDefinitions.value.map((phase) => ({
  name: phase.name,
  label: phaseLabel(phase.name),
})))
const phaseNarration = computed(() => currentPhase.value.narrationHint || '')
const queueStyle = computed(() => ({
  '--queue-animation-duration': `${Math.max(durationMs.value * 0.34, 420)}ms`,
}))

watch(
  () => animationSignature(animation.value, props.sceneAction?.actionId || ''),
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
  const action = value.action || ''
  if (!action) {
    return [{ name: 'after', startRatio: 0, items: displayBlockItems.value, pointers: displayBlockPointers.value }]
  }
  const previousItems = value.previous?.items || displayBlockItems.value
  const previousPointersValue = value.previous?.pointers || value.previousPointers || displayBlockPointers.value
  const nextItems = value.next?.items || displayBlockItems.value
  const nextPointersValue = value.next?.pointers || value.nextPointers || displayBlockPointers.value
  if (action === 'enqueue') {
    return [
      {
        name: 'before',
        startRatio: 0,
        items: previousItems,
        pointers: previousPointersValue,
        narrationHint: '入队前：rear 指向下一个可插入位置。',
      },
      {
        name: 'moving',
        startRatio: 0.34,
        items: previousItems,
        pointers: previousPointersValue,
        movingItem: value.movingItem,
        targetIndex: Number(value.to),
        highlightPointers: ['rear'],
        narrationHint: `写入：把 ${itemLabel(value.movingItem) || '新元素'} 放到 rear 指向的位置。`,
      },
      {
        name: 'after',
        startRatio: 0.72,
        items: nextItems,
        pointers: nextPointersValue,
        narrationHint: '入队后：rear 后移一格，继续指向下一个可插入位置。',
      },
    ]
  }
  if (action === 'dequeue') {
    return [
      {
        name: 'before',
        startRatio: 0,
        items: previousItems,
        pointers: previousPointersValue,
        narrationHint: '出队前：front 指向当前队头元素。',
      },
      {
        name: 'moving',
        startRatio: 0.34,
        items: previousItems,
        pointers: previousPointersValue,
        sourceIndex: Number(value.from),
        highlightPointers: ['front'],
        narrationHint: '移出：front 指向的队头元素离开队列。',
      },
      {
        name: 'after',
        startRatio: 0.72,
        items: nextItems,
        pointers: nextPointersValue,
        narrationHint: '出队后：front 后移，新的队头变成下一个元素。',
      },
    ]
  }
  return [{ name: 'after', startRatio: 0, items: displayBlockItems.value, pointers: displayBlockPointers.value }]
}

function isEnqueueTarget(index: number): boolean {
  return isMovingPhase.value && animation.value.action === 'enqueue' && index === targetIndex.value
}

function isDequeueSource(index: number): boolean {
  return isMovingPhase.value && animation.value.action === 'dequeue' && index === sourceIndex.value
}

function pointerNamesAt(index: number): string[] {
  return Object.entries(displayPointers.value)
    .filter(([, value]) => Number(value) === index)
    .map(([name]) => name)
}

function normalizeItems(values: unknown[]): string[] {
  return values.map(itemLabel).filter((value) => value !== '')
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

function phaseLabel(name: string): string {
  if (name === 'before') return '操作前'
  if (name === 'moving') return '执行中'
  if (name === 'after') return '完成后'
  if (name === 'done') return '完成'
  return name
}

function animationSignature(value: TeachingStructureAnimation, actionId: string): string {
  return `${actionId}:${JSON.stringify(value)}`
}

function readPayloadArray(key: string): unknown[] | null {
  const value = props.sceneAction?.payload?.[key]
  return Array.isArray(value) ? value : null
}

function readPayloadObject(key: string): Record<string, unknown> | null {
  const value = props.sceneAction?.payload?.[key]
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readPayloadRecord(key: string): Record<string, number | string> {
  const value = props.sceneAction?.payload?.[key]
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, number | string>
}
</script>

<style scoped lang="scss">
.queue-block {
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

.queue-stage {
  --queue-animation-duration: 620ms;
  overflow-x: auto;
  padding: 32px 2px 20px;
}

.queue-cells {
  display: flex;
  align-items: flex-start;
  min-width: max-content;
}

.queue-cell {
  position: relative;
  display: grid;
  place-items: center;
  min-width: 64px;
  min-height: 60px;
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

  &.ghost {
    color: #94a3b8;
    background: #f8fafc;
    border-style: dashed;
  }

  &.enqueue-target {
    border-color: #0f766e;
    background: #f0fdfa;
    animation: queueCellPulse var(--queue-animation-duration) ease-out;
  }

  &.dequeue-source {
    border-color: #d97706;
    background: #fffbeb;

    .cell-value {
      animation: queueDequeueValue var(--queue-animation-duration) ease-out;
    }
  }
}

.queue-motion-token {
  position: absolute;
  top: -30px;
  left: 50%;
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
  transform: translateX(-50%);
  box-shadow: 0 8px 16px rgba(15, 118, 110, 0.18);
  pointer-events: none;
}

.enqueue-token {
  animation: queueEnqueueDrop var(--queue-animation-duration) ease-out forwards;
}

.cell-value {
  font-size: 15px;
  font-weight: 760;
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
  border-radius: 999px;
  background: #0f766e;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.45;
  white-space: nowrap;

  &.moving {
    background: #2563eb;
    animation: pointerSlideHint var(--queue-animation-duration) ease-out;
  }
}

.queue-phase-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.phase-dot {
  padding: 3px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;

  &.active {
    background: #ecfdf5;
    color: #0f766e;
  }
}

.queue-narration,
.lesson-block-caption {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.65;
}

.queue-narration {
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

@keyframes queueEnqueueDrop {
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

@keyframes queueDequeueValue {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  58% {
    opacity: 0.35;
    transform: translateY(-16px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes queueCellPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(20, 184, 166, 0);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.16);
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
