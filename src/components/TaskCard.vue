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
        开始这次学习
      </button>
      <template v-else-if="task.status === 'in_progress'">
        <button
          class="task-btn continue"
          @click.stop="$emit('start', task)"
        >
          继续学习
        </button>
        <button
          class="task-btn complete"
          @click.stop="$emit('complete', task)"
        >
          完成
        </button>
      </template>
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
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 18px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 14px;
    bottom: 14px;
    width: 3px;
    border-radius: 0 999px 999px 0;
    background: #cbd5e1;
  }

  &:hover {
    border-color: rgba(11, 183, 170, 0.26);
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.075);
    transform: translateY(-1px);
  }

  &.status-completed { opacity: 0.7; }
  &.status-overdue {
    border-color: rgba(248, 113, 113, 0.34);
    background: linear-gradient(135deg, #fff, #fff7f7);
  }

  &.status-in_progress::before { background: #0bb7aa; }
  &.status-completed::before { background: #10b981; }
  &.status-overdue::before { background: #ef4444; }
}

.task-status-indicator {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;

  &.pending {
    border: 2px solid #cbd5e1;
    color: #94a3b8;
    background: #f8fafc;
  }
  &.in_progress {
    background: #ecfdfb;
    border: 2px solid #0bb7aa;
    color: #0a9e94;
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
  margin-bottom: 5px;
}

.task-type-badge {
  font-size: 0.6875rem;
  padding: 2px 8px;
  border-radius: 99px;
  font-weight: 700;

  &.daily { background: #ecfdfb; color: #0a9e94; }
  &.milestone { background: #fef3c7; color: #d97706; }
  &.exam { background: #fce7f3; color: #db2777; }
  &.review { background: #ede9fe; color: #7c3aed; }
}

.task-priority {
  color: #f59e0b;
  display: flex;
}

.task-title {
  font-size: 0.96rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 5px;
  line-height: 1.45;
}

.task-suggestion {
  font-size: 0.78rem;
  color: #64748b;
  margin: 0 0 10px;
  line-height: 1.55;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.task-duration {
  font-size: 0.75rem;
  color: #64748b;
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
  padding-top: 4px;
}

.task-btn {
  min-width: 72px;
  padding: 7px 16px;
  border-radius: 11px;
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
  border: none;

  &.start {
    background: linear-gradient(135deg, #0bb7aa, #0284c7);
    color: white;
    box-shadow: 0 8px 18px rgba(11, 183, 170, 0.2);
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 24px rgba(11, 183, 170, 0.26);
    }
  }
  &.complete {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    &:hover { transform: translateY(-1px); }
  }
  &.continue {
    background: #fff;
    color: #0bb7aa;
    border: 1px solid rgba(11, 183, 170, 0.4);
    &:hover {
      background: rgba(11, 183, 170, 0.08);
      border-color: #0bb7aa;
    }
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

@media (max-width: 640px) {
  .task-card {
    flex-wrap: wrap;
    padding: 14px;
  }

  .task-actions {
    width: 100%;
    padding-left: 44px;
  }

  .task-btn {
    width: 100%;
  }
}
</style>
