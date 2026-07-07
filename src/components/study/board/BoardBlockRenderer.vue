<template>
  <CodeLessonBlock
    v-if="normalizedType === 'code'"
    :block="codeBlock"
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
import ComplexityBlock from './ComplexityBlock.vue'
import DataStructureDiagramBlock from './DataStructureDiagramBlock.vue'
import type {
  LessonSceneAction,
  TeachingBoardBlock,
  TeachingCodeBoardBlock,
  TeachingComplexityBoardBlock,
  TeachingStructureBoardBlock,
  TeachingTraceBoardBlock,
} from '@/types/study'

const props = defineProps<{
  block: TeachingBoardBlock
  sceneAction?: LessonSceneAction | null
}>()

const normalizedType = computed(() => normalizeBoardBlockType(props.block.type))
const codeBlock = computed(() => props.block as TeachingCodeBoardBlock)
const structureBlock = computed(() => props.block as TeachingStructureBoardBlock)
const traceBlock = computed(() => props.block as TeachingTraceBoardBlock)
const complexityBlock = computed(() => props.block as TeachingComplexityBoardBlock)
const fallbackMarkdown = computed(() => boardBlockMarkdown(props.block, normalizedType.value))

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
