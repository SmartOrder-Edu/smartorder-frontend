<template>
  <AppLayout>
    <div class="dashboard-page">
    <!-- Agent 总学习伙伴问候 -->
    <section class="agent-hero glass">
      <div class="agent-hero-content">
        <div class="agent-hero-left">
          <div class="agent-hero-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </div>
          <div class="agent-hero-text">
            <h1 class="agent-greeting">早上好，{{ userName }}</h1>
            <p class="agent-summary">
              我已经检查了你正在进行的 <strong>4 个学习空间</strong>。
              今天建议优先处理<strong>高等数学</strong>和<strong>软件工程</strong>，
              <strong>操作系统</strong>可以暂缓，因为距离截止还有 6 天且昨天已完成复习。
            </p>
          </div>
        </div>
        <div class="agent-hero-right">
          <div class="hero-time-stat">
            <span class="time-big">2h 30m</span>
            <span class="time-label">今日可用时间</span>
          </div>
          <div class="hero-space-stat">
            <span class="space-count">4</span>
            <span class="space-label">进行中的学习空间</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 学习空间卡片组 -->
    <section class="space-cards-section">
      <div class="section-header">
        <h2 class="section-title">我的学习空间</h2>
        <button class="add-space-btn" @click="$router.push('/ai-tutor')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新建学习空间
        </button>
      </div>

      <div class="space-cards-grid">
        <div
          v-for="space in learningSpaces"
          :key="space.id"
          class="space-card"
          :class="space.status"
          @click="$router.push(`/space/${space.id}`)"
        >
          <div class="space-card-top">
            <div class="space-card-header">
              <span class="space-card-icon">{{ space.icon }}</span>
              <div class="space-card-title-group">
                <h3 class="space-card-name">{{ space.name }}</h3>
                <span class="space-card-status" :class="space.status">{{ statusLabel(space.status) }}</span>
              </div>
            </div>
            <p class="space-card-goal">目标：{{ space.goal }}</p>

            <div class="space-card-progress">
              <div class="progress-header">
                <span>完成进度</span>
                <span class="progress-value">{{ space.progress }}%</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: space.progress + '%', background: space.color }"></div>
              </div>
            </div>
          </div>

          <div class="space-card-bottom">
            <div class="space-card-today">
              <span class="today-label">今日建议</span>
              <p class="today-suggestion">{{ space.todaySuggestion }}</p>
            </div>
            <div class="space-card-alert" v-if="space.alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {{ space.alert }}
            </div>
            <div class="space-card-actions">
              <button class="space-action-btn primary" @click.stop="$router.push(`/space/${space.id}`)">
                进入空间
              </button>
              <button class="space-action-btn" @click.stop="startSpaceToday(space)">
                开始今日任务
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 双列布局 -->
    <div class="two-column">
      <!-- 今日优先任务（跨空间） -->
      <section class="section today-priority">
        <div class="section-header">
          <h2 class="section-title">
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/>
            </svg>
            今日优先任务
          </h2>
          <button class="section-link" @click="$router.push('/daily-plan')">查看全部 →</button>
        </div>

        <div class="priority-task-list">
          <div
            v-for="(task, index) in priorityTasks"
            :key="task.id"
            class="priority-task-item"
          >
            <span class="task-rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</span>
            <div class="task-main">
              <div class="task-top-row">
                <span class="task-space-tag" :style="{ color: task.spaceColor, background: task.spaceColor + '15' }">
                  {{ task.spaceName }}
                </span>
                <span class="task-type-tag">{{ task.typeName }}</span>
                <span class="task-time">{{ task.minutes }}分钟</span>
              </div>
              <h4 class="task-title">{{ task.title }}</h4>
              <p class="task-reason">{{ task.reason }}</p>
            </div>
            <button class="task-go-btn" @click="doTask(task)">开始</button>
          </div>
        </div>

        <div class="start-all-bar">
          <button class="start-all-btn" @click="$router.push('/daily-plan')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
            开始今日总计划
          </button>
          <button class="why-btn" @click="showWhyDialog = true">为什么这样安排？</button>
        </div>
      </section>

      <!-- 时间分配 + Agent 状态 -->
      <div class="right-column">
        <!-- 时间分配 -->
        <section class="section time-section">
          <h2 class="section-title">
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
            </svg>
            今日时间分配
          </h2>
          <div class="time-chunks">
            <div class="time-chunk" v-for="ta in timeAllocations" :key="ta.spaceId">
              <div class="time-chunk-header">
                <span class="chunk-dot" :style="{ background: ta.color }"></span>
                <span class="chunk-name">{{ ta.spaceName }}</span>
                <span class="chunk-minutes">{{ ta.minutes }}分钟</span>
              </div>
              <p class="chunk-reason">{{ ta.reason }}</p>
            </div>
          </div>
        </section>

        <!-- Agent 工作状态 -->
        <section class="section agent-section">
          <h2 class="section-title">
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            多 Agent 工作状态
          </h2>
          <div class="mini-agents">
            <div class="mini-agent" v-for="agent in agents" :key="agent.id">
              <span class="mini-agent-dot" :class="agent.status"></span>
              <span class="mini-agent-name">{{ agent.name }}</span>
              <span class="mini-agent-msg">{{ agent.message }}</span>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- 为什么这样安排 对话框 -->
    <el-dialog v-model="showWhyDialog" title="今天为什么这样安排？" width="500px">
      <div class="why-content">
        <div class="why-item" v-for="r in rankingReasons" :key="r.spaceId">
          <h4>
            <span class="space-dot" :style="{ background: r.color }"></span>
            {{ r.spaceName }}
            <span class="priority-tag" :class="r.level">{{ r.levelLabel }}</span>
          </h4>
          <p>{{ r.reason }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import AppLayout from '@/components/layout/AppLayout.vue'

const userStore = useUserStore()
const userName = ref(userStore.userName || '谢同学')
const showWhyDialog = ref(false)

interface LearningSpace {
  id: string
  name: string
  icon: string
  goal: string
  progress: number
  status: 'normal' | 'warning' | 'danger' | 'good'
  color: string
  todaySuggestion: string
  alert: string
}

const learningSpaces = ref<LearningSpace[]>([
  {
    id: 'math', name: '高等数学', icon: '📐', goal: '三周内掌握极限与连续',
    progress: 42, status: 'warning', color: '#3b82f6',
    todaySuggestion: '完成 10 道极限专项练习题，重点攻克洛必达法则适用条件',
    alert: '你在"洛必达法则适用条件"上连续出错'
  },
  {
    id: 'english', name: '英语四级', icon: '📝', goal: '12月通过四级考试',
    progress: 61, status: 'normal', color: '#10b981',
    todaySuggestion: '20分钟听力精听 + 40个核心词汇复习',
    alert: ''
  },
  {
    id: 'se', name: '软件工程', icon: '💻', goal: '完成项目需求分析与原型设计',
    progress: 35, status: 'danger', color: '#f59e0b',
    todaySuggestion: '补齐用户故事与用例图，需求分析阶段收尾',
    alert: '项目任务已延期 1 天'
  },
  {
    id: 'os', name: '操作系统', icon: '⚙️', goal: '操作系统期末复习',
    progress: 70, status: 'good', color: '#8b5cf6',
    todaySuggestion: '选做 PV 操作题型回顾，今日可暂缓',
    alert: ''
  }
])

const priorityTasks = ref([
  { id: 't1', spaceName: '高等数学', spaceColor: '#3b82f6', title: '洛必达法则 10 道专项练习', typeName: '练习', minutes: 35, reason: '连续 3 次出错，正确率降至 40%，今日是最佳巩固窗口' },
  { id: 't2', spaceName: '软件工程', spaceColor: '#f59e0b', title: '补齐用户故事与用例图', typeName: '项目', minutes: 45, reason: '已延期 1 天，阻塞后续原型设计' },
  { id: 't3', spaceName: '英语四级', spaceColor: '#10b981', title: '听力精听 + 词汇复习 40 个', typeName: '复习', minutes: 20, reason: '听力持续偏弱，需保持每日训练节奏' }
])

const timeAllocations = ref([
  { spaceId: 'math', spaceName: '高等数学', color: '#3b82f6', minutes: 35, reason: '薄弱点需集中攻克' },
  { spaceId: 'se', spaceName: '软件工程', color: '#f59e0b', minutes: 45, reason: '项目延期优先补齐' },
  { spaceId: 'english', spaceName: '英语四级', color: '#10b981', minutes: 25, reason: '保持每日节奏' },
  { spaceId: 'os', spaceName: '操作系统', color: '#8b5cf6', minutes: 0, reason: '昨日已完成重点复习，今日暂缓' }
])

const agents = ref([
  { id: 'a1', name: '总学习 Agent', status: 'active', message: '已为你排序今日跨空间任务' },
  { id: 'a2', name: '高数 Agent', status: 'active', message: '监测到薄弱点，已生成专项练习' },
  { id: 'a3', name: '英语 Agent', status: 'idle', message: '词汇稳定，听力持续观察中' },
  { id: 'a4', name: '资源生成 Agent', status: 'running', message: '正在生成操作系统 PV 操作图解...' }
])

const rankingReasons = ref([
  { spaceId: 'math', spaceName: '高等数学', color: '#3b82f6', level: 'high', levelLabel: '高优先', reason: '在洛必达法则适用条件上连续 3 次出错，正确率降至 40%。根据遗忘曲线，今天是最佳巩固窗口。' },
  { spaceId: 'se', spaceName: '软件工程', color: '#f59e0b', level: 'high', levelLabel: '高优先', reason: '需求分析文档已延期 1 天。后续原型设计依赖此文档完成，路径上存在阻塞风险。' },
  { spaceId: 'english', spaceName: '英语四级', color: '#10b981', level: 'medium', levelLabel: '中优先', reason: '词汇保持稳定但听力持续偏弱。每日保持输入对长期记忆效果最佳。' },
  { spaceId: 'os', spaceName: '操作系统', color: '#8b5cf6', level: 'low', levelLabel: '低优先', reason: '昨日已完成进程同步与 PV 操作复习，距离截止还有 6 天，今日可暂缓。' }
])

const statusLabel = (s: string) => {
  const m: Record<string, string> = { normal: '正常', warning: '需关注', danger: '有风险', good: '良好' }
  return m[s] || s
}

const doTask = (task: any) => ElMessage.success(`开始任务：${task.title}`)
const startSpaceToday = (space: LearningSpace) => {
  ElMessage.success(`开始 ${space.name} 的今日任务`)
}
</script>

<style scoped lang="scss">
.dashboard-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

/* Agent 总学习伙伴问候 */
.agent-hero {
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, rgba(59, 91, 219, 0.04) 0%, rgba(139, 92, 246, 0.04) 100%);
  border: 1px solid rgba(59, 91, 219, 0.1);
}

