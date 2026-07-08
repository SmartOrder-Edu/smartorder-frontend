<template>
  <section class="comparison-block" :class="[`emphasis-${emphasis}`]">
    <div class="comparison-header" v-if="block.title || block.caption">
      <div class="comparison-title-group">
        <div v-if="block.title" class="comparison-title">{{ block.title }}</div>
        <p v-if="block.caption" class="comparison-caption">{{ block.caption }}</p>
      </div>
      <span class="comparison-mode">{{ modeLabel }}</span>
    </div>

    <div class="comparison-hero">
      <article
        v-for="side in sides"
        :key="side.key"
        class="comparison-side"
        :class="[`side-${side.key}`, { 'side-highlighted': side.key === emphasis }]"
      >
        <div class="side-header">
          <div>
            <h3>{{ side.title }}</h3>
            <p v-if="side.subtitle">{{ side.subtitle }}</p>
          </div>
          <span v-if="side.badge" class="side-badge">{{ side.badge }}</span>
        </div>

        <MarkdownRenderer v-if="side.content" :content="side.content" />

        <div v-if="side.strengths.length || side.weaknesses.length" class="side-points">
          <div v-if="side.strengths.length" class="point-group point-strong">
            <span class="point-label">优势</span>
            <ul>
              <li v-for="item in side.strengths" :key="item">{{ item }}</li>
            </ul>
          </div>
          <div v-if="side.weaknesses.length" class="point-group point-weak">
            <span class="point-label">注意</span>
            <ul>
              <li v-for="item in side.weaknesses" :key="item">{{ item }}</li>
            </ul>
          </div>
        </div>
      </article>

      <div class="vs-divider" aria-hidden="true">
        <span>VS</span>
      </div>
    </div>

    <div v-if="criteria.length" class="criteria-table">
      <div class="criteria-row criteria-head">
        <span>对比维度</span>
        <span>{{ leftSide.title }}</span>
        <span>{{ rightSide.title }}</span>
      </div>
      <div
        v-for="item in criteria"
        :key="item.label"
        class="criteria-row"
        :class="winnerClass(item.winner)"
      >
        <span class="criteria-label">{{ item.label }}</span>
        <span class="criteria-cell" :class="{ winner: item.winner === 'left' }">
          {{ item.left }}
        </span>
        <span class="criteria-cell" :class="{ winner: item.winner === 'right' }">
          {{ item.right }}
        </span>
        <p v-if="item.explanation" class="criteria-explanation">{{ item.explanation }}</p>
      </div>
    </div>

    <div v-if="summary" class="comparison-summary">
      <span class="summary-label">结论</span>
      <MarkdownRenderer :content="summary" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import type {
  LessonSceneAction,
  TeachingComparisonBoardBlock,
  TeachingComparisonCriterion,
  TeachingComparisonSide,
} from '@/types/study'

type SideKey = 'left' | 'right'

interface NormalizedSide {
  key: SideKey
  title: string
  subtitle: string
  badge: string
  content: string
  strengths: string[]
  weaknesses: string[]
}

interface NormalizedCriterion {
  label: string
  left: string
  right: string
  winner: 'left' | 'right' | 'tie' | ''
  explanation: string
}

const props = defineProps<{
  block: TeachingComparisonBoardBlock
  sceneAction?: LessonSceneAction | null
}>()

const leftSide = computed(() => normalizeSide(readPayloadObject('left') || props.block.left, 'left'))
const rightSide = computed(() => normalizeSide(readPayloadObject('right') || props.block.right, 'right'))
const sides = computed(() => [leftSide.value, rightSide.value])
const criteria = computed(() => normalizeCriteria(readPayloadArray('criteria') || props.block.criteria || []))
const summary = computed(() => readPayloadString('summary') || props.block.summary || props.block.content || '')
const emphasis = computed(() => {
  const value = readPayloadString('emphasis') || props.block.emphasis || 'balanced'
  return ['left', 'right', 'balanced'].includes(value) ? value : 'balanced'
})
const modeLabel = computed(() => props.block.type === 'vs_compare' ? 'VS 对比' : '对比')

function normalizeSide(value: unknown, key: SideKey): NormalizedSide {
  const record = isRecord(value) ? value : {}
  const fallback = key === 'left' ? '方案 A' : '方案 B'
  const title = readString(record.title) || fallback
  return {
    key,
    title,
    subtitle: readString(record.subtitle),
    badge: readString(record.badge),
    content: readString(record.content),
    strengths: normalizeStringArray(record.strengths),
    weaknesses: normalizeStringArray(record.weaknesses),
  }
}

function normalizeCriteria(values: unknown[]): NormalizedCriterion[] {
  return values
    .map((value) => {
      if (!isRecord(value)) return null
      const label = readString(value.label)
      const left = readString(value.left)
      const right = readString(value.right)
      const winner = normalizeWinner(value.winner)
      const explanation = readString(value.explanation)
      if (!label && !left && !right) return null
      return { label, left, right, winner, explanation }
    })
    .filter((value): value is NormalizedCriterion => !!value)
}

function normalizeWinner(value: unknown): NormalizedCriterion['winner'] {
  const text = readString(value)
  return ['left', 'right', 'tie'].includes(text) ? text as NormalizedCriterion['winner'] : ''
}

function winnerClass(winner: NormalizedCriterion['winner']): string {
  if (winner === 'left') return 'winner-left'
  if (winner === 'right') return 'winner-right'
  if (winner === 'tie') return 'winner-tie'
  return ''
}

