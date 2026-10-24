<template>
  <AppLayout>
    <div class="exam-paper-container practice-quiz-page">
      <!-- 返回导航 -->
      <div class="back-nav" @click="goBack">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" class="back-icon">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>返回</span>
      </div>

      <div v-if="loading" class="loading-box">正在加载题目...</div>
      <div v-else-if="!questions.length" class="empty-box">暂无题目数据</div>

      <div v-else class="exam-session-layout" :class="{ 'coding-mode': hasCodingQuestions }">
        <!-- 左侧栏：进度卡片 + 题目卡片列表 -->
        <div v-if="!hasCodingQuestions" class="exam-main-content">
          <!-- 测评进度卡片 -->
          <QuizSummaryCard
            :answeredCount="answeredCount"
            :totalCount="questions.length"
            :estimatedAccuracy="estimatedAccuracy"
            :difficultyText="difficultyDistributionText"
            :coverageTags="knowledgeCoverageTags"
          />
          
          <!-- 题目卡片列表 -->
          <div v-for="group in groupedQuestions" :key="group.type" class="question-group">
            <QuestionCard
              v-for="q in group.questions"
              :key="q.id"
              :id="'question-card-' + q.globalIndex"
              :q="q"
              :typeName="group.typeName"
              :active="q.globalIndex === currentActiveIndex"
              :answers="answers"
              :codeLanguages="codeLanguages"
              :showAnswer="showAnswer"
              :isSubmitting="isSubmitting"
              :flagged="flaggedQuestions.has(q.globalIndex)"
              :favorited="favoritedQuestions.has(q.globalIndex)"
              :sessionId="sessionId"
              :grading="getQuestionGrading(q)"
              :totalCount="questions.length"
              :isAnalysisExpanded="isAnalysisExpanded(q.id)"
              @select-option="toggleOption"
              @select-judge="toggleJudge"
              @update-fill-blank="updateFillBlankValueIndexed"
              @update-essay="updateEssayValue"
              @update-code="updateCodeValue"
              @update-code-language="updateCodeLanguage"
              @toggle-flag="toggleFlag"
              @toggle-favorite="toggleFavorite"
              @show-kp="showKpExplanation"
              @prev="goPrevQuestion"
              @next="goNextQuestion"
              @toggle-analysis="toggleAnalysisExpand"
            />
          </div>
        </div>

        <!-- 编程测评模式：代码题升级为左题面 + 中编辑器 + 右辅助栏的在线 OJ 工作台 -->
        <div v-else class="coding-main-content">
          <QuizSummaryCard
            :answeredCount="answeredCount"
            :totalCount="questions.length"
            :estimatedAccuracy="estimatedAccuracy"
            :difficultyText="difficultyDistributionText"
            :coverageTags="knowledgeCoverageTags"
          />

          <div v-for="group in groupedQuestions" :key="group.type" class="question-group coding-question-group">
            <component
              v-for="q in group.questions"
              :key="q.id"
              :is="isCodingQuestion(q) ? CodeQuestionWorkspace : QuestionCard"
              :q="q"
              :typeName="group.typeName"
              :active="q.globalIndex === currentActiveIndex"
              :answers="answers"
              :codeLanguages="codeLanguages"
              :showAnswer="showAnswer"
              :isSubmitting="isSubmitting"
              :flagged="flaggedQuestions.has(q.globalIndex)"
              :favorited="favoritedQuestions.has(q.globalIndex)"
              :sessionId="sessionId"
              :grading="getQuestionGrading(q)"
              :totalCount="questions.length"
              :isAnalysisExpanded="isAnalysisExpanded(q.id)"
              @select-option="toggleOption"
              @select-judge="toggleJudge"
              @update-fill-blank="updateFillBlankValueIndexed"
              @update-essay="updateEssayValue"
              @update-code="updateCodeValue"
              @update-code-language="updateCodeLanguage"
              @toggle-flag="toggleFlag"
              @toggle-favorite="toggleFavorite"
              @show-kp="showKpExplanation"
              @prev="goPrevQuestion"
              @next="goNextQuestion"
              @toggle-analysis="toggleAnalysisExpand"
              @submit="submitExam"
            />
          </div>
        </div>
        
        <!-- 右侧栏：答题卡、AI学习提示、知识点解释、提交操作 -->
        <aside class="exam-sidebar">
          <div class="sidebar-sticky-wrapper">
            <!-- 答题卡卡片 -->
            <div class="sidebar-card answer-card-section">
              <div class="card-title-row">
                <span class="title">答题卡</span>
              </div>
              
              <!-- 状态图例 -->
              <div class="legend-row">
                <template v-if="showAnswer">
                  <div class="legend-item"><span class="dot correct"></span>正确</div>
                  <div class="legend-item"><span class="dot wrong"></span>错误</div>
                  <div class="legend-item"><span class="dot pending"></span>待批阅</div>
                  <div class="legend-item"><span class="dot unanswered"></span>未答</div>
                </template>
                <template v-else>
                  <div class="legend-item"><span class="dot answered"></span>已答</div>
                  <div class="legend-item"><span class="dot unanswered"></span>未答</div>
                </template>
                <div class="legend-item"><span class="dot active"></span>当前</div>
                <div class="legend-item"><span class="dot flagged"></span>标记</div>
              </div>
              
              <!-- 题目网格 -->
              <div class="answers-grid">
                <button
                  v-for="idx in questions.length"
                  :key="idx"
                  type="button"
                  class="grid-number"
                  :class="{
                    active: idx === currentActiveIndex,
                    answered: isIndexAnswered(idx),
                    'result-correct': isIndexResultCorrect(idx),
                    'result-wrong': isIndexResultWrong(idx),
                    'result-pending': isIndexResultPending(idx),
                    flagged: flaggedQuestions.has(idx)
                  }"
                  @click="scrollToQuestion(idx)"
                >
                  {{ idx }}
                  <!-- 对勾图标 -->
                  <span v-if="isIndexAnswered(idx) && !flaggedQuestions.has(idx)" class="mini-check">
                    <svg viewBox="0 0 24 24" width="8" height="8" fill="none" stroke="currentColor" stroke-width="4">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                  <!-- 旗标图标 -->
                  <span v-if="flaggedQuestions.has(idx)" class="mini-flag">
                    <svg viewBox="0 0 24 24" width="8" height="8" fill="currentColor">
                      <path d="M12.4 5H18v10h-4.6l-.4-2H8v5H6V4h6.8l.6 1z"/>
                    </svg>
                  </span>
                </button>
              </div>
            </div>
            
            <!-- AI学习提示卡片 -->
            <div class="sidebar-card ai-tips-section">
              <div class="card-title-row">
                <span class="icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="color: #14b8a6;">
                    <rect x="3" y="11" width="18" height="10" rx="2"/>
                    <circle cx="12" cy="5" r="2"/>
                    <path d="M12 7v4"/>
                    <line x1="8" y1="16" x2="8" y2="16"/>
                    <line x1="16" y1="16" x2="16" y2="16"/>
                  </svg>
                </span>
                <span class="title">AI学习提示</span>
              </div>
              <div class="ai-tips-content">
                <ul class="tips-list">
                  <li>
                    <span class="tip-label">当前题考查：</span>
                    <span class="tip-value">{{ activeQuestionKpText }}</span>
                  </li>
                  <li>
                    <span class="tip-label">你的薄弱点：</span>
                    <span class="tip-value">{{ activeQuestionWeakText }}</span>
                  </li>
                  <li>
                    <span class="tip-label">建议：</span>
                    <span class="tip-value">{{ activeQuestionAdviceText }}</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <!-- 知识点解释卡片 (可折叠) -->
            <div class="sidebar-card kp-explain-section" :class="{ collapsed: isKpCollapsed }">
              <div class="card-title-row clickable" @click="isKpCollapsed = !isKpCollapsed">
                <span class="icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="color: #5b8def;">
                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                </span>
                <span class="title">知识点解释</span>
                <span class="arrow-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" class="arrow-svg">
                    <polyline points="18 15 12 9 6 15"/>
                  </svg>
                </span>
              </div>
              <div class="kp-explain-content" v-show="!isKpCollapsed">
                <p class="explain-text">{{ activeQuestionExplanation }}</p>
              </div>
            </div>
            
            <!-- 提交测评按钮 Card -->
            <div class="submit-card-section">
              <button
                v-if="!showAnswer"
                type="button"
                class="btn-sidebar-submit"
                :disabled="isSubmitting"
                @click="submitExam"
              >
                {{ isSubmitting ? '提交中...' : '提交测评' }}
              </button>
              <template v-else>
                <button
                  type="button"
                  class="btn-sidebar-submit report-btn"
                  :disabled="reportLoading"
                  @click="handleViewReport"
                >
                  {{ reportLoading ? '查询中...' : '查看练习分析报告' }}
                </button>
                <button 
                  type="button" 
                  class="btn-sidebar-submit return-btn" 
                  @click="goBack"
                >
                  返回测评中心
                </button>
              </template>
              <div v-if="!showAnswer" class="shortcut-tip">
                按 <strong>Ctrl + Enter</strong> 提交
                <el-tooltip content="在任意作答焦点下按 Ctrl + Enter 即可快捷提交试卷" placement="top">
                  <el-icon class="shortcut-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <el-dialog
        v-model="reportDialogVisible"
        width="880px"
        top="4vh"
        class="practice-report-dialog"
        :close-on-click-modal="true"
        :destroy-on-close="false"
      >
        <template #header>
          <div class="report-dialog-header">
            <div class="report-title-block">
              <div class="report-title-line">
                <span class="report-title-mark">析</span>
                <span class="report-title-text">练习分析报告</span>
                <span class="report-status-badge">
                  {{ selectedReport?.generatedBy === 'agent' ? 'AI分析完成' : '系统分析完成' }}
                </span>
              </div>
              <p>基于本次作答、知识点掌握情况和判分结果生成</p>
            </div>
            <span v-if="selectedReport?.finishedAt" class="report-finished-time">
              {{ formatDateTime(selectedReport.finishedAt) }}
            </span>
          </div>
        </template>

        <div v-if="selectedReport" class="report-content">
          <section class="report-overview-card">
            <div class="report-overview-main">
              <span>本次表现</span>
              <strong>{{ formatScore(selectedReport.actualScore) }}/{{ formatScore(selectedReport.totalScore) }}</strong>
              <p>报告会结合正确率、薄弱知识点和后续复习建议，帮助你明确下一步练习方向。</p>
            </div>
            <div class="report-score-grid">
              <div class="report-score-item">
                <span class="label">正确率</span>
                <strong>{{ formatPercent(selectedReport.accuracy) }}</strong>
              </div>
              <div class="report-score-item">
                <span class="label">薄弱点</span>
                <strong>{{ selectedReport.weakPoints?.length || 0 }}</strong>
              </div>
              <div class="report-score-item">
                <span class="label">优势点</span>
                <strong>{{ selectedReport.strongPoints?.length || 0 }}</strong>
              </div>
              <div class="report-score-item">
                <span class="label">建议数</span>
                <strong>{{ selectedReport.learningSuggestions?.length || 0 }}</strong>
              </div>
            </div>
          </section>

          <section class="report-section" v-if="selectedReport.reportContent">
            <div class="report-section-title">
              <span class="section-dot overall"></span>
              <h3>整体分析</h3>
            </div>
            <p class="report-text">{{ selectedReport.reportContent }}</p>
          </section>

          <div class="report-analysis-grid">
            <section class="report-section" v-if="selectedReport.weakPoints?.length">
              <div class="report-section-title">
                <span class="section-dot weak"></span>
                <h3>需要加强</h3>
              </div>
              <div class="report-list">
                <div v-for="(item, idx) in selectedReport.weakPoints" :key="'weak-' + idx" class="report-list-item weak">
                  <div class="report-list-rank">{{ idx + 1 }}</div>
                  <div class="report-list-body">
                    <strong>{{ reportItemTitle(item, 'knowledgePoint') }}</strong>
                    <span>得分率 {{ formatPercent(item.scoreRate ?? item.accuracy) }}，{{ item.correctCount ?? 0 }}/{{ item.totalCount ?? 0 }} 题正确</span>
                  </div>
                </div>
              </div>
            </section>

            <section class="report-section" v-if="selectedReport.strongPoints?.length">
              <div class="report-section-title">
                <span class="section-dot strong"></span>
                <h3>掌握较好</h3>
              </div>
              <div class="report-list">
                <div v-for="(item, idx) in selectedReport.strongPoints" :key="'strong-' + idx" class="report-list-item strong">
                  <div class="report-list-rank">{{ idx + 1 }}</div>
                  <div class="report-list-body">
                    <strong>{{ reportItemTitle(item, 'knowledgePoint') }}</strong>
                    <span>得分率 {{ formatPercent(item.scoreRate ?? item.accuracy) }}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section class="report-section" v-if="selectedReport.learningSuggestions?.length">
            <div class="report-section-title">
              <span class="section-dot suggestion"></span>
              <h3>后续练习建议</h3>
            </div>
            <div class="suggestion-list">
              <div v-for="(item, idx) in selectedReport.learningSuggestions" :key="'suggestion-' + idx" class="suggestion-item">
                <span class="suggestion-index">{{ idx + 1 }}</span>
                <div class="suggestion-body">
                  <strong>{{ String(item.title || `建议 ${idx + 1}`) }}</strong>
                  <span v-if="item.reason">{{ String(item.reason) }}</span>
                  <p>{{ String(item.action || item.description || '') }}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <template #footer>
          <div class="report-dialog-footer">
            <el-button @click="reportDialogVisible = false">关闭</el-button>
            <el-button type="primary" @click="goBack">返回测评中心</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 提示未完成弹窗 -->
      <div class="modal-overlay" v-if="showUnfinishedModal" @click.self="showUnfinishedModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <span class="modal-title">提示</span>
            <button type="button" class="modal-close-btn" @click="showUnfinishedModal = false">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            您还有未做完的 <span class="highlight-types">{{ unfinishedTypesText }}</span>，确认提交吗？
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-modal cancel" @click="showUnfinishedModal = false">取消</button>
            <button type="button" class="btn-modal confirm" @click="confirmSubmit">提交</button>
          </div>
        </div>
      </div>

      <!-- 算法题本地测试弹窗：用于录屏阶段模拟真实判题等待与成功反馈。 -->
      <div class="modal-overlay algorithm-submit-overlay" v-if="showAlgorithmMockSubmitDialog">
        <div class="modal-card algorithm-submit-card">
          <div class="algorithm-submit-status">
            <span
              v-if="algorithmMockSubmitStatus === 'testing'"
              class="algorithm-submit-spinner"
              aria-hidden="true"
            ></span>
            <span v-else class="algorithm-submit-success" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.8">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
          </div>
          <div class="algorithm-submit-title">{{ algorithmMockSubmitText }}</div>
          <div class="algorithm-submit-subtitle">
            {{ algorithmMockSubmitStatus === 'testing' ? '正在校验样例输出' : '所有测试样例均已通过' }}
          </div>
          <div class="modal-footer algorithm-submit-footer" v-if="algorithmMockSubmitStatus === 'success'">
            <button type="button" class="btn-modal confirm" @click="closeAlgorithmMockSubmitDialog">知道了</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Warning, InfoFilled, QuestionFilled } from '@element-plus/icons-vue'
