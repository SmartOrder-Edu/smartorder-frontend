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

      <section class="weekly-report-card">
        <div class="report-card-main">
          <div class="report-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18" />
              <path d="m7 14 4-4 3 3 5-7" />
              <circle cx="7" cy="14" r="1" />
              <circle cx="11" cy="10" r="1" />
              <circle cx="14" cy="13" r="1" />
              <circle cx="19" cy="6" r="1" />
            </svg>
          </div>
          <div class="report-card-copy">
            <div class="report-card-title-row">
              <span class="report-card-label">AI 学习周报已生成</span>
              <span class="report-card-range">07/10 - 07/16</span>
            </div>
            <h2>最近 7 天你完成 18 个任务，链表基础掌握明显提升</h2>
            <p>递归调用栈仍存在步骤缺失问题，系统已为下周前两天安排补弱与验证练习。</p>
          </div>
        </div>
        <div class="report-card-actions">
          <button class="report-primary-btn" @click="openWeeklyReport">
            查看学习周报
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
          <button class="report-secondary-btn" @click="activeTab = 'week'">查看本周任务</button>
        </div>
      </section>

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

      <!-- Agent 生成任务对话框 -->
      <el-dialog
        v-model="showGenerateDialog"
        title="Agent 生成今日任务"
        width="min(720px, calc(100vw - 32px))"
        append-to-body
        destroy-on-close
        :close-on-click-modal="!generating"
        class="generate-task-dialog"
        @closed="resetGenerateDialog"
      >
        <el-form class="generate-form" label-position="top">
          <p class="generate-tip">
            Agent 会读取最近学习记录、今日已有任务、未完成任务和学习路径，再生成可执行的今日任务。
          </p>
          <div class="generate-grid">
            <el-form-item label="任务数量">
              <el-input-number v-model="generateCount" :min="1" :max="8" :step="1" style="width: 100%" />
            </el-form-item>
            <el-form-item label="今日可用时间（分钟）">
              <el-input-number v-model="generateMinutes" :min="5" :max="600" :step="15" style="width: 100%" />
            </el-form-item>
            <el-form-item label="编排策略">
              <el-select v-model="generateStrategy" style="width: 100%">
                <el-option label="截止时间优先" value="deadline_first" />
                <el-option label="薄弱点优先" value="weakness_first" />
                <el-option label="均衡分配" value="balanced" />
              </el-select>
            </el-form-item>
            <el-form-item label="练习测评">
              <el-select v-model="evaluationTaskType" :disabled="!createPracticeTasks" style="width: 100%">
                <el-option label="即时练习" value="practice_set" />
                <el-option label="阶段测评" value="assessment" />
              </el-select>
            </el-form-item>
          </div>

          <div class="generate-options">
            <el-checkbox v-model="createResourceTasks">补充学习资源</el-checkbox>
            <el-checkbox v-model="createPracticeTasks">追加练习测评</el-checkbox>
          </div>

          <el-form-item v-if="createResourceTasks" label="资源类型">
            <el-checkbox-group v-model="resourceTypes" class="resource-type-group">
              <el-checkbox label="doc">文档</el-checkbox>
              <el-checkbox label="mind_map">思维导图</el-checkbox>
              <el-checkbox label="bilibili_video">B站视频入口</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <div v-if="generating || generationSteps.length" class="generation-process">
            <div
              v-for="step in generationSteps"
              :key="step.key"
              class="process-step"
              :class="step.status"
            >
              <span class="process-dot"></span>
              <div class="process-copy">
                <span class="process-label">{{ step.label }}</span>
                <span class="process-detail">{{ step.detail }}</span>
              </div>
            </div>
          </div>

          <section v-if="scheduleResult" class="agent-schedule-result">
            <div class="result-header">
              <span class="result-label">Agent 编排说明</span>
              <strong>{{ scheduleResult.summary }}</strong>
            </div>

            <div class="evidence-grid">
              <div class="evidence-item">
                <span>最近学习</span>
                <strong>{{ scheduleResult.evidence.recentStudyMinutes }} 分钟</strong>
              </div>
              <div class="evidence-item">
                <span>完成率</span>
                <strong>{{ scheduleResult.evidence.recentCompletionRate }}%</strong>
              </div>
              <div class="evidence-item">
                <span>未完成</span>
                <strong>{{ scheduleResult.evidence.unfinishedTaskCount }} 个</strong>
              </div>
              <div class="evidence-item">
                <span>逾期</span>
                <strong>{{ scheduleResult.evidence.overdueTaskCount }} 个</strong>
              </div>
            </div>

            <div class="result-block">
              <h4>Agent 参考依据</h4>
              <ul>
                <li v-for="item in scheduleResult.evidence.decisionBasis" :key="item">{{ item }}</li>
              </ul>
            </div>

            <div class="result-block" v-if="scheduleResult.evidence.weakSignals?.length">
              <h4>最近学习信号</h4>
              <div class="weak-signal-list">
                <span v-for="signal in scheduleResult.evidence.weakSignals" :key="signal">{{ signal }}</span>
              </div>
            </div>

            <div class="result-block" v-if="scheduleResult.taskReasons?.length">
              <h4>任务安排理由</h4>
              <div class="task-reason-list">
                <div v-for="item in scheduleResult.taskReasons" :key="item.taskId" class="task-reason-card">
                  <strong>{{ item.title }}</strong>
                  <p>{{ item.reason }}</p>
                  <div class="reason-tags">
                    <span v-for="tag in item.evidenceTags" :key="tag">{{ tag }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </el-form>
        <template #footer>
          <el-button :disabled="generating" @click="closeGenerateDialog">
            {{ scheduleResult ? '完成' : '取消' }}
          </el-button>
          <el-button type="primary" :loading="generating" @click="generateTasks">
            {{ generating ? 'Agent 编排中...' : scheduleResult ? '重新生成' : '开始生成' }}
          </el-button>
        </template>
      </el-dialog>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import {
  agentScheduleApi,
  taskApi,
  type AgentScheduleProcessStep,
  type PlanTodayScheduleResult,
} from '@/api/spaceDashboard'
import { useStudyEntry } from '@/composables/useStudyEntry'
import type { TaskActionType, TaskStatus, TaskVO } from '@/types/learningSpace'

const activeTab = ref('today')
const activeFilter = ref('all')
const searchKeyword = ref('')
const showGenerateDialog = ref(false)
const generating = ref(false)
const loading = ref(false)
const generateCount = ref(3)
const generateMinutes = ref(90)
const generateStrategy = ref<'deadline_first' | 'weakness_first' | 'balanced'>('deadline_first')
const createResourceTasks = ref(true)
const createPracticeTasks = ref(true)
const resourceTypes = ref<string[]>(['doc', 'mind_map'])
const evaluationTaskType = ref<'practice_set' | 'assessment'>('practice_set')
const generationSteps = ref<AgentScheduleProcessStep[]>([])
const scheduleResult = ref<PlanTodayScheduleResult | null>(null)
const todayTasks = ref<TaskVO[]>([])
const pendingTasks = ref<TaskVO[]>([])
const overdueTasks = ref<TaskVO[]>([])
let generationStepTimers: number[] = []

const { enterTask } = useStudyEntry()
const router = useRouter()

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
  scheduleResult.value = null
  beginLocalGenerationSteps()
  try {
    const result = await agentScheduleApi.planToday({
      maxTasks: generateCount.value,
      totalAvailableMinutes: generateMinutes.value,
      strategy: generateStrategy.value,
      createResourceTasks: createResourceTasks.value,
      createPracticeTasks: createPracticeTasks.value,
      resourceTypes: createResourceTasks.value ? resourceTypes.value : [],
      evaluationTaskType: evaluationTaskType.value,
      practiceTaskCount: createPracticeTasks.value ? 1 : undefined,
      practiceQuestionCount: createPracticeTasks.value ? 5 : undefined,
    })
    scheduleResult.value = result
    applyServerProcessSteps(result.processSteps)
    await loadTasks()
    if (result.createdTaskCount === 0) {
      ElMessage.info('当前没有可新生成的今日任务，可能已有待完成任务或学习路径暂未生成')
    } else {
      ElMessage.success(`Agent 已生成 ${result.createdTaskCount} 个今日任务`)
    }
  } catch (error) {
    markCurrentGenerationStepFailed()
  } finally {
    clearGenerationTimers()
    generating.value = false
  }
}

