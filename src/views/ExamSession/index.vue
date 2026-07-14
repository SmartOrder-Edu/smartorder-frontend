<template>
  <AppLayout>
    <div class="exam-paper-container">
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

      <div v-else class="exam-session-layout">
        <!-- 左侧栏：进度卡片 + 题目卡片列表 -->
        <div class="exam-main-content">
          <!-- 测评进度卡片 -->
          <div class="progress-summary-card">
            <!-- 左侧：环形进度条 -->
            <div class="progress-circle-section">
              <div class="circle-chart" :style="{ '--percent': progressPercentage + '%' }">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" stroke-width="8"/>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="url(#progressGrad)" stroke-width="8"
                          stroke-linecap="round" :stroke-dasharray="`${progressPercentage * 2.64} 264`"
                          transform="rotate(-90 50 50)"/>
                  <defs>
                    <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color: #0bb7aa" />
                      <stop offset="100%" style="stop-color: #20c997" />
                    </linearGradient>
                  </defs>
                </svg>
                <div class="circle-inner">
                  <span class="count-text">{{ answeredCount }}/{{ questions.length }}</span>
                  <span class="label-text">已完成</span>
                </div>
              </div>
            </div>
            
            <!-- 右侧：统计项 -->
            <div class="progress-stats-section">
              <div class="stat-box">
                <div class="stat-label">总题数</div>
                <div class="stat-value">{{ questions.length }} <span class="unit">题</span></div>
              </div>
              <div class="stat-box">
                <div class="stat-label">
                  正确率预估
                  <el-tooltip content="根据当前已作答客观题的正确率或历史数据预估" placement="top">
                    <el-icon class="info-icon"><InfoFilled /></el-icon>
                  </el-tooltip>
                </div>
                <div class="stat-value">{{ estimatedAccuracy }}%</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">难度分布</div>
                <div class="stat-value text-desc">{{ difficultyDistributionText }}</div>
              </div>
              <div class="stat-box full-width">
                <div class="stat-label">知识覆盖</div>
                <div class="knowledge-tags">
                  <span v-for="tag in knowledgeCoverageTags" :key="tag" class="coverage-tag">{{ tag }}</span>
                  <span v-if="!knowledgeCoverageTags.length" class="coverage-tag empty">暂无</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 题目卡片列表 -->
          <div v-for="group in groupedQuestions" :key="group.type" class="question-group">
            <div 
              v-for="q in group.questions" 
              :key="q.id" 
              :id="'question-card-' + q.globalIndex"
              class="question-card"
              :class="{ 
                active: q.globalIndex === currentActiveIndex,
                answered: isQuestionAnswered(q)
              }"
              @click="setActiveQuestion(q.globalIndex)"
            >
              <!-- 题目头部 -->
              <div class="card-header">
                <div class="header-left">
                  <span class="q-number">第 <strong class="num">{{ q.globalIndex }}</strong> 题</span>
                  <span class="divider">/</span>
                  <span class="q-type-label">{{ group.typeName }}</span>
                  
                  <!-- 标签 -->
                  <div class="card-tags">
                    <span v-for="tag in (q.tags || [])" :key="tag" class="tag-badge">{{ tag }}</span>
                    <span v-for="kp in (q.knowledgePoints || [])" :key="'kp-' + kp" class="tag-badge kp">{{ kp }}</span>
                  </div>
                </div>
                <div class="header-right">
                  <span class="score-badge">{{ q.score || 0 }} 分</span>
                </div>
              </div>
              
              <!-- 题干 -->
              <div class="card-stem" v-html="q.stem"></div>
              
              <!-- 作答交互区域 -->
              <div class="card-interaction">
                <!-- 选择选项区 -->
                <div class="q-options" v-if="getOptions(q).length">
                  <div 
                    v-for="opt in getOptions(q)" 
                    :key="opt.label" 
                    class="q-option"
                    :class="{ 
                      selected: isOptionSelected(q, opt.label),
                      correct: showAnswer && isOptionCorrect(q, opt.label),
                      wrong: showAnswer && isOptionWrong(q, opt.label)
                    }"
                    @click="toggleOption(q, opt.label)"
                  >
                    <span class="opt-circle">{{ opt.label }}</span>
                    <span class="opt-content">{{ opt.content }}</span>
                  </div>
                </div>
                
                <!-- 判断选项区 -->
                <div class="q-options" v-else-if="q.questionType === 'judge'">
                  <div 
                    class="q-option" 
                    :class="{ 
                      selected: answers[q.id as any] === 'true',
                      correct: showAnswer && isJudgeOptionCorrect(q, 'true'),
                      wrong: showAnswer && isJudgeOptionWrong(q, 'true')
                    }" 
                    @click="toggleJudge(q, 'true')"
                  >
                    <span class="opt-circle">A</span>
                    <span class="opt-content">正确</span>
                  </div>
                  <div 
                    class="q-option" 
                    :class="{ 
                      selected: answers[q.id as any] === 'false',
                      correct: showAnswer && isJudgeOptionCorrect(q, 'false'),
                      wrong: showAnswer && isJudgeOptionWrong(q, 'false')
                    }" 
                    @click="toggleJudge(q, 'false')"
                  >
                    <span class="opt-circle">B</span>
                    <span class="opt-content">错误</span>
                  </div>
                </div>
                
                <!-- 填空选项区 -->
                <div class="q-fill" v-else-if="q.questionType === 'fill_blank'">
                   <div v-for="(val, idx) in getFillBlankValues(q)" :key="idx" class="fill-row">
                     <span class="fill-label">第{{ idx + 1 }}空：</span>
                     <input 
                       type="text" 
                       :value="val" 
                       @input="e => updateFillBlankValueIndexed(q, idx, (e.target as HTMLInputElement).value)" 
                       placeholder="请填写答案" 
                       :readonly="showAnswer" 
                       class="custom-input" 
                     />
                   </div>
                </div>
                
                <!-- 主观/问答题 -->
                <div class="q-text-answer" v-else>
                   <textarea v-model="answers[q.id as any]" :readonly="showAnswer" rows="4" placeholder="请输入答案" class="custom-textarea"></textarea>
                </div>
              </div>
              
              <!-- 解析与结果区 -->
              <div v-if="showAnswer" class="result-box" :class="getResultBoxClass(q)">
                <!-- Session 模式：后端判分结果 -->
                <template v-if="getQuestionGrading(q) && getQuestionGrading(q)!.status === 'graded'">
                  <div class="result-row">
                    <span class="label">判分结果：</span>
                    <span class="value" :class="getQuestionGrading(q)!.isCorrect ? 'correct-answer' : 'wrong-answer'">
                      {{ getQuestionGrading(q)!.isCorrect ? '✓ 正确' : '✗ 错误' }}
                    </span>
                    <span class="label">得分：</span>
                    <span class="value">{{ getQuestionGrading(q)!.score }} / {{ q.score }}</span>
                  </div>
                </template>
                <template v-else-if="getQuestionGrading(q) && getQuestionGrading(q)!.status === 'pending_review'">
                  <div class="result-row">
                    <span class="value pending-badge">⏳ AI 批阅中...</span>
                  </div>
                </template>

                <!-- 旧模式: 客户端判分 -->
                <template v-else-if="!sessionId && q.questionType !== 'short_answer' && q.questionType !== 'essay'">
                  <div class="result-row">
                    <span class="label">我的答案：</span>
                    <span class="value user-answer" :class="{ correct: isCorrect(q), wrong: !isCorrect(q) }">
                      {{ formatUserAnswer(q) || '未作答' }}
                    </span>
                    <span v-if="isCorrect(q)" class="icon-correct">正确</span>
                    <span v-else class="icon-wrong">错误</span>
                  </div>
                  <div class="result-row">
                    <span class="label">正确答案：</span>
                    <span class="value correct-answer">{{ getCorrectAnswer(q) }}</span>
                  </div>
                </template>

                <!-- 答案解析 -->
                <div class="result-row explanation" v-if="q.explanation">
                  <div class="label">答案解析：</div>
                  <div class="value">{{ q.explanation }}</div>
                </div>
              </div>
              
              <!-- 卡片底部操作区 -->
              <div class="card-footer">
                <div class="footer-left">
                  <button 
                    type="button" 
                    class="action-btn flag-btn" 
                    :class="{ active: flaggedQuestions.has(q.globalIndex) }"
                    @click.stop="toggleFlag(q.globalIndex)"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="icon-svg">
                      <path d="M12.4 5H18v10h-4.6l-.4-2H8v5H6V4h6.8l.6 1z"/>
                    </svg>
                    <span>标记疑问</span>
                  </button>
                  
                  <button 
                    type="button" 
                    class="action-btn fav-btn"
                    :class="{ active: favoritedQuestions.has(q.globalIndex) }"
                    @click.stop="toggleFavorite(q.globalIndex)"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="icon-svg">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                    <span>收藏</span>
                  </button>
                  
                  <button 
                    type="button" 
                    class="action-btn kp-btn"
                    @click.stop="showKpExplanation(q)"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" class="icon-svg">
                      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                    <span>查看知识点</span>
                  </button>
                </div>
                
                <div class="footer-right">
                  <button 
                    type="button" 
                    class="nav-btn" 
                    :disabled="q.globalIndex === 1"
                    @click.stop="goPrevQuestion(q.globalIndex)"
                  >
                    上一题
                  </button>
                  <button 
                    type="button" 
                    class="nav-btn primary-nav" 
                    :disabled="q.globalIndex === questions.length"
                    @click.stop="goNextQuestion(q.globalIndex)"
                  >
                    下一题
                  </button>
                </div>
              </div>
            </div>
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
                <div class="legend-item"><span class="dot answered"></span>已答</div>
                <div class="legend-item"><span class="dot active"></span>当前</div>
                <div class="legend-item"><span class="dot unanswered"></span>未答</div>
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
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="color: #0bb7aa;">
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
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="color: #6366f1;">
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
              <button 
                v-else 
                type="button" 
                class="btn-sidebar-submit return-btn" 
                @click="goBack"
              >
                返回测评中心
              </button>
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
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Warning, InfoFilled, QuestionFilled } from '@element-plus/icons-vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { fetchEvaluationQuestions, type EvaluationQuestion } from '@/api/evaluationQuestion'
import {
  fetchSessionQuestions,
  startSession,
  submitAnswers,
  getSessionResult,
  submitExamAnswers,
  getExamResult,
  type SessionResultVO,
  type AnswerDetailVO
} from '@/api/evaluationSession'
import {
  getQuestionAnswerText,
  getQuestionTypeName,
  normalizeQuestionOptions
} from '@/utils/examQuestionMapper'

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
const showAnswer = ref(false)

