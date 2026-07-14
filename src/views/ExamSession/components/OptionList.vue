<template>
  <div class="option-list">
    <!-- 选择题选项 -->
    <div v-if="options.length > 0" class="options-grid">
      <OptionItem
        v-for="opt in options"
        :key="opt.label"
        :label="opt.label"
        :content="opt.content"
        :selected="isOptionSelected(opt.label)"
        :correct="showAnswer && isOptionCorrect(opt.label)"
        :wrong="showAnswer && isOptionWrong(opt.label)"
        :disabled="showAnswer || disabled"
        @select="handleOptionSelect"
      />
    </div>

    <!-- 判断题选项 -->
    <div v-else-if="question.questionType === 'judge'" class="options-grid">
      <OptionItem
        label="A"
        content="正确"
        :selected="answers[question.id as any] === 'true'"
        :correct="showAnswer && isJudgeOptionCorrect('true')"
        :wrong="showAnswer && isJudgeOptionWrong('true')"
        :disabled="showAnswer || disabled"
        @select="() => handleJudgeSelect('true')"
      />
      <OptionItem
        label="B"
        content="错误"
        :selected="answers[question.id as any] === 'false'"
        :correct="showAnswer && isJudgeOptionCorrect('false')"
        :wrong="showAnswer && isJudgeOptionWrong('false')"
        :disabled="showAnswer || disabled"
        @select="() => handleJudgeSelect('false')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import OptionItem from './OptionItem.vue'
import { normalizeQuestionOptions } from '@/utils/examQuestionMapper'
import { getQuestionAnswerText } from '@/utils/examQuestionMapper'
import type { EvaluationQuestion } from '@/api/evaluationQuestion'

const props = defineProps<{
  question: EvaluationQuestion
  answers: Record<string | number, string>
  showAnswer: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'select-option', label: string): void
  (e: 'select-judge', val: string): void
}>()

// 获取选项列表
const options = computed(() => {
  const q = props.question
  const opts = normalizeQuestionOptions(q.options)
  if (opts.length === 0 && (q.questionType === 'single_choice' || q.questionType === 'multiple_choice')) {
    return [
      { label: 'A', content: '' },
      { label: 'B', content: '' },
      { label: 'C', content: '' },
      { label: 'D', content: '' }
    ]
  }
  return opts
})

// 正确答案文本
const correctAnsText = computed(() => {
  return getQuestionAnswerText(props.question.correctAnswer) || '无'
})

// 判断选项是否被用户选中
const isOptionSelected = (label: string) => {
  const ans = props.answers[props.question.id as any] || ''
  if (props.question.questionType === 'single_choice') {
    return ans === label
  }
  return ans.split('、').includes(label)
}

// 判断选项是否正确
const isOptionCorrect = (label: string) => {
  const correct = correctAnsText.value
  if (props.question.questionType === 'single_choice') {
    return correct === label
  }
  if (props.question.questionType === 'multiple_choice') {
    return correct.split('、').map(s => s.trim()).includes(label)
  }
  return false
}

// 判断选项是否选错
const isOptionWrong = (label: string) => {
  return isOptionSelected(label) && !isOptionCorrect(label)
}

// 判断题的选项是否正确
const isJudgeOptionCorrect = (val: string) => {
  const correct = correctAnsText.value
  const valText = val === 'true' ? '正确' : '错误'
  return correct === valText
}

// 判断题的选项是否选错
const isJudgeOptionWrong = (val: string) => {
  const selected = props.answers[props.question.id as any] === val
  return selected && !isJudgeOptionCorrect(val)
}

const handleOptionSelect = (label: string) => {
  emit('select-option', label)
}

const handleJudgeSelect = (val: string) => {
  emit('select-judge', val)
}
</script>

<style scoped>
.option-list {
  padding: 8px 28px 24px;
}

.options-grid {
  display: flex;
  flex-direction: column;
}
</style>