import AppLayout from '@/components/layout/AppLayout.vue'

// 导入重构的拆分子组件
import QuizSummaryCard from './components/QuizSummaryCard.vue'
import QuestionCard from './components/QuestionCard.vue'
import CodeQuestionWorkspace from './components/CodeQuestionWorkspace.vue'

import { fetchEvaluationQuestions, type EvaluationQuestion } from '@/api/evaluationQuestion'
import {
  fetchSessionQuestions,
  startSession,
  submitAnswers,
  getSessionResult,
  submitExamAnswers,
  getExamResult,
  getSessionReport,
  type SessionResultVO,
  type AnswerDetailVO,
  type SessionReportVO
} from '@/api/evaluationSession'
import {
  getQuestionAnswerText,
  getQuestionTypeName,
  normalizeQuestionOptions
} from '@/utils/examQuestionMapper'
import { getMockAlgorithmQuestions } from '@/mocks/algorithmQuestionMock'

const route = useRoute()
const router = useRouter()

const goBack = () => {
  if (spaceId.value) {
    router.push({ path: '/exam', query: { spaceId: spaceId.value } })
  } else {
    router.back()
  }
}

const loading = ref(false)
const questions = ref<EvaluationQuestion[]>([])
const answers = ref<Record<string | number, string>>({})
const codeLanguages = ref<Record<string | number, string>>({})
const showAnswer = ref(false)

