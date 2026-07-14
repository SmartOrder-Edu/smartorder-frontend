<template>
  <article class="interactive-question-card">
    <div class="question-meta">
      <span class="type-badge">{{ question.questionTypeName || getQuestionTypeLabel(question.questionType) }}</span>
      <span class="difficulty-badge">难度 {{ question.difficulty || '-' }}</span>
      <span class="score-badge">{{ question.score || 0 }} 分</span>
    </div>

    <h3 class="question-stem">
      <span v-if="displayIndex" class="q-display-index">{{ displayIndex }}.</span>
      {{ question.stem }}
    </h3>

    <!-- 交互式答题区 -->
    <div class="question-interaction">
      <!-- 选择题 -->
      <div v-if="currentOptions.length" class="options-list">
        <button
          v-for="option in currentOptions"
          :key="option.label"
          type="button"
          class="option-button"
          :class="{
            selected: selectedOptions.includes(option.label) && !showAnswer,
            correct: showAnswer && correctOptionsList.includes(option.label),
            wrong: showAnswer && selectedOptions.includes(option.label) && !correctOptionsList.includes(option.label)
          }"
          :disabled="showAnswer"
          @click="toggleOption(option.label)"
        >
          <span>{{ option.label }}</span>
          <strong>{{ option.content }}</strong>

          <!-- 反馈图标 -->
          <span v-if="showAnswer && correctOptionsList.includes(option.label)" class="feedback-icon correct">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          <span v-else-if="showAnswer && selectedOptions.includes(option.label) && !correctOptionsList.includes(option.label)" class="feedback-icon wrong">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="10" height="10"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </span>
        </button>
      </div>

      <!-- 判断题 -->
      <div v-else-if="question.questionType === 'judge'" class="judge-list">
        <button
          type="button"
          class="option-button judge-btn"
          :class="{
            selected: textAnswer === 'true' && !showAnswer,
            correct: showAnswer && answerText === '正确',
            wrong: showAnswer && textAnswer === 'true' && answerText !== '正确'
          }"
          :disabled="showAnswer"
          @click="textAnswer = 'true'"
        >
          正确
          <span v-if="showAnswer && answerText === '正确'" class="feedback-icon correct"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg></span>
          <span v-else-if="showAnswer && textAnswer === 'true' && answerText !== '正确'" class="feedback-icon wrong"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="10" height="10"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
        </button>
        <button
          type="button"
          class="option-button judge-btn"
          :class="{
            selected: textAnswer === 'false' && !showAnswer,
            correct: showAnswer && answerText === '错误',
            wrong: showAnswer && textAnswer === 'false' && answerText !== '错误'
          }"
          :disabled="showAnswer"
          @click="textAnswer = 'false'"
        >
          错误
          <span v-if="showAnswer && answerText === '错误'" class="feedback-icon correct"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg></span>
          <span v-else-if="showAnswer && textAnswer === 'false' && answerText !== '错误'" class="feedback-icon wrong"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="10" height="10"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
        </button>
      </div>

      <!-- 代码题 -->
      <div v-else-if="question.questionType === 'code'" class="code-answer-section">
        <select v-model="codeLang" :disabled="showAnswer" class="lang-select">
          <option value="c11">C (C11)</option>
          <option value="cpp17">C++ (C++17)</option>
        </select>
        <CodeEditor
          v-model="textAnswer"
          :readonly="showAnswer"
          :language="codeLang"
          placeholder="// 在此编写代码...&#10;#include <stdio.h>&#10;&#10;int main() {&#10;    // 你的代码&#10;    return 0;&#10;}"
          :show-footer="false"
        />
      </div>

      <!-- 主观/填空/代码题 -->
      <el-input
        v-else
        v-model="textAnswer"
        type="textarea"
        :rows="4"
        :disabled="showAnswer"
        placeholder="在这里填入你的答案..."
        class="custom-textarea"
      />

    </div>

    <!-- 结果反馈与解析 -->
    <div v-if="showAnswer" class="answer-panel">
      <div v-if="currentOptions.length || question.questionType === 'judge'" class="answer-result-banner" :class="{ 'is-correct': isCurrentAnswerCorrect }">
        <span class="banner-icon">
          <svg v-if="isCurrentAnswerCorrect" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/><path d="M12 2a5 5 0 0 1 5 5v5a5 5 0 0 1-5 5 5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </span>
        <span class="banner-title">{{ isCurrentAnswerCorrect ? '回答正确！' : '回答错误，请查看解析' }}</span>
      </div>

      <div class="answer-reference">
        <span>参考答案</span>
        <strong>{{ answerText || '暂无参考答案' }}</strong>
      </div>
      <p v-if="question.explanation" class="explanation-text">{{ question.explanation }}</p>

      <!-- 常见错误分析 -->
      <div v-if="question.commonMistakes?.length" class="common-mistakes">
        <h4 class="mistakes-title">常见错误分析</h4>
        <div
          v-for="(mistake, idx) in question.commonMistakes"
          :key="idx"
          class="mistake-item"
        >
          <span class="mistake-option">{{ mistake.option }}</span>
          <div class="mistake-body">
            <p class="mistake-reason">{{ mistake.reason }}</p>
            <p v-if="mistake.example" class="mistake-example">例：{{ mistake.example }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="question.tags?.length || question.knowledgePoints?.length || question.abilityTags?.length" class="question-tags">
      <!-- v2 新增：知识点标签 -->
      <span v-for="kp in question.knowledgePoints" :key="'kp-'+kp" class="tag-kp">{{ kp }}</span>
      <!-- v2 新增：能力标签 -->
      <span v-for="at in question.abilityTags" :key="'at-'+at" class="tag-ability">{{ at }}</span>
      <!-- 原有标签 -->
      <span v-for="tag in question.tags" :key="tag" class="tag-normal">{{ tag }}</span>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EvaluationQuestion } from '@/api/evaluationQuestion'
