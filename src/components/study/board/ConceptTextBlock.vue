<template>
  <section class="concept-text-block" :class="[`mode-${mode}`]">
    <div class="concept-header" v-if="block.title || term || modeLabel">
      <div class="concept-heading">
        <span class="concept-mode">{{ modeLabel }}</span>
        <div v-if="block.title || term" class="concept-title">{{ block.title || term }}</div>
      </div>
      <span v-if="term && block.title && term !== block.title" class="term-chip">{{ term }}</span>
    </div>

    <div v-if="definition" class="definition-panel">
      <span class="panel-label">定义</span>
      <p class="definition-equation">
        <strong v-if="term">{{ term }}</strong>
        <span v-if="term" class="equals-mark">=</span>
        <span>{{ definition }}</span>
      </p>
    </div>

    <div v-if="intuition || formal" class="explain-grid" :class="{ 'has-relation': intuition && formal }">
      <article v-if="intuition" class="explain-card intuition-card">
        <span class="panel-label">直觉理解</span>
        <p>{{ intuition }}</p>
      </article>
      <div v-if="intuition && formal" class="concept-arrow">→</div>
      <article v-if="formal" class="explain-card formal-card">
        <span class="panel-label">形式化表达</span>
        <p>{{ formal }}</p>
      </article>
    </div>

    <div v-if="keyPoints.length" class="point-list">
      <div class="section-title">关键点</div>
      <div
        v-for="(point, index) in keyPoints"
        :key="`${point}-${index}`"
        class="point-item"
      >
        <span>{{ index + 1 }}</span>
        <p>{{ point }}</p>
      </div>
    </div>

    <div v-if="conditions.length || boundaries.length" class="rule-grid">
      <article v-if="conditions.length" class="rule-card condition-card">
        <div class="section-title">成立条件</div>
        <ul>
          <li v-for="item in conditions" :key="item">{{ item }}</li>
        </ul>
      </article>
      <article v-if="boundaries.length" class="rule-card boundary-card">
        <div class="section-title">边界</div>
        <ul>
          <li v-for="item in boundaries" :key="item">{{ item }}</li>
        </ul>
      </article>
    </div>

    <div v-if="examples.length || nonExamples.length" class="example-contrast">
      <article v-if="examples.length" class="example-column positive">
        <div class="section-title">正例</div>
        <div
          v-for="(item, index) in examples"
          :key="`example-${index}-${item.value}`"
          class="example-item"
        >
          <strong>{{ item.label || `例 ${index + 1}` }}</strong>
          <p>{{ item.value }}</p>
          <span v-if="item.explanation">{{ item.explanation }}</span>
        </div>
      </article>
      <article v-if="nonExamples.length" class="example-column negative">
        <div class="section-title">反例</div>
        <div
          v-for="(item, index) in nonExamples"
          :key="`non-example-${index}-${item.value}`"
          class="example-item"
        >
          <strong>{{ item.label || `反例 ${index + 1}` }}</strong>
          <p>{{ item.value }}</p>
          <span v-if="item.explanation">{{ item.explanation }}</span>
        </div>
      </article>
    </div>

    <p v-if="takeaway" class="takeaway">
      <span>记住</span>
      {{ takeaway }}
    </p>
    <p v-if="block.caption || fallbackContent" class="concept-caption">
      {{ block.caption || fallbackContent }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LessonSceneAction, TeachingConceptTextBoardBlock, TeachingConceptTextExample } from '@/types/study'

const props = defineProps<{
  block: TeachingConceptTextBoardBlock
  sceneAction?: LessonSceneAction | null
}>()

const mode = computed(() => normalizeType(props.block.type))
const modeLabel = computed(() => {
  const labels: Record<string, string> = {
    concept_card: '概念',
    definition_card: '定义',
    principle_card: '规则',
    key_takeaway: '结论',
  }
  return labels[mode.value] || '概念'
})
const term = computed(() => readString('term') || props.block.term || '')
const definition = computed(() => readString('definition') || props.block.definition || '')
const intuition = computed(() => readString('intuition') || props.block.intuition || '')
const formal = computed(() => readString('formal') || props.block.formal || '')
const takeaway = computed(() => readString('takeaway') || props.block.takeaway || '')
const keyPoints = computed(() => normalizeStringArray(readArray('keyPoints') || props.block.keyPoints || []))
const boundaries = computed(() => normalizeStringArray(readArray('boundaries') || props.block.boundaries || []))
const conditions = computed(() => normalizeStringArray(readArray('conditions') || props.block.conditions || []))
const examples = computed(() => normalizeExamples(readArray('examples') || props.block.examples || []))
const nonExamples = computed(() => normalizeExamples(readArray('nonExamples') || props.block.nonExamples || []))
const fallbackContent = computed(() => props.block.content?.trim() || '')

function normalizeType(type: string): string {
  return (type || 'concept_card').toLowerCase().replace(/[-\s]/g, '_')
}

function normalizeStringArray(values: unknown[]): string[] {
  return values
    .map((value) => value === undefined || value === null ? '' : String(value))
    .filter(Boolean)
}

