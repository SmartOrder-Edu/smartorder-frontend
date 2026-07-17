<template>
  <AppLayout>
    <div class="tasks-page">
      <header class="task-hero">
        <div class="hero-copy">
          <h1>任务日程</h1>
          <p>管理今日计划、本周安排和所有学习任务，按学习空间和路径节点推进</p>
          <div class="date-card" aria-label="今日日期与学习提示">
            <span class="date-icon" aria-hidden="true" v-html="calendarIcon"></span>
            <div>
              <strong>{{ todayHeader }}</strong>
              <span>{{ greetingText }}</span>
            </div>
          </div>
        </div>

        <div class="hero-actions">
          <div class="segment-control" role="tablist" aria-label="任务范围">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              type="button"
              :class="{ active: activeTab === tab.value }"
              @click="activeTab = tab.value"
            >
              {{ tab.label }}
            </button>
          </div>
          <button class="primary-action" type="button" :disabled="generating" @click="showGenerateDialog = true">
            <svg v-if="!generating" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3l1.7 4.4L18 9l-4.3 1.6L12 15l-1.7-4.4L6 9l4.3-1.6L12 3z" />
              <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" />
            </svg>
            <span v-else class="loading-dot"></span>
            {{ generating ? '生成中' : '生成今日任务' }}
          </button>
        </div>
      </header>

      <section class="stats-grid" aria-label="任务数据概览">
        <article v-for="item in statCards" :key="item.key" class="stat-card" :class="item.key">
          <div class="stat-icon" v-html="item.icon"></div>
          <div class="stat-copy">
            <strong>{{ item.value }}</strong>
            <span>{{ item.label }}</span>
            <small>{{ item.hint }}</small>
          </div>
          <svg class="trend-line" viewBox="0 0 120 30" preserveAspectRatio="none" aria-hidden="true">
            <path :d="item.trend" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </article>

        <article class="stat-card focus-card">
          <div class="focus-ring" :style="{ '--progress': `${focusProgress}%` }">
            <span>{{ focusProgress }}</span>
            <small>%</small>
          </div>
          <div class="stat-copy">
            <strong>今日专注进度</strong>
            <span>目标 {{ completedTodayCount }}/{{ visibleTodayCount }} 任务</span>
            <small>{{ totalPlannedMinutes }} 分钟计划学习</small>
          </div>
        </article>
      </section>

      <div class="content-grid">
        <main class="task-main">
          <section class="task-toolbar" aria-label="任务搜索与筛选">
            <label class="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input v-model="searchKeyword" type="search" placeholder="搜索任务、学习空间或说明..." />
              <button v-if="searchKeyword" type="button" aria-label="清空搜索" @click="searchKeyword = ''">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </label>

            <div class="filter-group" aria-label="任务状态筛选">
              <button
                v-for="filter in filters"
                :key="filter.value"
                type="button"
                class="filter-chip"
                :class="{ active: activeFilter === filter.value }"
                @click="activeFilter = filter.value"
              >
                {{ filter.label }}
              </button>
            </div>

            <div class="toolbar-tail">
              <button class="sort-button" type="button" @click="toggleSort">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 4v16" />
                </svg>
                {{ sortMode === 'time_asc' ? '按时间排序' : '按优先级排序' }}
              </button>
              <div class="view-switch" aria-label="视图切换">
                <button type="button" :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'" aria-label="列表视图">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                  </svg>
                </button>
                <button type="button" :class="{ active: viewMode === 'card' }" @click="viewMode = 'card'" aria-label="卡片视图">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </button>
              </div>
            </div>
          </section>

          <section class="tasks-panel" v-loading="loading">
            <div v-if="loadError" class="state-box error-state">
              <strong>任务加载失败</strong>
              <p>{{ loadError }}</p>
              <button type="button" @click="loadTasks">重新加载</button>
            </div>

            <div v-else-if="!loading && filteredTasks.length === 0" class="state-box empty-state">
              <div class="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" />
                  <path d="m9 14 2 2 4-5" />
                </svg>
              </div>
              <strong>{{ searchKeyword ? '没有匹配的任务' : '暂无任务' }}</strong>
              <p>{{ searchKeyword ? '换个关键词或清空筛选后再试。' : '点击生成今日任务，系统会从活跃学习空间中安排下一步。' }}</p>
              <button type="button" @click="showGenerateDialog = true">生成任务</button>
            </div>

            <div v-else class="task-list" :class="{ 'card-view': viewMode === 'card' }">
              <article
                v-for="task in filteredTasks"
                :key="task.id"
                class="learning-task-card"
                :class="[`type-${actionClass(task)}`, { completed: task.status === 'completed' }]"
              >
                <div class="task-time-axis">
                  <span class="axis-dot" :class="taskStatusClass(task)"></span>
                  <strong>{{ deadlineLabel(task) }}</strong>
                  <span>{{ formatTaskTime(task) }}</span>
                </div>

                <button
                  class="task-check"
                  type="button"
                  :class="taskStatusClass(task)"
                  :disabled="isTaskBusy(task.id) || task.status === 'completed' || task.status === 'cancelled'"
                  aria-label="完成任务"
                  @click="toggleTask(task)"
                >
                  <svg v-if="task.status === 'completed'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <path d="m20 6-11 11-5-5" />
                  </svg>
                </button>

                <div class="task-type-icon" v-html="typeIcon(task)"></div>

                <div class="task-body">
                  <div class="task-meta">
                    <span class="type-badge" :class="actionClass(task)">{{ actionTypeLabel(task) }}</span>
                    <span class="meta-item">
                      <span class="meta-icon" aria-hidden="true" v-html="clockIcon"></span>
                      {{ deadlineLabel(task) }} · {{ task.estimatedDurationMinutes || 25 }}分钟
                    </span>
                  </div>

                  <h2>{{ task.title || '未命名学习任务' }}</h2>
                  <p>{{ taskReason(task) }}</p>

                  <div class="task-bottom">
                    <span class="space-pill">{{ spaceLabel(task) }}</span>
                    <div class="task-progress">
                      <span class="progress-track"><i :style="{ width: `${taskProgress(task)}%` }"></i></span>
                      <strong>{{ taskProgress(task) }}%</strong>
                    </div>
                  </div>
                </div>

                <div class="task-side">
                  <span class="status-pill" :class="taskStatusClass(task)">{{ statusLabel(task.status) }}</span>
                  <button
                    v-if="task.status !== 'completed' && task.status !== 'cancelled'"
                    class="start-button"
                    type="button"
                    :disabled="isTaskBusy(task.id)"
                    @click="startTask(task)"
                  >
                    {{ isTaskBusy(task.id) ? '处理中' : startButtonLabel(task) }}
                  </button>
                  <button v-else-if="task.status === 'completed'" class="ghost-button" type="button" @click="startTask(task)">
                    回顾
                  </button>
                  <el-dropdown trigger="click">
                    <button class="more-button" type="button" aria-label="更多操作">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                      </svg>
                    </button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item v-if="task.status !== 'completed'" @click="completeTask(task)">标记完成</el-dropdown-item>
                        <el-dropdown-item @click="startTask(task)">进入学习</el-dropdown-item>
                        <el-dropdown-item
                          v-if="task.status !== 'completed' && task.status !== 'cancelled'"
                          divided
                          @click="cancelTask(task)"
                        >
                          删除任务
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </article>
            </div>
          </section>
        </main>

        <aside class="assist-rail">
          <section class="rail-card rhythm-card">
            <div class="rail-header">
              <strong>今日学习节奏</strong>
              <button type="button" @click="activeTab = 'today'">查看完整日程</button>
            </div>
            <div class="rhythm-list">
              <div v-for="item in todayRhythm" :key="item.id" class="rhythm-item" :class="item.status">
                <span class="rhythm-time">{{ item.time }}</span>
                <span class="rhythm-dot"></span>
                <span class="rhythm-title">{{ item.title }}</span>
              </div>
            </div>
          </section>

          <section class="rail-card streak-card">
            <div>
              <strong>学习连续打卡</strong>
              <p><span>{{ streakDays }}</span> 天</p>
              <small>{{ streakMessage }}</small>
            </div>
            <div class="medal" aria-hidden="true">
              <svg viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="24" fill="url(#medalGradient)" />
                <path d="M40 24l5 10 11 1.6-8 7.8 1.9 11-9.9-5.2-9.9 5.2 1.9-11-8-7.8L35 34l5-10z" fill="#fff" />
                <defs>
                  <linearGradient id="medalGradient" x1="16" y1="16" x2="64" y2="64">
                    <stop stop-color="#f59e0b" />
                    <stop offset="1" stop-color="#7c3aed" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </section>
        </aside>
      </div>

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
            <div class="generation-analysis">
              <div class="analysis-header">
                <span>AI 分析情况</span>
                <strong>{{ agentAnalysisTitle }}</strong>
              </div>

              <div class="analysis-grid">
                <div v-for="item in agentAnalysisCards" :key="item.label" class="analysis-item">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                  <small>{{ item.detail }}</small>
                </div>
              </div>

              <div class="analysis-panels">
                <div class="analysis-panel weakness-panel">
                  <h4>学习薄弱点</h4>
                  <ul>
                    <li v-for="item in agentWeaknessItems" :key="item">{{ item }}</li>
                  </ul>
                </div>

                <div class="analysis-panel">
                  <h4>相关学习信息</h4>
                  <ul>
                    <li v-for="item in agentRelatedInfo" :key="item">{{ item }}</li>
                  </ul>
                </div>

                <div class="analysis-panel basis-panel">
                  <h4>Agent 编排依据</h4>
                  <ul>
                    <li v-for="item in agentDecisionBasis" :key="item">{{ item }}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="process-divider"></div>

            <div v-for="step in generationSteps" :key="step.key" class="process-step" :class="step.status">
              <span class="process-dot"></span>
              <div class="process-copy">
                <span class="process-label">{{ step.label }}</span>
                <span class="process-detail">{{ step.detail }}</span>
              </div>
            </div>
          </div>

          <section v-if="scheduleResult" class="agent-schedule-result">
            <div class="result-header">
              <span>Agent 编排说明</span>
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
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import {
  agentScheduleApi,
  taskApi,
  type AgentScheduleEvidence,
  type AgentScheduleProcessStep,
  type PlanTodayScheduleResult,
} from '@/api/spaceDashboard'
import { useStudyEntry } from '@/composables/useStudyEntry'
import type { TaskActionType, TaskStatus, TaskVO } from '@/types/learningSpace'
import calendarIcon from '@/assets/icons/task-schedule/calendar.svg?raw'
import bookIcon from '@/assets/icons/task-schedule/book.svg?raw'
import practiceIcon from '@/assets/icons/task-schedule/practice.svg?raw'
import folderIcon from '@/assets/icons/task-schedule/folder.svg?raw'
import clockIcon from '@/assets/icons/task-schedule/clock.svg?raw'
import taskProgressIcon from '@/assets/icons/task-schedule/task-progress.svg?raw'