// 后端判分结果
const gradingResult = ref<SessionResultVO | null>(null)
const isSubmitting = ref(false)

const examTitle = computed(() => String(route.query.title || '章节测验'))
const spaceId = computed(() => route.query.spaceId ? String(route.query.spaceId) : undefined)
const taskId = computed(() => route.query.taskId ? String(route.query.taskId) : undefined)
const sessionId = computed(() => route.query.sessionId ? String(route.query.sessionId) : undefined)
const rawStatus = computed(() => route.query.rawStatus ? String(route.query.rawStatus) : undefined)

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
  return q ? isQuestionAnswered(q) : false
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
  const order = ['single_choice', 'multiple_choice', 'fill_blank', 'judge', 'short_answer', 'essay']
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
    if (sessionId.value) {
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
      if (rawStatus.value === 'finished') {
        showAnswer.value = true
        try {
          const result = await getSessionResult(sessionId.value as any)
          gradingResult.value = result
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

const getOptions = (q: EvaluationQuestion) => {
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

const isOptionSelected = (q: EvaluationQuestion, label: string) => {
  const ans = answers.value[q.id as any] || ''
  if (q.questionType === 'single_choice') {
    return ans === label
  }
  return ans.split('、').includes(label)
}

// 选项提交后正误判断
const isOptionCorrect = (q: EvaluationQuestion, label: string) => {
  const correct = getCorrectAnswer(q)
  if (q.questionType === 'single_choice') {
    return correct === label
  }
  if (q.questionType === 'multiple_choice') {
    return correct.split('、').map(s => s.trim()).includes(label)
  }
  return false
}

const isOptionWrong = (q: EvaluationQuestion, label: string) => {
  const selected = isOptionSelected(q, label)
  const correct = isOptionCorrect(q, label)
  return selected && !correct
}

// 判断题提交后正误判断
const isJudgeOptionCorrect = (q: EvaluationQuestion, val: string) => {
  const correct = getCorrectAnswer(q)
  const valText = val === 'true' ? '正确' : '错误'
  return correct === valText
}

const isJudgeOptionWrong = (q: EvaluationQuestion, val: string) => {
  const selected = answers.value[q.id as any] === val
  const correct = isJudgeOptionCorrect(q, val)
  return selected && !correct
}

// 填空多空动态生成支持
const getBlankCount = (q: EvaluationQuestion) => {
  const matches = q.stem.match(/_+/g)
  if (matches && matches.length > 0) {
    return matches.length
  }
  const correctAns = getCorrectAnswer(q)
  if (correctAns && correctAns !== '无') {
    return correctAns.split('、').length
  }
  return 1
}

const getFillBlankValues = (q: EvaluationQuestion) => {
  const ans = answers.value[q.id as any] || ''
  const parts = ans.split(';;')
  const count = getBlankCount(q)
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    result.push(parts[i] || '')
  }
  return result
}

const updateFillBlankValueIndexed = (q: EvaluationQuestion, index: number, val: string) => {
  if (showAnswer.value) return
  const currentValues = getFillBlankValues(q)
  currentValues[index] = val.trim()
  answers.value[q.id as any] = currentValues.join(';;')
}

const getCorrectAnswer = (q: EvaluationQuestion) => {
  const text = getQuestionAnswerText(q.correctAnswer)
  return text || '无'
}

const formatUserAnswer = (q: EvaluationQuestion) => {
  let user = answers.value[q.id as any] || ''
  if (!user) return ''
  
  if (q.questionType === 'judge') {
    return user === 'true' ? '正确' : (user === 'false' ? '错误' : user)
  }
  if (q.questionType === 'fill_blank') {
    return user.replace(/;;/g, ';')
  }
  return user
}

const isCorrect = (q: EvaluationQuestion) => {
  const correct = getCorrectAnswer(q)
  const user = formatUserAnswer(q)
  
  if (!user) return false
  
  if (q.questionType === 'single_choice' || q.questionType === 'judge') {
    return user === correct
  }
  
  if (q.questionType === 'multiple_choice') {
    const sortedUser = user.split('、').map(s=>s.trim()).sort().join('、')
    const sortedCorrect = correct.split('、').map(s=>s.trim()).sort().join('、')
    return sortedUser === sortedCorrect
  }
  
  if (q.questionType === 'fill_blank') {
    const uParts = user.split(';').map(s => s.trim())
    const cParts = correct.split('、').map(s => s.trim()) 
    if (uParts.length !== cParts.length) return false
    for(let i=0; i<uParts.length; i++) {
      if(uParts[i] !== cParts[i]) return false
    }
    return true
  }
  
  return false
}

const showUnfinishedModal = ref(false)
const unfinishedTypesText = ref('')

const isQuestionAnswered = (q: EvaluationQuestion) => {
  const ans = answers.value[q.id as any]
  if (!ans) return false
  if (q.questionType === 'fill_blank') {
    const vals = getFillBlankValues(q)
    return vals.length > 0 && vals.every(v => v.trim() !== '')
  }
  return ans.trim() !== ''
}

const submitExam = () => {
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
    default:
      return { text: userAns }
  }
}

const doSubmitExam = async () => {
  isSubmitting.value = true
  try {
    // 构建提交 payload
    const answerItems = questions.value.map(q => ({
      questionId: q.id as any,
      userAnswer: buildUserAnswer(q),
      answerDurationSeconds: 0,
      usedHint: 0
    }))

    if (sessionId.value) {
      // 后端 session 模式：调用 submit API
      const result = await submitAnswers(sessionId.value as any, { answers: answerItems })
      gradingResult.value = result
      ElMessage.success(`提交成功！客观题得分: ${result.objectiveScore}/${result.objectiveTotal}${result.subjectivePending > 0 ? `，${result.subjectivePending}道主观题等待AI批阅` : ''}`)
    } else if (taskId.value) {
      // 任务模式：直接提交到后端判分
      const result = await submitExamAnswers(taskId.value as any, spaceId.value as any, { answers: answerItems })
      gradingResult.value = result as any
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

// 结果框样式
const getResultBoxClass = (q: EvaluationQuestion) => {
  const g = getQuestionGrading(q)
  if (g && g.status === 'graded') {
    return g.isCorrect ? 'correct-bg' : 'wrong-bg'
  }
  if (g && g.status === 'pending_review') return 'neutral-bg'
  if (!sessionId.value) {
    // 旧模式客户端判分
    if (q.questionType === 'short_answer' || q.questionType === 'essay') return 'neutral-bg'
    return isCorrect(q) ? 'correct-bg' : 'wrong-bg'
  }
  return 'neutral-bg'
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('scroll', onWindowScroll)
  fetchQuestions()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('scroll', onWindowScroll)
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
})
</script>

<style scoped>
.exam-paper-container {
  background-color: #f4f6f8;
  min-height: calc(100vh - 60px);
  padding: 24px 20px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #1e293b;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* 返回导航 */
.back-nav {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 16px;
  transition: all 0.2s ease;
  user-select: none;
  width: 100%;
  max-width: 1440px;
  align-self: center;
}

.back-nav:hover {
  color: #0bb7aa;
}

.back-icon {
  transition: transform 0.2s ease;
}

.back-nav:hover .back-icon {
  transform: translateX(-3px);
}

/* 双栏布局 */
.exam-session-layout {
  display: flex;
  width: 100%;
  max-width: 1440px;
  gap: 32px;
  position: relative;
}

.exam-main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

/* 进度卡片 */
.progress-summary-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 32px;
  box-shadow: 0 4px 20px  var(--color-shadow);
  border: 1px solid #eef2f6;
}

.progress-circle-section {
  flex-shrink: 0;
}

.circle-chart {
  position: relative;
  width: 90px;
  height: 90px;
}

.circle-chart svg {
  width: 100%;
  height: 100%;
}

.circle-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.circle-inner .count-text {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}

.circle-inner .label-text {
  font-size: 10px;
  color: #64748b;
  margin-top: 1px;
}

.progress-stats-section {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-box.full-width {
  grid-column: span 3;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
}

.stat-value .unit {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  margin-left: 2px;
}

.stat-value.text-desc {
  font-size: 15px;
  color: #1e293b;
  font-weight: 700;
}

.info-icon {
  color: #94a3b8;
  cursor: pointer;
  font-size: 13px;
}

.knowledge-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}

.coverage-tag {
  background-color: #f1f5f9;
  color: #475569;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.coverage-tag.empty {
  color: #94a3b8;
  font-style: italic;
}

/* 题目卡片 */
.question-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px  var(--color-shadow);
  border: 2px solid transparent;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  scroll-margin-top: 100px;
}

.question-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px  var(--color-shadow);
}

.question-card.active {
  border-color: #0bb7aa;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 12px;
}

.card-header .header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.q-number {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.q-number .num {
  font-size: 17px;
  font-weight: 800;
  color: #0bb7aa;
  margin: 0 1px;
}

.divider {
  color: #cbd5e1;
}

.q-type-label {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  background-color: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.card-tags {
  display: flex;
  gap: 4px;
  margin-left: 6px;
}

.tag-badge {
  font-size: 10px;
  font-weight: 700;
  color: #3b82f6;
  background-color: #eff6ff;
  padding: 1px 6px;
  border-radius: 4px;
}

.tag-badge.kp {
  color: #8b5cf6;
  background-color: #f5f3ff;
}

.score-badge {
  font-size: 12px;
  font-weight: 700;
  color: #0bb7aa;
  background-color: rgba(11, 183, 170, 0.06);
  padding: 3px 10px;
  border-radius: 10px;
}

.card-stem {
  font-size: 15px;
  line-height: 1.6;
  color: #0f172a;
  margin-bottom: 20px;
  font-weight: 600;
}

/* 选项 */
.q-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.q-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #475569;
  font-weight: 500;
  transition: all 0.2s ease;
}

.q-option:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateX(3px);
}

.opt-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1.5px solid #cbd5e1;
  background: #fff;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.q-option.selected {
  background: rgba(11, 183, 170, 0.04);
  border-color: #0bb7aa;
  color: #0bb7aa;
  font-weight: 600;
}

.q-option.selected .opt-circle {
  background: #0bb7aa;
  border-color: #0bb7aa;
  color: #fff;
}

.q-option.correct {
  background: #f0fdf4;
  border-color: #22c55e;
  color: #15803d;
  font-weight: 600;
}

.q-option.correct .opt-circle {
  background: #22c55e;
  border-color: #22c55e;
  color: #fff;
}

.q-option.wrong {
  background: #fef2f2;
  border-color: #ef4444;
  color: #991b1b;
  font-weight: 600;
}

.q-option.wrong .opt-circle {
  background: #ef4444;
  border-color: #ef4444;
  color: #fff;
}

/* 填空题 */
.q-fill {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fill-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fill-label {
  font-size: 13px;
  color: #475569;
  font-weight: 600;
  width: 52px;
  flex-shrink: 0;
}

.custom-input {
  flex: 1;
  height: 38px;
  padding: 0 12px;
  border: 1.5px solid #e2e8f0;
  background-color: #fff;
  border-radius: 6px;
  font-size: 13px;
  color: #1e293b;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.custom-input:focus {
  border-color: #0bb7aa;
  box-shadow: 0 0 0 3px rgba(11, 183, 170, 0.08);
}

.custom-input:read-only {
  background-color: #f8fafc;
  color: #64748b;
  cursor: not-allowed;
}

/* 问答题 */
.custom-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #e2e8f0;
  background-color: #fff;
  border-radius: 6px;
  font-size: 13px;
  color: #1e293b;
  outline: none;
  resize: vertical;
  line-height: 1.6;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.custom-textarea:focus {
  border-color: #0bb7aa;
  box-shadow: 0 0 0 3px rgba(11, 183, 170, 0.08);
}

.custom-textarea:read-only {
  background-color: #f8fafc;
  color: #64748b;
  cursor: not-allowed;
}

/* 题目卡片底部 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  border-top: 1px solid #f1f5f9;
  padding-top: 14px;
}

.footer-left {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-weight: 600;
}

.action-btn:hover {
  background-color: #f1f5f9;
  color: #0f172a;
}

.action-btn.flag-btn.active {
  color: #f97316;
  background-color: #fff7ed;
}

.action-btn.fav-btn.active {
  color: #eab308;
  background-color: #fefcbf;
}

.action-btn.kp-btn:hover {
  color: #6366f1;
  background-color: #e0e7ff;
}

.icon-svg {
  flex-shrink: 0;
}

.footer-right {
  display: flex;
  gap: 8px;
}

.nav-btn {
  height: 34px;
  padding: 0 16px;
  border-radius: 17px;
  border: 1.5px solid #cbd5e1;
  background: #fff;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover:not(:disabled) {
  background-color: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-btn.primary-nav {
  background-color: #0bb7aa;
  border-color: #0bb7aa;
  color: #fff;
}

.nav-btn.primary-nav:hover:not(:disabled) {
  background-color: #099f94;
  border-color: #099f94;
}

/* 右侧侧边栏 */
.exam-sidebar {
  width: 340px;
  flex-shrink: 0;
}

.sidebar-sticky-wrapper {
  position: sticky;
  top: 80px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  padding-right: 4px;
}

.sidebar-sticky-wrapper::-webkit-scrollbar {
  width: 4px;
}
.sidebar-sticky-wrapper::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.sidebar-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 20px  var(--color-shadow);
  border: 1px solid #eef2f6;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
}

.card-title-row.clickable {
  cursor: pointer;
  user-select: none;
  justify-content: space-between;
}

.card-title-row.clickable .title {
  flex: 1;
  margin-left: 6px;
}

/* 答题卡图例 */
.legend-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e2e8f0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

.legend-item .dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
}

