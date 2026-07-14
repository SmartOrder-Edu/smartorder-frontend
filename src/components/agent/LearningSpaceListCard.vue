<template>
  <div class="space-list-card">
    <div class="space-list-head">
      <div class="space-list-head-left">
        <span class="agent-pulse-dot" aria-hidden="true"></span>
        <div>
          <div class="space-list-title">{{ title }}</div>
          <div class="space-list-subtitle">{{ subtitle }}</div>
        </div>
      </div>
      <span class="space-count">{{ totalCount }}</span>
    </div>

    <div v-if="spaces.length" class="space-items" role="list">
      <button
        v-for="space in spaces"
        :key="space.id"
        class="space-item"
        :class="'item-type-' + normalizeType(space.type)"
        type="button"
        role="listitem"
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
            <span class="meta-tag meta-type">
              <i class="meta-icon meta-icon-type"></i>
              {{ typeText(space.type) }}
            </span>
            <span class="meta-tag meta-today">
              <i class="meta-icon meta-icon-today"></i>
              {{ space.todayTaskCount || 0 }} 个今日任务
            </span>
            <span v-if="space.overdueTaskCount" class="meta-tag meta-overdue">
              <i class="meta-icon meta-icon-overdue"></i>
              {{ space.overdueTaskCount }} 个逾期
            </span>
          </div>
        </div>
        <div class="space-progress">
          <span class="progress-value" :style="{ color: progressColor(safeProgress(space.progress)) }">
            {{ safeProgress(space.progress) }}%
          </span>
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{
                width: safeProgress(space.progress) + '%',
                background: progressGradient(safeProgress(space.progress)),
              }"
            ></div>
          </div>
        </div>
        <svg class="space-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
    <div v-else class="space-empty">
      <div class="empty-illustration" aria-hidden="true">
        <span class="empty-icon">📋</span>
      </div>
      <div class="space-empty-title">暂无可展示的学习空间</div>
      <div class="space-empty-desc">试试对 Agent 说：「帮我规划一下这学期的机器学习入门」，确认后会自动创建学习空间。</div>
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

function progressColor(pct: number): string {
  if (pct < 30) return '#b91c1c'
  if (pct < 70) return '#b45309'
  return '#047857'
}

function progressGradient(pct: number): string {
  if (pct < 30) return 'linear-gradient(90deg, #ef4444, #f97316)'
  if (pct < 70) return 'linear-gradient(90deg, #f59e0b, #fbbf24)'
  return 'linear-gradient(90deg, #0bb7aa, #3b82f6)'
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
/* ========== Card Container ========== */
.space-list-card {
  position: relative;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 12px;
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.95) 0%, rgba(255, 255, 255, 0.98) 28%),
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
  height: 4px;
  background: linear-gradient(90deg, #0bb7aa 0%, #3b82f6 52%, #f59e0b 100%);
}

/* ========== Head ========== */
.space-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 12px;
  background: rgba(248, 250, 252, 0.72);
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  backdrop-filter: blur(12px);
}

.space-list-head-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.agent-pulse-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0bb7aa;
  box-shadow: 0 0 0 0 rgba(11, 183, 170, 0.5);
  animation: agent-pulse 2.4s ease-in-out infinite;
}

@keyframes agent-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(11, 183, 170, 0.5); }
  50%      { box-shadow: 0 0 0 7px rgba(11, 183, 170, 0); }
}

.space-list-title {
  font-size: 0.875rem;
  font-weight: 800;
  color: #111827;
}

.space-list-subtitle {
  margin-top: 2px;
  font-size: 0.6875rem;
  color: #64748b;
  line-height: 1.45;
}

.space-count {
  flex-shrink: 0;
  min-width: 36px;
  height: 30px;
  padding: 0 11px;
  border-radius: 9px;
  border: 1px solid rgba(11, 183, 170, 0.2);
  background: rgba(240, 253, 250, 0.85);
  color: #0f766e;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.82) inset;
  animation: count-breathe 3s ease-in-out infinite;
}

@keyframes count-breathe {
  0%, 100% { box-shadow: 0 1px 0 rgba(255, 255, 255, 0.82) inset, 0 0 0 0 rgba(11, 183, 170, 0.12); }
  50%      { box-shadow: 0 1px 0 rgba(255, 255, 255, 0.82) inset, 0 0 0 4px rgba(11, 183, 170, 0.06); }
}

/* ========== Items ========== */
.space-items {
  display: flex;
  flex-direction: column;
}

/* ========== Empty ========== */
.space-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 16px 24px;
  background: rgba(255, 255, 255, 0.9);
}

.empty-illustration {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(241, 245, 249, 0.9), rgba(226, 232, 240, 0.6));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.empty-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.space-empty-title {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
}

.space-empty-desc {
  margin-top: 6px;
  font-size: 0.75rem;
  line-height: 1.5;
  color: #64748b;
  text-align: center;
  max-width: 260px;
}

