<template>
  <AppLayout>
    <div class="tasks-page">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">任务中心</h1>
          <p class="page-desc">管理你的所有学习任务，系统会根据画像动态调整</p>
        </div>
        <div class="header-right">
          <el-button-group>
            <el-button :type="activeTab === 'today' ? 'primary' : ''" @click="activeTab = 'today'">
              今日任务
            </el-button>
            <el-button :type="activeTab === 'week' ? 'primary' : ''" @click="activeTab = 'week'">
              本周任务
            </el-button>
            <el-button :type="activeTab === 'all' ? 'primary' : ''" @click="activeTab = 'all'">
              全部任务
            </el-button>
          </el-button-group>
          <el-button type="primary" @click="showGenerateDialog = true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
              <path d="M12 2a10 10 0 0 1 10 10"/>
            </svg>
            AI 生成任务
          </el-button>
        </div>
      </div>

      <!-- 任务统计 -->
      <section class="section stats-row">
        <div class="stat-card">
          <div class="stat-icon review-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ taskStats.review }}</span>
            <span class="stat-label">复习任务</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon practice-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ taskStats.practice }}</span>
            <span class="stat-label">练习任务</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon resource-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ taskStats.resource }}</span>
            <span class="stat-label">资源任务</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon done-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ taskStats.completed }}</span>
            <span class="stat-label">已完成</span>
          </div>
        </div>
      </section>

      <!-- 任务筛选 -->
      <div class="filter-bar">
        <el-input v-model="searchKeyword" placeholder="搜索任务..." prefix-icon="Search" clearable style="max-width: 300px;" />
        <div class="filter-tags">
          <span
            v-for="filter in filters"
            :key="filter.value"
            class="filter-chip"
            :class="{ active: activeFilter === filter.value }"
            @click="activeFilter = filter.value"
          >
            {{ filter.label }}
          </span>
        </div>
      </div>

      <!-- 任务列表 -->
      <section class="section tasks-list-section">
        <div class="tasks-list">
          <div
            v-for="task in filteredTasks"
            :key="task.id"
            class="task-item"
            :class="[`type-${task.type}`, { completed: task.status === 'done' }]"
          >
            <div class="task-check" @click="toggleTask(task)">
              <div class="check-circle" :class="task.status">
                <svg v-if="task.status === 'done'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              </div>
            </div>

            <div class="task-body">
              <div class="task-meta">
                <span class="type-badge" :class="task.type">{{ task.typeName }}</span>
                <span class="task-date">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  {{ task.deadline }}
                </span>
                <span class="task-duration">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  </svg>
                  {{ task.minutes }}分钟
                </span>
              </div>

              <h3 class="task-title">{{ task.title }}</h3>
              <p class="task-reason">{{ task.reason }}</p>

              <div class="task-footer">
                <div class="task-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: task.progress + '%' }"></div>
                  </div>
                  <span class="progress-text">{{ task.progress }}%</span>
                </div>
                <div class="task-tags">
                  <span v-for="tag in task.tags" :key="tag" class="task-tag">{{ tag }}</span>
                </div>
              </div>
            </div>

            <div class="task-actions">
              <el-button
                v-if="task.status !== 'done'"
                type="primary"
                size="small"
                @click="$router.push('/study/' + task.id)"
              >
                {{ task.progress > 0 ? '继续' : '开始' }}
              </el-button>
              <el-button v-else size="small" @click="$router.push('/study/' + task.id)">
                回顾
              </el-button>
              <el-button size="small" text @click="deleteTask(task.id)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div class="empty-state" v-if="filteredTasks.length === 0">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg>
          </div>
          <h3>暂无任务</h3>
          <p>点击"生成任务"让系统为你规划学习任务</p>
          <el-button type="primary" @click="showGenerateDialog = true">生成任务</el-button>
        </div>
      </section>

      <!-- AI 生成任务对话框 -->
      <el-dialog v-model="showGenerateDialog" title="AI 生成学习任务" width="520px">
        <div class="generate-form">
          <div class="form-item">
            <label>任务类型</label>
            <el-checkbox-group v-model="generateTypes">
              <el-checkbox label="review">知识复习</el-checkbox>
              <el-checkbox label="practice">题目练习</el-checkbox>
              <el-checkbox label="resource">资源学习</el-checkbox>
              <el-checkbox label="project">项目实践</el-checkbox>
            </el-checkbox-group>
          </div>
          <div class="form-item">
            <label>任务数量</label>
            <el-slider v-model="generateCount" :min="1" :max="10" show-stops />
          </div>
          <div class="form-item">
            <label>学习目标</label>
            <el-input type="textarea" v-model="generateGoal" placeholder="描述你希望强化的知识点或技能..." :rows="3" />
          </div>
        </div>
        <template #footer>
          <el-button @click="showGenerateDialog = false">取消</el-button>
          <el-button type="primary" :loading="generating" @click="generateTasks">
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

