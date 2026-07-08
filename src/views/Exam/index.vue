<template>
  <AppLayout>
    <div class="exam-page">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">测评中心</h1>
          <p class="page-desc">阶段性测评、专项测试、错题复习，追踪你的学习效果</p>
        </div>
        <div class="header-right" style="display: flex; align-items: center;">
          <template v-if="learningSpaceStore.loading || learningSpaceStore.activeSpaces.length > 0">
            <el-select
              v-model="selectedSpaceId"
              filterable
              placeholder="切换学习空间"
              style="width: 200px; margin-right: 16px;"
              :loading="learningSpaceStore.loading"
            >
              <el-option
                v-for="space in learningSpaceStore.activeSpaces"
                :key="space.id"
                :label="space.name"
                :value="space.id"
              />
              <template #empty>
                <div class="select-empty-tip">
                  <el-icon class="select-empty-icon"><Warning /></el-icon>
                  <span>暂无学习空间</span>
                  <el-button
                    type="primary"
                    link
                    size="small"
                    @click="router.push('/spaces')"
                  >去创建</el-button>
                </div>
              </template>
            </el-select>
          </template>
          <template v-else>
            <el-button
              type="primary"
              style="margin-right: 16px;"
              @click="router.push('/spaces')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="margin-right: 4px;">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              立即创建学习空间
            </el-button>
          </template>
          <el-button class="btn-ai-generate" @click="showGenerateDialog = true">
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

      <!-- 无学习空间提示横幅 -->
      <el-alert
        v-if="!learningSpaceStore.loading && learningSpaceStore.activeSpaces.length === 0"
        type="warning"
        :closable="false"
        show-icon
        class="no-space-alert"
      >
        <template #title>
          您还没有任何学习空间，无法使用测评功能。
          <el-button
            type="primary"
            size="small"
            style="margin-left: 12px;"
            @click="router.push('/spaces')"
          >立即创建学习空间</el-button>
        </template>
      </el-alert>

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
          <div class="details-left">
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
          </div>
          <div class="details-right">
            <div class="stat-tile-card warning">
              <div class="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div class="card-info">
                <span class="card-label">薄弱知识点</span>
                <span class="card-value warning">{{ weakCount }} 个</span>
              </div>
            </div>
            <div class="stat-tile-card success">
              <div class="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
              <div class="card-info">
                <span class="card-label">本周进步</span>
                <span class="card-value success">+{{ weeklyProgress }}%</span>
              </div>
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

        <div v-if="questionBank.length" class="exam-list" style="margin-bottom: 32px;">
          <!-- 题库汇总卡片 -->
          <div class="exam-card">
            <div class="exam-status-bar">
              <span class="status-badge available">可参与</span>
            </div>
            <div class="exam-info">
              <h3 class="exam-title">{{ selectedSpaceName || '当前空间' }} 总题库</h3>
              <p class="exam-desc">包含所有知识点的测评题目，点击“开始刷题”即可逐一练习。</p>
              <div class="exam-meta">
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  {{ questionBank.length }} 题
                </span>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                  无时间限制
                </span>
              </div>
            </div>
            <div class="exam-actions">
              <el-button type="primary" @click="$router.push('/exam/questions?spaceId=' + (selectedSpaceId || ''))">开始刷题</el-button>
            </div>
          </div>
        </div>

        <div class="exam-list">
          <!-- 测评卡片 -->
          <div
            v-for="exam in filteredExams"
            :key="exam.id"
            class="exam-card"
            :class="[{ 'has-result': exam.hasResult }, exam.status]"
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
                <el-button type="primary" @click="startExam(exam)">{{ exam.status === 'ongoing' ? '继续测评' : '开始测评' }}</el-button>
              </template>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div class="empty-state" v-if="filteredExams.length === 0 && questionBank.length === 0">
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
        width="760px"
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
                <el-input v-model="generateCourseName" placeholder="例如：数据结构" />
              </div>
            </div>

            <div class="form-item">
              <label>出题主题</label>
              <el-input v-model="generateTopic" placeholder="例如：排序" />
            </div>

            <div class="form-item">
              <div class="field-heading">
                <label>题型与题量</label>
                <span class="total-badge">{{ totalGenerateCount }} 题</span>
              </div>
              <div class="question-type-list">
                <div
                  v-for="row in questionTypeRows"
                  :key="row.questionType"
                  class="question-type-row"
                  :class="{ active: row.enabled }"
                >
                  <div class="type-main">
                    <el-switch v-model="row.enabled" size="small" />
                    <div class="type-icon-wrapper" :class="{ enabled: row.enabled }">
                      <svg v-if="row.questionType === 'single_choice'" viewBox="0 0 24 24" class="type-svg-icon">
                        <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
                        <circle cx="9" cy="9" r="2" fill="currentColor"/>
                        <line x1="13" y1="9" x2="17" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <circle cx="9" cy="15" r="2" fill="none" stroke="currentColor" stroke-width="2"/>
                        <line x1="13" y1="15" x2="17" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                      <svg v-else-if="row.questionType === 'multiple_choice'" viewBox="0 0 24 24" class="type-svg-icon">
                        <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
                        <rect x="7" y="7" width="4" height="4" rx="1" fill="currentColor"/>
                        <line x1="14" y1="9" x2="17" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <rect x="7" y="13" width="4" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="2"/>
                        <line x1="14" y1="15" x2="17" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                      <svg v-else-if="row.questionType === 'fill_blank'" viewBox="0 0 24 24" class="type-svg-icon">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" stroke-width="2"/>
                        <line x1="6" y1="12" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <line x1="14" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2"/>
                        <line x1="6" y1="16" x2="10" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <line x1="12" y1="16" x2="18" y2="16" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2"/>
                      </svg>
                      <svg v-else-if="row.questionType === 'judge'" viewBox="0 0 24 24" class="type-svg-icon">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
                        <path d="M8 12l3 3 5-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <svg v-else viewBox="0 0 24 24" class="type-svg-icon">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="none" stroke="currentColor" stroke-width="2"/>
                        <line x1="8" y1="9" x2="16" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <line x1="8" y1="13" x2="14" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                    </div>
                    <div class="type-copy">
                      <strong>{{ row.label }}</strong>
                      <span>{{ row.description }}</span>
                    </div>
                  </div>
                  <div class="type-control">
                    <el-input-number
                      v-model="row.count"
                      :min="1"
                      :max="10"
                      :disabled="!row.enabled"
                      controls-position="right"
                      size="small"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="form-item difficulty-section">
              <div class="field-heading" style="margin-bottom: 32px;">
                <label>难度级别</label>
                <span class="total-badge" style="background: var(--el-color-primary-light-9); color: var(--el-color-primary);">{{ generateDifficultyDesc }}</span>
              </div>
              <div class="difficulty-slider-wrapper" style="padding: 0 20px 24px;">
                <el-slider v-model="generateDifficulty" :min="1" :max="5" :step="1" :marks="difficultyMarks" show-stops :show-tooltip="false" />
              </div>
            </div>
          </div>

          <aside class="generate-summary">
            <div class="summary-title">生成预览</div>
            <div class="summary-receipt">
              <div class="summary-line">
                <span>学习空间</span>
                <strong>{{ selectedSpaceName || '未选择' }}</strong>
              </div>
              <div class="summary-line">
                <span>生成数量</span>
                <strong>{{ totalGenerateCount }} 题</strong>
              </div>
              <div class="summary-line">
                <span>预计耗时</span>
                <strong>{{ estimatedMinutes }} 分钟</strong>
              </div>
            </div>
            
            <div class="summary-mix-container">
              <span class="mix-label">题型组合</span>
              <div class="summary-mix-tags">
                <template v-if="selectedQuestionRows.length">
                  <span
                    v-for="row in selectedQuestionRows"
                    :key="row.questionType"
                    class="mix-tag"
                  >
                    {{ row.label }} <strong class="tag-count">{{ row.count }}</strong>
                  </span>
                </template>
                <span v-else class="mix-tag empty">请选择题型</span>
              </div>
            </div>

            <div
              v-if="generating || generationJobNo || generationError"
              class="generation-progress-card"
            >
              <div class="progress-head">
                <span class="progress-step-text">
                  <span class="pulse-dot"></span>
                  {{ generationStep }}
                </span>
                <strong class="progress-percentage">{{ generationProgress }}%</strong>
              </div>
              <el-progress :percentage="generationProgress" :stroke-width="6" :show-text="false" />
              <div v-if="generationJobNo" class="job-no">任务号：{{ generationJobNo }}</div>
              <div v-if="generationPreviewItems.length" class="token-preview-list">
                <div
                  v-for="item in generationPreviewItems"
                  :key="item.questionType"
                  class="token-preview-item"
                >
                  <div class="token-preview-meta">
                    <span class="token-preview-label">{{ item.label }}</span>
                    <small class="token-preview-count">{{ item.tokenCount }} 段</small>
                  </div>
                  <p class="token-preview-text">{{ item.text || '正在接收题目结构...' }}</p>
                </div>
              </div>
              <p v-if="generationError" class="generation-error">{{ generationError }}</p>
            </div>
          </aside>
        </div>
        <template #footer>
          <el-button v-if="generating" class="btn-secondary" @click="stopGenerate">停止接收</el-button>
          <el-button v-else class="btn-secondary" @click="showGenerateDialog = false">取消</el-button>
          <el-button
            type="primary"
            class="btn-primary"
            :loading="generating"
            :disabled="!canGenerate"
            @click="generateExam"
          >
            {{ generating ? '正在生成...' : '开始生成' }}
          </el-button>
        </template>
      </el-dialog>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useLearningSpaceStore } from '@/stores/learningSpace'