// 后端判分结果
const gradingResult = ref<SessionResultVO | null>(null)
const isSubmitting = ref(false)
const reportLoading = ref(false)
const reportDialogVisible = ref(false)
const selectedReport = ref<SessionReportVO | null>(null)

const ALGORITHM_MOCK_SUBMIT_DELAY_MS = 2000
const showAlgorithmMockSubmitDialog = ref(false)
const algorithmMockSubmitStatus = ref<'testing' | 'success'>('testing')
const algorithmMockSubmitText = ref('正在测试中')
let algorithmMockSubmitTimer: number | null = null

const examTitle = computed(() => String(route.query.title || '章节测验'))
const spaceId = computed(() => route.query.spaceId ? String(route.query.spaceId) : undefined)
const taskId = computed(() => route.query.taskId ? String(route.query.taskId) : undefined)
const sessionId = computed(() => route.query.sessionId ? String(route.query.sessionId) : undefined)
const rawStatus = computed(() => route.query.rawStatus ? String(route.query.rawStatus) : undefined)
// 算法题后端判题链路未接入前，命中代码/算法类入口时使用前端本地 mock。
const isAlgorithmMockSession = computed(() => {
  const explicitMock = String(route.query.mockAlgorithm || route.query.algorithmMock || route.query.localMock || '').toLowerCase()
  const questionType = String(route.query.questionType || route.query.type || '').toLowerCase()
  const title = examTitle.value

  return ['1', 'true', 'algorithm', 'code'].includes(explicitMock)
    || ['algorithm', 'code', 'sql'].includes(questionType)
    || /算法|编程|代码|链表|排序/.test(title)
})
const reportSessionId = computed(() => isAlgorithmMockSession.value ? undefined : (sessionId.value || taskId.value))
const isFinishedSession = computed(() => {
  const status = String(rawStatus.value || '').toLowerCase()
  return ['finished', 'completed', 'complete', 'done', 'graded'].includes(status)
})
const gradingDetailMap = computed(() => {
  const map = new Map<string, AnswerDetailVO>()
  gradingResult.value?.detail?.forEach(detail => {
    map.set(String(detail.questionId), detail)
  })
  return map
})

const numberMap = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

const totalScore = computed(() => {
  return questions.value.reduce((sum, q) => sum + (q.score || 0), 0).toFixed(1)
})

// 活跃题目交互状态
const currentActiveIndex = ref(1)
const flaggedQuestions = ref<Set<number>>(new Set())
const favoritedQuestions = ref<Set<number>>(new Set())
const isKpCollapsed = ref(false)

let isScrolling = false

const toggleFlag = (index: number) => {
  if (flaggedQuestions.value.has(index)) {
    flaggedQuestions.value.delete(index)
  } else {
    flaggedQuestions.value.add(index)
  }
}

const toggleFavorite = (index: number) => {
  if (favoritedQuestions.value.has(index)) {
    favoritedQuestions.value.delete(index)
  } else {
    favoritedQuestions.value.add(index)
  }
}

const showKpExplanation = (q: any) => {
  currentActiveIndex.value = q.globalIndex
  isKpCollapsed.value = false
  scrollToQuestion(q.globalIndex)
}

const goPrevQuestion = (index: number) => {
  if (index > 1) {
    scrollToQuestion(index - 1)
  }
}

const goNextQuestion = (index: number) => {
  if (index < questions.value.length) {
    scrollToQuestion(index + 1)
  }
}

const scrollToQuestion = (index: number) => {
  currentActiveIndex.value = index
  const el = document.getElementById(`question-card-${index}`)
  if (el) {
    isScrolling = true
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => {
      isScrolling = false
    }, 800)
  }
}

const isIndexAnswered = (index: number) => {
  const q = numberedQuestionsList.value.find(item => item.globalIndex === index)
  if (showAnswer.value && q) {
    const detail = gradingDetailMap.value.get(String(q.id))
    if (detail) {
      return isResultDetailAnswered(q, detail)
    }
  }
  return q ? isQuestionAnswered(q) : false
}

const getIndexResultDetail = (index: number) => {
  if (!showAnswer.value) return undefined
  const q = numberedQuestionsList.value.find(item => item.globalIndex === index)
  return q ? gradingDetailMap.value.get(String(q.id)) : undefined
}

const isIndexResultCorrect = (index: number) => {
  const detail = getIndexResultDetail(index)
  return !!detail && detail.isCorrect === true
}

const isIndexResultWrong = (index: number) => {
  const q = numberedQuestionsList.value.find(item => item.globalIndex === index)
  const detail = getIndexResultDetail(index)
  return !!q && !!detail && isResultDetailAnswered(q, detail) && detail.isCorrect === false
}

const isIndexResultPending = (index: number) => {
  const q = numberedQuestionsList.value.find(item => item.globalIndex === index)
  const detail = getIndexResultDetail(index)
  return !!q && !!detail && isResultDetailAnswered(q, detail) && (detail.status === 'pending_review' || detail.isCorrect == null)
}

const setActiveQuestion = (index: number) => {
  if (!isScrolling) {
    currentActiveIndex.value = index
  }
}

// 自动滚动监测
const handleScroll = () => {
  if (isScrolling) return
  const cards = numberedQuestionsList.value.map(q => {
    const el = document.getElementById(`question-card-${q.globalIndex}`)
    return { index: q.globalIndex, el }
  })
  
  const viewportHeight = window.innerHeight
  let closestIndex = 1
  let minDistance = Infinity
  
  cards.forEach(card => {
    if (card.el) {
      const rect = card.el.getBoundingClientRect()
      const cardCenter = rect.top + rect.height / 2
      const distance = Math.abs(cardCenter - viewportHeight / 2)
      if (distance < minDistance) {
        minDistance = distance
        closestIndex = card.index
      }
    }
  })
  
  currentActiveIndex.value = closestIndex
}

let scrollTimer: any = null
const onWindowScroll = () => {
  if (scrollTimer) clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    handleScroll()
  }, 100)
}

// 快捷键提交
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault()
    if (!showAnswer.value && !isSubmitting.value) {
      submitExam()
    }
  }
}

const groupedQuestions = computed(() => {
  const groups: Record<string, any[]> = {}

  // 先按题型分组
  questions.value.forEach(q => {
    if (!groups[q.questionType]) {
      groups[q.questionType] = []
    }
    groups[q.questionType].push(q)
  })

  // 每组内部按 sortOrder 排序
  Object.values(groups).forEach(group => {
    group.sort((a, b) => {
      const sa = a.sortOrder ?? 0
      const sb = b.sortOrder ?? 0
      if (sa !== sb) return sa - sb
      return String(a.id).localeCompare(String(b.id))
    })
  })

  // 全局序号：按固定题型顺序依次编号
  let globalIndex = 1
  const order = ['single_choice', 'multiple_choice', 'fill_blank', 'judge', 'code', 'sql', 'short_answer', 'essay']
  const result: any[] = []
  
  order.forEach(type => {
    if (groups[type] && groups[type].length > 0) {
      const numberedQuestions = groups[type].map(q => ({ ...q, globalIndex: globalIndex++ }))
      result.push({
        type,
        typeName: getQuestionTypeName({ questionType: type } as any),
        questions: numberedQuestions
      })
    }
  })

  Object.keys(groups).forEach(type => {
    if (!order.includes(type)) {
      const numberedQuestions = groups[type].map(q => ({ ...q, globalIndex: globalIndex++ }))
      result.push({
        type,
        typeName: getQuestionTypeName({ questionType: type } as any),
        questions: numberedQuestions
      })
    }
  })
  
  return result
})

// 编程类题目使用专属在线 OJ 工作台布局，避免被普通试卷题卡压缩。
const isCodingQuestion = (q: EvaluationQuestion | any) => {
  return q?.questionType === 'code' || q?.questionType === 'sql'
}

