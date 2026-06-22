<template>
  <AppLayout>
    <div class="exam-page">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">测评中心</h1>
          <p class="page-desc">阶段性测评、专项测试、错题复习，追踪你的学习效果</p>
        </div>
        <div class="header-right">
          <el-button @click="showGenerateDialog = true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              width="16"
              height="16"
            >
              <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
            </svg>
            AI 生成测评
          </el-button>
        </div>
      </div>

      <!-- 测评总览 -->
      <section class="section overview-cards">
        <div class="overview-stat">
          <div class="stat-circle" :style="{ '--percent': overallScore + '%' }">
            <svg viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="var(--border-light)"
                stroke-width="8"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="url(#scoreGrad)"
                stroke-width="8"
                stroke-linecap="round"
                :stroke-dasharray="`${overallScore * 3.27} 327`"
                transform="rotate(-90 60 60)"
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color: #3b5bdb" />
                  <stop offset="100%" style="stop-color: #12b886" />
                </linearGradient>
              </defs>
            </svg>
            <div class="stat-inner">
              <span class="stat-score">{{ overallScore }}</span>
              <span class="stat-label">总体评分</span>
            </div>
          </div>
        </div>

        <div class="overview-details">
          <div class="detail-item">
            <div class="detail-header">
              <span class="detail-label">本周测评次数</span>
              <span class="detail-value primary">{{ weeklyCount }} 次</span>
            </div>
            <div class="detail-bar">
              <div class="bar-fill" style="width: 70%"></div>
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-header">
              <span class="detail-label">本周平均正确率</span>
              <span class="detail-value accent">{{ weeklyAccuracy }}%</span>
            </div>
            <div class="detail-bar accent">
              <div class="bar-fill" :style="{ width: weeklyAccuracy + '%' }"></div>
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-header">
              <span class="detail-label">薄弱知识点</span>
              <span class="detail-value warning">{{ weakCount }} 个</span>
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-header">
              <span class="detail-label">本周进步</span>
              <span class="detail-value success">+{{ weeklyProgress }}%</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 测评分类 -->
      <div class="exam-tabs">
        <span
          v-for="tab in examTabs"
          :key="tab.value"
          class="tab-item"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value"
        >
          <span class="tab-icon" v-html="tab.icon"></span>
          {{ tab.label }}
          <span class="tab-count" v-if="tab.count">{{ tab.count }}</span>
        </span>
      </div>

      <!-- 测评列表 -->
      <section class="section exam-list-section">
        <div class="section-title-row">
          <div>
            <h2>题库数据</h2>
            <p>先展示后端已保存的测评题目，方便前后端联调。</p>
          </div>
          <el-button :loading="questionBankLoading" @click="fetchQuestionBank">刷新</el-button>
        </div>

        <div v-if="questionBank.length" class="question-bank-list">
          <article v-for="question in questionBank" :key="question.id" class="question-bank-card">
            <div class="question-bank-meta">
              <span>{{ question.questionTypeName || getQuestionTypeLabel(question.questionType) }}</span>
              <span>难度 {{ question.difficulty || '-' }}</span>
              <span>{{ question.score || 0 }} 分</span>
            </div>
            <h3>{{ question.stem }}</h3>
            <p v-if="question.explanation">{{ question.explanation }}</p>
            <div v-if="question.tagsJson?.length" class="question-tags">
              <span v-for="tag in question.tagsJson" :key="tag">{{ tag }}</span>
            </div>
          </article>
        </div>
        <div v-else class="question-bank-empty">
          {{ questionBankLoading ? '正在加载题库数据...' : '暂无后端题库数据，生成一次测评后再刷新试试。' }}
        </div>

        <div class="exam-list">
          <!-- 进行中 -->
          <div v-if="activeTab === 'ongoing' && ongoingExam" class="exam-card ongoing">
            <div class="exam-status-bar">
              <span class="status-badge ongoing">进行中</span>
              <span class="time-left">剩余 {{ ongoingExam.timeLeft }} 分钟</span>
            </div>
            <div class="exam-info">
              <h3 class="exam-title">{{ ongoingExam.title }}</h3>
              <p class="exam-desc">{{ ongoingExam.description }}</p>
              <div class="exam-meta">
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  {{ ongoingExam.total }} 题
                </span>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                  {{ ongoingExam.duration }} 分钟
                </span>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  {{ ongoingExam.attempted }}/{{ ongoingExam.total }} 已答
                </span>
              </div>
              <div class="exam-progress-bar">
                <div
                  class="bar-fill"
                  :style="{ width: (ongoingExam.attempted / ongoingExam.total) * 100 + '%' }"
                ></div>
              </div>
            </div>
            <div class="exam-actions">
              <el-button type="primary" @click="$router.push('/study/exam-' + ongoingExam.id)">
                继续测评
              </el-button>
            </div>
          </div>

          <!-- 测评卡片 -->
          <div
            v-for="exam in filteredExams"
            :key="exam.id"
            class="exam-card"
            :class="{ 'has-result': exam.hasResult }"
          >
            <div class="exam-status-bar">
              <span class="status-badge" :class="exam.status">{{ exam.statusText }}</span>
              <span v-if="exam.hasResult" class="result-score" :class="getScoreClass(exam.score)">
                {{ exam.score }}分
              </span>
            </div>

            <div class="exam-info">
              <h3 class="exam-title">{{ exam.title }}</h3>
              <p class="exam-desc">{{ exam.description }}</p>
              <div class="exam-meta">
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  {{ exam.total }} 题
                </span>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                  {{ exam.duration }} 分钟
                </span>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                  </svg>
                  {{ exam.accuracy }}% 正确率
                </span>
              </div>

              <!-- 结果展示 -->
              <div v-if="exam.hasResult" class="result-detail">
                <div class="result-chart">
                  <div class="chart-bar-group">
                    <div class="chart-bar correct" :style="{ height: exam.accuracy + '%' }"></div>
                    <div
                      class="chart-bar wrong"
                      :style="{ height: 100 - exam.accuracy + '%' }"
                    ></div>
                  </div>
                  <span class="chart-label">{{ exam.accuracy }}%</span>
                </div>
                <div class="result-tags">
                  <span v-if="exam.wrongCount > 0" class="wrong-tag">
                    错题 {{ exam.wrongCount }} 道
                    <span class="review-link" @click="reviewWrong(exam)">去复习</span>
                  </span>
                  <span class="weak-tag"> 薄弱：{{ exam.weakPoints.join('、') }} </span>
                </div>
              </div>
            </div>

            <div class="exam-actions">
              <template v-if="exam.hasResult">
                <el-button @click="reviewWrong(exam)">回顾</el-button>
                <el-button type="primary" @click="retakeExam(exam)">重新测评</el-button>
              </template>
              <template v-else>
                <el-button type="primary" @click="startExam(exam)">开始测评</el-button>
              </template>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div class="empty-state" v-if="filteredExams.length === 0">
          <div class="empty-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              width="48"
              height="48"
            >
              <path
                d="M9 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4"
              />
              <rect x="9" y="9" width="6" height="6" rx="1" />
              <line x1="9" y1="13" x2="13" y2="13" />
              <line x1="9" y1="15" x2="11" y2="15" />
            </svg>
          </div>
          <h3>暂无测评</h3>
          <p>点击"AI 生成测评"获取个性化测试</p>
        </div>
      </section>

      <!-- AI 生成测评对话框 -->
      <el-dialog
        v-model="showGenerateDialog"
        title="生成题库"
        width="720px"
        class="question-generate-dialog"
      >
        <div class="generate-layout">
          <div class="generate-form">
            <div class="form-grid">
              <div class="form-item">
                <label>学习空间</label>
                <el-select
                  v-model="selectedSpaceId"
                  filterable
                  placeholder="选择学习空间"
                  style="width: 100%"
                  :loading="learningSpaceStore.loading"
                >
                  <el-option
                    v-for="space in learningSpaceStore.activeSpaces"
                    :key="space.id"
                    :label="space.name"
                    :value="space.id"
                  />
                </el-select>
              </div>
              <div class="form-item">
                <label>课程名称</label>
                <el-input v-model="generateCourseName" placeholder="例如：操作系统" />
              </div>
            </div>

            <div class="form-item">
              <label>出题主题</label>
              <el-input v-model="generateTopic" placeholder="例如：PV 操作与信号量" />
            </div>

            <div class="form-item">
              <div class="field-heading">
                <label>题型与题量</label>
                <span>{{ totalGenerateCount }} 题</span>
              </div>
              <div class="question-type-list">
                <div
                  v-for="row in questionTypeRows"
                  :key="row.questionType"
                  class="question-type-row"
                >
                  <el-switch v-model="row.enabled" />
                  <div class="type-copy">
                    <strong>{{ row.label }}</strong>
                    <span>{{ row.description }}</span>
                  </div>
                  <el-input-number
                    v-model="row.count"
                    :min="1"
                    :max="10"
                    :disabled="!row.enabled"
                    controls-position="right"
                  />
                </div>
              </div>
            </div>

            <div class="form-item">
              <label>难度级别</label>
              <el-slider v-model="generateDifficulty" :min="1" :max="10" />
              <div class="difficulty-tip">
                当前难度：<strong>{{ generateDifficulty }}</strong> - {{ generateDifficultyDesc }}
              </div>
            </div>
          </div>

          <aside class="generate-summary">
            <div class="summary-title">生成预览</div>
            <div class="summary-line">
              <span>空间</span>
              <strong>{{ selectedSpaceName || '未选择' }}</strong>
            </div>
            <div class="summary-line">
              <span>题量</span>
              <strong>{{ totalGenerateCount }} 题</strong>
            </div>
            <div class="summary-line">
              <span>预计</span>
              <strong>{{ estimatedMinutes }} 分钟</strong>
            </div>
            <div class="summary-mix">{{ generationMixText || '请选择题型' }}</div>

            <div
              v-if="generating || generationJobNo || generationError"
              class="generation-progress-card"
            >
              <div class="progress-head">
                <span>{{ generationStep }}</span>
                <strong>{{ generationProgress }}%</strong>
              </div>
              <el-progress :percentage="generationProgress" :stroke-width="8" :show-text="false" />
              <div v-if="generationJobNo" class="job-no">{{ generationJobNo }}</div>
              <div v-if="generationPreviewItems.length" class="token-preview-list">
                <div
                  v-for="item in generationPreviewItems"
                  :key="item.questionType"
                  class="token-preview-item"
                >
                  <div class="token-preview-meta">
                    <span>{{ item.label }}</span>
                    <small>{{ item.tokenCount }} 段</small>
                  </div>
                  <p>{{ item.text || '正在接收题目结构...' }}</p>
                </div>
              </div>
              <p v-if="generationError" class="generation-error">{{ generationError }}</p>
            </div>
          </aside>
        </div>
        <template #footer>
          <el-button v-if="generating" @click="stopGenerate">停止接收</el-button>
          <el-button v-else @click="showGenerateDialog = false">取消</el-button>
          <el-button
            type="primary"
            :loading="generating"
            :disabled="!canGenerate"
            @click="generateExam"
          >
            {{ generating ? '生成中...' : '开始生成' }}
          </el-button>
        </template>
      </el-dialog>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useLearningSpaceStore } from '@/stores/learningSpace'
