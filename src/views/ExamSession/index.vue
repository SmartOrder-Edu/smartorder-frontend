<template>
  <AppLayout>
    <div class="exam-session-page">
      <div class="session-header">
        <button class="back-button" type="button" @click="router.back()">返回</button>
        <div>
          <h1>{{ examTitle }}</h1>
          <p>{{ questions.length }} 题 · 已答 {{ answeredCount }} 题</p>
        </div>
      </div>

      <div v-if="loading" class="empty-panel">正在加载题目...</div>
      <div v-else-if="!questions.length" class="empty-panel">
        当前学习空间还没有题目。回到测评中心生成题库后，再开始测评。
      </div>

      <main v-else class="session-layout">
        <aside class="question-nav">
          <button
            v-for="(question, index) in questions"
            :key="question.id"
            type="button"
            :class="{ active: currentIndex === index, answered: answers[question.id] }"
            @click="goQuestion(index)"
          >
            {{ index + 1 }}
          </button>
        </aside>

        <section class="question-panel">
          <div class="question-topline">
            <span>{{ currentIndex + 1 }} / {{ questions.length }}</span>
            <span>{{ getQuestionTypeName(currentQuestion) }}</span>
            <span>难度 {{ currentQuestion.difficulty || '-' }}</span>
          </div>

          <h2>{{ currentQuestion.stem }}</h2>

          <div v-if="currentOptions.length" class="option-list">
            <button
              v-for="option in currentOptions"
              :key="option.label"
              type="button"
              class="option-button"
              :class="{ selected: selectedOptions.includes(option.label) }"
              @click="toggleOption(option.label)"
            >
              <span>{{ option.label }}</span>
              <strong>{{ option.content }}</strong>
            </button>
          </div>

          <div v-else-if="currentQuestion.questionType === 'judge'" class="judge-list">
            <button
              type="button"
              :class="{ selected: textAnswer === 'true' }"
              @click="textAnswer = 'true'"
            >
              正确
            </button>
            <button
              type="button"
              :class="{ selected: textAnswer === 'false' }"
              @click="textAnswer = 'false'"
            >
              错误
            </button>
          </div>

          <el-input
            v-else
            v-model="textAnswer"
            type="textarea"
            :rows="6"
            placeholder="先写下你的答案，提交后可以查看参考答案。"
          />

          <div v-if="showAnswer" class="answer-panel">
            <div>
              <span>参考答案</span>
              <strong>{{ answerText || '暂无参考答案' }}</strong>
            </div>
            <p v-if="currentQuestion.explanation">{{ currentQuestion.explanation }}</p>
          </div>

          <div class="session-actions">
            <el-button :disabled="currentIndex === 0" @click="goQuestion(currentIndex - 1)">
              上一题
            </el-button>
            <el-button v-if="!showAnswer" type="primary" @click="submitCurrentAnswer">
              提交本题
            </el-button>
            <el-button v-else type="primary" @click="goNext">
              {{ currentIndex === questions.length - 1 ? '完成测评' : '下一题' }}
            </el-button>
          </div>
        </section>
      </main>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import { fetchEvaluationQuestions, type EvaluationQuestion } from '@/api/evaluationQuestion'
import {
  getQuestionAnswerText,
  getQuestionTypeName,
  normalizeQuestionOptions
} from '@/utils/examQuestionMapper'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const questions = ref<EvaluationQuestion[]>([])
const currentIndex = ref(0)
const selectedOptions = ref<string[]>([])
const textAnswer = ref('')
const showAnswer = ref(false)
const answers = ref<Record<number, string>>({})

const examTitle = computed(() => String(route.query.title || '题库专项测评'))
const spaceId = computed(() => Number(route.query.spaceId || 0))
const currentQuestion = computed(() => questions.value[currentIndex.value])
const currentOptions = computed(() => normalizeQuestionOptions(currentQuestion.value?.optionsJson))
const answerText = computed(() => getQuestionAnswerText(currentQuestion.value?.answerJson))
const answeredCount = computed(() => Object.keys(answers.value).length)

const resetCurrentAnswer = () => {
  const question = currentQuestion.value
  const savedAnswer = question ? answers.value[question.id] || '' : ''
  showAnswer.value = !!savedAnswer

  if (currentOptions.value.length) {
    selectedOptions.value = savedAnswer ? savedAnswer.split('、') : []
    textAnswer.value = ''
    return
  }

  selectedOptions.value = []
  textAnswer.value = savedAnswer
}