type TabValue = 'today' | 'week' | 'all'
type FilterValue = 'all' | 'in_progress' | 'pending' | 'completed'
type SortMode = 'time_asc' | 'priority_desc'

interface AgentAnalysisCard {
  label: string
  value: string
  detail: string
}

const activeTab = ref<TabValue>('today')
const activeFilter = ref<FilterValue>('all')
const searchKeyword = ref('')
const sortMode = ref<SortMode>('time_asc')
const viewMode = ref<'list' | 'card'>('list')
const showGenerateDialog = ref(false)
const generating = ref(false)
const loading = ref(false)
const loadError = ref('')
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
const busyTaskIds = ref<Set<string>>(new Set())
let generationStepTimers: number[] = []

const { enterTask } = useStudyEntry()

const tabs: Array<{ label: string; value: TabValue }> = [
  { label: '今日任务', value: 'today' },
  { label: '本周任务', value: 'week' },
  { label: '全部任务', value: 'all' },
]

const filters: Array<{ label: string; value: FilterValue }> = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'in_progress' },
  { label: '待开始', value: 'pending' },
  { label: '已完成', value: 'completed' },
]

const allTasks = computed<TaskVO[]>(() => {
  const taskMap = new Map<string, TaskVO>()
  ;[...todayTasks.value, ...pendingTasks.value, ...overdueTasks.value].forEach(task => {
    taskMap.set(String(task.id), task)
  })
  return Array.from(taskMap.values())
})

const visibleTodayCount = computed(() => todayTasks.value.filter(task => task.status !== 'cancelled').length)
const completedTodayCount = computed(() => todayTasks.value.filter(task => task.status === 'completed').length)
const focusProgress = computed(() => {
  if (!visibleTodayCount.value) return 0
  return Math.round((completedTodayCount.value / visibleTodayCount.value) * 100)
})

const taskStats = computed(() => ({
  review: allTasks.value.filter(task => task.taskType === 'review' || task.actionType === 'mistake_review').length,
  practice: allTasks.value.filter(task => task.actionType === 'practice_set' || task.actionType === 'assessment').length,
  resource: allTasks.value.filter(task => task.actionType === 'read_resource' || task.actionType === 'watch_video').length,
  completed: allTasks.value.filter(task => task.status === 'completed').length,
}))