import CodeEditor from '@/components/exam/CodeEditor.vue'
import {
  getQuestionAnswerText,
  getQuestionTypeName,
  normalizeQuestionOptions
} from '@/utils/examQuestionMapper'

const props = defineProps<{
  question: EvaluationQuestion
  displayIndex?: number
  showAnswer: boolean
}>()

const selectedOptions = ref<string[]>([])
const textAnswer = ref('')
const codeLang = ref('c11')

const currentOptions = computed(() => normalizeQuestionOptions(props.question.options))
const answerText = computed(() => getQuestionAnswerText(props.question.correctAnswer))

// 判断逻辑
const isMultiChoice = computed(() => props.question.questionType === 'multiple_choice')
const correctOptionsList = computed(() => {
  if (!props.question.correctAnswer || typeof props.question.correctAnswer !== 'object') return []
  const answerMap = props.question.correctAnswer as Record<string, any>
  if (Array.isArray(answerMap.correctOptions)) {
    return answerMap.correctOptions.map(String)
  }
  return []
})

const isCurrentAnswerCorrect = computed(() => {
  if (currentOptions.value.length > 0) {
    if (correctOptionsList.value.length === 0) return false
    if (selectedOptions.value.length !== correctOptionsList.value.length) return false
    return selectedOptions.value.every(opt => correctOptionsList.value.includes(opt))
  }
  if (props.question.questionType === 'judge') {
    if (textAnswer.value === 'true' && answerText.value === '正确') return true
    if (textAnswer.value === 'false' && answerText.value === '错误') return true
    return false
  }
  // 简答、代码等主观题默认无法程序判断绝对正误
  return true
})

function getQuestionTypeLabel(type: string | undefined): string {
  return getQuestionTypeName(type)
}

function toggleOption(label: string) {
  if (props.showAnswer) return
  if (isMultiChoice.value) {
    const idx = selectedOptions.value.indexOf(label)
    if (idx > -1) {
      selectedOptions.value.splice(idx, 1)
    } else {
      selectedOptions.value.push(label)
    }
  } else {
    selectedOptions.value = [label]
  }
}
</script>

<style scoped>
.interactive-question-card {
  background: var(--color-card-bg-secondary);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.interactive-question-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md), 0 8px 24px rgba(11, 183, 170, 0.08);
  border-color: rgba(11, 183, 170, 0.2);
}

.question-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.type-badge {
  background: var(--gradient-primary);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(11, 183, 170, 0.3);
}