import {
  fetchEvaluationQuestions,
  streamGenerateQuestions,
  type EvaluationQuestion,
  type GenerateQuestionPayload,
  type QuestionGenerationTokenEvent,
  type QuestionTypeCode
} from '@/api/evaluationQuestion'
import { formatQuestionStreamPreview } from '@/utils/questionStreamPreview'

interface QuestionTypeRow {
  questionType: QuestionTypeCode
  label: string
  description: string
  count: number
  enabled: boolean
  isChoice?: boolean
}

interface GenerationPreviewItem {
  questionType: QuestionTypeCode
  label: string
  text: string
  tokenCount: number
}

interface GenerationPreviewBuffer {
  raw: string
  tokenCount: number
}

const learningSpaceStore = useLearningSpaceStore()
const router = useRouter()
const activeTab = ref('available')
const showGenerateDialog = ref(false)
const generating = ref(false)
const selectedSpaceId = ref<number | null>(null)
const generateCourseName = ref('操作系统')
const generateTopic = ref('线程同步与互斥')
const generateDifficulty = ref(5)
const generationProgress = ref(0)
const generationStep = ref('等待生成')
const generationPreviewItems = ref<GenerationPreviewItem[]>([])
const generationPreviewBuffers = ref<Partial<Record<QuestionTypeCode, GenerationPreviewBuffer>>>(
  {}
)
const generationJobNo = ref('')
const generationTokenCount = ref(0)
const generationError = ref('')
const questionBank = ref<EvaluationQuestion[]>([])
const questionBankLoading = ref(false)
let generationAbortController: AbortController | null = null
const difficultyDescMap: Record<number, string> = {
  1: '识记 - 回忆基本知识点',
  2: '简单识别 - 识别基础概念',
  3: '概念理解 - 理解核心原理',
  4: '基础应用 - 简单场景应用',
  5: '综合应用 - 多知识点融合',
  6: '典型分析 - 分析典型问题',
  7: '进阶分析 - 深入分析推理',
  8: '综合设计 - 设计解决方案',
  9: '迁移推理 - 跨领域推理',
  10: '深层综合 - 高阶思维综合'
}
const generateDifficultyDesc = computed(() => difficultyDescMap[generateDifficulty.value] || '')
const questionTypeRows = ref<QuestionTypeRow[]>([
  {
    questionType: 'single_choice',
    label: '单选题',
    description: '适合快速检查概念和细节',
    count: 5,
    enabled: true,
    isChoice: true
  },
  {
    questionType: 'multiple_choice',
    label: '多选题',
    description: '适合区分易混知识点',
    count: 3,
    enabled: true,
    isChoice: true
  },
  {
    questionType: 'fill_blank',
    label: '填空题',
    description: '适合术语、公式和关键步骤',
    count: 2,
    enabled: true
  },
  {
    questionType: 'judge',
    label: '判断题',
    description: '适合高频误区诊断',
    count: 2,
    enabled: true
  },
  {
    questionType: 'short_answer',
    label: '简答题',
    description: '适合解释原理和过程',
    count: 2,
    enabled: false
  }
])