// 只要当前测评包含代码题，就启用三栏编程测评模式。
const hasCodingQuestions = computed(() => {
  return questions.value.some(q => isCodingQuestion(q))
})

// 扁平化的全局题目列表（带 globalIndex）
const numberedQuestionsList = computed(() => {
  const list: any[] = []
  groupedQuestions.value.forEach(group => {
    group.questions.forEach((q: any) => {
      list.push(q)
    })
  })
  return list
})

// 当前聚焦题目数据
const activeQuestion = computed(() => {
  return numberedQuestionsList.value.find(q => q.globalIndex === currentActiveIndex.value)
})

// 动态 AI 提示内容
const activeQuestionKpText = computed(() => {
  const q = activeQuestion.value
  if (!q) return '暂无考点'
  if (q.knowledgePoints && q.knowledgePoints.length) {
    return q.knowledgePoints.join('、')
  }
  if (q.tags && q.tags.length) {
    return q.tags.join('、')
  }
  return '当前题型基础理论'
})

const activeQuestionWeakText = computed(() => {
  const q = activeQuestion.value
  if (!q) return '暂无薄弱点评估'
  const kps = q.knowledgePoints || q.tags || []
  if (kps.length > 0) {
    return kps.slice(0, 2).join('、')
  }
  return '概念细节与基础应用'
})

const activeQuestionAdviceText = computed(() => {
  const q = activeQuestion.value
  if (!q) return '理清题意，谨慎作答'
  if (q.questionType === 'single_choice' || q.questionType === 'multiple_choice') {
    return '先排除明显错误选项，再对比其余选项在核心定义与原理上的差异'
  } else if (q.questionType === 'judge') {
    return '仔细阅读题干表述，警惕过于绝对的修饰词，对比标准概念'
  } else if (q.questionType === 'fill_blank') {
    return '注意填空的书写规范，精确到核心关键词或数学公式符号'
  } else {
    return '理清答题脉络，分步骤阐述核心算法或分析过程，逻辑必须严密'
  }
})

const activeQuestionExplanation = computed(() => {
  const q = activeQuestion.value
  if (!q) return '暂无考点解析。'
  return q.explanation || '本题考核该知识点的基本概念与应用。暂未生成详细AI解析，请结合答题反馈与教材相应章节进行复习。'
})

// 进度统计
const answeredCount = computed(() => {
  return questions.value.filter(q => isQuestionAnswered(q)).length
})

const progressPercentage = computed(() => {
  if (!questions.value.length) return 0
  return Math.round((answeredCount.value / questions.value.length) * 100)
})

const estimatedAccuracy = computed(() => {
  if (showAnswer.value && gradingResult.value) {
    const total = gradingResult.value.totalScore || 1
    const actual = gradingResult.value.actualScore || 0
    return Math.round((actual / total) * 100)
  }
  const total = questions.value.length || 1
  const answered = answeredCount.value
  if (answered === 0) return 75
  return Math.min(95, Math.round(75 + (answered / total) * 5))
})

const difficultyDistributionText = computed(() => {
  if (!questions.value.length) return '应用/分析为主'
  const diffs = questions.value.map(q => q.difficulty || 3)
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length
  
  if (avgDiff <= 1.8) return '识记基础为主'
  if (avgDiff <= 2.8) return '理解掌握为主'
  if (avgDiff <= 3.8) return '应用/分析为主'
  if (avgDiff <= 4.8) return '综合设计为主'
  return '进阶推理为主'
})

const knowledgeCoverageTags = computed(() => {
  const set = new Set<string>()
  questions.value.forEach(q => {
    if (q.tags) q.tags.forEach(t => set.add(t))
    if (q.knowledgePoints) q.knowledgePoints.forEach(kp => set.add(kp))
  })
  return Array.from(set).slice(0, 3)
})

const fetchQuestions = async () => {
  loading.value = true
  try {
    if (isAlgorithmMockSession.value) {
      // 算法题第一阶段不请求后端，直接使用单链表插入排序模板 mock 数据。
      questions.value = getMockAlgorithmQuestions()
      gradingResult.value = null
      showAnswer.value = false
      answers.value = {}
      codeLanguages.value = Object.fromEntries(
        questions.value.map(q => [q.id, defaultCodeLanguage(q)])
      )
    } else if (sessionId.value) {
      // 有 sessionId → 从 session API 加载题目
      questions.value = await fetchSessionQuestions(sessionId.value as any)
      
      // 仅当后端状态为 'todo'（从未开始）时才调用 start接口
      if (rawStatus.value === 'todo') {
        try {
          await startSession(sessionId.value as any)
        } catch {
          // 忽略异常
        }
      }

      // 如果是已完成状态，自动加载结果
      if (isFinishedSession.value) {
        showAnswer.value = true
        try {
          const result = await getSessionResult(sessionId.value as any)
          gradingResult.value = result
          applyResultUserAnswers(result)
        } catch (e) {
          console.error('获取历史答题结果失败:', e)
        }
      }
    } else if (spaceId.value) {
      // 旧流程：从题库 API 加载（无 session，仅 client-side grading）
      questions.value = await fetchEvaluationQuestions({
        learningSpaceId: spaceId.value,
        limit: 100,
        taskId: taskId.value || undefined
      })

      if (isFinishedSession.value && taskId.value) {
        showAnswer.value = true
        try {
          const result = await getExamResult(taskId.value as any)
          gradingResult.value = result as any
          applyResultUserAnswers(result as any)
        } catch (e) {
          console.error('获取历史答题结果失败:', e)
        }
      }
    } else {
      ElMessage.warning('缺少学习空间或会话ID，无法开始测评')
    }

    if (questions.value.length > 0) {
      currentActiveIndex.value = 1
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '题目加载失败')
  } finally {
    loading.value = false
  }
}

const toggleOption = (q: EvaluationQuestion, label: string) => {
  if (showAnswer.value) return
  
  const currentAns = answers.value[q.id as any] || ''
  
  if (q.questionType === 'single_choice') {
    answers.value[q.id as any] = label
  } else if (q.questionType === 'multiple_choice') {
    let arr = currentAns ? currentAns.split('、') : []
    if (arr.includes(label)) {
      arr = arr.filter(x => x !== label)
    } else {
      arr.push(label)
    }
    answers.value[q.id as any] = arr.sort().join('、')
  }
}

const toggleJudge = (q: EvaluationQuestion, val: string) => {
  if (showAnswer.value) return
  answers.value[q.id as any] = val
}

const updateFillBlankValueIndexed = (q: EvaluationQuestion, index: number, val: string) => {
  if (showAnswer.value) return
  
  // 模拟 fill blank 的获取和更新
  const ans = answers.value[q.id as any] || ''
  const parts = ans.split(';;')
  
  // 获取空位数
  const matches = q.stem.match(/_+/g)
  let count = 1
  if (matches && matches.length > 0) {
    count = matches.length
  } else {
    const text = getQuestionAnswerText(q.correctAnswer) || '无'
    if (text !== '无') count = text.split('、').length
  }
  
  const currentValues: string[] = []
  for (let i = 0; i < count; i++) {
    currentValues.push(parts[i] || '')
  }
  
  currentValues[index] = val.trim()
  answers.value[q.id as any] = currentValues.join(';;')
}

// 支持主观题 input 触发
const updateEssayValue = (q: EvaluationQuestion, val: string) => {
  if (showAnswer.value) return
  answers.value[q.id as any] = val
}

const updateCodeValue = (q: EvaluationQuestion, val: string) => {
  if (showAnswer.value) return
  answers.value[q.id as any] = val
  if (!codeLanguages.value[q.id as any]) {
    codeLanguages.value[q.id as any] = defaultCodeLanguage(q)
  }
}

const updateCodeLanguage = (q: EvaluationQuestion, language: string) => {
  if (showAnswer.value) return
  codeLanguages.value[q.id as any] = language
}

const defaultCodeLanguage = (q: EvaluationQuestion) => {
  const raw = q.correctAnswer?.allowedLanguages
  if (Array.isArray(raw) && raw.length > 0) {
    return String(raw[0])
  }
  return q.questionType === 'sql' ? 'sql' : 'python'
}