.difficulty-badge, .score-badge {
  background: rgba(11, 183, 170, 0.1);
  color: var(--primary-color);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.question-stem {
  font-size: 17px;
  color: #1e293b;
  line-height: 1.6;
  font-weight: 600;
  margin-bottom: 24px;
}

.q-display-index {
  color: var(--primary-color);
  font-weight: 700;
  margin-right: 4px;
}

/* 交互区样式 - 复用高档感 */
.question-interaction {
  margin-bottom: 24px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-button {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 16px 20px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.option-button:not(:disabled):hover {
  transform: translateY(-2px);
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(11, 183, 170, 0.15);
}

.option-button span:first-child {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #f1f5f9;
  border-radius: 50%;
  font-weight: 600;
  color: #64748b;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.option-button strong {
  font-weight: 500;
  color: #334155;
  font-size: 15px;
  line-height: 1.5;
  flex: 1;
}

/* 选中状态 */
.option-button.selected {
  background: rgba(11, 183, 170, 0.05);
  border-color: var(--primary-color);
}
.option-button.selected span:first-child {
  background: var(--primary-color);
  color: white;
}

/* 正误反馈 */
.option-button.correct {
  background: rgba(16, 185, 129, 0.1);
  border-color: #10b981;
  box-shadow: 0 0 0 1px #10b981 inset;
}
.option-button.correct span:first-child {
  background: #10b981;
  color: white;
}

.option-button.wrong {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  box-shadow: 0 0 0 1px #ef4444 inset;
}
.option-button.wrong span:first-child {
  background: #ef4444;
  color: white;
}

.feedback-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: white;
}
.feedback-icon.correct { background: #10b981; }
.feedback-icon.wrong { background: #ef4444; }

.judge-list {
  display: flex;
  gap: 16px;
}
.judge-btn {
  flex: 1;
  justify-content: center;
  font-size: 16px;
}

.custom-textarea :deep(.el-textarea__inner) {
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 16px;
  font-size: 15px;
  transition: all 0.3s;
}
.custom-textarea :deep(.el-textarea__inner:focus) {
  background: white;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(11, 183, 170, 0.1);
}

.code-answer-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lang-select {
  padding: 5px 10px;
  border-radius: 6px;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  color: #1e293b;
  font-size: 12px;
  font-weight: 600;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.lang-select:focus {
  border-color: #0bb7aa;
}

.lang-select:disabled {
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

.action-row {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.btn-submit-answer {
  background: var(--gradient-primary);
  border: none;
  padding: 8px 24px;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

/* 解析面板复用 */
.answer-panel {
  background: linear-gradient(145deg, #f1f8f7, #f8fafc);
  border-radius: 12px;
  padding: 20px;
  margin-top: 24px;
  border: 1px dashed #cbd5e1;
  animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.answer-result-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 20px;
  background: rgba(239, 68, 68, 0.08);
  border-left: 4px solid #ef4444;
  color: #ef4444;
}
.answer-result-banner.is-correct {
  background: rgba(16, 185, 129, 0.08);
  border-left-color: #10b981;
  color: #10b981;
}

.banner-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: currentColor;
  color: white;
  border-radius: 50%;
}
.banner-title {
  font-weight: 600;
  font-size: 15px;
}

.answer-reference {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.answer-reference span {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}
.answer-reference strong {
  font-size: 16px;
  color: #10b981;
}

.explanation-text {
  background: white;
  padding: 16px;
  border-radius: 10px;
  color: #334155;
  line-height: 1.6;
  font-size: 14px;
  margin: 0;
  border: 1px solid #e2e8f0;
}

.common-mistakes {
  margin-top: 16px;
}

.mistakes-title {
  font-size: 14px;
  font-weight: 700;
  color: #475569;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.mistake-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  margin-bottom: 8px;
}

.mistake-item:last-child {
  margin-bottom: 0;
}

.mistake-option {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  background: #f59e0b;
  color: white;
  border-radius: 6px;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}

.mistake-body {
  flex: 1;
  min-width: 0;
}

.mistake-reason {
  margin: 0 0 4px 0;
  font-size: 13px;
  color: #92400e;
  font-weight: 600;
  line-height: 1.5;
}

.mistake-example {
  margin: 0;
  font-size: 12px;
  color: #a16207;
  line-height: 1.5;
  font-style: italic;
}

.question-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}
.question-tags span {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.tag-kp {
  background: rgba(11, 183, 170, 0.1);
  color: var(--primary-color);
}
.tag-ability {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}
.tag-normal {
  background: #f1f5f9;
  color: #64748b;
}
</style>
