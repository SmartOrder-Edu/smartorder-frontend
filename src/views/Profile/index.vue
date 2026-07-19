<template>
  <AppLayout>
    <div class="profile-layout">
      <!-- 左侧导航 -->
      <ProfileNavSidebar
        :sections="navSections"
        :active-id="activeSectionId"
        @navigate="scrollToSection"
      />

      <!-- 右侧内容 -->
      <div class="profile-content">
        <!-- ===== 1. 页面标题：对齐参考图的学习画像顶栏 ===== -->
        <div class="page-header" data-section-id="hero">
          <div class="header-left">
            <h1 class="page-title">学习画像</h1>
            <p class="page-desc">动态、结构化、可追溯的学习状态模型</p>
          </div>
          <div class="header-tools">
            <button class="header-icon-btn" aria-label="搜索画像">
              <el-icon><Search /></el-icon>
            </button>
            <button class="header-icon-btn has-dot" aria-label="查看画像提醒">
              <el-icon><Bell /></el-icon>
            </button>
            <span class="profile-version" v-if="profileData">
              v{{ profileData.profileVersion ?? 1 }}
            </span>
          </div>
        </div>

        <!-- ===== 2. 首屏画像横幅：合并身份信息、装饰面板和核心指标 ===== -->
        <section class="profile-hero-section" data-section-id="hero">
          <div class="hero-surface">
            <ProfileHeroCard
              :hero="heroData"
              :loading="profileLoading"
            />
            <div class="hero-visual" aria-hidden="true">
              <div class="visual-platform"></div>
              <div class="visual-card visual-card-bars">
                <span></span><span></span><span></span>
              </div>
              <div class="visual-card visual-card-chart"></div>
              <div class="visual-card visual-card-doc">
                <i></i><i></i><i></i>
              </div>
            </div>
          </div>
          <div class="metrics-grid" data-section-id="metrics">
            <ProfileMetricCard
              v-for="m in heroMetrics"
              :key="m.key"
              :metric="m"
            />
          </div>
        </section>

        <!-- ===== 网格区域：参考图式三列仪表盘密度 ===== -->
        <div class="content-grid">

          <!-- ===== 3. 学习目标进度 ===== -->
          <section class="section-card" data-section-id="goals">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon"><el-icon><DataAnalysis /></el-icon></span>
                学习目标进度
              </h3>
              <button class="text-btn">查看全部</button>
            </div>
            <GoalProgressCards
              :goals="goalProgressItems"
              :loading="profileLoading"
            />
          </section>

          <!-- ===== 4. 能力画像雷达图 ===== -->
          <section class="section-card" data-section-id="radar">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon"><el-icon><Connection /></el-icon></span>
                综合能力雷达图
              </h3>
            </div>
            <AbilityRadarChart
              :dimensions="radarDimensions"
              :peer-dimensions="peerRadarDimensions"
              :loading="profileLoading"
              @dimension-click="onRadarClick"
            />
          </section>

          <!-- ===== 5. 学科掌握度立体柱状图 ===== -->
          <section class="section-card" data-section-id="subjects">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon"><el-icon><Histogram /></el-icon></span>
                学科掌握度
              </h3>
            </div>
            <SubjectBarChart
              :subjects="subjectBarData"
              :loading="profileLoading"
            />
          </section>

          <!-- ===== 6-8. 趋势/错题 + 学习偏好：左侧上下分布，右侧承载偏好分析 ===== -->
          <div class="preference-layout-row">
            <div class="preference-left-stack">
              <section class="section-card preference-side-card" data-section-id="trend">
                <div class="section-header">
                  <h3 class="section-title">
                    <span class="title-icon"><el-icon><TrendCharts /></el-icon></span>
                    近 7 天学习趋势
                  </h3>
                  <div class="metric-switcher">
                    <button
                      v-for="opt in trendMetrics"
                      :key="opt.value"
                      class="switch-btn"
                      :class="{ active: trendActiveMetric === opt.value }"
                      @click="trendActiveMetric = opt.value"
                    >
                      {{ opt.label }}
                    </button>
                  </div>
                </div>
                <WeeklyTrendChart
                  :metric="trendActiveMetric"
                  :loading="profileLoading"
                />
              </section>

              <section class="section-card preference-side-card" data-section-id="mistakes">
                <div class="section-header">
                  <h3 class="section-title">
                    <span class="title-icon"><el-icon><Warning /></el-icon></span>
                    高频错题 TOP5
                  </h3>
                </div>
                <Top5MistakeList
                  :items="mistakeList"
                  :loading="profileLoading"
                  @item-click="onMistakeClick"
                />
              </section>
            </div>

            <section class="section-card preference-section-card" data-section-id="preferences">
              <PreferenceDonutChart
                :items="preferenceChartItems"
                :loading="profileLoading"
              />
            </section>
          </div>

          <!-- ===== 9. 当前学习状态 + 建议 ===== -->
          <section class="section-card section-card-full" data-section-id="status">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon"><el-icon><Sunny /></el-icon></span>
                学习状态与建议
              </h3>
            </div>
            <LearningStatusCard
              :status="currentStatus"
              :suggestions="learningSuggestions"
              :loading="profileLoading"
            />
          </section>

          <!-- ===== 10. 元认知画像 ===== -->
          <section class="section-card" data-section-id="metacognition">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon"><el-icon><Cpu /></el-icon></span>
                元认知画像
              </h3>
            </div>
            <MetacognitiveGrid
              :dimensions="metacognitions"
              :loading="profileLoading"
            />
          </section>

          <!-- ===== 11. 知识点掌握分布 ===== -->
          <section class="section-card" data-section-id="knowledge">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon"><el-icon><Odometer /></el-icon></span>
                知识点掌握分布
              </h3>
            </div>
            <KnowledgeDistributionChart
              :distribution="knowledgeDistribution"
              :loading="profileLoading"
            />
            <div class="section-trend" v-if="knowledgeTrend">
              <span class="trend-icon up">&#9650;</span>
              相比上周，已掌握知识点提升 {{ knowledgeTrend }}%
            </div>
          </section>

          <!-- ===== 12. 薄弱知识点排行 ===== -->
          <section class="section-card" data-section-id="weakness">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon"><el-icon><CircleClose /></el-icon></span>
                薄弱知识点 TOP5
              </h3>
            </div>
            <WeakKnowledgeTop5
              :items="weakKnowledgeList"
              :loading="profileLoading"
              @item-click="onWeakKnowledgeClick"
            />
          </section>

          <!-- ===== 13. 学习行为统计热力图 ===== -->
          <section class="section-card section-card-span-2" data-section-id="heatmap">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon"><el-icon><Calendar /></el-icon></span>
                学习行为热力图
              </h3>
            </div>
            <StudyBehaviorHeatmap
              :loading="profileLoading"
            />
          </section>

          <!-- ===== 14. 阶段学习总结 ===== -->
          <section class="section-card" data-section-id="summary">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon"><el-icon><Document /></el-icon></span>
                阶段学习总结
              </h3>
            </div>
            <StageLearningSummary
              :loading="profileLoading"
            />
          </section>

          <!-- ===== 15. 学习路径进度 ===== -->
          <section class="section-card" data-section-id="path-progress">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon"><el-icon><Guide /></el-icon></span>
                学习路径进度
              </h3>
            </div>
            <LearningPathProgress
              :loading="profileLoading"
            />
          </section>

          <!-- ===== 16. 推荐学习资源 ===== -->
          <section class="section-card" data-section-id="resources">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon"><el-icon><Collection /></el-icon></span>
                推荐学习资源
              </h3>
            </div>
            <RecommendedResources
              :loading="profileLoading"
            />
          </section>

          <!-- ===== 17. 学习路径快照 ===== -->
          <section class="section-card" data-section-id="snapshot">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon"><el-icon><Picture /></el-icon></span>
                学习路径快照
              </h3>
            </div>
            <LearningPathSnapshot
              :loading="profileLoading"
            />
          </section>
        </div>

        <!-- ===== 19. 账户与安全（原有模块，折叠展示） ===== -->
        <section class="section-card account-section" data-section-id="account">
          <div class="section-header" @click="showAccount = !showAccount" style="cursor:pointer">
            <h3 class="section-title">
              <span class="title-icon"><el-icon><UserFilled /></el-icon></span>
              账户与安全
            </h3>
            <el-icon :size="16" class="collapse-icon" :class="{ rotated: showAccount }">
              <ArrowDown />
            </el-icon>
          </div>

          <template v-if="showAccount && userStore.userInfo">
            <ProfileHeader
              :user-info="userInfoHeaderData"
              :uploading="uploading"
              @avatar-change="handleAvatarChange"
            />

            <div class="security-content">
              <CredentialSection
                :user-info="userCredentialData"
                @change-email="showEmailDialog = true"
                @edit="openEditDialog"
              />

              <QuickLoginBindingSection
                :gitee-bound="isProviderBound('gitee')"
                :github-bound="isProviderBound('github')"
                :gitee-info="getProviderInfo('gitee')"
                :github-info="getProviderInfo('github')"
                @bind="handleBind"
                @unbind="handleUnbind"
              />
            </div>
          </template>
        </section>

        <!-- ===== 页脚 ===== -->
        <div class="profile-footer">
          <span>知序智学 · AI 个性化学习操作系统</span>
          <span v-if="profileData?.updatedAt">
            最后更新：{{ formatTime(profileData.updatedAt) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <EmailEditDialog
      v-if="showEmailDialog"
      v-model="showEmailDialog"
      :current-email="userStore.userInfo?.email || ''"
    />

    <el-dialog
      v-model="showEditDialog"
      title="编辑个人资料"
      width="420px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item label="用户名">
          <el-input v-model="editData.username" maxlength="30" />
        </el-form-item>
        <el-form-item label="个人简介">
          <el-input
            v-model="editData.bio"
            type="textarea"
            :rows="3"
            maxlength="200"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveProfile">保存</el-button>
      </template>
    </el-dialog>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DataAnalysis, Connection, PieChart,
  TrendCharts, Histogram, Warning, Sunny, Cpu, Odometer,
  CircleClose, Calendar, Document, Guide, Collection, Picture,
  UserFilled, ArrowDown, Medal, Trophy, Search, Bell
} from '@element-plus/icons-vue'

import AppLayout from '@/components/layout/AppLayout.vue'
import { useUserStore } from '@/stores/user'
import { studentProfileApi } from '@/api/studentProfile'
import type { StudentProfileData } from '@/api/studentProfile'
import { userApi } from '@/api/user'
import { buildSubjectProfileList } from './subjectProfiles'

// 布局组件
import ProfileNavSidebar from './components/ProfileNavSidebar.vue'
import type { NavSection } from './components/ProfileNavSidebar.vue'

// 核心组件
import ProfileHeroCard from './components/ProfileHeroCard.vue'
import ProfileMetricCard from './components/ProfileMetricCard.vue'
import GoalProgressCards from './components/GoalProgressCards.vue'
// 图表组件
import AbilityRadarChart from './components/AbilityRadarChart.vue'
import SubjectBarChart from './components/SubjectBarChart.vue'
import WeeklyTrendChart from './components/WeeklyTrendChart.vue'
import PreferenceDonutChart from './components/PreferenceDonutChart.vue'
import Top5MistakeList from './components/Top5MistakeList.vue'
import LearningStatusCard from './components/LearningStatusCard.vue'
import MetacognitiveGrid from './components/MetacognitiveGrid.vue'
import KnowledgeDistributionChart from './components/KnowledgeDistributionChart.vue'
import WeakKnowledgeTop5 from './components/WeakKnowledgeTop5.vue'
import StudyBehaviorHeatmap from './components/StudyBehaviorHeatmap.vue'
import StageLearningSummary from './components/StageLearningSummary.vue'
import LearningPathProgress from './components/LearningPathProgress.vue'
import RecommendedResources from './components/RecommendedResources.vue'
import LearningPathSnapshot from './components/LearningPathSnapshot.vue'

// 账户组件（复用现有）
import ProfileHeader from './components/ProfileHeader.vue'
import CredentialSection from './components/CredentialSection.vue'
import QuickLoginBindingSection from './components/QuickLoginBindingSection.vue'
import EmailEditDialog from './components/EmailEditDialog.vue'

// 组合式函数
import { useScrollSpy } from './composables/useScrollSpy'

// Mock 数据
import {
  mockKnowledgeDistribution,
  mockLearningSuggestions,
  mockCurrentStatus,
  mockPeerRadarData,
  mockSubjectBarData,
  mockMistakeList,
  mockPreferenceItems,
  mockWeakKnowledgeList,
  mockMetacognitions,
  mockRadarDimensions,
} from './mocks/profileMockData'

// ==================== Store & State ====================
const userStore = useUserStore()

const profileData = ref<StudentProfileData | null>(null)
const profileLoading = ref(false)
const showAccount = ref(false)
const showEditDialog = ref(false)
const showEmailDialog = ref(false)
const uploading = ref(false)
const trendActiveMetric = ref<'duration' | 'tasks' | 'accuracy'>('duration')

const editData = reactive({ username: '', bio: '' })

// ==================== 左侧导航配置 ====================
const navSections: NavSection[] = [
  { id: 'hero', label: '画像概览', icon: Trophy },
  { id: 'metrics', label: '核心指标', icon: Medal },
  { id: 'goals', label: '目标进度', icon: DataAnalysis },
  { id: 'radar', label: '能力雷达', icon: Connection },
  { id: 'preferences', label: '学习偏好', icon: PieChart },
  { id: 'trend', label: '学习趋势', icon: TrendCharts },
  { id: 'subjects', label: '学科掌握', icon: Histogram },
  { id: 'mistakes', label: '高频错题', icon: Warning },
  { id: 'status', label: '学习建议', icon: Sunny },
  { id: 'metacognition', label: '元认知', icon: Cpu },
  { id: 'knowledge', label: '知识分布', icon: Odometer },
  { id: 'weakness', label: '薄弱环节', icon: CircleClose },
  { id: 'heatmap', label: '行为热力图', icon: Calendar },
  { id: 'summary', label: '阶段总结', icon: Document },
  { id: 'path-progress', label: '路径进度', icon: Guide },
  { id: 'resources', label: '推荐资源', icon: Collection },
  { id: 'snapshot', label: '路径快照', icon: Picture },
  { id: 'account', label: '账户安全', icon: UserFilled },
]

// ==================== Scroll Spy ====================
const scrollSpySections = computed(() =>
  navSections.map((s) => ({
    id: s.id,
    el: document.querySelector(`[data-section-id="${s.id}"]`),
  }))
)

const { activeSectionId, scrollToSection } = useScrollSpy(scrollSpySections)

// ==================== 标签映射 ====================
const levelLabels: Record<string, string> = {
  BEGINNER: '入门', DEVELOPING: '发展中', PROFICIENT: '熟练', ADVANCED: '精通',
}

const resourceTypeLabels: Record<string, string> = {
  VIDEO: '视频', TEXT: '文本', DIAGRAM: '图表', CODE_EXAMPLE: '代码示例',
  CODE_TRACE: '代码追踪', INTERACTIVE: '交互式', QUIZ: '测验',
}

const overallAbilityKeywordMap: Record<string, string[]> = {
  编程实现: ['编程', '代码', '实现', '实践', '开发', 'program', 'code'],
  算法思维: ['算法', '逻辑', '思维', '推理', 'algorithm', 'logic'],
  调试排错: ['调试', '排错', '错误', '诊断', 'debug', 'bug'],
  系统设计: ['系统', '架构', '设计', '工程', 'system', 'design'],
  协作沟通: ['协作', '沟通', '表达', '合作', '团队', 'communication'],
  学习迁移: ['迁移', '应用', '举一反三', '知识理解', '学习', 'transfer'],
}

// ==================== Hero 数据（始终有值） ====================
const heroData = computed(() => {
  const u = userStore.userInfo
  const bg = profileData.value?.learningBackground
  const goals = profileData.value?.learningGoals
  const ability = profileData.value?.abilityProfile
  const constraints = bg?.learningConstraints

  const eduLevelLabels: Record<string, string> = {
    UNDERGRADUATE: '本科生', GRADUATE: '研究生', DOCTORAL: '博士生', SELF_TAUGHT: '自学者',
  }

  let goalText = u?.bio || '系统学习计算机核心课程，提升编程与算法能力'
  if (goals?.primaryGoalId && goals.goals?.[goals.primaryGoalId]) {
    goalText = goals.goals[goals.primaryGoalId].title || goalText
  }

  return {
    name: u?.username || '学习者',
    avatar: u?.avatarUrl || '',
    identity: eduLevelLabels[bg?.education?.educationLevel || ''] || (u?.role === 1 ? '教师' : '本科生'),
    direction: bg?.education?.majorName || '计算机科学与技术',
    level: bg?.currentLevelDetail || '大二',
    goal: goalText,
    weeklyMinutes: constraints?.weeklyAvailableMinutes ?? 750,
    overallMastery: ability?.overallScore != null ? Math.round(ability.overallScore) : 71,
    overallLevel: ability?.overallLevel ? levelLabels[ability.overallLevel] || ability.overallLevel : '发展中',
  }
})

// ==================== 核心指标（始终有值） ====================
const heroMetrics = computed(() => {
  const bg = profileData.value?.learningBackground
  const constraints = bg?.learningConstraints
  const ability = profileData.value?.abilityProfile
  const metacog = profileData.value?.metacognitiveProfile

  return [
    {
      key: 'weeklyHours',
      label: '每周学习时长',
      value: constraints?.weeklyAvailableMinutes
        ? `${(constraints.weeklyAvailableMinutes / 60).toFixed(1)}h`
        : '12.5h',
      icon: '⏱',
      color: '#2563eb',
      bg: '#eff6ff',
      trend: '+2.5h',
      trendUp: true,
    },
    {
      key: 'mastery',
      label: '综合掌握度',
      value: ability?.overallScore != null ? `${Math.round(ability.overallScore)}%` : '71%',
      icon: '📊',
      color: '#10b981',
      bg: '#ecfdf5',
      trend: '+5%',
      trendUp: true,
    },
    {
      key: 'metacog',
      label: '元认知水平',
      value: metacog?.overallLevel
        ? (levelLabels[metacog.overallLevel] || metacog.overallLevel)
        : '良好',
      icon: '🧠',
      color: '#f59e0b',
      bg: '#fffbeb',
      trend: '稳定',
      trendUp: null,
    },
    {
      key: 'streak',
      label: '连续学习天数',
      value: '5天',
      icon: '⚡',
      color: '#8b5cf6',
      bg: '#f5f3ff',
      trend: '连续 5 天',
      trendUp: true,
    },
  ]
})

// ==================== 学习目标进度（后端目标 + 视觉兜底） ====================
const goalProgressItems = computed(() => {
  const goals = profileData.value?.learningGoals?.goals
  const palette = ['#2563eb', '#10b981', '#8b5cf6', '#f97316']

  if (goals && Object.keys(goals).length > 0) {
    return Object.values(goals).slice(0, 4).map((goal, index) => ({
      id: goal.goalId || `goal-${index}`,
      name: goal.title || '未命名学习目标',
      description: goal.description || `目标等级：${goal.targetLevel || '持续提升'}`,
      percent: Math.round(goal.progress?.progressPercent ?? 0),
      color: palette[index % palette.length],
      status: goal.status || 'IN_PROGRESS',
      priority: goal.priority || 'MEDIUM',
    }))
  }

  return [
    {
      id: 'mock-goal-1',
      name: '数据结构与算法精通',
      description: '掌握高频算法模型与复杂度分析',
      percent: 78,
      color: '#2563eb',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
    },
    {
      id: 'mock-goal-2',
      name: '计算机组成原理',
      description: '理解 CPU、存储层级与指令执行过程',
      percent: 62,
      color: '#10b981',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
    },
    {
      id: 'mock-goal-3',
      name: '项目实战能力提升',
      description: '完成 2 个完整项目并沉淀复盘',
      percent: 41,
      color: '#8b5cf6',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
    },
    {
      id: 'mock-goal-4',
      name: '算法竞赛入门',
      description: '单周完成 30 道基础训练题',
      percent: 28,
      color: '#f97316',
      status: 'IN_PROGRESS',
      priority: 'LOW',
    },
  ]
})

// ==================== 雷达图数据 ====================
const radarDimensions = computed(() => {
  const abilities = profileData.value?.abilityProfile?.abilities
  const fallbackDimensions = mockRadarDimensions()
  if (!abilities || Object.keys(abilities).length === 0) return fallbackDimensions

  const abilityItems = Object.values(abilities)

  // 综合雷达固定展示学生总体能力六维，避免后端学科名直接进入雷达图。
  return fallbackDimensions.map((dimension) => {
    const keywords = overallAbilityKeywordMap[dimension.name] || []
    const matchedScores = abilityItems
      .filter((item) => {
        const text = `${item.abilityName || ''}${item.abilityCode || ''}`.toLowerCase()
        return keywords.some((keyword) => text.includes(keyword.toLowerCase()))
      })
      .map((item) => Math.max(0, Math.min(100, item.score ?? dimension.score)))

    if (matchedScores.length === 0) return dimension

    const averageScore = matchedScores.reduce((sum, score) => sum + score, 0) / matchedScores.length
    return {
      name: dimension.name,
      score: Math.round(averageScore),
    }
  })
})

const peerRadarDimensions = computed(() => {
  return mockPeerRadarData(radarDimensions.value.map((d) => d.name))
})

// ==================== 学习偏好环形图 ====================
const preferenceChartItems = computed(() => {
  // 当前学习偏好模块按设计稿固定展示 mock 画像数据，避免接口数据缺失导致版式不稳定。
  return mockPreferenceItems()
})

// ==================== 学科数据（API + mock fallback） ====================
const subjectBarData = computed(() => {
  const apiData = buildSubjectProfileList(profileData.value, resourceTypeLabels)
    .map((s) => ({
      name: s.subjectName,
      mastery: s.mastery ?? 0,
      lastTestTime: '',
      trend: 'stable' as const,
    }))
  return apiData.length > 0 ? apiData : mockSubjectBarData()
})

// ==================== 高频错题（API + mock fallback） ====================
const mistakeList = computed(() => {
  const patterns = profileData.value?.commonMisconceptions?.patterns
  if (!patterns || Object.keys(patterns).length === 0) return mockMistakeList()
  const colorMap = ['#ef4444', '#f59e0b', '#10b981', '#2563eb', '#8b5cf6']
  const list = Object.values(patterns).slice(0, 5).map((p, i) => ({
    id: p.misconceptionId || String(i),
    name: p.title || '未知错题类型',
    percent: Math.round(
      ((p.occurrenceStatistics?.countLast30Days ?? 0) /
        Math.max(1, (p.occurrenceStatistics?.countLast30Days ?? 1) + 20)) *
        100
    ),
    color: colorMap[i] || '#2563eb',
    count: p.occurrenceStatistics?.countLast30Days ?? 0,
    lastObserved: p.occurrenceStatistics?.lastObservedAt,
    recommendation: p.intervention?.recommendedActions?.[0] || '',
  }))
  return list.length > 0 ? list : mockMistakeList()
})

// ==================== 元认知数据 ====================
// ==================== 元认知数据 ====================
const metacognitions = computed(() => {
  const dims = profileData.value?.metacognitiveProfile?.dimensions
  if (!dims || Object.keys(dims).length === 0) return mockMetacognitions()
  const list = Object.values(dims).map((d) => ({
    name: d.dimensionName || d.dimensionCode || '',
    value: d.score ?? 0,
    level: levelLabels[d.level || ''] || d.level || '',
    description: d.description || '',
    trend: d.trend || 'STABLE',
  }))
  return list.length > 0 ? list : mockMetacognitions()
})

// ==================== 知识点分布 ====================
const knowledgeDistribution = computed(() => {
  return mockKnowledgeDistribution()
})

const knowledgeTrend = ref<number | null>(6)

// ==================== 薄弱知识点（API + mock fallback） ====================
const weakKnowledgeList = computed(() => {
  const profiles = profileData.value?.subjectProfiles?.profiles
  if (!profiles || Object.keys(profiles).length === 0) return mockWeakKnowledgeList()
  const result: Array<{ id: string; name: string; subject: string; percent: number }> = []
  const entries = Object.entries(profiles)
  for (const [, sp] of entries) {
    const kps = sp.knowledgeMastery?.knowledgePoints
    if (kps) {
      for (const [kpId, kp] of Object.entries(kps)) {
        const score = kp.masteryScore ?? 100
        if (score < 60) {
          result.push({
            id: kpId,
            name: kp.knowledgePointNameCache || kpId,
            subject: sp.subjectNameCache || '',
            percent: score,
          })
        }
      }
    }
  }
  return result.length > 0 ? result.slice(0, 5) : mockWeakKnowledgeList()
})

// ==================== Mock 数据引用 ====================
const currentStatus = computed(() => mockCurrentStatus())
const learningSuggestions = computed(() => mockLearningSuggestions())

// ==================== 用户信息（复用现有逻辑） ====================
const userInfoHeaderData = computed(() => ({
  name: heroData.value?.name || '',
  avatar: heroData.value?.avatar || '',
  identity: heroData.value?.identity || '',
  goal: heroData.value?.goal || '',
  weeklyMinutes: heroData.value?.weeklyMinutes || 0,
}))

const userCredentialData = computed(() => {
  const u = userStore.userInfo
  return {
    id: u ? String(u.id) : '',
    username: u ? u.username : '',
    email: u ? u.email : '',
    bio: u ? u.bio : '',
  }
})

const boundIdentities = computed(() => userStore.userInfo?.authIdentities || [])
const boundProviders = computed(() => new Set(boundIdentities.value.map((i) => i.providerCode)))

const isProviderBound = (code: string) => boundProviders.value.has(code)
const getProviderInfo = (code: string) =>
  boundIdentities.value.find((i) => i.providerCode === code)

const trendMetrics = [
  { label: '学习时长', value: 'duration' as const },
  { label: '完成任务', value: 'tasks' as const },
  { label: '正确率', value: 'accuracy' as const },
]

// ==================== 事件处理 ====================
const onRadarClick = (_dimension: string) => {
  // 可扩展：跳转到能力详情
}

const onMistakeClick = (_id: string) => {
  // 可扩展：跳转到专项练习
}

const onWeakKnowledgeClick = (_id: string) => {
  // 可扩展：跳转到知识点详情
}

const handleAvatarChange = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.warning('仅支持 JPG、PNG、GIF、WebP 格式')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 5MB')
    return
  }
  try {
    uploading.value = true
    await userStore.uploadAvatar(file)
    ElMessage.success('头像更新成功')
  } catch (error: any) {
    ElMessage.error(error?.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

const openEditDialog = () => {
  const u = userStore.userInfo
  if (u) {
    editData.username = u.username || ''
    editData.bio = u.bio || ''
  }
  showEditDialog.value = true
}

const saveProfile = async () => {
  try {
    await userStore.updateProfile({ username: editData.username, bio: editData.bio })
    ElMessage.success('保存成功')
    showEditDialog.value = false
  } catch {
    ElMessage.error('保存失败')
  }
}

const handleBind = (providerCode: string) => {
  if (providerCode === 'github') {
    userApi.getGithubOAuthState().then((state) => {
      const redirectUri = encodeURIComponent(`${window.location.origin}/oauth/callback/github`)
      const clientId = 'Ov23liXm4K4A7VHJmGQi'
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=user:email`
    }).catch(() => ElMessage.error('获取绑定状态失败'))
  } else if (providerCode === 'gitee') {
    userApi.getGiteeOAuthState().then((state) => {
      const redirectUri = encodeURIComponent(`${window.location.origin}/oauth/callback/gitee`)
      const clientId = '71fa73bb6b064414b3cf1c78c5a36d7be15d0c0ecfbc09e6b3b8a6bedff9fcce'
      window.location.href = `https://gitee.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`
    }).catch(() => ElMessage.error('获取绑定状态失败'))
  }
}

const handleUnbind = (providerCode: string) => {
  ElMessageBox.confirm(
    `确定要解绑 ${providerCode === 'github' ? 'GitHub' : 'Gitee'} 账号吗？`,
    '提示',
    { confirmButtonText: '确定解绑', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      await userStore.unbindAuth(providerCode)
      ElMessage.success('解绑成功')
    } catch { ElMessage.error('解绑失败') }
  }).catch(() => {})
}

const formatTime = (t: string) => {
  if (!t) return ''
  const d = new Date(t)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// ==================== 初始化 ====================
onMounted(async () => {
  try { await userStore.fetchUserInfo() } catch {}
  try {
    profileLoading.value = true
    const data = await studentProfileApi.getProfile()
    if (data) profileData.value = data
  } catch {} finally {
    profileLoading.value = false
  }
})
</script>

<style scoped lang="scss">
// ==================== CSS 自定义属性 ====================
.profile-layout {
  --profile-primary: #2f6df6;
  --profile-primary-light: #eef5ff;
  --profile-success: #19b995;
  --profile-warning: #ff9f1c;
  --profile-danger: #ef4444;
  --profile-purple: #7c4dff;
  --profile-cyan: #22b8cf;
  --profile-bg: #f6f9ff;
  --profile-card-bg: #ffffff;
  --profile-border: #e4ecfb;
  --profile-text-primary: #101a33;
  --profile-text-secondary: #63708a;
  --profile-text-muted: #9aa7bd;
  --profile-shadow: 0 10px 30px rgba(52, 91, 173, 0.08);
}

// ==================== 布局 ====================
.profile-layout {
  display: flex;
  align-items: flex-start;
  margin: calc(-1 * var(--spacing-xl)) calc(-1 * var(--spacing-2xl));
  min-height: 100vh;
  background:
    radial-gradient(circle at 86% 4%, rgba(47, 109, 246, 0.1), transparent 32%),
    linear-gradient(180deg, #fbfdff 0%, var(--profile-bg) 46%, #ffffff 100%);
  color: var(--profile-text-primary);
}

.profile-content {
  flex: 1;
  min-width: 0;
  padding: 28px 32px 60px;
  display: flex;
  flex-direction: column;
  gap: 18px;

  @media (min-width: 1440px) {
    max-width: 1360px;
    margin: 0 auto;
    padding-left: 0;
    padding-right: 0;
  }
}

// ==================== 页面标题 ====================
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 4px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 31px;
  font-weight: 800;
  color: var(--profile-text-primary);
  margin: 0;
  line-height: 1.12;
  letter-spacing: 0;
}

.page-desc {
  font-size: 13px;
  color: var(--profile-text-secondary);
  margin: 0;
}

.header-tools {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.header-icon-btn {
  width: 36px;
  height: 36px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.74);
  color: #172554;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  box-shadow: 0 8px 18px rgba(52, 91, 173, 0.06);
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: #cfe0ff;
    background: #fff;
  }

  &:active {
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 2px solid var(--profile-primary);
    outline-offset: 2px;
  }

  &.has-dot::after {
    content: '2';
    position: absolute;
    top: -5px;
    right: -3px;
    min-width: 16px;
    height: 16px;
    border-radius: 999px;
    background: #ef4444;
    color: #fff;
    font-size: 10px;
    line-height: 16px;
    font-weight: 700;
  }
}

.profile-version {
  font-size: 11px;
  color: var(--profile-text-muted);
  padding: 7px 11px;
  border: 1px solid var(--profile-border);
  border-radius: 10px;
  background: #fff;
  flex-shrink: 0;
}

// ==================== 首屏画像横幅 ====================
.profile-hero-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border: 1px solid #dbe7fb;
  border-radius: 18px;
  background:
    linear-gradient(102deg, rgba(255, 255, 255, 0.98) 0%, rgba(246, 250, 255, 0.96) 54%, rgba(231, 240, 255, 0.98) 100%);
  box-shadow: 0 18px 48px rgba(58, 98, 184, 0.12);
  overflow: hidden;
  position: relative;
}