import {
  fetchEvaluationQuestions,
  fetchEvaluationTasks,
  streamGenerateQuestions,
  type EvaluationQuestion,
  type EvaluationSession,
  type GenerateQuestionPayload,
  type QuestionGenerationTokenEvent,
  type QuestionTypeCode
} from '@/api/evaluationQuestion'
import { startSession } from '@/api/evaluationSession'
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
const route = useRoute()
const activeTab = ref('available')
const showGenerateDialog = ref(false)
const generating = ref(false)
const selectedSpaceId = ref<string | null>(null)
const generateCourseName = ref('数据结构')
const generateTopic = ref('排序')
const generateDifficulty = ref(3)
const generationProgress = ref(0)
const generationStep = ref('等待生成')
const generationPreviewItems = ref<GenerationPreviewItem[]>([])
const generatedSessionId = ref<string | null>(null)
const generatedSessionTitle = ref('')
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
  2: '理解 - 理解核心原理',
  3: '应用 - 场景应用与分析',
  4: '综合 - 多知识点融合设计',
  5: '进阶 - 复杂推理与高阶思维'
}
const difficultyMarks = {
  1: '识记',
  2: '理解',
  3: '应用',
  4: '综合',
  5: '进阶'
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

const overallScore = ref(0)
const weeklyCount = ref(0)
const weeklyAccuracy = ref(0)
const weakCount = ref(0)
const weeklyProgress = ref(0)

const exams = ref<any[]>([])

const examTabs = computed(() => [
  {
    value: 'ongoing',
    label: '进行中',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>',
    count: exams.value.filter(exam => exam.status === 'ongoing').length
  },
  {
    value: 'available',
    label: '可参与',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>',
    count: exams.value.filter(exam => exam.status === 'available' || exam.status === 'error').length
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
  return exams.value.filter(e => {
    if (activeTab.value === 'ongoing') return e.status === 'ongoing'
    if (activeTab.value === 'available') return e.status === 'available' || e.status === 'error'
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

const startExam = async (exam: any) => {
  const spaceId = exam.learningSpaceId || selectedSpaceId.value
  if (!spaceId) {
    ElMessage.warning('请先选择学习空间，或先生成一套题库')
    return
  }

  // 仅当后端 status 为 'todo'（尚未开始）时才通知后端开始答题
  if (exam.rawStatus === 'todo') {
    try {
      await startSession(exam.id)
    } catch {
      // 忽略异常，不阻断跳转
    }
  }

  router.push({
    name: 'ExamSession',
    query: {
      sessionId: exam.id,  // 携带 sessionId，走完整 session 流程
      rawStatus: exam.rawStatus, // 传递后端原始状态，供答题页判断是否调用 start
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
  generatedSessionId.value = null
  generatedSessionTitle.value = ''
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
    const sessions = await fetchEvaluationTasks({
      learningSpaceId: selectedSpaceId.value || undefined
    })
    questionBank.value = [] // 默认关闭请求，所以这里置空
    exams.value = sessions.map((session: EvaluationSession) => {
      const isFinished = session.status === 'finished'
      const isDoing = session.status === 'doing'
      const isError = session.status === 'error'
      // todo / 其余未知状态 → available（可参与）
      const uiStatus = isFinished ? 'completed' : isDoing ? 'ongoing' : isError ? 'error' : 'available'
      const statusText = isFinished ? '已完成' : isDoing ? '进行中' : isError ? '生成失败' : '可参与'
      return {
        id: session.id,
        generationTaskId: session.taskId,  // 出题生成任务ID，用于按任务查题
        title: session.topic || '专项测评',
        description: session.description || '',
        total: session.totalQuestionCount || 0,
        duration: (session.totalQuestionCount || 0) * 2, // 预估每题2分钟
        accuracy: session.accuracy ? Math.round(session.accuracy * 100) : 0,
        score: session.actualScore || 0,
        hasResult: isFinished,
        wrongCount: isFinished ? (session.totalQuestionCount || 0) - (session.answeredCount || 0) : 0,
        weakPoints: [],
        learningSpaceId: session.learningSpaceId,
        rawStatus: session.status,  // 后端原始状态，用于业务判断
        status: uiStatus,
        statusText
      }
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
      },
      onSessionCreated(data) {
        // 保存 sessionId，供跳转答题页使用
        generatedSessionId.value = data.sessionId
        generatedSessionTitle.value = data.title
      }
    })

    generationProgress.value = 100
    generationStep.value = '题库生成完成'
    addGeneratedExamCard(payload)
    await fetchQuestionBank()

    // 如果有 sessionId，自动跳转到答题页
    if (generatedSessionId.value) {
      const targetSpaceId = selectedSpaceId.value || payload.learningSpaceId
      router.push({
        name: 'ExamSession',
        query: {
          sessionId: generatedSessionId.value,
          spaceId: targetSpaceId,
          title: generatedSessionTitle.value
        }
      })
    } else {
      activeTab.value = 'available'
    }
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
  
  const querySpaceId = route.query.spaceId ? String(route.query.spaceId) : null
  if (querySpaceId) {
    selectedSpaceId.value = querySpaceId
  } else if (!selectedSpaceId.value && learningSpaceStore.activeSpaces.length > 0) {
    selectedSpaceId.value = learningSpaceStore.activeSpaces[0].id
  }
  
  await fetchQuestionBank()
})

watch(selectedSpaceId, async (spaceId, oldSpaceId) => {
  if (spaceId === oldSpaceId) return
  if (spaceId) {
    router.replace({ query: { ...route.query, spaceId } })
  }
  await fetchQuestionBank()
})
</script>

<style scoped>
.exam-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 4px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-lg);
}

.page-title {
  font-size: 1.625rem;
  font-weight: 800;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-xs);
  letter-spacing: -0.025em;
}

.page-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}

/* AI生成按钮高级发光效果 */
.btn-ai-generate {
  background: var(--gradient-primary) !important;
  border: none !important;
  color: white !important;
  font-weight: 600 !important;
  font-size: 0.875rem !important;
  padding: 10px 18px !important;
  height: auto !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: 0 4px 14px rgba(11, 183, 170, 0.3) !important;
  transition: all var(--transition-base) !important;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-ai-generate:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(11, 183, 170, 0.45), 0 0 12px rgba(79, 110, 246, 0.3) !important;
}

.btn-ai-generate:active {
  transform: translateY(0);
}

.btn-ai-generate svg {
  stroke: currentColor;
  transition: transform 0.3s ease;
}

.btn-ai-generate:hover svg {
  transform: rotate(30deg);
}

/* 总览卡片 - 升级为精致磨砂玻璃质感 */
.section {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.overview-cards {
  display: flex;
  gap: var(--spacing-2xl);
  align-items: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(236, 253, 251, 0.6) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(11, 183, 170, 0.12);
  box-shadow: var(--shadow-md), 0 10px 30px rgba(11, 183, 170, 0.03);
}

.overview-stat {
  flex-shrink: 0;
}

.stat-circle {
  width: 150px;
  height: 150px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 4px 12px rgba(11, 183, 170, 0.22));
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
  font-size: 2.75rem;
  font-weight: 800;
  background: linear-gradient(135deg, #2563eb 0%, #0bb7aa 70%, #10b981 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.1;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
}

.stat-score::after {
  content: '';
  display: none;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-top: 2px;
}

/* 详情指标区 */
.overview-details {
  flex: 1;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: var(--spacing-xl);
}

.details-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--spacing-md);
}

.detail-item {
  width: 100%;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.detail-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.detail-value {
  font-size: 0.9375rem;
  font-weight: 700;
}

.detail-value.primary {
  color: var(--primary-color);
}
.detail-value.accent {
  color: var(--accent-color);
}

.detail-bar {
  height: 8px;
  background: rgba(148, 163, 184, 0.12);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b5bdb, var(--primary-color));
  border-radius: var(--radius-full);
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.detail-bar.accent .bar-fill {
  background: linear-gradient(90deg, var(--accent-color), var(--primary-color));
}

/* 磁贴指标小卡片 */
.details-right {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.stat-tile-card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.05);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.stat-tile-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md), 0 4px 12px rgba(11, 183, 170, 0.05);
  border-color: rgba(11, 183, 170, 0.15);
}

.card-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-tile-card.warning .card-icon {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning-color);
}

