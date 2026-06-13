<template>
  <div class="plan-checklist">
    <!-- 标题栏 -->
    <div class="checklist-header">
      <div class="header-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      </div>
      <div class="header-text">
        <span class="header-label">学习计划</span>
        <span class="header-goal">{{ taskList.userGoal }}</span>
      </div>
      <button class="confirm-btn" @click="$emit('confirm')" :disabled="confirming">
        <svg v-if="!confirming" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span class="step-spinner-white" v-else></span>
        {{ confirming ? '确认中...' : '确认执行' }}
      </button>
    </div>

    <!-- 任务清单 -->
    <div class="checklist-body">
      <div
        v-for="(task, index) in taskList.tasks"
        :key="task.taskId"
        class="checklist-item"
        :class="{ expanded: expandedId === task.taskId }"
      >
        <div class="item-row" @click="toggleExpand(task.taskId)">
          <span class="item-status" :class="statusClass(task.status)">
            <svg v-if="task.status === 'COMPLETED'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <svg v-else-if="task.status === 'FAILED'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span v-else-if="task.status === 'RUNNING'" class="item-spinner"></span>
            <svg v-else-if="task.status === 'PAUSED'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
            </svg>
            <span v-else>{{ index + 1 }}</span>
          </span>
          <span class="item-desc">{{ task.description }}</span>
          <span v-if="task.dependsOn?.length" class="item-deps">
            ← 依赖{{ formatDepIds(task.dependsOn) }}
          </span>
          <span class="item-state-label" :class="statusClass(task.status)">
            {{ statusLabel(task.status) }}
          </span>
          <span class="item-gate" :class="gateClass(task.gate)">
            {{ gateLabel(task.gate) }}
          </span>
          <span class="item-chevron" :class="{ rotated: expandedId === task.taskId }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </span>
        </div>
        <div class="item-detail" v-if="expandedId === task.taskId">
          <div class="detail-row" v-if="task.expectedOutput">
            <span class="detail-label">预期产出</span>
            <span class="detail-value">{{ task.expectedOutput }}</span>
          </div>
          <div class="detail-row" v-if="task.requiredTools?.length">
            <span class="detail-label">所需工具</span>
            <div class="detail-tags">
              <span class="tool-tag" v-for="tool in task.requiredTools" :key="tool">{{ tool }}</span>
            </div>
          </div>
          <div class="detail-row">
            <span class="detail-label">风险等级</span>
            <span class="risk-badge" :class="'risk-' + task.riskLevel.toLowerCase()">{{ riskLabel(task.riskLevel) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计栏 -->
    <div class="checklist-footer">
      <span class="stat">{{ taskList.tasks.length }} 个任务</span>
      <span class="stat-sep">·</span>
      <span class="stat highlight-clr">{{ clarificationCount }} 个需回答</span>
      <span class="stat-sep">·</span>
      <span class="stat highlight-cfm">{{ confirmationCount }} 个需确认</span>
      <span class="stat-sep">·</span>
      <span class="stat">最长链 {{ maxChainDepth }} 层</span>
    </div>
    <p class="checklist-hint">标记 🔴 的步骤执行前会征求你的同意</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TaskList, GateType, RiskLevel } from '@/types/planExecute'

const props = defineProps<{
  taskList: TaskList
  confirming?: boolean
}>()

defineEmits<{
  confirm: []
}>()

const expandedId = ref<string | null>(null)

function toggleExpand(taskId: string) {
  expandedId.value = expandedId.value === taskId ? null : taskId
}

function gateLabel(gate: GateType): string {
  switch (gate) {
    case 'NORMAL': return '直接执行'
    case 'CLARIFICATION': return '需回答问题'
    case 'CONFIRMATION': return '需确认'
    default: return gate
  }
}

function gateClass(gate: GateType): string {
  switch (gate) {
    case 'NORMAL': return 'gate-normal'
    case 'CLARIFICATION': return 'gate-clarification'
    case 'CONFIRMATION': return 'gate-confirmation'
    default: return ''
  }
}

function riskLabel(level: RiskLevel): string {
  switch (level) {
    case 'READ': return '只读'
    case 'WRITE_DRAFT': return '草稿写入'
    case 'WRITE_CONFIRMED': return '确认写入'
    default: return level
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'COMPLETED': return '已完成'
    case 'RUNNING': return '执行中'
    case 'FAILED': return '失败'
    case 'SKIPPED': return '已跳过'
    case 'PAUSED': return '已暂停'
    default: return '待执行'
  }
}

function statusClass(status: string): string {
  switch (status) {
    case 'COMPLETED': return 'state-completed'
    case 'RUNNING': return 'state-running'
    case 'FAILED': return 'state-failed'
    case 'SKIPPED': return 'state-skipped'
    case 'PAUSED': return 'state-paused'
    default: return 'state-pending'
  }
}

function formatDepIds(ids: string[]): string {
  return ids.map(id => {
    const num = id.replace('task-', '')
    return `①②③④⑤⑥⑦⑧⑨⑩`[parseInt(num) - 1] || num
  }).join('')
}

const clarificationCount = computed(() =>
  props.taskList.tasks.filter(t => t.gate === 'CLARIFICATION').length
)
const confirmationCount = computed(() =>
  props.taskList.tasks.filter(t => t.gate === 'CONFIRMATION').length
)
const maxChainDepth = computed(() => {
  const depths = new Map<string, number>()
  function getDepth(taskId: string): number {
    if (depths.has(taskId)) return depths.get(taskId)!
    const task = props.taskList.tasks.find(t => t.taskId === taskId)
    if (!task || !task.dependsOn?.length) {
      depths.set(taskId, 1)
      return 1
    }
    const d = 1 + Math.max(...task.dependsOn.map(getDepth))
    depths.set(taskId, d)
    return d
  }
  return Math.max(1, ...props.taskList.tasks.map(t => getDepth(t.taskId)))
})
</script>

<style scoped>
.plan-checklist {
  background: linear-gradient(135deg, #f0f7ff 0%, #eef2ff 50%, #f5f3ff 100%);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: var(--radius-lg, 0.75rem);
  padding: 10px;
}

.checklist-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.header-icon {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md, 0.5rem);
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.header-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.header-label {
  font-size: 0.625rem;
  color: var(--text-muted, #94a3b8);
}

.header-goal {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-dark, #0f172a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.confirm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  border-radius: var(--radius-md, 0.5rem);
  background: var(--gradient-primary);
  color: white;
  font-size: 0.6875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
  flex-shrink: 0;
  white-space: nowrap;
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.35);
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.step-spinner-white {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.checklist-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.checklist-item {
  background: white;
  border-radius: var(--radius-lg, 0.75rem);
  border: 1px solid rgba(59, 130, 246, 0.08);
  overflow: hidden;
  transition: border-color 0.2s;
}

.checklist-item.expanded {
  border-color: rgba(59, 130, 246, 0.2);
}

.item-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.item-row:hover {
  background: rgba(59, 130, 246, 0.03);
}

.item-status {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.1);
  color: var(--primary-color, #3b5bdb);
  font-size: 0.625rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-status.state-completed {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.item-status.state-running {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.item-status.state-failed {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.item-status.state-paused {
  background: rgba(245, 158, 11, 0.12);
  color: #d97706;
}

.item-status.state-skipped {
  background: rgba(148, 163, 184, 0.16);
  color: #64748b;
}

.item-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.item-desc {
  flex: 1;
  font-size: 0.6875rem;
  color: var(--text-dark, #0f172a);
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-deps {
  font-size: 0.625rem;
  color: var(--text-muted, #94a3b8);
  flex-shrink: 0;
}

.item-state-label {
  font-size: 0.625rem;
  padding: 2px 8px;
  border-radius: var(--radius-full, 999px);
  font-weight: 600;
  flex-shrink: 0;
  white-space: nowrap;
}

.item-state-label.state-pending {
  background: rgba(148, 163, 184, 0.12);
  color: #64748b;
}

.item-state-label.state-completed {
  background: rgba(16, 185, 129, 0.08);
  color: #059669;
}

.item-state-label.state-running {
  background: rgba(59, 130, 246, 0.08);
  color: #3b82f6;
}

.item-state-label.state-failed {
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
}

.item-state-label.state-paused {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.item-state-label.state-skipped {
  background: rgba(148, 163, 184, 0.12);
  color: #64748b;
}

.item-gate {
  font-size: 0.625rem;
  padding: 2px 8px;
  border-radius: var(--radius-full, 999px);
  font-weight: 600;
  flex-shrink: 0;
  white-space: nowrap;
}

.gate-normal {
  background: rgba(59, 130, 246, 0.08);
  color: #3b82f6;
}

.gate-clarification {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.gate-confirmation {
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
}

.item-chevron {
  display: flex;
  align-items: center;
  color: var(--text-muted, #94a3b8);
  transition: transform 0.2s;
  flex-shrink: 0;
}

.item-chevron.rotated {
  transform: rotate(180deg);
}

.item-detail {
  padding: 0 8px 8px 34px;
  border-top: 1px solid rgba(59, 130, 246, 0.06);
  margin-top: 0;
  padding-top: 6px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 6px;
}

.detail-label {
  font-size: 0.625rem;
  color: var(--text-muted, #94a3b8);
  flex-shrink: 0;
  min-width: 48px;
}

.detail-value {
  font-size: 0.6875rem;
  color: var(--text-secondary, #475569);
  line-height: 1.4;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tool-tag {
  font-size: 0.625rem;
  padding: 1px 6px;
  background: rgba(59, 130, 246, 0.06);
  border-radius: 4px;
  color: var(--primary-color, #3b5bdb);
}

.risk-badge {
  font-size: 0.625rem;
  padding: 1px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.risk-read {
  background: rgba(16, 185, 129, 0.08);
  color: #059669;
}

.risk-write_draft {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.risk-write_confirmed {
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
}

.checklist-footer {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(59, 130, 246, 0.1);
  font-size: 0.625rem;
  color: var(--text-muted, #94a3b8);
}

.stat-sep {
  opacity: 0.4;
}

.highlight-clr {
  color: #d97706;
  font-weight: 600;
}

.highlight-cfm {
  color: #dc2626;
  font-weight: 600;
}

.checklist-hint {
  margin: 6px 0 0;
  font-size: 0.625rem;
  color: var(--text-muted, #94a3b8);
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

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
