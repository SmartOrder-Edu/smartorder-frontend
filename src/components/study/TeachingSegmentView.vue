<template>
  <div
    ref="segmentEl"
    class="teaching-segment"
    :class="{
      'segment-enter': visible && isNew,
      'segment-past': isPast && !collapsed,
      'segment-current': isCurrent,
      'segment-waiting': waitingForContinue,
      'segment-future': !visible,
      'segment-collapsed': isPast && collapsed,
      'scene-action-active': !!sceneAction,
      [`scene-action-${sceneAction?.actionType}`]: !!sceneAction,
      'feedback-effect-active': !!feedbackEffect,
      'feedback-slower': feedbackEffect?.type === 'slower',
      'feedback-dont-understand': feedbackEffect?.type === 'dont_understand',
      'feedback-mastered': feedbackEffect?.type === 'already_mastered',
      'feedback-skip': feedbackEffect?.type === 'skip',
    }"
    :style="sceneActionStyle"
  >
    <!-- 过去段折叠态：标题条 -->
    <button
      v-if="isPast && collapsed"
      class="segment-collapsed-bar"
      @click="toggleCollapse"
      aria-label="展开此段内容"
    >
      <span class="collapsed-type-badge">{{ typeLabel }}</span>
      <span class="collapsed-preview">{{ collapsedPreview }}</span>
      <span class="collapsed-status">已讲</span>
      <svg class="collapsed-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="6 9 12 15 18 9"/></svg>
    </button>

    <div v-if="segment.type !== 'pause'" v-show="!(isPast && collapsed)" class="classroom-shell" :class="[`tone-${segment.emotionTone || 'serious'}`]">
      <div class="teacher-talk" v-if="teacherLine">
        <div class="teacher-avatar" :class="{ 'is-speaking': isCurrent && timelineStatus === 'playing' }" aria-hidden="true">
          <img :src="teacherAvatar" alt="" class="teacher-avatar-img" />
        </div>
        <div class="voice-waveform" :class="{ active: isCurrent && timelineStatus === 'playing' }" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="teacher-text">
          <MarkdownRenderer :content="teacherLine" />
        </div>
      </div>

      <div v-if="waitingForContinue" class="segment-end-hint">
        <span class="hint-dot"></span>
        <span>这部分讲完了，清楚吗？准备好了继续。</span>
      </div>

      <div
        v-if="hasBoardContent"
        class="segment-board focus-target-container"
        :class="[focusClass, boardClass, boardLayoutClass, { 'teaching-stagger': visible, 'segment-board-code': !!boardContentCodeLanguage }]"
      >
        <template v-if="displayBoardBlocks.length">
          <TransitionGroup name="board-block-reveal" appear>
            <section
              v-for="entry in visibleBoardBlockEntries"
              :key="entry.block.id || `${entry.block.type}-${entry.originalIndex}`"
              class="board-block"
              :class="[
                `board-block-${normalizeBoardBlockType(entry.block.type)}`,
                entry.block.tone ? `board-tone-${entry.block.tone}` : '',
                ...boardBlockLayoutClasses(entry, visibleBoardBlockEntries),
              ]"
            >
              <BoardBlockRenderer
                :block="entry.block"
                :scene-action="sceneAction"
                :revealed-item-index="boardBlockRevealedItemIndex(entry.block, entry.originalIndex)"
              />
            </section>
          </TransitionGroup>
        </template>
        <template v-else>
          <div v-if="boardContentCodeLanguage" class="board-block-title-row board-fallback-code-title">
            <div class="board-block-title">示例代码</div>
            <span class="board-code-language">
              {{ codeLanguageLabel(boardContentCodeLanguage) }}
            </span>
          </div>
          <MarkdownRenderer :content="displayBoardContent" />
        </template>
      </div>

      <div v-if="segment.visualHint?.content" class="visual-hint" :class="`visual-${segment.visualHint.type}`">
        <MarkdownRenderer :content="segment.visualHint.content" />
      </div>

      <InlineQuizCard
        v-if="isInteractive && segment.quiz"
        :quiz="segment.quiz"
        :disabled="isPast || (quizState?.answered ?? false)"
        @answer="(qid, val) => $emit('quizAnswer', qid, val)"
      />

    </div>

    <!-- pause：过渡指示器 -->
    <template v-else>
      <div v-show="!(isPast && collapsed)" class="segment-pause">
        <span class="pause-dot"></span>
        <span>{{ segment.markdown || 'Agent 正在准备下一段讲解…' }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import BoardBlockRenderer from './board/BoardBlockRenderer.vue'
import InlineQuizCard from './InlineQuizCard.vue'
import teacherAvatar from '@/assets/teacher.png'
import type { LessonSceneAction, TeachingBoardBlock, TeachingSegment, QuizState } from '@/types/study'

const props = defineProps<{
  segment: TeachingSegment
  visible: boolean
  isCurrent: boolean
  quizState?: QuizState | null
  sceneAction?: LessonSceneAction | null
  revealedBoardBlockIndex?: number | null
  revealedBoardItemIndexes?: Record<string, number>
  waitingForContinue?: boolean
  timelineStatus?: string
  feedbackEffect?: { type: string; segmentId?: string; ts: number } | null
}>()

defineEmits<{
  (e: 'quizAnswer', quizId: string, answer: string): void
}>()

// 段根元素引用（用于自动滚动）
const segmentEl = ref<HTMLElement | null>(null)

// 过去段折叠状态：过去段默认折叠为标题条，当前段始终展开
const collapsed = ref(false)
const isPast = computed(() => props.visible && !props.isCurrent)

// 刚变为可见时播放入场动画 + 自动滚动到视口
const isNew = ref(false)
watch(
  () => props.isCurrent,
  (cur) => {
    if (cur) {
      // 成为当前段：展开 + 入场动画 + 自动滚动
      collapsed.value = false
      isNew.value = true
      nextTick(() => {
        segmentEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        if (props.segment.focusTarget && segmentEl.value) {
          applyFocus(segmentEl.value)
        }
      })
      setTimeout(() => (isNew.value = false), 450)
    } else if (props.visible) {
      // 变为过去段：自动折叠
      collapsed.value = true
    }
  },
  { immediate: true },
)

// 折叠标题条上的类型标签
const typeLabel = computed(() => segmentTypeLabel(props.segment.type))
// 折叠标题条上的预览文本（取 teacherTalk，剥除 markdown 符号，截断 42 字）
const collapsedPreview = computed(() => {
  const raw = props.segment.teacherTalk || props.segment.agentCommentary || props.segment.markdown || ''
  return stripMarkdown(raw).slice(0, 42)
})

function toggleCollapse() {
  collapsed.value = !collapsed.value
}

function segmentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    text: '讲解',
    formula: '公式',
    diagram: '图示',
    quiz: '测验',
    pause: '过渡',
    hook: '引入',
    recall: '回顾',
    explain: '解析',
    analogy: '类比',
    board_write: '板书',
    worked_example: '示例',
    teacher_question: '提问',
    student_try: '试做',
    diagnosis: '诊断',
    mistake_warning: '易错',
    summary: '总结',
    transition: '过渡',
    self_check: '自检',
  }
  return labels[type] || '讲解'
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '（代码）')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, '（图）')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim()
}