.stat-tile-card.success .card-icon {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
}

.card-info {
  display: flex;
  flex-direction: column;
}

.card-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 2px;
}

.card-value {
  font-size: 1rem;
  font-weight: 700;
}

.card-value.warning {
  color: var(--warning-color);
}

.card-value.success {
  color: var(--success-color);
}

/* 分类标签页 - 胶囊式 */
.exam-tabs {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xl);
  padding: 6px;
  background: rgba(148, 163, 184, 0.08);
  border-radius: var(--radius-xl);
  border: none;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 10px var(--spacing-lg);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-regular);
  cursor: pointer;
  transition: all var(--transition-base);
  flex: 1;
  justify-content: center;
}

.tab-item:hover {
  background: rgba(255, 255, 255, 0.5);
  color: var(--text-dark);
}

.tab-item.active {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(11, 183, 170, 0.25);
}

.tab-icon {
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-icon svg {
  width: 16px;
  height: 16px;
}

.tab-count {
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 700;
}

.tab-item:not(.active) .tab-count {
  background: rgba(11, 183, 170, 0.1);
  color: var(--primary-color);
}

/* 列表容器 */
.section-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.section-title-row h2 {
  margin: 0 0 4px;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-dark);
}

.section-title-row p {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.exam-list-section {
  background: white;
}

/* 题库数据卡片优化 */
.question-bank-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.question-bank-card {
  min-height: 132px;
  padding: var(--spacing-lg);
  border: 1px solid rgba(15, 23, 42, 0.05);
  border-radius: var(--radius-lg);
  background: #f8fafc;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.question-bank-card:hover {
  background: white;
  transform: translateY(-3px);
  border-color: rgba(11, 183, 170, 0.2);
  box-shadow: var(--shadow-md), 0 4px 16px rgba(11, 183, 170, 0.04);
}

.question-bank-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.question-bank-meta span {
  padding: 3px 8px;
  border-radius: var(--radius-full);
  background: white;
  color: var(--text-secondary);
  font-size: 0.6875rem;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  border: 1px solid rgba(15, 23, 42, 0.03);
}

.question-bank-card h3 {
  margin: 0 0 var(--spacing-sm);
  color: var(--text-dark);
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.6;
  flex-grow: 1;
}

.question-bank-card p {
  margin: 0 0 var(--spacing-md);
  color: var(--text-secondary);
  font-size: 0.8125rem;
  line-height: 1.5;
  background: rgba(15, 23, 42, 0.02);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
}

.question-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.question-tags span {
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: rgba(11, 183, 170, 0.08);
  color: var(--primary-color);
  font-size: 0.6875rem;
  font-weight: 600;
}

/* 测评列表与卡片 */
.exam-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.exam-card {
  position: relative;
  display: flex;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
  padding-left: calc(var(--spacing-xl) + 6px);
  background: white;
  border-radius: var(--radius-xl);
  border: 1px solid rgba(15, 23, 42, 0.05);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
  overflow: hidden;
}

/* 状态彩带设计 */
.exam-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background: var(--border-light);
  transition: all var(--transition-base);
}

