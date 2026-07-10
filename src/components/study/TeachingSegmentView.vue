<template>
  <div
    ref="segmentEl"
    class="teaching-segment"
    :class="{
      'segment-enter': visible && isNew,
      'segment-past': isPast && !collapsed,
      'segment-current': isCurrent,
      'segment-future': !visible,
      'segment-collapsed': isPast && collapsed,
      'scene-action-active': !!sceneAction,
      [`scene-action-${sceneAction?.actionType}`]: !!sceneAction,
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
        <div class="teacher-text">
          <MarkdownRenderer :content="teacherLine" />
        </div>
      </div>

      <div
        v-if="hasBoardContent"
        class="segment-board focus-target-container"
        :class="[focusClass, boardClass, { 'teaching-stagger': visible, 'segment-board-code': !!boardContentCodeLanguage }]"
      >
        <template v-if="displayBoardBlocks.length">
          <section
            v-for="(block, index) in displayBoardBlocks"
            :key="block.id || `${block.type}-${index}`"
            class="board-block"
            :class="[`board-block-${normalizeBoardBlockType(block.type)}`, block.tone ? `board-tone-${block.tone}` : '']"
          >
            <BoardBlockRenderer :block="block" :scene-action="sceneAction" />
          </section>
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
        :disabled="quizState?.answered ?? false"
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
import type { LessonSceneAction, TeachingBoardBlock, TeachingSegment, QuizState } from '@/types/study'

const props = defineProps<{
  segment: TeachingSegment
  visible: boolean
  isCurrent: boolean
  quizState?: QuizState | null
  sceneAction?: LessonSceneAction | null
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
const displayBoardBlocks = computed(() => (props.segment.boardBlocks || []).filter(hasMeaningfulBoardBlock))
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

function normalizeBoardBlockType(type: string): string {
  return (type || 'markdown').toLowerCase().replace(/[^a-z0-9_-]/g, '-')
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
  const record = block as Record<string, unknown>
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
  margin-bottom: 0;
  border-radius: 14px;
  scroll-margin-top: 12px;
  transition: opacity 0.4s ease, transform 0.4s ease, filter 0.4s ease;
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
  opacity: 0.42;
  pointer-events: none;
  transform: scale(0.985);
  filter: saturate(0.92);

  .classroom-shell {
    gap: 10px;
    padding-bottom: 4px;
  }

  .teacher-text {
    background: rgba(11, 183, 170, 0.03);
  }

  .segment-board {
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.03);

    &::before {
      opacity: 0.3;
    }
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
  opacity: 1;
  filter: none;

  // 当前段通过更明显的板书阴影区分，不加左竖条避免嵌套感
  .segment-board {
    box-shadow:
      0 10px 30px rgba(15, 23, 42, 0.06),
      inset 0 0 0 1px rgba(11, 183, 170, 0.1);
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
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;

  &.tone-curious {
    .teacher-text {
      border-left-color: rgba(14, 165, 233, 0.46);
    }
  }

  &.tone-warning {
    .teacher-text {
      border-left-color: rgba(245, 158, 11, 0.58);
    }
  }

  &.tone-summary {
    .teacher-text {
      border-left-color: rgba(16, 185, 129, 0.54);
    }
  }
}

.teacher-talk {
  margin: 0;
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
  background:
    linear-gradient(180deg, var(--board-surface-tint), transparent 38%),
    var(--board-surface);
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 14px;
  padding: 18px 22px;
  box-shadow: 0 6px 22px rgba(15, 23, 42, 0.045);
  line-height: 1.78;
  font-size: 14px;
  color: #334155;

  // 顶部框架条 - 黑板框隐喻，颜色跟随变体强调色
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 16px;
    right: 16px;
    height: 3px;
    border-radius: 0 0 999px 999px;
    background: linear-gradient(90deg, var(--board-frame), rgba(2, 132, 199, 0.22));
    pointer-events: none;
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

// board 有多个 block 时用 2 列网格填充横向宽度，避免宽屏稀疏
.segment-board:has(> .board-block) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 20px;
  align-items: start;
}

// 单个 block 时全宽，不强制 2 列
.segment-board:has(> .board-block:only-child) {
  grid-template-columns: 1fr;
}

.board-block {
  --block-divider-color: rgba(226, 232, 240, 0.9);

  margin: 0;
  padding: 0 0 0 14px;
  border-left: 2px solid rgba(11, 183, 170, 0.25);
}

// 需要全宽的 block 类型：代码 / 数据结构图 / 算法追踪 / 对比 / 操作序列
.board-block-code,
.board-block-structure,
.board-block-trace,
.board-block-comparison,
.board-block-vs-compare,
.board-block-vs_compare,
.board-block-operation-sequence,
.board-block-operation_sequence {
  grid-column: 1 / -1;
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
    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
  }
  42% {
    border-color: rgba(37, 99, 235, 0.38);
    box-shadow: 0 10px 24px rgba(37, 99, 235, 0.13);
  }
  100% {
    border-color: rgba(15, 23, 42, 0.04);
    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
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
    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
  }
  45% {
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.08), 0 12px 28px rgba(239, 68, 68, 0.12);
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
</style>
