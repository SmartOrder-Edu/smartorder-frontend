<template>
  <div class="stats-bar">
    <div class="stat-card" v-for="(stat, i) in stats" :key="stat.label" :style="{ animationDelay: (0.08 * i) + 's' }">
      <span class="stat-value">{{ stat.value }}</span>
      <span class="stat-label">{{ stat.label }}</span>
      <span class="stat-icon" v-html="stat.icon"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  plan: any
}>()

const stats = computed(() => {
  const plan = props.plan
  if (!plan) return []

  const totalPhases = plan.phases?.length || 0
  const totalWeeks = plan.phases?.reduce((s: number, p: any) => s + (p.weeks || 0), 0) || 0
  const totalKPs = plan.phases?.reduce((s: number, p: any) => s + (p.knowledgePoints?.length || 0), 0) || 0
  const estimatedTasks = totalKPs * 2
  const dateRange = plan.startDate && plan.targetEndDate
    ? `${formatShortDate(plan.startDate)} ~ ${formatShortDate(plan.targetEndDate)}`
    : '待定'

  return [
    {
      value: totalPhases,
      label: '学习阶段',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    },
    {
      value: totalWeeks,
      label: '总周数',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    },
    {
      value: totalKPs,
      label: '知识点',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    },
    {
      value: estimatedTasks,
      label: '预计任务',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    },
    {
      value: dateRange,
      label: '学习周期',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    },
  ]
})

function formatShortDate(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) return `${parseInt(parts[1])}/${parseInt(parts[2])}`
  return dateStr
}
</script>

<style scoped>
.stats-bar {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.stat-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 10px 12px;
  background: var(--gradient-card);
  border: 1px solid var(--border-soft, rgba(148, 163, 184, 0.12));
  border-radius: var(--radius-xl, 1rem);
  overflow: hidden;
  animation: fadeInUp 0.4s ease both;
  transition: all 0.2s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-primary, rgba(59, 130, 246, 0.15));
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-dark, #0f172a);
  letter-spacing: -0.01em;
  z-index: 1;
}
.stat-value:last-child {
  /* date range */
  font-size: 0.75rem;
  white-space: nowrap;
}

.stat-label {
  font-size: 0.6875rem;
  color: var(--text-muted, #94a3b8);
  margin-top: 2px;
  z-index: 1;
}

.stat-icon {
  position: absolute;
  right: -6px;
  bottom: -8px;
  width: 40px;
  height: 40px;
  opacity: 0.06;
  color: var(--primary-color, #3b82f6);
}
.stat-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 移动端: 2 列 */
@media (max-width: 768px) {
  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
  }
  .stat-card:last-child {
    grid-column: span 2;
  }
}
</style>