.exam-card.ongoing {
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.02), white 100%);
}
.exam-card.ongoing::before {
  background: linear-gradient(180deg, #f59e0b, #fbbf24);
}

.exam-card.available::before {
  background: linear-gradient(180deg, var(--primary-color), var(--accent-color));
}

.exam-card.completed::before {
  background: linear-gradient(180deg, #10b981, #34d399);
}

.exam-card.error::before {
  background: linear-gradient(180deg, #ef4444, #f87171);
}

.exam-card:hover {
  transform: translateY(-4px);
  border-color: rgba(11, 183, 170, 0.18);
  box-shadow: var(--shadow-lg), 0 8px 24px rgba(11, 183, 170, 0.05);
}

.exam-status-bar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  min-width: 90px;
  align-items: flex-start;
}

.status-badge {
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 700;
  text-align: center;
  width: fit-content;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.status-badge.completed {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
}
.status-badge.available {
  background: rgba(11, 183, 170, 0.1);
  color: var(--primary-color);
}
.status-badge.ongoing {
  background: rgba(245, 158, 11, 0.12);
  color: var(--warning-color);
  animation: pulse 2s infinite;
}
.status-badge.error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.time-left {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--warning-color);
  display: flex;
  align-items: center;
  gap: 3px;
}

.result-score {
  font-size: 1.375rem;
  font-weight: 800;
  font-family: 'Outfit', sans-serif;
  margin-top: 4px;
}

.result-score.good {
  color: var(--success-color);
}
.result-score.medium {
  color: var(--primary-color);
}
.result-score.poor {
  color: var(--danger-color);
}

.exam-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.exam-title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0 0 6px;
  letter-spacing: -0.01em;
}

.exam-desc {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-md);
  line-height: 1.6;
}

