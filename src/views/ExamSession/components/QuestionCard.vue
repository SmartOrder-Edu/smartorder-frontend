<template>
  <div 
    class="question-card" 
    :class="{ 
      active: active,
      answered: isAnswered 
    }"
  >
    <!-- 题目头部 -->
    <QuestionHeader
      :globalIndex="q.globalIndex"
      :typeName="typeName"
      :tags="q.tags"
      :kps="q.knowledgePoints"
      :score="q.score"
    />

    <!-- 题干 -->
    <div class="question-title" v-html="q.stem"></div>

    <!-- 作答交互区域 -->
    <div class="question-body">
      <!-- 选择题/判断题选项列表 -->
      <OptionList
        v-if="hasOptions"
        :question="q"
        :answers="answers"
        :showAnswer="showAnswer"
        :disabled="isSubmitting"
        @select-option="handleOptionSelect"
        @select-judge="handleJudgeSelect"
      />

      <!-- 填空题作答区域 -->
      <div class="q-fill-blank" v-else-if="q.questionType === 'fill_blank'">
        <div v-for="(val, idx) in fillBlankValues" :key="idx" class="fill-row">
          <span class="fill-label">第 {{ idx + 1 }} 空：</span>
          <input 
            type="text" 
            :value="val" 
            @input="e => handleFillBlankInput(idx, (e.target as HTMLInputElement).value)" 
            placeholder="请填写答案" 
            :readonly="showAnswer" 
            class="custom-input" 
          />
        </div>
      </div>

      <!-- 主观/问答题作答区域 -->
      <div class="q-essay" v-else>
        <textarea 
          :value="answers[q.id as any] || ''" 
          @input="e => handleEssayInput((e.target as HTMLTextAreaElement).value)"
          :readonly="showAnswer" 
          rows="5" 
          placeholder="请输入答案..." 
          class="custom-textarea"
        ></textarea>
      </div>
    </div>

    <!-- 判分与结果反馈面板 -->
    <ResultPanel
      v-if="showAnswer"
      :question="q"
      :grading="grading"
      :userAnswerText="userAnswerText"
      :correctAnswerText="correctAnswerText"
      :isCorrectLocal="isCorrectLocal"
      :sessionId="sessionId"
      :isExpanded="isAnalysisExpanded"
      @toggle-expand="toggleAnalysis"
    />

    <!-- 卡片底部操作栏 -->
    <div class="question-footer">
      <QuestionFooter
        :globalIndex="q.globalIndex"
        :flagged="flagged"
        :favorited="favorited"
        @toggle-flag="emit('toggle-flag', q.globalIndex)"
        @toggle-favorite="emit('toggle-favorite', q.globalIndex)"
        @show-kp="emit('show-kp', q)"
      />
      
      <PageNavigation
        :globalIndex="q.globalIndex"
        :totalCount="totalCount"
        @prev="emit('prev', q.globalIndex)"
        @next="emit('next', q.globalIndex)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import QuestionHeader from './QuestionHeader.vue'
import OptionList from './OptionList.vue'
import ResultPanel from './ResultPanel.vue'
import QuestionFooter from './QuestionFooter.vue'
import PageNavigation from './PageNavigation.vue'
import { getQuestionAnswerText, normalizeQuestionOptions } from '@/utils/examQuestionMapper'
import type { EvaluationQuestion } from '@/api/evaluationQuestion'
import type { AnswerDetailVO } from '@/api/evaluationSession'

const props = defineProps<{
  q: any // EvaluationQuestion & { globalIndex: number }
  typeName: string
  active: boolean
  answers: Record<string | number, string>
  showAnswer: boolean
  isSubmitting: boolean
  flagged: boolean
  favorited: boolean
  sessionId?: string
  grading?: AnswerDetailVO
  totalCount: number
  isAnalysisExpanded: boolean
}>()

const emit = defineEmits<{
  (e: 'select-option', q: any, label: string): void
  (e: 'select-judge', q: any, val: string): void
  (e: 'update-fill-blank', q: any, index: number, val: string): void
  (e: 'update-essay', q: any, val: string): void
  (e: 'toggle-flag', index: number): void
  (e: 'toggle-favorite', index: number): void
  (e: 'show-kp', q: any): void
  (e: 'prev', index: number): void
  (e: 'next', index: number): void
  (e: 'toggle-analysis', questionId: string | number): void
}>()

// 是否有选项（单选/多选/判断）
const hasOptions = computed(() => {
  const q = props.q
  if (normalizeQuestionOptions(q.options).length > 0) return true
  if (q.questionType === 'single_choice' || q.questionType === 'multiple_choice' || q.questionType === 'judge') return true
  return false
})

// 正确答案文本
const correctAnswerText = computed(() => {
  return getQuestionAnswerText(props.q.correctAnswer) || '无'
})

// 用户答案文本
const userAnswerText = computed(() => {
  let user = props.answers[props.q.id as any] || ''
  if (!user) return ''
  if (props.q.questionType === 'judge') {
    return user === 'true' ? '正确' : (user === 'false' ? '错误' : user)
  }
  if (props.q.questionType === 'fill_blank') {
    return user.replace(/;;/g, ';')
  }
  return user
})

// 判断本题是否已答
const isAnswered = computed(() => {
  const ans = props.answers[props.q.id as any]
  if (!ans) return false
  if (props.q.questionType === 'fill_blank') {
    const vals = fillBlankValues.value
    return vals.length > 0 && vals.every(v => v.trim() !== '')
  }
  return ans.trim() !== ''
})

