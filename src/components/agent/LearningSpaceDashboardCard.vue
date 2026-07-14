<template>
  <div class="space-dashboard-card">
    <div class="dashboard-head">
      <div class="space-title-block">
        <div class="space-label">{{ typeText(space.type) }}</div>
        <div class="space-title">{{ space.name || '学习空间' }}</div>
      </div>
      <span class="risk-badge" :class="'risk-' + normalizeRisk(space.riskStatus)">
        {{ riskText(space.riskStatus) }}
      </span>
    </div>

    <div class="goal-line">{{ space.currentGoal || '暂无明确目标' }}</div>

    <div class="metrics">
      <div class="metric">
        <span class="metric-value">{{ safeProgress(space.progress) }}%</span>
        <span class="metric-label">空间进度</span>
      </div>
      <div class="metric">
        <span class="metric-value">{{ space.daysRemaining ?? 0 }}</span>
        <span class="metric-label">剩余天数</span>
      </div>
      <div class="metric">
        <span class="metric-value">{{ todayTasks.length }}</span>
        <span class="metric-label">今日任务</span>
      </div>
      <div class="metric">
        <span class="metric-value danger-value">{{ overdueTasks.length }}</span>
        <span class="metric-label">逾期任务</span>
      </div>
    </div>

    <div class="progress-section">
      <div class="section-row">
        <span>学习路径</span>
        <span>{{ pathProgress.completedNodes || 0 }}/{{ pathProgress.totalNodes || 0 }}</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: safeProgress(pathProgress.percent) + '%' }"></div>
      </div>
    </div>

    <div v-if="space.agentInsight" class="insight">
      {{ space.agentInsight }}
    </div>

    <div v-if="todayTasks.length || overdueTasks.length" class="task-section">
      <div class="task-title">任务</div>
      <div
        v-for="task in visibleTasks"
        :key="task.id"
        class="task-row"
        :class="{ overdue: task.isOverdue }"
      >
        <span class="task-dot"></span>
        <span class="task-name">{{ task.title }}</span>
        <span class="task-minutes" v-if="task.estimatedDurationMinutes">
          {{ task.estimatedDurationMinutes }}min
        </span>
      </div>
    </div>

    <div v-if="currentPathNodes.length" class="node-section">
      <div class="task-title">当前路径</div>
      <div class="node-list">
        <span v-for="node in currentPathNodes" :key="node.id" class="node-pill">
          {{ node.title }}
        </span>
      </div>
    </div>

    <button class="enter-btn" type="button" @click="goToSpace">
      进入学习空间
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

interface TaskSummary {
  id: string
  title?: string
  estimatedDurationMinutes?: number
  isOverdue?: boolean
}

interface PathNodeSummary {
  id: string
  title?: string
}

const props = defineProps<{
  result: any
}>()

const router = useRouter()

const dashboard = computed(() => props.result?.dashboard || {})
const space = computed(() => dashboard.value.space || {})
const pathProgress = computed(() => dashboard.value.pathProgress || {})
const todayTasks = computed<TaskSummary[]>(() => asArray(dashboard.value.todayTasks))
const overdueTasks = computed<TaskSummary[]>(() => asArray(dashboard.value.overdueTasks).map(t => ({ ...t, isOverdue: true })))
const currentPathNodes = computed<PathNodeSummary[]>(() => asArray(dashboard.value.currentPathNodes))
const visibleTasks = computed<TaskSummary[]>(() => [...overdueTasks.value, ...todayTasks.value].slice(0, 4))

function asArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : []
}

function goToSpace() {
  if (!space.value.id) return
  router.push(`/space/${space.value.id}`)
}

function safeProgress(value?: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

function normalizeRisk(risk?: string): string {
  return ['good', 'normal', 'warning', 'danger'].includes(risk || '') ? risk as string : 'normal'
}

function riskText(risk?: string): string {
  const map: Record<string, string> = {
    good: '良好',
    normal: '正常',
    warning: '关注',
    danger: '紧急',
  }
  return map[normalizeRisk(risk)]
}

function typeText(type?: string): string {
  const map: Record<string, string> = {
    course: '课程空间',
    exam: '考试空间',
    project: '项目空间',
    career: '成长路线',
    competition: '竞赛空间',
  }
  return map[type || ''] || '学习空间'
}
</script>

<style scoped>
.space-dashboard-card {
  border: 1px solid rgba(11, 183, 170, 0.14);
  border-radius: 8px;
  background: #ffffff;
  padding: 12px;
}

.dashboard-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.space-title-block {
  min-width: 0;
}

.space-label {
  color: var(--text-muted, #64748b);
  font-size: 0.6875rem;
  line-height: 1.3;
}

.space-title {
  margin-top: 2px;
  color: var(--text-dark, #1f2937);
  font-size: 0.9375rem;
  font-weight: 800;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.risk-badge {
  flex-shrink: 0;
  padding: 3px 7px;
  border-radius: 999px;
  font-size: 0.625rem;
  font-weight: 700;
}

.risk-good {
  color: #047857;
  background: #dcfce7;
}

.risk-normal {
  color: #2563eb;
  background: #dbeafe;
}

.risk-warning {
  color: #b45309;
  background: #fef3c7;
}

.risk-danger {
  color: #b91c1c;
  background: #fee2e2;
}

.goal-line {
  margin-top: 8px;
  color: var(--text-secondary, #475569);
  font-size: 0.75rem;
  line-height: 1.5;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.metric {
  min-width: 0;
  padding: 8px 4px;
  border-radius: 7px;
  background: #f8fafc;
  text-align: center;
}

.metric-value {
  display: block;
  color: var(--primary-color, #0bb7aa);
  font-size: 0.9375rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.danger-value {
  color: #dc2626;
}

.metric-label {
  display: block;
  margin-top: 2px;
  color: var(--text-muted, #64748b);
  font-size: 0.625rem;
  line-height: 1.2;
}

.progress-section {
  margin-top: 12px;
}

.section-row {
  display: flex;
  justify-content: space-between;
  color: var(--text-secondary, #475569);
  font-size: 0.6875rem;
  font-weight: 600;
}

.progress-track {
  height: 6px;
  margin-top: 6px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--primary-color, #0bb7aa);
}

.insight {
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 7px;
  background: rgba(11, 183, 170, 0.07);
  color: var(--text-secondary, #475569);
  font-size: 0.75rem;
  line-height: 1.5;
}

.task-section,
.node-section {
  margin-top: 12px;
}

.task-title {
  color: var(--text-dark, #1f2937);
  font-size: 0.6875rem;
  font-weight: 800;
  margin-bottom: 6px;
}

.task-row {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
  padding: 5px 0;
  color: var(--text-secondary, #475569);
  font-size: 0.75rem;
}

.task-row.overdue {
  color: #b91c1c;
}

.task-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.65;
}

.task-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-minutes {
  color: var(--text-muted, #64748b);
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
}

.node-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.node-pill {
  max-width: 100%;
  padding: 4px 7px;
  border-radius: 999px;
  background: #f1f5f9;
  color: var(--text-secondary, #475569);
  font-size: 0.6875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.enter-btn {
  width: 100%;
  margin-top: 12px;
  border: none;
  border-radius: 7px;
  background: var(--primary-color, #0bb7aa);
  color: #ffffff;
  padding: 8px 10px;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
}

.enter-btn:hover {
  background: #0aa79c;
}
</style>
