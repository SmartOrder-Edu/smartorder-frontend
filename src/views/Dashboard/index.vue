<template>
  <AppLayout>
    <div class="dashboard-page">
    <!-- Agent 总学习伙伴问候 -->
    <section class="agent-hero glass">
      <div class="agent-hero-content">
        <div class="agent-hero-left">
          <div class="agent-hero-avatar">
            <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
              <path d="M483.002182 188.043636h51.2v114.036364H483.002182z" fill="#40e3c2"/>
              <path d="M510.929455 143.825455m-128 0a128 128 0 1 0 256 0 128 128 0 1 0-256 0Z" fill="#40e3c2"/>
              <path d="M475.83125977 148.45865723v5.05620769h37.07885744v11.79781821h-16.8540259v23.59563642h16.8540259v11.79781817h-16.8540259V207.44774823l8.42701331 28.65184483h8.42701259v10.1124154h-15.16862307l-5.05620773-20.22483152L485.94367591 246.21200846H469.08964929v-11.7978182h11.79781818L485.94367591 207.44774823v-8.42701259H469.08964929v-11.79781893h18.5394287V163.62728031h-15.1686231L465.71884437 156.88566981v-8.42701258h10.1124154z m82.58472817 3.37080486v82.58472817l-10.1124154 11.79781822H519.65172773V151.82946209h38.76426021z m-11.79781819 11.79781822h-16.85402591v70.78690995h16.85402591V163.62728031z" fill="#40e3c2"/>
              <path d="M679.098182 301.963636c139.636364 13.963636 223.418182 79.127273 253.672727 197.818182 46.545455 179.2 34.909091 267.636364 32.581818 283.927273-2.327273 18.618182-30.254545 123.345455-160.581818 174.545454-83.781818 32.581818-172.218182 55.854545-293.236364 53.527273v-535.272727 535.272727c-116.363636 2.327273-204.8-18.618182-286.254545-48.872727l-9.309091-4.654546c-130.327273-53.527273-158.254545-158.254545-160.581818-174.545454-4.654545-16.290909-13.963636-104.727273 30.254545-283.927273 30.254545-118.690909 114.036364-186.181818 251.345455-200.145454 37.236364-2.327273 93.090909-6.981818 172.218182-6.981819h9.309091c74.472727 0 128 4.654545 160.581818 9.309091z" fill="#C5C5C5"/>
              <path d="M139.170909 723.2c0 2.327273 0 2.327273 0 0 0 4.654545 2.327273 6.981818 2.327273 9.309091 4.654545 9.309091 9.309091 16.290909 16.290909 25.6 18.618182 23.272727 46.545455 44.218182 83.781818 58.181818l4.654546 2.327273 4.654545 2.327273c53.527273 18.618182 107.054545 30.254545 165.236364 37.236363 58.181818 4.654545 123.345455 4.654545 183.854545 0 58.181818-4.654545 111.709091-18.618182 165.236364-37.236363l4.654545-2.327273c41.890909-13.963636 69.818182-34.909091 88.436364-60.509091 6.981818-9.309091 11.636364-18.618182 16.290909-25.6 0-2.327273 2.327273-4.654545 2.327273-6.981818v-2.327273c0-2.327273 0-6.981818 2.327272-11.636364v-2.327272-39.563637c-2.327273-44.218182-13.963636-97.745455-32.581818-162.909091-18.618182-74.472727-72.145455-111.709091-174.545454-121.018181-53.527273-4.654545-93.090909-6.981818-148.945455-6.981819H502.225455c-58.181818 0-97.745455 2.327273-155.927273 6.981819-102.4 9.309091-153.6 46.545455-174.545455 118.690909-18.618182 65.163636-27.927273 118.690909-32.581818 162.909091 0 16.290909-2.327273 30.254545 0 39.563636v16.290909z" fill="#14254E"/>
              <path d="M509.207273 695.272727c-27.927273 0-55.854545 11.636364-55.854546 20.945455s11.636364 39.563636 55.854546 39.563636c41.890909 0 51.2-23.272727 55.854545-39.563636 0-13.963636-27.927273-20.945455-55.854545-20.945455z" fill="#40E3C2"/>
              <path d="M295.936 578.373818a72.145455 53.527273 90 1 0 107.054545 0 72.145455 53.527273 90 1 0-107.054545 0Z" fill="#40E3C2"/>
              <path d="M617.099636 578.373818a72.145455 53.527273 90 1 0 107.054546 0 72.145455 53.527273 90 1 0-107.054546 0Z" fill="#40E3C2"/>
            </svg>
          </div>
          <div class="agent-hero-text">
            <h1 class="agent-greeting">早上好，{{ userName }}</h1>
            <p class="agent-summary" v-if="spaceStore.spaceCount > 0">
              我已经检查了你正在进行的 <strong>{{ spaceStore.spaceCount }} 个学习空间</strong>。
              与 Agent 对话制定今日计划，开始高效学习。
            </p>
            <p class="agent-summary" v-else>
              你还没有进行中的学习空间，点击<strong>新建学习空间</strong>开始你的学习之旅。
            </p>
          </div>
        </div>
        <div class="agent-hero-right">
          <div class="hero-stats-row">
            <div class="hero-time-stat">
              <span class="time-big">2h 30m</span>
              <span class="time-label">今日可用时间</span>
            </div>
            <div class="hero-space-stat">
              <span class="space-count">{{ spaceStore.spaceCount }}</span>
              <span class="space-label">进行中的学习空间</span>
            </div>
          </div>
          <button class="start-today-btn" @click="enterTodayFirst(priorityTasks[0], 'dashboard_hero')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
            开始今日学习
          </button>
        </div>
      </div>
    </section>


    <!-- 画像未完成提醒横幅 -->
    <section
      v-if="!userStore.profileInitialized && showProfileReminder"
      class="profile-reminder-banner"
    >
      <div class="banner-content">
        <svg class="banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        <span class="banner-text">完善学习画像，让 AI 更懂你</span>
        <button class="banner-action" @click="$router.push('/onboarding')">去完善</button>
        <button class="banner-close" @click="showProfileReminder = false" title="关闭">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
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
          <button class="section-link" @click="$router.push('/tasks')">查看全部 →</button>
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
            <button class="task-go-btn" @click="doTask(task)">开始这次学习</button>
          </div>
        </div>

        <div class="start-all-bar">
          <button class="start-all-btn" @click="enterTodayFirst(priorityTasks[0], 'dashboard_hero')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
            开始今日任务
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
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useLearningSpaceStore } from '@/stores/learningSpace'
import { useStudyEntry } from '@/composables/useStudyEntry'
import AppLayout from '@/components/layout/AppLayout.vue'