const isQuestionAnswered = (q: EvaluationQuestion) => {
  const ans = answers.value[q.id as any]
  if (!ans) return false
  if (q.questionType === 'fill_blank') {
    // 检查是否全填了
    const parts = ans.split(';;')
    const matches = q.stem.match(/_+/g)
    let count = 1
    if (matches && matches.length > 0) {
      count = matches.length
    } else {
      const text = getQuestionAnswerText(q.correctAnswer) || '无'
      if (text !== '无') count = text.split('、').length
    }
    const currentValues: string[] = []
    for (let i = 0; i < count; i++) {
      currentValues.push(parts[i] || '')
    }
    return currentValues.length > 0 && currentValues.every(v => v.trim() !== '')
  }
  return ans.trim() !== ''
}

const showUnfinishedModal = ref(false)
const unfinishedTypesText = ref('')

// 清理算法题本地测试弹窗的延迟计时器，避免切页或重复提交后旧状态覆盖当前界面。
const clearAlgorithmMockSubmitTimer = () => {
  if (algorithmMockSubmitTimer !== null) {
    window.clearTimeout(algorithmMockSubmitTimer)
    algorithmMockSubmitTimer = null
  }
}

const closeAlgorithmMockSubmitDialog = () => {
  if (algorithmMockSubmitStatus.value === 'success') {
    showAlgorithmMockSubmitDialog.value = false
  }
}

// 算法题暂不接后端判题，提交时只模拟真实测试等待，并在同一个弹窗内切换成功结果。
const handleAlgorithmMockSubmit = () => new Promise<void>((resolve) => {
  clearAlgorithmMockSubmitTimer()
  algorithmMockSubmitStatus.value = 'testing'
  algorithmMockSubmitText.value = '正在测试中'
  showAlgorithmMockSubmitDialog.value = true

  algorithmMockSubmitTimer = window.setTimeout(() => {
    algorithmMockSubmitStatus.value = 'success'
    algorithmMockSubmitText.value = '算法题测试成功，答案正确'
    showAnswer.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })
    algorithmMockSubmitTimer = null
    resolve()
  }, ALGORITHM_MOCK_SUBMIT_DELAY_MS)
})

const submitExam = () => {
  // 提交期间屏蔽答题卡和侧栏的重复触发。
  if (isSubmitting.value || showAnswer.value) return
  const unfinishedTypes: string[] = []
  groupedQuestions.value.forEach(group => {
    const hasUnanswered = group.questions.some(q => !isQuestionAnswered(q))
    if (hasUnanswered) {
      unfinishedTypes.push(group.typeName)
    }
  })

  if (unfinishedTypes.length > 0) {
    unfinishedTypesText.value = unfinishedTypes.join('、')
    showUnfinishedModal.value = true
  } else {
    doSubmitExam()
  }
}

const confirmSubmit = () => {
  if (isSubmitting.value || showAnswer.value) return
  showUnfinishedModal.value = false
  doSubmitExam()
}

const buildUserAnswer = (q: EvaluationQuestion): Record<string, unknown> => {
  const userAns = answers.value[q.id as any] || ''
  switch (q.questionType) {
    case 'single_choice':
      return { selectedOptions: userAns ? [userAns] : [] }
    case 'multiple_choice':
      return { selectedOptions: userAns ? userAns.split('、').filter(Boolean) : [] }
    case 'judge': {
      const val = userAns === 'true' ? '正确' : userAns === 'false' ? '错误' : userAns
      return { value: val }
    }
    case 'fill_blank':
      return { blanks: userAns ? userAns.split(';;') : [] }
    case 'code':
    case 'sql':
      return {
        language: codeLanguages.value[q.id as any] || defaultCodeLanguage(q),
        code: userAns
      }
    default:
      return { text: userAns }
  }
}

const normalizeBooleanAnswer = (value: unknown): string => {
  const text = String(value ?? '').trim()
  if (text === '正确' || text === '对' || text.toLowerCase() === 'true' || text === '1') {
    return 'true'
  }
  if (text === '错误' || text === '错' || text.toLowerCase() === 'false' || text === '0') {
    return 'false'
  }
  return text
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const hasMeaningfulAnswerValue = (value: unknown): boolean => {
  if (value == null) return false
  if (typeof value === 'string') return value.trim() !== ''
  if (typeof value === 'number' || typeof value === 'boolean') return true
  if (Array.isArray(value)) return value.some(item => hasMeaningfulAnswerValue(item))
  if (isPlainObject(value)) return Object.values(value).some(item => hasMeaningfulAnswerValue(item))
  return false
}

const firstAnswerField = (userAnswer: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(userAnswer, key)) {
      return userAnswer[key]
    }
  }
  return undefined
}

const answerValueToText = (value: unknown, separator = '、') => {
  if (Array.isArray(value)) {
    return value.map(v => String(v ?? '').trim()).filter(Boolean).join(separator)
  }
  return value == null ? '' : String(value).trim()
}

const resultUserAnswerToInputValue = (q: EvaluationQuestion, rawUserAnswer?: unknown): string => {
  const userAnswer = isPlainObject(rawUserAnswer) ? rawUserAnswer : undefined
  if (!userAnswer) {
    if (Array.isArray(rawUserAnswer)) {
      return answerValueToText(rawUserAnswer, q.questionType === 'fill_blank' ? ';;' : '、')
    }
    return rawUserAnswer == null ? '' : String(rawUserAnswer).trim()
  }

  if (q.questionType === 'single_choice' || q.questionType === 'multiple_choice') {
    const selected = firstAnswerField(userAnswer, [
      'selectedOptions',
      'selectedOption',
      'option',
      'options',
      'answer',
      'value'
    ])
    return answerValueToText(selected)
  }

  if (q.questionType === 'judge') {
    const value = firstAnswerField(userAnswer, ['value', 'answer', 'selectedOption', 'text'])
    return normalizeBooleanAnswer(value)
  }

  if (q.questionType === 'fill_blank') {
    const blanks = firstAnswerField(userAnswer, ['blanks', 'blankAnswers', 'answers', 'value', 'text'])
    return answerValueToText(blanks, ';;')
  }

  const text = firstAnswerField(userAnswer, ['text', 'code', 'answer', 'value'])
  return text == null ? '' : String(text)
}

const isResultDetailAnswered = (q: EvaluationQuestion, detail: AnswerDetailVO) => {
  const value = resultUserAnswerToInputValue(q, detail.userAnswer)
  if (value.trim()) return true
  return hasMeaningfulAnswerValue(detail.userAnswer)
}

const resultUserAnswerToCodeLanguage = (q: EvaluationQuestion, rawUserAnswer?: unknown): string => {
  const userAnswer = isPlainObject(rawUserAnswer) ? rawUserAnswer : undefined
  const language = userAnswer ? firstAnswerField(userAnswer, ['language', 'lang', 'runtime']) : undefined
  return language == null || String(language).trim() === '' ? defaultCodeLanguage(q) : String(language)
}

const applyResultUserAnswers = (result: SessionResultVO | null | undefined) => {
  if (!result?.detail?.length) return
  const questionMap = new Map(questions.value.map(q => [String(q.id), q]))
  result.detail.forEach(detail => {
    const q = questionMap.get(String(detail.questionId))
    if (!q) return
    if (q.questionType === 'code' || q.questionType === 'sql') {
      codeLanguages.value[q.id as any] = resultUserAnswerToCodeLanguage(q, detail.userAnswer)
    }
    const value = resultUserAnswerToInputValue(q, detail.userAnswer)
    if (value) {
      answers.value[q.id as any] = value
    }
  })
}

const handleViewReport = async () => {
  const id = reportSessionId.value
  if (!id) {
    ElMessage.info('当前练习暂未关联可生成报告的测评任务')
    return
  }

  reportLoading.value = true
  try {
    const report = await getSessionReport(id)
    if (report.status !== 'ready') {
      const message = report.message || report.errorMessage || '练习分析报告尚未生成，请稍后再来查看。'
      if (report.status === 'failed') {
        ElMessage.warning(message)
      } else {
        ElMessage.info(message)
      }
      return
    }

    selectedReport.value = report
    reportDialogVisible.value = true
  } catch (error: any) {
    ElMessage.error(error?.message || '报告查询失败，请稍后重试')
  } finally {
    reportLoading.value = false
  }
}

