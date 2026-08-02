<template>
  <div class="launch-page" :class="{ completed }">
    <div class="launch-bg">
      <div class="bg-grid"></div>
      <div class="bg-glow"></div>
      <div class="bg-aurora" :style="{ '--aurora-hue': auroraHue }"></div>
    </div>

    <main class="launch-shell">
      <header class="launch-header">
        <div>
          <span class="eyebrow">Multi-Agent Learning Space</span>
          <h1>
            <Transition name="headline-swap" mode="out-in">
              <span class="headline-text" :key="currentHeadline">{{ currentHeadline }}</span>
            </Transition>
          </h1>
          <p>
            <Transition name="headline-swap" mode="out-in">
              <span class="subtitle-text" :key="currentSubtitle">{{ currentSubtitle }}</span>
            </Transition>
          </p>
        </div>
      </header>

      <section class="launch-grid">
        <aside class="profile-snapshot">
          <div class="section-head">
            <span class="eyebrow">画像输入</span>
            <h2>{{ profile.goal }}</h2>
          </div>

          <div class="snapshot-list">
            <div v-for="item in profileItems" :key="item.label" class="snapshot-item">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>

          <div class="tag-group">
            <span v-for="tag in profileTags" :key="tag">{{ tag }}</span>
          </div>

          <div class="evidence-strip">
            <div v-for="item in evidenceStats" :key="item.label">
              <strong>{{ item.value }}</strong>
              <span>{{ item.label }}</span>
            </div>
          </div>

          <!-- 知识图谱生长：5 节点 + 4 边 + 1 回写边，随 activeIndex 逐个亮起 -->
          <div class="kg-mini">
            <div class="kg-mini-head">
              <span class="eyebrow">知识图谱</span>
              <small>{{ kgReadyCount }} / 5 节点</small>
            </div>
            <svg class="kg-mini-svg" viewBox="0 0 280 140" preserveAspectRatio="xMidYMid meet">
              <defs>
                <filter id="kg-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <marker id="kg-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="rgba(148,163,184,0.7)" />
                </marker>
              </defs>
              <!-- 顺序边 -->
              <path
                v-for="(edge, i) in kgEdges"
                :key="'edge-' + i"
                :d="edge.path"
                class="kg-edge"
                :class="{ shown: i < kgReadyCount - 1 }"
                :stroke="edge.color"
                :marker-end="i === kgEdges.length - 1 ? '' : 'url(#kg-arrow)'"
              />
              <!-- 节点 -->
              <g
                v-for="(node, i) in kgNodes"
                :key="node.name"
                class="kg-node"
                :class="{ shown: i < kgReadyCount, active: i === activeIndex && !completed }"
                :transform="`translate(${node.x}, ${node.y})`"
              >
                <circle r="14" :fill="node.color" filter="url(#kg-glow)" />
                <text class="kg-node-icon" dy="0.35em">{{ node.icon }}</text>
                <text class="kg-node-label" :y="28">{{ node.name }}</text>
              </g>
            </svg>
          </div>

          <div class="signal-card">
            <div class="signal-line">
              <span>画像完整度</span>
              <strong>{{ profileReadinessDisplay }}%</strong>
            </div>
            <div class="signal-track">
              <i :style="{ width: `${profileReadiness}%` }"></i>
            </div>
          </div>
        </aside>

        <section class="agent-orchestration">
          <div class="orchestration-head">
            <div>
              <span class="eyebrow">协同编排</span>
              <h2>
                <Transition name="headline-swap" mode="out-in">
                  <span :key="visibleStep?.name || 'done'">{{ visibleStep?.name || '学习空间已创建' }}</span>
                </Transition>
              </h2>
            </div>
            <div
              class="progress-chip"
              :class="{ bursting: justCompleted }"
              :style="{ '--agent-color': currentAgentColor, '--progress': `${progress * 3.6}deg` }"
            >
              <div class="chip-inner">
                <strong>{{ progressRounded }}</strong>
                <span>{{ completed ? '已完成' : '生成中' }}</span>
              </div>
            </div>
          </div>

          <div v-if="completed" class="completion-summary">
            <div v-for="item in completionStats" :key="item.label">
              <strong>{{ item.value }}</strong>
              <span>{{ item.label }}</span>
            </div>
          </div>

          <div class="agent-flow">
            <!-- 连接线 SVG 覆盖层 -->
            <svg class="flow-lines" preserveAspectRatio="none" viewBox="0 0 100 100">
              <line
                v-for="i in 4"
                :key="'flow-' + i"
                :x1="i * 20 - 4"
                y1="50"
                :x2="i * 20 + 4"
                y2="50"
                class="flow-line"
                :class="{
                  done: i < activeIndex || completed,
                  running: i === activeIndex && !completed,
                  waiting: i > activeIndex && !completed
                }"
                :stroke="agentSteps[i]?.color || '#cbd5e1'"
              />
            </svg>
            <div
              v-for="(step, index) in agentSteps"
              :key="step.id"
              class="agent-node"
              :class="[stepStatus(index), { hoverable: stepStatus(index) === 'done' }]"
              :style="{ '--agent-color': step.color }"
              @click="selectAgent(index)"
            >
              <div class="node-icon">
                <el-icon><component :is="step.icon" /></el-icon>
              </div>
              <div>
                <strong>{{ step.name }}</strong>
                <p>{{ step.role }}</p>
              </div>
              <span class="node-tooltip">
                <strong>{{ step.role }}</strong>
                <em>{{ step.verb }}</em>
              </span>
            </div>
          </div>

          <div class="closed-loop">
            <div
              v-for="(item, index) in flowCards"
              :key="item.title"
              class="loop-card"
              :class="{ active: index === Math.min(activeIndex, flowCards.length - 1), done: completed || index < activeIndex }"
            >
              <span class="loop-index">{{ index + 1 }}</span>
              <div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.desc }}</p>
                <small>{{ item.metric }}</small>
              </div>
            </div>
          </div>

          <div class="workbench">
            <div class="workbench-main">
              <div class="workbench-title">
                <span>{{ workbenchLabel }}</span>
                <h3>{{ visibleStep?.verb || '学习空间准备完成' }}</h3>
                <p>{{ visibleStep?.output || '路径、资源、测评与今日任务已经组合为可执行学习空间。' }}</p>
              </div>
              <div class="artifact-grid">
                <div v-for="artifact in activeArtifacts" :key="artifact.label" class="artifact-item">
                  <span>{{ artifact.label }}</span>
                  <strong>{{ artifact.value }}</strong>
                </div>
              </div>
            </div>
            <div ref="consoleRef" class="console-panel">
              <div v-for="(log, idx) in consoleLogs" :key="idx" class="console-line">
                <span :style="{ background: log.color, boxShadow: `0 0 14px ${log.color}` }"></span>
                <p>
                  {{ log.text }}<span v-if="!log.done && idx === consoleLogs.length - 1" class="caret">▍</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        <aside class="result-preview">
          <div class="section-head">
            <span class="eyebrow">生成结果</span>
            <h2>学习空间预览</h2>
          </div>

          <button class="primary-btn" :class="{ 'cta-pulse': justCompleted }" type="button" :disabled="!completed" @click="goDashboard">
            {{ completed ? '进入我的专属学习空间' : 'Agent 正在生成学习空间...' }}
          </button>

          <div class="result-list">
            <div
              v-for="(result, index) in resultCards"
              :key="result.title"
              class="result-card"
              :class="{ visible: index <= unlockedResultIndex }"
              :style="{ '--i': index, '--agent-color': resultAgentColor(index) }"
            >
              <span v-if="index === unlockedResultIndex && !completed" class="new-badge">NEW</span>
              <div class="result-card-head">
                <span>{{ result.type }}</span>
                <strong>{{ result.title }}</strong>
              </div>
              <ul>
                <li v-for="item in result.items" :key="item">{{ item }}</li>
              </ul>
            </div>
          </div>
        </aside>
      </section>
    </main>

    <Teleport to="body">
      <Transition name="toast">
        <div v-if="achievementToast" class="achievement-toast" :key="achievementToast.key">
          <span class="toast-icon" :style="{ background: achievementToast.color }">
            <el-icon><component :is="achievementToast.icon" /></el-icon>
          </span>
          <div class="toast-body">
            <strong>{{ achievementToast.name }} 已完成</strong>
            <p>{{ achievementToast.role }}</p>
          </div>
          <span class="toast-check">✓</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCountUp } from '@/composables/useCountUp'
