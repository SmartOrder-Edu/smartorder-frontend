<template>
  <div class="space-list-card">
    <div class="space-list-head">
      <div>
        <div class="space-list-title">{{ title }}</div>
        <div class="space-list-subtitle">{{ subtitle }}</div>
      </div>
      <span class="space-count">{{ totalCount }}</span>
    </div>

    <div class="space-items">
      <button
        v-for="space in spaces"
        :key="space.id"
        class="space-item"
        type="button"
        @click="goToSpace(space.id)"
      >
        <div class="space-main">
          <div class="space-name-row">
            <span class="space-name">{{ space.name || '未命名学习空间' }}</span>
            <span class="risk-badge" :class="'risk-' + normalizeRisk(space.riskStatus)">
              {{ riskText(space.riskStatus) }}
            </span>
          </div>
          <div class="space-goal">{{ space.currentGoal || '暂无明确目标' }}</div>
          <div class="space-meta">
            <span>{{ typeText(space.type) }}</span>
            <span>{{ space.todayTaskCount || 0 }} 个今日任务</span>
            <span v-if="space.overdueTaskCount">{{ space.overdueTaskCount }} 个逾期</span>
          </div>
        </div>
        <div class="space-progress">
          <span>{{ safeProgress(space.progress) }}%</span>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: safeProgress(space.progress) + '%' }"></div>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

interface SpaceSummary {
  id: string
  name?: string
  type?: string
  currentGoal?: string
  progress?: number
  riskStatus?: string
  todayTaskCount?: number
  overdueTaskCount?: number
}

const props = defineProps<{
  result: any
}>()

const router = useRouter()

const spaces = computed<SpaceSummary[]>(() => {
  const raw = props.result?.spaces
  return Array.isArray(raw) ? raw : []
})

const totalCount = computed(() => {
  return typeof props.result?.total === 'number' ? props.result.total : spaces.value.length
})

const title = computed(() => {
  if (props.result?.matchStatus === 'multiple') return '请选择学习空间'
  if (props.result?.matchStatus === 'none') return '未找到学习空间'
  return '学习空间'
})

const subtitle = computed(() => {
  const summary = props.result?.summary || 'Agent 读取了你的学习空间'
  if (totalCount.value > spaces.value.length && spaces.value.length > 0) {
    return `${summary}，展示前 ${spaces.value.length} 个`
  }
  return summary
})

function goToSpace(id?: string) {
  if (!id) return
  router.push(`/space/${id}`)
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
    course: '课程',
    exam: '考试',
    project: '项目',
    career: '成长路线',
    competition: '竞赛',
  }
  return map[type || ''] || '学习空间'
}
</script>

<style scoped>
.space-list-card {
  border: 1px solid rgba(11, 183, 170, 0.14);
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;
}

.space-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: #f8fbfb;
  border-bottom: 1px solid rgba(11, 183, 170, 0.08);
}

.space-list-title {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--text-dark, #1f2937);
}

.space-list-subtitle {
  margin-top: 2px;
  font-size: 0.6875rem;
  color: var(--text-muted, #64748b);
  line-height: 1.45;
}

.space-count {
  min-width: 28px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(11, 183, 170, 0.1);
  color: var(--primary-color, #0bb7aa);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.space-items {
  display: flex;
  flex-direction: column;
}

.space-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 72px;
  gap: 12px;
  width: 100%;
  padding: 11px 12px;
  border: none;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.space-item:last-child {
  border-bottom: none;
}

.space-item:hover {
  background: rgba(11, 183, 170, 0.04);
}

.space-main {
  min-width: 0;
}

.space-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.space-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--text-dark, #1f2937);
}

.risk-badge {
  flex-shrink: 0;
  padding: 2px 6px;
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

.space-goal {
  margin-top: 4px;
  color: var(--text-secondary, #475569);
  font-size: 0.75rem;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.space-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
  color: var(--text-muted, #64748b);
  font-size: 0.6875rem;
}

.space-progress {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
  color: var(--text-dark, #1f2937);
  font-size: 0.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.progress-track {
  width: 64px;
  height: 5px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--primary-color, #0bb7aa);
}
</style>