function normalizeExamples(values: unknown[]): TeachingConceptTextExample[] {
  return values
    .map((value) => {
      if (!value || typeof value !== 'object') {
        return { value: String(value || '') }
      }
      const record = value as Record<string, unknown>
      return {
        label: stringValue(record.label),
        value: stringValue(record.value),
        explanation: stringValue(record.explanation),
        tone: stringValue(record.tone),
      }
    })
    .filter((item) => item.value)
}

function stringValue(value: unknown): string {
  return value === undefined || value === null ? '' : String(value)
}

function readString(key: string): string {
  const value = props.sceneAction?.payload?.[key]
  return typeof value === 'string' ? value : ''
}

function readArray(key: string): unknown[] | null {
  const value = props.sceneAction?.payload?.[key]
  return Array.isArray(value) ? value : null
}
</script>

<style scoped lang="scss">
.concept-text-block {
  display: grid;
  gap: 14px;
}

.concept-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.concept-heading {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.concept-mode,
.term-chip,
.panel-label {
  display: inline-flex;
  width: fit-content;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.45;
}

.concept-mode {
  padding: 2px 8px;
  border: 1px solid rgba(14, 165, 233, 0.16);
  background: rgba(14, 165, 233, 0.06);
  color: #0369a1;
}

.term-chip {
  flex: 0 0 auto;
  max-width: 42%;
  overflow-wrap: anywhere;
  padding: 2px 8px;
  background: transparent;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.concept-title {
  color: var(--board-heading, #0f172a);
  font-size: 17px;
  font-weight: 820;
  line-height: 1.34;
}

.definition-panel {
  display: grid;
  gap: 6px;
  padding: 2px 0 2px 12px;
  border-left: 3px solid rgba(14, 165, 233, 0.46);
  background: transparent;

  p {
    margin: 0;
    color: var(--board-heading, #0f172a);
    font-size: 15px;
    font-weight: 700;
    line-height: 1.65;
  }
}

.definition-equation {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;

  strong {
    color: var(--board-info, #0369a1);
    font-weight: 800;
  }
}

.equals-mark {
  color: var(--board-muted, #64748b);
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-weight: 800;
}

.panel-label {
  padding: 0;
  background: transparent;
  color: #0369a1;
}

.explain-grid,
.rule-grid,
.example-contrast {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 18px;
}

.explain-grid.has-relation {
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: stretch;
}

.concept-arrow {
  align-self: center;
  color: var(--board-muted, #64748b);
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
}

.explain-card,
.rule-card,
.example-column {
  display: grid;
  gap: 8px;
  padding: 0 0 0 12px;
  border-left: 2px solid #e2e8f0;
  background: transparent;
}

.intuition-card {
  border-color: rgba(20, 184, 166, 0.42);
}

.formal-card {
  border-color: rgba(99, 102, 241, 0.36);
}

.explain-card p,
.rule-card li,
.example-item p,
.example-item span,
.concept-caption {
  margin: 0;
  color: var(--board-muted, #475569);
  font-size: 12px;
  line-height: 1.7;
}

.section-title {
  color: var(--board-text, #334155);
  font-size: 13px;
  font-weight: 800;
  line-height: 1.45;
}

.point-list {
  display: grid;
  gap: 8px;
}

.point-item {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
  padding: 0;
  background: transparent;

  span {
    display: inline-grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    background: #0f766e;
    color: #fff;
    font-size: 11px;
    font-weight: 800;
  }

  p {
    margin: 0;
    color: var(--board-text, #334155);
    font-size: 12px;
    line-height: 1.65;
  }
}

.rule-card ul {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.rule-card li {
  position: relative;
  padding-left: 14px;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 9px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #14b8a6;
  }
}

.boundary-card li::before {
  background: #f59e0b;
}

.example-column {
  align-content: start;

  &.positive {
    border-color: rgba(20, 184, 166, 0.42);
  }

  &.negative {
    border-color: rgba(239, 68, 68, 0.36);
  }
}

.example-item {
  display: grid;
  gap: 4px;
  padding: 7px 0 0;
  border-top: 1px solid rgba(226, 232, 240, 0.9);

  strong {
    color: #0f172a;
    font-size: 12px;
    line-height: 1.45;
  }

  span {
    color: #64748b;
  }
}

.takeaway {
  margin: 0;
  padding: 9px 0 9px 12px;
  border-left: 3px solid #14b8a6;
  border-radius: 0;
  background: transparent;
  color: #0f766e;
  font-size: 12px;
  line-height: 1.7;

  span {
    margin-right: 8px;
    font-weight: 800;
  }
}

.mode-key_takeaway .definition-panel,
.mode-principle_card .definition-panel {
  border-color: rgba(20, 184, 166, 0.46);
  background: transparent;
}

@media (max-width: 640px) {
  .concept-header {
    display: grid;
  }

  .term-chip {
    max-width: 100%;
  }

  .explain-grid.has-relation {
    grid-template-columns: 1fr;
  }

  .concept-arrow {
    display: none;
  }
}
</style>
