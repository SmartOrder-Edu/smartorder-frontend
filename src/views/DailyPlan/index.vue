<template>
  <AppLayout>
    <div class="daily-plan-page">
    <!-- 顶部 Agent 总结 -->
    <section class="agent-summary glass">
      <div class="agent-header">
        <div class="agent-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </div>
        <div class="agent-info">
          <span class="agent-title">总学习 Agent</span>
          <span class="agent-think">
            <span class="think-dot"></span>
            已检查你的 4 个学习空间
          </span>
        </div>
      </div>
      <div class="agent-message">
        <p class="agent-greeting">早上好，{{ userName }}。今天是 {{ todayStr }}，我已经为你整理好今日的跨空间学习计划。</p>
        <p class="agent-insight">
          今日建议优先处理<strong>高等数学</strong>的极限专项练习（你在这部分连续出错），
          其次是<strong>软件工程</strong>的需求分析文档（已延期 1 天）。
          <strong>操作系统</strong>和<strong>英语四级</strong>可以放后面，时间有余再做。
        </p>
      </div>
    </section>

    <!-- 时间分配卡片 -->
    <section class="time-allocation">
      <div class="section-header">
        <h3 class="section-title">今日建议时间分配</h3>
        <span class="section-badge">总计约 2 小时 20 分钟</span>
      </div>
      <div class="time-bars">
        <div class="time-bar-item" v-for="alloc in timeAllocations" :key="alloc.spaceId">
          <div class="time-bar-header">
            <span class="time-bar-space">{{ alloc.spaceName }}</span>
            <span class="time-bar-minutes">{{ alloc.minutes }} 分钟</span>
          </div>
          <div class="time-bar-track">
            <div
              class="time-bar-fill"
              :style="{ width: (alloc.minutes / 140) * 100 + '%', background: alloc.color }"
            ></div>
          </div>
          <span class="time-bar-reason">{{ alloc.reason }}</span>
        </div>
      </div>
    </section>

    <!-- 排序策略 -->
    <div class="strategy-bar">
      <div class="strategy-info">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
        </svg>
        <span>当前排序策略：<strong>{{ strategyLabel }}</strong></span>
      </div>
      <div class="strategy-actions">
        <button class="strategy-btn" :class="{ active: strategy === 'deadline_first' }" @click="strategy = 'deadline_first'">截止优先</button>
        <button class="strategy-btn" :class="{ active: strategy === 'weakness_first' }" @click="strategy = 'weakness_first'">薄弱优先</button>
        <button class="strategy-btn" :class="{ active: strategy === 'balanced' }" @click="strategy = 'balanced'">均衡分配</button>
      </div>
    </div>

    <!-- 跨空间任务列表 -->
    <section class="task-list-section">
      <div class="section-header">
        <h3 class="section-title">今日跨空间任务</h3>
        <div class="section-actions">
          <button class="action-btn primary" @click="startAllTasks">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
            开始今日总计划
          </button>
          <button class="action-btn" @click="showRedistributeDialog = true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            重新分配时间
          </button>
          <button class="action-btn" @click="showReasonDialog = true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            为什么这样安排
          </button>
        </div>
      </div>

      <div class="task-groups">
        <div
          class="task-group"
          v-for="group in groupedTasks"
          :key="group.spaceId"
        >
          <div class="task-group-header">
            <span class="space-dot" :style="{ background: group.color }"></span>
            <span class="space-name">{{ group.spaceName }}</span>
            <span class="task-count">{{ group.tasks.length }} 项任务</span>
          </div>
          <div class="task-cards">
            <div
              class="task-card"
              v-for="task in group.tasks"
              :key="task.id"
              :class="'priority-' + task.priority"
            >
              <div class="task-priority-bar" :class="task.priority"></div>
              <div class="task-body">
                <div class="task-top">
                  <span class="task-type-badge" :class="task.type">{{ typeLabel(task.type) }}</span>
                  <span class="task-time">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                      <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
                    </svg>
                    {{ task.estimatedMinutes }} 分钟
                  </span>
                </div>
                <h4 class="task-title">{{ task.title }}</h4>
                <p class="task-reason">{{ task.agentReason }}</p>
                <div class="task-footer">
                  <span class="task-status" :class="task.status">{{ statusLabel(task.status) }}</span>
                  <button class="task-start-btn" @click="startTask(task)">开始</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 重新分配时间 对话框 -->
    <el-dialog v-model="showRedistributeDialog" title="重新分配时间" width="460px" class="plan-dialog">
      <p class="dialog-desc">总 Agent 将根据你的最新状态重新规划今日任务时间。</p>
      <div class="dialog-inputs">
        <div class="dialog-field">
          <label>今日可用时间（分钟）</label>
          <el-input-number v-model="redistributeMinutes" :min="30" :max="600" :step="15" />
        </div>
        <div class="dialog-field">
          <label>优先策略</label>
          <el-select v-model="redistributeStrategy" style="width:100%">
            <el-option label="截止时间优先" value="deadline_first" />
            <el-option label="薄弱点优先" value="weakness_first" />
            <el-option label="均衡分配" value="balanced" />
          </el-select>
        </div>
      </div>
      <template #footer>
        <el-button @click="showRedistributeDialog = false">取消</el-button>
        <el-button type="primary" @click="doRedistribute">重新生成计划</el-button>
      </template>
    </el-dialog>

    <!-- 为什么这样安排 对话框 -->
    <el-dialog v-model="showReasonDialog" title="排序原因" width="520px" class="plan-dialog">
      <div class="reason-content">
        <div class="reason-item" v-for="r in rankingReasons" :key="r.spaceId">
          <h4>
            <span class="space-dot" :style="{ background: r.color }"></span>
            {{ r.spaceName }}
            <span class="priority-tag" :class="r.priorityLevel">{{ r.priorityLevel === 'high' ? '高优先' : r.priorityLevel === 'medium' ? '中优先' : '低优先' }}</span>
          </h4>
          <p>{{ r.reason }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'

const userName = ref('谢同学')
const todayStr = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

const strategy = ref<'deadline_first' | 'weakness_first' | 'balanced'>('deadline_first')
const showRedistributeDialog = ref(false)
const showReasonDialog = ref(false)
const redistributeMinutes = ref(140)
const redistributeStrategy = ref('deadline_first')

const strategyLabel = computed(() => {
  const map = { deadline_first: '截止时间优先', weakness_first: '薄弱点优先', balanced: '均衡分配' }
  return map[strategy.value]
})

const timeAllocations = computed(() => {
  const base = [
    { spaceId: 'math', spaceName: '高等数学', minutes: 35, color: '#3b82f6', reason: '薄弱点需集中攻克' },
    { spaceId: 'se', spaceName: '软件工程', minutes: 45, color: '#f59e0b', reason: '项目延期，优先补齐' },
    { spaceId: 'english', spaceName: '英语四级', minutes: 25, color: '#10b981', reason: '保持节奏，每日积累' },
    { spaceId: 'os', spaceName: '操作系统', minutes: 0, color: '#8b5cf6', reason: '昨日已完成重点复习，今日暂缓' }
  ]
  if (strategy.value === 'weakness_first') {
    return [base[0], base[1], base[3], base[2]] // 高数、软工优先
  }
  if (strategy.value === 'balanced') {
    return base.map(b => ({ ...b, minutes: b.spaceId === 'os' ? 15 : 30 }))
  }
  return base
})

interface PlanTask {
  id: string
  spaceId: string
  spaceName: string
  color: string
  title: string
  type: string
  priority: string
  estimatedMinutes: number
  agentReason: string
  status: string
}

const tasks = computed<PlanTask[]>(() => {
  const base: PlanTask[] = [
    { id: 't1', spaceId: 'math', spaceName: '高等数学', color: '#3b82f6', title: '极限专项练习', type: 'practice', priority: 'high', estimatedMinutes: 35, agentReason: '在洛必达法则适用条件上连续出错，需针对性练习', status: 'todo' },
    { id: 't2', spaceId: 'math', spaceName: '高等数学', color: '#3b82f6', title: '连续性与间断点复习', type: 'review', priority: 'medium', estimatedMinutes: 20, agentReason: '极限前置基础，巩固后可提升解题速度', status: 'todo' },
    { id: 't3', spaceId: 'se', spaceName: '软件工程', color: '#f59e0b', title: '补齐用户故事与用例图', type: 'project', priority: 'high', estimatedMinutes: 45, agentReason: '项目延期 1 天，需求分析阶段需尽快收尾', status: 'delayed' },
    { id: 't4', spaceId: 'english', spaceName: '英语四级', color: '#10b981', title: '核心词汇复习 40 个', type: 'review', priority: 'medium', estimatedMinutes: 15, agentReason: '保持每日词汇输入，避免遗忘曲线下降', status: 'todo' },
    { id: 't5', spaceId: 'english', spaceName: '英语四级', color: '#10b981', title: '听力精听练习', type: 'practice', priority: 'medium', estimatedMinutes: 20, agentReason: '听力偏弱，需每日 20 分钟精听', status: 'todo' },
    { id: 't6', spaceId: 'os', spaceName: '操作系统', color: '#8b5cf6', title: '同步互斥 PV 操作复习', type: 'review', priority: 'low', estimatedMinutes: 20, agentReason: '昨日已完成重点复习，今日可选做', status: 'todo' }
  ]
  if (strategy.value === 'weakness_first') {
    return base.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 }
      return order[a.priority as keyof typeof order] - order[b.priority as keyof typeof order]
    })
  }
  return base
})

