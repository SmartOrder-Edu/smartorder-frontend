<template>
  <div class="inline-quiz-card" :class="{ celebrating: celebrating && isCorrect }">
    <div v-if="celebrating && isCorrect" class="confetti-layer" aria-hidden="true">
      <span
        v-for="piece in confettiPieces"
        :key="piece.id"
        class="confetti-piece"
        :class="`confetti-${piece.shape}`"
        :style="confettiStyle(piece)"
      ></span>
      <div class="celebration-icon">
        <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
          <circle cx="24" cy="24" r="22" fill="#10b981" stroke="#059669" stroke-width="2"/>
          <path d="M14 24l7 7 13-13" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
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
  burstX: number
  burstY: number
  drift: number
  delay: number
  duration: number
  color: string
  rotate: number
  size: number
  shape: 'rect' | 'circle' | 'triangle'
}

const confettiPieces = ref<ConfettiPiece[]>([])

function generateConfetti(): ConfettiPiece[] {
  const colors = [
    '#14b8a6', '#f59e0b', '#3b82f6', '#ef4444', '#a855f7',
    '#10b981', '#f97316', '#06b6d4', '#eab308', '#ec4899',
    '#22c55e', '#6366f1', '#84cc16', '#f43f5e', '#8b5cf6',
    '#fb923c', '#2dd4bf', '#e879f9',
  ]
  const shapes: Array<'rect' | 'circle' | 'triangle'> = ['rect', 'circle', 'triangle']

  return Array.from({ length: 50 }, (_, i) => ({
    id: i,
    burstX: (Math.random() - 0.5) * 420,
    burstY: -(Math.random() * 80 + 40),
    drift: (Math.random() - 0.5) * 160,
    delay: Math.random() * 250,
    duration: 1200 + Math.random() * 600,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotate: Math.random() * 720 - 360,
    size: 5 + Math.random() * 7,
    shape: shapes[Math.floor(Math.random() * shapes.length)],
  }))
}

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
    confettiPieces.value = generateConfetti()
    celebrating.value = true
    celebrationTimer = setTimeout(() => {
      celebrating.value = false
      showResult.value = true
      celebrationTimer = null
    }, 1600)
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
    '--burst-x': `${piece.burstX}px`,
    '--burst-y': `${piece.burstY}px`,
    '--drift': `${piece.drift}px`,
    '--confetti-delay': `${piece.delay}ms`,
    '--confetti-duration': `${piece.duration}ms`,
    '--confetti-color': piece.color,
    '--confetti-rotate': `${piece.rotate}deg`,
    '--confetti-size': `${piece.size}px`,
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
  left: 50%;
  top: 40%;
  width: var(--confetti-size);
  height: var(--confetti-size);
  border-radius: 2px;
  background: var(--confetti-color);
  opacity: 0;
  transform: translate(-50%, -50%) scale(0);
  animation: confettiBurst var(--confetti-duration) var(--confetti-delay) cubic-bezier(0.18, 0.89, 0.32, 1.05) forwards;

  &.confetti-circle { border-radius: 999px; }

  &.confetti-triangle {
    border-radius: 0;
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  }
}

.celebration-icon {
  position: absolute;
  left: 50%;
  top: 38%;
  transform: translate(-50%, -50%) scale(0);
  z-index: 4;
  animation: iconPopIn 600ms 200ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  filter: drop-shadow(0 4px 12px rgba(16, 185, 129, 0.4));
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
  animation: correctOptionPop 700ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.inline-quiz-card.celebrating {
  border-color: rgba(16, 185, 129, 0.5);
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.15);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
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

@keyframes confettiBurst {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  8% {
    opacity: 1;
  }
  25% {
    transform: translate(calc(var(--burst-x) - 50%), calc(var(--burst-y) - 50%)) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(calc(var(--burst-x) + var(--drift) - 50%), calc(200px - 50%)) scale(0.3) rotate(var(--confetti-rotate));
    opacity: 0;
  }
}

@keyframes iconPopIn {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  55% {
    transform: translate(-50%, -50%) scale(1.3);
    opacity: 1;
  }
  75% {
    transform: translate(-50%, -50%) scale(0.88);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

@keyframes correctOptionPop {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5);
  }
  30% {
    transform: scale(1.04);
    box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
  }
  55% {
    transform: scale(0.97);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 8px 18px rgba(16, 185, 129, 0.13);
  }
}
</style>
