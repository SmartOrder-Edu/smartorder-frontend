<template>
  <div class="inline-quiz-card">
    <div v-if="celebrating && isCorrect" class="confetti-layer" aria-hidden="true">
      <span
        v-for="piece in confettiPieces"
        :key="piece.id"
        class="confetti-piece"
        :class="`confetti-${piece.shape}`"
        :style="confettiStyle(piece)"
      ></span>
    </div>

    <div class="quiz-head">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span>Agent 提问</span>
    </div>

    <p class="quiz-prompt">{{ displayPrompt }}</p>

    <!-- 作答区 -->
    <div v-if="!showResult" class="quiz-input-area">
      <template v-if="normalizedAnswerType === 'text'">
        <textarea v-model="answer" class="quiz-textarea" placeholder="输入你的答案…" rows="2" :disabled="disabled || submitted"></textarea>
      </template>
      <template v-else-if="normalizedAnswerType === 'number'">
        <input v-model="answer" class="quiz-textinput" placeholder="输入数字…" :disabled="disabled || submitted" />
      </template>
      <template v-else-if="normalizedAnswerType === 'single_select'">
        <div class="quiz-options">
          <button
            v-for="opt in quizOptions" :key="opt.value"
            class="quiz-option"
            :class="{
              selected: answer === opt.value,
              submitted,
              'correct-celebrate': isCorrect && celebrating && answer === opt.value,
            }"
            :disabled="disabled || submitted"
            @click="answer = opt.value"
          >{{ opt.label }}</button>
        </div>
      </template>
      <template v-else-if="normalizedAnswerType === 'multi_select'">
        <div class="quiz-options">
          <label
            v-for="opt in quizOptions"
            :key="opt.value"
            class="quiz-check-label"
            :class="{
              selected: checkedValues.includes(opt.value),
              submitted,
              'correct-celebrate': isCorrect && celebrating && checkedValues.includes(opt.value),
            }"
          >
            <input type="checkbox" :value="opt.value" v-model="checkedValues" :disabled="disabled || submitted" />
            {{ opt.label }}
          </label>
        </div>
      </template>

      <button class="quiz-submit" :disabled="!canSubmit || disabled || submitted" @click="doSubmit">
        {{ submitted && isCorrect ? '回答正确' : '提交' }}
      </button>
    </div>

    <!-- 结果区 -->
    <div v-else class="quiz-result" :class="{ correct: isCorrect, wrong: !isCorrect }">
      <div class="result-bar">
        <span class="result-status">{{ isCorrect ? '✓ 正确' : '✗ 错误' }}</span>
      </div>
      <div class="result-explain" v-if="quiz.explanation">
        <MarkdownRenderer :content="quiz.explanation" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import type { InlineQuiz } from '@/types/study'

const props = defineProps<{
  quiz: InlineQuiz
  disabled: boolean
}>()

const emit = defineEmits<{
  (e: 'answer', quizId: string, value: string): void
}>()

const answer = ref('')
const checkedValues = ref<string[]>([])
const submitted = ref(false)
const showResult = ref(false)
const isCorrect = ref(false)
const celebrating = ref(false)
let celebrationTimer: ReturnType<typeof setTimeout> | null = null

type QuizOption = { label: string; value: string }
type ConfettiPiece = {
  id: number
  x: number
  sway: number
  delay: number
  duration: number
  color: string
  rotate: number
  size: number
  shape: 'rect' | 'circle'
}

const confettiPieces: ConfettiPiece[] = [
  { id: 1, x: 10, sway: 12, delay: 0, duration: 1250, color: '#14b8a6', rotate: -16, size: 7, shape: 'rect' },
  { id: 2, x: 18, sway: -10, delay: 70, duration: 1340, color: '#f59e0b', rotate: 18, size: 6, shape: 'circle' },
  { id: 3, x: 26, sway: 14, delay: 25, duration: 1290, color: '#3b82f6', rotate: -22, size: 7, shape: 'rect' },
  { id: 4, x: 34, sway: -12, delay: 115, duration: 1400, color: '#ef4444', rotate: 20, size: 6, shape: 'rect' },
  { id: 5, x: 42, sway: 10, delay: 45, duration: 1320, color: '#a855f7', rotate: -18, size: 7, shape: 'circle' },
  { id: 6, x: 50, sway: -14, delay: 145, duration: 1440, color: '#10b981', rotate: 16, size: 7, shape: 'rect' },
  { id: 7, x: 58, sway: 12, delay: 90, duration: 1360, color: '#f97316', rotate: -14, size: 6, shape: 'circle' },
  { id: 8, x: 66, sway: -10, delay: 35, duration: 1280, color: '#06b6d4', rotate: 22, size: 7, shape: 'rect' },
  { id: 9, x: 74, sway: 13, delay: 130, duration: 1420, color: '#eab308', rotate: -20, size: 6, shape: 'rect' },
  { id: 10, x: 82, sway: -12, delay: 80, duration: 1330, color: '#ec4899', rotate: 16, size: 7, shape: 'circle' },
  { id: 11, x: 90, sway: 9, delay: 155, duration: 1460, color: '#22c55e', rotate: -12, size: 6, shape: 'rect' },
  { id: 12, x: 95, sway: -9, delay: 20, duration: 1260, color: '#6366f1', rotate: 18, size: 6, shape: 'circle' },
]