function closeGenerateDialog() {
  showGenerateDialog.value = false
}

function resetGenerateDialog() {
  if (generating.value) return
  scheduleResult.value = null
  generationSteps.value = []
  clearGenerationTimers()
}

function defaultGenerationSteps(): AgentScheduleProcessStep[] {
  return [
    { key: 'analyze_recent_learning', label: '分析最近学习记录', status: 'running', detail: '正在读取最近学习记录和今日已有任务' },
    { key: 'identify_focus', label: '识别编排重点', status: 'pending', detail: '等待分析风险信号和薄弱项' },
    { key: 'match_learning_path', label: '匹配学习路径', status: 'pending', detail: '等待选择学习空间和路径节点' },
    { key: 'create_tasks', label: '创建学习任务', status: 'pending', detail: '等待写入今日任务' },
    { key: 'finalize_schedule', label: '整理今日任务说明', status: 'pending', detail: '等待生成编排依据和任务理由' },
  ]
}

function beginLocalGenerationSteps() {
  clearGenerationTimers()
  generationSteps.value = defaultGenerationSteps()
  generationStepTimers = [
    window.setTimeout(() => advanceGenerationStep(0, 1), 500),
    window.setTimeout(() => advanceGenerationStep(1, 2), 1100),
    window.setTimeout(() => advanceGenerationStep(2, 3), 1700),
    window.setTimeout(() => advanceGenerationStep(3, 4), 2300),
  ]
}

