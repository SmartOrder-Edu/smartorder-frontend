<template>
  <AppLayout>
    <div class="study-execution-page">
      <!-- Top Nav -->
      <div class="study-nav">
        <button class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
          返回
        </button>
        <div class="breadcrumb">
          <span>学习空间</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="9,18 15,12 9,6"/></svg>
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
            <div
              v-for="(step, index) in stepStore.steps"
              :key="step.id"
              class="step-item"
              :class="{
                active: stepStore.currentStepIndex === index,
                completed: step.status === 'completed',
                skipped: step.status === 'skipped',
              }"
              @click="stepStore.goToStep(index)"
            >
              <div class="step-indicator">
                <div class="step-dot">
                  <svg v-if="step.status === 'completed'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14">
                    <polyline points="20,6 9,17 4,12"/>
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
                <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
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
              <el-button
                :disabled="stepStore.currentStepIndex === 0"
                @click="stepStore.prevStep()"
              >
                ← 上一步
              </el-button>
              <span class="nav-position">
                {{ stepStore.currentStepIndex + 1 }} / {{ stepStore.steps.length }}
              </span>
              <el-button
                type="primary"
                v-if="stepStore.currentStepIndex < stepStore.steps.length - 1"
                @click="stepStore.nextStep()"
              >
                下一步 →
              </el-button>
              <el-button
                v-else
                type="success"
                @click="handleFinish"
                :loading="finishing"
              >
                完成学习
              </el-button>
            </div>
          </div>
          <el-empty v-else description="暂无内容" :image-size="80" />
        </main>

        <!-- Right: Agent Companion -->
        <StudyAgentPanel
          :hint="agentHint"
          :loading-complete="finishing"
          @feedback="handleFeedback"
          @send-message="handleAgentMessage"
          @complete="handleFinish"
        />
      </div>
<<<<<<< HEAD

      <!-- 调整难度对话框 -->
      <el-dialog v-model="showAdjustDialog" title="调整学习难度" width="400px">
        <div class="adjust-difficulty">
          <p class="adjust-label">当前难度：<strong>{{ difficultyLevel }}</strong></p>
          <el-slider v-model="difficultyValue" :min="1" :max="10" :marks="difficultyMarks" />
          <div class="difficulty-desc">
            {{ difficultyDescriptions[difficultyValue - 1] }}
          </div>
        </div>
        <template #footer>
          <el-button @click="showAdjustDialog = false">取消</el-button>
          <el-button type="primary" @click="applyDifficulty">应用</el-button>
        </template>
      </el-dialog>

      <!-- 为什么是这个任务对话框 -->
      <el-dialog v-model="showWhyDialog" title="为什么是这些任务" width="500px">
        <div class="why-content">
          <p>根据你的学习画像分析，系统为你安排这些任务的原因如下：</p>
          <div class="why-reasons">
            <div class="reason-item">
              <span class="reason-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </span>
              <div class="reason-text">
                <strong>测评数据分析</strong>
                <p>你在上周的"进程同步"测验中正确率仅为 50%，低于平均水平 30 个百分点。</p>
              </div>
            </div>
            <div class="reason-item">
              <span class="reason-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <path d="M12 2a8 8 0 0 1 8 8c0 3-2 5-4 7-1 1-2 3-2 5H8c0-2-1-4-2-5-2-2-4-4-4-7a8 8 0 0 1 8-8z"/>
                  <path d="M9 22h6"/>
                  <path d="M12 18v4"/>
                </svg>
              </span>
              <div class="reason-text">
                <strong>学习偏好匹配</strong>
                <p>系统分析你的学习记录，发现你更偏好图解和动画形式的学习资源。</p>
              </div>
            </div>
            <div class="reason-item">
              <span class="reason-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </span>
              <div class="reason-text">
                <strong>知识图谱依赖</strong>
                <p>线程同步是学习"死锁"章节的前置知识，需要优先掌握。</p>
              </div>
            </div>
            <div class="reason-item">
              <span class="reason-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="6"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
              </span>
              <div class="reason-text">
                <strong>目标关联性</strong>
                <p>你的期末目标包含"操作系统期末复习"，当前章节是复习重点之一。</p>
              </div>
            </div>
          </div>
        </div>
      </el-dialog>
