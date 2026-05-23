<template>
  <div class="plan-created-card">
    <div class="plan-card-header">
      <span class="plan-card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      </span>
      <div class="plan-card-title-group">
        <span class="plan-card-label">学习计划已创建</span>
        <span class="plan-card-name">{{ plan.spaceName }}</span>
      </div>
    </div>

    <div class="plan-card-stats">
      <div class="plan-stat">
        <span class="plan-stat-value">{{ plan.totalPhases || plan.nodeCount }}</span>
        <span class="plan-stat-label">阶段</span>
      </div>
      <div class="plan-stat">
        <span class="plan-stat-value">{{ plan.totalWeeks || '—' }}</span>
        <span class="plan-stat-label">周</span>
      </div>
      <div class="plan-stat">
        <span class="plan-stat-value">{{ plan.kgNodeCount }}</span>
        <span class="plan-stat-label">知识点</span>
      </div>
      <div class="plan-stat">
        <span class="plan-stat-value">{{ formatDateRange() }}</span>
        <span class="plan-stat-label">周期</span>
      </div>
    </div>

    <button class="plan-enter-btn" @click="goToSpace" :disabled="!plan.spaceId">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
        <polyline points="13 2 3 14 12 14 11 22 21 10 12 10"/>
      </svg>
      {{ plan.spaceId ? '进入学习空间' : '学习空间创建中...' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { PlanSummary } from '@/api/agent'
import { useRouter } from 'vue-router'

const props = defineProps<{
  plan: PlanSummary
}>()

const router = useRouter()

function goToSpace() {
  if (props.plan.spaceId) {
    router.push(`/space/${props.plan.spaceId}`)
  }
}

function formatDateRange(): string {
  if (!props.plan.startDate && !props.plan.targetEndDate) return '—'
  const fmt = (s: string) => {
    if (!s) return ''
    const parts = s.split('-')
    return parts.length === 3 ? `${parseInt(parts[1])}/${parseInt(parts[2])}` : s
  }
  return `${fmt(props.plan.startDate)}~${fmt(props.plan.targetEndDate)}`
}
</script>

<style scoped>
.plan-created-card {
  background: linear-gradient(135deg, #f0f7ff 0%, #eef2ff 50%, #f5f3ff 100%);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: var(--radius-xl, 1rem);
  padding: 16px 18px;
  margin-top: 10px;
  animation: cardIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.plan-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.plan-card-icon {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-lg, 0.75rem);
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.plan-card-title-group {
  display: flex;
  flex-direction: column;
}
.plan-card-label {
  font-size: 0.6875rem;
  color: var(--text-muted, #94a3b8);
}
.plan-card-name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-dark, #0f172a);
}

.plan-card-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}

.plan-stat {
  text-align: center;
  padding: 8px 4px;
  background: white;
  border-radius: var(--radius-md, 0.5rem);
  border: 1px solid rgba(59, 130, 246, 0.08);
}

.plan-stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--primary-color, #3b82f6);
  display: block;
  letter-spacing: -0.01em;
}
.plan-stat:last-child .plan-stat-value {
  font-size: 0.6875rem;
}

.plan-stat-label {
  font-size: 0.625rem;
  color: var(--text-muted, #94a3b8);
  margin-top: 1px;
}

.plan-enter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px 0;
  border: none;
  border-radius: var(--radius-lg, 0.75rem);
  background: var(--gradient-primary);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}
.plan-enter-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.35);
}
.plan-enter-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