import { useLearningSpaceStore } from '@/stores/learningSpace'

interface LaunchProfile {
  goal: string
  direction: string
  deadline: string
  weakPoints: string[]
  preference: string[]
  dailyTime: string
  resourcePreference: string[]
  pressure: string
}

type AgentIcon = 'User' | 'Guide' | 'Files' | 'Document' | 'ChatDotRound'

interface AgentStep {
  id: string
  name: string
  role: string
  verb: string
  output: string
  log: string
  color: string
  icon: AgentIcon
}

interface FlowCard {
  title: string
  desc: string
  metric: string
}

interface ResultCard {
  type: string
  title: string
  items: string[]
}

interface ConsoleLog {
  text: string
  full: string
  color: string
  done: boolean
}

interface AchievementToast {
  key: number
  name: string
  role: string
  color: string
  icon: AgentIcon
}

const router = useRouter()
const activeIndex = ref(0)
const manualStepView = ref<number | null>(null)
const consoleLogs = ref<ConsoleLog[]>([])
const achievementToast = ref<AchievementToast | null>(null)
const justCompleted = ref(false)
const consoleRef = ref<HTMLElement | null>(null)
let timer: number | undefined
let manualTimer: number | undefined
let typingTimer: number | undefined
let toastTimer: number | undefined
let toastKey = 0

const fallbackProfile: LaunchProfile = {
  goal: '操作系统备考冲刺',
  direction: '操作系统',
  deadline: '下周',
  weakPoints: ['PV 操作', '进程同步'],
  preference: ['图解驱动', '例题驱动'],
  dailyTime: '每天 45分钟',
  resourcePreference: ['思维导图', '专项练习'],
  pressure: '高优先级冲刺',
}

const profile = readProfile()

const agentSteps: AgentStep[] = [
  {
    id: 'profile',
    name: 'Profile Agent',
    role: '校准画像证据',
    verb: '正在校准目标、薄弱点与学习节奏',
    output: `确认目标为"${profile.goal}"，优先处理 ${profile.weakPoints.join('、') || '核心薄弱点'}。`,
    log: 'Profile Agent 已将自然语言访谈转成可追踪画像证据。',
    color: '#8b5cf6',
    icon: 'User',
  },
  {
    id: 'planner',
    name: 'Planning Agent',
    role: '拆解学习路径',
    verb: '正在生成分阶段学习路径',
    output: `依据 ${profile.dailyTime || '每天可用时间'} 安排概念补强、例题演练和错因复盘。`,
    log: 'Planning Agent 已生成 3 阶段学习路径和今日任务骨架。',
    color: '#3b82f6',
    icon: 'Guide',
  },
  {
    id: 'resource',
    name: 'Resource Agent',
    role: '匹配多模态资源',
    verb: '正在匹配讲解、练习与可视化资源',
    output: `优先选择 ${profile.resourcePreference.join('、') || '讲解文档、专项练习'}，贴合用户学习偏好。`,
    log: 'Resource Agent 已完成资源筛选，并按薄弱点建立索引。',
    color: '#10b981',
    icon: 'Files',
  },
  {
    id: 'assessment',
    name: 'Assessment Agent',
    role: '生成诊断测评',
    verb: '正在生成首轮诊断题与检查点',
    output: `围绕 ${profile.weakPoints[0] || profile.direction} 设置 5 个测评点，后续用于动态更新画像。`,
    log: 'Assessment Agent 已创建首轮测评和掌握度回写规则。',
    color: '#f59e0b',
    icon: 'Document',
  },
  {
    id: 'tutor',
    name: 'Tutor Agent',
    role: '安排执行入口',
    verb: '正在组合今日任务与学习空间入口',
    output: '学习路径、资源、测评和反馈规则已经合并为一个可执行空间。',
    log: 'Tutor Agent 已完成今日学习任务编排，学习空间可以进入。',
    color: '#ec4899',
    icon: 'ChatDotRound',
  },
]