.profile-hero-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(47, 109, 246, 0.05), transparent 36%),
    radial-gradient(circle at 82% 12%, rgba(124, 77, 255, 0.16), transparent 28%);
  pointer-events: none;
}

.hero-surface {
  position: relative;
  z-index: 1;
  min-height: 148px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 28px;
  align-items: center;
}

.hero-visual {
  position: relative;
  min-height: 132px;
  isolation: isolate;
}

.visual-platform {
  position: absolute;
  left: 42px;
  right: 12px;
  bottom: 10px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(90deg, rgba(82, 118, 255, 0.12), rgba(34, 184, 207, 0.08));
  box-shadow: inset 0 0 28px rgba(47, 109, 246, 0.12);
  transform: perspective(240px) rotateX(58deg);
}

.visual-card {
  position: absolute;
  border: 1px solid rgba(176, 202, 255, 0.78);
  border-radius: 13px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(226, 238, 255, 0.72));
  box-shadow: 0 16px 26px rgba(58, 98, 184, 0.16);
  backdrop-filter: blur(8px);
}

.visual-card-bars {
  left: 58px;
  top: 24px;
  width: 70px;
  height: 78px;
  transform: rotate(-8deg);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 7px;
  padding: 14px;

  span {
    width: 10px;
    border-radius: 8px 8px 3px 3px;
    background: linear-gradient(180deg, #7fb3ff, #2f6df6);
  }

  span:nth-child(1) { height: 30px; opacity: 0.72; }
  span:nth-child(2) { height: 48px; }
  span:nth-child(3) { height: 38px; opacity: 0.82; }
}

.visual-card-chart {
  right: 36px;
  top: 24px;
  width: 92px;
  height: 78px;
  transform: rotate(7deg);

  &::before {
    content: '';
    position: absolute;
    right: 14px;
    top: 16px;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: conic-gradient(#2f6df6 0 64%, #22b8cf 64% 83%, #dce8ff 83% 100%);
  }

  &::after {
    content: '';
    position: absolute;
    left: 14px;
    bottom: 17px;
    width: 34px;
    height: 6px;
    border-radius: 99px;
    background: #9fc0ff;
    box-shadow: 0 -15px 0 #d7e5ff;
  }
}

.visual-card-doc {
  left: 150px;
  top: 8px;
  width: 82px;
  height: 96px;
  transform: rotate(8deg);
  padding: 18px 15px;

  i {
    display: block;
    height: 7px;
    border-radius: 99px;
    background: #c8dcff;
    margin-bottom: 10px;
  }

  i:nth-child(1) { width: 42px; background: #5f93ff; }
  i:nth-child(2) { width: 52px; }
  i:nth-child(3) { width: 34px; }
}

// ==================== 卡片 ====================
.section-card {
  background: #fff;
  border: 1px solid var(--profile-border);
  border-radius: 14px;
  padding: 18px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  box-shadow: var(--profile-shadow);
  min-width: 0;

  &:hover {
    transform: translateY(-1px);
    border-color: #d3e2fb;
    box-shadow: 0 16px 38px rgba(52, 91, 173, 0.1);
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--profile-text-primary);
  margin: 0;
}

.title-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--profile-primary);
}

// ==================== 文字按钮 ====================
.text-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--profile-primary);
  font-size: 12.5px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  font-family: inherit;
  transition: background 0.15s;

  &:hover {
    background: var(--profile-primary-light);
  }

  &:focus-visible {
    outline: 2px solid var(--profile-primary);
    outline-offset: -2px;
  }
}