.agent-hero-content {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2xl);
}

.agent-hero-left {
  flex: 1;
  display: flex;
  gap: var(--spacing-lg);
}

.agent-hero-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #3b5bdb, #5c7cfa);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  svg { width: 28px; height: 28px; }
}

.agent-greeting {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-sm);
}

.agent-summary {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.8;
  strong { color: var(--text-dark); font-weight: 600; }
}

.agent-hero-right {
  display: flex;
  gap: var(--spacing-2xl);
  flex-shrink: 0;
}

.hero-time-stat, .hero-space-stat {
  text-align: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
}

.time-big, .space-count {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-dark);
}

.time-label, .space-label {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

/* 学习空间卡片 */
.space-cards-section {
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

  .add-space-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px;
    border-radius: var(--radius-lg);
    border: 1px dashed var(--primary-color);
    background: transparent;
    color: var(--primary-color);
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all var(--transition-fast);
    &:hover { background: rgba(59, 91, 219, 0.04); }
  }
}

.space-cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
}

.space-card {
  background: white;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-light);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }

  &.warning { border-top: 3px solid var(--warn-color); }
  &.danger { border-top: 3px solid var(--danger-color); }
  &.good { border-top: 3px solid var(--accent-color); }
  &.normal { border-top: 3px solid var(--primary-color); }
}

