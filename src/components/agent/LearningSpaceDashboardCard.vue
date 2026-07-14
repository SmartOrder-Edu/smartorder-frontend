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

    <div class="goal-line">
      <span>目标</span>
      <strong>{{ space.currentGoal || '暂无明确目标' }}</strong>
    </div>

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
      <span>进入学习空间</span>
      <span class="btn-arrow" aria-hidden="true"></span>
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
  position: relative;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.92) 0%, rgba(255, 255, 255, 0.98) 42%),
    #ffffff;
  padding: 14px;
  box-shadow:
    0 16px 36px rgba(15, 23, 42, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.88) inset;
  overflow: hidden;
}

.space-dashboard-card::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: linear-gradient(90deg, #0bb7aa 0%, #3b82f6 52%, #f59e0b 100%);
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
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  padding: 1px 7px;
  border-radius: 6px;
  border: 1px solid rgba(11, 183, 170, 0.16);
  background: rgba(240, 253, 250, 0.72);
  color: #0f766e;
  font-size: 0.6875rem;
  font-weight: 700;
  line-height: 1.3;
}

.space-title {
  margin-top: 7px;
  color: #111827;
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.risk-badge {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: 7px;
  font-size: 0.625rem;
  font-weight: 700;
  border: 1px solid currentColor;
}

.risk-good {
  color: #047857;
  background: rgba(220, 252, 231, 0.72);
  border-color: rgba(4, 120, 87, 0.16);
}

.risk-normal {
  color: #2563eb;
  background: rgba(219, 234, 254, 0.72);
  border-color: rgba(37, 99, 235, 0.16);
}

.risk-warning {
  color: #b45309;
  background: rgba(254, 243, 199, 0.72);
  border-color: rgba(180, 83, 9, 0.18);
}

.risk-danger {
  color: #b91c1c;
  background: rgba(254, 226, 226, 0.76);
  border-color: rgba(185, 28, 28, 0.18);
}

.goal-line {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
  margin-top: 10px;
  font-size: 0.75rem;
  line-height: 1.5;
}

.goal-line span {
  color: #94a3b8;
  font-weight: 700;
}

.goal-line strong {
  color: #334155;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 7px;
  margin-top: 14px;
}

.metric {
  min-width: 0;
  padding: 9px 5px;
  border-radius: 7px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(248, 250, 252, 0.86);
  text-align: center;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.8) inset;
}

.metric-value {
  display: block;
  color: #0f766e;
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
  color: #64748b;
  font-size: 0.625rem;
  line-height: 1.2;
}

.progress-section {
  margin-top: 14px;
  padding: 10px 11px;
  border-radius: 7px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(255, 255, 255, 0.72);
}

.section-row {
  display: flex;
  justify-content: space-between;
  color: #475569;
  font-size: 0.6875rem;
  font-weight: 600;
}

.progress-track {
  height: 6px;
  margin-top: 6px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0bb7aa, #3b82f6);
}

.insight {
  margin-top: 12px;
  padding: 9px 11px;
  border-radius: 7px;
  border: 1px solid rgba(11, 183, 170, 0.14);
  background: rgba(240, 253, 250, 0.64);
  color: #334155;
  font-size: 0.75rem;
  line-height: 1.5;
}

.task-section,
.node-section {
  margin-top: 12px;
}

.task-title {
  color: #111827;
  font-size: 0.6875rem;
  font-weight: 800;
  margin-bottom: 6px;
}

.task-row {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
  min-height: 28px;
  padding: 5px 7px;
  border-radius: 6px;
  color: #475569;
  font-size: 0.75rem;
  background: rgba(248, 250, 252, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.task-row.overdue {
  color: #b91c1c;
  background: rgba(254, 242, 242, 0.72);
  border-color: rgba(185, 28, 28, 0.11);
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
  color: #64748b;
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
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(241, 245, 249, 0.82);
  color: #475569;
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
  background: linear-gradient(135deg, #0f766e 0%, #0bb7aa 100%);
  color: #ffffff;
  padding: 9px 10px;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 10px 20px rgba(11, 183, 170, 0.18);
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.enter-btn:hover {
  background: linear-gradient(135deg, #0b6b63 0%, #0aa79c 100%);
  box-shadow: 0 14px 26px rgba(11, 183, 170, 0.24);
  transform: translateY(-1px);
}

.btn-arrow {
  width: 7px;
  height: 7px;
  border-top: 1.5px solid currentColor;
  border-right: 1.5px solid currentColor;
  transform: rotate(45deg);
}

@media (max-width: 520px) {
  .metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
