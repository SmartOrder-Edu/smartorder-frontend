<template>
  <AppLayout>
    <div class="study-execution-page">
      <!-- Top Nav -->
      <div class="study-nav">
        <button class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          返回
        </button>
        <div class="breadcrumb">
          <span>学习空间</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
            <polyline points="9,18 15,12 9,6" />
          </svg>
          <span class="current">学习执行</span>
        </div>
      </div>

      <!-- Three-column layout -->
      <div class="study-container">
        <!-- Left: Steps -->
        <aside class="study-sidebar">
          <div class="sidebar-header">
            <h3>任务步骤</h3>
            <div class="progress-mini">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
              </div>
              <span>{{ stepStore.completedSteps }}/{{ stepStore.steps.length }} 步</span>
            </div>
          </div>

          <div class="steps-list" v-if="stepStore.steps.length">
            <div v-for="(step, index) in stepStore.steps" :key="step.id" class="step-item" :class="{
              active: stepStore.currentStepIndex === index,
              completed: step.status === 'completed',
              skipped: step.status === 'skipped',
            }" @click="stepStore.goToStep(index)">
              <div class="step-indicator">
                <div class="step-dot">
                  <svg v-if="step.status === 'completed'" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="3" width="14" height="14">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <div class="step-line" v-if="index < stepStore.steps.length - 1"></div>
              </div>
              <div class="step-info">
                <span class="step-title">{{ step.title }}</span>
                <span class="step-type-badge" :class="step.stepType">{{ stepTypeLabel(step.stepType) }}</span>
                <span class="step-estimate">{{ step.estimatedMinutes }}分钟</span>
              </div>
            </div>
          </div>
          <div v-else class="steps-empty">加载步骤中...</div>

          <div class="sidebar-footer">
            <div class="summary-stat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
              <span>预计 {{ stepStore.totalEstimatedMinutes }} 分钟</span>
            </div>
          </div>
        </aside>

        <!-- Center: Content -->
        <main class="study-main">
          <div class="content-card" v-if="stepStore.currentStep">
            <div class="content-header">
              <span class="content-badge" :class="stepStore.currentStep.stepType">
                {{ stepTypeLabel(stepStore.currentStep.stepType) }}
              </span>
              <h2>{{ stepStore.currentStep.title }}</h2>
              <p v-if="stepStore.currentStep.description" class="content-desc">
                {{ stepStore.currentStep.description }}
              </p>
            </div>

            <div class="content-body">
              <!-- Render markdown-style content -->
              <div class="markdown-content" v-html="renderContent(stepStore.currentStep.content)"></div>
            </div>

            <!-- Navigation -->
            <div class="content-nav">
              <el-button :disabled="stepStore.currentStepIndex === 0" @click="stepStore.prevStep()">
                ← 上一步
              </el-button>
              <span class="nav-position">
                {{ stepStore.currentStepIndex + 1 }} / {{ stepStore.steps.length }}
              </span>
              <el-button type="primary" v-if="stepStore.currentStepIndex < stepStore.steps.length - 1"
                @click="stepStore.nextStep()">
                下一步 →
              </el-button>
              <el-button v-else type="success" @click="handleFinish" :loading="finishing">
                完成学习
              </el-button>
            </div>
          </div>
          <el-empty v-else description="暂无内容" :image-size="80" />
        </main>

        <!-- Right: Agent Companion -->
        <StudyAgentPanel :hint="agentHint" :loading-complete="finishing" @feedback="handleFeedback"
          @send-message="handleAgentMessage" @complete="handleFinish" />
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import StudyAgentPanel from '@/components/StudyAgentPanel.vue'
import { useTaskStepStore } from '@/stores/taskStep'
import { useSpaceDashboardStore } from '@/stores/spaceDashboard'

const route = useRoute()
const router = useRouter()
const stepStore = useTaskStepStore()
const dashStore = useSpaceDashboardStore()

const finishing = ref(false)

const taskId = computed(() => Number(route.params.taskId))

const difficultyLevel = computed(() => {
  const levels = ['入门', '基础', '适中', '提高', '挑战']
  return levels[difficultyValue.value - 1]
})

const difficultyDescriptions = [
  '详细讲解，简化概念，多用类比和图示',
  '正常讲解，配合示例，帮助理解基础概念',
  '标准讲解，结合实例，强调重点和难点',
  '精简讲解，侧重应用，引入进阶概念',
  '快速讲解，大量练习，直接挑战高难度问题'
]

const difficultyMarks = {
  1: '入门',
  2: '基础',
  3: '适中',
  4: '提高',
  5: '挑战'
}

