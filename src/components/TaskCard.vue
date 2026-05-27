<template>
  <div class="task-card" :class="[`status-${task.status}`, `priority-${task.priority}`]">
    <div class="task-status-indicator" :class="task.status">
      <svg v-if="task.status === 'completed'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="16" height="16">
        <polyline points="20,6 9,17 4,12"/>
      </svg>
      <svg v-else-if="task.status === 'in_progress'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
        <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
        <circle cx="12" cy="12" r="10"/>
      </svg>
    </div>

    <div class="task-body">
      <div class="task-header">
        <span class="task-type-badge" :class="task.taskType">{{ typeLabel }}</span>
        <span class="task-priority" v-if="task.priority >= 4">
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><polygon points="12,2 15,11 24,11 17,17 20,24 12,19 4,24 7,17 0,11 9,11"/></svg>
        </span>
      </div>
      <h4 class="task-title">{{ task.title }}</h4>
      <p class="task-suggestion" v-if="task.aiSuggestion && task.status !== 'completed'">{{ task.aiSuggestion }}</p>
      <div class="task-meta">
        <span class="task-duration" v-if="task.estimatedDurationMinutes">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
          {{ task.estimatedDurationMinutes }}分钟
        </span>
        <span class="task-duration done" v-if="task.actualDurationMinutes">实际{{ task.actualDurationMinutes }}分钟</span>
        <span class="task-overdue" v-if="task.isOverdue">已逾期</span>
      </div>
    </div>

    <div class="task-actions">
      <button
        v-if="task.status === 'pending'"
        class="task-btn start"
        @click.stop="$emit('start', task)"
      >
        开始
      </button>
      <button
        v-else-if="task.status === 'in_progress'"
        class="task-btn complete"
        @click.stop="$emit('complete', task)"
      >
        完成
      </button>
      <span v-else-if="task.status === 'completed'" class="task-done-label">已完成</span>
      <span v-else-if="task.status === 'overdue'" class="task-overdue-label">已逾期</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TaskVO } from '@/types/learningSpace'

const props = defineProps<{ task: TaskVO }>()

defineEmits<{
  start: [task: TaskVO]
  complete: [task: TaskVO]
}>()

const typeLabel = computed(() => {
  const m: Record<string, string> = {
    daily: '日常', milestone: '里程碑', exam: '测验', review: '复习',
  }
  return m[props.task.taskType] || props.task.taskType
})
</script>

<script lang="ts">
export default { name: 'TaskCard' }
</script>

<style scoped lang="scss">
.task-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 20px;
  background: white;
  border-radius: 14px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s;

  &:hover { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); }

  &.status-completed { opacity: 0.7; }
  &.status-overdue { border-color: #fecaca; background: #fff5f5; }
}

.task-status-indicator {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.pending {
    border: 2px solid #d0d5dd;
    color: #d0d5dd;
  }
  &.in_progress {
    background: #eff6ff;
    border: 2px solid #3b82f6;
    color: #3b82f6;
  }
  &.completed {
    background: #10b981;
    border-color: #10b981;
    color: white;
  }
  &.overdue {
    background: #fef2f2;
    border: 2px solid #ef4444;
    color: #ef4444;
  }
}

.task-body {
  flex: 1;
  min-width: 0;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.task-type-badge {
  font-size: 0.6875rem;
  padding: 1px 8px;
  border-radius: 99px;

  &.daily { background: #eff6ff; color: #3b82f6; }
  &.milestone { background: #fef3c7; color: #d97706; }
  &.exam { background: #fce7f3; color: #db2777; }
  &.review { background: #ede9fe; color: #7c3aed; }
}

.task-priority {
  color: #f59e0b;
  display: flex;
}

.task-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 4px;
}

.task-suggestion {
  font-size: 0.75rem;
  color: #8c8ca1;
  margin: 0 0 8px;
  line-height: 1.4;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.task-duration {
  font-size: 0.75rem;
  color: #8c8ca1;
  display: flex;
  align-items: center;
  gap: 3px;

  &.done { color: #10b981; }
}

.task-overdue {
  font-size: 0.6875rem;
  padding: 1px 6px;
  border-radius: 99px;
  background: #fef2f2;
  color: #ef4444;
}

.task-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.task-btn {
  padding: 6px 18px;
  border-radius: 99px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  &.start {
    background: #3b82f6;
    color: white;
    &:hover { background: #2563eb; }
  }
  &.complete {
    background: #10b981;
    color: white;
    &:hover { background: #059669; }
  }
}

.task-done-label {
  font-size: 0.8125rem;
  color: #10b981;
  font-weight: 500;
}

.task-overdue-label {
  font-size: 0.8125rem;
  color: #ef4444;
  font-weight: 500;
}
</style>
