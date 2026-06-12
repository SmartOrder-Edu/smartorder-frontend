<template>
  <div class="plan-execution-accordion">
    <!-- 全局进度条 -->
    <div class="accordion-progress">
      <div class="progress-header">
        <span class="progress-label">执行中</span>
        <span class="progress-count">{{ completedCount }}/{{ totalCount }} 完成</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </div>

    <!-- 任务手风琴列表 -->
    <div class="accordion-body" ref="accordionBody">
      <div
        v-for="(task, index) in taskList.tasks"
        :key="task.taskId"
        class="accordion-step"
        :class="stepClass(task.taskId)"
      >
        <!-- 折叠行 -->
        <div class="step-row" @click="toggleStep(task.taskId)">
          <span class="step-status-icon">
            <!-- 完成 -->
            <svg v-if="execState(task.taskId)?.status === 'completed'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16" class="icon-completed">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <!-- 失败 -->
            <svg v-else-if="execState(task.taskId)?.status === 'failed'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" class="icon-failed">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <!-- 运行中 -->
            <span v-else-if="execState(task.taskId)?.status === 'running'" class="step-spinner"></span>
            <!-- 暂停 -->
            <svg v-else-if="execState(task.taskId)?.status === 'paused'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" class="icon-paused">
              <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
            </svg>
            <!-- 等待 -->
            <span v-else class="step-dot"></span>
          </span>
          <span class="step-index">{{ index + 1 }}</span>
          <span class="step-desc">{{ task.description }}</span>
          <span v-if="task.dependsOn.length" class="step-deps">← 依赖{{ formatDepIds(task.dependsOn) }}</span>
          <span class="step-time" v-if="stepDuration(task.taskId)">{{ stepDuration(task.taskId) }}</span>
          <span class="step-chevron" :class="{ rotated: isExpanded(task.taskId) }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </span>
        </div>

        <!-- 展开内容 -->
        <div class="step-expand" v-if="isExpanded(task.taskId)">
          <!-- ReAct 子视图（运行中/暂停时） -->
          <div class="step-react-view" v-if="isStepActive(task.taskId)">
            <template v-if="currentSegments(task.taskId)?.length">
              <template v-for="(seg, segIdx) in currentSegments(task.taskId)" :key="'seg-' + segIdx">
                <ThinkingBlock
                  v-if="seg.thinkingText"
                  :text="seg.thinkingText"
                  :streaming="seg.thinkingStreaming"
                />
                <ToolCallCard v-if="seg.toolCall" v-bind="seg.toolCall" />
              </template>
            </template>
            <div v-else-if="execState(task.taskId)?.status === 'running'" class="step-waiting">
              <span class="step-spinner-sm"></span>
              <span>Agent 正在思考...</span>
            </div>
          </div>

          <!-- 结果摘要（完成时） -->
          <div class="step-result" v-if="execState(task.taskId)?.status === 'completed' && execState(task.taskId)?.resultSummary">
            {{ execState(task.taskId)?.resultSummary }}
          </div>

          <!-- 错误信息（失败时） -->
          <div class="step-error" v-if="execState(task.taskId)?.status === 'failed' && execState(task.taskId)?.errorMessage">
            {{ execState(task.taskId)?.errorMessage }}
          </div>

          <!-- 重试提示 -->
          <div class="step-retry" v-if="execState(task.taskId)?.retryCount > 0">
            重试 {{ execState(task.taskId)?.retryCount }}/3
          </div>

          <!-- Gate 卡片（暂停时） -->
          <GateCard
            v-if="execState(task.taskId)?.status === 'paused' && pauseInfo && pauseInfo.taskId === task.taskId"
            :reason="pauseInfo.reason"
            :question="pauseInfo.question"
            @answer="handleGateAnswer"
            @confirm="handleGateConfirm"
            @cancel="handleGateCancel"
          />
        </div>
      </div>
    </div>

    <!-- 底部状态通知 -->
    <div class="accordion-footer" v-if="statusMessage">
      <span class="footer-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </span>
      <span class="footer-text">{{ statusMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useAgentStore } from '@/stores/agent'
import type { TaskList, TaskExecutionState, PlanPauseInfo } from '@/types/planExecute'
import ThinkingBlock from '@/components/agent/ThinkingBlock.vue'
import ToolCallCard from '@/components/agent/ToolCallCard.vue'
import GateCard from '@/components/plan/GateCard.vue'

const props = defineProps<{
  taskList: TaskList
  taskExecutionMap: Map<string, TaskExecutionState>
  pauseInfo: PlanPauseInfo | null
  /** 当前 agentStore 的 reasoningSegments（流式时的实时数据） */
  liveReasoningSegments?: any[]
}>()

const emit = defineEmits<{
  gateAnswer: [taskId: string, answer: string]
  gateConfirm: [taskId: string]
  gateCancel: [taskId: string]
}>()

const agentStore = useAgentStore()
const accordionBody = ref<HTMLElement>()
const expandedSteps = ref<Set<string>>(new Set())

// 当前运行的任务ID
const currentRunningTaskId = computed(() => {
  for (const [taskId, state] of props.taskExecutionMap) {
    if (state.status === 'running' || state.status === 'paused') return taskId
  }
  return null
})

function execState(taskId: string): TaskExecutionState | undefined {
  return props.taskExecutionMap.get(taskId)
}

function isExpanded(taskId: string): boolean {
  return expandedSteps.value.has(taskId)
}

function toggleStep(taskId: string) {
  if (expandedSteps.value.has(taskId)) {
    expandedSteps.value.delete(taskId)
  } else {
    expandedSteps.value.add(taskId)
  }
}

function isStepActive(taskId: string): boolean {
  const state = execState(taskId)
  return state?.status === 'running' || state?.status === 'paused'
}

function stepClass(taskId: string): string {
  const state = execState(taskId)
  if (!state) return ''
  return `step-${state.status}`
}

function stepDuration(taskId: string): string {
  const state = execState(taskId)
  if (!state?.startedAt) return ''
  const end = state.completedAt || Date.now()
  const seconds = Math.round((end - state.startedAt) / 1000)
  if (seconds < 60) return `${seconds}s`
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}m${sec}s`
}

function currentSegments(taskId: string) {
  // 运行中的任务使用 liveReasoningSegments
  if (taskId === currentRunningTaskId.value && props.liveReasoningSegments?.length) {
    return props.liveReasoningSegments
  }
  return execState(taskId)?.reasoningSegments || []
}

function formatDepIds(ids: string[]): string {
  const circled = '①②③④⑤⑥⑦⑧⑨⑩'
  return ids.map(id => {
    const num = parseInt(id.replace('task-', ''))
    return circled[num - 1] || num
  }).join('')
}

const completedCount = computed(() => {
  let count = 0
  for (const [, state] of props.taskExecutionMap) {
    if (state.status === 'completed') count++
  }
  return count
})

const totalCount = computed(() => props.taskList.tasks.length)

const progressPercent = computed(() => {
  if (!totalCount.value) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

const statusMessage = computed(() => {
  // 检查是否有重试/重规划
  for (const [, state] of props.taskExecutionMap) {
    if (state.retryCount > 0 && state.status === 'running') {
      return `任务重试中 (${state.retryCount}/3)`
    }
  }
  if (props.taskList.status === 'FAILED') {
    return '计划执行失败'
  }
  return ''
})

// 自动展开当前运行的任务，折叠已完成的
watch(currentRunningTaskId, (newId, oldId) => {
  if (oldId) expandedSteps.value.delete(oldId)
  if (newId) expandedSteps.value.add(newId)

  // 自动滚动到当前任务
  nextTick(() => {
    if (accordionBody.value && newId) {
      const el = accordionBody.value.querySelector(`.accordion-step.step-running, .accordion-step.step-paused`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  })
}, { immediate: true })

function handleGateAnswer(answer: string) {
  if (props.pauseInfo) {
    emit('gateAnswer', props.pauseInfo.taskId, answer)
  }
}

function handleGateConfirm() {
  if (props.pauseInfo) {
    emit('gateConfirm', props.pauseInfo.taskId)
  }
}

function handleGateCancel() {
  if (props.pauseInfo) {
    emit('gateCancel', props.pauseInfo.taskId)
  }
}
</script>

<style scoped>
.plan-execution-accordion {
  background: linear-gradient(135deg, #f0f7ff 0%, #eef2ff 50%, #f5f3ff 100%);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: var(--radius-xl, 1rem);
  padding: 16px 18px;
  margin-top: 10px;
  animation: cardIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 进度条 */
.accordion-progress {
  margin-bottom: 14px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.progress-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-dark, #0f172a);
}

.progress-count {
  font-size: 0.75rem;
  color: var(--text-muted, #94a3b8);
  font-variant-numeric: tabular-nums;
}

.progress-bar {
  height: 4px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 2px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 手风琴主体 */
.accordion-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.accordion-step {
  background: white;
  border-radius: var(--radius-lg, 0.75rem);
  border: 1px solid rgba(59, 130, 246, 0.08);
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.accordion-step.step-running {
  border-color: rgba(59, 130, 246, 0.25);
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.08);
}

.accordion-step.step-paused {
  border-color: rgba(245, 158, 11, 0.3);
  box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.08);
}

.accordion-step.step-failed {
  border-color: rgba(239, 68, 68, 0.2);
}

/* 折叠行 */
.step-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.step-row:hover {
  background: rgba(59, 130, 246, 0.03);
}

.step-status-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-completed { color: #10b981; }
.icon-failed { color: #ef4444; }
.icon-paused { color: #d97706; }

.step-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.step-spinner-sm {
  width: 10px;
  height: 10px;
  border: 1.5px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
  margin-right: 6px;
}

.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-default, #e2e8f0);
}

.step-index {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.08);
  color: var(--primary-color, #3b5bdb);
  font-size: 0.625rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-desc {
  flex: 1;
  font-size: 0.8125rem;
  color: var(--text-dark, #0f172a);
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.step-completed .step-desc {
  color: var(--text-secondary, #475569);
}

.step-deps {
  font-size: 0.625rem;
  color: var(--text-muted, #94a3b8);
  flex-shrink: 0;
}

.step-time {
  font-size: 0.6875rem;
  color: var(--text-muted, #94a3b8);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.step-chevron {
  display: flex;
  align-items: center;
  color: var(--text-muted, #94a3b8);
  transition: transform 0.2s;
  flex-shrink: 0;
}

.step-chevron.rotated {
  transform: rotate(180deg);
}

/* 展开内容 */
.step-expand {
  padding: 0 12px 10px 44px;
  border-top: 1px solid rgba(59, 130, 246, 0.06);
  margin-top: 0;
  padding-top: 8px;
}

.step-react-view {
  margin-bottom: 4px;
}

.step-waiting {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--text-muted, #94a3b8);
  padding: 4px 0;
}

.step-result {
  font-size: 0.75rem;
  color: var(--text-secondary, #475569);
  line-height: 1.5;
  padding: 4px 8px;
  background: rgba(16, 185, 129, 0.04);
  border-radius: var(--radius-md, 0.5rem);
}

.step-error {
  font-size: 0.75rem;
  color: #ef4444;
  line-height: 1.5;
  padding: 4px 8px;
  background: rgba(239, 68, 68, 0.04);
  border-radius: var(--radius-md, 0.5rem);
}

.step-retry {
  font-size: 0.6875rem;
  color: #d97706;
  margin-top: 4px;
}

/* 底部状态 */
.accordion-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(59, 130, 246, 0.1);
  font-size: 0.6875rem;
  color: var(--text-muted, #94a3b8);
}

.footer-icon {
  display: flex;
  align-items: center;
  color: #d97706;
}

.footer-text {
  color: #d97706;
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
