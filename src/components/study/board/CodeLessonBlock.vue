<template>
  <section class="code-lesson-block" :class="{ 'has-focus-line': !!effectiveFocusLine }">
    <div class="lesson-block-header" v-if="block.title || languageLabel">
      <div class="lesson-block-title" v-if="block.title">{{ block.title }}</div>
      <span class="lesson-language">{{ languageLabel }}</span>
    </div>

    <MarkdownRenderer :content="markdownContent" />

    <p v-if="block.caption" class="lesson-block-caption">{{ block.caption }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import type { LessonSceneAction, TeachingCodeBoardBlock } from '@/types/study'

const props = defineProps<{
  block: TeachingCodeBoardBlock
  sceneAction?: LessonSceneAction | null
}>()

const effectiveLanguage = computed(() => props.block.language || readScenePayloadString('language') || '')
const languageLabel = computed(() => codeLanguageLabel(effectiveLanguage.value || 'unknown'))
const effectiveFocusLine = computed(() => readScenePayloadNumber('focusLine') || props.block.focusLine || 0)
const effectiveHighlights = computed(() => uniqueNumbers([
  ...(props.block.highlights || []),
  ...(effectiveFocusLine.value ? [effectiveFocusLine.value] : []),
]))
const effectiveErrorLines = computed(() => uniqueNumbers(props.block.errorLines || []))
const effectiveNoteLines = computed(() => uniqueNumbers(props.block.noteLines || []))

const markdownContent = computed(() => {
  const rawContent = props.block.content || ''
  const content = stripCodeFence(rawContent)
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const result: string[] = []

  lines.forEach((line, index) => {
    const lineNo = index + 1
    if (effectiveErrorLines.value.includes(lineNo)) {
      result.push(markerLine(effectiveLanguage.value, 'error-next-line'))
    } else if (effectiveNoteLines.value.includes(lineNo)) {
      result.push(markerLine(effectiveLanguage.value, 'note-next-line'))
    } else if (effectiveHighlights.value.includes(lineNo)) {
      result.push(markerLine(effectiveLanguage.value, 'highlight-next-line'))
    }
    result.push(line)
  })

  return `\`\`\`${effectiveLanguage.value || ''}\n${result.join('\n')}\n\`\`\``
})

function readScenePayloadString(key: string): string {
  const value = props.sceneAction?.payload?.[key]
  return typeof value === 'string' ? value : ''
}

function readScenePayloadNumber(key: string): number {
  const value = props.sceneAction?.payload?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function uniqueNumbers(values: number[]): number[] {
  return Array.from(new Set(values.filter((value) => Number.isFinite(value) && value > 0)))
}

function stripCodeFence(content: string): string {
  const trimmed = content.trim()
  const match = trimmed.match(/^```[a-zA-Z0-9_+-]*\s*\n([\s\S]*?)\n```$/)
  if (match) return match[1]
  return content
}

function markerLine(language: string, marker: string): string {
  const lang = language.toLowerCase()
  if (['python', 'py', 'bash', 'shell', 'sh', 'yaml', 'yml'].includes(lang)) return `# ${marker}`
  if (['html', 'xml', 'vue'].includes(lang)) return `<!-- ${marker} -->`
  return `// ${marker}`
}

function codeLanguageLabel(language?: string): string {
  const value = (language || '').trim().toLowerCase()
  const labels: Record<string, string> = {
    c: 'C',
    cpp: 'C++',
    cxx: 'C++',
    cc: 'C++',
    java: 'Java',
    py: 'Python',
    python: 'Python',
    js: 'JavaScript',
    javascript: 'JavaScript',
    ts: 'TypeScript',
    typescript: 'TypeScript',
    go: 'Go',
    rust: 'Rust',
    sql: 'SQL',
    html: 'HTML',
    css: 'CSS',
    json: 'JSON',
    bash: 'Bash',
    shell: 'Shell',
    sh: 'Shell',
    unknown: '未标明语言',
  }
  return labels[value] || language || '未标明语言'
}
</script>

<style scoped lang="scss">
.code-lesson-block {
  display: grid;
  gap: 8px;
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

.lesson-language {
  flex: 0 0 auto;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid rgba(15, 118, 110, 0.18);
  background: rgba(20, 184, 166, 0.08);
  color: #0f766e;
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.45;
}

.lesson-block-caption {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.65;
}
</style>
