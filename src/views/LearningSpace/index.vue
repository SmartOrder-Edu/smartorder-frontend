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
              <span class="hero-eyebrow">学习空间</span>
              <h1 class="hero-title">{{ dashboard.space.name }}</h1>
              <p class="hero-goal" v-if="dashboard.currentGoal">{{ dashboard.currentGoal }}</p>
            </div>
            <div class="hero-actions">
              <div class="hero-badge" :class="dashboard.riskStatus">
                <span class="hero-badge-dot"></span>
                {{ riskLabel(dashboard.riskStatus) }}
              </div>
              <button class="hero-primary-action" @click="handleContinueToday">
                <span>{{ nextTodayTask ? '继续今日学习' : '规划今日任务' }}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12,5 19,12 12,19"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="hero-dashboard">
            <div class="progress-panel">
              <div class="progress-ring" :style="heroProgressStyle">
                <div class="progress-ring-inner">
                  <strong>{{ Math.round(dashboard.progress) }}%</strong>
                  <span>总进度</span>
                </div>
              </div>
              <div class="progress-copy">
                <span class="progress-label">今日焦点</span>
                <strong>{{ nextTodayTask?.title || '等待 Agent 生成新的学习任务' }}</strong>
                <p v-if="nextTodayTask?.aiSuggestion">{{ nextTodayTask.aiSuggestion }}</p>
                <p v-else>保持节奏，按当前学习计划推进即可。</p>
              </div>
            </div>

            <!-- Stats Row -->
            <div class="stats-row">
              <SpaceStatCard
                :value="dashboard.progress"
                label="完成进度"
                :icon="BarChartIcon"
                bg-color="#e0f2fe"
                value-color="#0284c7"
              />
              <SpaceStatCard
                :value="dashboard.streakDays"
                label="连续学习"
                suffix=" 天"
                :icon="FlameIcon"
                bg-color="#fff7ed"
                value-color="#ea580c"
              />
              <SpaceStatCard
                :value="dashboard.daysRemaining"
                label="剩余天数"
                suffix=" 天"
                :icon="CalendarIcon"
                bg-color="#ecfdf5"
                value-color="#059669"
              />
              <SpaceStatCard
                :value="riskLabel(dashboard.riskStatus)"
                label="风险状态"
                :icon="ZapIcon"
                bg-color="#f5f3ff"
                value-color="#7c3aed"
              />
            </div>
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
            <span class="insight-link">查看建议 →</span>
          </div>

          <!-- 继续学习 hero 区块：本空间主入口 -->
          <div class="continue-study-block">
            <div class="csb-head">
              <span class="csb-eyebrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
                继续本空间学习
              </span>
              <span class="csb-time" v-if="nextTodayTask?.estimatedDurationMinutes">
                预计 {{ nextTodayTask.estimatedDurationMinutes }} 分钟
              </span>
            </div>
            <h2 class="csb-title">
              {{ nextTodayTask ? `继续学习：${nextTodayTask.title}` : '今日 Agent 暂未排定具体任务' }}
            </h2>
            <p class="csb-judge" v-if="dashboard.agentInsight">
              Agent 判断：{{ dashboard.agentInsight }}
            </p>
            <p class="csb-judge" v-else-if="nextTodayTask?.aiSuggestion">
              Agent 判断：{{ nextTodayTask.aiSuggestion }}
            </p>
            <div class="csb-actions">
              <button class="csb-btn primary" :disabled="!nextTodayTask" @click="handleStartFromHero">
                开始学习
              </button>
              <button class="csb-btn" @click="handleAdjustDuration">调整时长</button>
              <button class="csb-btn" @click="handleSimplerExplain">换个更基础的讲解</button>
              <button class="csb-btn" @click="handleAssessFirst">先测一下</button>
            </div>
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

          <!-- Tab: Agent Plan -->
          <div v-show="activeTab === 'plan'" class="tab-content">
            <div class="section-header">
              <h3>学习计划</h3>
              <span class="task-count" v-if="planDraft">{{ planDraft.phases?.length || 0 }} 个阶段</span>
            </div>

            <div v-if="planLoading" class="plan-loading">
              <div class="plan-skeleton"></div>
              <div class="plan-skeleton short"></div>
            </div>

            <template v-else-if="planDraft">
              <div class="plan-overview">
                <div class="plan-overview-main">
                  <span class="plan-eyebrow">已确认学习计划</span>
                  <h4>{{ planDraft.spaceName }}</h4>
                  <p>{{ planDraft.description }}</p>
                  <div class="plan-next-step" v-if="planNextStep">
                    <span>下一步</span>
                    <strong>{{ planNextStep }}</strong>
                  </div>
                </div>
                <div class="plan-overview-stats">
                  <div class="plan-stat">
                    <strong>{{ planTotalWeeks }}</strong>
                    <span>计划周数</span>
                  </div>
                  <div class="plan-stat">
                    <strong>{{ dashboard.pathProgress.completedNodes }}/{{ dashboard.pathProgress.totalNodes }}</strong>
                    <span>路径进度</span>
                  </div>
                  <div class="plan-stat">
                    <strong>{{ Math.round(dashboard.progress) }}%</strong>
                    <span>完成度</span>
                  </div>
                </div>
              </div>

              <div class="plan-meta-row">
                <span v-if="planDraft.startDate">开始：{{ planDraft.startDate }}</span>
                <span v-if="planDraft.targetEndDate">目标完成：{{ planDraft.targetEndDate }}</span>
                <span>{{ planKnowledgePointCount }} 个知识点</span>
                <span>{{ planResourceCount }} 个资源</span>
                <span :class="['plan-risk-pill', dashboard.riskStatus]">状态：{{ riskLabel(dashboard.riskStatus) }}</span>
              </div>

              <div class="plan-goals" v-if="planDraft.goals?.length">
                <span class="children-label">学习目标</span>
                <span v-for="goal in planDraft.goals" :key="goal" class="goal-chip">{{ goal }}</span>
              </div>

              <div class="plan-phase-list">
                <div
                  v-for="phase in planDraft.phases"
                  :key="phase.phaseIndex || phase.phaseName"
                  class="plan-phase-card"
                  :class="{ active: isActivePlanPhase(phase), collapsed: !isPhaseExpanded(phase) }"
                >
                  <button class="plan-phase-head" type="button" @click="togglePhase(phase)">
                    <div class="phase-head-main">
                      <span class="phase-index">
                        <span class="phase-number">{{ phase.phaseIndex || '-' }}</span>
                        <span>阶段</span>
                        <em v-if="isActivePlanPhase(phase)">当前关注</em>
                      </span>
                      <h4>{{ phase.phaseName || `第 ${phase.phaseIndex} 阶段` }}</h4>
                      <p>{{ phaseSummary(phase) }}</p>
                    </div>
                    <div class="phase-head-meta">
                      <span class="phase-duration">{{ phase.weeks || 0 }} 周</span>
                      <span>{{ phase.knowledgePoints?.length || 0 }} 知识点</span>
                      <span>{{ phase.resources?.length || 0 }} 资源</span>
                      <svg
                        class="phase-toggle-icon"
                        :class="{ open: isPhaseExpanded(phase) }"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        width="16"
                        height="16"
                      >
                        <polyline points="6,9 12,15 18,9"/>
                      </svg>
                    </div>
                  </button>

                  <div v-show="isPhaseExpanded(phase)" class="phase-detail">
                    <div class="phase-section" v-if="phase.knowledgePoints?.length">
                      <span class="children-label">本阶段重点</span>
                      <div class="phase-kp-list">
                        <div v-for="(kp, index) in phase.knowledgePoints" :key="kp" class="phase-kp-item">
                          <span class="kp-order">{{ index + 1 }}</span>
                          <div class="kp-body">
                            <div class="kp-title-row">
                              <strong>{{ kp }}</strong>
                              <span v-if="knowledgeImportanceLabel(kp)" class="kp-importance">
                                {{ knowledgeImportanceLabel(kp) }}
                              </span>
                            </div>
                            <p v-if="knowledgeDescription(kp)">{{ knowledgeDescription(kp) }}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="phase-section" v-if="phase.resources?.length">
                      <span class="children-label">配套资源</span>
                      <div class="phase-resource-groups">
                        <div
                          v-for="group in phaseResourceGroups(phase)"
                          :key="group.type"
                          class="phase-resource-group"
                        >
                          <div class="resource-group-head">
                            <span>{{ resourceIcon(group.type) }}</span>
                            <strong>{{ resourceTypeLabel(group.type) }}</strong>
                            <em>{{ group.items.length }} 项</em>
                          </div>
                          <div class="phase-resources">
                            <div
                              v-for="resource in group.items"
                              :key="resource.resourceType + resource.title"
                              class="phase-resource"
                            >
                              <strong>{{ resource.title }}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <el-empty v-else description="暂无 Agent 学习计划记录" :image-size="100">
              <el-button type="primary" plain @click="$router.push({ path: '/ai-tutor', query: { action: 'create_space' } })">
                与 Agent 重新规划
              </el-button>
            </el-empty>
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
import { BarChartIcon, FlameIcon, CalendarIcon, ZapIcon } from '@/assets/icons'
import TaskCard from '@/components/TaskCard.vue'
import PathTimeline from '@/components/PathTimeline.vue'
import SpaceAgentPanel from '@/components/SpaceAgentPanel.vue'
import { useSpaceDashboardStore } from '@/stores/spaceDashboard'
import { useStudyEntry } from '@/composables/useStudyEntry'
import { agentApi } from '@/api/agent'
import type { RiskStatus, TaskVO } from '@/types/learningSpace'
import type { LearningPlanDraft, PhaseInfo, ResourceInfo, KnowledgeNode } from '@/types/planExecute'