const formatScore = (value?: number | string | null) => {
  const num = Number(value ?? 0)
  if (!Number.isFinite(num)) return '0'
  return Number.isInteger(num) ? String(num) : num.toFixed(1)
}

const formatPercent = (value?: unknown) => {
  const num = Number(value ?? 0)
  if (!Number.isFinite(num)) return '0%'
  const percent = num <= 1 ? num * 100 : num
  return `${percent.toFixed(1)}%`
}

const reportItemTitle = (item: Record<string, unknown>, primaryKey: string) => {
  return String(item[primaryKey] || item.name || item.label || '未标注知识点')
}

const formatDateTime = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const doSubmitExam = async () => {
  // 同步加锁，避免两处提交按钮在一次渲染前同时发起判分请求。
  if (isSubmitting.value || showAnswer.value) return
  isSubmitting.value = true
  try {
    // 构建提交 payload
    const answerItems = questions.value.map(q => ({
      questionId: q.id as any,
      userAnswer: buildUserAnswer(q),
      answerDurationSeconds: 0,
      usedHint: 0
    }))

    if (isAlgorithmMockSession.value) {
      await handleAlgorithmMockSubmit()
      return
    } else if (sessionId.value) {
      // 后端 session 模式：调用 submit API
      const result = await submitAnswers(sessionId.value as any, { answers: answerItems })
      gradingResult.value = result
      applyResultUserAnswers(result)
      ElMessage.success(`提交成功！客观题得分: ${result.objectiveScore}/${result.objectiveTotal}${result.subjectivePending > 0 ? `，${result.subjectivePending}道主观题等待AI批阅` : ''}`)
    } else if (taskId.value) {
      // 任务模式：直接提交到后端判分
      const result = await submitExamAnswers(taskId.value as any, spaceId.value as any, { answers: answerItems })
      gradingResult.value = result as any
      applyResultUserAnswers(result as any)
      ElMessage.success(`提交成功！客观题得分: ${result.objectiveScore}/${result.objectiveTotal}${result.subjectivePending > 0 ? `，${result.subjectivePending}道主观题等待AI批阅` : ''}`)
    } else {
      // 旧流程：仅 client-side grading
      ElMessage.success('提交测试成功（本地判分）')
    }

    showAnswer.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // 如果有主观题待判分，启动轮询
    if (gradingResult.value && gradingResult.value.subjectivePending > 0) {
      startPollingResult()
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '提交失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

let pollingTimer: ReturnType<typeof setInterval> | null = null

const startPollingResult = () => {
  if (!sessionId.value && !taskId.value) return
  pollingTimer = setInterval(async () => {
    try {
      let result
      if (sessionId.value) {
        result = await getSessionResult(sessionId.value as any)
      } else if (taskId.value) {
        result = await getExamResult(taskId.value as any)
      } else {
        return
      }
      gradingResult.value = result as any
      applyResultUserAnswers(result as any)
      if (result.subjectivePending === 0) {
        if (pollingTimer) clearInterval(pollingTimer)
        pollingTimer = null
        ElMessage.success('全部题目批阅完成！')
      }
    } catch {
      // 轮询失败忽略
    }
  }, 3000)
}

// 从 gradingResult 中获取某题的判分详情
const getQuestionGrading = (q: EvaluationQuestion): AnswerDetailVO | undefined => {
  return gradingResult.value?.detail?.find(d => String(d.questionId) === String(q.id))
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('scroll', onWindowScroll)
  fetchQuestions()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('scroll', onWindowScroll)
  clearAlgorithmMockSubmitTimer()
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
})

// 控制每道题解析的展开状态
const expandedAnalyses = ref<Record<string | number, boolean>>({})

// 切换解析展开状态
const toggleAnalysisExpand = (questionId: string | number) => {
  expandedAnalyses.value[questionId] = !expandedAnalyses.value[questionId]
}

// 是否已展开
const isAnalysisExpanded = (questionId: string | number) => {
  return !!expandedAnalyses.value[questionId]
}
</script>

<style scoped>
.exam-paper-container.practice-quiz-page {
  width: 100%;
  max-width: none;
  margin: 0;
  /* 顶部答题区采用紧凑留白，减少进入题目区域前的垂直占用。 */
  padding: 8px clamp(24px, 2.2vw, 40px) 32px;
  background: #f6f8fb;
  min-height: 100vh;
  transition: background 0.3s ease;
}

.back-nav {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  margin-bottom: 12px;
  padding: 6px 12px;
  border-radius: 10px;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  transition: all 0.2s ease;
  user-select: none;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.01);
}

.back-nav:hover {
  color: #14b8a6;
  border-color: rgba(20, 184, 166, 0.4);
  background: #f8fafc;
  transform: translateX(-1px);
}

.back-icon {
  transition: transform 0.2s ease;
}

.back-nav:hover .back-icon {
  transform: translateX(-2px);
}

.loading-box,
.empty-box {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: #ffffff;
  border: 1.5px solid #e8edf4;
  border-radius: 28px;
  font-size: 16px;
  color: #667085;
  font-weight: 700;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.03);
}

/* 左右双栏布局 */
.exam-session-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: clamp(16px, 1.4vw, 24px);
  align-items: start;
}

.exam-session-layout.coding-mode {
  grid-template-columns: minmax(0, 1fr) clamp(280px, 18vw, 320px);
}

.exam-main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.coding-main-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.question-group {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.coding-question-group {
  gap: 18px;
}

@media (min-width: 1025px) {
  .exam-paper-container.practice-quiz-page {
    width: calc(100% + var(--spacing-2xl));
    margin-left: calc(-0.5 * var(--spacing-2xl));
    margin-right: calc(-0.5 * var(--spacing-2xl));
  }
}

/* 右侧栏 Sticky */
.exam-sidebar {
  position: sticky;
  top: 0;
  z-index: 10;
  max-height: 100vh;
  overflow-y: auto;
  padding-right: 2px;
}

.coding-mode .exam-sidebar {
  top: 12px;
  max-height: calc(100vh - 24px);
}

.sidebar-sticky-wrapper {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 侧边栏卡片基础样式 */
.sidebar-card {
  background: #ffffff;
  border: 1px solid #e8edf4;
  border-radius: 20px;
  padding: 16px 18px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.03);
  transition: all 0.3s ease;
}

.sidebar-card .card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 800;
  color: #182230;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #edf2f7;
  transition: color 0.3s ease, border-color 0.3s ease;
}

.sidebar-card .card-title-row .title {
  font-size: 15.5px;
  font-weight: 800;
  color: #182230;
}

/* 答题卡图例 */
.legend-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
}

.legend-item .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-item .dot.answered {
  background: #f0fdfa;
  border: 1.5px solid #14b8a6;
}

.legend-item .dot.correct {
  background: #22c55e;
}

.legend-item .dot.wrong {
  background: #ef4444;
}

.legend-item .dot.pending {
  background: #f59e0b;
}

.legend-item .dot.active {
  background: #14b8a6;
}

.legend-item .dot.unanswered {
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
}

.legend-item .dot.flagged {
  background: #ef4444;
}

/* 题目网格 */
.answers-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.grid-number {
  aspect-ratio: 1;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  font-size: 15px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
}

.grid-number:hover {
  border-color: #14b8a6;
  color: #0f9f91;
  background: #f0fdfa;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(20, 184, 166, 0.1);
}

/* 答题卡网格状态 */
.grid-number.active {
  background: #14b8a6;
  border-color: #14b8a6;
  color: #ffffff;
  box-shadow: 0 6px 14px rgba(20, 184, 166, 0.25);
}

.grid-number.answered:not(.active) {
  background: #f0fdfa;
  border-color: #14b8a6;
  color: #0f9f91;
}

.grid-number.result-correct:not(.active) {
  background: #ecfdf3;
  border-color: #22c55e;
  color: #15803d;
}

.grid-number.result-wrong:not(.active) {
  background: #fef2f2;
  border-color: #ef4444;
  color: #b91c1c;
}

.grid-number.result-pending:not(.active) {
  background: #fffbeb;
  border-color: #f59e0b;
  color: #b45309;
}

.grid-number.flagged:not(.active) {
  border-color: #fca5a5;
  background: #fef2f2;
  color: #b91c1c;
}