const task = ref({
  id: route.params.taskId || 1,
  title: '进程与线程的核心概念',
  minutes: 15
})

const steps = ref([
  {
    id: 1, title: '阅读概念讲解', type: 'review', typeName: '复习', done: true,
    reason: '系统检测到你对"进程"概念理解不够深入',
    content: { definition: '进程是程序的一次执行实例，是操作系统资源分配和调度的基本单位。', features: ['动态性', '并发性', '独立性', '异步性'] }
  },
  {
    id: 2, title: '完成同步互斥练习题', type: 'practice', typeName: '练习', done: false,
    reason: '你的 PV 操作正确率上周下降了 15%，需要专项练习',
    questions: [
      { text: 'PV 操作用于解决什么问题？', options: ['文件管理', '进程同步与互斥', '内存分配', '设备管理'], answer: 1, explanation: 'PV 操作是 Dijkstra 提出的用于解决进程同步与互斥问题的经典方法。' },
      { text: '当信号量 S > 0 时，表示？', options: ['有 S 个资源可用', '有 S 个进程在等待', '临界区已加锁', '临界区已解锁'], answer: 0, explanation: '信号量 S 的值表示当前可用资源的数量。' },
      { text: 'P 操作的本质是？', options: ['申请一个资源', '释放一个资源', '创建新进程', '终止进程'], answer: 0, explanation: 'P 操作（wait）将信号量减 1，如果小于 0 则阻塞。' },
      { text: 'V 操作的本质是？', options: ['申请一个资源', '释放一个资源', '创建新进程', '终止进程'], answer: 1, explanation: 'V 操作（signal）将信号量加 1，如果小于等于 0 则唤醒等待队列中的进程。' },
      { text: '二值信号量的取值范围是？', options: ['0 ~ 1', '-1 ~ 0', '0 ~ N', '1 ~ N'], answer: 0, explanation: '二值信号量（互斥锁）只有 0 和 1 两个取值，用于实现互斥。' }
    ]
  },
  {
    id: 3, title: '查看信号量图解讲义', type: 'resource', typeName: '资源', done: false,
    reason: '你偏好可视化学习方式，系统优先推荐图解资源'
  }
])

const currentQuestion = ref(0)
const currentStepData = computed(() => steps.value[currentStep.value])

const completedSteps = computed(() => steps.value.filter(s => s.done).length)

const isCorrect = computed(() => {
  const qs = currentStepData.value.questions
  if (!qs) return false
  return selectedAnswer.value === qs[currentQuestion.value]?.answer
})

const aiMessages = ref([
  { role: 'ai', content: '当前学习内容：进程与线程的核心概念。如果有任何不懂的地方，随时问我。' }
])

const quickActions = [
  { id: 1, label: '举一个生活中的例子' },
  { id: 2, label: '生成对比表格' },
  { id: 3, label: '解释专业术语' },
  { id: 4, label: '推荐相关视频' }
]

const selectAnswer = (idx: number) => {
  selectedAnswer.value = idx
}

const submitAnswer = () => {
  showResult.value = true
}

const nextQuestion = () => {
  if (currentQuestion.value < (currentStepData.value.questions?.length || 5) - 1) {
    currentQuestion.value++
    selectedAnswer.value = null
    showResult.value = false
  }
}

const markComplete = () => {
  steps.value[currentStep.value].done = true
  if (currentStep.value < steps.value.length - 1) {
    currentStep.value++
  }
}

const applyDifficulty = () => {
  showAdjustDialog.value = false
}

const handleAIAction = (action: any) => {
  aiMessages.value.push({ role: 'ai', content: `好的，我来帮你${action.label}...` })
}

const sendAI = () => {
  if (!aiInput.value.trim()) return
  aiMessages.value.push({ role: 'user', content: aiInput.value })
  aiMessages.value.push({ role: 'ai', content: '让我结合你的学习进度为你详细解答...' })
  aiInput.value = ''
}

const showNodeDetail = (node: string) => { }
</script>

<style scoped lang="scss">
.study-execution-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ========== Nav ========== */
.study-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
  font-size: 0.8125rem;
  color: #6b7280;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
    color: #374151;
  }
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  color: #9ca3af;

  .current {
    color: #374151;
    font-weight: 500;
  }
}