const completed = computed(() => activeIndex.value >= agentSteps.length)
const visibleStep = computed<AgentStep | null>(() => {
  if (manualStepView.value !== null) return agentSteps[manualStepView.value] || null
  if (completed.value) return null
  return agentSteps[activeIndex.value] || null
})
const activeStep = computed(() => (completed.value ? null : agentSteps[activeIndex.value]))
const progress = computed(() => {
  if (completed.value) return 100
  return Math.min(96, Math.round(((activeIndex.value + 0.35) / agentSteps.length) * 100))
})
const progressRounded = computed(() => Math.round(progressDisplay.value))
const unlockedResultIndex = computed(() => Math.max(0, activeIndex.value - 1))

const currentAgentColor = computed(() => {
  if (completed.value) return 'var(--primary-color, #0bb7aa)'
  return agentSteps[activeIndex.value]?.color || 'var(--primary-color, #0bb7aa)'
})

const auroraHue = computed(() => {
  // 随 activeIndex 从 220 (蓝紫) 渐变到 160 (青绿)
  if (completed.value) return 160
  const t = activeIndex.value / agentSteps.length
  return Math.round(220 - t * 60)
})

// ===== 动态 H1 与副标题 =====
const headlineMap: Array<{ h1: string; sub: string }> = [
  {
    h1: 'Profile Agent 正在校准你的画像证据',
    sub: '系统正在把你的目标、薄弱点和节奏转成结构化证据。',
  },
  {
    h1: 'Planning Agent 正在拆解学习路径',
    sub: '依据可用时间，生成 3 阶段路径与今日任务骨架。',
  },
  {
    h1: 'Resource Agent 正在匹配多模态资源',
    sub: '按薄弱点筛选讲解、练习与复盘材料。',
  },
  {
    h1: 'Assessment Agent 正在生成诊断测评',
    sub: '围绕核心薄弱点设置 5 个检查点，用于回写画像。',
  },
  {
    h1: 'Tutor Agent 正在组合执行入口',
    sub: '路径、资源、测评与今日任务合并为可执行空间。',
  },
  {
    h1: '学习空间已就绪',
    sub: '路径、资源、测评与今日任务已经组合为可执行学习空间。',
  },
]

const currentHeadline = computed(() => headlineMap[Math.min(activeIndex.value, headlineMap.length - 1)].h1)
const currentSubtitle = computed(() => headlineMap[Math.min(activeIndex.value, headlineMap.length - 1)].sub)

const workbenchLabel = computed(() => {
  if (manualStepView.value !== null) return '回看产物'
  if (completed.value) return '交付清单'
  return '当前产物'
})

// ===== Count-up 数字 =====
const weakPointCount = useCountUp(() => profile.weakPoints.length || 2)
const preferenceCount = useCountUp(() => profile.preference.length + profile.resourcePreference.length || 4)
const stageCount = useCountUp(() => 3)
const taskCount = useCountUp(() => 4)
const resourceCount = useCountUp(() => 6)
const quizCount = useCountUp(() => 5)
const progressDisplay = useCountUp(() => progress.value)

const evidenceStats = computed(() => [
  { label: '薄弱点', value: `${Math.round(weakPointCount.value)} 个` },
  { label: '偏好信号', value: `${Math.round(preferenceCount.value)} 条` },
  { label: '日程约束', value: profile.dailyTime || '45 分钟' },
])

const completionStats = computed(() => [
  { label: '阶段路径', value: `${Math.round(stageCount.value)}` },
  { label: '今日任务', value: `${Math.round(taskCount.value)}` },
  { label: '推荐资源', value: `${Math.round(resourceCount.value)}` },
  { label: '诊断题', value: `${Math.round(quizCount.value)}` },
])

const profileItems = computed(() => [
  { label: '学习方向', value: profile.direction || '待确认方向' },
  { label: '截止时间', value: profile.deadline || '按阶段推进' },
  { label: '时间节奏', value: profile.dailyTime || '每天 30-60 分钟' },
  { label: '紧急程度', value: profile.pressure || '常规推进' },
])

const profileTags = computed(() => [
  ...profile.weakPoints,
  ...profile.preference,
  ...profile.resourcePreference,
].filter(Boolean).slice(0, 8))

const profileReadiness = computed(() => {
  const fields = [
    profile.goal,
    profile.direction,
    profile.deadline,
    profile.dailyTime,
    profile.pressure,
    profile.weakPoints.length,
    profile.preference.length,
    profile.resourcePreference.length,
  ]
  return Math.round((fields.filter(Boolean).length / fields.length) * 100)
})

const profileReadinessDisplay = useCountUp(() => profileReadiness.value)

const flowCards: FlowCard[] = [
  { title: '画像证据', desc: '抽取目标、薄弱点、时间和偏好', metric: '输入已结构化' },
  { title: '路径规划', desc: '把目标拆成可执行学习阶段', metric: '生成 3 阶段' },
  { title: '资源匹配', desc: '按薄弱点选择讲解、练习和复盘材料', metric: '筛选 6 项' },
  { title: '诊断测评', desc: '用检查点验证掌握度并回写画像', metric: '创建 5 题' },
  { title: '执行空间', desc: '组合任务、资源、反馈和下一步入口', metric: '可立即开始' },
]

