<template>
  <div class="inline-quiz-card">
    <div class="quiz-head">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span>Agent 提问</span>
    </div>

    <p class="quiz-prompt">{{ quiz.prompt }}</p>

    <!-- 作答区 -->
    <div v-if="!submitted" class="quiz-input-area">
      <template v-if="quiz.answerType === 'text'">
        <textarea v-model="answer" class="quiz-textarea" placeholder="输入你的答案…" rows="2" :disabled="disabled"></textarea>
      </template>
      <template v-else-if="quiz.answerType === 'number'">
        <input v-model="answer" class="quiz-textinput" placeholder="输入数字…" :disabled="disabled" />
      </template>
      <template v-else-if="quiz.answerType === 'single_select'">
        <div class="quiz-options">
          <button
            v-for="opt in quiz.options" :key="opt.value"
            class="quiz-option"
            :class="{ selected: answer === opt.value }"
            :disabled="disabled"
            @click="answer = opt.value"
          >{{ opt.label }}</button>
        </div>
      </template>
      <template v-else-if="quiz.answerType === 'multi_select'">
        <div class="quiz-options">
          <label v-for="opt in quiz.options" :key="opt.value" class="quiz-check-label">
            <input type="checkbox" :value="opt.value" v-model="checkedValues" :disabled="disabled" />
            {{ opt.label }}
          </label>
        </div>
      </template>

      <button class="quiz-submit" :disabled="!canSubmit || disabled" @click="doSubmit">提交</button>
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
import { ref, computed, watch } from 'vue'
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
const isCorrect = ref(false)

const canSubmit = computed(() => {
  if (props.quiz.answerType === 'multi_select') return checkedValues.value.length > 0
  return answer.value.trim().length > 0
})

function doSubmit() {
  if (!canSubmit.value || submitted.value) return
  const value =
    props.quiz.answerType === 'multi_select'
      ? checkedValues.value.join(',')
      : answer.value.trim()
  isCorrect.value = value === props.quiz.correctAnswer
  submitted.value = true
  emit('answer', props.quiz.id, value)
}

watch(() => props.quiz.id, () => {
  answer.value = ''
  checkedValues.value = []
  submitted.value = false
  isCorrect.value = false
})
</script>

<style scoped lang="scss">
.inline-quiz-card {
  padding: 18px 20px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(249, 115, 22, 0.04));
  border: 1px solid rgba(245, 158, 11, 0.35);
  margin-bottom: 12px;
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
}

.quiz-check-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #334155;
  cursor: pointer;
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
</style>