const focusClass = computed(() => {
  if (!isNew.value || !props.segment.focusTarget) return ''
  const fx = props.segment.focusTarget.effect
  if (fx === 'pulse') return 'focus-pulse'
  if (fx === 'glow-border') return 'focus-glow-border'
  if (fx === 'scale') return 'focus-scale'
  return ''
})

const sceneAction = computed(() => props.sceneAction || null)
const sceneActionStyle = computed(() => ({
  '--scene-action-duration': `${Math.max(sceneAction.value?.durationMs || 1200, 600)}ms`,
}))

const teacherLine = computed(() => props.segment.teacherTalk || props.segment.agentCommentary || '')
const displayBoardBlockEntries = computed(() =>
  (props.segment.boardBlocks || [])
    .map((block, originalIndex) => ({ block, originalIndex }))
    .filter((entry) => hasMeaningfulBoardBlock(entry.block)),
)
const displayBoardBlocks = computed(() => displayBoardBlockEntries.value.map((entry) => entry.block))
const visibleBoardBlockEntries = computed(() => {
  if (!props.isCurrent || props.revealedBoardBlockIndex === null || props.revealedBoardBlockIndex === undefined) {
    return displayBoardBlockEntries.value
  }
  const revealedIndex = props.revealedBoardBlockIndex
  return displayBoardBlockEntries.value.filter((entry) => entry.originalIndex <= revealedIndex)
})
const rawBoardContent = computed(() =>
  props.segment.boardContent || props.segment.markdown || props.segment.visualHint?.content || '',
)
const displayBoardContent = computed(() => {
  return normalizeBoardMarkdown(rawBoardContent.value)
})
const hasBoardContent = computed(() => displayBoardBlocks.value.length > 0 || !!displayBoardContent.value)
const boardContentCodeLanguage = computed(() => {
  if (displayBoardBlocks.value.length > 0) return ''
  return detectBoardContentCodeLanguage(rawBoardContent.value)
})
const isInteractive = computed(() =>
  props.segment.type === 'quiz'
  || props.segment.type === 'teacher_question'
  || props.segment.type === 'student_try'
  || props.segment.type === 'self_check',
)
const boardClass = computed(() => ({
  'segment-diagram': props.segment.type === 'diagram',
  'segment-formula': props.segment.type === 'formula',
  'segment-mistake': props.segment.type === 'mistake_warning',
  'segment-diagnosis': props.segment.type === 'diagnosis',
  'segment-question': isInteractive.value,
}))
const boardLayoutClass = computed(() => ({
  'segment-board-paired': hasPairedBoardLayout(visibleBoardBlockEntries.value),
  'segment-board-compact': visibleBoardBlockEntries.value.length >= 3,
}))

function normalizeBoardBlockType(type: string): string {
  return (type || 'markdown').toLowerCase().replace(/[^a-z0-9_-]/g, '-')
}

function boardBlockLayoutClasses(
  entry: { block: TeachingBoardBlock; originalIndex: number },
  entries: Array<{ block: TeachingBoardBlock; originalIndex: number }>,
): string[] {
  const span = resolveBoardBlockSpan(entry, entries)
  const role = resolveBoardBlockRole(entry.block)
  const classes = [`board-span-${span}`, `board-role-${role}`]
  const layout = boardLayoutHint(entry.block)
  if (layout?.groupId) classes.push('board-grouped')
  if (hasAdjacentComplement(entry, entries)) classes.push('board-paired')
  if (['wide', 'full'].includes(span) && ['visual', 'code'].includes(role)) classes.push('board-primary')
  if (span === 'side' || (['explanation', 'note', 'summary'].includes(role) && hasAdjacentComplement(entry, entries))) {
    classes.push('board-side-panel')
  }
  return classes
}