const selectedQuestionRows = computed(() =>
  questionTypeRows.value.filter(row => row.enabled && row.count > 0)
)
const totalGenerateCount = computed(() =>
  selectedQuestionRows.value.reduce((sum, row) => sum + row.count, 0)
)
const generationMixText = computed(() =>
  selectedQuestionRows.value.map(row => `${row.label} ${row.count}`).join(' / ')
)
const selectedSpaceName = computed(
  () =>
    learningSpaceStore.activeSpaces.find(space => space.id === selectedSpaceId.value)?.name || ''
)
const canGenerate = computed(
  () => !generating.value && !!selectedSpaceId.value && totalGenerateCount.value > 0
)
const estimatedMinutes = computed(() => Math.max(1, Math.ceil(totalGenerateCount.value / 4)))

const overallScore = ref(76)
const weeklyCount = ref(4)
const weeklyAccuracy = ref(72)
const weakCount = ref(5)
const weeklyProgress = ref(8)

const ongoingExam = ref({
  id: 100,
  title: '进程同步与互斥专项测评',
  description: '测试你对 PV 操作、信号量、临界区的理解程度',
  total: 15,
  attempted: 8,
  duration: 30,
  timeLeft: 18,
  status: 'ongoing'
})

const exams = ref([
  {
    id: 1,
    title: '进程管理综合测试',
    description: '涵盖进程概念、PCB、状态转换、进程创建与终止',
    total: 20,
    duration: 30,
    accuracy: 75,
    score: 75,
    hasResult: true,
    wrongCount: 5,
    weakPoints: ['进程创建', '状态转换'],
    status: 'completed',
    statusText: '已完成'
  },
  {
    id: 2,
    title: '线程与同步专项测评',
    description: '聚焦线程同步、互斥锁、信号量、条件变量',
    total: 15,
    duration: 25,
    accuracy: 52,
    score: 52,
    hasResult: true,
    wrongCount: 7,
    weakPoints: ['PV操作', '死锁检测'],
    status: 'completed',
    statusText: '已完成'
  },
  {
    id: 3,
    title: '内存管理阶段测试',
    description: '分页、分段、虚拟内存、页面置换算法',
    total: 15,
    duration: 30,
    accuracy: 0,
    score: 0,
    hasResult: false,
    wrongCount: 0,
    weakPoints: [],
    status: 'available',
    statusText: '可参与'
  },
  {
    id: 4,
    title: '文件系统章节测验',
    description: '文件组织、目录结构、文件系统实现',
    total: 12,
    duration: 20,
    accuracy: 0,
    score: 0,
    hasResult: false,
    wrongCount: 0,
    weakPoints: [],
    status: 'available',
    statusText: '可参与'
  },
  {
    id: 5,
    title: '操作系统期末模拟',
    description: '全章节综合测试，包含选择、填空、简答、计算',
    total: 30,
    duration: 60,
    accuracy: 0,
    score: 0,
    hasResult: false,
    wrongCount: 0,
    weakPoints: [],
    status: 'available',
    statusText: '可参与'
  }
])