=======
>>>>>>> origin/main
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

<<<<<<< HEAD
const currentStep = ref(0)
const selectedAnswer = ref<number | null>(null)
const showResult = ref(false)
const showAdjustDialog = ref(false)
const showWhyDialog = ref(false)
const difficultyValue = ref(5)
const aiInput = ref('')
const understandingLevel = ref(65)

const difficultyLevel = computed(() => {
  const levels = ['识记', '简单识别', '概念理解', '基础应用', '综合应用', '典型分析', '进阶分析', '综合设计', '迁移推理', '深层综合']
  return levels[difficultyValue.value - 1]
})

const difficultyDescriptions = [
  '回忆基本知识点，详细讲解基础概念',
  '识别基础概念，配合简单示例说明',
  '理解核心原理，正常节奏讲解',
  '简单场景应用，结合实例练习',
  '多知识点融合，标准讲解重点难点',
  '分析典型问题，精简讲解侧重要点',
  '深入分析推理，引入进阶概念',
  '设计解决方案，强调综合能力',
  '跨领域推理，快速节奏高要求',
  '高阶思维综合，挑战极限深度'
]

const difficultyMarks = {
  1: '1',
  3: '3',
  5: '5',
  7: '7',
  10: '10'
}

const task = ref({
  id: route.params.taskId || 1,
  title: '进程与线程的核心概念',
  minutes: 15
=======
const finishing = ref(false)

const taskId = computed(() => Number(route.params.taskId))

const progressPercent = computed(() => {
  if (!stepStore.steps.length) return 0
  return Math.round(stepStore.completedSteps / stepStore.steps.length * 100)
})

const agentHint = computed(() => {
  const step = stepStore.currentStep
  if (!step) return ''
  if (step.stepType === 'practice') return '练习模式：遇到问题随时问我，或点击下方按钮'
  if (step.stepType === 'review') return '复习模式：快速回顾知识点，标记需要加强的部分'
  return '学习模式：用心理解每个概念，有问题随时提问'
>>>>>>> origin/main
})

function stepTypeLabel(t: string) {
  const m: Record<string, string> = { learn: '学习', practice: '练习', review: '复习', rest: '休息' }
  return m[t] || t
}

function renderContent(markdown: string): string {
  if (!markdown) return ''
  // Simple markdown-to-HTML conversion
  return markdown
    .replace(/### (.+)/g, '<h4>$1</h4>')
    .replace(/## (.+)/g, '<h3>$1</h3>')
    .replace(/# (.+)/g, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n- (.+)/g, '\n<li>$1</li>')
    .replace(/<li>.*<\/li>\n<li>/gs, (m: string) => '<ul>' + m + '</ul>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/---/g, '<hr/>')
    .replace(/\$\$([^$]+)\$\$/g, '<div class="math-block">$1</div>')
    .replace(/\$([^$]+)\$/g, '<span class="math-inline">$1</span>')
    .replace(/\n/g, '<br/>')
}

function handleFeedback(label: string) {
  ElMessage.success(`已触发：${label}`)
  // TODO: post to Agent with the current step context
}

function handleAgentMessage(text: string) {
  console.log('Study agent message:', text)
}

function handleFinish() {
  finishing.value = true
  setTimeout(() => {
    // Navigate back to space detail
    router.back()
    ElMessage.success('学习任务已完成！')
    finishing.value = false
  }, 800)
}

onMounted(async () => {
  const id = taskId.value
  if (id && !isNaN(id)) {
    await stepStore.fetchSteps(id)
  }
})
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
  &:hover { background: #f9fafb; color: #374151; }
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  color: #9ca3af;

  .current { color: #374151; font-weight: 500; }
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

  @media (max-width: 1024px) { width: 100%; position: static; }
}

.sidebar-header {
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f3f4f6;

  h3 { font-size: 0.9375rem; font-weight: 600; color: #1a1a2e; margin: 0 0 8px; }
}

.progress-mini {
  display: flex;
  align-items: center;
  gap: 10px;

  span { font-size: 0.6875rem; color: #9ca3af; white-space: nowrap; }
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
  &:hover { background: #f9fafb; }

  &.active {
    background: #eff6ff;
    .step-dot { background: #3b82f6; border-color: #3b82f6; color: white; }
  }
  &.completed {
    .step-dot { background: #10b981; border-color: #10b981; color: white; }
    .step-line { background: #10b981; }
  }
  &.skipped { opacity: 0.5; }
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.step-dot {
  width: 24px; height: 24px;
  border-radius: 50%;
  border: 2px solid #e5e7eb;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.6875rem; font-weight: 600;
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
  font-size: 0.8125rem; font-weight: 500; color: #374151;
  .step-item.active & { color: #1a1a2e; font-weight: 600; }
}

.step-type-badge {
  font-size: 0.625rem; padding: 0 6px; border-radius: 99px;
  align-self: flex-start;
  &.learn { background: #eff6ff; color: #3b82f6; }
  &.practice { background: #fef3c7; color: #d97706; }
  &.review { background: #ede9fe; color: #7c3aed; }
  &.rest { background: #ecfdf5; color: #10b981; }
}

.step-estimate { font-size: 0.6875rem; color: #9ca3af; }

.steps-empty { padding: 24px; text-align: center; color: #9ca3af; font-size: 0.8125rem; }

.sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid #f3f4f6;
}

.summary-stat {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.8125rem; color: #6b7280;
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
  font-size: 0.6875rem; padding: 2px 10px; border-radius: 99px;
  &.learn { background: #eff6ff; color: #3b82f6; }
  &.practice { background: #fef3c7; color: #d97706; }
  &.review { background: #ede9fe; color: #7c3aed; }
  &.rest { background: #ecfdf5; color: #10b981; }
}

.content-header h2 {
  font-size: 1.25rem; font-weight: 700; color: #1a1a2e; margin: 8px 0 4px;
}

.content-desc {
  font-size: 0.8125rem; color: #6b7280; margin: 0 0 8px;
}

.content-body {
  padding: 16px 24px;
}

.markdown-content {
  font-size: 0.9375rem;
  color: #374151;
  line-height: 1.8;

  :deep(h2) { font-size: 1.25rem; font-weight: 700; color: #1a1a2e; margin: 20px 0 10px; }
  :deep(h3) { font-size: 1.1rem; font-weight: 600; color: #1a1a2e; margin: 16px 0 8px; }
  :deep(h4) { font-size: 1rem; font-weight: 600; color: #374151; margin: 12px 0 6px; }
  :deep(hr) { border: none; border-top: 1px solid #f0f0f0; margin: 16px 0; }
  :deep(strong) { color: #1a1a2e; }
  :deep(ul) { padding-left: 20px; }
  :deep(li) { margin: 4px 0; }
  :deep(.math-block) { display: block; padding: 10px 16px; background: #f9fafb; border-radius: 8px; margin: 10px 0; font-style: italic; }
  :deep(.math-inline) { font-style: italic; background: #f9fafb; padding: 1px 4px; border-radius: 4px; }
  :deep(details) { margin: 10px 0; }
  :deep(summary) { cursor: pointer; color: #3b82f6; font-weight: 500; }
  :deep(table) { border-collapse: collapse; margin: 10px 0; width: 100%; }
  :deep(th), :deep(td) { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; font-size: 0.875rem; }
  :deep(th) { background: #f9fafb; font-weight: 600; }
  :deep(pre) { background: #1e1e2e; color: #e5e7eb; padding: 12px 16px; border-radius: 10px; overflow-x: auto; font-size: 0.8125rem; line-height: 1.6; }
  :deep(code) { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 0.875rem; }
  :deep(pre code) { background: none; padding: 0; }
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