function resolveBoardBlockSpan(
  entry: { block: TeachingBoardBlock; originalIndex: number },
  entries: Array<{ block: TeachingBoardBlock; originalIndex: number }>,
): string {
  const explicitSpan = normalizeBoardLayoutSpan(boardLayoutHint(entry.block)?.span)
  if (explicitSpan) return explicitSpan

  const type = normalizeBoardBlockType(entry.block.type).replace(/-/g, '_')
  const hasPair = hasAdjacentComplement(entry, entries)
  const textSize = boardBlockTextSize(entry.block)

  if (type === 'comparison' || type === 'vs_compare' || type === 'vs-compare') return 'full'
  if (type === 'structure' || type === 'trace' || type === 'diagram') return hasPair ? 'wide' : 'full'
  if (type === 'code') return textSize > 520 || !hasPair ? 'full' : 'wide'
  if (type === 'operation_sequence' || type === 'operation-sequence') return hasPair ? 'side' : 'wide'
  if (type === 'complexity') return hasPair ? 'side' : 'half'
  if (type === 'numbered_points' || type === 'numbered-points' || type === 'ordered_checklist' || type === 'ordered-checklist') {
    return hasPair ? 'side' : textSize > 420 ? 'half' : 'third'
  }
  if (type === 'reasoning_steps' || type === 'reasoning-steps' || type === 'invariant') return hasPair ? 'side' : 'half'
  if (isConceptTextBlockType(type) || type === 'concept_breakdown' || type === 'concept-breakdown') {
    return textSize > 520 ? 'half' : 'third'
  }
  if (type === 'callout' || type === 'quote' || type === 'markdown' || type === 'list') {
    return textSize > 520 ? 'half' : 'third'
  }
  if (type === 'formula') return textSize > 420 ? 'full' : 'half'
  return 'half'
}

function resolveBoardBlockRole(block: TeachingBoardBlock): string {
  const explicitRole = boardLayoutHint(block)?.role
  if (typeof explicitRole === 'string' && explicitRole.trim()) return normalizeLayoutToken(explicitRole)

  const type = normalizeBoardBlockType(block.type).replace(/-/g, '_')
  if (type === 'structure' || type === 'trace' || type === 'diagram') return 'visual'
  if (type === 'code') return 'code'
  if (isConceptTextBlockType(type) || type === 'concept_breakdown') return 'concept'
  if (type === 'summary' || type === 'key_takeaway') return 'summary'
  if (type === 'callout' || type === 'quote' || type === 'invariant') return 'note'
  if (type === 'operation_sequence' || type === 'reasoning_steps' || type === 'numbered_points' || type === 'ordered_checklist') {
    return 'explanation'
  }
  return 'support'
}

function hasAdjacentComplement(
  entry: { block: TeachingBoardBlock; originalIndex: number },
  entries: Array<{ block: TeachingBoardBlock; originalIndex: number }>,
): boolean {
  const layout = boardLayoutHint(entry.block)
  if (layout?.groupId) {
    return entries.some((item) => item.originalIndex !== entry.originalIndex && boardLayoutHint(item.block)?.groupId === layout.groupId)
  }

  const currentRole = resolveBoardBlockRole(entry.block)
  const adjacent = entries.filter((item) => Math.abs(item.originalIndex - entry.originalIndex) === 1)
  if (currentRole === 'visual' || currentRole === 'code') {
    return adjacent.some((item) => ['explanation', 'concept', 'note', 'summary', 'support'].includes(resolveBoardBlockRole(item.block)))
  }
  if (['explanation', 'concept', 'note', 'summary', 'support'].includes(currentRole)) {
    return adjacent.some((item) => ['visual', 'code'].includes(resolveBoardBlockRole(item.block)))
  }
  return false
}

function hasPairedBoardLayout(entries: Array<{ block: TeachingBoardBlock; originalIndex: number }>): boolean {
  return entries.some((entry) => hasAdjacentComplement(entry, entries))
}

function boardLayoutHint(block: TeachingBoardBlock): Record<string, unknown> | null {
  const record = block as unknown as Record<string, unknown>
  const displayLayout = record.displayLayout
  if (displayLayout && typeof displayLayout === 'object' && !Array.isArray(displayLayout)) {
    return displayLayout as Record<string, unknown>
  }

  // 兼容早期实验数据：只有对象型 layout 才作为板书版面提示；字符串 layout 保留给结构图内部布局。
  const legacyLayout = record.layout
  return legacyLayout && typeof legacyLayout === 'object' && !Array.isArray(legacyLayout)
    ? legacyLayout as Record<string, unknown>
    : null
}

function normalizeBoardLayoutSpan(value: unknown): string {
  if (typeof value !== 'string') return ''
  const span = normalizeLayoutToken(value)
  return ['full', 'wide', 'side', 'half', 'third'].includes(span) ? span : ''
}

function normalizeLayoutToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-')
}

function boardBlockTextSize(block: TeachingBoardBlock): number {
  const record = block as unknown as Record<string, unknown>
  const textParts: unknown[] = [
    block.title,
    block.content,
    block.caption,
    record.term,
    record.definition,
    record.intuition,
    record.formal,
    record.lead,
    record.question,
    record.summary,
    record.conclusion,
    record.rule,
    record.context,
    record.reminder,
    record.explanation,
    record.invariant,
    record.statement,
    record.whyItMatters,
    record.time,
    record.space,
    record.reason,
    compactText(record.items),
    compactText(record.points),
    compactText(record.steps),
    compactText(record.keyPoints),
    compactText(record.examples),
    compactText(record.cases),
    compactText(record.criteria),
  ]
  return textParts.reduce<number>((sum, value) => sum + stringValue(value).length, 0)
}

function compactText(value: unknown): string {
  if (!Array.isArray(value)) return ''
  return value
    .map((item) => {
      if (item === null || item === undefined) return ''
      if (typeof item === 'string') return item
      if (typeof item !== 'object') return String(item)
      return Object.values(item as Record<string, unknown>).map(stringValue).join(' ')
    })
    .join(' ')
}

function stringValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  return typeof value === 'string' ? value : String(value)
}

function boardBlockRevealedItemIndex(block: TeachingBoardBlock, index: number): number | null {
  if (!props.isCurrent) return null
  const indexes = props.revealedBoardItemIndexes || {}
  const blockId = block.id || ''
  if (blockId && Number.isInteger(indexes[blockId])) return indexes[blockId]
  const indexKey = `index:${index}`
  return Number.isInteger(indexes[indexKey]) ? indexes[indexKey] : null
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
  return labels[value] || (language ? language : '未标明语言')
}