const examTabs = computed(() => [
  {
    value: 'ongoing',
    label: '进行中',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>',
    count: ongoingExam.value ? 1 : 0
  },
  {
    value: 'available',
    label: '可参与',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>',
    count: exams.value.filter(exam => !exam.hasResult).length
  },
  {
    value: 'completed',
    label: '已完成',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>',
    count: exams.value.filter(exam => exam.hasResult).length
  },
  {
    value: 'wrong',
    label: '错题本',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    count: exams.value.reduce((sum, exam) => sum + exam.wrongCount, 0)
  }
])

const filteredExams = computed(() => {
  if (activeTab.value === 'ongoing') return []
  return exams.value.filter(e => {
    if (activeTab.value === 'available') return !e.hasResult
    if (activeTab.value === 'completed') return e.hasResult
    if (activeTab.value === 'wrong') return e.wrongCount > 0
    return true
  })
})

const getScoreClass = (score: number) => {
  if (score >= 80) return 'good'
  if (score >= 60) return 'medium'
  return 'poor'
}

const startExam = (exam: any) => {
  const spaceId = exam.learningSpaceId || selectedSpaceId.value
  if (!spaceId) {
    ElMessage.warning('请先选择学习空间，或先生成一套题库')
    return
  }

  router.push({
    name: 'ExamSession',
    query: {
      spaceId,
      title: exam.title
    }
  })
}

