<template>
  <div class="practice-stage">
    <div class="prompt-block">
      <MarkdownRenderer :content="markdown" />
    </div>

    <div class="question-block">
      <div class="q-head">
        <span class="q-tag">{{ question.id.startsWith('a') ? '判断题' : '跟做题' }}</span>
        <span class="q-prompt">{{ question.prompt }}</span>
      </div>
      <div class="q-body">
        <MarkdownRenderer :content="question.body" />
      </div>

      <!-- 答题区 -->
      <div class="answer-area">
        <input
          v-model="answer"
          class="answer-input"
          :placeholder="isJudgment ? '回答 适用 / 不适用' : '输入你的答案（如 1、0、1/6）'"
          @keyup.enter="submit"
          :disabled="submitted"
        />
        <button class="submit-btn" @click="submit" :disabled="!answer.trim() || submitted">
          提交
        </button>
        <button class="hint-btn" @click="showHint = !showHint" v-if="!submitted">
          {{ showHint ? '隐藏提示' : '看提示' }}
        </button>
      </div>

      <div v-if="showHint && !submitted" class="hint-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <path d="M9 21h6M12 17v4M12 3a6 6 0 0 0-4 10.5c.5.5 1 1.5 1 2.5h6c0-1 .5-2 1-2.5A6 6 0 0 0 12 3z"/>
        </svg>
        <span>{{ question.hint }}</span>
      </div>

      <!-- 提交结果 -->
      <div v-if="submitted" class="result-box" :class="{ correct: result?.correct, wrong: !result?.correct }">
        <div class="result-head">
          <span class="result-status">{{ result?.correct ? '✓ 回答正确' : '✗ 答案不对' }}</span>
          <span class="result-answer">正确答案：{{ question.answer }}</span>
        </div>
        <div class="result-explain">
          <MarkdownRenderer :content="result?.explanation || ''" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import type { PracticeQuestion } from '@/types/study'

const props = defineProps<{
  markdown: string
  question: PracticeQuestion
}>()

const emit = defineEmits<{
  (e: 'submit', payload: { answer: string; correct: boolean; explanation: string }): void
}>()

const answer = ref('')
const submitted = ref(false)
const showHint = ref(false)
const result = ref<{ correct: boolean; explanation: string } | null>(null)

const isJudgment = computed(() => props.question?.id?.startsWith('a') ?? false)

function submit() {
  if (!answer.value.trim() || submitted.value) return
  const correct =
    answer.value.trim() === props.question.answer ||
    answer.value.trim().replace(/\s/g, '') === props.question.answer.replace(/\s/g, '')
  const explanation = correct ? '回答正确，Agent 已记录。' : props.question.errorExplanation
  result.value = { correct, explanation }
  submitted.value = true
  emit('submit', { answer: answer.value.trim(), correct, explanation })
}

watch(() => props.question, () => {
  answer.value = ''
  submitted.value = false
  showHint.value = false
  result.value = null
})
</script>

<style scoped lang="scss">
.practice-stage { display: flex; flex-direction: column; gap: 18px; }

.prompt-block {
  background: #fff;
  border-radius: 14px;
  padding: 22px 28px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(15, 23, 42, 0.04);
}

.question-block {
  background: #fff;
  border-radius: 14px;
  padding: 22px 28px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(15, 23, 42, 0.04);
}

.q-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;

  .q-tag {
    flex-shrink: 0;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    background: rgba(168, 85, 247, 0.12);
    color: #a855f7;
  }
  .q-prompt { font-size: 13px; color: #64748b; }
}

.q-body { margin-bottom: 18px; }

.answer-area {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.answer-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 14px;
  border: 1.5px solid rgba(15, 23, 42, 0.1);
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;

  &:focus { border-color: #0bb7aa; }
  &:disabled { background: #f8fafc; color: #94a3b8; }
}

.submit-btn {
  padding: 10px 22px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s ease;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

.hint-btn {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #fff;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  &:hover { border-color: #0bb7aa; color: #0bb7aa; }
}

.hint-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(245, 158, 11, 0.08);
  border-left: 3px solid #f59e0b;
  border-radius: 8px;
  font-size: 13px;
  color: #92400e;
  svg { flex-shrink: 0; margin-top: 2px; }
}

.result-box {
  margin-top: 16px;
  padding: 14px 18px;
  border-radius: 10px;
  border: 1px solid transparent;

  &.correct {
    background: rgba(16, 185, 129, 0.08);
    border-color: rgba(16, 185, 129, 0.3);
    .result-status { color: #059669; }
  }
  &.wrong {
    background: rgba(239, 68, 68, 0.06);
    border-color: rgba(239, 68, 68, 0.3);
    .result-status { color: #dc2626; }
  }
}

.result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  .result-answer { color: #64748b; font-weight: 400; }
}

.result-explain {
  font-size: 13px;
  color: #1e293b;
  line-height: 1.6;
  :deep(.markdown-renderer) { background: transparent; padding: 0; }
}

@media (max-width: 640px) {
  .prompt-block, .question-block { padding: 16px; }
  .answer-input { width: 100%; }
}
</style>