.legend-item .dot.answered {
  background-color: #22c55e;
  border: none;
}

.legend-item .dot.active {
  background-color: #3b82f6;
  border: none;
}

.legend-item .dot.unanswered {
  background-color: #e2e8f0;
  border: none;
}

.legend-item .dot.flagged {
  background-color: #f97316;
  border: none;
}

/* 答题网格 */
.answers-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.grid-number {
  position: relative;
  height: 40px;
  border-radius: 8px;
  border: 1.5px solid #e2e8f0;
  background-color: #fff;
  color: #334155;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.grid-number:hover {
  border-color: #cbd5e1;
  background-color: #f8fafc;
}

.grid-number.active {
  border-color: #3b82f6;
  color: #3b82f6;
  background-color: #fff;
}

.grid-number.answered {
  background-color: #f0fdf4;
  border-color: #bbf7d0;
  color: #15803d;
}

.grid-number.flagged {
  background-color: #fff7ed;
  border-color: #fed7aa;
  color: #ea580c;
}

.mini-check {
  position: absolute;
  bottom: 1.5px;
  right: 1.5px;
  background-color: #22c55e;
  color: #fff;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-flag {
  position: absolute;
  bottom: 1.5px;
  right: 1.5px;
  color: #f97316;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* AI 学习提示列表 */
.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tips-list li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  line-height: 1.5;
}