const activeArtifacts = computed(() => {
  const idx = manualStepView.value !== null ? manualStepView.value : activeIndex.value
  if (completed.value && manualStepView.value === null) {
    return [
      { label: '首个任务', value: `${profile.weakPoints[0] || profile.direction} 概念补强` },
      { label: '推荐资源', value: profile.resourcePreference[0] || '思维导图' },
      { label: '测评入口', value: `${profile.weakPoints[0] || '核心薄弱点'}专项检查` },
      { label: '反馈规则', value: '测评后自动更新画像' },
    ]
  }

  const current = agentSteps[idx]?.id
  const artifactMap: Record<string, Array<{ label: string; value: string }>> = {
    profile: [
      { label: '目标', value: profile.goal },
      { label: '薄弱点', value: profile.weakPoints.slice(0, 2).join('、') || '核心概念' },
      { label: '偏好', value: profile.preference.join('、') || '图解驱动' },
      { label: '可用时间', value: profile.dailyTime || '每天 45分钟' },
    ],
    planner: [
      { label: '阶段 1', value: '概念模型补强' },
      { label: '阶段 2', value: '典型例题演练' },
      { label: '阶段 3', value: '错因复盘巩固' },
      { label: '节奏', value: profile.dailyTime || '每天 45分钟' },
    ],
    resource: [
      { label: '讲解', value: `${profile.weakPoints[0] || profile.direction} 可视化讲义` },
      { label: '练习', value: `${profile.weakPoints[1] || '核心考点'}专项题组` },
      { label: '复盘', value: '错题原因标签模板' },
      { label: '形式', value: profile.resourcePreference.join('、') || '讲解文档、专项练习' },
    ],
    assessment: [
      { label: '题量', value: '5 道诊断题' },
      { label: '范围', value: profile.weakPoints.slice(0, 2).join('、') || profile.direction },
      { label: '判定', value: '掌握度 + 错因' },
      { label: '回写', value: '更新成长画像' },
    ],
    tutor: [
      { label: '今日任务', value: '4 个可执行步骤' },
      { label: '学习入口', value: '讲解 + 练习 + 反馈' },
      { label: '下一步', value: '进入专属空间' },
      { label: '状态', value: '准备完成' },
    ],
  }

  return artifactMap[current] || artifactMap.profile
})

const resultCards = computed<ResultCard[]>(() => [
  {
    type: '学习路径',
    title: `${profile.direction || '核心课程'}三阶段路径`,
    items: ['概念模型补强', '典型例题演练', '错题复盘巩固'],
  },
  {
    type: '今日任务',
    title: `${profile.dailyTime || '45分钟'}冲刺任务`,
    items: [
      `${profile.weakPoints[0] || '核心概念'}快速讲解`,
      `${profile.weakPoints[1] || '典型题'}专项练习`,
      '完成首轮诊断并记录错因',
    ],
  },
  {
    type: '资源推荐',
    title: profile.resourcePreference.join(' + ') || '讲解文档 + 专项练习',
    items: [
      `${profile.weakPoints[0] || profile.direction}可视化讲义`,
      `${profile.weakPoints[1] || '高频考点'}专项题组`,
      '个人错题复盘模板',
    ],
  },
  {
    type: '诊断测评',
    title: `${profile.weakPoints[0] || '核心薄弱点'}专项检查`,
    items: ['5 道诊断题', '掌握度即时计算', '错因自动回写画像'],
  },
])

function resultAgentColor(index: number): string {
  // 每张结果卡对应一个 Agent 色
  return agentSteps[index + 1]?.color || agentSteps[index]?.color || '#0bb7aa'
}

// ===== 知识图谱节点 =====
const kgNodes = [
  { name: '画像', x: 30, y: 35, color: '#8b5cf6', icon: '👤' },
  { name: '路径', x: 90, y: 90, color: '#3b82f6', icon: '🧭' },
  { name: '资源', x: 150, y: 35, color: '#10b981', icon: '📚' },
  { name: '测评', x: 210, y: 90, color: '#f59e0b', icon: '✎' },
  { name: '执行', x: 250, y: 35, color: '#ec4899', icon: '⚡' },
]

const kgEdges = [
  { path: 'M 44 35 Q 60 60 76 76', color: '#3b82f6' }, // 画像->路径
  { path: 'M 104 76 Q 120 50 136 40', color: '#10b981' }, // 路径->资源
  { path: 'M 164 40 Q 180 60 196 76', color: '#f59e0b' }, // 资源->测评
  { path: 'M 224 76 Q 235 50 244 40', color: '#ec4899' }, // 测评->执行
  { path: 'M 196 90 C 130 130, 60 130, 30 50', color: '#8b5cf6' }, // 测评->画像 回写
]

const kgReadyCount = computed(() => Math.min(activeIndex.value + 1, kgNodes.length))

function stepStatus(index: number): 'done' | 'running' | 'waiting' {
  if (index < activeIndex.value || completed.value) return 'done'
  if (index === activeIndex.value) return 'running'
  return 'waiting'
}

function selectAgent(index: number) {
  if (stepStatus(index) !== 'done') return
  manualStepView.value = index
  if (manualTimer) window.clearTimeout(manualTimer)
  manualTimer = window.setTimeout(() => {
    manualStepView.value = null
  }, 5000)
}

function readProfile(): LaunchProfile {
  try {
    const raw = window.sessionStorage.getItem('smartorder:spaceLaunchProfile')
    if (!raw) return fallbackProfile
    return { ...fallbackProfile, ...JSON.parse(raw) }
  } catch {
    return fallbackProfile
  }
}

function goDashboard() {
  const spaceStore = useLearningSpaceStore()
  const firstSpace = spaceStore.activeSpaces[0]
  if (firstSpace) {
    router.push(`/space/${firstSpace.id}`)
  } else {
    router.push('/dashboard')
  }
}

// ===== 打字机日志 =====
function pushLog(step: AgentStep) {
  consoleLogs.value.push({
    text: '',
    full: step.log,
    color: step.color,
    done: false,
  })
}