.space-card-top {
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md);
}

.space-card-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.space-card-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.space-card-title-group {
  flex: 1;
  min-width: 0;
}

.space-card-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0;
}

.space-card-status {
  font-size: 0.625rem;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  font-weight: 500;

  &.normal { color: var(--primary-color); background: rgba(59, 91, 219, 0.06); }
  &.warning { color: var(--warn-color); background: rgba(245, 158, 11, 0.06); }
  &.danger { color: var(--danger-color); background: rgba(239, 68, 68, 0.06); }
  &.good { color: var(--accent-color); background: rgba(16, 185, 129, 0.06); }
}

.space-card-goal {
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin: 0 0 var(--spacing-md);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.space-card-progress {
  .progress-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.6875rem;
    color: var(--text-muted);
    margin-bottom: 4px;
  }
  .progress-value {
    font-weight: 600;
    color: var(--text-dark);
  }
  .progress-track {
    height: 6px;
    background: var(--border-light);
    border-radius: var(--radius-full);
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    border-radius: var(--radius-full);
    transition: width 0.6s ease;
  }
}

.space-card-bottom {
  padding: var(--spacing-md) var(--spacing-lg);
  background: rgba(0,0,0,0.01);
  border-top: 1px solid rgba(0,0,0,0.04);
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.today-label {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.today-suggestion {
  font-size: 0.75rem;
  color: var(--text-regular);
  margin: 2px 0 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.space-card-alert {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: 0.6875rem;
  color: var(--danger-color);
  padding: 6px 8px;
  background: rgba(239, 68, 68, 0.04);
  border-radius: var(--radius-sm);
  svg { flex-shrink: 0; margin-top: 1px; }
}

.space-card-actions {
  display: flex;
  gap: var(--spacing-xs);
  margin-top: auto;
  padding-top: var(--spacing-sm);
}

.space-action-btn {
  flex: 1;
  padding: 6px 0;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  background: white;
  font-size: 0.75rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover { border-color: var(--primary-color); color: var(--primary-color); }

  &.primary {
    background: linear-gradient(135deg, #3b5bdb, #5c7cfa);
    border-color: transparent;
    color: white;
    &:hover { opacity: 0.9; }
  }
}

/* 双列 */
.two-column {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: var(--spacing-xl);
}

.section {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  border: 1px solid var(--border-light);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0;
}

.section-icon { color: var(--text-muted); flex-shrink: 0; }

.section-link {
  font-size: 0.8125rem;
  color: var(--primary-color);
  cursor: pointer;
  border: none;
  background: none;
  text-decoration: none;
  &:hover { opacity: 0.8; }
}

/* 优先任务列表 */
.priority-task-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.priority-task-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  transition: all var(--transition-fast);

  &:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
}

.task-rank {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 700;
  flex-shrink: 0;

  &.rank-1 { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
  &.rank-2 { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
  &.rank-3 { background: rgba(107, 114, 128, 0.1); color: #6b7280; }
}

.task-main { flex: 1; min-width: 0; }

.task-top-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: 4px;
}

.task-space-tag {
  font-size: 0.6875rem;
  padding: 1px 8px;
  border-radius: var(--radius-full);
  font-weight: 500;
}

.task-type-tag {
  font-size: 0.625rem;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  background: var(--background-color-base);
  color: var(--text-muted);
}

.task-time {
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
  margin: 0;
  line-height: 1.4;
}

.task-go-btn {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--primary-color);
  background: white;
  color: var(--primary-color);
  font-size: 0.75rem;
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--transition-fast);
  &:hover { background: var(--primary-color); color: white; }
}

.start-all-bar {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-light);
}

.start-all-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 10px 24px;
  background: linear-gradient(135deg, #3b5bdb, #5c7cfa);
  border: none;
  border-radius: var(--radius-lg);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  &:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59, 91, 219, 0.3); }
}