/* 答题卡角标 */
.mini-check,
.mini-flag {
  position: absolute;
  top: 2px;
  right: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-check {
  color: #14b8a6;
}

.grid-number.active .mini-check {
  color: #ffffff;
}

.mini-flag {
  color: #ef4444;
}

.grid-number.active .mini-flag {
  color: #ffffff;
}

/* AI 学习提示 */
.ai-tips-content .tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ai-tips-content .tips-list li {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13.5px;
  line-height: 1.55;
}

.ai-tips-content .tip-label {
  font-weight: 800;
  color: #334155;
}

.ai-tips-content .tip-value {
  color: #475569;
}

/* 可折叠知识点解释 */
.kp-explain-section {
  transition: all 0.25s ease;
}

.kp-explain-section .card-title-row.clickable {
  cursor: pointer;
  margin-bottom: 0;
  border-bottom: none;
  padding-bottom: 0;
}

.kp-explain-section:not(.collapsed) .card-title-row.clickable {
  margin-bottom: 12px;
  border-bottom: 1px solid #edf2f6;
  padding-bottom: 12px;
}

.kp-explain-section .arrow-icon {
  margin-left: auto;
  display: flex;
  align-items: center;
  color: #98a2b3;
  transition: transform 0.25s ease;
}

.kp-explain-section.collapsed .arrow-icon {
  transform: rotate(180deg);
}

.explain-text {
  font-size: 13.5px;
  line-height: 1.65;
  color: #475569;
  white-space: pre-wrap;
}

/* 提交测评区域 */
.submit-card-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-sidebar-submit {
  width: 100%;
  height: 46px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #14b8a6, #0ea5a4);
  color: #ffffff;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(20, 184, 166, 0.28);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-sidebar-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #18c5b2, #10b4b3);
  box-shadow: 0 10px 28px rgba(20, 184, 166, 0.35);
  transform: translateY(-2px);
}

.btn-sidebar-submit:active:not(:disabled) {
  transform: translateY(0);
}

.btn-sidebar-submit.return-btn {
  background: #ffffff;
  border: 1.5px solid #dbe3ec;
  color: #344054;
  box-shadow: none;
}

.btn-sidebar-submit.return-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #1e293b;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.03);
}

.btn-sidebar-submit.report-btn {
  background: linear-gradient(135deg, #2563eb, #14b8a6);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.18);
}

.btn-sidebar-submit.report-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2f6ff0, #18c5b2);
  box-shadow: 0 10px 28px rgba(37, 99, 235, 0.24);
}

.btn-sidebar-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none !important;
  transform: none !important;
}

.shortcut-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: #98a2b3;
  font-weight: 700;
}

.shortcut-tip strong {
  color: #475569;
}

.shortcut-icon {
  font-size: 14px;
  color: #98a2b3;
  cursor: help;
}

:deep(.practice-report-dialog) {
  border-radius: 18px;
  overflow: hidden;
  max-height: calc(100vh - 8vh);
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
}

:deep(.practice-report-dialog .el-dialog__header) {
  margin: 0;
  padding: 0;
}

:deep(.practice-report-dialog .el-dialog__body) {
  padding: 0 28px 24px;
  max-height: none;
  flex: 1 1 auto;
  overflow-y: auto;
}

:deep(.practice-report-dialog .el-dialog__footer) {
  padding: 16px 28px 22px;
  border-top: 1px solid #e6ebf2;
}

.report-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 26px 28px 20px;
  background: linear-gradient(135deg, #f8fbff 0%, #eef8f6 100%);
  border-bottom: 1px solid #e6ebf2;
}

.report-title-block {
  min-width: 0;
}

.report-title-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.report-title-mark {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2563eb, #14b8a6);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 850;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.22);
}

.report-title-text {
  color: #0f172a;
  font-size: 22px;
  font-weight: 900;
  line-height: 1.25;
}

.report-status-badge {
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(20, 184, 166, 0.12);
  color: #0f766e;
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 800;
}

.report-title-block p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.report-finished-time {
  flex: 0 0 auto;
  margin-top: 6px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.report-content {
  display: flex;
  flex-direction: column;
  gap: 18px;
  color: #334155;
  padding-top: 22px;
}

.report-overview-card {
  display: grid;
  grid-template-columns: minmax(220px, 1.05fr) minmax(0, 1.7fr);
  gap: 18px;
  border: 1px solid #dce6f2;
  border-radius: 16px;
  padding: 18px;
  background: #ffffff;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.06);
}

.report-overview-main {
  min-width: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #eff6ff 0%, #ecfdf5 100%);
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.report-overview-main span {
  color: #2563eb;
  font-size: 13px;
  font-weight: 850;
}

.report-overview-main strong {
  color: #0f172a;
  font-size: 34px;
  font-weight: 950;
  line-height: 1.1;
}

.report-overview-main p {
  margin: 0;
  color: #475569;
  font-size: 13px;
  line-height: 1.65;
}

.report-score-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.report-score-item {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  padding: 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.report-score-item .label {
  font-size: 12px;
  font-weight: 800;
  color: #64748b;
}

.report-score-item strong {
  font-size: 22px;
  font-weight: 900;
  color: #0f172a;
}

.report-section {
  border: 1px solid #e6ebf2;
  border-radius: 14px;
  background: #ffffff;
  padding: 18px;
}

.report-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.report-section h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 900;
  color: #182230;
}

.section-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex: 0 0 auto;
}

.section-dot.overall {
  background: #2563eb;
}

.section-dot.weak {
  background: #ef4444;
}

.section-dot.strong {
  background: #22c55e;
}

.section-dot.suggestion {
  background: #14b8a6;
}

.report-text {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.78;
  font-size: 14px;
  color: #475569;
}

.report-analysis-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

.report-list,
.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.report-list-item,
.suggestion-item {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  padding: 12px 14px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.report-list-item.weak {
  border-color: #fecaca;
  background: #fffafa;
}

.report-list-item.strong {
  border-color: #bbf7d0;
  background: #f8fffb;
}

.report-list-rank,
.suggestion-index {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: #eef4ff;
  color: #2563eb;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 900;
}

.report-list-item.weak .report-list-rank {
  background: #fee2e2;
  color: #dc2626;
}

.report-list-item.strong .report-list-rank {
  background: #dcfce7;
  color: #16a34a;
}

.report-list-body,
.suggestion-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.report-list-body strong,
.suggestion-body strong {
  color: #1e293b;
  font-size: 14px;
  line-height: 1.45;
}

.report-list-body span,
.suggestion-body span,
.suggestion-body p {
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
}

.report-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 提示弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fade-in 0.2s ease;
}

.modal-card {
  width: 440px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.15);
  overflow: hidden;
  border: 1px solid #e6ebf2;
  animation: scale-up 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid #edf2f6;
}

.modal-title {
  font-size: 16px;
  font-weight: 800;
  color: #182230;
}

.modal-close-btn {
  border: none;
  background: transparent;
  color: #98a2b3;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  transition: all 0.15s ease;
}

.modal-close-btn:hover {
  background: #f1f5f9;
  color: #475467;
}

.modal-body {
  padding: 24px;
  font-size: 15px;
  color: #344054;
  line-height: 1.6;
  font-weight: 700;
}

.highlight-types {
  color: #ef4444;
  font-weight: 800;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: #f8fafc;
  border-top: 1px solid #edf2f6;
}

.btn-modal {
  height: 40px;
  padding: 0 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
}

.btn-modal.cancel {
  background: #ffffff;
  color: #475467;
  border: 1.5px solid #dbe3ec;
}

.btn-modal.cancel:hover {
  background: #f1f5f9;
  color: #182230;
}