function advanceGenerationStep(doneIndex: number, runningIndex: number) {
  if (!generating.value || !generationSteps.value[doneIndex]) return
  generationSteps.value[doneIndex] = {
    ...generationSteps.value[doneIndex],
    status: 'completed',
  }
  if (generationSteps.value[runningIndex]) {
    generationSteps.value[runningIndex] = {
      ...generationSteps.value[runningIndex],
      status: 'running',
    }
  }
}

function applyServerProcessSteps(steps: AgentScheduleProcessStep[] = []) {
  clearGenerationTimers()
  generationSteps.value = steps.length
    ? steps.map(step => ({ ...step, status: step.status || 'completed' }))
    : generationSteps.value.map(step => ({ ...step, status: 'completed' }))
}

function markCurrentGenerationStepFailed() {
  const runningIndex = generationSteps.value.findIndex(step => step.status === 'running')
  const targetIndex = runningIndex >= 0 ? runningIndex : generationSteps.value.length - 1
  if (targetIndex >= 0) {
    generationSteps.value[targetIndex] = {
      ...generationSteps.value[targetIndex],
      status: 'failed',
      detail: 'Agent 编排失败，请稍后重试或检查学习空间配置',
    }
  }
}

function clearGenerationTimers() {
  generationStepTimers.forEach(timer => window.clearTimeout(timer))
  generationStepTimers = []
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

function openWeeklyReport() {
  router.push('/learning-report/weekly')
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

.weekly-report-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  border: 1px solid rgba(11, 183, 170, 0.14);
  border-radius: var(--radius-xl);
  background:
    linear-gradient(135deg, rgba(11, 183, 170, 0.1), rgba(59, 130, 246, 0.06)),
    var(--panel-bg);
  box-shadow: var(--shadow-sm);
}

.report-card-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  min-width: 0;
}

.report-card-icon {
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: var(--radius-lg);
  background: #0bb7aa;
  color: #ffffff;
  box-shadow: 0 12px 26px rgba(11, 183, 170, 0.24);
}

.report-card-icon svg {
  width: 26px;
  height: 26px;
}

.report-card-copy {
  min-width: 0;
}

.report-card-title-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-xs);
}

.report-card-label {
  color: var(--primary-color);
  font-size: 0.8125rem;
  font-weight: 700;
}

.report-card-range {
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  font-size: 0.6875rem;
  font-weight: 700;
}

.report-card-copy h2 {
  margin: 0 0 var(--spacing-xs);
  color: var(--text-dark);
  font-size: 1.125rem;
  line-height: 1.4;
}