// 本地判题是否正确（客观题）
const isCorrectLocal = computed(() => {
  const correct = correctAnswerText.value
  const user = userAnswerText.value
  if (!user) return false
  
  if (props.q.questionType === 'single_choice' || props.q.questionType === 'judge') {
    return user === correct
  }
  if (props.q.questionType === 'multiple_choice') {
    const sortedUser = user.split('、').map(s=>s.trim()).sort().join('、')
    const sortedCorrect = correct.split('、').map(s=>s.trim()).sort().join('、')
    return sortedUser === sortedCorrect
  }
  if (props.q.questionType === 'fill_blank') {
    const uParts = user.split(';').map(s => s.trim())
    const cParts = correct.split('、').map(s => s.trim()) 
    if (uParts.length !== cParts.length) return false
    for(let i=0; i<uParts.length; i++) {
      if(uParts[i] !== cParts[i]) return false
    }
    return true
  }
  return false
})

// 填空题处理
const getBlankCount = () => {
  const matches = props.q.stem.match(/_+/g)
  if (matches && matches.length > 0) {
    return matches.length
  }
  const correctAns = correctAnswerText.value
  if (correctAns && correctAns !== '无') {
    return correctAns.split('、').length
  }
  return 1
}

const fillBlankValues = computed(() => {
  const ans = props.answers[props.q.id as any] || ''
  const parts = ans.split(';;')
  const count = getBlankCount()
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    result.push(parts[i] || '')
  }
  return result
})

// 交互转发
const handleOptionSelect = (label: string) => {
  emit('select-option', props.q, label)
}

const handleJudgeSelect = (val: string) => {
  emit('select-judge', props.q, val)
}

const handleFillBlankInput = (index: number, val: string) => {
  emit('update-fill-blank', props.q, index, val)
}

const handleEssayInput = (val: string) => {
  emit('update-essay', props.q, val)
}

const toggleAnalysis = () => {
  emit('toggle-analysis', props.q.id)
}
</script>

<style scoped>
.question-card {
  background: #ffffff;
  border: 1px solid rgba(20, 184, 166, 0.20);
  border-radius: 30px;
  box-shadow: 0 16px 42px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  margin-bottom: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.question-card:last-child {
  margin-bottom: 0;
}

/* 活跃聚焦状态：加青绿色发光阴影与高亮边框 */
.question-card.active {
  border-color: #14b8a6;
  box-shadow: 0 16px 42px rgba(20, 184, 166, 0.15);
}

.question-title {
  padding: 6px 28px 24px;
  font-size: 18px;
  line-height: 1.9;
  font-weight: 650;
  color: #182230;
  transition: color 0.3s ease;
}

.question-body {
  position: relative;
}

/* 填空题样式 */
.q-fill-blank {
  padding: 12px 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.fill-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.fill-label {
  font-size: 15px;
  font-weight: 750;
  color: #475467;
  min-width: 68px;
  transition: color 0.3s ease;
}

.custom-input {
  flex: 1;
  height: 48px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1.5px solid #dbe3ec;
  font-size: 15px;
  color: #182230;
  font-weight: 600;
  outline: none;
  background: #fdfdfd;
  transition: all 0.2s ease;
}

.custom-input:focus {
  border-color: #14b8a6;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
}

.custom-input[readonly] {
  background: #f5f7fb;
  border-color: #e2e8f0;
  color: #64748b;
  cursor: default;
}

/* 简答/主观题样式 */
.q-essay {
  padding: 12px 28px 24px;
}

.custom-textarea {
  width: 100%;
  padding: 16px;
  border-radius: 16px;
  border: 1.5px solid #dbe3ec;
  font-size: 15px;
  color: #182230;
  font-weight: 550;
  outline: none;
  background: #fdfdfd;
  transition: all 0.2s ease;
  resize: vertical;
  line-height: 1.6;
}

.custom-textarea:focus {
  border-color: #14b8a6;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
}

.custom-textarea[readonly] {
  background: #f5f7fb;
  border-color: #e2e8f0;
  color: #64748b;
  cursor: default;
}

/* 页脚操作栏 */
.question-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 28px 28px;
  border-top: 1.5px solid #edf1f6;
  background: #fafbfc;
  transition: all 0.3s ease;
}

@media (max-width: 768px) {
  .question-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    padding: 20px;
  }
}

/* 深色模式适配 */
html[data-theme='dark'] .question-card {
  background: #1e293b;
  border-color: rgba(20, 184, 166, 0.15);
  box-shadow: 0 16px 42px rgba(0, 0, 0, 0.2);
}

html[data-theme='dark'] .question-card.active {
  border-color: #14b8a6;
  box-shadow: 0 16px 42px rgba(20, 184, 166, 0.25);
}

html[data-theme='dark'] .question-title {
  color: #f4f7fb;
}

html[data-theme='dark'] .fill-label {
  color: #cbd5e1;
}

html[data-theme='dark'] .custom-input,
html[data-theme='dark'] .custom-textarea {
  background: #151e2e;
  border-color: #334155;
  color: #cbd5e1;
}

html[data-theme='dark'] .custom-input:focus,
html[data-theme='dark'] .custom-textarea:focus {
  border-color: #14b8a6;
  background: #1e293b;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2);
}

html[data-theme='dark'] .custom-input[readonly],
html[data-theme='dark'] .custom-textarea[readonly] {
  background: #0f172a;
  border-color: #1e293b;
  color: #64748b;
}

html[data-theme='dark'] .question-footer {
  border-top-color: #334155;
  background: #182235;
}
</style>