const groupedTasks = computed(() => {
  const groups: Record<string, { spaceId: string; spaceName: string; color: string; tasks: PlanTask[] }> = {}
  for (const t of tasks.value) {
    if (!groups[t.spaceId]) {
      groups[t.spaceId] = { spaceId: t.spaceId, spaceName: t.spaceName, color: t.color, tasks: [] }
    }
    groups[t.spaceId].tasks.push(t)
  }
  return Object.values(groups)
})

const rankingReasons = computed(() => [
  { spaceId: 'math', spaceName: '高等数学', color: '#3b82f6', priorityLevel: 'high', reason: '你在"洛必达法则适用条件"上连续 3 次出错，正确率降至 40%。根据遗忘曲线和学习记录，今天是最佳巩固窗口。' },
  { spaceId: 'se', spaceName: '软件工程', color: '#f59e0b', priorityLevel: 'high', reason: '需求分析文档已延期 1 天，且后续原型设计依赖此文档完成。任务路径上存在阻塞。' },
  { spaceId: 'english', spaceName: '英语四级', color: '#10b981', priorityLevel: 'medium', reason: '词汇保持稳定但听力持续偏弱。每天保持一定输入对长期记忆效果最佳。' },
  { spaceId: 'os', spaceName: '操作系统', color: '#8b5cf6', priorityLevel: 'low', reason: '昨天已完成进程同步与 PV 操作的复习，今日可暂缓。距离截止还有 6 天。' }
])