.exam-meta {
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
}

.exam-meta span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}

.exam-meta svg {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
}

.exam-progress-bar {
  height: 6px;
  background: rgba(148, 163, 184, 0.12);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--spacing-sm);
}

.exam-progress-bar .bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

/* 结果详细 */
.result-detail {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
  margin-top: var(--spacing-xs);
  background: rgba(15, 23, 42, 0.015);
  padding: 8px 12px;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(15, 23, 42, 0.02);
}

.result-chart {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-sm);
}

.chart-bar-group {
  display: flex;
  gap: 3px;
  align-items: flex-end;
  height: 36px;
}

.chart-bar {
  width: 12px;
  border-radius: var(--radius-xs) var(--radius-xs) 0 0;
  transition: height 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.chart-bar.correct {
  background: var(--success-color);
}
.chart-bar.wrong {
  background: var(--danger-color);
  opacity: 0.75;
}

.chart-label {
  font-size: 0.75rem;
  font-weight: 700;
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
  gap: var(--spacing-xs);
  padding: 3px 10px;
  background: rgba(239, 68, 68, 0.06);
  color: var(--danger-color);
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 700;
  border: 1px solid rgba(239, 68, 68, 0.1);
}

.review-link {
  color: var(--primary-color);
  cursor: pointer;
  text-decoration: none;
  font-weight: 700;
  margin-left: 2px;
  transition: opacity 0.2s;
}

.review-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.weak-tag {
  padding: 3px 10px;
  background: rgba(245, 158, 11, 0.06);
  color: var(--warning-color);
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 700;
  border: 1px solid rgba(245, 158, 11, 0.1);
}

.exam-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  justify-content: center;
  min-width: 100px;
}

