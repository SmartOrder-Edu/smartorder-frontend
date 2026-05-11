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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
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
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-light)" stroke-width="8"/>
              <circle cx="60" cy="60" r="52" fill="none" stroke="url(#scoreGrad)" stroke-width="8"
                stroke-linecap="round"
                :stroke-dasharray="`${overallScore * 3.27} 327`"
                transform="rotate(-90 60 60)"/>
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#3b5bdb"/>
                  <stop offset="100%" style="stop-color:#12b886"/>
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  {{ ongoingExam.total }} 题
                </span>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                  {{ ongoingExam.duration }} 分钟
                </span>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  {{ ongoingExam.attempted }}/{{ ongoingExam.total }} 已答
                </span>
              </div>
              <div class="exam-progress-bar">
                <div class="bar-fill" :style="{ width: (ongoingExam.attempted / ongoingExam.total * 100) + '%' }"></div>
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  {{ exam.total }} 题
                </span>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                  {{ exam.duration }} 分钟
                </span>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
                  {{ exam.accuracy }}% 正确率
                </span>
              </div>

              <!-- 结果展示 -->
              <div v-if="exam.hasResult" class="result-detail">
                <div class="result-chart">
                  <div class="chart-bar-group">
                    <div class="chart-bar correct" :style="{ height: exam.accuracy + '%' }"></div>
                    <div class="chart-bar wrong" :style="{ height: (100 - exam.accuracy) + '%' }"></div>
                  </div>
                  <span class="chart-label">{{ exam.accuracy }}%</span>
                </div>
                <div class="result-tags">
                  <span v-if="exam.wrongCount > 0" class="wrong-tag">
                    错题 {{ exam.wrongCount }} 道
                    <span class="review-link" @click="reviewWrong(exam)">去复习</span>
                  </span>
                  <span class="weak-tag">
                    薄弱：{{ exam.weakPoints.join('、') }}
                  </span>
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
              <path d="M9 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4"/>
              <rect x="9" y="9" width="6" height="6" rx="1"/>
              <line x1="9" y1="13" x2="13" y2="13"/>
              <line x1="9" y1="15" x2="11" y2="15"/>
            </svg>
          </div>
          <h3>暂无测评</h3>
          <p>点击"AI 生成测评"获取个性化测试</p>
        </div>
      </section>

      <!-- AI 生成测评对话框 -->
      <el-dialog v-model="showGenerateDialog" title="AI 生成个性化测评" width="520px">
        <div class="generate-form">
          <div class="form-item">
            <label>测评范围</label>
            <el-select v-model="generateScope" style="width: 100%;">
              <el-option label="操作系统全章" value="full" />
              <el-option label="进程管理" value="process" />
              <el-option label="线程同步" value="thread" />
              <el-option label="内存管理" value="memory" />
              <el-option label="自定义范围" value="custom" />
            </el-select>
          </div>
          <div class="form-item">
            <label>题目数量</label>
            <el-slider v-model="generateCount" :min="5" :max="30" show-stops :marks="{ 5: '5', 15: '15', 30: '30' }"/>
          </div>
          <div class="form-item">
            <label>难度级别</label>
            <el-radio-group v-model="generateDifficulty">
              <el-radio label="easy">基础</el-radio>
              <el-radio label="medium">中等</el-radio>
              <el-radio label="hard">困难</el-radio>
              <el-radio label="ai">AI 自适应</el-radio>
            </el-radio-group>
          </div>
          <div class="form-item">
            <label>测评重点（可选）</label>
            <el-checkbox-group v-model="generateFocus">
              <el-checkbox label="concept">概念理解</el-checkbox>
              <el-checkbox label="calc">计算分析</el-checkbox>
              <el-checkbox label="code">代码实现</el-checkbox>
              <el-checkbox label="weak">针对薄弱点</el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
        <template #footer>
          <el-button @click="showGenerateDialog = false">取消</el-button>
          <el-button type="primary" :loading="generating" @click="generateExam">
            {{ generating ? '生成中...' : '开始生成' }}
          </el-button>
        </template>
      </el-dialog>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const activeTab = ref('available')
const showGenerateDialog = ref(false)
const generating = ref(false)
const generateScope = ref('thread')
const generateCount = ref(10)
const generateDifficulty = ref('ai')
const generateFocus = ref(['concept', 'weak'])

const overallScore = ref(76)
const weeklyCount = ref(4)
const weeklyAccuracy = ref(72)
const weakCount = ref(5)
const weeklyProgress = ref(8)