.tip-label {
  font-weight: 800;
  color: #334155;
}

.tip-value {
  color: #64748b;
  background-color: #f8fafc;
  padding: 5px 8px;
  border-radius: 6px;
  border-left: 3px solid #0bb7aa;
}

/* 知识点折叠 */
.kp-explain-section {
  transition: all 0.25s ease;
}

.kp-explain-section.collapsed .arrow-svg {
  transform: rotate(180deg);
}

.arrow-svg {
  transition: transform 0.2s ease;
  color: #94a3b8;
}

.explain-text {
  font-size: 12px;
  color: #475569;
  line-height: 1.5;
  background-color: #fdfdfd;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px dashed #cbd5e1;
  margin: 0;
}

/* 提交按钮区域 */
.submit-card-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-sidebar-submit {
  height: 44px;
  width: 100%;
  border: none;
  background-color: #0bb7aa;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(11, 183, 170, 0.2);
  transition: all 0.2s ease;
}

.btn-sidebar-submit:hover:not(:disabled) {
  background-color: #099f94;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(11, 183, 170, 0.3);
}

.btn-sidebar-submit.return-btn {
  background-color: #64748b;
  box-shadow: 0 4px 14px rgba(100, 116, 139, 0.2);
}

.btn-sidebar-submit.return-btn:hover {
  background-color: #475569;
}