.exam-actions .el-button {
  width: 100%;
  margin-left: 0 !important;
  font-weight: 600;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--spacing-3xl) var(--spacing-xl);
  border: 1px dashed rgba(148, 163, 184, 0.3);
  background: rgba(148, 163, 184, 0.02);
  border-radius: var(--radius-xl);
}

.empty-icon {
  margin-bottom: var(--spacing-md);
  color: var(--text-muted);
}
.empty-state h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-xs);
}
.empty-state p {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0;
}

/* 生成表单 & AI 对话框 */
:deep(.el-overlay-dialog) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

:deep(.question-generate-dialog) {
  margin: 0 !important;
  border-radius: var(--radius-xl) !important;
  overflow: hidden;
}

:deep(.question-generate-dialog .el-dialog__header) {
  padding: var(--spacing-xl) var(--spacing-xl) var(--spacing-md) !important;
  margin-right: 0 !important;
  border-bottom: none !important;
}

:deep(.question-generate-dialog .el-dialog__title) {
  font-weight: 700 !important;
  font-size: 1.1rem !important;
  color: var(--text-dark) !important;
}

:deep(.question-generate-dialog .el-dialog__body) {
  padding: var(--spacing-xl) !important;
}

:deep(.question-generate-dialog .el-dialog__footer) {
  padding: var(--spacing-lg) var(--spacing-xl) var(--spacing-xl) !important;
  border-top: none !important;
}

/* Form Layout */
.generate-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
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
  margin-bottom: 16px;
}