const reviewWrong = (exam: any) => {
  router.push({
    name: 'AITutor',
    query: {
      action: 'review_wrong',
      jobId: exam.id,
      title: exam.title
    }
  })
}

const retakeExam = (exam: any) => {
  console.log('Retake exam:', exam.title)
}

const getQuestionTypeLabel = (questionType: QuestionTypeCode | string) => {
  return (
    questionTypeRows.value.find(row => row.questionType === questionType)?.label || String(questionType)
  )
}

const refreshGenerationPreviewItems = () => {
  const orderedTypes = selectedQuestionRows.value.map(row => row.questionType)
  const items = Object.entries(generationPreviewBuffers.value).map(([questionType, buffer]) => ({
    questionType: questionType as QuestionTypeCode,
    label: getQuestionTypeLabel(questionType as QuestionTypeCode),
    text: formatQuestionStreamPreview(buffer?.raw || ''),
    tokenCount: buffer?.tokenCount || 0
  }))

  generationPreviewItems.value = items.sort((left, right) => {
    const leftIndex = orderedTypes.indexOf(left.questionType)
    const rightIndex = orderedTypes.indexOf(right.questionType)
    const normalizedLeftIndex = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex
    const normalizedRightIndex = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex
    return normalizedLeftIndex - normalizedRightIndex
  })
}

const appendGenerationPreviewChunk = (data: QuestionGenerationTokenEvent) => {
  const current = generationPreviewBuffers.value[data.questionType] || {
    raw: '',
    tokenCount: 0
  }
  generationPreviewBuffers.value = {
    ...generationPreviewBuffers.value,
    [data.questionType]: {
      raw: `${current.raw}${data.chunk}`.slice(-2400),
      tokenCount: current.tokenCount + 1
    }
  }
  refreshGenerationPreviewItems()
}