const typeLabel = (type: string) => {
  const map: Record<string, string> = { practice: '练习', review: '复习', project: '项目', learn: '学习', test: '测试', resource: '资源' }
  return map[type] || type
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = { todo: '待开始', doing: '进行中', done: '已完成', delayed: '已延期' }
  return map[status] || status
}

const startTask = (task: PlanTask) => {
  ElMessage.success(`开始任务：${task.title}`)
}

const startAllTasks = () => {
  ElMessage.success('已为你打开今日学习流程，开始第一个任务！')
}

const doRedistribute = () => {
  showRedistributeDialog.value = false
  ElMessage.success('已根据最新设定重新分配今日任务时间')
}
</script>

<style scoped lang="scss">
.daily-plan-page {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* Agent 总结 */
.agent-summary {
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, rgba(59, 91, 219, 0.04) 0%, rgba(139, 92, 246, 0.04) 100%);
  border: 1px solid rgba(59, 91, 219, 0.1);
}

.agent-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.agent-avatar {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #3b5bdb, #5c7cfa);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  svg { width: 24px; height: 24px; }
}

.agent-info {
  display: flex;
  flex-direction: column;
}

.agent-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-dark);
}

.agent-think {
  font-size: 0.75rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}

.think-dot {
  width: 6px;
  height: 6px;
  background: var(--accent-color);
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

.agent-message {
  padding-left: 60px;
}

.agent-greeting {
  font-size: 0.9375rem;
  color: var(--text-regular);
  margin: 0 0 var(--spacing-sm);
  line-height: 1.7;
}

.agent-insight {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.7;
}

.agent-insight strong {
  color: var(--text-dark);
  font-weight: 600;
}

/* 时间分配 */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0;
}

