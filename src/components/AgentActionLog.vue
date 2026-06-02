<template>
  <div class="agent-action-log">
    <h4 class="log-title">Agent 操作日志</h4>
    <div class="log-list">
      <div v-for="action in actions" :key="action.id" class="log-item" :class="action.status">
        <div class="log-dot" :class="action.agentType"></div>
        <div class="log-body">
          <div class="log-header">
            <span class="log-agent-type">{{ agentTypeLabel(action.agentType) }}</span>
            <span class="log-time">{{ formatTime(action.createTime) }}</span>
          </div>
          <p class="log-reason">{{ action.reason }}</p>
          <span class="log-status-tag" :class="action.status">{{ statusLabel(action.status) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AgentActionVO } from '@/types/learningSpace'

defineProps<{ actions: AgentActionVO[] }>()

function agentTypeLabel(t: string) {
  const m: Record<string, string> = {
    planner: '规划', profile: '画像', resource: '资源',
    tutor: '教学', assessment: '测评', memory: '记忆', supervisor: '监督',
  }
  return m[t] || t
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    success: '已完成', pending: '待执行', running: '执行中', failed: '失败', waiting_user_confirm: '待确认',
  }
  return m[s] || s
}

function formatTime(time: string) {
  return time.slice(11, 16)
}
</script>

<script lang="ts">
export default { name: 'AgentActionLog' }
</script>

<style scoped lang="scss">
.log-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.log-item {
  display: flex;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #f9fafb;
  font-size: 0.75rem;
}

.log-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;

  &.planner { background: #3b82f6; }
  &.profile { background: #8b5cf6; }
  &.resource { background: #10b981; }
  &.tutor { background: #f59e0b; }
  &.assessment { background: #ef4444; }
  &.memory { background: #ec4899; }
  &.supervisor { background: #6b7280; }
}

.log-body {
  flex: 1;
  min-width: 0;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.log-agent-type {
  font-weight: 600;
  color: #374151;
}

.log-time {
  font-size: 0.6875rem;
  color: #9ca3af;
}

.log-reason {
  margin: 2px 0;
  color: #6b7280;
  line-height: 1.4;
}

.log-status-tag {
  font-size: 0.625rem;
  padding: 1px 6px;
  border-radius: 99px;

  &.success { background: #ecfdf5; color: #10b981; }
  &.failed { background: #fef2f2; color: #ef4444; }
  &.running { background: #eff6ff; color: #3b82f6; }
  &.pending { background: #f3f4f6; color: #6b7280; }
}
</style>