.btn-sidebar-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.shortcut-tip {
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.shortcut-tip strong {
  color: #475569;
  background: #e2e8f0;
  padding: 1px 4px;
  border-radius: 3px;
}

.shortcut-icon {
  font-size: 12px;
  color: #cbd5e1;
  cursor: help;
}

/* 结果判分框 */
.result-box {
  margin-top: 16px;
  padding: 14px 18px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-size: 13px;
  line-height: 1.6;
}

.result-box.correct-bg {
  background-color: #f0fdf4;
  border-color: #bbf7d0;
}

.result-box.wrong-bg {
  background-color: #fef2f2;
  border-color: #fecaca;
}

.result-box.neutral-bg {
  background-color: #f8fafc;
  border-color: #e2e8f0;
}

.result-row {
  margin-bottom: 6px;
}

.result-row:last-child {
  margin-bottom: 0;
}

.result-row .label {
  font-weight: 700;
  color: #1e293b;
}

.result-row .value {
  color: #334155;
}

.correct-answer {
  color: #22c55e;
  font-weight: 700;
}

.wrong-answer {
  color: #ef4444;
  font-weight: 700;
}

.pending-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #f76707;
  font-weight: 600;
  background: #fff4e6;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  border: 1px solid #ffe8cc;
}

.icon-correct {
  color: #22c55e;
  font-weight: 700;
  font-size: 12px;
}