.section-badge {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: var(--background-color-base);
  padding: 4px 12px;
  border-radius: var(--radius-full);
}

.time-bars {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.time-bar-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.time-bar-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
}

.time-bar-space {
  font-weight: 500;
  color: var(--text-dark);
}

.time-bar-minutes {
  color: var(--text-secondary);
}

.time-bar-track {
  height: 8px;
  background: var(--border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.time-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.6s ease;
}

.time-bar-reason {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

/* 策略栏 */
.strategy-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
}

.strategy-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.8125rem;
  color: var(--text-secondary);
  svg { color: var(--text-muted); flex-shrink: 0; }
  strong { color: var(--text-dark); }
}

.strategy-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.strategy-btn {
  padding: 4px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-light);
  background: white;
  font-size: 0.75rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.strategy-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.strategy-btn.active {
  background: rgba(59, 91, 219, 0.08);
  border-color: var(--primary-color);
  color: var(--primary-color);
  font-weight: 500;
}

/* 任务列表 */
.task-list-section {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  border: 1px solid var(--border-light);
}

.section-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  background: white;
  font-size: 0.8125rem;
  color: var(--text-regular);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover { border-color: var(--primary-color); color: var(--primary-color); background: rgba(59, 91, 219, 0.02); }

  &.primary {
    background: linear-gradient(135deg, #3b5bdb 0%, #5c7cfa 100%);
    border-color: transparent;
    color: white;
    &:hover { opacity: 0.9; transform: translateY(-1px); }
  }
}

.task-groups {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.task-group-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.space-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.space-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
}

.task-count {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.task-cards {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.task-card {
  display: flex;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  overflow: hidden;
  transition: all var(--transition-fast);

  &:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    transform: translateY(-1px);
  }

  .task-priority-bar {
    width: 4px;
    flex-shrink: 0;

    &.high { background: var(--danger-color); }
    &.medium { background: var(--warn-color); }
    &.low { background: var(--text-muted); }
  }
}

.task-body {
  flex: 1;
  padding: var(--spacing-md);
}

.task-top {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.task-type-badge {
  font-size: 0.6875rem;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: 500;

  &.practice { background: rgba(59, 130, 246, 0.08); color: #3b82f6; }
  &.review { background: rgba(139, 92, 246, 0.08); color: #8b5cf6; }
  &.project { background: rgba(245, 158, 11, 0.08); color: #f59e0b; }
  &.test { background: rgba(239, 68, 68, 0.08); color: #ef4444; }
  &.learn { background: rgba(16, 185, 129, 0.08); color: #10b981; }
}

.task-time {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin-left: auto;
}

.task-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0 0 4px;
}

.task-reason {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0 0 var(--spacing-sm);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-status {
  font-size: 0.6875rem;
  padding: 2px 8px;
  border-radius: var(--radius-full);

  &.todo { color: var(--text-muted); background: var(--background-color-base); }
  &.delayed { color: var(--danger-color); background: rgba(239, 68, 68, 0.06); }
  &.doing { color: var(--primary-color); background: rgba(59, 91, 219, 0.06); }
  &.done { color: var(--accent-color); background: rgba(16, 185, 129, 0.06); }
}

.task-start-btn {
  padding: 4px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--primary-color);
  background: white;
  color: var(--primary-color);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--primary-color);
    color: white;
  }
}

/* Dialog */
.plan-dialog {
  .dialog-desc {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0 0 var(--spacing-lg);
  }

  .dialog-inputs {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .dialog-field {
    label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-dark);
      margin-bottom: var(--spacing-xs);
    }
  }

  .reason-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .reason-item {
    h4 {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: 0.875rem;
      margin: 0 0 var(--spacing-xs);
      color: var(--text-dark);
    }
    p {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.6;
      padding-left: 22px;
    }
  }

  .priority-tag {
    font-size: 0.6875rem;
    padding: 1px 8px;
    border-radius: var(--radius-full);
    &.high { background: rgba(239, 68, 68, 0.08); color: #ef4444; }
    &.medium { background: rgba(245, 158, 11, 0.08); color: #f59e0b; }
    &.low { background: rgba(107, 114, 128, 0.08); color: #6b7280; }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
