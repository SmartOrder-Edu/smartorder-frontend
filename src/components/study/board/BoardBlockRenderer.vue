<template>
  <CodeLessonBlock
    v-if="normalizedType === 'code'"
    :block="codeBlock"
    :scene-action="sceneAction"
  />
  <ConceptTextBlock
    v-else-if="isConceptTextBlock"
    :block="conceptTextBlock"
    :scene-action="sceneAction"
  />
  <TreeDiagramBlock
    v-else-if="normalizedType === 'structure' && structureType === 'tree'"
    :block="structureBlock"
    :scene-action="sceneAction"
  />
  <QueueDiagramBlock
    v-else-if="normalizedType === 'structure' && structureType === 'queue'"
    :block="structureBlock"
    :scene-action="sceneAction"
  />
  <HeapDiagramBlock
    v-else-if="normalizedType === 'structure' && structureType === 'heap'"
    :block="structureBlock"
    :scene-action="sceneAction"
  />
  <GraphDiagramBlock
    v-else-if="normalizedType === 'structure' && structureType === 'graph'"
    :block="structureBlock"
    :scene-action="sceneAction"
  />
  <DataStructureDiagramBlock
    v-else-if="normalizedType === 'structure'"
    :block="structureBlock"
    :scene-action="sceneAction"
  />
  <AlgorithmTraceBlock
    v-else-if="normalizedType === 'trace'"
    :block="traceBlock"
    :scene-action="sceneAction"
  />
  <ComplexityBlock
    v-else-if="normalizedType === 'complexity'"
    :block="complexityBlock"
    :scene-action="sceneAction"
  />
  <NumberedTeachingBlock
    v-else-if="isNumberedTeachingBlock"
    :block="numberedBlock"
    :scene-action="sceneAction"
  />
  <ComparisonBlock
    v-else-if="normalizedType === 'comparison' || normalizedType === 'vs_compare' || normalizedType === 'vs-compare'"
    :block="comparisonBlock"
    :scene-action="sceneAction"
  />
  <OperationSequenceBlock
    v-else-if="normalizedType === 'operation_sequence' || normalizedType === 'operation-sequence'"
    :block="operationSequenceBlock"
    :scene-action="sceneAction"
  />
  <InvariantBlock
    v-else-if="normalizedType === 'invariant'"
    :block="invariantBlock"
    :scene-action="sceneAction"
  />
  <section v-else class="fallback-board-block">
    <div v-if="block.title" class="fallback-title">{{ block.title }}</div>
    <MarkdownRenderer :content="fallbackMarkdown" />
    <p v-if="block.caption" class="fallback-caption">{{ block.caption }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import AlgorithmTraceBlock from './AlgorithmTraceBlock.vue'
import CodeLessonBlock from './CodeLessonBlock.vue'
import ConceptTextBlock from './ConceptTextBlock.vue'
import ComplexityBlock from './ComplexityBlock.vue'
import ComparisonBlock from './ComparisonBlock.vue'
import DataStructureDiagramBlock from './DataStructureDiagramBlock.vue'
import GraphDiagramBlock from './GraphDiagramBlock.vue'
import HeapDiagramBlock from './HeapDiagramBlock.vue'
import InvariantBlock from './InvariantBlock.vue'
import NumberedTeachingBlock from './NumberedTeachingBlock.vue'
import OperationSequenceBlock from './OperationSequenceBlock.vue'
import QueueDiagramBlock from './QueueDiagramBlock.vue'
import TreeDiagramBlock from './TreeDiagramBlock.vue'
import type {
  LessonSceneAction,
  TeachingBoardBlock,
  TeachingCodeBoardBlock,
  TeachingComparisonBoardBlock,
  TeachingComplexityBoardBlock,
  TeachingConceptTextBoardBlock,
  TeachingInvariantBoardBlock,
  TeachingNumberedBoardBlock,
  TeachingOperationSequenceBoardBlock,
  TeachingStructureBoardBlock,
  TeachingTraceBoardBlock,
} from '@/types/study'

const props = defineProps<{
  block: TeachingBoardBlock
  sceneAction?: LessonSceneAction | null
}>()

const normalizedType = computed(() => normalizeBoardBlockType(props.block.type))
const codeBlock = computed(() => props.block as TeachingCodeBoardBlock)
const conceptTextBlock = computed(() => props.block as TeachingConceptTextBoardBlock)
const structureBlock = computed(() => props.block as TeachingStructureBoardBlock)
const traceBlock = computed(() => props.block as TeachingTraceBoardBlock)
const complexityBlock = computed(() => props.block as TeachingComplexityBoardBlock)
const comparisonBlock = computed(() => props.block as TeachingComparisonBoardBlock)
const numberedBlock = computed(() => props.block as TeachingNumberedBoardBlock)
const operationSequenceBlock = computed(() => props.block as TeachingOperationSequenceBoardBlock)
const invariantBlock = computed(() => props.block as TeachingInvariantBoardBlock)
const structureType = computed(() => {
  const block = props.block as TeachingStructureBoardBlock
  return (block.structureType || '').toLowerCase().replace(/[-\s]/g, '_')
})
const fallbackMarkdown = computed(() => boardBlockMarkdown(props.block, normalizedType.value))
const isConceptTextBlock = computed(() => [
  'concept_card',
  'concept-card',
  'definition_card',
  'definition-card',
  'principle_card',
  'principle-card',
  'key_takeaway',
  'key-takeaway',
].includes(normalizedType.value))
const isNumberedTeachingBlock = computed(() => [
  'numbered_points',
  'numbered-points',
  'reasoning_steps',
  'reasoning-steps',
  'concept_breakdown',
  'concept-breakdown',
  'ordered_checklist',
  'ordered-checklist',
].includes(normalizedType.value))

function normalizeBoardBlockType(type: string): string {
  return (type || 'markdown').toLowerCase().replace(/[^a-z0-9_-]/g, '-')
}

function boardBlockMarkdown(block: TeachingBoardBlock, type: string): string {
  const content = (block.content || '').trim()
  if (!content) return ''
  if (type === 'diagram') {
    if (containsMarkdownCodeFence(content)) return content
    return `\`\`\`mermaid\n${content}\n\`\`\``
  }
  if (type === 'quote') {
    return content
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n')
  }
  return content
}

function containsMarkdownCodeFence(content: string): boolean {
  return /(^|\n)```/.test(content) || /(^|\n)~~~/.test(content)
}
</script>

<style scoped lang="scss">
.fallback-board-block {
  display: grid;
  gap: 8px;
}

.fallback-title {
  color: #0f172a;
  font-size: 14px;
  font-weight: 760;
  line-height: 1.4;
}

.fallback-caption {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.65;
}
</style>