const inlineOptionPattern = /(^|\s)([A-Ha-h])\s*[.、．)]\s*([\s\S]*?)(?=(\s+[A-Ha-h]\s*[.、．)]\s*)|$)/g

const parsedInlineOptions = computed<QuizOption[]>(() => {
  if (props.quiz.options?.length) return []
  const text = props.quiz.prompt || ''
  const matches: QuizOption[] = []
  inlineOptionPattern.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = inlineOptionPattern.exec(text))) {
    const value = normalizeOptionValue(match[2])
    const label = stripOptionPrefix(match[3].trim())
    if (label) matches.push({ value, label })
  }
  return matches.length >= 2 ? matches : []
})

const quizOptions = computed<QuizOption[]>(() => {
  if (props.quiz.options?.length) {
    return props.quiz.options.map(opt => ({
      value: normalizeOptionValue(String(opt.value)),
      label: stripOptionPrefix(String(opt.label)),
    }))
  }
  return parsedInlineOptions.value
})

const displayPrompt = computed(() => {
  if (!parsedInlineOptions.value.length) return props.quiz.prompt
  inlineOptionPattern.lastIndex = 0
  const match = inlineOptionPattern.exec(props.quiz.prompt || '')
  return match ? (props.quiz.prompt || '').slice(0, match.index).trim() : props.quiz.prompt
})

const normalizedAnswerType = computed(() => {
  const type = String(props.quiz.answerType || 'text').replace('-', '_')
  if (type === 'short_text' || type === 'short_answer' || type === 'free_text') return 'text'
  if (type === 'single_choice' || type === 'choice') return 'single_select'
  if (type === 'multi_choice' || type === 'multiple_choice') return 'multi_select'
  if (type === 'text' && quizOptions.value.length) return 'single_select'
  if ((type === 'single_select' || type === 'multi_select') && !quizOptions.value.length) return 'text'
  if (type === 'text' || type === 'number' || type === 'single_select' || type === 'multi_select') return type
  return 'text'
})

const canSubmit = computed(() => {
  if (normalizedAnswerType.value === 'multi_select') return checkedValues.value.length > 0
  return answer.value.trim().length > 0
})

const isChoiceQuestion = computed(() =>
  normalizedAnswerType.value === 'single_select' || normalizedAnswerType.value === 'multi_select',
)

function doSubmit() {
  if (!canSubmit.value || submitted.value) return
  const value =
    normalizedAnswerType.value === 'multi_select'
      ? checkedValues.value.join(',')
      : answer.value.trim()
  isCorrect.value = value === normalizeCorrectAnswer(props.quiz.correctAnswer || '')
  submitted.value = true
  if (isCorrect.value && isChoiceQuestion.value) {
    celebrating.value = true
    celebrationTimer = setTimeout(() => {
      celebrating.value = false
      showResult.value = true
      celebrationTimer = null
    }, 1350)
  } else {
    showResult.value = true
  }
  emit('answer', props.quiz.id, value)
}

function stripOptionPrefix(value: string): string {
  return value.replace(/^[A-Ha-h]\s*[.、．)]\s*/, '').trim()
}

function normalizeOptionValue(value: string): string {
  const trimmed = value.trim()
  return /^[A-Za-z]$/.test(trimmed) ? trimmed.toLowerCase() : trimmed
}

function normalizeCorrectAnswer(value: string): string {
  const stripped = stripOptionPrefix(value)
  const normalized = normalizeOptionValue(stripped)
  const option = quizOptions.value.find(opt =>
    opt.value === normalized ||
    opt.label === value.trim() ||
    opt.label === stripped,
  )
  return option?.value || normalized
}

function confettiStyle(piece: ConfettiPiece) {
  return {
    '--confetti-x': `${piece.x}%`,
    '--confetti-drift': `${piece.drift}px`,
    '--confetti-delay': `${piece.delay}ms`,
    '--confetti-duration': `${piece.duration}ms`,
    '--confetti-color': piece.color,
    '--confetti-rotate': `${piece.rotate}deg`,
    '--confetti-width': `${piece.size}px`,
    '--confetti-height': `${Math.round(piece.size * 1.35)}px`,
    '--confetti-sway': `${piece.sway}px`,
    '--confetti-sway-half': `${Math.round(piece.sway * -0.45)}px`,
  }
}

