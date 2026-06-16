<template>
  <div class="gate-card" :class="'gate-' + reason">
    <!-- CLARIFICATION Gate -->
    <template v-if="reason === 'CLARIFICATION'">
      <div class="gate-header">
        <span class="gate-icon clarification-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </span>
        <span class="gate-title">Agent 需要你回答</span>
      </div>
      <p class="gate-question">{{ question }}</p>

      <!-- 只读模式 (历史回放) -->
      <template v-if="readonly">
        <div class="gate-readonly-answer">
          <span class="answer-label">你的回答：</span>
          <span class="answer-value">{{ answeredValue || '—' }}</span>
        </div>
      </template>

      <!-- 交互模式 -->
      <template v-else>
        <!-- TEXT answerType (默认 / 无 clarification) -->
        <div v-if="!clarification || clarification.answerType === 'TEXT'" class="gate-input-area">
          <textarea
            v-model="userAnswer"
            placeholder="输入你的回答..."
            rows="2"
            @keydown.enter.exact.prevent="submitAnswer"
            @keydown.enter.shift.exact.stop
            ref="inputRef"
          ></textarea>
          <button class="gate-submit-btn" @click="submitAnswer" :disabled="!userAnswer.trim()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22,2 15,22 11,13 2,9"/>
            </svg>
            发送
          </button>
        </div>

        <!-- SINGLE_SELECT answerType -->
        <div v-else-if="clarification.answerType === 'SINGLE_SELECT'" class="gate-options">
          <div
            v-for="opt in clarification.options"
            :key="opt.value"
            class="gate-option"
            :class="{ selected: selectedOption === opt.value }"
            @click="selectedOption = opt.value"
          >
            {{ opt.label }}
          </div>
          <button class="gate-submit-btn" @click="submitSelectAnswer" :disabled="!selectedOption">
            确认选择
          </button>
        </div>

        <!-- MULTI_SELECT answerType -->
        <div v-else-if="clarification.answerType === 'MULTI_SELECT'" class="gate-options multi">
          <div
            v-for="opt in clarification.options"
            :key="opt.value"
            class="gate-option"
            :class="{ selected: selectedOptions.includes(opt.value) }"
            @click="toggleMultiSelect(opt.value)"
          >
            {{ opt.label }}
          </div>
          <button class="gate-submit-btn" @click="submitMultiSelectAnswer" :disabled="selectedOptions.length === 0">
            确认选择
          </button>
        </div>

        <!-- NUMBER answerType -->
        <div v-else-if="clarification.answerType === 'NUMBER'" class="gate-input-area">
          <input
            type="number"
            v-model="numericAnswer"
            placeholder="输入数字..."
            @keydown.enter.exact.prevent="submitNumericAnswer"
            ref="inputRef"
          />
          <button class="gate-submit-btn" @click="submitNumericAnswer" :disabled="numericAnswer === ''">
            确认
          </button>
        </div>
      </template>

      <p class="gate-hint">回答后 Agent 将据此调整后续计划</p>
    </template>

    <!-- CONFIRMATION Gate -->
    <template v-else-if="reason === 'CONFIRMATION'">
      <div class="gate-header">
        <span class="gate-icon confirmation-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </span>
        <span class="gate-title">需要你的确认</span>
      </div>
      <p class="gate-question" v-if="question">{{ question }}</p>
      <div class="gate-actions" v-else>
        <p class="gate-desc">以下操作将修改你的学习数据，确认执行？</p>
      </div>
      <div class="gate-buttons">
        <button class="gate-confirm-btn" @click="$emit('confirm')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          确认执行
        </button>
        <button class="gate-cancel-btn" @click="$emit('cancel')">
          取消
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import type { PauseReason, ClarificationInfo } from '@/types/planExecute'

const props = withDefaults(defineProps<{
  reason: PauseReason
  question: string
  clarification?: ClarificationInfo
  readonly?: boolean
  answeredValue?: string
}>(), {
  readonly: false,
  answeredValue: '',
})

const emit = defineEmits<{
  answer: [clarificationId: string, value: string]
  confirm: []
  cancel: []
}>()

const userAnswer = ref('')
const selectedOption = ref('')
const selectedOptions = ref<string[]>([])
const numericAnswer = ref('')
const inputRef = ref<HTMLTextAreaElement | HTMLInputElement>()

onMounted(() => {
  if (props.reason === 'CLARIFICATION' && !props.readonly) {
    nextTick(() => inputRef.value?.focus())
  }
})