function startTypingIfNeeded() {
  if (typingTimer) return
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const pending = consoleLogs.value.find(l => !l.done)
  if (!pending) return

  if (prefersReduced) {
    // 直接显示完整文本
    consoleLogs.value.forEach(l => {
      l.text = l.full
      l.done = true
    })
    return
  }

  typingTimer = window.setInterval(() => {
    const log = consoleLogs.value.find(l => !l.done)
    if (!log) {
      if (typingTimer) window.clearInterval(typingTimer)
      typingTimer = undefined
      return
    }
    if (log.text.length < log.full.length) {
      log.text = log.full.slice(0, log.text.length + 1)
    } else {
      log.done = true
    }
  }, 28)
}

// ===== 成就 Toast =====
function showAchievement(step: AgentStep) {
  if (toastTimer) window.clearTimeout(toastTimer)
  achievementToast.value = {
    key: ++toastKey,
    name: step.name,
    role: step.role,
    color: step.color,
    icon: step.icon,
  }
  toastTimer = window.setTimeout(() => {
    achievementToast.value = null
  }, 2800)
}

// ===== 监听 activeIndex 推进日志与 toast =====
// 语义：activeIndex = N 表示步骤 N 正在运行；从 prev -> next 时，
// 步骤 prev..next-1 已完成（触发成就 toast），步骤 prev+1..next 新开始（推送日志）
watch(activeIndex, (next, prev) => {
  for (let i = prev + 1; i <= next && i < agentSteps.length; i++) {
    pushLog(agentSteps[i])
  }
  for (let i = prev; i < next && i < agentSteps.length; i++) {
    showAchievement(agentSteps[i])
  }
  if (next >= agentSteps.length && !justCompleted.value) {
    justCompleted.value = true
    window.setTimeout(() => {
      justCompleted.value = false
    }, 1200)
  }
  startTypingIfNeeded()
})

// 控制台滚动到底
watch(consoleLogs, async () => {
  await nextTick()
  if (consoleRef.value) {
    consoleRef.value.scrollTop = consoleRef.value.scrollHeight
  }
}, { deep: true })

onMounted(() => {
  // 初始日志（第一条立即推送）
  pushLog(agentSteps[0])
  startTypingIfNeeded()

  timer = window.setInterval(() => {
    if (activeIndex.value >= agentSteps.length) {
      if (timer) window.clearInterval(timer)
      return
    }
    activeIndex.value += 1
  }, 1150)
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
  if (manualTimer) window.clearTimeout(manualTimer)
  if (typingTimer) window.clearInterval(typingTimer)
  if (toastTimer) window.clearTimeout(toastTimer)
})
</script>

<style scoped>
.launch-page {
  height: 100vh;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  background: #f6f8fb;
  color: #0f172a;
}

.launch-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(15, 23, 42, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(15, 23, 42, 0.05) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), transparent 82%);
}

.bg-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 15% 12%, rgba(11, 183, 170, 0.2), transparent 30%),
    radial-gradient(circle at 82% 8%, rgba(6, 182, 212, 0.16), transparent 28%),
    linear-gradient(135deg, #f8fafc 0%, #eef6f8 52%, #f7fbff 100%);
}

.bg-aurora {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    hsl(var(--aurora-hue, 220), 80%, 60%) 0%,
    hsl(calc(var(--aurora-hue, 220) + 30), 75%, 65%) 50%,
    hsl(calc(var(--aurora-hue, 220) + 60), 70%, 60%) 100%
  );
  opacity: 0.08;
  mix-blend-mode: multiply;
  transition: opacity 1.2s ease;
}

.launch-page.completed .bg-aurora {
  animation: aurora-flash 1.2s ease-out;
}

@keyframes aurora-flash {
  0% { opacity: 0.08; }
  30% { opacity: 0.22; }
  100% { opacity: 0.12; }
}

.launch-shell {
  position: relative;
  z-index: 1;
  width: min(1460px, calc(100% - 48px));
  margin: 0 auto;
  padding: 28px 0;
}