// ==================== 指标切换器 ====================
.metric-switcher {
  display: flex;
  gap: 4px;
  background: #f1f6ff;
  border-radius: 8px;
  padding: 3px;
}

.switch-btn {
  border: none;
  background: transparent;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  color: #667085;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  white-space: nowrap;

  &.active {
    background: #fff;
    color: var(--profile-primary);
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }

  &:focus-visible {
    outline: 2px solid var(--profile-primary);
    outline-offset: -2px;
  }
}

// ==================== 指标网格 ====================
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  position: relative;
  z-index: 1;
  scroll-margin-top: 88px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

// ==================== 内容双列网格 ====================
.content-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
}

.section-card-span-2 {
  grid-column: span 2;

  @media (max-width: 820px) {
    grid-column: span 1;
  }
}

.section-card-full {
  grid-column: 1 / -1;
}

.preference-layout-row {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: minmax(300px, 0.92fr) minmax(0, 1.88fr);
  gap: 14px;
  align-items: stretch;
}

.preference-left-stack {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 14px;
  min-width: 0;
}

.preference-side-card {
  min-height: 0;
}

.preference-section-card {
  padding: 0;
  background: transparent;
  border: 0;
  box-shadow: none;

  &:hover {
    transform: none;
    border-color: transparent;
    box-shadow: none;
  }
}