.icon-wrong {
  color: #ef4444;
  font-weight: 700;
  font-size: 12px;
}

.explanation {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #cbd5e1;
}

.loading-box, .empty-box {
  text-align: center;
  padding: 100px 0;
  color: #94a3b8;
  font-size: 15px;
}

/* 提示未完成弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-card {
  background: #fff;
  width: 90%;
  max-width: 400px;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px  var(--color-shadow);
  padding: 24px;
  box-sizing: border-box;
  margin-bottom: 80px;
  animation: modalFadeIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modal-title {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}

.modal-close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: #f1f5f9;
  color: #475569;
}

.modal-body {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
  margin-bottom: 24px;
  text-align: left;
}

.highlight-types {
  color: #f97316;
  font-weight: 700;
  background-color: #fff7ed;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #ffe8cc;
  margin: 0 2px;
  display: inline-block;
  line-height: 1.2;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-modal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  padding: 0 16px;
  border-radius: 17px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.btn-modal.cancel {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #475569;
}

.btn-modal.cancel:hover {
  background: #f8fafc;
  color: #1e293b;
}

.btn-modal.confirm {
  border: none;
  background: #0bb7aa;
  color: #fff;
  box-shadow: 0 4px 12px rgba(11, 183, 170, 0.2);
}

.btn-modal.confirm:hover {
  background: #099f94;
  transform: translateY(-1px);
}

@keyframes modalFadeIn {
  from {
    transform: scale(0.95) translateY(8px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

/* 响应式断点 */
@media (max-width: 1024px) {
  .exam-session-layout {
    flex-direction: column;
  }
  .exam-sidebar {
    width: 100%;
  }
  .sidebar-sticky-wrapper {
    position: static;
    max-height: none;
    overflow-y: visible;
  }
  .progress-stats-section {
    grid-template-columns: 1fr;
  }
  .stat-box.full-width {
    grid-column: span 1;
  }
}
</style>