function readPayloadString(key: string): string {
  return readString(props.sceneAction?.payload?.[key])
}

function readPayloadObject(key: string): TeachingComparisonSide | null {
  const value = props.sceneAction?.payload?.[key]
  return isRecord(value) ? value as TeachingComparisonSide : null
}

function readPayloadArray(key: string): TeachingComparisonCriterion[] | null {
  const value = props.sceneAction?.payload?.[key]
  return Array.isArray(value) ? value as TeachingComparisonCriterion[] : null
}

function readString(value: unknown): string {
  return value === undefined || value === null ? '' : String(value)
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => readString(item).trim()).filter(Boolean)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
</script>

<style scoped lang="scss">
.comparison-block {
  display: grid;
  gap: 14px;
}

.comparison-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.comparison-title-group {
  min-width: 0;
}

.comparison-title {
  color: #0f172a;
  font-size: 17px;
  font-weight: 820;
  line-height: 1.34;
}

.comparison-caption {
  margin: 3px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
}

.comparison-mode {
  flex: 0 0 auto;
  padding: 3px 9px;
  border: 1px solid rgba(15, 118, 110, 0.18);
  border-radius: 999px;
  background: rgba(20, 184, 166, 0.08);
  color: #0f766e;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.45;
}

.comparison-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
}

.comparison-side {
  min-width: 0;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.035);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;

  &.side-highlighted {
    border-color: rgba(15, 118, 110, 0.3);
    box-shadow: 0 10px 22px rgba(15, 118, 110, 0.09);
  }

  :deep(.markdown-renderer) {
    color: #334155;
    font-size: 13px;
    line-height: 1.75;

    p {
      margin: 0 0 8px;
    }
  }
}

.side-left {
  background: linear-gradient(180deg, #fff, #f8fafc);
}

.side-right {
  background: linear-gradient(180deg, #fff, #f0fdfa);
}

.side-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;

  h3 {
    margin: 0;
    color: #0f172a;
    font-size: 15px;
    font-weight: 780;
    line-height: 1.35;
  }

  p {
    margin: 3px 0 0;
    color: #64748b;
    font-size: 12px;
    line-height: 1.55;
  }
}

.side-badge {
  flex: 0 0 auto;
  max-width: 42%;
  padding: 3px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.vs-divider {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(15, 118, 110, 0.18);
  border-radius: 50%;
  background: #fff;
  color: #0f766e;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.1);
}

.side-points {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}

.point-group {
  display: grid;
  gap: 5px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #f8fafc;

  ul {
    display: grid;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    position: relative;
    padding-left: 13px;
    color: #475569;
    font-size: 12px;
    line-height: 1.55;

    &::before {
      content: '';
      position: absolute;
      top: 0.72em;
      left: 0;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: currentColor;
      transform: translateY(-50%);
    }
  }
}

.point-strong {
  background: rgba(20, 184, 166, 0.08);

  .point-label,
  li::before {
    color: #0f766e;
  }
}

.point-weak {
  background: rgba(245, 158, 11, 0.08);

  .point-label,
  li::before {
    color: #b45309;
  }
}

.point-label {
  color: #475569;
  font-size: 11px;
  font-weight: 760;
  line-height: 1.35;
}

.criteria-table {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.criteria-row {
  display: grid;
  grid-template-columns: minmax(96px, 0.75fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 0;
  border-bottom: 1px solid #e2e8f0;

  &:last-child {
    border-bottom: 0;
  }

  > span {
    min-width: 0;
    padding: 9px 12px;
    border-right: 1px solid #e2e8f0;
    color: #475569;
    font-size: 13px;
    line-height: 1.55;
    overflow-wrap: anywhere;

    &:last-of-type {
      border-right: 0;
    }
  }
}

.criteria-head {
  background: #f8fafc;

  > span {
    color: #0f172a;
    font-size: 12px;
    font-weight: 760;
  }
}

.criteria-label {
  background: #fbfdff;
  font-weight: 650;
}

.criteria-cell.winner {
  color: #0f766e;
  background: rgba(20, 184, 166, 0.08);
  font-weight: 720;
}

.winner-tie .criteria-cell {
  background: rgba(37, 99, 235, 0.06);
}

.criteria-explanation {
  grid-column: 1 / -1;
  margin: 0;
  padding: 7px 12px;
  border-top: 1px solid #e2e8f0;
  background: #fbfdff;
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
}

.comparison-summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 10px 12px;
  border-left: 3px solid #0f766e;
  border-radius: 0 8px 8px 0;
  background: rgba(20, 184, 166, 0.08);

  :deep(.markdown-renderer) {
    color: #334155;
    font-size: 13px;
    line-height: 1.7;
  }
}

.summary-label {
  padding-top: 1px;
  color: #0f766e;
  font-size: 12px;
  font-weight: 760;
  line-height: 1.5;
}

@media (max-width: 720px) {
  .comparison-header {
    display: grid;
  }

  .comparison-mode {
    justify-self: start;
  }

  .comparison-hero {
    grid-template-columns: 1fr;
  }

  .vs-divider {
    position: static;
    justify-self: center;
    transform: none;
    margin: -2px 0;
  }

  .criteria-row {
    grid-template-columns: 1fr;

    > span {
      border-right: 0;
      border-bottom: 1px solid #e2e8f0;

      &:last-of-type {
        border-bottom: 0;
      }
    }
  }

  .criteria-head {
    display: none;
  }

  .criteria-label {
    color: #0f172a;
  }

  .comparison-summary {
    grid-template-columns: 1fr;
    gap: 5px;
  }
}
</style>
