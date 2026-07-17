<template>
  <AppLayout>
    <div class="tasks-page">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">任务日程</h1>
          <p class="page-desc">管理今日计划、本周安排和所有学习任务，按学习空间和路径节点推进</p>
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
            生成今日任务
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
      <section class="section tasks-list-section" v-loading="loading">
        <div class="tasks-list">
          <div
            v-for="task in filteredTasks"
            :key="task.id"
            class="task-item"
            :class="[`type-${actionClass(task)}`, { completed: task.status === 'completed' }]"
          >
            <div class="task-check" @click="toggleTask(task)">
              <div class="check-circle" :class="taskStatusClass(task)">
                <svg v-if="task.status === 'completed'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              </div>
            </div>

            <div class="task-body">
              <div class="task-meta">
                <span class="type-badge" :class="actionClass(task)">{{ actionTypeLabel(task) }}</span>
                <span class="task-date">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  {{ deadlineLabel(task) }}
                </span>
                <span class="task-duration">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  </svg>
                  {{ task.estimatedDurationMinutes || '-' }}分钟
                </span>
              </div>

              <h3 class="task-title">{{ task.title }}</h3>
              <p class="task-reason">{{ taskReason(task) }}</p>

              <div class="task-footer">
                <div class="task-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: taskProgress(task) + '%' }"></div>
                  </div>
                  <span class="progress-text">{{ taskProgress(task) }}%</span>
                </div>
                <div class="task-tags">
                  <span v-for="tag in taskTags(task)" :key="tag" class="task-tag">{{ tag }}</span>
                </div>
              </div>
            </div>

            <div class="task-actions">
              <el-button
                v-if="task.status !== 'completed' && task.status !== 'cancelled'"
                type="primary"
                size="small"
                @click="startTask(task)"
              >
                {{ startButtonLabel(task) }}
              </el-button>
              <el-button
                v-if="task.status === 'in_progress' || task.status === 'doing'"
                size="small"
                @click="completeTask(task)"
              >
                完成
              </el-button>
              <el-button v-else-if="task.status === 'completed'" size="small" @click="startTask(task)">
                回顾
              </el-button>
              <el-button
                v-if="task.status !== 'completed' && task.status !== 'cancelled'"
                size="small"
                text
                @click="cancelTask(task)"
              >
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
          <p>点击"生成今日任务"，系统会从活跃学习空间中安排下一步</p>
          <el-button type="primary" @click="showGenerateDialog = true">生成任务</el-button>
        </div>
      </section>

      <!-- 生成任务对话框 -->
      <el-dialog v-model="showGenerateDialog" title="生成今日学习任务" width="520px">
        <div class="generate-form">
          <p class="generate-tip">系统会读取你的活跃学习空间，沿学习路径选择尚未安排的下一节点，生成可直接开始的今日学习任务。</p>
          <div class="form-item">
            <label>任务数量</label>
            <el-slider v-model="generateCount" :min="1" :max="8" show-stops />
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import { taskApi } from '@/api/spaceDashboard'
import { useStudyEntry } from '@/composables/useStudyEntry'
import type { TaskActionType, TaskStatus, TaskVO } from '@/types/learningSpace'

const activeTab = ref('today')
const activeFilter = ref('all')
const searchKeyword = ref('')
const showGenerateDialog = ref(false)
const generating = ref(false)
const loading = ref(false)
const generateCount = ref(3)
const todayTasks = ref<TaskVO[]>([])
const pendingTasks = ref<TaskVO[]>([])
const overdueTasks = ref<TaskVO[]>([])

const { enterTask } = useStudyEntry()

const filters = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'in_progress' },
  { label: '待开始', value: 'pending' },
  { label: '已完成', value: 'completed' }
]

const allTasks = computed<TaskVO[]>(() => {
  const taskMap = new Map<string, TaskVO>()
  ;[...todayTasks.value, ...pendingTasks.value, ...overdueTasks.value].forEach(task => {
    taskMap.set(String(task.id), task)
  })
  return Array.from(taskMap.values())
})

const taskStats = computed(() => ({
  review: allTasks.value.filter(task => task.taskType === 'review' || task.actionType === 'mistake_review').length,
  practice: allTasks.value.filter(task => task.actionType === 'practice_set' || task.actionType === 'assessment').length,
  resource: allTasks.value.filter(task => task.actionType === 'read_resource' || task.actionType === 'watch_video').length,
  completed: allTasks.value.filter(task => task.status === 'completed').length,
}))

const filteredTasks = computed(() => {
  let result = activeTab.value === 'today'
    ? todayTasks.value
    : allTasks.value

  if (activeTab.value === 'week') {
    result = result.filter(task => task.isToday || isWithinWeek(task.dueDate) || task.isOverdue)
  }

  if (activeFilter.value !== 'all') {
    result = result.filter(task => task.status === activeFilter.value)
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.trim().toLowerCase()
    result = result.filter(task =>
      task.title.toLowerCase().includes(keyword) ||
      task.description?.toLowerCase().includes(keyword) ||
      taskTags(task).some(tag => tag.toLowerCase().includes(keyword))
    )
  }

  return result
})

onMounted(() => {
  loadTasks()
})