@media (max-width: 1200px) {
  .preference-layout-row {
    grid-template-columns: minmax(280px, 0.95fr) minmax(0, 1.35fr);
  }
}

@media (max-width: 900px) {
  .preference-layout-row {
    grid-template-columns: 1fr;
  }

  .preference-left-stack {
    grid-template-rows: auto;
  }
}

// ==================== 趋势文字 ====================
.section-trend {
  margin-top: 12px;
  font-size: 12px;
  color: #10b981;
  display: flex;
  align-items: center;
  gap: 4px;

  .trend-icon.up {
    font-size: 10px;
  }
}

// ==================== 账户安全区域 ====================
.account-section {
  .collapse-icon {
    transition: transform 0.25s ease;
    color: #667085;

    &.rotated {
      transform: rotate(180deg);
    }
  }
}

.security-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 40px;
  padding: 20px 0 0;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    gap: 28px;
  }
}

// ==================== 页脚 ====================
.profile-footer {
  display: flex;
  justify-content: space-between;
  padding: 24px 0 8px;
  font-size: 11px;
  color: var(--profile-text-muted);
  border-top: 1px solid #edf1f7;
  margin-top: 12px;
}

// ==================== 响应式 ====================
@media (max-width: 991px) {
  .profile-layout {
    margin: calc(-1 * var(--spacing-lg)) calc(-1 * var(--spacing-lg));
  }

  .profile-content {
    padding: 18px 16px 40px;
  }

  .page-header {
    align-items: center;
  }

  .page-title {
    font-size: 22px;
  }

  .hero-surface {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .hero-visual {
    display: none;
  }
}

@media (max-width: 640px) {
  .profile-content {
    padding: 14px 12px 32px;
    gap: 14px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-tools {
    width: 100%;
  }

  .profile-version {
    margin-left: auto;
  }

  .profile-hero-section {
    padding: 14px;
    border-radius: 14px;
  }

  .section-card {
    padding: 14px;
    border-radius: 12px;
  }

  .page-title {
    font-size: 20px;
  }

  .section-title {
    font-size: 14px;
  }

  .metric-switcher {
    width: 100%;
    overflow-x: auto;
  }
}
</style>
