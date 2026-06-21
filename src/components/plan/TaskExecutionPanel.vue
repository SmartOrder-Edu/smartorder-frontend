<template>
  <Transition name="panel-slide">
    <div class="task-execution-panel" v-if="taskList">
      <!-- 面板头部 -->
      <div class="panel-header" :class="{ clickable: collapsible }" @click="toggleCollapsed">
        <div class="panel-header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <div class="panel-header-text">
          <span class="panel-title">执行计划</span>
          <span class="panel-goal" :title="taskList.userGoal">{{ taskList.userGoal }}</span>
        </div>
        <button
          v-if="collapsible"
          class="panel-collapse-btn"
          type="button"
          :title="collapsed ? '展开执行计划' : '收起执行计划'"
          @click.stop="collapsed = !collapsed"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="14"
            height="14"
            :class="{ rotated: !collapsed }"
          >
            <polyline points="6,9 12,15 18,9"/>
          </svg>
        </button>
      </div>

      <!-- 面板内容 -->
      <div class="panel-body" v-if="!collapsed">
        <!-- 规划审阅阶段 -->
        <PlanChecklist
          v-if="isAwaitingConfirmation"
          :task-list="taskList"
          :confirming="confirming"
          @confirm="$emit('confirm')"
        />

        <!-- 执行阶段 -->
        <PlanExecutionAccordion
          v-else
          :task-list="taskList"
          :task-execution-map="taskExecutionMap"
          :pause-info="pauseInfo"
          :live-reasoning-segments="liveReasoningSegments"
          :is-current-active="isCurrentActive"
          :gate-submitting="gateSubmitting"
          :show-gate-card="showGateCard"
          @gate-answer="(clarificationId: string, answer: string) => $emit('gateAnswer', clarificationId, answer)"
          @gate-confirm="(taskId: string) => $emit('gateConfirm', taskId)"
          @gate-cancel="(taskId: string) => $emit('gateCancel', taskId)"
        />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { TaskList, TaskExecutionState, PlanPauseInfo } from '@/types/planExecute'
import PlanChecklist from '@/components/plan/PlanChecklist.vue'
import PlanExecutionAccordion from '@/components/plan/PlanExecutionAccordion.vue'

const props = withDefaults(defineProps<{
  taskList: TaskList | null
  taskExecutionMap: Map<string, TaskExecutionState>
  pauseInfo: PlanPauseInfo | null
  confirming?: boolean
  liveReasoningSegments?: any[]
  isCurrentActive?: boolean
  gateSubmitting?: boolean
  showGateCard?: boolean
  collapsible?: boolean
  defaultCollapsed?: boolean
}>(), {
  showGateCard: true,
  collapsible: false,
  defaultCollapsed: false,
})

defineEmits<{
  confirm: []
  gateAnswer: [clarificationId: string, answer: string]
  gateConfirm: [taskId: string]
  gateCancel: [taskId: string]
}>()

const isAwaitingConfirmation = computed(() => {
  if (!props.taskList) return false
  return props.taskList.status === 'DRAFT'
    || props.taskList.status === 'PENDING_CONFIRM'
    || props.taskList.status === 'PAUSED_CONFIRMATION'
})

const isTerminal = computed(() => {
  const status = props.taskList?.status
  return status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED'
})

const collapsed = ref(false)

watch(
  () => [props.taskList?.planId, props.taskList?.status, props.defaultCollapsed] as const,
  () => {
    collapsed.value = !!props.defaultCollapsed && isTerminal.value
  },
  { immediate: true },
)

function toggleCollapsed() {
  if (props.collapsible) {
    collapsed.value = !collapsed.value
  }
}
</script>

<style scoped>
.task-execution-panel {
  background: white;
  border-radius: var(--radius-xl, 1rem);
  border: 1px solid rgba(59, 130, 246, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 55vh;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.04) 0%, rgba(139, 92, 246, 0.04) 100%);
  border-bottom: 1px solid rgba(59, 130, 246, 0.08);
  flex-shrink: 0;
}

.panel-header.clickable {
  cursor: pointer;
}

.panel-header-icon {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-md, 0.5rem);
  background: var(--gradient-primary, linear-gradient(135deg, #3b5bdb, #6366f1));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.panel-header-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.panel-collapse-btn {
  width: 28px;
  height: 28px;
  border: 1px solid rgba(59, 130, 246, 0.12);
  border-radius: var(--radius-md, 0.5rem);
  background: rgba(255, 255, 255, 0.8);
  color: var(--text-secondary, #64748b);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.panel-collapse-btn:hover {
  color: var(--primary-color, #3b5bdb);
  border-color: rgba(59, 130, 246, 0.28);
}

.panel-collapse-btn svg {
  transition: transform 0.2s ease;
}

.panel-collapse-btn svg.rotated {
  transform: rotate(180deg);
}

.panel-title {
  font-size: 0.6875rem;
  color: var(--text-muted, #94a3b8);
  line-height: 1.2;
}

.panel-goal {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-dark, #0f172a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  min-height: 0;
}

/* 面板滑入动画 */
.panel-slide-enter-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.panel-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.panel-slide-enter-from {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
}
.panel-slide-enter-to {
  opacity: 1;
  transform: translateY(0);
  max-height: 60vh;
}
.panel-slide-leave-from {
  opacity: 1;
  max-height: 60vh;
}
.panel-slide-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