.report-card-copy p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.8125rem;
  line-height: 1.7;
}

.report-card-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.report-primary-btn,
.report-secondary-btn {
  height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: var(--radius-full);
  padding: 0 16px;
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.report-primary-btn {
  border: 0;
  background: var(--primary-color);
  color: #ffffff;
  box-shadow: 0 10px 20px rgba(11, 183, 170, 0.2);
}

.report-primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 24px rgba(11, 183, 170, 0.24);
}

.report-primary-btn svg {
  width: 14px;
  height: 14px;
}

.report-secondary-btn {
  border: 1px solid var(--border-color);
  background: var(--button-bg);
  color: var(--text-secondary);
}

.report-secondary-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: var(--button-hover-bg);
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

.generate-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-md) var(--spacing-lg);
}

.generate-options {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  padding: var(--spacing-sm) 0 var(--spacing-md);
}

.resource-type-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm) var(--spacing-lg);
}

.generation-process {
  display: grid;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  margin: var(--spacing-md) 0;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  background: var(--background-color-base);
}

.process-step {
  display: grid;
  grid-template-columns: 14px minmax(0, 1fr);
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.process-dot {
  width: 10px;
  height: 10px;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--border-color);
}

.process-step.running .process-dot {
  background: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(11, 183, 170, 0.12);
}

.process-step.completed .process-dot {
  background: var(--accent-color);
}

.process-step.failed .process-dot {
  background: var(--danger-color);
}

.process-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.process-label {
  color: var(--text-dark);
  font-size: 0.8125rem;
  font-weight: 700;
}

.process-detail {
  color: var(--text-secondary);
  font-size: 0.75rem;
  line-height: 1.5;
}

.agent-schedule-result {
  display: grid;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  margin-top: var(--spacing-md);
  border: 1px solid rgba(11, 183, 170, 0.18);
  border-radius: var(--radius-lg);
  background: rgba(11, 183, 170, 0.04);
}

.result-header {
  display: grid;
  gap: 4px;
}

.result-label {
  color: var(--primary-color);
  font-size: 0.75rem;
  font-weight: 700;
}

.result-header strong {
  color: var(--text-dark);
  font-size: 0.9375rem;
  line-height: 1.5;
}

.evidence-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--spacing-sm);
}

.evidence-item {
  display: grid;
  gap: 4px;
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  background: var(--panel-bg);
  border: 1px solid var(--border-light);
}

.evidence-item span {
  color: var(--text-secondary);
  font-size: 0.6875rem;
}

.evidence-item strong {
  color: var(--text-dark);
  font-size: 0.9375rem;
}

.result-block {
  display: grid;
  gap: var(--spacing-sm);
}

.result-block h4 {
  margin: 0;
  color: var(--text-dark);
  font-size: 0.8125rem;
}

.result-block ul {
  margin: 0;
  padding-left: 18px;
  color: var(--text-secondary);
  font-size: 0.75rem;
  line-height: 1.7;
}

.weak-signal-list,
.reason-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.weak-signal-list span,
.reason-tags span {
  padding: 3px 8px;
  border-radius: var(--radius-full);
  background: rgba(245, 158, 11, 0.1);
  color: #b45309;
  font-size: 0.6875rem;
  line-height: 1.4;
}

.task-reason-list {
  display: grid;
  gap: var(--spacing-sm);
}

.task-reason-card {
  display: grid;
  gap: 6px;
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  background: var(--panel-bg);
  border: 1px solid var(--border-light);
}

.task-reason-card strong {
  color: var(--text-dark);
  font-size: 0.8125rem;
}

.task-reason-card p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.75rem;
  line-height: 1.6;
}

.generate-form :deep(.el-form-item) {
  margin-bottom: var(--spacing-lg);
}

.generate-form :deep(.el-form-item__label) {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
  line-height: 1.4;
  margin-bottom: var(--spacing-xs);
}

.generate-task-dialog :deep(.el-dialog__body) {
  padding-top: var(--spacing-sm);
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .weekly-report-card,
  .report-card-main,
  .report-card-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .generate-grid,
  .evidence-grid {
    grid-template-columns: 1fr;
  }
}
</style>