const fetchQuestions = async () => {
  if (!spaceId.value) {
    ElMessage.warning('缺少学习空间，无法开始测评')
    return
  }

  loading.value = true
  try {
    questions.value = await fetchEvaluationQuestions({
      learningSpaceId: spaceId.value,
      limit: 100
    })
    currentIndex.value = 0
    resetCurrentAnswer()
  } catch (error: any) {
    ElMessage.error(error?.message || '题目加载失败')
  } finally {
    loading.value = false
  }
}

const toggleOption = (label: string) => {
  if (showAnswer.value) return
  if (currentQuestion.value.questionType === 'single_choice') {
    selectedOptions.value = [label]
    return
  }

  selectedOptions.value = selectedOptions.value.includes(label)
    ? selectedOptions.value.filter(item => item !== label)
    : [...selectedOptions.value, label]
}

const submitCurrentAnswer = () => {
  const question = currentQuestion.value
  const answer = currentOptions.value.length ? selectedOptions.value.join('、') : textAnswer.value.trim()

  if (!answer) {
    ElMessage.warning('请先作答')
    return
  }

  answers.value = {
    ...answers.value,
    [question.id]: answer
  }
  showAnswer.value = true
}

const goQuestion = (index: number) => {
  currentIndex.value = index
  resetCurrentAnswer()
}

const goNext = () => {
  if (currentIndex.value === questions.value.length - 1) {
    ElMessage.success('本次测评已完成')
    router.push('/exam')
    return
  }

  goQuestion(currentIndex.value + 1)
}

watch(currentIndex, resetCurrentAnswer)
onMounted(fetchQuestions)
</script>

<style scoped>
.exam-session-page {
  max-width: 1180px;
  margin: 0 auto;
}

.session-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.back-button {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  background: white;
  color: var(--text-secondary);
  padding: 8px 14px;
  cursor: pointer;
}

.session-header h1 {
  margin: 0 0 4px;
  font-size: 1.375rem;
  color: var(--text-dark);
}

.session-header p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.session-layout {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: var(--spacing-xl);
}

.question-nav {
  display: grid;
  grid-template-columns: repeat(2, 36px);
  align-content: start;
  gap: var(--spacing-sm);
}

.question-nav button {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: white;
  color: var(--text-secondary);
  cursor: pointer;
}

.question-nav button.active {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.question-nav button.answered {
  background: rgba(18, 184, 134, 0.1);
  border-color: rgba(18, 184, 134, 0.2);
  color: var(--accent-color);
}

.question-panel,
.empty-panel {
  background: white;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
}

.empty-panel {
  color: var(--text-muted);
  text-align: center;
}

.question-topline {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.question-topline span {
  padding: 3px 10px;
  border-radius: var(--radius-full);
  background: #f8fafc;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
}

.question-panel h2 {
  margin: 0 0 var(--spacing-xl);
  color: var(--text-dark);
  font-size: 1.125rem;
  line-height: 1.7;
}

.option-list,
.judge-list {
  display: grid;
  gap: var(--spacing-md);
}

.option-button,
.judge-list button {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  width: 100%;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  background: #f8fafc;
  padding: var(--spacing-md);
  text-align: left;
  cursor: pointer;
}

.option-button span {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: white;
  color: var(--primary-color);
  font-weight: 700;
}

.option-button strong {
  color: var(--text-dark);
  font-size: 0.9375rem;
  font-weight: 600;
}

.option-button.selected,
.judge-list button.selected {
  border-color: var(--primary-color);
  background: rgba(11, 183, 170, 0.06);
}

.answer-panel {
  margin-top: var(--spacing-xl);
  border: 1px solid rgba(18, 184, 134, 0.18);
  border-radius: var(--radius-lg);
  background: rgba(18, 184, 134, 0.06);
  padding: var(--spacing-lg);
}

.answer-panel span {
  display: block;
  margin-bottom: 4px;
  color: var(--accent-color);
  font-size: 0.75rem;
  font-weight: 700;
}

.answer-panel strong {
  color: var(--text-dark);
  line-height: 1.6;
}

.answer-panel p {
  margin: var(--spacing-md) 0 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.session-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xl);
}

@media (max-width: 800px) {
  .session-layout {
    grid-template-columns: 1fr;
  }

  .question-nav {
    display: flex;
    flex-wrap: wrap;
  }
}
</style>
