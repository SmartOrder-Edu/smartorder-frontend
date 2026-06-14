<template>
  <AppLayout>
    <!-- Loading -->
    <div v-if="dashStore.loading && !dashStore.dashboard" class="loading-state">
      <div class="skeleton-hero">
        <div class="skeleton-block hero-skel"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="dashStore.error && !dashStore.dashboard" class="error-state">
      <el-empty description="学习空间不存在或加载失败" :image-size="120">
        <el-button type="primary" @click="$router.push('/dashboard')">返回仪表盘</el-button>
      </el-empty>
    </div>

    <!-- Main Content -->
    <div v-else-if="dashboard" class="learning-space-page">
      <!-- Space Header -->
      <section class="space-hero">
        <div class="hero-bg" :style="{ background: themeGradient }"></div>
        <div class="hero-content">
          <div class="hero-top">
            <button class="back-btn" @click="$router.push('/spaces')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
            </button>
            <div class="hero-info">
              <h1 class="hero-title">{{ dashboard.space.name }}</h1>
              <p class="hero-goal" v-if="dashboard.currentGoal">目标：{{ dashboard.currentGoal }}</p>
            </div>
            <div class="hero-badge" :class="dashboard.riskStatus">
              {{ riskLabel(dashboard.riskStatus) }}
            </div>
          </div>

          <!-- Stats Row -->
          <div class="stats-row">
            <SpaceStatCard
              :value="dashboard.progress"
              label="完成进度"
              emoji="📊"
              bg-color="#eff6ff"
              value-color="#3b82f6"
            />
            <SpaceStatCard
              :value="dashboard.streakDays"
              label="连续学习"
              suffix=" 天"
              emoji="🔥"
              bg-color="#fef3c7"
              value-color="#d97706"
            />
            <SpaceStatCard
              :value="dashboard.daysRemaining"
              label="剩余天数"
              suffix=" 天"
              emoji="📅"
              bg-color="#ecfdf5"
              value-color="#10b981"
            />
            <SpaceStatCard
              :value="riskLabel(dashboard.riskStatus)"
              label="风险状态"
              emoji="⚡"
              bg-color="rgba(139, 92, 246, 0.08)"
              value-color="#7c3aed"
            />
          </div>

          <!-- Agent Insight Banner -->
          <div class="agent-insight-banner" v-if="dashboard.agentInsight" @click="$refs.agentPanel?.open?.()">
            <div class="insight-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <span class="insight-text">{{ dashboard.agentInsight }}</span>
            <span class="insight-link">查看详情 →</span>
          </div>
        </div>
      </section>

      <!-- Main Content + Sidebar -->
      <div class="page-body">
        <div class="main-content">
          <!-- Tab Navigation -->
          <nav class="tab-nav">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="tab-btn"
              :class="{ active: activeTab === tab.id }"
              @click="activeTab = tab.id"
            >
              <span class="tab-icon" v-html="tab.icon"></span>
              {{ tab.label }}
              <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
            </button>
          </nav>

          <!-- Tab: Today -->
          <div v-show="activeTab === 'today'" class="tab-content">
            <div class="section-header">
              <h3>今日任务</h3>
              <span class="task-count">{{ dashboard.todayTasks.length }} 项</span>
            </div>

            <div class="task-list" v-if="dashboard.todayTasks.length">
              <TaskCard
                v-for="task in dashboard.todayTasks"
                :key="task.id"
                :task="task"
                @start="handleStartTask"
                @complete="handleCompleteTask"
              />
            </div>
            <el-empty v-else description="今日暂无任务" :image-size="80" />

            <!-- Overdue tasks -->
            <div v-if="dashboard.overdueTasks.length" class="section-header mt-32">
              <h3 class="text-danger">已逾期任务</h3>
              <span class="task-count danger">{{ dashboard.overdueTasks.length }} 项</span>
            </div>
            <div class="task-list" v-if="dashboard.overdueTasks.length">
              <TaskCard
                v-for="task in dashboard.overdueTasks"
                :key="task.id"
                :task="task"
                @start="handleStartTask"
                @complete="handleCompleteTask"
              />
            </div>

            <!-- Quick actions -->
            <div class="quick-actions-row">
              <el-button @click="showAddTask = true">手动添加任务</el-button>
              <el-button type="primary" plain @click="$router.push('/ai-tutor')">
                请 Agent 调整今日安排
              </el-button>
            </div>
          </div>

          <!-- Tab: Path -->
          <div v-show="activeTab === 'path'" class="tab-content">
            <div class="section-header">
              <h3>学习路径</h3>
              <span class="task-count">{{ dashboard.pathProgress.completedNodes }}/{{ dashboard.pathProgress.totalNodes }} 阶段</span>
            </div>
            <PathTimeline
              v-if="dashboard.pathNodes.length"
              :nodes="dashboard.pathNodes"
              :tasks="allTasks"
              :resources="dashboard.resources"
            />
            <el-empty v-else description="学习路径即将由 Agent 生成" :image-size="100" />
          </div>

          <!-- Tab: Resources -->
          <div v-show="activeTab === 'resources'" class="tab-content">
            <div class="section-header">
              <h3>学习资源</h3>
              <span class="task-count">{{ dashboard.resources.length }} 项</span>
            </div>

            <div class="resource-grid" v-if="dashboard.resources.length">
              <div
                v-for="r in dashboard.resources"
                :key="r.id"
                class="resource-card"
              >
                <div class="res-icon" :class="r.resourceType">
                  <span>{{ resourceIcon(r.resourceType) }}</span>
                </div>
                <div class="res-body">
                  <h4 class="res-title">{{ r.title }}</h4>
                  <p class="res-desc">{{ r.description }}</p>
                  <div class="res-meta">
                    <span class="res-type">{{ resourceTypeLabel(r.resourceType) }}</span>
                    <span class="res-source" :class="r.source">
                      {{ r.isAiGenerated ? 'AI生成' : r.source === 'curated' ? '精选' : '用户上传' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无资源，等待 Agent 生成" :image-size="100" />

            <!-- Assessment Summary -->
            <div class="section-header mt-32">
              <h3>测评摘要</h3>
            </div>
            <div class="assessment-summary">
              <div class="assess-stat">
                <span class="assess-value green">72%</span>
                <span class="assess-label">近期正确率</span>
              </div>
              <div class="assess-stat">
                <span class="assess-value blue">12</span>
                <span class="assess-label">已答题目</span>
              </div>
              <div class="assess-stat">
                <span class="assess-value purple">3</span>
                <span class="assess-label">薄弱知识点</span>
              </div>
            </div>
            <div class="weakness-list">
              <span class="weakness-tag" v-for="w in weaknesses" :key="w">{{ w }}</span>
            </div>
          </div>

          <!-- Tab: Records -->
          <div v-show="activeTab === 'records'" class="tab-content">
            <div class="section-header">
              <h3>学习记录</h3>
              <span class="task-count">近 7 天</span>
            </div>

            <div class="records-chart" v-if="dashboard.recentRecords.length">
              <div class="chart-bars">
                <div
                  v-for="rec in dashboard.recentRecords"
                  :key="rec.id"
                  class="chart-bar-col"
                >
                  <div class="bar-wrapper">
                    <div
                      class="bar-fill"
                      :style="{ height: (rec.studyDurationMinutes / maxDuration * 100) + '%' }"
                    ></div>
                  </div>
                  <span class="bar-label">{{ formatDateShort(rec.recordDate) }}</span>
                  <span class="bar-value">{{ rec.studyDurationMinutes }}m</span>
                </div>
              </div>
            </div>

            <div class="records-table" v-if="dashboard.recentRecords.length">
              <div
                v-for="rec in [...dashboard.recentRecords].reverse()"
                :key="rec.id"
                class="record-row"
              >
                <span class="record-date">{{ rec.recordDate }}</span>
                <span class="record-duration">{{ rec.studyDurationMinutes }}分钟</span>
                <span class="record-tasks">{{ rec.tasksCompleted }}/{{ rec.tasksPlanned }} 任务</span>
                <span class="record-focus">
                  <template v-for="i in 5" :key="i">
                    <span class="focus-dot" :class="{ filled: i <= rec.focusLevel }"></span>
                  </template>
                </span>
                <span class="record-reflection" v-if="rec.aiReflection">{{ rec.aiReflection }}</span>
              </div>
            </div>
            <el-empty v-else description="暂无学习记录" :image-size="80" />
          </div>
        </div>

        <!-- Agent Sidebar -->
        <SpaceAgentPanel
          ref="agentPanel"
          :space-name="dashboard.space.name"
          :insight="dashboard.agentInsight"
          :agent-actions="dashboard.recentAgentActions"
          @quick-action="handleAgentQuickAction"
          @send-message="handleAgentMessage"
        />
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import SpaceStatCard from '@/components/SpaceStatCard.vue'
import TaskCard from '@/components/TaskCard.vue'
import PathTimeline from '@/components/PathTimeline.vue'
import SpaceAgentPanel from '@/components/SpaceAgentPanel.vue'
import { useSpaceDashboardStore } from '@/stores/spaceDashboard'
import type { RiskStatus, TaskVO } from '@/types/learningSpace'

const route = useRoute()
const router = useRouter()
const dashStore = useSpaceDashboardStore()

const activeTab = ref('today')
const showAddTask = ref(false)

const spaceId = computed(() => Number(route.params.spaceId))
const dashboard = computed(() => dashStore.dashboard)

const tabs = [
  { id: 'today', label: '今日', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>', badge: dashboard.value?.todayTasks.length || 0 },
  { id: 'path', label: '路径', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>' },
  { id: 'resources', label: '资源与测评', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
  { id: 'records', label: '记录', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>' },
]

const weaknesses = ['洛必达法则适用条件', '无穷小阶数比较', '间断点分类']

const themeGradient = computed(() => 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)')

const maxDuration = computed(() => {
  if (!dashboard.value?.recentRecords.length) return 60
  return Math.max(...dashboard.value.recentRecords.map(r => r.studyDurationMinutes), 30)
})

// PathTimeline 需要的全集任务：合并今日 / 待办 / 逾期，按 id 去重
const allTasks = computed<TaskVO[]>(() => {
  const d = dashboard.value
  if (!d) return []
  const map = new Map<string, TaskVO>()
  ;[...(d.todayTasks || []), ...(d.pendingTasks || []), ...(d.overdueTasks || [])]
    .forEach(t => map.set(t.id, t))
  return [...map.values()]
})

function riskLabel(s: RiskStatus) {
  const m: Record<string, string> = { good: '良好', normal: '正常', warning: '注意', danger: '危险' }
  return m[s] || s
}

function resourceIcon(t: string) {
  const m: Record<string, string> = { doc: '📄', video: '🎬', mind_map: '🧠', quiz: '📝', case_study: '📋', flashcard_set: '🃏', image: '🖼', audio: '🎵', link: '🔗', ppt: '📊' }
  return m[t] || '📄'
}

function resourceTypeLabel(t: string) {
  const m: Record<string, string> = { doc: '文档', ppt: 'PPT', video: '视频', mind_map: '思维导图', quiz: '练习题', case_study: '案例', flashcard_set: '闪卡', image: '图片', audio: '音频', link: '链接' }
  return m[t] || t
}

function formatDateShort(date: string) {
  return date.slice(5)
}

async function handleStartTask(task: TaskVO) {
  try {
    await dashStore.startTask(task.id)
    ElMessage.success(`开始任务：${task.title}`)
    router.push(`/study/${task.id}`)
  } catch {
    ElMessage.error('开始任务失败')
  }
}

async function handleCompleteTask(task: TaskVO) {
  try {
    await ElMessageBox.prompt('请输入实际学习时长（分钟）', '完成任务', {
      confirmButtonText: '确认完成',
      inputType: 'number',
      inputValue: String(task.estimatedDurationMinutes || 20),
    })
    const minutes = Number((document.querySelector('.el-message-box__input input') as HTMLInputElement)?.value || task.estimatedDurationMinutes || 20)
    await dashStore.completeTask(task.id, minutes)
    ElMessage.success('任务完成！')
  } catch {
    // cancelled
  }
}

function handleAgentQuickAction(label: string) {
  // Navigate to AI Tutor with the question pre-filled, or open agent panel
  router.push({ path: '/ai-tutor', query: { message: label, spaceId: spaceId.value } })
}

function handleAgentMessage(text: string) {
  // The SpaceAgentPanel handles local echo; for real SSE, post to /agent/chat/stream
  console.log('Agent message:', text, 'spaceId:', spaceId.value)
}

function loadDashboard() {
  const id = spaceId.value
  if (id && !isNaN(id)) {
    dashStore.fetchDashboard(id)
  }
}

onMounted(loadDashboard)
watch(() => route.params.spaceId, () => {
  loadDashboard()
  activeTab.value = 'today'
})
</script>

<style scoped lang="scss">
.learning-space-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ========== Loading / Error ========== */
.loading-state, .error-state {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.skeleton-hero { min-height: 180px; border-radius: 16px; overflow: hidden; }
.skeleton-block {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  width: 100%;
  height: 100%;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ========== Hero ========== */
.space-hero {
  border-radius: 16px;
  overflow: hidden;
  position: relative;
}

.hero-bg {
  position: absolute;
  inset: 0;
  opacity: 0.05;
}

.hero-content {
  position: relative;
  padding: 24px 28px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid #f0f0f0;
  border-radius: 16px;
}

.hero-top {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.back-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  flex-shrink: 0;
  transition: all 0.15s;
  &:hover { background: #f9fafb; color: #3b82f6; }
}

.hero-info { flex: 1; }

.hero-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.hero-goal {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 2px 0 0;
}

.hero-badge {
  font-size: 0.75rem;
  padding: 4px 14px;
  border-radius: 99px;
  font-weight: 500;

  &.good { background: #ecfdf5; color: #10b981; }
  &.normal { background: #eff6ff; color: #3b82f6; }
  &.warning { background: #fef3c7; color: #d97706; }
  &.danger { background: #fef2f2; color: #ef4444; }
}

.stats-row {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.agent-insight-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: #d1d5db; }
}

.insight-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  flex-shrink: 0;
}

.insight-text {
  flex: 1;
  font-size: 0.8125rem;
  color: #374151;
  line-height: 1.5;
}

.insight-link {
  font-size: 0.75rem;
  color: #3b82f6;
  white-space: nowrap;
}

/* ========== Page Body ========== */
.page-body {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.main-content {
  flex: 1;
  min-width: 0;
}

/* ========== Tab Nav ========== */
.tab-nav {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: white;
  border-radius: 14px;
  border: 1px solid #f0f0f0;
  margin-bottom: 24px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 10px;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;

  .tab-icon { display: flex; align-items: center; }
  &:hover { color: #374151; background: #f9fafb; }

  &.active {
    color: #3b82f6;
    background: #eff6ff;
    font-weight: 600;
  }
}

.tab-badge {
  font-size: 0.6875rem;
  padding: 1px 6px;
  border-radius: 99px;
  background: #e5e7eb;
  color: #6b7280;
  .tab-btn.active & { background: #dbeafe; color: #3b82f6; }
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ========== Section ========== */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;

  h3 { font-size: 1rem; font-weight: 600; color: #1a1a2e; margin: 0; }
  .text-danger { color: #ef4444; }
}

.task-count {
  font-size: 0.8125rem;
  color: #9ca3af;
  margin: 0;

  &.danger { color: #ef4444; }
}

.mt-32 { margin-top: 32px; }

.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-actions-row {
  display: flex;
  gap: 10px;
  padding-top: 8px;
}

/* ========== Resource Grid ========== */
.resource-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.resource-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  background: white;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06); transform: translateY(-1px); }
}

.res-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 20px;

  &.doc, &.ppt { background: #eff6ff; } &.video { background: #fef2f2; }
  &.mind_map { background: #ede9fe; } &.quiz { background: #ecfdf5; }
  &.case_study { background: #fef3c7; } &.flashcard_set { background: #fce7f3; }
  &.image { background: #f0fdf4; } &.audio { background: #fff7ed; } &.link { background: #f3f4f6; }
}

.res-body { flex: 1; min-width: 0; }
.res-title { font-size: 0.875rem; font-weight: 600; color: #1a1a2e; margin: 0 0 2px; }
.res-desc { font-size: 0.75rem; color: #6b7280; margin: 0 0 6px; line-height: 1.4; }
.res-meta { display: flex; gap: 8px; }
.res-type { font-size: 0.6875rem; color: #9ca3af; }
.res-source {
  font-size: 0.6875rem;
  padding: 1px 6px; border-radius: 99px;
  &.ai { background: #ede9fe; color: #7c3aed; }
  &.curated { background: #f0fdf4; color: #16a34a; }
  &.user { background: #f3f4f6; color: #6b7280; }
}

/* ========== Assessment Summary ========== */
.assessment-summary {
  display: flex;
  gap: 24px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
}

.assess-stat { text-align: center; }
.assess-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  &.green { color: #10b981; } &.blue { color: #3b82f6; } &.purple { color: #7c3aed; }
}
.assess-label { font-size: 0.75rem; color: #9ca3af; }

.weakness-list { display: flex; gap: 8px; flex-wrap: wrap; }
.weakness-tag {
  font-size: 0.75rem;
  padding: 4px 12px;
  border-radius: 99px;
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
}

/* ========== Records ========== */
.records-chart { margin-bottom: 16px; }

.chart-bars {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  height: 120px;
  padding: 0 8px;
  justify-content: space-around;
}

.chart-bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.bar-wrapper {
  width: 100%;
  max-width: 40px;
  height: 100px;
  background: #f3f4f6;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(to top, #3b82f6, #60a5fa);
  border-radius: 8px 8px 0 0;
  min-height: 4px;
  transition: height 0.5s ease;
}

.bar-label {
  font-size: 0.625rem;
  color: #9ca3af;
}

.bar-value {
  font-size: 0.625rem;
  color: #6b7280;
  font-weight: 600;
}

.records-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 14px;
  background: white;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  font-size: 0.8125rem;
}

.record-date { color: #6b7280; font-weight: 500; min-width: 80px; }
.record-duration { color: #3b82f6; font-weight: 600; min-width: 64px; }
.record-tasks { color: #374151; }
.record-focus { display: flex; gap: 2px; }
.focus-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #e5e7eb;
  &.filled { background: #f59e0b; }
}
.record-reflection {
  color: #9ca3af;
  font-size: 0.75rem;
  flex: 1;
  text-align: right;
}
</style>