function detectBoardContentCodeLanguage(content: string): string {
  const trimmed = content.trim()
  if (!trimmed) return ''
  const fenced = trimmed.match(/^```([a-zA-Z0-9_+-]*)\s*[\r\n]/)
  if (fenced) return fenced[1] || 'unknown'
  return isLikelyStandaloneCode(trimmed) ? inferCodeLanguage(trimmed) || 'unknown' : ''
}

function normalizeBoardMarkdown(content: string): string {
  const trimmed = content.trim()
  if (!trimmed) return ''
  if (containsMarkdownCodeFence(trimmed)) return content
  if (!isLikelyStandaloneCode(trimmed)) return content

  const language = inferCodeLanguage(trimmed)
  return `\`\`\`${language}\n${trimmed}\n\`\`\``
}

function containsMarkdownCodeFence(content: string): boolean {
  return /(^|\n)```/.test(content) || /(^|\n)~~~/.test(content)
}

function isLikelyStandaloneCode(content: string): boolean {
  const lines = content.split('\n').filter((line) => line.trim())
  if (lines.length < 2) return false

  const codeLineCount = lines.filter((line) => {
    const text = line.trim()
    return /[;{}]$/.test(text)
      || /^(#include|import|package|typedef|struct|class|interface|enum|public|private|protected|function|def|const|let|var)\b/.test(text)
      || /^(if|else|for|while|switch|case|return|try|catch)\b/.test(text)
      || /(\+\+|--|->|=>|==|!=|<=|>=|&&|\|\|)/.test(text)
  }).length

  return codeLineCount >= 3 || codeLineCount / lines.length >= 0.45
}

function inferCodeLanguage(content: string): string {
  if (/#include\s*<|typedef\s+struct|->|int\*|char\*/.test(content)) return 'c'
  if (/\bpublic\s+class\b|\bSystem\.out\.println\b/.test(content)) return 'java'
  if (/\bdef\s+\w+\(|\bprint\(/.test(content)) return 'python'
  if (/\bfunction\s+\w+\(|\bconst\s+\w+\s*=|\blet\s+\w+\s*=|=>/.test(content)) return 'javascript'
  if (/\binterface\s+\w+\b|:\s*(string|number|boolean)\b/.test(content)) return 'typescript'
  if (/\bSELECT\b|\bFROM\b|\bWHERE\b/i.test(content)) return 'sql'
  return ''
}

function hasMeaningfulBoardBlock(block: TeachingBoardBlock): boolean {
  if (!block) return false
  if (block.content?.trim()) return true

  const type = normalizeBoardBlockType(block.type)
  const record = block as unknown as Record<string, unknown>
  if (type === 'structure') {
    return (Array.isArray(record.items) && record.items.length > 0)
      || (Array.isArray(record.nodes) && record.nodes.length > 0)
      || !!record.structureType
  }
  if (type === 'trace') {
    return (Array.isArray(record.items) && record.items.length > 0)
      || !!record.explanation
      || !!record.action
      || !!record.traceKind
  }
  if (isConceptTextBlockType(type)) {
    return !!record.term
      || !!record.definition
      || !!record.intuition
      || !!record.formal
      || (Array.isArray(record.keyPoints) && record.keyPoints.length > 0)
      || (Array.isArray(record.examples) && record.examples.length > 0)
      || !!record.takeaway
  }
  if (isNumberedTeachingBlockType(type)) {
    return !!record.lead
      || !!record.question
      || !!record.summary
      || !!record.conclusion
      || !!record.rule
      || !!record.reminder
      || (Array.isArray(record.items) && record.items.length > 0)
      || (Array.isArray(record.points) && record.points.length > 0)
      || (Array.isArray(record.steps) && record.steps.length > 0)
  }
  if (type === 'operation_sequence' || type === 'operation-sequence') {
    return (Array.isArray(record.steps) && record.steps.length > 0)
      || !!record.operation
      || !!record.invariant
  }
  if (type === 'invariant') {
    return !!record.statement
      || !!record.whyItMatters
      || (Array.isArray(record.checkpoints) && record.checkpoints.length > 0)
      || !!record.commonMistake
  }
  if (type === 'complexity') {
    return !!record.time
      || !!record.space
      || (Array.isArray(record.cases) && record.cases.length > 0)
      || !!record.reason
  }
  if (type === 'comparison' || type === 'vs_compare' || type === 'vs-compare') {
    return !!record.left
      || !!record.right
      || (Array.isArray(record.criteria) && record.criteria.length > 0)
      || !!record.summary
  }
  return !!block.title || !!block.caption
}

function isConceptTextBlockType(type: string): boolean {
  return [
    'concept_card',
    'concept-card',
    'definition_card',
    'definition-card',
    'principle_card',
    'principle-card',
    'key_takeaway',
    'key-takeaway',
  ].includes(type)
}

function isNumberedTeachingBlockType(type: string): boolean {
  return [
    'numbered_points',
    'numbered-points',
    'reasoning_steps',
    'reasoning-steps',
    'concept_breakdown',
    'concept-breakdown',
    'ordered_checklist',
    'ordered-checklist',
  ].includes(type)
}

function applyFocus(el: HTMLElement) {
  const target = props.segment.focusTarget
  if (!target || target.scroll === 'none') return
  const inner = el.querySelector(target.selector)
  if (inner) {
    inner.scrollIntoView({ behavior: target.scroll as ScrollBehavior, block: 'center' })
  }
}</script>

<style scoped lang="scss">
.teaching-segment {
  position: relative;
  margin-bottom: 0;
  border-radius: 14px;
  scroll-margin-top: 12px;
  transition: opacity 0.4s ease, transform 0.4s ease, filter 0.4s ease;
}

.feedback-effect-active {
  &::after {
    position: absolute;
    top: 4px;
    right: 2px;
    z-index: 2;
    padding: 3px 9px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.4;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
    pointer-events: none;
  }

  .classroom-shell {
    border-radius: 12px;
  }
}

.feedback-slower {
  &::after {
    content: '已减速';
    background: rgba(255, 251, 235, 0.94);
    color: #b45309;
    border: 1px solid rgba(245, 158, 11, 0.24);
  }

  .classroom-shell {
    animation: feedbackSlow 1.3s ease;
  }
}

.feedback-dont-understand {
  &::after {
    content: '再讲一遍';
    background: rgba(254, 242, 242, 0.94);
    color: #b91c1c;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .segment-board,
  .teacher-text {
    animation: feedbackNeedHelp 1.2s ease;
  }
}

.feedback-mastered {
  &::after {
    content: '已掌握';
    background: rgba(236, 253, 245, 0.96);
    color: #047857;
    border: 1px solid rgba(16, 185, 129, 0.22);
  }

  .classroom-shell {
    animation: feedbackMastered 1.2s ease;
  }
}

.feedback-skip {
  &::after {
    content: '已跳过';
    background: rgba(248, 250, 252, 0.96);
    color: #475569;
    border: 1px solid rgba(148, 163, 184, 0.24);
  }

  .classroom-shell {
    animation: feedbackSkip 0.9s ease;
  }
}

// ---- 过去段折叠态：标题条 ----
.segment-collapsed {
  .segment-collapsed-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 14px;
    border: 1px solid rgba(15, 23, 42, 0.06);
    border-radius: 10px;
    background: rgba(248, 250, 252, 0.6);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;

    &:hover {
      border-color: rgba(11, 183, 170, 0.35);
      background: rgba(11, 183, 170, 0.04);
    }
  }

  .collapsed-type-badge {
    flex-shrink: 0;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(11, 183, 170, 0.1);
    color: #0bb7aa;
    font-size: 11px;
    font-weight: 700;
  }

  .collapsed-preview {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #475569;
    font-size: 13px;
    line-height: 1.5;
  }

  .collapsed-status {
    flex-shrink: 0;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(100, 116, 139, 0.12);
    color: #64748b;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .collapsed-chevron {
    flex-shrink: 0;
    color: #94a3b8;
    transition: transform 0.2s ease;
  }
}

.segment-past {
  opacity: 0.75;
  pointer-events: auto;
  transform: scale(0.985);
  filter: none;

  &:hover {
    opacity: 0.85;
  }

  .classroom-shell {
    gap: 10px;
    padding-bottom: 4px;
    padding-left: 12px;
    border-left: 2px solid rgba(11, 183, 170, 0.3);
  }

  .teacher-text {
    background: rgba(11, 183, 170, 0.03);
  }

  .segment-board {
    opacity: 0.92;
  }

  // 「已讲」标记 chip（纯 CSS，无模板变更）
  .classroom-shell::after {
    content: '已讲';
    position: absolute;
    top: 2px;
    right: 0;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(100, 116, 139, 0.12);
    color: #64748b;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
}

.segment-current {
  --segment-tone-rgb: 11, 183, 170;
  position: relative;
  isolation: isolate;
  opacity: 1;
  filter: none;

  &::before {
    content: '';
    position: absolute;
    inset: -20px -12px;
    z-index: -1;
    pointer-events: none;
    border-radius: 20px;
    background: radial-gradient(ellipse at top, rgba(var(--segment-tone-rgb), 0.08), transparent 70%);
    animation: ambientGlow 4s ease-in-out infinite alternate;
  }

  // 当前段不再给外层板书容器加卡片阴影，避免大卡片套小卡片。
  .segment-board {
    opacity: 1;
  }

  // teacher-talk 在当前段内 sticky：板书滚动时老师讲话始终可见
  .teacher-talk {
    position: sticky;
    top: 8px;
    z-index: 2;
  }

  .teacher-text {
    background: linear-gradient(135deg, rgba(11, 183, 170, 0.08), rgba(248, 250, 252, 0.95));
    backdrop-filter: blur(6px);
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  }
}

.segment-current:has(.tone-curious) {
  --segment-tone-rgb: 14, 165, 233;
}

.segment-current:has(.tone-warning) {
  --segment-tone-rgb: 245, 158, 11;
}

.segment-current:has(.tone-summary) {
  --segment-tone-rgb: 16, 185, 129;
}

.segment-waiting {
  &::before {
    background: radial-gradient(ellipse at top, rgba(var(--segment-tone-rgb), 0.13), transparent 72%);
    animation-duration: 2.4s;
  }
}

.segment-future {
  display: none;
}

.segment-enter {
  animation: segmentReveal 0.4s ease both;

  .segment-board {
    animation: boardEnter 0.5s ease both;
  }
}

.scene-action-active {
  --scene-action-duration: 1200ms;
}

.scene-action-text_fade_in,
.scene-action-teacher_speak {
  .segment-markdown {
    animation: sceneTextFade var(--scene-action-duration) ease-out;
  }

  .classroom-shell {
    animation: sceneTextFade var(--scene-action-duration) ease-out;
  }
}

.scene-action-formula_write,
.scene-action-formula_step_write,
.scene-action-board_write {
  .segment-markdown,
  .segment-board {
    position: relative;
    overflow: hidden;
    animation: formulaCardLift var(--scene-action-duration) ease-out;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.14), transparent);
      transform: translateX(-100%);
      animation: formulaWriteSweep var(--scene-action-duration) ease-out;
    }
  }

  :deep(.math-block),
  :deep(.math-inline) {
    color: #1d4ed8;
    transition: color 0.24s ease;
  }
}

.scene-action-diagram_trace {
  .segment-diagram,
  .segment-board.segment-diagram {
    animation: diagramTrace var(--scene-action-duration) ease-out;
  }
}

.scene-action-focus_pulse,
.scene-action-ask_question,
.scene-action-wait_student {
  .segment-markdown,
  .segment-diagram,
  .segment-board {
    animation: focusPulse var(--scene-action-duration) ease-out;
  }
}

.scene-action-quiz_mount,
.scene-action-show_mistake,
.scene-action-correct_mistake,
.scene-action-summary_pin {
  animation: quizMount var(--scene-action-duration) ease-out;
}

.scene-action-highlight,
.scene-action-show_mistake {
  :deep(strong),
  :deep(.markdown-renderer h1),
  :deep(.markdown-renderer h2),
  :deep(.markdown-renderer h3) {
    background-image: linear-gradient(transparent 58%, rgba(245, 158, 11, 0.26) 58%);
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
  }
}

.scene-action-underline,
.scene-action-correct_mistake,
.scene-action-summary_pin {
  :deep(strong),
  :deep(.markdown-renderer h2),
  :deep(.markdown-renderer h3) {
    text-decoration: underline;
    text-decoration-color: rgba(11, 183, 170, 0.65);
    text-decoration-thickness: 3px;
    text-underline-offset: 5px;
  }
}

.classroom-shell {
  --segment-tone-rgb: 11, 183, 170;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;

  &.tone-curious {
    --segment-tone-rgb: 14, 165, 233;
    .teacher-text {
      border-left-color: rgba(14, 165, 233, 0.46);
    }
  }

  &.tone-warning {
    --segment-tone-rgb: 245, 158, 11;
    .teacher-text {
      border-left-color: rgba(245, 158, 11, 0.58);
    }
  }

  &.tone-summary {
    --segment-tone-rgb: 16, 185, 129;
    .teacher-text {
      border-left-color: rgba(16, 185, 129, 0.54);
    }
  }
}

.teacher-talk {
  display: grid;
  grid-template-columns: 40px 16px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  margin: 0;
}

.teacher-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  color: #fff;
  box-shadow: 0 8px 20px rgba(11, 183, 170, 0.2);
  flex-shrink: 0;

  &.is-speaking::after {
    content: '';
    position: absolute;
    inset: -5px;
    border-radius: inherit;
    border: 1px solid rgba(11, 183, 170, 0.32);
    animation: agentDotPulse 1.4s ease-in-out infinite;
  }
}

.voice-waveform {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 26px;
  color: #0f766e;

  span {
    width: 3px;
    height: 5px;
    border-radius: 999px;
    background: currentColor;
    opacity: 0.45;
    transition: height 0.2s ease, opacity 0.2s ease;

    &:nth-child(2) { height: 8px; }
    &:nth-child(3) { height: 12px; }
    &:nth-child(4) { height: 7px; }
  }

  &.active span {
    opacity: 0.85;
    animation: voiceWave 0.9s ease-in-out infinite;

    &:nth-child(2) { animation-delay: 0.1s; }
    &:nth-child(3) { animation-delay: 0.2s; }
    &:nth-child(4) { animation-delay: 0.3s; }
    &:nth-child(5) { animation-delay: 0.4s; }
  }
}

.teacher-text {
  position: relative;
  padding: 12px 16px;
  border-left: 3px solid var(--mint-primary, #0bb7aa);
  background: rgba(11, 183, 170, 0.05);
  border-radius: 4px 12px 12px 4px;
  color: #0f172a;
  line-height: 1.8;
  font-size: 15px;

  :deep(.markdown-renderer) {
    background: transparent;
    padding: 0;
    color: #0f172a;

    p {
      margin: 0;
      letter-spacing: 0;
    }

    strong {
      color: #0f766e;
      font-weight: 700;
      background-image: linear-gradient(transparent 62%, rgba(11, 183, 170, 0.18) 62%);
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
    }
  }
}

.segment-end-hint {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 8px;
  margin-left: 66px;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid rgba(11, 183, 170, 0.18);
  background: rgba(240, 253, 250, 0.85);
  color: #0f766e;
  font-size: 12px;
  line-height: 1.4;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);

  .hint-dot {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: #0bb7aa;
    animation: agentDotPulse 1s ease-in-out infinite;
  }
}

.segment-board {
  --board-heading: #0f172a;
  --board-text: #334155;
  --board-muted: #64748b;
  --board-line: rgba(203, 213, 225, 0.7);
  --board-accent: #0f766e;
  --board-info: #0369a1;
  --board-warning: #b45309;
  --board-danger: #dc2626;
  --board-success: #0f766e;
  // 板书表面令牌（scoped，不污染全局）
  --board-surface: #fbfdfe;
  --board-surface-tint: rgba(11, 183, 170, 0.045);
  --board-frame: var(--board-accent);

  position: relative;
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
  line-height: 1.78;
  font-size: 14px;
  color: #334155;

  &::before {
    display: none;
  }

  :deep(.markdown-renderer) {
    color: #334155;

    h1,
    h2 {
      position: relative;
      margin: 0 0 12px;
      padding-bottom: 7px;
      color: #0f172a;
      font-size: 20px;
      font-weight: 700;
      line-height: 1.32;
      letter-spacing: 0;

      &::after {
        content: '';
        position: absolute;
        left: 0;
        bottom: 0;
        width: 54px;
        height: 3px;
        border-radius: 999px;
        background: linear-gradient(90deg, #0bb7aa, rgba(2, 132, 199, 0.2));
      }
    }

    h3 {
      margin: 14px 0 8px;
      color: #1e293b;
      font-size: 16px;
      font-weight: 700;
      line-height: 1.4;
    }

    p {
      margin: 8px 0;
      color: #334155;
      font-size: 14px;
      line-height: 1.82;
    }

    ul,
    ol {
      display: grid;
      gap: 8px;
      margin: 10px 0;
      padding-left: 0;
      list-style: none;
    }

    li {
      position: relative;
      margin: 0;
      padding: 2px 0 2px 24px;
      border-radius: 0;
      background: transparent;
      color: #334155;
      line-height: 1.65;

      &::before {
        content: '';
        position: absolute;
        left: 6px;
        top: 12px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #0bb7aa;
        box-shadow: none;
      }
    }

    ol {
      counter-reset: lesson-counter;

      li {
        counter-increment: lesson-counter;

        &::before {
          content: counter(lesson-counter);
          top: 3px;
          left: 0;
          width: 16px;
          height: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #0bb7aa;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          box-shadow: none;
        }
      }
    }

    strong {
      color: #0f766e;
      font-weight: 700;
      background-image: linear-gradient(transparent 58%, rgba(11, 183, 170, 0.2) 58%);
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
    }

    em {
      color: #475569;
      font-style: normal;
      text-decoration: underline;
      text-decoration-color: rgba(245, 158, 11, 0.55);
      text-decoration-thickness: 2px;
      text-underline-offset: 4px;
    }

    blockquote {
      border-left: 3px solid #0bb7aa;
      padding: 9px 12px;
      color: #0f766e;
      background: rgba(11, 183, 170, 0.05);
      border-radius: 0 8px 8px 0;
      margin: 8px 0;
    }
    .math-block, .math-inline { font-style: italic; }
  }
}

.segment-board:not(:has(> .board-block)) {
  padding: 16px 18px;
  border: 1px solid rgba(203, 213, 225, 0.72);
  border-left: 3px solid var(--board-frame);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.74), rgba(248, 250, 252, 0.54)),
    rgba(255, 255, 255, 0.62);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.035);
}

// 桌面端板书使用 12 栅格，按教学语义组织主视觉、侧栏说明和概念卡片
.segment-board:has(> .board-block) {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-flow: row;
  gap: 18px 20px;
  align-items: stretch;
}

.segment-board:has(> .board-block:only-child) > .board-block {
  grid-column: 1 / -1;
}

.segment-board-paired {
  gap: 18px 22px;
}

.segment-board-compact {
  gap: 16px 18px;
}

.board-block {
  --block-divider-color: rgba(226, 232, 240, 0.9);
  --block-panel-bg: rgba(255, 255, 255, 0.62);
  --block-panel-border: rgba(203, 213, 225, 0.72);
  --block-panel-shadow: 0 4px 14px rgba(15, 23, 42, 0.035);

  position: relative;
  min-width: 0;
  height: 100%;
  margin: 0;
  padding: 0 0 0 14px;
  border-left: 2px solid rgba(11, 183, 170, 0.25);
}

.board-span-full {
  grid-column: span 12;
}

.board-span-wide {
  grid-column: span 8;
}

.board-span-side,
.board-span-third {
  grid-column: span 4;
}

.board-span-half {
  grid-column: span 6;
}

.board-role-visual,
.board-role-code {
  border-left: 0;
  padding-left: 0;
}

.board-role-explanation,
.board-role-concept,
.board-role-note,
.board-role-summary,
.board-role-support {
  min-height: 100%;
}

.board-role-explanation,
.board-role-concept,
.board-role-note,
.board-role-summary,
.board-role-support,
.board-side-panel {
  padding: 12px 14px;
  border: 1px solid var(--block-panel-border);
  border-left: 3px solid var(--block-divider-color);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(248, 250, 252, 0.52)),
    var(--block-panel-bg);
  box-shadow: var(--block-panel-shadow);
}

.board-role-concept {
  --block-panel-bg: rgba(240, 253, 250, 0.38);
  --block-panel-border: rgba(153, 246, 228, 0.5);
}

.board-role-note {
  --block-panel-bg: rgba(255, 251, 235, 0.42);
  --block-panel-border: rgba(253, 230, 138, 0.58);
}

.board-role-summary {
  --block-panel-bg: rgba(236, 253, 245, 0.42);
  --block-panel-border: rgba(167, 243, 208, 0.55);
}

.board-primary {
  align-self: stretch;
}

.board-side-panel {
  align-self: stretch;
}

.board-side-panel :deep(.lesson-block-header),
.board-side-panel :deep(.numbered-header),
.board-side-panel :deep(.concept-header) {
  margin-bottom: 8px;
}

.board-side-panel :deep(.lesson-block-title),
.board-side-panel :deep(.numbered-title),
.board-side-panel :deep(.concept-title) {
  font-size: 15px;
  line-height: 1.35;
}

.board-side-panel :deep(.numbered-list) {
  gap: 10px;
}

.board-side-panel :deep(.numbered-item) {
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 10px;
  padding-bottom: 12px;
}

.board-side-panel :deep(.number-marker) {
  width: 28px;
  height: 28px;
  font-size: 13px;
}

.board-side-panel :deep(.operation-step) {
  grid-template-columns: 26px minmax(0, 1fr);
  gap: 8px;
  padding-left: 8px;
}

.board-grouped {
  align-self: stretch;
}

.board-block-reveal-enter-active,
.board-block-reveal-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.board-block-reveal-enter-from,
.board-block-reveal-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

// 宽内容仍可通过 span class 控制是否全宽；这里只保留视觉边框处理
.board-block-code,
.board-block-structure,
.board-block-trace,
.board-block-comparison,
.board-block-vs-compare,
.board-block-vs_compare,
.board-block-operation-sequence,
.board-block-operation_sequence {
  border-left: 0;
  padding-left: 0;
}

.board-block-concept-card,
.board-block-definition-card,
.board-block-principle-card,
.board-block-key-takeaway,
.board-block-concept-breakdown,
.board-block-concept_breakdown {
  --block-divider-color: rgba(20, 184, 166, 0.24);
}

.board-block-invariant,
.board-block-operation-sequence,
.board-block-operation_sequence,
.board-block-reasoning-steps,
.board-block-reasoning_steps {
  --block-divider-color: rgba(14, 165, 233, 0.22);
}

.board-block-complexity,
.board-block-comparison,
.board-block-vs-compare,
.board-block-vs_compare,
.board-block-numbered-points,
.board-block-numbered_points,
.board-block-ordered-checklist,
.board-block-ordered_checklist {
  --block-divider-color: rgba(148, 163, 184, 0.34);
}

.board-block-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.board-block-title {
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
}

.board-code-language {
  flex: 0 0 auto;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(15, 118, 110, 0.18);
  background: rgba(20, 184, 166, 0.08);
  color: #0f766e;
  font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.45;
}

.board-block-code {
  :deep(.code-block-wrapper) {
    margin: 0;
  }
}

.board-block-callout,
.board-block-quote {
  padding: 8px 0 8px 12px;
  border-left: 3px solid rgba(14, 165, 233, 0.42);
  border-radius: 0;
  background: transparent;
}

.board-block-callout.board-tone-warning,
.board-block-quote.board-tone-warning {
  border-color: rgba(245, 158, 11, 0.58);
  background: transparent;
}

.board-block-callout.board-tone-error,
.board-block-quote.board-tone-error {
  border-color: rgba(239, 68, 68, 0.5);
  background: transparent;
}

.board-block-callout.board-tone-success,
.board-block-quote.board-tone-success {
  border-color: rgba(16, 185, 129, 0.5);
  background: transparent;
}

.segment-formula {
  --board-accent: #2563eb;
}

.segment-mistake {
  --board-accent: #ef4444;
}

.segment-diagnosis {
  --board-accent: #f59e0b;
}

.segment-question {
  --board-accent: #a855f7;
}

.visual-hint {
  margin-top: 0;
  padding: 12px 16px;
  border-radius: 10px;
  background: rgba(14, 165, 233, 0.05);
  border: 1px solid rgba(14, 165, 233, 0.16);
  font-size: 13px;

  :deep(.markdown-renderer) {
    background: transparent;
    padding: 0;

    h1,
    h2,
    h3 {
      margin-top: 0;
      color: #075985;
    }
  }
}

.segment-markdown {
  background: #fff;
  border-radius: 12px;
  padding: 16px 22px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(15, 23, 42, 0.04);
  line-height: 1.75;
  font-size: 14px;
  color: #334155;

  :deep(.markdown-renderer) {
    h1, h2 { font-size: 17px; margin: 12px 0 6px; color: #0f172a; }
    h3 { font-size: 15px; margin: 10px 0 4px; }
    p { margin: 6px 0; }
    ul, ol { padding-left: 18px; }
    li { margin: 3px 0; }
    blockquote {
      border-left: 3px solid #0bb7aa;
      padding-left: 12px;
      color: #0f766e;
      background: rgba(11, 183, 170, 0.05);
      border-radius: 0 8px 8px 0;
      margin: 8px 0;
    }
    .math-block, .math-inline { font-style: italic; }
  }
}

.segment-diagram {
  background: #fff;
  border-radius: 14px;
  padding: 20px 24px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
  border: 2px solid rgba(15, 23, 42, 0.06);
  transition: border-color 0.4s ease, box-shadow 0.4s ease;

  // diagram 有自己的 2px 边框卡片，关掉板书框架条避免冲突
  &::before {
    display: none;
  }
}

.focus-target-container {
  // targets for focus effect classes from teaching-animations.scss
}

.segment-pause {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  background: rgba(100, 116, 139, 0.06);
  font-size: 13px;
  color: #64748b;

  .pause-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #94a3b8;
    animation: agentDotPulse 1s ease-in-out infinite;
  }
}

@keyframes sceneTextFade {
  from {
    opacity: 0.28;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes formulaCardLift {
  0% {
    border-color: rgba(37, 99, 235, 0.1);
    filter: none;
  }
  42% {
    border-color: rgba(37, 99, 235, 0.38);
    filter: drop-shadow(0 8px 18px rgba(37, 99, 235, 0.12));
  }
  100% {
    border-color: rgba(15, 23, 42, 0.04);
    filter: none;
  }
}

@keyframes formulaWriteSweep {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(100%);
  }
}

@keyframes diagramTrace {
  0% {
    border-color: rgba(245, 158, 11, 0.18);
    box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0), 0 6px 20px rgba(15, 23, 42, 0.04);
  }
  50% {
    border-color: rgba(245, 158, 11, 0.55);
    box-shadow: inset 0 0 0 2px rgba(245, 158, 11, 0.12), 0 12px 28px rgba(245, 158, 11, 0.12);
  }
  100% {
    border-color: rgba(15, 23, 42, 0.06);
    box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0), 0 6px 20px rgba(15, 23, 42, 0.04);
  }
}

@keyframes focusPulse {
  0%, 100% {
    filter: none;
  }
  45% {
    filter: drop-shadow(0 10px 20px rgba(239, 68, 68, 0.12));
  }
}

@keyframes quizMount {
  from {
    opacity: 0.3;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.teacher-avatar-img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
}

@keyframes feedbackSlow {
  0%, 100% {
    filter: none;
  }
  45% {
    filter: drop-shadow(0 10px 20px rgba(245, 158, 11, 0.12));
  }
}

@keyframes feedbackNeedHelp {
  0%, 100% {
    box-shadow: none;
  }
  45% {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }
}

@keyframes feedbackMastered {
  0%, 100% {
    filter: none;
  }
  45% {
    filter: drop-shadow(0 10px 18px rgba(16, 185, 129, 0.14));
  }
}

@keyframes feedbackSkip {
  0%, 100% {
    opacity: 1;
  }
  45% {
    opacity: 0.58;
  }
}

// 板书落定（落墨感）
@keyframes boardEnter {
  from {
    opacity: 0.55;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .teacher-talk {
    grid-template-columns: 34px 14px minmax(0, 1fr);
    gap: 8px;
  }

  .teacher-avatar {
    width: 34px;
    height: 34px;
  }

  .segment-end-hint {
    margin-left: 56px;
    white-space: normal;
  }
}

@media (prefers-reduced-motion: reduce) {
  .segment-current::before,
  .segment-waiting::before,
  .teacher-avatar.is-speaking::after,
  .voice-waveform.active span,
  .segment-end-hint .hint-dot,
  .feedback-slower .classroom-shell,
  .feedback-dont-understand .segment-board,
  .feedback-dont-understand .teacher-text,
  .feedback-mastered .classroom-shell,
  .feedback-skip .classroom-shell {
    animation: none !important;
  }
}
</style>
