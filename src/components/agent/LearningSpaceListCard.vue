<template>
  <div class="space-list-card">
    <div class="space-list-head">
      <div>
        <div class="space-list-title">{{ title }}</div>
        <div class="space-list-subtitle">{{ subtitle }}</div>
      </div>
      <span class="space-count">{{ totalCount }}</span>
    </div>

    <div v-if="spaces.length" class="space-items">
      <button
        v-for="space in spaces"
        :key="space.id"
        class="space-item"
        type="button"
        @click="goToSpace(space.id)"
      >
        <div class="space-main">
          <div class="space-name-row">
            <span class="space-type-dot" :class="'type-' + normalizeType(space.type)"></span>
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
        <span class="space-open-indicator" aria-hidden="true"></span>
      </button>
    </div>
    <div v-else class="space-empty">
      <div class="space-empty-title">暂无可展示的学习空间</div>
      <div class="space-empty-desc">可以让 Agent 帮你创建新的学习计划，确认后会生成学习空间。</div>
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

function normalizeType(type?: string): string {
  return ['course', 'exam', 'project', 'career', 'competition'].includes(type || '') ? type as string : 'default'
}
</script>

<style scoped>
.space-list-card {
  position: relative;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.9) 0%, rgba(255, 255, 255, 0.98) 34%),
    #ffffff;
  box-shadow:
    0 16px 36px rgba(15, 23, 42, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.88) inset;
  overflow: hidden;
}

.space-list-card::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: linear-gradient(90deg, #0bb7aa 0%, #3b82f6 52%, #f59e0b 100%);
}

.space-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 14px 11px;
  background: rgba(248, 250, 252, 0.72);
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  backdrop-filter: blur(12px);
}

.space-list-title {
  font-size: 0.875rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: 0;
}

.space-list-subtitle {
  margin-top: 3px;
  font-size: 0.6875rem;
  color: #64748b;
  line-height: 1.45;
}

.space-count {
  min-width: 34px;
  height: 28px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid rgba(11, 183, 170, 0.18);
  background: rgba(240, 253, 250, 0.82);
  color: #0f766e;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.82) inset;
}

.space-items {
  display: flex;
  flex-direction: column;
}

.space-empty {
  padding: 20px 14px;
  background: rgba(255, 255, 255, 0.9);
}

.space-empty-title {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--text-dark, #1f2937);
}

.space-empty-desc {
  margin-top: 4px;
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--text-muted, #64748b);
}

.space-item {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 78px 14px;
  gap: 12px;
  width: 100%;
  padding: 13px 14px;
  border: none;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.space-item:last-child {
  border-bottom: none;
}

.space-item:hover {
  z-index: 1;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.07);
  transform: translateY(-1px);
}

.space-main {
  min-width: 0;
}

.space-name-row {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.space-type-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #94a3b8;
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.14);
  flex-shrink: 0;
}

.type-course { background: #0bb7aa; box-shadow: 0 0 0 3px rgba(11, 183, 170, 0.14); }
.type-exam { background: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15); }
.type-project { background: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.14); }
.type-career { background: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.14); }
.type-competition { background: #ef4444; box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.13); }

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
  padding: 2px 7px;
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
  gap: 6px;
  margin-top: 6px;
  font-size: 0.6875rem;
}

.space-meta span {
  display: inline-flex;
  align-items: center;
  min-height: 19px;
  padding: 1px 7px;
  border-radius: 6px;
  background: rgba(241, 245, 249, 0.86);
  color: #64748b;
}

.space-progress {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
  color: #111827;
  font-size: 0.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.progress-track {
  width: 70px;
  height: 5px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0bb7aa, #3b82f6);
}

.space-open-indicator {
  align-self: center;
  justify-self: end;
  width: 7px;
  height: 7px;
  border-top: 1.5px solid #94a3b8;
  border-right: 1.5px solid #94a3b8;
  transform: rotate(45deg);
  transition: border-color 0.18s ease, transform 0.18s ease;
}

.space-item:hover .space-open-indicator {
  border-color: #0f766e;
  transform: translateX(2px) rotate(45deg);
}

@media (max-width: 520px) {
  .space-item {
    grid-template-columns: minmax(0, 1fr) 14px;
  }

  .space-progress {
    grid-column: 1 / -1;
    align-items: flex-start;
  }

  .progress-track {
    width: 100%;
  }
}
</style>