const totalPlannedMinutes = computed(() =>
  todayTasks.value.reduce((sum, task) => sum + Number(task.estimatedDurationMinutes || 0), 0)
)

const statCards = computed(() => [
  {
    key: 'review',
    value: taskStats.value.review,
    label: '复习任务',
    hint: taskStats.value.review ? '巩固薄弱节点' : '今日暂无复习',
    trend: 'M4 22 C20 12 30 20 42 14 S64 8 78 13 98 6 116 10',
    icon: bookIcon,
  },
  {
    key: 'practice',
    value: taskStats.value.practice,
    label: '练习任务',
    hint: taskStats.value.practice ? '用测评校准掌握度' : '等待生成练习',
    trend: 'M4 24 C18 18 26 21 38 12 S62 17 72 9 94 15 116 7',
    icon: checkIcon,
  },
  {
    key: 'resource',
    value: taskStats.value.resource,
    label: '资源任务',
    hint: taskStats.value.resource ? '补齐学习材料' : '资源队列为空',
    trend: 'M4 22 C18 18 28 23 38 16 S60 10 72 17 88 5 116 12',
    icon: folderIcon,
  },
  {
    key: 'completed',
    value: taskStats.value.completed,
    label: '已完成',
    hint: `完成率 ${localRecentCompletionRate.value}%`,
    trend: 'M4 24 C20 24 26 18 40 18 S62 12 76 10 92 14 116 8',
    icon: doneIcon,
  },
])

const localUnfinishedCount = computed(() =>
  allTasks.value.filter(task => task.status !== 'completed' && task.status !== 'cancelled').length
)

const localOverdueCount = computed(() =>
  allTasks.value.filter(task => task.isOverdue || task.status === 'overdue').length
)

const localTodayExistingCount = computed(() =>
  todayTasks.value.filter(task => task.status !== 'cancelled').length
)

const localRecentCompletionRate = computed(() => {
  if (!allTasks.value.length) return 0
  return Math.round((taskStats.value.completed / allTasks.value.length) * 100)
})

const todayHeader = computed(() => {
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
  return formatter.format(new Date())
})

const greetingText = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '上午好，先完成最小的一步'
  if (hour < 18) return '下午好，继续保持专注'
  return '晚上好，收个漂亮的尾'
})

const streakDays = computed(() => Math.max(1, Math.min(7 + taskStats.value.completed, 30)))
const streakMessage = computed(() => (focusProgress.value >= 60 ? '节奏很好，继续推进。' : '再完成一项，今日进度会更稳。'))

const todayRhythm = computed(() => {
  const source = todayTasks.value.length ? todayTasks.value : filteredTasks.value
  return source.slice(0, 5).map((task, index) => ({
    id: String(task.id),
    time: task.dueTime || defaultRhythmTimes[index] || '--:--',
    title: task.status === 'completed' ? `完成：${task.title}` : task.title,
    status: task.status === 'completed' ? 'completed' : task.status === 'in_progress' || task.status === 'doing' ? 'current' : 'pending',
  }))
})

const scheduleCompositionText = computed(() => {
  const result = scheduleResult.value
  if (result) {
    const parts = [
      result.learningTaskCount ? `学习 ${result.learningTaskCount}` : '',
      result.resourceTaskCount ? `资源 ${result.resourceTaskCount}` : '',
      result.practiceTaskCount ? `练习 ${result.practiceTaskCount}` : '',
    ].filter(Boolean)
    return parts.length ? parts.join(' / ') : '暂无新增任务'
  }

  const parts = ['学习任务优先']
  if (createResourceTasks.value) parts.push(`资源 ${resourceTypes.value.length || 1} 类`)
  if (createPracticeTasks.value) parts.push(evaluationTaskType.value === 'assessment' ? '阶段测评' : '即时练习')
  return parts.join(' / ')
})

const agentAnalysisTitle = computed(() => {
  const evidence = scheduleResult.value?.evidence
  if (evidence) {
    return `已基于最近 ${evidence.recentDays} 天学习数据完成编排判断`
  }
  return `正在按「${strategyLabel(generateStrategy.value)}」分析今日任务负载`
})

const agentAnalysisCards = computed<AgentAnalysisCard[]>(() => {
  const evidence = scheduleResult.value?.evidence
  if (evidence) return buildEvidenceAnalysisCards(evidence)

  return [
    {
      label: '可用时间',
      value: `${generateMinutes.value} 分钟`,
      detail: `目标生成 ${generateCount.value} 个任务`,
    },
    {
      label: '当前完成率',
      value: `${localRecentCompletionRate.value}%`,
      detail: `${taskStats.value.completed}/${allTasks.value.length || 0} 个任务已完成`,
    },
    {
      label: '今日负载',
      value: `${localTodayExistingCount.value} 个`,
      detail: `未完成 ${localUnfinishedCount.value} 个，逾期 ${localOverdueCount.value} 个`,
    },
    {
      label: '编排倾向',
      value: strategyLabel(generateStrategy.value),
      detail: scheduleCompositionText.value,
    },
  ]
})

const agentWeaknessItems = computed(() => {
  const evidence = scheduleResult.value?.evidence
  if (evidence) {
    return normalizeInsightList(evidence.weakSignals, '未发现明显薄弱点，按学习路径稳定推进')
  }

  const signals: string[] = []
  if (localOverdueCount.value > 0) {
    signals.push(`学习节奏风险：当前有 ${localOverdueCount.value} 个逾期任务`)
  }
  if (localUnfinishedCount.value > localTodayExistingCount.value) {
    signals.push(`任务消化不足：仍有 ${localUnfinishedCount.value} 个未完成任务`)
  }
  allTasks.value
    .filter(task => task.actionType === 'mistake_review' || task.taskType === 'review')
    .slice(0, 2)
    .forEach(task => signals.push(`待复习巩固：${task.title}`))
  if (createPracticeTasks.value) {
    signals.push(`需要验证掌握：将通过${evaluationTaskTypeLabel(evaluationTaskType.value)}检查学习效果`)
  }
  if (!signals.length) {
    signals.push('暂无明确薄弱信号，Agent 会优先依据学习路径下一节点推进')
  }
  return signals.slice(0, 4)
})