.why-btn {
  padding: 10px 20px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  background: white;
  font-size: 0.875rem;
  color: var(--text-secondary);
  cursor: pointer;
  &:hover { border-color: var(--primary-color); color: var(--primary-color); }
}

/* 右侧列 */
.right-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.time-chunks {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.time-chunk {
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid rgba(0,0,0,0.04);

  &:last-child { border-bottom: none; padding-bottom: 0; }
}

.time-chunk-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: 4px;
}

.chunk-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.chunk-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-dark);
}

.chunk-minutes {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}

.chunk-reason {
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin: 0;
  padding-left: 20px;
}

/* Agent 迷你状态 */
.mini-agents {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.mini-agent {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
}

.mini-agent-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.active { background: var(--accent-color); }
  &.running { background: var(--primary-color); animation: pulse 1.5s ease-in-out infinite; }
  &.idle { background: var(--text-muted); }
}

.mini-agent-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-dark);
  white-space: nowrap;
}

.mini-agent-msg {
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin-left: auto;
  text-align: right;
}

/* Why Dialog */
.why-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.why-item {
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

.space-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.priority-tag {
  font-size: 0.6875rem;
  padding: 1px 8px;
  border-radius: var(--radius-full);
  &.high { background: rgba(239, 68, 68, 0.08); color: #ef4444; }
  &.medium { background: rgba(245, 158, 11, 0.08); color: #f59e0b; }
  &.low { background: rgba(107, 114, 128, 0.08); color: #6b7280; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