const buildTopicText = () => {
  return generateTopic.value.trim() || '基础知识'
}

const buildGeneratePayload = (): GenerateQuestionPayload | null => {
  if (!selectedSpaceId.value) return null

  return {
    learningSpaceId: selectedSpaceId.value,
    courseName: generateCourseName.value.trim() || selectedSpaceName.value || '操作系统',
    topic: buildTopicText(),
    questionTypeCountList: selectedQuestionRows.value.map((row, index) => ({
      questionType: row.questionType,
      count: row.count,
      difficulty: generateDifficulty.value,
      optionCount: row.isChoice ? 4 : undefined,
      sort: index + 1
    }))
  }
}

const addGeneratedExamCard = (payload: GenerateQuestionPayload) => {
  exams.value.unshift({
    id: Date.now(),
    title: `${payload.topic || 'AI 题库'}专项测评`,
    description: `${payload.courseName || '课程'} · ${generationMixText.value} · 难度 ${generateDifficulty.value}`,
    total: totalGenerateCount.value,
    duration: Math.max(10, totalGenerateCount.value * 2),
    accuracy: 0,
    score: 0,
    hasResult: false,
    wrongCount: 0,
    weakPoints: [],
    learningSpaceId: payload.learningSpaceId,
    status: 'available',
    statusText: generationJobNo.value ? `已生成 ${generationJobNo.value}` : '可参与'
  })
}

const resetGenerationState = () => {
  generationProgress.value = 0
  generationStep.value = '等待生成'
  generationPreviewItems.value = []
  generationPreviewBuffers.value = {}
  generationJobNo.value = ''
  generationTokenCount.value = 0
  generationError.value = ''
}

const stopGenerate = () => {
  generationAbortController?.abort()
  generationAbortController = null
  generating.value = false
  generationStep.value = '已停止接收'
  ElMessage.info('已停止接收生成进度')
}

const fetchQuestionBank = async () => {
  questionBankLoading.value = true
  try {
    questionBank.value = await fetchEvaluationQuestions({
      learningSpaceId: selectedSpaceId.value || undefined,
      limit: 30
    })
  } catch (error: any) {
    ElMessage.error(error?.message || '题库数据加载失败')
  } finally {
    questionBankLoading.value = false
  }
}

const generateExam = async () => {
  if (!selectedSpaceId.value) {
    ElMessage.warning('请先选择学习空间')
    return
  }
  if (selectedQuestionRows.value.length === 0) {
    ElMessage.warning('请至少选择一种题型')
    return
  }

  const payload = buildGeneratePayload()
  if (!payload) return

  resetGenerationState()
  generating.value = true
  generationProgress.value = 2
  generationStep.value = '正在创建任务'
  generationAbortController = new AbortController()

  try {
    await streamGenerateQuestions(payload, {
      signal: generationAbortController.signal,
      onJobCreated(data) {
        generationJobNo.value = data.jobNo
        generationProgress.value = 8
        generationStep.value = `任务已创建，共 ${data.totalCount} 题`
      },
      onToken(data) {
        generationTokenCount.value += 1
        generationProgress.value = Math.min(
          92,
          Math.max(
            generationProgress.value,
            12 + Math.floor(Math.sqrt(generationTokenCount.value) * 4)
          )
        )
        generationStep.value = `${getQuestionTypeLabel(data.questionType)}生成中`
        appendGenerationPreviewChunk(data)
      }
    })

    generationProgress.value = 100
    generationStep.value = '题库生成完成'
    addGeneratedExamCard(payload)
    await fetchQuestionBank()
    activeTab.value = 'available'
    showGenerateDialog.value = false
    ElMessage.success('题库已生成并保存')
  } catch (error: any) {
    if (error?.name === 'AbortError') return
    generationError.value = error?.message || '题库生成失败'
    generationStep.value = '生成失败'
    ElMessage.error(generationError.value)
  } finally {
    generating.value = false
    generationAbortController = null
  }
}