async function loadTasks() {
  loading.value = true
  try {
    const [today, pending, overdue] = await Promise.all([
      taskApi.listToday(),
      taskApi.listPending(),
      taskApi.listOverdue(),
    ])
    todayTasks.value = today
    pendingTasks.value = pending
    overdueTasks.value = overdue
  } finally {
    loading.value = false
  }
}

async function generateTasks() {
  generating.value = true
  try {
    const created = await taskApi.planToday({ maxTasks: generateCount.value })
    showGenerateDialog.value = false
    await loadTasks()
    if (created.length === 0) {
      ElMessage.info('当前没有可新生成的今日任务，可能已有待完成任务或学习路径暂未生成')
    } else {
      ElMessage.success(`已生成 ${created.length} 个今日任务`)
    }
  } finally {
    generating.value = false
  }
}

async function startTask(task: TaskVO) {
  const current = task.status === 'pending'
    ? await taskApi.updateStatus(String(task.id), 'in_progress')
    : task
  if (task.status === 'pending') {
    await loadTasks()
  }
  enterTask(current, {
    spaceId: current.spaceId,
    source: 'task_card',
  })
}

async function completeTask(task: TaskVO) {
  await taskApi.complete(String(task.id), {
    actualDurationMinutes: task.estimatedDurationMinutes || 0,
  })
  ElMessage.success('任务已完成')
  await loadTasks()
}

async function cancelTask(task: TaskVO) {
  await taskApi.updateStatus(String(task.id), 'cancelled')
  ElMessage.success('任务已取消')
  await loadTasks()
}

function toggleTask(task: TaskVO) {
  if (task.status === 'completed' || task.status === 'cancelled') {
    return
  }
  completeTask(task)
}

function actionClass(task: TaskVO) {
  const actionType = task.actionType
  if (actionType === 'practice_set' || actionType === 'assessment') return 'practice'
  if (actionType === 'read_resource' || actionType === 'watch_video') return 'resource'
  if (actionType === 'project_practice') return 'project'
  return 'review'
}

function taskStatusClass(task: TaskVO) {
  if (task.status === 'completed') return 'done'
  if (task.status === 'in_progress' || task.status === 'doing') return 'doing'
  return 'todo'
}

function actionTypeLabel(task: TaskVO) {
  const labels: Record<TaskActionType, string> = {
    learn_script: '学习',
    read_resource: '阅读',
    watch_video: '视频',
    practice_set: '练习',
    assessment: '测评',
    mistake_review: '错题',
    project_practice: '实践',
    summary_reflection: '总结',
  }
  return labels[task.actionType || 'learn_script']
}

function deadlineLabel(task: TaskVO) {
  if (task.isOverdue) return '已逾期'
  if (task.isToday) return '今天'
  if (!task.dueDate) return '未排期'
  const dueDate = new Date(`${task.dueDate}T00:00:00`)
  const today = startOfToday()
  const diff = Math.round((dueDate.getTime() - today.getTime()) / 86400000)
  if (diff === 1) return '明天'
  if (diff > 1 && diff <= 7) return '本周'
  return task.dueDate
}

function taskReason(task: TaskVO) {
  return task.agentReason || task.aiSuggestion || task.description || '系统根据当前学习计划生成的任务'
}

function taskProgress(task: TaskVO) {
  if (task.status === 'completed') return 100
  if (task.status === 'in_progress' || task.status === 'doing') return 50
  return 0
}

function taskTags(task: TaskVO) {
  const tags = [actionTypeLabel(task), statusLabel(task.status)]
  if (task.isOverdue) tags.push('逾期')
  if (task.priority <= 2) tags.push('高优先级')
  return tags
}

function startButtonLabel(task: TaskVO) {
  if (task.status === 'in_progress' || task.status === 'doing') return '继续'
  if (task.actionType === 'practice_set') return '做题'
  if (task.actionType === 'assessment') return '测评'
  return '开始'
}

function statusLabel(status: TaskStatus) {
  const labels: Record<TaskStatus, string> = {
    pending: '待开始',
    in_progress: '进行中',
    doing: '进行中',
    completed: '已完成',
    overdue: '已逾期',
    cancelled: '已取消',
  }
  return labels[status]
}

function isWithinWeek(dueDate?: string | null) {
  if (!dueDate) return false
  const date = new Date(`${dueDate}T00:00:00`)
  const today = startOfToday()
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000)
  return diff >= 0 && diff <= 7
}

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}
</script>

<style scoped>
.tasks-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
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

.review-icon { background: rgba(11, 183, 170, 0.1); color: var(--primary-color); }
.practice-icon { background: rgba(18, 184, 134, 0.1); color: var(--accent-color); }
.resource-icon { background: rgba(245, 158, 11, 0.1); color: var(--warning-color); }
.done-icon { background: rgba(11, 183, 170, 0.06); color: var(--text-secondary); }

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
  background: rgba(11, 183, 170, 0.1);
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

.type-badge.review { background: rgba(11, 183, 170, 0.1); color: var(--primary-color); }
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
  background: rgba(11, 183, 170, 0.06);
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
.generate-tip {
  margin: 0 0 var(--spacing-lg);
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.7;
}

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