const agentRelatedInfo = computed(() => {
  const evidence = scheduleResult.value?.evidence
  if (evidence) {
    const info = [
      `最近 ${evidence.recentDays} 天学习记录 ${evidence.recentRecordCount} 条，累计 ${evidence.recentStudyMinutes} 分钟`,
      `近期任务完成 ${evidence.recentCompletedTasks}/${evidence.recentPlannedTasks || 0}，完成率 ${evidence.recentCompletionRate}%`,
      evidence.averageFocusLevel != null ? `平均专注度 ${evidence.averageFocusLevel}` : '',
      evidence.averageSelfRating != null ? `平均自评掌握度 ${evidence.averageSelfRating}` : '',
      evidence.recentSpaces?.length ? `涉及空间：${evidence.recentSpaces.slice(0, 3).join('、')}` : '',
    ]
    return normalizeInsightList(info, '最近暂无足够学习记录，主要参考任务状态和学习路径')
  }

  return [
    `今日已有任务 ${localTodayExistingCount.value} 个，未完成 ${localUnfinishedCount.value} 个`,
    `本次可用时间 ${generateMinutes.value} 分钟，计划生成 ${generateCount.value} 个任务`,
    `资源补充：${createResourceTasks.value ? resourceTypeLabels(resourceTypes.value).join('、') : '未开启'}`,
    `练习测评：${createPracticeTasks.value ? evaluationTaskTypeLabel(evaluationTaskType.value) : '未开启'}`,
  ]
})

const agentDecisionBasis = computed(() => {
  const evidence = scheduleResult.value?.evidence
  if (evidence) {
    const basis = [
      ...evidence.decisionBasis,
      ...(scheduleResult.value?.taskReasons?.slice(0, 2).map(item => `${item.title}：${item.reason}`) || []),
    ]
    return normalizeInsightList(basis, 'Agent 已完成任务编排，但暂无额外依据说明')
  }

  const basis = [
    `按「${strategyLabel(generateStrategy.value)}」选择学习空间和路径节点`,
    localOverdueCount.value > 0
      ? '先处理逾期和高优先级任务，避免继续堆积'
      : '优先推进当前学习路径中的下一步任务',
    createResourceTasks.value ? '为薄弱点补充配套资源，降低回看成本' : '',
    createPracticeTasks.value ? '追加练习/测评，用结果验证是否真正掌握' : '',
  ]
  return normalizeInsightList(basis, '等待 Agent 读取学习记录和路径节点')
})

const filteredTasks = computed(() => {
  let result = activeTab.value === 'today' ? [...todayTasks.value] : [...allTasks.value]

  if (activeTab.value === 'week') {
    result = result.filter(task => task.isToday || isWithinWeek(task.dueDate) || task.isOverdue)
  }

  if (activeFilter.value !== 'all') {
    result = result.filter(task => normalizeStatus(task.status) === activeFilter.value)
  }

  const keyword = searchKeyword.value.trim().toLowerCase()
  if (keyword) {
    result = result.filter(task =>
      String(task.title || '').toLowerCase().includes(keyword) ||
      String(task.description || '').toLowerCase().includes(keyword) ||
      String(task.agentReason || '').toLowerCase().includes(keyword) ||
      taskTags(task).some(tag => tag.toLowerCase().includes(keyword))
    )
  }

  return sortTasks(result)
})

onMounted(() => {
  loadTasks()
})