/* ========== Item Row ========== */
.space-item {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 82px 16px;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 14px 16px;
  border: none;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.space-item::after {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: transparent;
  transition: background 0.2s ease;
}

.space-item:last-child {
  border-bottom: none;
}

.space-item:hover {
  z-index: 1;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.space-item:focus-visible {
  z-index: 2;
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
  border-radius: 4px;
}

/* Left accent bar on hover — color set per type below */
.space-item:hover::after {
  background: var(--item-accent);
}

.item-type-course     { --item-accent: #0bb7aa; }
.item-type-exam       { --item-accent: #f59e0b; }
.item-type-project    { --item-accent: #3b82f6; }
.item-type-career     { --item-accent: #10b981; }
.item-type-competition{ --item-accent: #ef4444; }
.item-type-default    { --item-accent: #94a3b8; }

/* ========== Main Content ========== */
.space-main {
  min-width: 0;
}

.space-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

/* Type dot with glow */
.space-type-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #94a3b8;
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.12);
  flex-shrink: 0;
  animation: dot-glow 3s ease-in-out infinite;
}

@keyframes dot-glow {
  0%, 100% { box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.12); }
  50%      { box-shadow: 0 0 0 5px rgba(148, 163, 184, 0.06); }
}

.type-course      { background: #0bb7aa; box-shadow: 0 0 0 3px rgba(11, 183, 170, 0.14); }
.type-exam        { background: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15); }
.type-project     { background: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.14); }
.type-career      { background: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.14); }
.type-competition { background: #ef4444; box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.13); }

.space-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
  font-weight: 700;
  color: #1f2937;
}

/* Risk Badge */
.risk-badge {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 7px;
  font-size: 0.625rem;
  font-weight: 700;
  border: 1px solid currentColor;
  line-height: 1.4;
}

.risk-good {
  color: #047857;
  background: rgba(220, 252, 231, 0.72);
  border-color: rgba(4, 120, 87, 0.16);
}

.risk-normal {
  color: #475569;
  background: rgba(241, 245, 249, 0.72);
  border-color: rgba(71, 85, 105, 0.16);
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

/* Goal */
.space-goal {
  margin-top: 5px;
  color: #475569;
  font-size: 0.75rem;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Meta tags */
.space-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 7px;
  font-size: 0.6875rem;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 20px;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(241, 245, 249, 0.86);
  color: #64748b;
}

.meta-overdue {
  color: #b91c1c;
  background: rgba(254, 226, 226, 0.64);
}

/* Mini icons via CSS pseudo-elements */
.meta-icon {
  display: inline-block;
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  opacity: 0.65;
}

.meta-icon-type {
  background: currentColor;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3 2h7l3 3v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z'/%3E%3C/svg%3E") center/contain no-repeat;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3 2h7l3 3v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z'/%3E%3C/svg%3E") center/contain no-repeat;
}

.meta-icon-today {
  background: currentColor;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect x='2' y='3' width='12' height='11' rx='1' fill='none' stroke='currentColor'/%3E%3Cline x1='2' y1='6' x2='14' y2='6' stroke='currentColor'/%3E%3C/svg%3E") center/contain no-repeat;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect x='2' y='3' width='12' height='11' rx='1' fill='none' stroke='currentColor'/%3E%3Cline x1='2' y1='6' x2='14' y2='6' stroke='currentColor'/%3E%3C/svg%3E") center/contain no-repeat;
}

.meta-icon-overdue {
  background: currentColor;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='6' fill='none' stroke='currentColor'/%3E%3Cline x1='8' y1='5' x2='8' y2='9' stroke='currentColor'/%3E%3Ccircle cx='8' cy='11' r='0.75' fill='currentColor'/%3E%3C/svg%3E") center/contain no-repeat;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='6' fill='none' stroke='currentColor'/%3E%3Cline x1='8' y1='5' x2='8' y2='9' stroke='currentColor'/%3E%3Ccircle cx='8' cy='11' r='0.75' fill='currentColor'/%3E%3C/svg%3E") center/contain no-repeat;
}

/* ========== Progress ========== */
.space-progress {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: 8px;
  background: rgba(248, 250, 252, 0.5);
}

.progress-value {
  font-size: 0.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.progress-track {
  width: 64px;
  height: 5px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.4s ease;
}

/* ========== Chevron ========== */
.space-chevron {
  color: #94a3b8;
  transition: color 0.2s ease, transform 0.2s ease;
}

.space-item:hover .space-chevron {
  color: #0f766e;
  transform: translateX(2px);
}

/* ========== Responsive ========== */
@media (max-width: 520px) {
  .space-item {
    grid-template-columns: minmax(0, 1fr) 16px;
    gap: 8px;
  }

  .space-progress {
    grid-column: 1 / -1;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    padding: 0;
    background: none;
  }

  .progress-track {
    flex: 1;
  }
}
</style>