const route = useRoute()
const router = useRouter()
const dashStore = useSpaceDashboardStore()
const { enterStudy } = useStudyEntry()

const activeTab = ref('today')
const showAddTask = ref(false)
const planDraft = ref<LearningPlanDraft | null>(null)
const planLoading = ref(false)
const expandedPhaseKeys = ref<string[]>([])

const spaceId = computed(() => String(route.params.spaceId || ''))
const dashboard = computed(() => dashStore.dashboard)

const tabs = computed(() => [
  { id: 'today', label: '今日', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>', badge: dashboard.value?.todayTasks.length || 0 },
  { id: 'plan', label: '计划', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>', badge: planDraft.value?.phases?.length || 0 },
  { id: 'path', label: '路径', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>', badge: dashboard.value?.pathProgress?.totalNodes || 0 },
  { id: 'resources', label: '资源与测评', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>', badge: dashboard.value?.resources.length || 0 },
  { id: 'records', label: '记录', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>', badge: dashboard.value?.recentRecords.length || 0 },
])

const weaknesses = ['洛必达法则适用条件', '无穷小阶数比较', '间断点分类']

const themeGradient = computed(() => 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)')

const maxDuration = computed(() => {
  if (!dashboard.value?.recentRecords.length) return 60
  return Math.max(...dashboard.value.recentRecords.map(r => r.studyDurationMinutes), 30)
})

const nextTodayTask = computed(() => {
  const tasks = dashboard.value?.todayTasks || []
  return tasks.find(t => t.status === 'in_progress') || tasks.find(t => t.status === 'pending') || tasks[0]
})

const heroProgressStyle = computed(() => {
  const progress = Math.min(Math.max(Number(dashboard.value?.progress || 0), 0), 100)
  return {
    background: `conic-gradient(#0bb7aa ${progress * 3.6}deg, rgba(226, 232, 240, 0.75) 0deg)`,
  }
})

const planTotalWeeks = computed(() =>
  (planDraft.value?.phases || []).reduce((sum, phase) => sum + (Number(phase.weeks) || 0), 0)
)

const planKnowledgePointCount = computed(() =>
  (planDraft.value?.phases || []).reduce((sum, phase) => sum + (phase.knowledgePoints?.length || 0), 0)
)

const planResourceCount = computed(() =>
  (planDraft.value?.phases || []).reduce((sum, phase) => sum + (phase.resources?.length || 0), 0)
)

const knowledgeNodeMap = computed(() => {
  const map = new Map<string, KnowledgeNode>()
  ;(planDraft.value?.knowledgeGraph?.nodes || []).forEach(node => {
    if (node.name) map.set(normalizeText(node.name), node)
  })
  return map
})

const currentPlanPhaseKey = computed(() => {
  const phases = planDraft.value?.phases || []
  if (!phases.length) return ''

  const runtimePhase = findPhaseByRuntimeContext(phases)
  if (runtimePhase) return phaseKey(runtimePhase)

  const rawProgress = dashboard.value?.pathProgress?.percent ?? dashboard.value?.progress ?? 0
  const progress = Math.min(Math.max(Number(rawProgress) || 0, 0), 100)
  const index = Math.min(phases.length - 1, Math.floor((progress / 100) * phases.length))
  return phaseKey(phases[index])
})

const activePlanPhase = computed(() => {
  const key = currentPlanPhaseKey.value
  return (planDraft.value?.phases || []).find(phase => phaseKey(phase) === key) || null
})

const planNextStep = computed(() => {
  if (nextTodayTask.value?.title) return nextTodayTask.value.title
  const phase = activePlanPhase.value
  const firstKnowledgePoint = phase?.knowledgePoints?.[0]
  if (firstKnowledgePoint) return `进入「${firstKnowledgePoint}」`
  return ''
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

function normalizeText(text: string | null | undefined) {
  return String(text || '').trim().toLowerCase()
}

function phaseKey(phase: PhaseInfo) {
  return `${phase.phaseIndex || 'x'}-${phase.phaseName || ''}`
}

function isPhaseExpanded(phase: PhaseInfo) {
  return expandedPhaseKeys.value.includes(phaseKey(phase))
}

function togglePhase(phase: PhaseInfo) {
  const key = phaseKey(phase)
  expandedPhaseKeys.value = isPhaseExpanded(phase)
    ? expandedPhaseKeys.value.filter(item => item !== key)
    : [...expandedPhaseKeys.value, key]
}

function isActivePlanPhase(phase: PhaseInfo) {
  return phaseKey(phase) === currentPlanPhaseKey.value
}

function phaseSummary(phase: PhaseInfo) {
  const points = phase.knowledgePoints || []
  if (!points.length) return '暂无明确知识点，等待 Agent 补全阶段内容'
  return points.slice(0, 3).join(' / ') + (points.length > 3 ? ` 等 ${points.length} 个重点` : '')
}

function phaseResourceGroups(phase: PhaseInfo) {
  const groups = new Map<string, ResourceInfo[]>()
  ;(phase.resources || []).forEach(resource => {
    const type = resource.resourceType || 'doc'
    const list = groups.get(type) || []
    list.push(resource)
    groups.set(type, list)
  })
  return [...groups.entries()].map(([type, items]) => ({ type, items }))
}

function knowledgeNodeByName(name: string) {
  return knowledgeNodeMap.value.get(normalizeText(name))
}

function knowledgeDescription(name: string) {
  return knowledgeNodeByName(name)?.description || ''
}

function knowledgeImportanceLabel(name: string) {
  const importance = Number(knowledgeNodeByName(name)?.importance || 0)
  if (!importance) return ''
  if (importance >= 4) return '重点'
  if (importance >= 3) return '常规'
  return '了解'
}

function findPhaseByRuntimeContext(phases: PhaseInfo[]) {
  const d = dashboard.value
  if (!d) return null

  const candidateNodeIds = [nextTodayTask.value?.pathNodeId, d.pathProgress?.currentNodeId]
    .filter((id): id is string => Boolean(id))
  for (const nodeId of candidateNodeIds) {
    const node = d.pathNodes.find(item => item.id === nodeId)
    const matched = node ? findPhaseByText(phases, node.title) : null
    if (matched) return matched
  }

  if (nextTodayTask.value?.title) {
    return findPhaseByText(phases, nextTodayTask.value.title)
  }

  return null
}

function findPhaseByText(phases: PhaseInfo[], text: string | null | undefined) {
  const normalized = normalizeText(text)
  if (!normalized) return null

  return phases.find(phase => {
    const phaseName = normalizeText(phase.phaseName)
    const points = (phase.knowledgePoints || []).map(normalizeText).filter(Boolean)
    return (!!phaseName && phaseName === normalized)
      || (!!phaseName && phaseName.includes(normalized))
      || (!!phaseName && normalized.includes(phaseName))
      || points.some(point => point === normalized || point.includes(normalized) || normalized.includes(point))
  }) || null
}

function formatDateShort(date: string) {
  return date.slice(5)
}

async function handleStartTask(task: TaskVO) {
  try {
    await dashStore.startTask(task.id)
    enterStudy(task.id, { spaceId: spaceId.value, source: 'space_task' })
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

function handleContinueToday() {
  const task = nextTodayTask.value
  if (!task) {
    router.push({ path: '/ai-tutor', query: { action: 'adjust_today', spaceId: spaceId.value } })
    return
  }
  if (task.status === 'pending') {
    dashStore.startTask(task.id).finally(() => {
      enterStudy(task.id, { spaceId: spaceId.value, source: 'space_hero' })
    })
    return
  }
  enterStudy(task.id, { spaceId: spaceId.value, source: 'space_hero' })
}

/** 继续学习 hero 区块的"开始学习"主按钮 */
function handleStartFromHero() {
  const task = nextTodayTask.value
  if (!task) {
    ElMessage.info('今日 Agent 暂未排定具体任务，已为你打开 AI 总学习伙伴。')
    router.push({ path: '/ai-tutor', query: { action: 'adjust_today', spaceId: spaceId.value } })
    return
  }
  if (task.status === 'pending') {
    dashStore.startTask(task.id).catch(() => {})
  }
  enterStudy(task.id, { spaceId: spaceId.value, source: 'space_hero' })
}

function handleAdjustDuration() {
  ElMessage.info('Agent 已记录你的时长偏好，下次会话将据此调整（mock）。')
}

function handleSimplerExplain() {
  const task = nextTodayTask.value
  if (!task) {
    ElMessage.info('暂无可调整的学习会话。')
    return
  }
  enterStudy(task.id, { spaceId: spaceId.value, source: 'space_hero', mode: 'learn' })
  ElMessage.success('已为你切换到更基础的讲解节奏。')
}

function handleAssessFirst() {
  const task = nextTodayTask.value
  if (!task) {
    ElMessage.info('暂无可测评的学习会话。')
    return
  }
  enterStudy(task.id, { spaceId: spaceId.value, source: 'space_hero', mode: 'assessment' })
}

function handleAgentQuickAction(label: string) {
  // Navigate to AI Tutor with the question pre-filled, or open agent panel
  router.push({ path: '/ai-tutor', query: { message: label, spaceId: spaceId.value } })
}

function handleAgentMessage(text: string) {
  // The SpaceAgentPanel handles local echo; for real SSE, post to /agent/chat/stream
  console.log('Agent message:', text, 'spaceId:', spaceId.value)
}

async function loadLearningPlan(id: string) {
  planLoading.value = true
  planDraft.value = null
  expandedPhaseKeys.value = []
  try {
    planDraft.value = await agentApi.getLearningPlanBySpace(id)
    const phases = planDraft.value?.phases || []
    if (phases.length) {
      const runtimePhase = findPhaseByRuntimeContext(phases) || phases[0]
      expandedPhaseKeys.value = [phaseKey(runtimePhase)]
    }
  } catch (e) {
    console.warn('Failed to load learning plan draft:', e)
    planDraft.value = null
  } finally {
    planLoading.value = false
  }
}

function loadDashboard() {
  const id = spaceId.value
  if (id) {
    dashStore.fetchDashboard(id)
    loadLearningPlan(id)
  }
}

onMounted(loadDashboard)
watch(() => route.params.spaceId, () => {
  loadDashboard()
  activeTab.value = 'today'
})
watch(currentPlanPhaseKey, key => {
  if (key && !expandedPhaseKeys.value.includes(key)) {
    expandedPhaseKeys.value = [key, ...expandedPhaseKeys.value]
  }
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

/* ========== Agent Plan ========== */
.plan-loading {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-skeleton {
  height: 120px;
  border-radius: 12px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;

  &.short { height: 64px; }
}

.plan-overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  align-items: stretch;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: white;
}

.plan-overview-main {
  flex: 1;
  min-width: 0;

  h4 {
    margin: 4px 0 6px;
    font-size: 1.0625rem;
    color: #1a1a2e;
  }

  p {
    margin: 0;
    color: #6b7280;
    font-size: 0.8125rem;
    line-height: 1.6;
  }
}

.plan-eyebrow {
  font-size: 0.6875rem;
  color: #3b82f6;
  font-weight: 600;
}

.plan-next-step {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  max-width: 680px;
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.18);

  span {
    color: #0a9e94;
    font-size: 0.75rem;
    font-weight: 700;
  }

  strong {
    min-width: 0;
    color: #334155;
    font-size: 0.8125rem;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.plan-overview-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(86px, 1fr));
  gap: 12px;
}

.plan-stat {
  min-width: 86px;
  padding: 12px;
  border-radius: 10px;
  background: #f9fafb;
  text-align: center;

  strong {
    display: block;
    color: #1a1a2e;
    font-size: 1.125rem;
    line-height: 1.2;
  }

  span {
    color: #9ca3af;
    font-size: 0.6875rem;
    font-weight: 600;
    white-space: nowrap;
  }
}

.plan-meta-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  span {
    padding: 4px 10px;
    border-radius: 999px;
    background: #f3f4f6;
    color: #6b7280;
    font-size: 0.75rem;
  }
}

.plan-risk-pill {
  &.good,
  &.normal {
    background: #ecfdf5;
    color: #047857;
  }

  &.warning {
    background: #fffbeb;
    color: #b45309;
  }

  &.danger {
    background: #fef2f2;
    color: #b91c1c;
  }
}

.children-label {
  display: block;
  margin-bottom: 8px;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 600;
}

.plan-goals {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 14px 16px;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  background: white;

  .children-label {
    margin: 0 4px 0 0;
  }
}

.goal-chip,
.kp-chip {
  padding: 4px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 500;
}

.plan-phase-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-phase-card {
  position: relative;
  overflow: hidden;
  padding: 0;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  background: white;

  &.active {
    border-color: rgba(11, 183, 170, 0.32);
    box-shadow: 0 10px 28px rgba(11, 183, 170, 0.08);
  }

  &.active::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: #0bb7aa;
  }
}

.plan-phase-head {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  padding: 16px 18px;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;

  h4 {
    margin: 3px 0 0;
    font-size: 0.9375rem;
    color: #1a1a2e;
    line-height: 1.45;
  }

  p {
    margin: 5px 0 0;
    color: #64748b;
    font-size: 0.75rem;
    line-height: 1.45;
  }

  &:hover {
    background: #f8fafc;
  }
}

.phase-head-main {
  min-width: 0;
}

.phase-index {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;

  em {
    margin-left: 2px;
    padding: 3px 8px;
    border-radius: 999px;
    background: #ecfdfb;
    color: #0a9e94;
    font-style: normal;
    font-size: 0.625rem;
  }
}

.phase-number {
  min-width: 24px;
  height: 24px;
  padding: 0 7px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ecfdfb;
  color: #0a9e94;
  font-size: 0.75rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  box-shadow: inset 0 0 0 1px rgba(11, 183, 170, 0.12);
}

.plan-phase-card.active .phase-number {
  background: #0bb7aa;
  color: #ffffff;
  box-shadow: 0 0 0 4px rgba(11, 183, 170, 0.12);
}

.phase-head-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 0.75rem;
  white-space: nowrap;

  > span:not(.phase-duration) {
    padding: 3px 8px;
    border-radius: 999px;
    background: #f8fafc;
  }
}

.phase-duration {
  padding: 3px 10px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #059669;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.phase-toggle-icon {
  flex-shrink: 0;
  color: #94a3b8;
  transition: transform 0.18s ease;

  &.open {
    transform: rotate(180deg);
  }
}

.phase-detail {
  padding: 0 18px 18px;
}

.phase-section + .phase-section {
  margin-top: 16px;
}

.phase-kp-list {
  display: grid;
  gap: 8px;
}

.phase-kp-item {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr);
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.kp-order {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 700;
}

.kp-body {
  min-width: 0;

  p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 0.75rem;
    line-height: 1.5;
  }
}

.kp-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  strong {
    color: #1f2937;
    font-size: 0.8125rem;
    line-height: 1.4;
  }
}

.kp-importance {
  flex-shrink: 0;
  padding: 2px 7px;
  border-radius: 999px;
  background: #fff7ed;
  color: #c2410c;
  font-size: 0.625rem;
  font-weight: 700;
}

.phase-resource-groups {
  display: grid;
  gap: 10px;
}

.phase-resource-group {
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: #ffffff;
  overflow: hidden;
}

.resource-group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f8fafc;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);

  strong {
    color: #334155;
    font-size: 0.8125rem;
  }

  em {
    margin-left: auto;
    color: #94a3b8;
    font-size: 0.6875rem;
    font-style: normal;
  }
}

.phase-resources {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
}

.phase-resource {
  padding: 10px 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.08);

  &:nth-child(1),
  &:nth-child(2) {
    border-top: 0;
  }

  &:nth-child(odd) {
    border-right: 1px solid rgba(148, 163, 184, 0.08);
  }

  strong {
    display: block;
    color: #374151;
    font-size: 0.8125rem;
    line-height: 1.4;
    word-break: break-word;
  }
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

/* ========== Refined Learning Space Experience ========== */
.learning-space-page {
  max-width: 1480px;
  gap: 24px;
  padding-bottom: 24px;
}

.space-hero {
  border-radius: 22px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
}

.space-hero::before {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: 21px;
  background:
    radial-gradient(circle at 14% 18%, rgba(11, 183, 170, 0.18), transparent 30%),
    radial-gradient(circle at 88% 18%, rgba(59, 130, 246, 0.15), transparent 28%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.9));
  pointer-events: none;
}

.hero-bg {
  opacity: 0.22;
  filter: saturate(130%);
}

.hero-content {
  padding: 26px;
  background: rgba(255, 255, 255, 0.74);
  border-color: rgba(148, 163, 184, 0.22);
  border-radius: 22px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.hero-top {
  align-items: flex-start;
  margin-bottom: 22px;
}

.back-btn {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border-color: rgba(148, 163, 184, 0.24);
  color: #475569;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
}

.back-btn:hover {
  background: #ecfdfb;
  color: #0a9e94;
  border-color: rgba(11, 183, 170, 0.28);
  transform: translateX(-2px);
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  margin-bottom: 5px;
  color: #0a9e94;
  font-size: 0.75rem;
  font-weight: 700;
}

.hero-title {
  font-size: clamp(1.55rem, 2vw, 2.15rem);
  color: #0f172a;
  letter-spacing: 0;
}

.hero-goal {
  max-width: 720px;
  margin-top: 7px;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid transparent;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.hero-badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 4px color-mix(in srgb, currentColor 14%, transparent);
}

.hero-badge.good,
.hero-badge.normal {
  background: #ecfdf5;
  color: #059669;
  border-color: rgba(16, 185, 129, 0.18);
}

.hero-badge.warning {
  background: #fffbeb;
  color: #d97706;
  border-color: rgba(245, 158, 11, 0.22);
}

.hero-badge.danger {
  background: #fef2f2;
  color: #dc2626;
  border-color: rgba(239, 68, 68, 0.2);
}

.hero-primary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  color: white;
  font-size: 0.875rem;
  font-weight: 700;
  box-shadow: 0 14px 28px rgba(11, 183, 170, 0.24);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.hero-primary-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 34px rgba(11, 183, 170, 0.28);
}

.hero-dashboard {
  display: grid;
  grid-template-columns: minmax(320px, 0.88fr) minmax(420px, 1.12fr);
  gap: 16px;
  align-items: stretch;
}

.progress-panel {
  display: flex;
  align-items: center;
  gap: 18px;
  min-width: 0;
  padding: 18px;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(236, 253, 251, 0.78));
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}

.progress-ring {
  width: 116px;
  height: 116px;
  border-radius: 50%;
  padding: 10px;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.04);
}