async function loadTasks() {
  loading.value = true
  loadError.value = ''
  try {
    const [today, pending, overdue] = await Promise.all([
      taskApi.listToday(),
      taskApi.listPending(),
      taskApi.listOverdue(),
    ])
    todayTasks.value = today
    pendingTasks.value = pending
    overdueTasks.value = overdue
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '请稍后重试'
    ElMessage.error('任务加载失败')
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
  } catch {
    markCurrentGenerationStepFailed()
    ElMessage.error('生成任务失败，请稍后重试')
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

async function startTask(task: TaskVO) {
  await withTaskBusy(task.id, async () => {
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
  })
}

async function completeTask(task: TaskVO) {
  if (task.status === 'completed' || task.status === 'cancelled') return
  await withTaskBusy(task.id, async () => {
    await taskApi.complete(String(task.id), {
      actualDurationMinutes: task.estimatedDurationMinutes || 0,
    })
    ElMessage.success('任务已完成')
    await loadTasks()
  })
}

async function cancelTask(task: TaskVO) {
  await ElMessageBox.confirm(`确认删除「${task.title || '该任务'}」吗？删除后任务会从当前列表移除。`, '删除任务', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
  await withTaskBusy(task.id, async () => {
    await taskApi.updateStatus(String(task.id), 'cancelled')
    ElMessage.success('任务已删除')
    await loadTasks()
  })
}

function toggleTask(task: TaskVO) {
  completeTask(task)
}

function toggleSort() {
  sortMode.value = sortMode.value === 'time_asc' ? 'priority_desc' : 'time_asc'
}

function sortTasks(items: TaskVO[]) {
  const sorted = [...items]
  if (sortMode.value === 'priority_desc') {
    return sorted.sort((a, b) => Number(a.priority || 0) - Number(b.priority || 0))
  }
  return sorted.sort((a, b) => taskTimeValue(a) - taskTimeValue(b))
}

function taskTimeValue(task: TaskVO) {
  const datePart = task.dueDate || new Date().toISOString().slice(0, 10)
  const timePart = task.dueTime || '23:59:59'
  return new Date(`${datePart}T${timePart}`).getTime() || Number.MAX_SAFE_INTEGER
}

function isTaskBusy(taskId: string) {
  return busyTaskIds.value.has(String(taskId))
}

async function withTaskBusy(taskId: string, runner: () => Promise<void>) {
  const next = new Set(busyTaskIds.value)
  next.add(String(taskId))
  busyTaskIds.value = next
  try {
    await runner()
  } finally {
    const done = new Set(busyTaskIds.value)
    done.delete(String(taskId))
    busyTaskIds.value = done
  }
}

function buildEvidenceAnalysisCards(evidence: AgentScheduleEvidence): AgentAnalysisCard[] {
  const plannedTotal = evidence.recentPlannedTasks || 0
  const completedDetail = plannedTotal > 0
    ? `${evidence.recentCompletedTasks}/${plannedTotal} 个任务完成`
    : `${evidence.recentRecordCount} 条学习记录`

  return [
    {
      label: '最近学习',
      value: `${evidence.recentStudyMinutes} 分钟`,
      detail: `覆盖最近 ${evidence.recentDays} 天`,
    },
    {
      label: '完成率',
      value: `${evidence.recentCompletionRate}%`,
      detail: completedDetail,
    },
    {
      label: '今日负载',
      value: `${evidence.todayExistingTaskCount} 个`,
      detail: `未完成 ${evidence.unfinishedTaskCount} 个，逾期 ${evidence.overdueTaskCount} 个`,
    },
    {
      label: '可用时间',
      value: `${evidence.availableMinutes} 分钟`,
      detail: `策略：${strategyLabel(evidence.strategy)}`,
    },
  ]
}

function beginLocalGenerationSteps() {
  clearGenerationTimers()
  generationSteps.value = [
    { key: 'collect', label: '读取学习记录', status: 'running', detail: '汇总近期学习时长、完成率和任务状态' },
    { key: 'diagnose', label: '识别薄弱点', status: 'pending', detail: '分析逾期、复习和测评相关信号' },
    { key: 'compose', label: '编排任务组合', status: 'pending', detail: '平衡学习、资源和练习任务' },
    { key: 'create', label: '写入今日计划', status: 'pending', detail: '生成可执行任务并刷新列表' },
  ]

  generationSteps.value.forEach((_, index) => {
    if (index === 0) return
    const timer = window.setTimeout(() => {
      generationSteps.value = generationSteps.value.map((step, stepIndex) => {
        if (stepIndex < index) return { ...step, status: 'completed' }
        if (stepIndex === index) return { ...step, status: 'running' }
        return step
      })
    }, index * 450)
    generationStepTimers.push(timer)
  })
}

function applyServerProcessSteps(steps?: AgentScheduleProcessStep[]) {
  if (steps?.length) {
    generationSteps.value = steps
    return
  }
  generationSteps.value = generationSteps.value.map(step => ({ ...step, status: 'completed' }))
}

function markCurrentGenerationStepFailed() {
  const runningIndex = generationSteps.value.findIndex(step => step.status === 'running')
  generationSteps.value = generationSteps.value.map((step, index) => {
    if (index === runningIndex || (runningIndex < 0 && index === generationSteps.value.length - 1)) {
      return { ...step, status: 'failed', detail: '生成失败，请检查网络或稍后重试' }
    }
    return step
  })
}

function clearGenerationTimers() {
  generationStepTimers.forEach(timer => window.clearTimeout(timer))
  generationStepTimers = []
}

function actionClass(task: TaskVO) {
  const actionType = task.actionType
  if (actionType === 'practice_set' || actionType === 'assessment') return 'practice'
  if (actionType === 'read_resource' || actionType === 'watch_video') return 'resource'
  if (actionType === 'project_practice') return 'project'
  return 'review'
}

function typeIcon(task: TaskVO) {
  const type = actionClass(task)
  if (type === 'practice') return checkIcon
  if (type === 'resource') return folderIcon
  if (type === 'project') return projectIcon
  return codeIcon
}

function taskStatusClass(task: TaskVO) {
  if (task.status === 'completed') return 'done'
  if (task.status === 'in_progress' || task.status === 'doing') return 'doing'
  return 'todo'
}

function normalizeStatus(status: TaskStatus): FilterValue | 'cancelled' | 'overdue' {
  if (status === 'doing') return 'in_progress'
  return status
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
  if (task.isOverdue || task.status === 'overdue') return '已逾期'
  if (task.isToday) return '今天'
  if (!task.dueDate) return '未排期'
  const dueDate = new Date(`${task.dueDate}T00:00:00`)
  const today = startOfToday()
  const diff = Math.round((dueDate.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return '今天'
  if (diff === 1) return '明天'
  if (diff > 1 && diff <= 7) return '本周'
  return task.dueDate
}

function formatTaskTime(task: TaskVO) {
  if (task.dueTime) return task.dueTime.slice(0, 5)
  if (task.status === 'completed') return '已完成'
  return '待安排'
}

function taskReason(task: TaskVO) {
  return task.agentReason || task.aiSuggestion || task.description || '系统根据当前学习计划生成的任务'
}

function taskProgress(task: TaskVO) {
  if (task.status === 'completed') return 100
  if (task.status === 'in_progress' || task.status === 'doing') return 55
  return 0
}

function taskTags(task: TaskVO) {
  const tags = [actionTypeLabel(task), statusLabel(task.status), spaceLabel(task)]
  if (task.isOverdue) tags.push('逾期')
  if (task.priority <= 2) tags.push('高优先级')
  return tags.filter(Boolean)
}

function spaceLabel(task: TaskVO) {
  const metadata = readMetadata(task)
  return String(metadata.spaceName || metadata.learningSpaceName || metadata.subjectName || `学习空间 ${task.spaceId || '-'}`)
}

function startButtonLabel(task: TaskVO) {
  if (task.status === 'in_progress' || task.status === 'doing') return '继续学习'
  if (task.actionType === 'practice_set') return '开始练习'
  if (task.actionType === 'assessment') return '开始测评'
  return '开始学习'
}

function statusLabel(status: TaskStatus) {
  const labels: Record<TaskStatus, string> = {
    pending: '待开始',
    in_progress: '进行中',
    doing: '进行中',
    completed: '已完成',
    overdue: '已逾期',
    cancelled: '已删除',
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

function strategyLabel(strategy: string) {
  const labels: Record<string, string> = {
    deadline_first: '截止时间优先',
    weakness_first: '薄弱点优先',
    balanced: '均衡分配',
  }
  return labels[strategy] || strategy
}

function evaluationTaskTypeLabel(type: string) {
  return type === 'assessment' ? '阶段测评' : '即时练习'
}

function resourceTypeLabels(types: string[]) {
  const labels: Record<string, string> = {
    doc: '文档',
    mind_map: '思维导图',
    bilibili_video: 'B站视频',
  }
  return (types.length ? types : ['doc']).map(type => labels[type] || type)
}

function normalizeInsightList(items: Array<string | null | undefined>, fallback: string) {
  const normalized = items.map(item => String(item || '').trim()).filter(Boolean)
  return normalized.length ? normalized.slice(0, 4) : [fallback]
}

function readMetadata(task: TaskVO) {
  if (!task.metadata) return {} as Record<string, unknown>
  if (typeof task.metadata === 'string') {
    try {
      return JSON.parse(task.metadata) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  return task.metadata as Record<string, unknown>
}

const defaultRhythmTimes = ['09:00', '10:30', '13:30', '15:00', '17:00']

const checkIcon = practiceIcon
const doneIcon = taskProgressIcon
const codeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></svg>'
const projectIcon = taskProgressIcon
</script>

<script lang="ts">
export default { name: 'TasksPage' }
</script>

<style scoped>
.tasks-page {
  /* 复用全局薄荷主题，避免任务页覆盖产品主色。 */
  --primary: var(--primary-color);
  --primary-violet: var(--primary-hover);
  --success: #14b8a6;
  --warning: #f59e0b;
  --danger: #ef4444;
  --page-bg: #f6f8fc;
  --card-bg: var(--panel-bg, #ffffff);
  --text-primary-local: var(--text-dark, #17233d);
  --text-secondary-local: var(--text-secondary, #667085);
  --border-color-local: var(--border-color, #e6eaf2);
  --card-radius: 16px;
  --control-radius: 10px;
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
  color: var(--text-primary-local);
}

.task-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.hero-copy h1 {
  margin: 0 0 8px;
  color: var(--text-primary-local);
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: 0;
}

.hero-copy p {
  margin: 0 0 16px;
  color: var(--text-secondary-local);
  font-size: 0.92rem;
}

.date-card {
  width: fit-content;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid var(--border-color-local);
  border-radius: 14px;
  background: var(--card-bg);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.date-icon,
.meta-icon {
  display: inline-flex;
  flex-shrink: 0;
}

.date-card .date-icon svg {
  width: 20px;
  height: 20px;
  color: var(--primary);
}

.date-card div {
  display: grid;
  gap: 2px;
}

.date-card strong {
  font-size: 0.86rem;
}

.date-card span {
  color: var(--text-secondary-local);
  font-size: 0.82rem;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.segment-control,
.view-switch {
  display: inline-flex;
  align-items: center;
  padding: 4px;
  border: 1px solid var(--border-color-local);
  border-radius: 14px;
  background: var(--card-bg);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.segment-control button,
.filter-chip,
.sort-button,
.view-switch button,
.primary-action,
.start-button,
.ghost-button,
.more-button,
.state-box button,
.rail-header button {
  border: 0;
  font: inherit;
  cursor: pointer;
}

.segment-control button {
  min-width: 94px;
  height: 36px;
  padding: 0 16px;
  border-radius: 10px;
  color: var(--text-secondary-local);
  background: transparent;
  font-size: 0.86rem;
  font-weight: 700;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.segment-control button.active,
.filter-chip.active,
.view-switch button.active {
  color: #ffffff;
  background: var(--primary);
  box-shadow: 0 10px 18px rgba(11, 183, 170, 0.2);
}

.primary-action {
  height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 18px;
  border-radius: 12px;
  color: #ffffff;
  background: var(--gradient-primary);
  font-size: 0.9rem;
  font-weight: 800;
  box-shadow: 0 14px 26px rgba(11, 183, 170, 0.24);
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.primary-action:hover,
.start-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 30px rgba(11, 183, 170, 0.28);
}

.primary-action:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.primary-action svg {
  width: 18px;
  height: 18px;
}

.loading-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #ffffff;
  animation: spin 0.8s linear infinite;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 22px;
}

.stat-card,
.rail-card,
.tasks-panel,
.task-toolbar {
  border: 1px solid var(--border-color-local);
  background: var(--card-bg);
  border-radius: var(--card-radius);
  box-shadow: 0 12px 34px rgba(15, 23, 42, 0.045);
}

.stat-card {
  position: relative;
  min-height: 128px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  overflow: hidden;
}

.stat-icon,
.task-type-icon {
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  flex-shrink: 0;
}

.stat-icon svg,
.task-type-icon svg {
  width: 26px;
  height: 26px;
}

.stat-card.review { color: var(--primary); }
.stat-card.practice { color: var(--success); }
.stat-card.resource { color: var(--warning); }
.stat-card.completed { color: var(--primary-violet); }

.stat-card.review .stat-icon,
.task-type-icon {
  background: rgba(11, 183, 170, 0.11);
}

.stat-card.practice .stat-icon {
  background: rgba(20, 184, 166, 0.12);
}

.stat-card.resource .stat-icon {
  background: rgba(245, 158, 11, 0.12);
}

.stat-card.completed .stat-icon {
  background: rgba(124, 58, 237, 0.12);
}

.stat-copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.stat-copy strong {
  color: var(--text-primary-local);
  font-size: 1.65rem;
  line-height: 1;
}

.focus-card .stat-copy strong {
  font-size: 0.95rem;
}

.stat-copy span {
  color: var(--text-primary-local);
  font-size: 0.86rem;
  font-weight: 700;
}

.stat-copy small {
  color: var(--text-secondary-local);
  font-size: 0.76rem;
}

.trend-line {
  position: absolute;
  right: 18px;
  bottom: 18px;
  width: 76px;
  height: 24px;
  opacity: 0.55;
}

.focus-card {
  justify-content: space-between;
  color: var(--success);
}

.focus-ring {
  --progress: 0%;
  width: 82px;
  height: 82px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background:
    radial-gradient(circle at center, var(--card-bg) 0 55%, transparent 56%),
    conic-gradient(var(--success) var(--progress), rgba(20, 184, 166, 0.14) 0);
}

.focus-ring span {
  color: var(--text-primary-local);
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1;
}

.focus-ring small {
  color: var(--text-secondary-local);
  font-size: 0.72rem;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 24px;
  align-items: start;
}

.task-main {
  min-width: 0;
}

.task-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  margin-bottom: 16px;
}

.search-box {
  flex: 1 1 260px;
  min-width: 220px;
  height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border: 1px solid var(--border-color-local);
  border-radius: 12px;
  background: var(--bg-card, #ffffff);
  color: var(--text-secondary-local);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.search-box:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(11, 183, 170, 0.12);
}

.search-box svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.search-box input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text-primary-local);
  font: inherit;
}

.search-box button,
.view-switch button,
.more-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text-secondary-local);
}

.search-box button svg {
  width: 16px;
  height: 16px;
}

.filter-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-chip,
.sort-button {
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--border-color-local);
  background: var(--bg-card, #ffffff);
  color: var(--text-secondary-local);
  font-size: 0.82rem;
  font-weight: 700;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.filter-chip:hover,
.sort-button:hover,
.view-switch button:hover {
  border-color: rgba(11, 183, 170, 0.35);
  color: var(--primary);
}

.toolbar-tail {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.sort-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
}

.sort-button svg {
  width: 16px;
  height: 16px;
}

.view-switch {
  height: 38px;
  padding: 3px;
  border-radius: 12px;
}

.view-switch button {
  width: 32px;
  height: 30px;
  border-radius: 9px;
}

.view-switch svg {
  width: 17px;
  height: 17px;
}

.tasks-panel {
  min-height: 280px;
  padding: 4px;
}

.task-list {
  display: grid;
  gap: 16px;
  padding: 0;
}

.task-list.card-view {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.learning-task-card {
  position: relative;
  display: grid;
  grid-template-columns: 72px 28px 56px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 22px;
  border: 1px solid var(--border-color-local);
  border-radius: 16px;
  background: var(--card-bg);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.learning-task-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 18px;
  bottom: 18px;
  width: 3px;
  border-radius: 0 999px 999px 0;
  background: var(--primary);
}

.learning-task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.08);
  border-color: rgba(11, 183, 170, 0.22);
}

.learning-task-card.type-practice::before { background: var(--success); }
.learning-task-card.type-resource::before { background: var(--warning); }
.learning-task-card.type-project::before { background: var(--primary-violet); }
.learning-task-card.completed {
  opacity: 0.68;
}

.task-time-axis {
  position: relative;
  display: grid;
  gap: 4px;
  color: var(--text-secondary-local);
  font-size: 0.76rem;
}

.task-time-axis::after {
  content: '';
  position: absolute;
  left: -22px;
  top: 4px;
  bottom: 4px;
  width: 1px;
  background: var(--border-color-local);
}

.axis-dot {
  position: absolute;
  left: -28px;
  top: 3px;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: var(--primary);
  box-shadow: 0 0 0 4px rgba(11, 183, 170, 0.12);
  z-index: 1;
}

.axis-dot.done {
  background: var(--success);
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.12);
}

.axis-dot.todo {
  background: var(--border-color-local);
  box-shadow: 0 0 0 4px rgba(148, 163, 184, 0.12);
}

.task-time-axis strong {
  color: var(--text-primary-local);
  font-size: 0.82rem;
}

.task-check {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  border: 1.5px solid var(--border-color-local);
  background: var(--bg-card, #ffffff);
  color: #ffffff;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}

.task-check:hover {
  border-color: var(--primary);
  transform: scale(1.04);
}

.task-check.done {
  background: var(--success);
  border-color: var(--success);
}

.task-check.doing {
  border-color: var(--primary);
  background: rgba(11, 183, 170, 0.12);
}

.task-check svg {
  width: 16px;
  height: 16px;
}

.learning-task-card.type-practice .task-type-icon {
  color: var(--success);
  background: rgba(20, 184, 166, 0.12);
}

.learning-task-card.type-resource .task-type-icon {
  color: var(--warning);
  background: rgba(245, 158, 11, 0.12);
}

.learning-task-card.type-project .task-type-icon {
  color: var(--primary-violet);
  background: rgba(124, 58, 237, 0.12);
}

.task-body {
  min-width: 0;
}

.task-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.type-badge,
.space-pill,
.status-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 800;
  line-height: 1;
}

.type-badge {
  padding: 5px 10px;
}

.type-badge.review {
  color: var(--primary);
  background: rgba(11, 183, 170, 0.1);
}

.type-badge.practice {
  color: var(--success);
  background: rgba(20, 184, 166, 0.1);
}

.type-badge.resource {
  color: var(--warning);
  background: rgba(245, 158, 11, 0.12);
}

.type-badge.project {
  color: var(--primary-violet);
  background: rgba(124, 58, 237, 0.1);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary-local);
  font-size: 0.75rem;
}

.meta-item svg,
.meta-icon svg {
  width: 13px;
  height: 13px;
}

.task-body h2 {
  display: -webkit-box;
  margin: 0 0 6px;
  overflow: hidden;
  color: var(--text-primary-local);
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.task-body p {
  display: -webkit-box;
  margin: 0 0 14px;
  overflow: hidden;
  color: var(--text-secondary-local);
  font-size: 0.82rem;
  line-height: 1.65;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.task-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.space-pill {
  max-width: 240px;
  padding: 6px 10px;
  overflow: hidden;
  color: #0f766e;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: rgba(20, 184, 166, 0.12);
}

.task-progress {
  min-width: 140px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-track {
  flex: 1;
  height: 5px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--border-color-local);
}

.progress-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--primary), var(--success));
  transition: width 0.24s ease;
}

.task-progress strong {
  color: var(--text-secondary-local);
  font-size: 0.72rem;
}

.task-side {
  min-width: 150px;
  display: grid;
  grid-template-columns: 1fr 28px;
  gap: 10px;
  align-items: center;
  justify-items: end;
}

.status-pill {
  grid-column: 1 / -1;
  padding: 6px 10px;
}

.status-pill.todo {
  color: var(--text-secondary-local);
  background: var(--background-color-base, #f1f5f9);
}

.status-pill.doing {
  color: var(--primary);
  background: rgba(11, 183, 170, 0.1);
}

.status-pill.done {
  color: var(--success);
  background: rgba(20, 184, 166, 0.12);
}

.start-button,
.ghost-button {
  height: 38px;
  min-width: 96px;
  padding: 0 16px;
  border-radius: 11px;
  font-size: 0.84rem;
  font-weight: 800;
}

.start-button {
  color: #ffffff;
  background: var(--gradient-primary);
  box-shadow: 0 12px 22px rgba(11, 183, 170, 0.2);
}

.start-button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.ghost-button {
  color: var(--primary);
  border: 1px solid rgba(11, 183, 170, 0.24);
  background: rgba(11, 183, 170, 0.08);
}

.more-button {
  width: 28px;
  height: 38px;
  border-radius: 10px;
}

.more-button:hover {
  color: var(--primary);
  background: rgba(11, 183, 170, 0.08);
}

.more-button svg {
  width: 18px;
  height: 18px;
}

.state-box {
  min-height: 280px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  padding: 36px;
  text-align: center;
}

.state-box strong {
  color: var(--text-primary-local);
  font-size: 1rem;
}

.state-box p {
  max-width: 420px;
  margin: 0;
  color: var(--text-secondary-local);
  font-size: 0.88rem;
}

.state-box button {
  height: 38px;
  padding: 0 16px;
  border-radius: 11px;
  color: #ffffff;
  background: var(--gradient-primary);
  font-weight: 800;
}

.empty-icon {
  width: 62px;
  height: 62px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  color: var(--primary);
  background: rgba(11, 183, 170, 0.1);
}

.empty-icon svg {
  width: 34px;
  height: 34px;
}

.assist-rail {
  display: grid;
  gap: 18px;
}

.rail-card {
  padding: 20px;
}

.rail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.rail-header strong,
.streak-card strong {
  color: var(--text-primary-local);
  font-size: 0.96rem;
}

.rail-header button {
  color: var(--primary);
  background: transparent;
  font-size: 0.75rem;
  font-weight: 800;
}

.rhythm-list {
  display: grid;
  gap: 0;
}

.rhythm-item {
  display: grid;
  grid-template-columns: 48px 18px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  min-height: 36px;
  color: var(--text-secondary-local);
  font-size: 0.8rem;
}

.rhythm-time {
  font-variant-numeric: tabular-nums;
}

.rhythm-dot {
  position: relative;
  width: 10px;
  height: 10px;
  margin-top: 5px;
  border-radius: 999px;
  border: 2px solid var(--border-color-local);
  background: var(--card-bg);
}

.rhythm-dot::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 10px;
  width: 1px;
  height: 28px;
  background: var(--border-color-local);
}

.rhythm-item:last-child .rhythm-dot::after {
  display: none;
}

.rhythm-item.completed .rhythm-dot {
  border-color: var(--success);
  background: var(--success);
}

.rhythm-item.current {
  color: var(--primary);
  font-weight: 800;
}

.rhythm-item.current .rhythm-dot {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(11, 183, 170, 0.12);
}

.rhythm-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.streak-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 150px;
  background:
    radial-gradient(circle at 92% 20%, rgba(245, 158, 11, 0.16), transparent 32%),
    var(--card-bg);
}

.streak-card p {
  margin: 14px 0 2px;
  color: var(--text-primary-local);
}

.streak-card p span {
  color: var(--primary);
  font-size: 2.2rem;
  font-weight: 900;
  line-height: 1;
}

.streak-card small {
  color: var(--text-secondary-local);
}

.medal {
  width: 88px;
  height: 88px;
  flex-shrink: 0;
}

.generate-form,
.generate-process {
  color: var(--text-primary-local);
}

.generate-tip {
  margin: 0 0 18px;
  color: var(--text-secondary-local);
  font-size: 0.88rem;
  line-height: 1.7;
}

.generate-grid,
.analysis-grid,
.evidence-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
}

.generate-options,
.resource-type-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 18px;
  margin-bottom: 12px;
}

.generation-process,
.agent-schedule-result {
  display: grid;
  gap: 14px;
  padding: 16px;
  margin-top: 16px;
  border: 1px solid var(--border-color-local);
  border-radius: 14px;
  background: var(--background-color-base, #f1f5f9);
}

.generation-analysis,
.analysis-header,
.analysis-item,
.analysis-panel,
.result-header,
.result-block,
.evidence-item {
  display: grid;
  gap: 6px;
}

.analysis-header span,
.result-header span {
  color: var(--primary);
  font-size: 0.76rem;
  font-weight: 800;
}

.analysis-header strong,
.result-header strong {
  color: var(--text-primary-local);
  font-size: 0.9rem;
  line-height: 1.5;
}

.analysis-item,
.analysis-panel,
.evidence-item {
  padding: 12px;
  border: 1px solid var(--border-color-local);
  border-radius: 12px;
  background: var(--card-bg);
}

.analysis-item span,
.evidence-item span {
  color: var(--text-secondary-local);
  font-size: 0.72rem;
}

.analysis-item strong,
.evidence-item strong {
  color: var(--text-primary-local);
  font-size: 0.96rem;
}

.analysis-item small {
  color: var(--text-secondary-local);
  font-size: 0.72rem;
}

.analysis-panels {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.analysis-panel h4,
.result-block h4 {
  margin: 0;
  color: var(--text-primary-local);
  font-size: 0.82rem;
}

.analysis-panel ul,
.result-block ul {
  display: grid;
  gap: 6px;
  margin: 0;
  padding-left: 18px;
  color: var(--text-secondary-local);
  font-size: 0.76rem;
  line-height: 1.6;
}

.process-divider {
  height: 1px;
  background: var(--border-color-local);
}

.process-step {
  display: grid;
  grid-template-columns: 14px minmax(0, 1fr);
  gap: 10px;
}

.process-dot {
  width: 10px;
  height: 10px;
  margin-top: 6px;
  border-radius: 999px;
  background: var(--border-color-local);
}

.process-step.running .process-dot {
  background: var(--primary);
  box-shadow: 0 0 0 4px rgba(11, 183, 170, 0.12);
}

.process-step.completed .process-dot {
  background: var(--success);
}

.process-step.failed .process-dot {
  background: var(--danger);
}

.process-copy {
  display: grid;
  gap: 2px;
}

.process-label {
  color: var(--text-primary-local);
  font-size: 0.82rem;
  font-weight: 800;
}

.process-detail {
  color: var(--text-secondary-local);
  font-size: 0.76rem;
}

:deep(.el-dialog),
:deep(.el-popper),
:deep(.el-dropdown__popper) {
  background: var(--card-bg);
  color: var(--text-primary-local);
}

:global(html[data-theme='dark']) .tasks-page {
  --card-bg: #171e2a;
  --text-primary-local: #f4f7fb;
  --text-secondary-local: #b5c0ce;
  --border-color-local: #2b3645;
  --primary: var(--primary-color);
  --primary-violet: var(--primary-hover);
}

:global(html[data-theme='dark']) .search-box,
:global(html[data-theme='dark']) .filter-chip,
:global(html[data-theme='dark']) .sort-button,
:global(html[data-theme='dark']) .task-check {
  background: #131a24;
}

:global(html[data-theme='dark']) .space-pill {
  color: #5eead4;
  background: rgba(20, 184, 166, 0.14);
}

:global(html[data-theme='dark']) .learning-task-card,
:global(html[data-theme='dark']) .stat-card,
:global(html[data-theme='dark']) .rail-card,
:global(html[data-theme='dark']) .tasks-panel,
:global(html[data-theme='dark']) .task-toolbar {
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.28);
}

button:focus-visible,
input:focus-visible {
  outline: 2px solid rgba(11, 183, 170, 0.6);
  outline-offset: 2px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1280px) {
  .stats-grid {
    grid-template-columns: repeat(3, minmax(180px, 1fr));
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .assist-rail {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .task-hero,
  .task-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .hero-actions,
  .toolbar-tail {
    justify-content: flex-start;
    margin-left: 0;
  }

  .learning-task-card,
  .task-list.card-view {
    grid-template-columns: 1fr;
  }

  .learning-task-card {
    gap: 12px;
  }

  .task-time-axis::after,
  .axis-dot {
    display: none;
  }

  .task-side {
    width: 100%;
    min-width: 0;
    grid-template-columns: 1fr auto;
    justify-items: stretch;
  }

  .status-pill {
    grid-column: auto;
  }
}

@media (max-width: 768px) {
  .stats-grid,
  .assist-rail,
  .generate-grid,
  .analysis-grid,
  .analysis-panels,
  .evidence-grid {
    grid-template-columns: 1fr;
  }

  .segment-control,
  .primary-action,
  .search-box,
  .sort-button {
    width: 100%;
  }

  .segment-control button {
    flex: 1;
    min-width: 0;
    padding: 0 8px;
  }

  .task-bottom,
  .toolbar-tail {
    align-items: stretch;
    flex-direction: column;
  }

  .task-progress,
  .start-button,
  .ghost-button {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