/* ========== Container ========== */
.study-container {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

/* ========== Left Sidebar ========== */
.study-sidebar {
  width: 240px;
  background: white;
  border-radius: 14px;
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: sticky;
  top: 100px;

  @media (max-width: 1024px) {
    width: 100%;
    position: static;
  }
}

.sidebar-header {
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f3f4f6;

  h3 {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0 0 8px;
  }
}

.progress-mini {
  display: flex;
  align-items: center;
  gap: 10px;

  span {
    font-size: 0.6875rem;
    color: #9ca3af;
    white-space: nowrap;
  }
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: #f3f4f6;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.steps-list {
  padding: 8px 0;
  display: flex;
  flex-direction: column;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.1s;

  &:hover {
    background: #f9fafb;
  }

  &.active {
    background: #eff6ff;

    .step-dot {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }
  }

  &.completed {
    .step-dot {
      background: #10b981;
      border-color: #10b981;
      color: white;
    }

    .step-line {
      background: #10b981;
    }
  }

  &.skipped {
    opacity: 0.5;
  }
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.step-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #9ca3af;
  background: white;
}

.step-line {
  width: 2px;
  flex: 1;
  min-height: 12px;
  background: #e5e7eb;
}

.step-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding-bottom: 8px;
}

.step-title {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;

  .step-item.active & {
    color: #1a1a2e;
    font-weight: 600;
  }
}

.step-type-badge {
  font-size: 0.625rem;
  padding: 0 6px;
  border-radius: 99px;
  align-self: flex-start;

  &.learn {
    background: #eff6ff;
    color: #3b82f6;
  }

  &.practice {
    background: #fef3c7;
    color: #d97706;
  }

  &.review {
    background: #ede9fe;
    color: #7c3aed;
  }

  &.rest {
    background: #ecfdf5;
    color: #10b981;
  }
}

.step-estimate {
  font-size: 0.6875rem;
  color: #9ca3af;
}

.steps-empty {
  padding: 24px;
  text-align: center;
  color: #9ca3af;
  font-size: 0.8125rem;
}

.sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid #f3f4f6;
}

.summary-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  color: #6b7280;
}

/* ========== Center Content ========== */
.study-main {
  flex: 1;
  min-width: 0;
}

.content-card {
  background: white;
  border-radius: 14px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
}

.content-header {
  padding: 20px 24px 0;
}

.content-badge {
  font-size: 0.6875rem;
  padding: 2px 10px;
  border-radius: 99px;

  &.learn {
    background: #eff6ff;
    color: #3b82f6;
  }

  &.practice {
    background: #fef3c7;
    color: #d97706;
  }

  &.review {
    background: #ede9fe;
    color: #7c3aed;
  }

  &.rest {
    background: #ecfdf5;
    color: #10b981;
  }
}

.content-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 8px 0 4px;
}

.content-desc {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0 0 8px;
}

.content-body {
  padding: 16px 24px;
}

.markdown-content {
  font-size: 0.9375rem;
  color: #374151;
  line-height: 1.8;

  :deep(h2) {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1a1a2e;
    margin: 20px 0 10px;
  }

  :deep(h3) {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1a1a2e;
    margin: 16px 0 8px;
  }

  :deep(h4) {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 12px 0 6px;
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid #f0f0f0;
    margin: 16px 0;
  }

  :deep(strong) {
    color: #1a1a2e;
  }

  :deep(ul) {
    padding-left: 20px;
  }

  :deep(li) {
    margin: 4px 0;
  }

  :deep(.math-block) {
    display: block;
    padding: 10px 16px;
    background: #f9fafb;
    border-radius: 8px;
    margin: 10px 0;
    font-style: italic;
  }

  :deep(.math-inline) {
    font-style: italic;
    background: #f9fafb;
    padding: 1px 4px;
    border-radius: 4px;
  }

  :deep(details) {
    margin: 10px 0;
  }

  :deep(summary) {
    cursor: pointer;
    color: #3b82f6;
    font-weight: 500;
  }

  :deep(table) {
    border-collapse: collapse;
    margin: 10px 0;
    width: 100%;
  }

  :deep(th),
  :deep(td) {
    border: 1px solid #e5e7eb;
    padding: 8px 12px;
    text-align: left;
    font-size: 0.875rem;
  }

  :deep(th) {
    background: #f9fafb;
    font-weight: 600;
  }

  :deep(pre) {
    background: #1e1e2e;
    color: #e5e7eb;
    padding: 12px 16px;
    border-radius: 10px;
    overflow-x: auto;
    font-size: 0.8125rem;
    line-height: 1.6;
  }

  :deep(code) {
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.875rem;
  }

  :deep(pre code) {
    background: none;
    padding: 0;
  }
}

.content-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid #f3f4f6;
}

.nav-position {
  font-size: 0.8125rem;
  color: #9ca3af;
}
</style>