function submitAnswer() {
  if (!userAnswer.value.trim()) return
  const id = props.clarification?.clarificationId || ''
  emit('answer', id, userAnswer.value.trim())
  userAnswer.value = ''
}

function submitSelectAnswer() {
  if (!selectedOption.value) return
  emit('answer', props.clarification!.clarificationId, selectedOption.value)
  selectedOption.value = ''
}

function submitMultiSelectAnswer() {
  if (selectedOptions.value.length === 0) return
  emit('answer', props.clarification!.clarificationId, JSON.stringify(selectedOptions.value))
  selectedOptions.value = []
}

function submitNumericAnswer() {
  if (numericAnswer.value === '') return
  emit('answer', props.clarification!.clarificationId, numericAnswer.value)
  numericAnswer.value = ''
}

function toggleMultiSelect(value: string) {
  const idx = selectedOptions.value.indexOf(value)
  if (idx >= 0) {
    selectedOptions.value.splice(idx, 1)
  } else {
    selectedOptions.value.push(value)
  }
}
</script>

<style scoped>
.gate-card {
  margin-top: 8px;
  border-radius: var(--radius-lg, 0.75rem);
  padding: 12px 14px;
  animation: gateIn 0.3s ease;
}

.gate-CLARIFICATION {
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.gate-CONFIRMATION {
  background: rgba(239, 68, 68, 0.04);
  border: 1px solid rgba(239, 68, 68, 0.15);
}

.gate-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.gate-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.clarification-icon {
  color: #d97706;
}

.confirmation-icon {
  color: #dc2626;
}

.gate-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-dark, #0f172a);
}

.gate-question {
  font-size: 0.8125rem;
  color: var(--text-secondary, #475569);
  line-height: 1.6;
  margin: 0 0 10px;
}

/* 文本输入区 */
.gate-input-area {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.gate-input-area textarea,
.gate-input-area input {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: var(--radius-md, 0.5rem);
  padding: 8px 10px;
  font-size: 0.8125rem;
  line-height: 1.5;
  resize: none;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;
}

.gate-input-area textarea:focus,
.gate-input-area input:focus {
  border-color: var(--primary-color, #3b5bdb);
}

/* 选项卡片 */
.gate-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.gate-options.multi {
  /* 多选同样式 */
}

.gate-option {
  padding: 6px 14px;
  border: 1px solid #e5e7eb;
  border-radius: var(--radius-md, 0.5rem);
  font-size: 0.8125rem;
  color: var(--text-secondary, #475569);
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}

.gate-option:hover {
  border-color: var(--primary-color, #3b5bdb);
  color: var(--primary-color, #3b5bdb);
}

.gate-option.selected {
  border-color: var(--primary-color, #3b5bdb);
  background: rgba(59, 91, 219, 0.08);
  color: var(--primary-color, #3b5bdb);
  font-weight: 500;
}

/* 提交按钮 */
.gate-submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 14px;
  border: none;
  border-radius: var(--radius-md, 0.5rem);
  background: var(--primary-color, #3b5bdb);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}

.gate-submit-btn:hover:not(:disabled) {
  background: #2c4fcc;
}

.gate-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gate-hint {
  margin: 6px 0 0;
  font-size: 0.6875rem;
  color: var(--text-muted, #94a3b8);
}

/* 只读模式（历史回放） */
.gate-readonly-answer {
  padding: 8px 10px;
  background: rgba(59, 91, 219, 0.04);
  border-radius: var(--radius-md, 0.5rem);
  font-size: 0.8125rem;
  line-height: 1.5;
}

.answer-label {
  color: var(--text-muted, #94a3b8);
  font-size: 0.75rem;
}

.answer-value {
  color: var(--text-dark, #0f172a);
  font-weight: 500;
}

/* CONFIRMATION 门样式 */
.gate-desc {
  font-size: 0.75rem;
  color: var(--text-secondary, #475569);
  line-height: 1.5;
  margin: 0 0 10px;
}

.gate-buttons {
  display: flex;
  gap: 8px;
}

.gate-confirm-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-md, 0.5rem);
  background: var(--primary-color, #3b5bdb);
  color: white;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.gate-confirm-btn:hover {
  background: #2c4fcc;
}

.gate-cancel-btn {
  padding: 8px 16px;
  border: 1px solid var(--border-light, #e5e7eb);
  border-radius: var(--radius-md, 0.5rem);
  background: white;
  color: var(--text-secondary, #475569);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.15s;
}

.gate-cancel-btn:hover {
  border-color: var(--text-muted, #94a3b8);
  background: var(--background-color-base, #f8fafc);
}

@keyframes gateIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