onMounted(async () => {
  await learningSpaceStore.fetchSpaces('active')
  if (!selectedSpaceId.value && learningSpaceStore.activeSpaces.length > 0) {
    selectedSpaceId.value = learningSpaceStore.activeSpaces[0].id
  }
  await fetchQuestionBank()
})

watch(selectedSpaceId, async (spaceId, oldSpaceId) => {
  if (spaceId === oldSpaceId) return
  await fetchQuestionBank()
})
</script>

<style scoped>
.exam-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  overflow-y: auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-lg);
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-xs);
}

.page-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.header-right .el-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* 总览 */
.section {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  border: 1px solid var(--border-light);
}

.section-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.section-title-row h2 {
  margin: 0 0 4px;
  font-size: 1rem;
  color: var(--text-dark);
}

.section-title-row p {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.question-bank-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.question-bank-card {
  min-height: 132px;
  padding: var(--spacing-lg);
  border: 1px solid rgba(31, 41, 55, 0.08);
  border-radius: var(--radius-lg);
  background: #f8fafc;
}

.question-bank-meta,
.question-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.question-bank-meta span,
.question-tags span {
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: white;
  color: var(--text-secondary);
  font-size: 0.6875rem;
  font-weight: 600;
}

.question-bank-card h3 {
  margin: var(--spacing-md) 0 var(--spacing-sm);
  color: var(--text-dark);
  font-size: 0.9375rem;
  line-height: 1.5;
}

.question-bank-card p {
  margin: 0 0 var(--spacing-sm);
  color: var(--text-muted);
  font-size: 0.8125rem;
  line-height: 1.5;
}

.question-bank-empty {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-xl);
  border: 1px dashed var(--border-light);
  border-radius: var(--radius-lg);
  color: var(--text-muted);
  text-align: center;
  background: #f8fafc;
}

.overview-cards {
  display: flex;
  gap: var(--spacing-2xl);
  align-items: center;
}

.overview-stat {
  flex-shrink: 0;
}

.stat-circle {
  width: 160px;
  height: 160px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-circle svg {
  position: absolute;
  inset: 0;
}

.stat-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
}

.stat-score {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.overview-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.detail-item {
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.detail-label {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.detail-value {
  font-size: 1rem;
  font-weight: 700;
}

.detail-value.primary {
  color: var(--primary-color);
}
.detail-value.accent {
  color: var(--accent-color);
}
.detail-value.warning {
  color: var(--warning-color);
}
.detail-value.success {
  color: var(--accent-color);
}

.detail-bar {
  height: 6px;
  background: var(--border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b5bdb, #5c7cfa);
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}

.detail-bar.accent .bar-fill {
  background: linear-gradient(90deg, #12b886, #38d9a9);
}

/* 标签页 */
.exam-tabs {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
  padding: 4px;
  background: white;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-light);
}

.tab-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  flex: 1;
  justify-content: center;
}

.tab-item:hover {
  background: var(--background-color-base);
}
.tab-item.active {
  background: var(--primary-color);
  color: white;
}
.tab-icon {
  font-size: 1rem;
}

.tab-count {
  padding: 0 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  font-size: 0.625rem;
  font-weight: 600;
}

.tab-item:not(.active) .tab-count {
  background: rgba(11, 183, 170, 0.1);
  color: var(--primary-color);
}

/* 测评列表 */
.exam-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.exam-card {
  display: flex;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
  background: var(--background-color-base);
  border-radius: var(--radius-xl);
  border-left: 4px solid var(--border-light);
  transition: all var(--transition-base);
}

.exam-card.ongoing {
  border-left-color: var(--warning-color);
  background: rgba(245, 158, 11, 0.04);
}

.exam-card:hover {
  background: white;
  box-shadow: var(--shadow-md);
}

.exam-status-bar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  min-width: 80px;
}

.status-badge {
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 600;
  text-align: center;
  width: fit-content;
}

.status-badge.completed {
  background: rgba(18, 184, 134, 0.1);
  color: var(--accent-color);
}
.status-badge.available {
  background: rgba(11, 183, 170, 0.1);
  color: var(--primary-color);
}
.status-badge.ongoing {
  background: rgba(245, 158, 11, 0.15);
  color: var(--warning-color);
  animation: pulse 2s infinite;
}

.time-left {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--warning-color);
}

.result-score {
  font-size: 1.25rem;
  font-weight: 700;
}

.result-score.good {
  color: var(--accent-color);
}
.result-score.medium {
  color: var(--primary-color);
}
.result-score.poor {
  color: var(--danger-color);
}

.exam-info {
  flex: 1;
}

.exam-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-sm);
}