const activeTab = ref('today')
const activeFilter = ref('all')
const searchKeyword = ref('')
const showGenerateDialog = ref(false)
const generating = ref(false)
const generateTypes = ref(['review', 'practice', 'resource'])
const generateCount = ref(5)
const generateGoal = ref('')

const taskStats = ref({
  review: 5,
  practice: 8,
  resource: 3,
  completed: 12
})

const filters = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'doing' },
  { label: '待开始', value: 'todo' },
  { label: '已完成', value: 'done' }
]

const tasks = ref([
  {
    id: 1, type: 'review', typeName: '复习', title: '进程与线程的核心概念', reason: '基于你昨天的测验结果，这个知识点需要巩固',
    minutes: 15, deadline: '今天', progress: 60, status: 'doing',
    tags: ['进程', '线程', '概念'], reasonAI: '你在测验中连续2次在此知识点失分'
  },
  {
    id: 2, type: 'practice', typeName: '练习', title: '完成 8 道同步互斥专项练习', reason: '你的 PV 操作正确率上周下降了 15%',
    minutes: 25, deadline: '今天', progress: 0, status: 'todo',
    tags: ['PV操作', '同步'], reasonAI: '测评发现你的互斥题正确率偏低'
  },
  {
    id: 3, type: 'resource', typeName: '资源', title: '查看"信号量机制"图解讲解', reason: '根据你的学习偏好，推荐图解+动画形式',
    minutes: 12, deadline: '今天', progress: 0, status: 'todo',
    tags: ['信号量', '图解'], reasonAI: '你偏好可视化学习方式'
  },
  {
    id: 4, type: 'review', typeName: '复习', title: '复习进程调度的三种方式', reason: '明天有小测验，提前复习',
    minutes: 20, deadline: '明天', progress: 0, status: 'todo',
    tags: ['调度', 'FIFO', 'SJF'], reasonAI: '你的期末目标包含此知识点'
  },
  {
    id: 5, type: 'practice', typeName: '练习', title: '进程状态转换图绘制', reason: '理解五种状态及其转换条件',
    minutes: 15, deadline: '明天', progress: 0, status: 'todo',
    tags: ['状态图'], reasonAI: '基于知识图谱依赖分析'
  },
  {
    id: 6, type: 'resource', typeName: '资源', title: '阅读：操作系统的几种常见体系结构', reason: '扩展知识面，理解 OS 设计思想',
    minutes: 30, deadline: '本周', progress: 0, status: 'todo',
    tags: ['体系结构', '拓展'], reasonAI: '当前阶段的前置阅读'
  },
  {
    id: 7, type: 'practice', typeName: '练习', title: 'PCB 概念与组成练习题', reason: '巩固进程控制块的核心知识',
    minutes: 10, deadline: '本周', progress: 100, status: 'done',
    tags: ['PCB'], reasonAI: ''
  },
  {
    id: 8, type: 'review', typeName: '复习', title: '回顾进程同步与互斥的区别', reason: '系统性梳理重难点',
    minutes: 10, deadline: '本周', progress: 100, status: 'done',
    tags: ['同步', '互斥'], reasonAI: ''
  }
])

const filteredTasks = computed(() => {
  let result = tasks.value

  if (activeTab.value === 'today') {
    result = result.filter(t => t.deadline === '今天')
  } else if (activeTab.value === 'week') {
    result = result.filter(t => ['今天', '明天', '本周'].includes(t.deadline))
  }

  if (activeFilter.value !== 'all') {
    result = result.filter(t => t.status === activeFilter.value)
  }

  if (searchKeyword.value) {
    result = result.filter(t =>
      t.title.includes(searchKeyword.value) ||
      t.tags.some(tag => tag.includes(searchKeyword.value))
    )
  }

  return result
})