.generate-form label,
.field-heading label {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: var(--spacing-xs);
  letter-spacing: 0.02em;
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

.total-badge {
  font-size: 0.75rem;
  color: var(--primary-color);
  font-weight: 800;
  background: rgba(11, 183, 170, 0.08);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

/* Question Type Cards */
.question-type-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.question-type-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  background: #fff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.question-type-row:hover {
  border-color: rgba(11, 183, 170, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.question-type-row.active {
  border-color: var(--primary-color);
  background: rgba(11, 183, 170, 0.02);
}

.type-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
  min-width: 0;
}

.type-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-md);
  background: rgba(0, 0, 0, 0.03);
  color: var(--text-muted);
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.type-icon-wrapper.enabled {
  background: rgba(11, 183, 170, 0.1);
  color: var(--primary-color);
}

.type-svg-icon {
  width: 16px;
  height: 16px;
}

.type-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.type-copy strong {
  font-size: 0.8rem;
  color: var(--text-dark);
  font-weight: 600;
}

.type-copy span {
  font-size: 0.7rem;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-control {
  flex-shrink: 0;
}

:deep(.question-type-row .el-input-number) {
  width: 90px;
}
:deep(.question-type-row .el-input-number.el-input-number--small) {
  width: 90px;
  line-height: 28px;
}
:deep(.question-type-row .el-input-number .el-input__wrapper) {
  padding: 0 8px;
}

.difficulty-section {
  display: flex;
  flex-direction: column;
}

:deep(.difficulty-slider-wrapper .el-slider__runway) {
  height: 6px !important;
  background-color: #e4e7ed !important;
}

:deep(.difficulty-slider-wrapper .el-slider__bar) {
  height: 6px !important;
  background: var(--primary-color) !important;
}

:deep(.difficulty-slider-wrapper .el-slider__button) {
  width: 16px !important;
  height: 16px !important;
  border: 2px solid var(--primary-color) !important;
  background-color: #fff !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}
/* Summary Sidebar */
.generate-summary {
  align-self: start;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  background: rgba(0, 0, 0, 0.015);
  padding: var(--spacing-lg);
}

.summary-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-xs);
  border-bottom: 2px solid rgba(11, 183, 170, 0.15);
}

.summary-receipt {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: var(--spacing-md);
}

.summary-line {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-xs) 0;
  font-size: 0.85rem;
}

.summary-line span {
  color: var(--text-muted);
}

.summary-line strong {
  color: var(--text-dark);
  font-weight: 600;
}

.summary-mix-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px dashed var(--border-light);
}

.mix-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
}

.summary-mix-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mix-tag {
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: var(--radius-md);
  background: rgba(11, 183, 170, 0.08);
  color: var(--primary-color);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.mix-tag.empty {
  color: var(--text-muted);
  background: transparent;
  padding: 0;
}

/* Generation Progress UI */
.generation-progress-card {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px dashed var(--border-light);
}

.progress-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.progress-step-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background-color: var(--primary-color);
  box-shadow: 0 0 8px var(--primary-color);
  animation: pulse 1.5s infinite;
}

.progress-percentage {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--primary-color);
}

.job-no {
  margin-top: var(--spacing-xs);
  font-size: 0.7rem;
  font-family: monospace;
  color: var(--text-muted);
  text-align: right;
}

.token-preview-list {
  display: grid;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
  margin-top: var(--spacing-md);
  padding-right: 4px;
}

.token-preview-list::-webkit-scrollbar {
  width: 4px;
}
.token-preview-list::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.1);
  border-radius: var(--radius-full);
}

.token-preview-item {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--primary-color);
  background: rgba(0, 0, 0, 0.02);
}

.token-preview-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.token-preview-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-dark);
}

.token-preview-count {
  color: var(--text-muted);
  font-size: 0.7rem;
}

.token-preview-text {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--text-secondary);
  word-break: break-word;
  font-family: monospace;
}

.generation-error {
  margin: var(--spacing-sm) 0 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--danger-color);
  background: rgba(239, 68, 68, 0.05);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--danger-color);
}

@media (max-width: 900px) {
  .question-bank-list,
  .generate-layout,
  .form-grid,
  .question-type-list {
    grid-template-columns: 1fr;
  }
  .overview-cards {
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-lg);
  }
  .overview-details {
    grid-template-columns: 1fr;
    width: 100%;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.75;
  }
}

.no-space-alert {
  margin-bottom: 16px;
  border-radius: 8px;
}

.select-empty-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.select-empty-icon {
  color: var(--el-color-warning);
  font-size: 15px;
  flex-shrink: 0;
}
</style>