.btn-modal.confirm {
  background: linear-gradient(135deg, #14b8a6, #0ea5a4);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.18);
}

.btn-modal.confirm:hover {
  background: linear-gradient(135deg, #18c5b2, #10b4b3);
  box-shadow: 0 6px 16px rgba(20, 184, 166, 0.25);
}

.algorithm-submit-overlay {
  z-index: 2100;
}

.algorithm-submit-card {
  width: 360px;
  padding: 30px 28px 0;
  text-align: center;
}

.algorithm-submit-status {
  width: 58px;
  height: 58px;
  margin: 0 auto 16px;
  border-radius: 18px;
  background: #f0fdfa;
  color: #14b8a6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.algorithm-submit-spinner {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 3px solid rgba(20, 184, 166, 0.2);
  border-top-color: #14b8a6;
  animation: algorithm-submit-spin 0.82s linear infinite;
}

.algorithm-submit-success {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: #ffffff;
  background: #14b8a6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.algorithm-submit-title {
  color: #0f172a;
  font-size: 20px;
  font-weight: 900;
  line-height: 1.35;
}

.algorithm-submit-subtitle {
  margin-top: 8px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.algorithm-submit-footer {
  justify-content: center;
  margin: 26px -28px 0;
}

@keyframes algorithm-submit-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scale-up {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* 响应式适配 */
@media (max-width: 1024px) {
  .exam-session-layout {
    grid-template-columns: 1fr;
    gap: 28px;
  }
  
  .exam-sidebar {
    position: static;
    max-height: none;
  }
  
  .sidebar-sticky-wrapper {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  :deep(.practice-report-dialog) {
    width: calc(100vw - 24px) !important;
    margin-top: 8px !important;
    max-height: calc(100vh - 16px);
  }

  :deep(.practice-report-dialog .el-dialog__body) {
    padding: 0 16px 18px;
  }

  :deep(.practice-report-dialog .el-dialog__footer) {
    padding: 14px 16px 18px;
  }

  .report-dialog-header {
    padding: 20px 16px 16px;
    flex-direction: column;
    gap: 8px;
  }

  .report-title-text {
    font-size: 19px;
  }

  .report-overview-card,
  .report-analysis-grid {
    grid-template-columns: 1fr;
  }

  .report-score-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .report-overview-main strong {
    font-size: 28px;
  }

  .report-dialog-footer {
    flex-direction: column-reverse;
  }

  .report-dialog-footer .el-button {
    width: 100%;
    margin-left: 0;
  }
}

/* 深色模式适配 */
html[data-theme='dark'] .exam-paper-container.practice-quiz-page {
  background: #0f172a;
}

html[data-theme='dark'] .back-nav {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

html[data-theme='dark'] .back-nav:hover {
  color: #14b8a6;
  border-color: rgba(20, 184, 166, 0.5);
  background: #243049;
}

html[data-theme='dark'] .loading-box,
html[data-theme='dark'] .empty-box {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

html[data-theme='dark'] .sidebar-card {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

html[data-theme='dark'] .sidebar-card .card-title-row {
  border-bottom-color: #334155;
  color: #cbd5e1;
}

html[data-theme='dark'] .sidebar-card .card-title-row .title {
  color: #cbd5e1;
}

html[data-theme='dark'] .legend-item {
  color: #cbd5e1;
}

html[data-theme='dark'] .legend-item .dot.unanswered {
  background: #1e293b;
  border-color: #475569;
}

html[data-theme='dark'] .grid-number {
  border-color: #334155;
  background: #1e293b;
  color: #94a3b8;
}

html[data-theme='dark'] .grid-number:hover {
  border-color: #14b8a6;
  color: #2dd4bf;
  background: #243049;
  box-shadow: 0 4px 10px rgba(20, 184, 166, 0.25);
}

html[data-theme='dark'] .grid-number.answered:not(.active) {
  background: rgba(20, 184, 166, 0.15);
  border-color: #14b8a6;
  color: #2dd4bf;
}

html[data-theme='dark'] .grid-number.result-correct:not(.active) {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(74, 222, 128, 0.55);
  color: #86efac;
}

html[data-theme='dark'] .grid-number.result-wrong:not(.active) {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(248, 113, 113, 0.55);
  color: #fca5a5;
}

html[data-theme='dark'] .grid-number.result-pending:not(.active) {
  background: rgba(245, 158, 11, 0.16);
  border-color: rgba(251, 191, 36, 0.55);
  color: #fcd34d;
}

html[data-theme='dark'] .grid-number.flagged:not(.active) {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

html[data-theme='dark'] .ai-tips-content .tip-label {
  color: #cbd5e1;
}

html[data-theme='dark'] .ai-tips-content .tip-value {
  color: #94a3b8;
}

html[data-theme='dark'] .kp-explain-section:not(.collapsed) .card-title-row.clickable {
  border-bottom-color: #334155;
}

html[data-theme='dark'] .explain-text {
  color: #cbd5e1;
}

html[data-theme='dark'] .btn-sidebar-submit {
  box-shadow: 0 8px 24px rgba(20, 184, 166, 0.15);
}

html[data-theme='dark'] .btn-sidebar-submit:hover:not(:disabled) {
  box-shadow: 0 10px 28px rgba(20, 184, 166, 0.25);
}

html[data-theme='dark'] .btn-sidebar-submit.return-btn {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

html[data-theme='dark'] .btn-sidebar-submit.return-btn:hover {
  background: #243049;
  border-color: #475569;
  color: #f4f7fb;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

html[data-theme='dark'] :deep(.practice-report-dialog) {
  background: #182235;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.42);
}

html[data-theme='dark'] :deep(.practice-report-dialog .el-dialog__footer) {
  border-top-color: #334155;
}

html[data-theme='dark'] .report-dialog-header {
  background: linear-gradient(135deg, #1e293b 0%, #162f35 100%);
  border-bottom-color: #334155;
}

html[data-theme='dark'] .report-title-text {
  color: #f8fafc;
}

html[data-theme='dark'] .report-title-block p,
html[data-theme='dark'] .report-finished-time {
  color: #94a3b8;
}

html[data-theme='dark'] .report-overview-card,
html[data-theme='dark'] .report-section,
html[data-theme='dark'] .report-score-item,
html[data-theme='dark'] .report-list-item,
html[data-theme='dark'] .suggestion-item {
  background: #1e293b;
  border-color: #334155;
}

html[data-theme='dark'] .report-overview-main {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(20, 184, 166, 0.14));
}

html[data-theme='dark'] .report-content,
html[data-theme='dark'] .report-section h3,
html[data-theme='dark'] .report-overview-main strong,
html[data-theme='dark'] .report-score-item strong,
html[data-theme='dark'] .report-list-body strong,
html[data-theme='dark'] .suggestion-body strong {
  color: #e2e8f0;
}

html[data-theme='dark'] .report-text,
html[data-theme='dark'] .report-overview-main p,
html[data-theme='dark'] .report-score-item .label,
html[data-theme='dark'] .report-list-body span,
html[data-theme='dark'] .suggestion-body span,
html[data-theme='dark'] .suggestion-body p {
  color: #94a3b8;
}

html[data-theme='dark'] .report-list-item.weak {
  border-color: rgba(248, 113, 113, 0.35);
  background: rgba(239, 68, 68, 0.08);
}

html[data-theme='dark'] .report-list-item.strong {
  border-color: rgba(74, 222, 128, 0.35);
  background: rgba(34, 197, 94, 0.08);
}

html[data-theme='dark'] .shortcut-tip {
  color: #64748b;
}

html[data-theme='dark'] .shortcut-tip strong {
  color: #cbd5e1;
}

html[data-theme='dark'] .modal-card {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

html[data-theme='dark'] .modal-header {
  border-bottom-color: #334155;
}

html[data-theme='dark'] .modal-title {
  color: #f4f7fb;
}

html[data-theme='dark'] .modal-close-btn:hover {
  background: #243049;
  color: #f4f7fb;
}

html[data-theme='dark'] .modal-body {
  color: #cbd5e1;
}

html[data-theme='dark'] .modal-footer {
  background: #151e2d;
  border-top-color: #334155;
}

html[data-theme='dark'] .btn-modal.cancel {
  background: #1e293b;
  color: #cbd5e1;
  border-color: #334155;
}

html[data-theme='dark'] .btn-modal.cancel:hover {
  background: #243049;
  color: #f4f7fb;
}

html[data-theme='dark'] .algorithm-submit-status {
  background: rgba(20, 184, 166, 0.14);
}

html[data-theme='dark'] .algorithm-submit-title {
  color: #f8fafc;
}

html[data-theme='dark'] .algorithm-submit-subtitle {
  color: #94a3b8;
}

@media (prefers-reduced-motion: reduce) {
  .algorithm-submit-spinner {
    animation: none;
  }
}
</style>