const toggleTask = (task: any) => {
  if (task.status === 'done') {
    task.status = 'todo'
    task.progress = 0
  } else {
    task.status = 'done'
    task.progress = 100
  }
}

const deleteTask = (id: number) => {
  tasks.value = tasks.value.filter(t => t.id !== id)
}

const generateTasks = () => {
  generating.value = true
  setTimeout(() => {
    generating.value = false
    showGenerateDialog.value = false
  }, 2000)
}
</script>

<style scoped>
.tasks-page {
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
  flex-wrap: wrap;
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

.header-right {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.header-right .el-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* 统计行 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--background-color-base);
  border-radius: var(--radius-lg);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 22px;
  height: 22px;
}

.review-icon { background: rgba(59, 91, 219, 0.1); color: var(--primary-color); }
.practice-icon { background: rgba(18, 184, 134, 0.1); color: var(--accent-color); }
.resource-icon { background: rgba(245, 158, 11, 0.1); color: var(--warning-color); }
.done-icon { background: rgba(59, 91, 219, 0.06); color: var(--text-secondary); }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-dark);
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
}

.filter-tags {
  display: flex;
  gap: var(--spacing-sm);
}

.filter-chip {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  color: var(--text-secondary);
  background: var(--background-color-base);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
}

.filter-chip:hover {
  background: white;
  border-color: var(--border-light);
}

.filter-chip.active {
  background: var(--primary-color);
  color: white;
}

/* 任务列表 */
.tasks-list-section {
  padding: var(--spacing-lg);
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: var(--background-color-base);
  border-radius: var(--radius-xl);
  border-left: 4px solid var(--border-light);
  transition: all var(--transition-base);
}

.task-item:hover {
  background: white;
  box-shadow: var(--shadow-md);
}

.task-item.type-review { border-left-color: var(--primary-color); }
.task-item.type-practice { border-left-color: var(--accent-color); }
.task-item.type-resource { border-left-color: var(--warning-color); }
.task-item.type-project { border-left-color: #a855f7; }
.task-item.completed { opacity: 0.6; }

.task-check {
  padding-top: 4px;
  cursor: pointer;
}

.check-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
}

.check-circle.todo:hover {
  border-color: var(--primary-color);
}

.check-circle.doing {
  border-color: var(--primary-color);
  background: rgba(59, 91, 219, 0.1);
}

.check-circle.done {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
}

.check-circle svg {
  width: 12px;
  height: 12px;
}

.task-body { flex: 1; }

.task-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.type-badge {
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 600;
}

.type-badge.review { background: rgba(59, 91, 219, 0.1); color: var(--primary-color); }
.type-badge.practice { background: rgba(18, 184, 134, 0.1); color: var(--accent-color); }
.type-badge.resource { background: rgba(245, 158, 11, 0.1); color: var(--warning-color); }
.type-badge.project { background: rgba(168, 85, 247, 0.1); color: #a855f7; }

.task-date, .task-duration {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.task-date svg, .task-duration svg {
  width: 12px;
  height: 12px;
}

.task-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-xs);
}

.task-reason {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-sm);
}

.task-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.task-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.progress-bar {
  width: 80px;
  height: 4px;
  background: var(--border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b5bdb, #12b886);
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.625rem;
  color: var(--text-muted);
}

.task-tags {
  display: flex;
  gap: 4px;
}

.task-tag {
  padding: 1px 8px;
  background: rgba(59, 91, 219, 0.06);
  border-radius: var(--radius-sm);
  font-size: 0.5625rem;
  color: var(--primary-color);
}

.task-actions {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: var(--spacing-md);
  color: var(--text-muted);
  opacity: 0.5;
}

.empty-icon svg {
  width: 100%;
  height: 100%;
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
  margin: 0 0 var(--spacing-lg);
}

/* 生成表单 */
.generate-form .form-item {
  margin-bottom: var(--spacing-lg);
}

.generate-form label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: var(--spacing-sm);
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
