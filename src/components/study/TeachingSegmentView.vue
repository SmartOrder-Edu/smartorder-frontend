<template>
  <div
    class="teaching-segment"
    :class="{
      'segment-enter': visible && isNew,
      'segment-past': !isCurrent,
      'segment-current': isCurrent,
      'segment-future': !visible,
      'scene-action-active': !!sceneAction,
      [`scene-action-${sceneAction?.actionType}`]: !!sceneAction,
    }"
    :style="sceneActionStyle"
    :ref="(el) => { if (el && isCurrent && segment.focusTarget) applyFocus(el) }"
  >
    <div v-if="segment.type !== 'pause'" class="classroom-shell" :class="[`tone-${segment.emotionTone || 'serious'}`]">
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
      <div class="segment-pause">
        <span class="pause-dot"></span>
        <span>{{ segment.markdown || 'Agent 正在准备下一段讲解…' }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

// 刚变为可见时播放入场动画
const isNew = ref(false)
watch(
  () => props.isCurrent,
  (cur) => {
    if (cur) {
      isNew.value = true
      setTimeout(() => (isNew.value = false), 450)
    }
  },
  { immediate: true },
)

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

function applyFocus(el: HTMLElement) {
  const target = props.segment.focusTarget
  if (!target || target.scroll === 'none') return
  const inner = el.querySelector(target.selector)
  if (inner) {
    inner.scrollIntoView({ behavior: target.scroll as ScrollBehavior, block: 'center' })
  }
}
</script>

<style scoped lang="scss">
.teaching-segment {
  margin-bottom: 10px;
  border-radius: 12px;
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.segment-past {
  opacity: 0.5;
  pointer-events: none;
  transform: scale(0.98);
}

.segment-current {
  opacity: 1;
}

.segment-future {
  display: none;
}

.segment-enter {
  // keyframes in teaching-animations.scss
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
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  background: linear-gradient(180deg, #ffffff, #f8fafc);
  padding: 14px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.045);

  &.tone-curious {
    border-color: rgba(14, 165, 233, 0.18);
    background: linear-gradient(180deg, #fff, #f0f9ff);
  }

  &.tone-warning {
    border-color: rgba(239, 68, 68, 0.18);
    background: linear-gradient(180deg, #fff, #fff7ed);
  }

  &.tone-summary {
    border-color: rgba(16, 185, 129, 0.2);
    background: linear-gradient(180deg, #fff, #f0fdf4);
  }
}

.teacher-talk {
  margin-bottom: 12px;
}

.teacher-text {
  position: relative;
  padding: 2px 0 2px 14px;
  border-left: 3px solid rgba(11, 183, 170, 0.42);
  color: #0f172a;
  line-height: 1.82;
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
  background: #fff;
  border-radius: 12px;
  padding: 18px 22px;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.055), 0 6px 18px rgba(15, 23, 42, 0.035);
  line-height: 1.78;
  font-size: 14px;
  color: #334155;

  :deep(.markdown-renderer) {
    color: #334155;

    h1,
    h2 {
      position: relative;
      margin: 0 0 12px;
      padding-bottom: 7px;
      color: #0f172a;
      font-size: 20px;
      font-weight: 750;
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
      padding: 8px 10px 8px 28px;
      border-radius: 8px;
      background: rgba(248, 250, 252, 0.9);
      color: #334155;
      line-height: 1.65;

      &::before {
        content: '';
        position: absolute;
        left: 12px;
        top: 18px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #0bb7aa;
        box-shadow: 0 0 0 3px rgba(11, 183, 170, 0.1);
      }
    }

    ol {
      counter-reset: lesson-counter;

      li {
        counter-increment: lesson-counter;

        &::before {
          content: counter(lesson-counter);
          top: 9px;
          left: 8px;
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
      font-weight: 750;
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

.board-block {
  margin: 0 0 14px;

  &:last-child {
    margin-bottom: 0;
  }
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
  font-weight: 750;
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
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(14, 165, 233, 0.16);
  background: rgba(14, 165, 233, 0.06);
}

.board-block-callout.board-tone-warning,
.board-block-quote.board-tone-warning {
  border-color: rgba(245, 158, 11, 0.24);
  background: rgba(245, 158, 11, 0.08);
}

.board-block-callout.board-tone-error,
.board-block-quote.board-tone-error {
  border-color: rgba(239, 68, 68, 0.22);
  background: rgba(239, 68, 68, 0.07);
}

.board-block-callout.board-tone-success,
.board-block-quote.board-tone-success {
  border-color: rgba(16, 185, 129, 0.22);
  background: rgba(16, 185, 129, 0.07);
}

.segment-formula {
  border-left: 3px solid #2563eb;
}

.segment-mistake {
  border-left: 3px solid #ef4444;
  background: #fff7ed;
}

.segment-diagnosis {
  border-left: 3px solid #f59e0b;
  background: #fffbeb;
}

.segment-question {
  border-left: 3px solid #a855f7;
}

.visual-hint {
  margin-top: 10px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(14, 165, 233, 0.06);
  border: 1px solid rgba(14, 165, 233, 0.14);

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
</style>