.launch-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 20px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  color: var(--primary-hover, #0a9e94);
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.launch-header h1 {
  margin: 4px 0 8px;
  color: var(--text-dark, #0f172a);
  font-size: clamp(1.8rem, 3vw, 2.8rem);
  line-height: 1.08;
  letter-spacing: 0;
}

.launch-header h1 .headline-text {
  display: inline-block;
}

.launch-header p {
  max-width: 780px;
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 0.98rem;
  line-height: 1.7;
}

.launch-header p .subtitle-text {
  display: inline-block;
}

/* H1/副标题切换过渡 */
.headline-swap-enter-active,
.headline-swap-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.headline-swap-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.headline-swap-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.primary-btn {
  min-height: 42px;
  border-radius: 13px;
  font-size: 0.86rem;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.18s ease, opacity 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.launch-grid {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr) 360px;
  gap: 18px;
  align-items: stretch;
}

.profile-snapshot,
.agent-orchestration,
.result-preview {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: var(--radius-2xl, 22px);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: var(--shadow-xl, 0 18px 46px rgba(15, 23, 42, 0.08));
  backdrop-filter: blur(18px);
}

.profile-snapshot,
.result-preview {
  padding: 18px;
}

.section-head {
  margin-bottom: 16px;
}

.section-head h2,
.orchestration-head h2 {
  margin: 2px 0 0;
  color: var(--text-dark, #0f172a);
  font-size: 1.08rem;
  line-height: 1.35;
}

.snapshot-list {
  display: grid;
  gap: 10px;
}

.snapshot-item {
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 14px;
  background: #f8fafc;
}

.snapshot-item span {
  display: block;
  color: var(--text-secondary, #64748b);
  font-size: 0.74rem;
  font-weight: 700;
}

.snapshot-item strong {
  display: block;
  margin-top: 4px;
  color: var(--text-dark, #0f172a);
  font-size: 0.88rem;
  line-height: 1.4;
}

.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}

.tag-group span {
  padding: 5px 9px;
  border-radius: 999px;
  background: #ecfdfb;
  color: var(--primary-hover, #0a9e94);
  font-size: 0.76rem;
  font-weight: 800;
}

.evidence-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 14px;
}

.evidence-strip div {
  min-width: 0;
  padding: 10px 8px;
  border-radius: 13px;
  border: 1px solid rgba(6, 182, 212, 0.18);
  background: #f0f9ff;
}

.evidence-strip strong,
.evidence-strip span {
  display: block;
}

.evidence-strip strong {
  color: var(--accent-hover, #0891b2);
  font-size: 0.86rem;
  line-height: 1.25;
}

.evidence-strip span {
  margin-top: 3px;
  color: var(--text-secondary, #64748b);
  font-size: 0.68rem;
  font-weight: 800;
}

/* ===== 知识图谱 mini ===== */
.kg-mini {
  margin-bottom: 14px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  overflow: hidden;
}

.kg-mini-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.kg-mini-head .eyebrow {
  color: #5cd9d0;
}

.kg-mini-head small {
  color: #94a3b8;
  font-size: 0.7rem;
  font-weight: 700;
}

.kg-mini-svg {
  width: 100%;
  height: 130px;
  display: block;
}

.kg-edge {
  fill: none;
  stroke-width: 1.5;
  stroke-dasharray: 200;
  stroke-dashoffset: 200;
  opacity: 0;
  transition: stroke-dashoffset 0.8s ease, opacity 0.4s ease;
}

.kg-edge.shown {
  stroke-dashoffset: 0;
  opacity: 0.65;
}

.kg-node {
  opacity: 0;
  transform-origin: center;
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.kg-node circle {
  transition: filter 0.3s ease;
}

.kg-node.shown {
  opacity: 1;
}

.kg-node.active circle {
  animation: kg-pulse 1.6s ease-in-out infinite;
}

@keyframes kg-pulse {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.18); filter: brightness(1.3); }
}

.kg-node-icon {
  text-anchor: middle;
  fill: white;
  font-size: 12px;
  font-weight: 700;
  pointer-events: none;
  user-select: none;
}

.kg-node-label {
  text-anchor: middle;
  fill: #cbd5e1;
  font-size: 9px;
  font-weight: 700;
  pointer-events: none;
  user-select: none;
}

.signal-card {
  padding: 14px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f8fafc, #ecfdfb);
  border: 1px solid rgba(11, 183, 170, 0.16);
}

.signal-line {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: #334155;
  font-size: 0.8rem;
  font-weight: 800;
}

.signal-track {
  height: 8px;
  margin: 10px 0;
  overflow: hidden;
  border-radius: 999px;
  background: #dbeafe;
}

.signal-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--primary-color, #0bb7aa), var(--accent-color, #06b6d4));
  transition: width 0.6s ease;
}

.agent-orchestration {
  min-width: 0;
  padding: 18px;
}

.orchestration-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  margin-bottom: 14px;
}

/* ===== 进度环升级 ===== */
.progress-chip {
  width: 110px;
  height: 110px;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: conic-gradient(
    var(--agent-color, var(--primary-color, #0bb7aa)) var(--progress, 240deg),
    rgba(148, 163, 184, 0.2) 0deg
  );
  box-shadow: inset 0 0 0 8px white, 0 8px 24px rgba(15, 23, 42, 0.08);
  transition: background 0.4s ease;
}

.progress-chip::before {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg, transparent 38deg,
    rgba(148, 163, 184, 0.3) 38deg, rgba(148, 163, 184, 0.3) 45deg,
    transparent 45deg
  );
  background-size: 100% 100%;
  -webkit-mask: radial-gradient(circle, transparent 56%, black 58%, black 60%, transparent 62%);
  mask: radial-gradient(circle, transparent 56%, black 58%, black 60%, transparent 62%);
}

.progress-chip.bursting::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid var(--agent-color, var(--primary-color, #0bb7aa));
  animation: shockwave 600ms ease-out forwards;
}

@keyframes shockwave {
  0% { transform: scale(1); opacity: 0.85; }
  100% { transform: scale(2.2); opacity: 0; }
}

.chip-inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 86px;
  height: 86px;
  border-radius: 50%;
  background: white;
}

.chip-inner strong {
  color: var(--text-dark, #0f172a);
  font-size: 1.4rem;
  line-height: 1;
}

.chip-inner span {
  margin-top: 4px;
  color: var(--text-secondary, #64748b);
  font-size: 0.68rem;
  font-weight: 800;
}

.completion-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
  padding: 10px;
  border-radius: 16px;
  border: 1px solid rgba(11, 183, 170, 0.2);
  background:
    linear-gradient(135deg, rgba(236, 253, 251, 0.9), rgba(240, 249, 255, 0.9)),
    #ffffff;
}

.completion-summary div {
  min-width: 0;
  padding: 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.78);
}

.completion-summary strong,
.completion-summary span {
  display: block;
  text-align: center;
}

.completion-summary strong {
  color: var(--primary-deep, #0f766e);
  font-size: 1.28rem;
  line-height: 1;
}

.completion-summary span {
  margin-top: 6px;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 800;
}

/* ===== Agent 节点 ===== */
.agent-flow {
  position: relative;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.flow-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: visible;
}

.flow-line {
  stroke-width: 2;
  stroke-dasharray: 4 4;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.flow-line.done {
  stroke-dasharray: none;
  opacity: 0.85;
}

.flow-line.running {
  stroke-dasharray: 4 4;
  opacity: 1;
  animation: flow-dash 0.8s linear infinite;
}

.flow-line.waiting {
  opacity: 0.25;
}

@keyframes flow-dash {
  to { stroke-dashoffset: -8; }
}

.agent-node {
  min-height: 112px;
  position: relative;
  z-index: 1;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: #f8fafc;
  transition: background 0.22s ease, border-color 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease;
}

.agent-node.done,
.agent-node.running {
  border-color: color-mix(in srgb, var(--agent-color) 35%, transparent);
  background: linear-gradient(135deg, #ffffff, color-mix(in srgb, var(--agent-color) 12%, #ffffff));
}

.agent-node.running {
  transform: translateY(-3px);
  box-shadow: 0 14px 26px color-mix(in srgb, var(--agent-color) 25%, transparent);
  animation: agent-breathe 2.4s ease-in-out infinite;
}

@keyframes agent-breathe {
  0%, 100% { box-shadow: 0 14px 26px color-mix(in srgb, var(--agent-color) 22%, transparent); }
  50% { box-shadow: 0 18px 36px color-mix(in srgb, var(--agent-color) 38%, transparent); }
}

.agent-node.hoverable {
  cursor: pointer;
}

.agent-node.hoverable:hover {
  transform: translateY(-2px);
  border-color: var(--agent-color);
}

.node-icon {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  border-radius: 12px;
  background: #e2e8f0;
  color: #64748b;
  font-weight: 900;
  font-size: 16px;
  transition: background 0.22s ease, color 0.22s ease, transform 0.22s ease;
}

.agent-node.done .node-icon,
.agent-node.running .node-icon {
  background: linear-gradient(135deg, var(--agent-color), color-mix(in srgb, var(--agent-color) 60%, white));
  color: white;
  transform: scale(1.05);
}

.agent-node.running .node-icon {
  animation: icon-spin-pulse 2s ease-in-out infinite;
}

@keyframes icon-spin-pulse {
  0%, 100% { transform: scale(1.05); }
  50% { transform: scale(1.18); }
}

.agent-node strong {
  display: block;
  color: var(--text-dark, #0f172a);
  font-size: 0.86rem;
  line-height: 1.25;
}

.agent-node p {
  margin: 5px 0 0;
  color: var(--text-secondary, #64748b);
  font-size: 0.74rem;
  line-height: 1.45;
}

/* Hover tooltip */
.node-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  width: max-content;
  max-width: 220px;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--text-dark, #0f172a);
  color: white;
  font-size: 0.72rem;
  line-height: 1.45;
  opacity: 0;
  pointer-events: none;
  z-index: 10;
  transition: opacity 0.18s ease, transform 0.18s ease;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.25);
}

.node-tooltip strong {
  display: block;
  color: white;
  font-size: 0.74rem;
  margin-bottom: 3px;
}

.node-tooltip em {
  color: #94a3b8;
  font-style: normal;
  font-size: 0.7rem;
}

.agent-node:hover .node-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.closed-loop {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.loop-card {
  min-height: 112px;
  position: relative;
  padding: 12px;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: #ffffff;
  transition: border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease;
}

.loop-card::after {
  content: '';
  position: absolute;
  left: 44px;
  right: -18px;
  top: 26px;
  height: 2px;
  background: linear-gradient(90deg, rgba(11, 183, 170, 0.24), transparent);
}

.loop-card.done,
.loop-card.active {
  border-color: rgba(11, 183, 170, 0.28);
  background: linear-gradient(135deg, #ffffff, #f0fdfa);
}

.loop-card.active {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(11, 183, 170, 0.12);
}

.loop-index {
  width: 28px;
  height: 28px;
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  border-radius: 10px;
  background: #e0f2fe;
  color: var(--accent-hover, #0891b2);
  font-size: 0.78rem;
  font-weight: 900;
}

.loop-card.done .loop-index,
.loop-card.active .loop-index {
  background: linear-gradient(135deg, var(--primary-color, #0bb7aa), var(--accent-color, #06b6d4));
  color: white;
}

.loop-card strong,
.loop-card p,
.loop-card small {
  display: block;
  position: relative;
  z-index: 1;
}

.loop-card strong {
  color: var(--text-dark, #0f172a);
  font-size: 0.86rem;
  line-height: 1.3;
}

.loop-card p {
  min-height: 38px;
  margin: 5px 0 8px;
  color: var(--text-secondary, #64748b);
  font-size: 0.72rem;
  line-height: 1.45;
}

.loop-card small {
  color: var(--primary-hover, #0a9e94);
  font-size: 0.7rem;
  font-weight: 900;
}

.workbench {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 14px;
}

.workbench-main,
.console-panel {
  min-height: 248px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.workbench-main {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(236, 253, 251, 0.88), rgba(239, 246, 255, 0.78)),
    #ffffff;
}

.workbench-title span {
  display: inline-flex;
  margin-bottom: 8px;
  color: var(--primary-hover, #0a9e94);
  font-size: 0.72rem;
  font-weight: 900;
  white-space: nowrap;
}

.workbench-main h3 {
  margin: 0 0 10px;
  color: var(--text-dark, #0f172a);
  font-size: 1.22rem;
  line-height: 1.35;
}

.workbench-main p {
  margin: 0;
  color: #475569;
  font-size: 0.92rem;
  line-height: 1.7;
}

.artifact-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.artifact-item {
  min-height: 66px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(6, 182, 212, 0.14);
  background: rgba(255, 255, 255, 0.78);
}

.artifact-item span,
.artifact-item strong {
  display: block;
}

.artifact-item span {
  color: var(--text-secondary, #64748b);
  font-size: 0.72rem;
  font-weight: 800;
}

.artifact-item strong {
  margin-top: 5px;
  color: var(--text-dark, #0f172a);
  font-size: 0.84rem;
  line-height: 1.4;
}

/* ===== 控制台打字机 ===== */
.console-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: #0f172a;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #334155 transparent;
}

.console-panel::-webkit-scrollbar {
  width: 6px;
}
.console-panel::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 3px;
}

.console-line {
  display: flex;
  gap: 9px;
  align-items: flex-start;
}

.console-line span {
  width: 7px;
  height: 7px;
  margin-top: 8px;
  flex-shrink: 0;
  border-radius: 50%;
}

.console-line p {
  margin: 0;
  color: #dbeafe;
  font-size: 0.78rem;
  line-height: 1.6;
  font-family: 'SF Mono', 'Cascadia Code', Consolas, monospace;
}

.caret {
  display: inline-block;
  color: var(--primary-color, #0bb7aa);
  animation: blink 1s steps(2) infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  50.01%, 100% { opacity: 0; }
}

.result-preview {
  display: flex;
  flex-direction: column;
}

.result-list {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}

.result-card {
  position: relative;
  padding: 11px 13px;
  border-radius: 15px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background:
    linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.6) 37%, rgba(255,255,255,0.05) 63%);
  background-size: 400% 100%;
  opacity: 0.5;
  transform: translateY(4px);
  transition: opacity 0.22s ease, transform 0.22s ease, background 0.5s ease, border-color 0.22s ease, box-shadow 0.22s ease;
  transition-delay: calc(var(--i, 0) * 60ms);
}

.result-card:not(.visible) {
  animation: skeleton-sweep 1.8s ease-in-out infinite;
  min-height: 84px;
}

@keyframes skeleton-sweep {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

.result-card.visible {
  opacity: 1;
  transform: translateY(0);
  border-color: color-mix(in srgb, var(--agent-color, #0bb7aa) 30%, transparent);
  background: linear-gradient(135deg, #ffffff, color-mix(in srgb, var(--agent-color, #0bb7aa) 8%, #ffffff));
  animation: flip-reveal 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes flip-reveal {
  0% { transform: rotateY(90deg) translateY(8px); opacity: 0; }
  100% { transform: rotateY(0) translateY(0); opacity: 1; }
}

.result-card.visible:hover {
  transform: translateY(-3px);
  border-color: var(--agent-color, #0bb7aa);
  box-shadow: 0 12px 24px color-mix(in srgb, var(--agent-color, #0bb7aa) 22%, transparent);
}

.new-badge {
  position: absolute;
  top: -6px;
  right: 8px;
  padding: 3px 7px;
  border-radius: 999px;
  background: linear-gradient(135deg, #f59e0b, #ec4899);
  color: white;
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  box-shadow: 0 4px 10px rgba(236, 72, 153, 0.4);
  animation: badge-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes badge-pop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

.result-card-head span {
  color: var(--primary-hover, #0a9e94);
  font-size: 0.72rem;
  font-weight: 900;
}

.result-card-head strong {
  display: block;
  margin-top: 4px;
  color: var(--text-dark, #0f172a);
  font-size: 0.88rem;
  line-height: 1.25;
}

.result-card ul {
  display: grid;
  gap: 4px;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.result-card li {
  position: relative;
  padding-left: 15px;
  color: #475569;
  font-size: 0.72rem;
  line-height: 1.32;
}

.result-card li::before {
  content: '';
  width: 6px;
  height: 6px;
  position: absolute;
  left: 0;
  top: 0.55em;
  border-radius: 50%;
  background: var(--agent-color, var(--primary-color, #0bb7aa));
}

.primary-btn {
  width: 100%;
  margin: 0 0 14px;
  border: 0;
  background: linear-gradient(135deg, var(--primary-color, #0bb7aa), var(--accent-color, #06b6d4));
  color: white;
  box-shadow: 0 14px 28px rgba(11, 183, 170, 0.24);
}

.primary-btn:disabled {
  cursor: not-allowed;
  opacity: 0.48;
  box-shadow: none;
}

.primary-btn:not(:disabled):hover {
  transform: translateY(-1px);
}

.primary-btn.cta-pulse {
  animation: cta-pulse 1s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 0 30px rgba(11, 183, 170, 0.5), 0 14px 28px rgba(11, 183, 170, 0.32);
}

@keyframes cta-pulse {
  0% { transform: scale(1); }
  40% { transform: scale(1.04); }
  100% { transform: scale(1); }
}

/* ===== Achievement Toast ===== */
.achievement-toast {
  position: fixed;
  top: 28px;
  right: 28px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px 12px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(14px);
  min-width: 240px;
}

.toast-icon {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
}

.toast-body {
  flex: 1;
  min-width: 0;
}

.toast-body strong {
  display: block;
  color: var(--text-dark, #0f172a);
  font-size: 0.86rem;
  line-height: 1.2;
}

.toast-body p {
  margin: 2px 0 0;
  color: var(--text-secondary, #64748b);
  font-size: 0.72rem;
  line-height: 1.3;
}

.toast-check {
  color: #10b981;
  font-size: 1.1rem;
  font-weight: 900;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.95);
}

/* ===== 降级：减少动效 ===== */
@media (prefers-reduced-motion: reduce) {
  .agent-node.running,
  .agent-node.running .node-icon,
  .loop-card.active,
  .progress-chip.bursting::after,
  .bg-aurora,
  .flow-line.running,
  .kg-node.active circle,
  .caret,
  .result-card:not(.visible),
  .launch-page.completed .bg-aurora {
    animation: none !important;
  }
  .result-card {
    transition: none !important;
  }
}

@media (max-width: 1220px) {
  .launch-grid {
    grid-template-columns: 1fr;
  }

  .workbench {
    grid-template-columns: minmax(0, 1fr);
  }

  .workbench-main {
    grid-template-columns: minmax(0, 0.85fr) minmax(260px, 1.15fr);
  }

  .profile-snapshot,
  .result-preview {
    display: block;
  }

  .snapshot-list,
  .result-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .launch-shell {
    width: min(100% - 28px, 1460px);
    padding: 18px 0;
  }

  .launch-header {
    flex-direction: column;
  }

  .agent-flow,
  .closed-loop,
  .snapshot-list,
  .result-list,
  .completion-summary {
    grid-template-columns: 1fr;
  }

  .workbench-main {
    grid-template-columns: 1fr;
  }

  .artifact-grid,
  .evidence-strip {
    grid-template-columns: 1fr;
  }

  .loop-card {
    min-height: auto;
  }

  .achievement-toast {
    top: 12px;
    right: 12px;
    left: 12px;
    min-width: 0;
  }
}
</style>