const userStore = useUserStore()
const spaceStore = useLearningSpaceStore()
const { enterStudy, enterTodayFirst } = useStudyEntry()
const userName = ref(userStore.userName || '谢同学')
const showWhyDialog = ref(false)
const showProfileReminder = ref(true)

onMounted(() => {
  spaceStore.fetchSpaces('active')
})

const priorityTasks = ref([
  { id: 't1', spaceId: 's1', spaceName: '高等数学', spaceColor: '#3b82f6', title: '洛必达法则 10 道专项练习', typeName: '练习', minutes: 35, reason: '连续 3 次出错，正确率降至 40%，今日是最佳巩固窗口' },
  { id: 't2', spaceId: 's2', spaceName: '软件工程', spaceColor: '#f59e0b', title: '补齐用户故事与用例图', typeName: '项目', minutes: 45, reason: '已延期 1 天，阻塞后续原型设计' },
  { id: 't3', spaceId: 's3', spaceName: '英语四级', spaceColor: '#10b981', title: '听力精听 + 词汇复习 40 个', typeName: '复习', minutes: 20, reason: '听力持续偏弱，需保持每日训练节奏' }
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

const doTask = (task: any) => {
  enterStudy(task.id, { spaceId: task.spaceId, source: 'dashboard_priority' })
}
</script>

<style scoped lang="scss">
.dashboard-page {
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

/* 画像提醒横幅 */
.profile-reminder-banner {
  background: linear-gradient(135deg, rgba(18, 184, 134, 0.08) 0%, rgba(11, 183, 170, 0.08) 100%);
  border: 1px solid rgba(18, 184, 134, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md) var(--spacing-lg);
}

.banner-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.banner-icon {
  width: 22px;
  height: 22px;
  color: var(--primary-color);
  flex-shrink: 0;
}

.banner-text {
  flex: 1;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-dark);
}

.banner-action {
  padding: 6px var(--spacing-lg);
  font-size: 0.8125rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #12b886 0%, #38d9a9 100%);
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-base);
  white-space: nowrap;
}

.banner-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(18, 184, 134, 0.3);
}

.banner-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.banner-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-regular);
}

/* Agent 总学习伙伴问候 */
.agent-hero {
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, rgba(11, 183, 170, 0.04) 0%, rgba(139, 92, 246, 0.04) 100%);
  border: 1px solid rgba(11, 183, 170, 0.1);
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
  color: var(--text-primary);
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
  flex-direction: column;
  align-items: flex-end;
  gap: 14px;
  flex-shrink: 0;
}

.hero-stats-row {
  display: flex;
  gap: var(--spacing-2xl);
}

.start-today-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(11, 183, 170, 0.32);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 30px rgba(11, 183, 170, 0.42);
  }
  &:active { transform: translateY(0); }
}

.hero-time-stat, .hero-space-stat {
  text-align: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--panel-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.time-big, .space-count {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.time-label, .space-label {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

/* 双列 */
.two-column {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: var(--spacing-xl);
}

.section {
  background: var(--panel-bg);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  border: 1px solid var(--border-color);
  transition: background-color 0.2s ease, border-color 0.2s ease;
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
  color: var(--text-primary);
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

  &:hover { box-shadow: 0 2px 8px  var(--color-shadow); }
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
  color: var(--text-primary);
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
  background: var(--panel-bg);
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
  &:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11, 183, 170, 0.3); }
}

.why-btn {
  padding: 10px 20px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  background: var(--panel-bg);
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
  border-bottom: 1px solid var(--color-border);

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
  color: var(--text-primary);
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
  color: var(--text-primary);
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
    color: var(--text-primary);
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