const examTabs = [
  { value: 'ongoing', label: '进行中', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>', count: 1 },
  { value: 'available', label: '可参与', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>', count: 5 },
  { value: 'completed', label: '已完成', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>', count: 4 },
  { value: 'wrong', label: '错题本', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>', count: 12 }
]

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
    id: 1, title: '进程管理综合测试', description: '涵盖进程概念、PCB、状态转换、进程创建与终止',
    total: 20, duration: 30, accuracy: 75, score: 75,
    hasResult: true, wrongCount: 5, weakPoints: ['进程创建', '状态转换'],
    status: 'completed', statusText: '已完成'
  },
  {
    id: 2, title: '线程与同步专项测评', description: '聚焦线程同步、互斥锁、信号量、条件变量',
    total: 15, duration: 25, accuracy: 52, score: 52,
    hasResult: true, wrongCount: 7, weakPoints: ['PV操作', '死锁检测'],
    status: 'completed', statusText: '已完成'
  },
  {
    id: 3, title: '内存管理阶段测试', description: '分页、分段、虚拟内存、页面置换算法',
    total: 15, duration: 30, accuracy: 0, score: 0,
    hasResult: false, wrongCount: 0, weakPoints: [],
    status: 'available', statusText: '可参与'
  },
  {
    id: 4, title: '文件系统章节测验', description: '文件组织、目录结构、文件系统实现',
    total: 12, duration: 20, accuracy: 0, score: 0,
    hasResult: false, wrongCount: 0, weakPoints: [],
    status: 'available', statusText: '可参与'
  },
  {
    id: 5, title: '操作系统期末模拟', description: '全章节综合测试，包含选择、填空、简答、计算',
    total: 30, duration: 60, accuracy: 0, score: 0,
    hasResult: false, wrongCount: 0, weakPoints: [],
    status: 'available', statusText: '可参与'
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
  console.log('Start exam:', exam.title)
}

const reviewWrong = (exam: any) => {
  console.log('Review wrong questions:', exam.title)
}

const retakeExam = (exam: any) => {
  console.log('Retake exam:', exam.title)
}

const generateExam = () => {
  generating.value = true
  setTimeout(() => {
    generating.value = false
    showGenerateDialog.value = false
  }, 2500)
}
</script>

<style scoped>
.exam-page {
  max-width: 900px;
  height: calc(100vh - var(--header-height) - 2 * var(--spacing-xl));
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

.overview-cards {
  display: flex;
  gap: var(--spacing-2xl);
  align-items: center;
}

.overview-stat { flex-shrink: 0; }

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

.detail-item {}

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

.detail-value.primary { color: var(--primary-color); }
.detail-value.accent { color: var(--accent-color); }
.detail-value.warning { color: var(--warning-color); }
.detail-value.success { color: var(--accent-color); }

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

.tab-item:hover { background: var(--background-color-base); }
.tab-item.active { background: var(--primary-color); color: white; }
.tab-icon { font-size: 1rem; }

.tab-count {
  padding: 0 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  font-size: 0.625rem;
  font-weight: 600;
}

.tab-item:not(.active) .tab-count {
  background: rgba(59, 91, 219, 0.1);
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

.status-badge.completed { background: rgba(18, 184, 134, 0.1); color: var(--accent-color); }
.status-badge.available { background: rgba(59, 91, 219, 0.1); color: var(--primary-color); }
.status-badge.ongoing { background: rgba(245, 158, 11, 0.15); color: var(--warning-color); animation: pulse 2s infinite; }

.time-left {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--warning-color);
}

.result-score {
  font-size: 1.25rem;
  font-weight: 700;
}

.result-score.good { color: var(--accent-color); }
.result-score.medium { color: var(--primary-color); }
.result-score.poor { color: var(--danger-color); }

.exam-info { flex: 1; }

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

.chart-bar.correct { background: var(--accent-color); }
.chart-bar.wrong { background: var(--danger-color); opacity: 0.6; }

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

.empty-icon { font-size: 3rem; margin-bottom: var(--spacing-md); }
.empty-state h3 { font-size: 1rem; font-weight: 600; color: var(--text-dark); margin: 0 0 var(--spacing-sm); }
.empty-state p { font-size: 0.875rem; color: var(--text-secondary); margin: 0; }

/* 生成表单 */
.generate-form .form-item { margin-bottom: var(--spacing-lg); }
.generate-form label { display: block; font-size: 0.875rem; font-weight: 600; color: var(--text-dark); margin-bottom: var(--spacing-sm); }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