.progress-ring-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
}

.progress-ring-inner strong {
  color: #0f172a;
  font-size: 1.45rem;
  line-height: 1.1;
}

.progress-ring-inner span {
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 700;
}

.progress-copy {
  min-width: 0;
}

.progress-label {
  color: #0a9e94;
  font-size: 0.75rem;
  font-weight: 700;
}

.progress-copy strong {
  display: block;
  margin-top: 5px;
  color: #1e293b;
  font-size: 1rem;
  line-height: 1.45;
}

.progress-copy p {
  margin: 7px 0 0;
  color: #64748b;
  font-size: 0.8125rem;
  line-height: 1.55;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 0;
}

.agent-insight-banner {
  margin-top: 16px;
  padding: 13px 15px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
  border-color: rgba(11, 183, 170, 0.15);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
}

.agent-insight-banner:hover {
  border-color: rgba(11, 183, 170, 0.35);
  transform: translateY(-1px);
}

.insight-icon {
  background: linear-gradient(135deg, #ecfdfb, #e0f2fe);
  color: #0a9e94;
}

.insight-text {
  color: #334155;
}

.insight-link {
  color: #0a9e94;
  font-weight: 700;
}

/* 继续学习 hero 区块 */
.continue-study-block {
  margin-top: 16px;
  padding: 20px 22px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(11, 183, 170, 0.1), rgba(2, 132, 199, 0.08));
  border: 1px solid rgba(11, 183, 170, 0.25);
  box-shadow: 0 10px 26px rgba(11, 183, 170, 0.12);

  .csb-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .csb-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 600;
    color: #0a9e94;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    svg { color: #0bb7aa; }
  }

  .csb-time {
    font-size: 12px;
    color: #475569;
    background: rgba(255, 255, 255, 0.7);
    padding: 3px 10px;
    border-radius: 999px;
  }

  .csb-title {
    margin: 6px 0 6px;
    font-size: 19px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.35;
  }

  .csb-judge {
    margin: 0 0 14px;
    font-size: 13px;
    color: #334155;
    line-height: 1.55;
  }

  .csb-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .csb-btn {
    padding: 8px 16px;
    border-radius: 10px;
    border: 1px solid rgba(15, 23, 42, 0.1);
    background: #fff;
    color: #475569;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.18s ease;
    &:hover:not(:disabled) {
      border-color: #0bb7aa;
      color: #0bb7aa;
      transform: translateY(-1px);
    }
    &:disabled { opacity: 0.5; cursor: not-allowed; }

    &.primary {
      background: linear-gradient(135deg, #0bb7aa, #0284c7);
      color: #fff;
      border-color: transparent;
      font-weight: 600;
      box-shadow: 0 6px 16px rgba(11, 183, 170, 0.32);
      &:hover:not(:disabled) { color: #fff; opacity: 0.92; }
    }
  }
}

@media (max-width: 640px) {
  .continue-study-block .csb-btn { flex: 1 1 calc(50% - 4px); justify-content: center; }
}

.page-body {
  gap: 22px;
}

.main-content {
  display: flex;
  flex-direction: column;
}

.tab-nav {
  position: sticky;
  top: 0;
  z-index: 8;
  gap: 6px;
  padding: 6px;
  margin-bottom: 18px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(14px);
  border-color: rgba(148, 163, 184, 0.18);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  overflow-x: auto;
}

.tab-btn {
  min-height: 38px;
  padding: 8px 16px;
  border-radius: 11px;
  color: #64748b;
}

.tab-btn:hover {
  color: #0f172a;
  background: #f8fafc;
}

.tab-btn.active {
  color: #0a9e94;
  background: #ecfdfb;
  box-shadow: inset 0 0 0 1px rgba(11, 183, 170, 0.15);
}

.tab-badge {
  background: #e2e8f0;
  color: #64748b;
}

.tab-btn.active .tab-badge {
  background: rgba(11, 183, 170, 0.14);
  color: #0a9e94;
}

.tab-content {
  padding: 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
}

.section-header {
  margin-bottom: 8px;
}

.section-header h3 {
  color: #0f172a;
  font-size: 1.05rem;
}

.task-count {
  padding: 3px 9px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
  font-weight: 600;
}

.task-count.danger {
  background: #fef2f2;
  color: #dc2626;
}

.task-list {
  gap: 12px;
}

.quick-actions-row {
  margin-top: 4px;
  padding-top: 14px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
}

.plan-overview,
.plan-goals,
.plan-phase-card,
.resource-card,
.assessment-summary,
.record-row {
  border-color: rgba(148, 163, 184, 0.18);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
}

.plan-overview {
  border-radius: 16px;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
}

.plan-stat {
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.plan-phase-card {
  border-radius: 16px;
}

.resource-grid {
  gap: 14px;
}

.resource-card {
  border-radius: 16px;
}

.resource-card:hover {
  border-color: rgba(11, 183, 170, 0.24);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.07);
}

.records-chart {
  padding: 18px 14px 12px;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff, #f8fafc);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.bar-wrapper {
  background: #e2e8f0;
}

.bar-fill {
  background: linear-gradient(to top, #0bb7aa, #38bdf8);
}

@media (max-width: 1200px) {
  .page-body {
    flex-direction: column;
  }

  .main-content {
    width: 100%;
  }
}

@media (max-width: 980px) {
  .hero-dashboard {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    align-items: flex-end;
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .learning-space-page {
    gap: 16px;
  }

  .hero-content,
  .tab-content {
    padding: 16px;
    border-radius: 18px;
  }

  .space-hero {
    border-radius: 18px;
  }

  .hero-top {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px;
  }

  .hero-actions {
    grid-column: 1 / -1;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .progress-panel {
    align-items: flex-start;
  }

  .progress-ring {
    width: 94px;
    height: 94px;
  }

  .stats-row {
    grid-template-columns: 1fr;
  }

  .tab-nav {
    margin-bottom: 14px;
  }

  .tab-btn {
    flex: 0 0 auto;
  }

  .phase-resources,
  .resource-grid {
    grid-template-columns: 1fr;
  }

  .plan-overview,
  .plan-phase-head {
    grid-template-columns: 1fr;
  }

  .plan-overview-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .phase-head-meta {
    flex-wrap: wrap;
    white-space: normal;
  }

  .plan-next-step {
    grid-template-columns: 1fr;

    strong {
      white-space: normal;
    }
  }

  .phase-resource {
    border-right: 0;

    &:nth-child(2) {
      border-top: 1px solid rgba(148, 163, 184, 0.08);
    }
  }

  .assessment-summary {
    gap: 10px;
    justify-content: space-between;
  }

  .record-row {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .record-reflection {
    width: 100%;
    text-align: left;
  }
}

@media (max-width: 520px) {
  .hero-actions,
  .quick-actions-row {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-primary-action {
    width: 100%;
  }

  .hero-badge {
    justify-content: center;
  }

  .progress-panel {
    flex-direction: column;
  }
}
</style>