.exam-desc {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-md);
  line-height: 1.5;
}

.exam-meta {
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.exam-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.exam-meta svg {
  width: 12px;
  height: 12px;
}

.exam-progress-bar {
  height: 4px;
  background: var(--border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--spacing-sm);
}

.exam-progress-bar .bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.result-detail {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.result-chart {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-sm);
}

.chart-bar-group {
  display: flex;
  gap: 2px;
  align-items: flex-end;
  height: 40px;
}

.chart-bar {
  width: 16px;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  transition: height 0.5s ease;
}

.chart-bar.correct {
  background: var(--accent-color);
}
.chart-bar.wrong {
  background: var(--danger-color);
  opacity: 0.6;
}

.chart-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.result-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.wrong-tag {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 2px 10px;
  background: rgba(239, 68, 68, 0.08);
  color: var(--danger-color);
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 600;
}

.review-link {
  color: var(--primary-color);
  cursor: pointer;
  text-decoration: underline;
}

.weak-tag {
  padding: 2px 10px;
  background: rgba(245, 158, 11, 0.08);
  color: var(--warning-color);
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 600;
}

.exam-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  justify-content: center;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
}
.empty-state h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-sm);
}
.empty-state p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

/* 生成表单 */
.generate-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: var(--spacing-xl);
}

.generate-form {
  min-width: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-lg);
}

.generate-form .form-item {
  margin-bottom: var(--spacing-lg);
}

.generate-form label,
.field-heading label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: var(--spacing-sm);
}

.field-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.field-heading label {
  margin-bottom: 0;
}

.field-heading span {
  font-size: 0.75rem;
  color: var(--primary-color);
  font-weight: 700;
}

.question-type-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-sm);
}

.question-type-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) 96px;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  background: var(--background-color-base);
}

.type-copy {
  min-width: 0;
}

.type-copy strong,
.type-copy span {
  display: block;
}

.type-copy strong {
  font-size: 0.8125rem;
  color: var(--text-dark);
}

.type-copy span {
  font-size: 0.6875rem;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.difficulty-tip {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: var(--spacing-xs);
}

.generate-summary {
  align-self: start;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, rgba(11, 183, 170, 0.06), rgba(18, 184, 134, 0.05));
  padding: var(--spacing-lg);
}

.summary-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: var(--spacing-md);
}

.summary-line {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 0.8125rem;
}

.summary-line span {
  color: var(--text-muted);
}

.summary-line strong {
  color: var(--text-dark);
  text-align: right;
}

.summary-mix {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.7);
  color: var(--text-secondary);
  font-size: 0.75rem;
  line-height: 1.5;
}

.generation-progress-card {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.progress-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.progress-head strong {
  color: var(--primary-color);
}

.job-no {
  margin-top: var(--spacing-sm);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--primary-color);
}

.token-preview-list {
  display: grid;
  gap: var(--spacing-xs);
  max-height: 150px;
  overflow-y: auto;
  margin-top: var(--spacing-sm);
}

.token-preview-item {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-left: 2px solid rgba(11, 183, 170, 0.4);
  background: rgba(255, 255, 255, 0.68);
}

.token-preview-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-bottom: 2px;
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.token-preview-meta small {
  flex: none;
  color: var(--text-muted);
  font-size: 0.625rem;
  font-weight: 600;
}

.token-preview-item p {
  margin: 0;
  font-size: 0.6875rem;
  line-height: 1.5;
  color: var(--text-muted);
  word-break: break-word;
}

.generation-error {
  margin: var(--spacing-sm) 0 0;
  font-size: 0.75rem;
  color: var(--danger-color);
}

@media (max-width: 900px) {
  .question-bank-list,
  .generate-layout,
  .form-grid,
  .question-type-list {
    grid-template-columns: 1fr;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