watch(() => props.quiz.id, () => {
  clearCelebrationTimer()
  answer.value = ''
  checkedValues.value = []
  submitted.value = false
  showResult.value = false
  isCorrect.value = false
  celebrating.value = false
})

onUnmounted(() => {
  clearCelebrationTimer()
})

function clearCelebrationTimer() {
  if (!celebrationTimer) return
  clearTimeout(celebrationTimer)
  celebrationTimer = null
}
</script>

<style scoped lang="scss">
.inline-quiz-card {
  position: relative;
  overflow: hidden;
  padding: 18px 20px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(249, 115, 22, 0.04));
  border: 1px solid rgba(245, 158, 11, 0.35);
  margin-bottom: 12px;
}

.confetti-layer {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  top: -14px;
  left: var(--confetti-x);
  width: var(--confetti-width);
  height: var(--confetti-height);
  border-radius: 2px;
  background: var(--confetti-color);
  opacity: 0;
  transform: translate3d(0, -8px, 0) rotate(var(--confetti-rotate));
  animation: confettiFall var(--confetti-duration) var(--confetti-delay) ease-in forwards;

  &.confetti-circle { border-radius: 999px; }
}

.quiz-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  color: #d97706;
  font-size: 12px;
  font-weight: 600;
}

.quiz-prompt {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.5;
}

.quiz-textarea,
.quiz-textinput {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  resize: vertical;
  color: #1e293b;
  background: #fff;
  &:focus { border-color: #f59e0b; }
  &:disabled { background: #f8fafc; color: #94a3b8; }
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.quiz-option,
.quiz-check-label {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.quiz-option {
  display: block;
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1.5px solid rgba(15, 23, 42, 0.1);
  background: #fff;
  text-align: left;
  font-size: 14px;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
  &:hover:not(:disabled) { border-color: #f59e0b; background: rgba(245, 158, 11, 0.04); }
  &.selected { border-color: #f59e0b; background: rgba(245, 158, 11, 0.1); color: #d97706; font-weight: 600; }
  &:disabled { opacity: 0.6; cursor: default; }
  &.correct-celebrate:disabled { opacity: 1; }
}

.quiz-check-label {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1.5px solid rgba(15, 23, 42, 0.1);
  background: #fff;
  font-size: 14px;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;

  &.selected {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
    color: #d97706;
    font-weight: 600;
  }

  &.submitted {
    cursor: default;
  }
}

.quiz-option.correct-celebrate,
.quiz-check-label.correct-celebrate {
  border-color: rgba(16, 185, 129, 0.7);
  background: rgba(16, 185, 129, 0.08);
  color: #047857;
  box-shadow: 0 8px 18px rgba(16, 185, 129, 0.13);
  animation: correctOptionLift 520ms ease-out;
}

.quiz-submit {
  margin-top: 4px;
  padding: 9px 22px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

.quiz-result {
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid transparent;
  &.correct {
    background: rgba(16, 185, 129, 0.08);
    border-color: rgba(16, 185, 129, 0.3);
  }
  &.wrong {
    background: rgba(239, 68, 68, 0.06);
    border-color: rgba(239, 68, 68, 0.3);
  }
}

.result-bar {
  margin-bottom: 8px;
  .result-status {
    font-size: 13px;
    font-weight: 600;
    .correct & { color: #059669; }
    .wrong & { color: #dc2626; }
  }
}

.result-explain {
  font-size: 13px;
  color: #1e293b;
  line-height: 1.6;
  :deep(.markdown-renderer) { background: transparent; padding: 0; p { margin: 4px 0; } }
}

@keyframes confettiFall {
  0% {
    transform: translate3d(0, -10px, 0) rotate(var(--confetti-rotate));
    opacity: 0;
  }
  12% {
    opacity: 0.9;
  }
  35% {
    transform: translate3d(var(--confetti-sway), 68px, 0) rotate(calc(var(--confetti-rotate) + 80deg));
    opacity: 0.9;
  }
  70% {
    transform: translate3d(var(--confetti-sway-half), 138px, 0) rotate(calc(var(--confetti-rotate) + 170deg));
    opacity: 0.72;
  }
  100% {
    transform: translate3d(var(--confetti-sway), 210px, 0) rotate(calc(var(--confetti-rotate) + 250deg));
    opacity: 0;
  }
}

@keyframes correctOptionLift {
  0% {
    transform: translateY(0);
  }
  28% {
    transform: translateY(-2px);
  }
  100% {
    transform: translateY(0);
  }
}
</style>
