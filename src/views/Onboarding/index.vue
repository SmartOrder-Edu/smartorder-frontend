<template>
  <div class="onboarding-page">
    <div class="onboarding-bg">
      <div class="bg-gradient"></div>
      <div class="bg-grid"></div>
    </div>

    <div class="onboarding-shell">
      <header class="onboarding-topbar">
        <div>
          <span class="eyebrow">Profile Agent</span>
          <h1>用一次对话生成你的学习画像</h1>
          <p>描述目标、薄弱点和时间安排，Agent 会实时抽取画像维度并生成可确认的学习档案。</p>
        </div>
        <button class="skip-link" @click="handleSkip">
          稍后完善
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </header>

      <main class="onboarding-workspace">
        <section class="chat-panel">
          <div class="panel-head">
            <div class="agent-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="4" y="6" width="16" height="12" rx="4" />
                <path d="M9 3v3M15 3v3" />
                <circle cx="9" cy="12" r="1" />
                <circle cx="15" cy="12" r="1" />
                <path d="M10 16h4" />
              </svg>
            </div>
            <div>
              <h2>画像 Agent 访谈</h2>
              <p>最多 2-3 轮，先建立初始画像，后续会随学习行为持续更新。</p>
            </div>
          </div>

          <div ref="messageListRef" class="message-list">
            <div v-for="message in messages" :key="message.id" class="message-row" :class="message.role">
              <div class="message-bubble">
                <p>{{ message.text }}</p>
                <div v-if="message.extracted?.length" class="extracted-strip">
                  <span v-for="item in message.extracted" :key="item.dimension + item.value">
                    已识别：{{ item.dimension }} / {{ item.value }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="agentTyping" class="message-row agent">
              <div class="message-bubble typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>

          <div class="quick-prompts">
            <button
              v-for="prompt in quickPrompts"
              :key="prompt"
              type="button"
              @click="sendQuickPrompt(prompt)"
            >
              {{ prompt }}
            </button>
          </div>

          <form class="composer" @submit.prevent="sendMessage()">
            <textarea
              v-model="inputText"
              rows="1"
              placeholder="例如：我下周要考操作系统，PV 操作总是错，每天只有 45 分钟，喜欢图解和例题"
              @keydown.enter.exact.prevent="sendMessage()"
            ></textarea>
            <button type="submit" :disabled="!inputText.trim() || agentTyping">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </section>

        <aside class="profile-panel">
          <div class="profile-card draft-card">
            <div class="card-head">
              <div>
                <span class="eyebrow">实时画像草稿</span>
                <h2>{{ profileTitle }}</h2>
              </div>
              <div class="readiness-ring" :style="readinessStyle">
                <strong>{{ readinessPercent }}%</strong>
              </div>
            </div>

            <div class="dimension-list">
              <div
                v-for="dimension in dimensions"
                :key="dimension.key"
                class="dimension-item"
                :class="{ filled: dimension.filled }"
              >
                <div class="dimension-main">
                  <span class="dimension-icon" v-html="dimension.icon"></span>
                  <div>
                    <strong>{{ dimension.label }}</strong>
                    <p>{{ dimension.value || dimension.emptyText }}</p>
                  </div>
                </div>
                <span class="dimension-confidence" v-if="dimension.filled">
                  {{ dimension.confidence }}%
                </span>
              </div>
            </div>
          </div>

          <div class="profile-card evidence-card">
            <div class="card-title-row">
              <h3>抽取证据</h3>
              <span>{{ evidenceList.length }} 条</span>
            </div>
            <div v-if="evidenceList.length" class="evidence-list">
              <div v-for="item in evidenceList" :key="item.dimension + item.value + item.evidence" class="evidence-item">
                <strong>{{ item.dimension }}：{{ item.value }}</strong>
                <p>来自“{{ item.evidence }}”</p>
              </div>
            </div>
            <div v-else class="empty-evidence">
              Agent 会把你的自然语言转成可追踪的画像证据。
            </div>
          </div>

          <div class="profile-card confirm-card">
            <div class="card-title-row">
              <h3>{{ readyToConfirm ? '可以生成初始画像' : '还需要补充的信息' }}</h3>
              <span>{{ filledDimensionCount }}/{{ dimensions.length }}</span>
            </div>

            <div v-if="missingSlots.length" class="missing-list">
              <span v-for="slot in missingSlots" :key="slot">{{ slot }}</span>
            </div>
            <p v-else class="ready-copy">
              已具备生成画像所需的核心维度，可以保存后进入总学习指挥台。
            </p>

            <div class="confirm-actions">
              <button class="secondary-btn" type="button" @click="addAgentNudge">
                让 Agent 追问
              </button>
              <button class="primary-btn" type="button" :disabled="!readyToConfirm || loading" @click="handleComplete">
                <span v-if="loading">保存中...</span>
                <span v-else>确认画像，开始学习</span>
              </button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { studentProfileApi } from '@/api/studentProfile'

interface ExtractedItem {
  dimension: string
  value: string
  evidence: string
  confidence: number
}

interface ChatMessage {
  id: string
  role: 'agent' | 'user'
  text: string
  extracted?: ExtractedItem[]
}

interface ProfileDraft {
  identity: string
  grade: string
  direction: string
  goal: string
  deadline: string
  weakPoints: string[]
  preference: string[]
  dailyTime: string
  level: string
  resourcePreference: string[]
  pressure: string
}

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const agentTyping = ref(false)
const inputText = ref('')
const messageListRef = ref<HTMLElement | null>(null)
const evidenceList = ref<ExtractedItem[]>([])

const profileDraft = reactive<ProfileDraft>({
  identity: '',
  grade: '',
  direction: '',
  goal: '',
  deadline: '',
  weakPoints: [],
  preference: [],
  dailyTime: '',
  level: '',
  resourcePreference: [],
  pressure: '',
})

const messages = ref<ChatMessage[]>([
  {
    id: 'agent-welcome',
    role: 'agent',
    text: '最近你最想完成的学习目标是什么？可以顺便说说截止时间、薄弱点、每天可用时间和你喜欢的学习方式。',
  },
])

const quickPrompts = [
  '我下周要考操作系统，PV 操作总是错，每天只有 45 分钟',
  '我想三周内完成 Java 后端项目，基础一般，喜欢代码案例',
  '我准备蓝桥杯，动态规划薄弱，希望多做分层练习',
  '我喜欢图解和例题，不太适合长篇文档',
]

const dimensions = computed(() => [
  {
    key: 'goal',
    label: '近期目标',
    value: joinParts([profileDraft.goal, profileDraft.deadline]),
    emptyText: '等待识别学习目标和截止时间',
    confidence: profileDraft.goal ? 86 : 0,
    filled: Boolean(profileDraft.goal),
    icon: iconTarget,
  },
  {
    key: 'direction',
    label: '学习方向',
    value: profileDraft.direction,
    emptyText: '等待识别课程、考试或项目方向',
    confidence: profileDraft.direction ? 82 : 0,
    filled: Boolean(profileDraft.direction),
    icon: iconBook,
  },
  {
    key: 'weakPoints',
    label: '薄弱点',
    value: profileDraft.weakPoints.join('、'),
    emptyText: '等待识别易错点或卡点',
    confidence: profileDraft.weakPoints.length ? 88 : 0,
    filled: profileDraft.weakPoints.length > 0,
    icon: iconAlert,
  },
  {
    key: 'level',
    label: '知识基础',
    value: profileDraft.level,
    emptyText: '等待识别当前基础水平',
    confidence: profileDraft.level ? 76 : 0,
    filled: Boolean(profileDraft.level),
    icon: iconChart,
  },
  {
    key: 'preference',
    label: '学习偏好',
    value: profileDraft.preference.join('、'),
    emptyText: '等待识别讲解、练习或互动偏好',
    confidence: profileDraft.preference.length ? 80 : 0,
    filled: profileDraft.preference.length > 0,
    icon: iconSpark,
  },
  {
    key: 'dailyTime',
    label: '时间节奏',
    value: profileDraft.dailyTime,
    emptyText: '等待识别每天可用学习时间',
    confidence: profileDraft.dailyTime ? 90 : 0,
    filled: Boolean(profileDraft.dailyTime),
    icon: iconClock,
  },
  {
    key: 'resourcePreference',
    label: '资源偏好',
    value: profileDraft.resourcePreference.join('、'),
    emptyText: '等待识别文档、PPT、题目、代码或视频偏好',
    confidence: profileDraft.resourcePreference.length ? 78 : 0,
    filled: profileDraft.resourcePreference.length > 0,
    icon: iconLayers,
  },
  {
    key: 'pressure',
    label: '紧急程度',
    value: profileDraft.pressure,
    emptyText: '等待识别压力状态和优先级',
    confidence: profileDraft.pressure ? 74 : 0,
    filled: Boolean(profileDraft.pressure),
    icon: iconPulse,
  },
])

const filledDimensionCount = computed(() => dimensions.value.filter(item => item.filled).length)
const readinessPercent = computed(() => Math.round((filledDimensionCount.value / dimensions.value.length) * 100))
const readyToConfirm = computed(() => filledDimensionCount.value >= 6 && Boolean(profileDraft.goal))
const profileTitle = computed(() => profileDraft.goal || '正在生成初始学习画像')

const missingSlots = computed(() => {
  const items: string[] = []
  if (!profileDraft.goal) items.push('近期目标')
  if (!profileDraft.direction) items.push('学习方向')
  if (!profileDraft.weakPoints.length) items.push('薄弱点')
  if (!profileDraft.dailyTime) items.push('每天可用时间')
  if (!profileDraft.preference.length) items.push('学习偏好')
  if (!profileDraft.level) items.push('当前基础')
  return items.slice(0, 4)
})

const readinessStyle = computed(() => ({
  background: `conic-gradient(#0bb7aa ${readinessPercent.value * 3.6}deg, #e2e8f0 0deg)`,
}))

function joinParts(parts: string[]) {
  return parts.filter(Boolean).join(' / ')
}

async function sendQuickPrompt(prompt: string) {
  inputText.value = prompt
  await sendMessage()
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || agentTyping.value) return

  inputText.value = ''
  const extracted = extractProfile(text)
  messages.value.push({
    id: `user-${Date.now()}`,
    role: 'user',
    text,
    extracted,
  })
  scrollToBottom()

  agentTyping.value = true
  await wait(520)
  agentTyping.value = false

  messages.value.push({
    id: `agent-${Date.now()}`,
    role: 'agent',
    text: buildAgentReply(extracted),
  })
  scrollToBottom()
}

function extractProfile(text: string): ExtractedItem[] {
  const extracted: ExtractedItem[] = []
  const normalized = text.toLowerCase()

  detectIdentity(text, extracted)
  detectDirection(text, normalized, extracted)
  detectGoal(text, normalized, extracted)
  detectDeadline(text, extracted)
  detectWeakPoints(text, normalized, extracted)
  detectDailyTime(text, extracted)
  detectLevel(text, normalized, extracted)
  detectPreference(text, normalized, extracted)
  detectResourcePreference(text, normalized, extracted)
  detectPressure(text, normalized, extracted)

  mergeEvidence(extracted)
  return extracted
}

function detectIdentity(text: string, extracted: ExtractedItem[]) {
  if (/本科|大学|大一|大二|大三|大四/.test(text)) {
    profileDraft.identity = 'undergraduate'
    pushExtracted(extracted, '身份阶段', '本科在读', text, 72)
  } else if (/研究生|研一|研二|研三/.test(text)) {
    profileDraft.identity = 'graduate'
    pushExtracted(extracted, '身份阶段', '研究生在读', text, 72)
  }

  const grade = text.match(/大一|大二|大三|大四|研一|研二|研三/)
  if (grade) {
    profileDraft.grade = grade[0]
    pushExtracted(extracted, '年级阶段', grade[0], text, 78)
  }
}

function detectDirection(text: string, normalized: string, extracted: ExtractedItem[]) {
  const directionRules = [
    { keys: ['操作系统', 'pv', '进程', '线程', '死锁'], value: '操作系统' },
    { keys: ['java', '后端', 'spring', '数据库'], value: 'Java 后端' },
    { keys: ['算法', '蓝桥杯', '动态规划', '数据结构'], value: '算法与数据结构' },
    { keys: ['高数', '微积分', '线代', '概率论'], value: '高等数学' },
    { keys: ['英语', '四级', '六级', '听力'], value: '大学英语' },
    { keys: ['人工智能', '机器学习', '深度学习'], value: '人工智能' },
  ]
  const hit = directionRules.find(rule => rule.keys.some(key => normalized.includes(key.toLowerCase())))
  if (hit) {
    profileDraft.direction = hit.value
    pushExtracted(extracted, '学习方向', hit.value, text, 84)
  }
}

function detectGoal(text: string, normalized: string, extracted: ExtractedItem[]) {
  if (/考试|期末|考研|四级|六级|蓝桥杯|竞赛/.test(text)) {
    profileDraft.goal = inferGoalName(text, '备考冲刺')
    pushExtracted(extracted, '近期目标', profileDraft.goal, text, 86)
  } else if (/找工作|求职|面试|就业|实习/.test(text)) {
    profileDraft.goal = inferGoalName(text, '求职就业')
    pushExtracted(extracted, '近期目标', profileDraft.goal, text, 84)
  } else if (/项目|实战|作品|毕设|课设/.test(text)) {
    profileDraft.goal = inferGoalName(text, '项目完成')
    pushExtracted(extracted, '近期目标', profileDraft.goal, text, 84)
  } else if (/掌握|学会|提升|入门|进阶/.test(text) || normalized.includes('learn')) {
    profileDraft.goal = inferGoalName(text, '能力提升')
    pushExtracted(extracted, '近期目标', profileDraft.goal, text, 78)
  }
}

function inferGoalName(text: string, fallback: string) {
  const course = profileDraft.direction || ''
  if (course) return `${course}${fallback}`
  const short = text.replace(/[，。,.]/g, ' ').trim().slice(0, 18)
  return short || fallback
}

function detectDeadline(text: string, extracted: ExtractedItem[]) {
  const match = text.match(/(今天|明天|后天|本周|下周|这周|下个月|三周内|两周内|一周内|\d+\s*(天|周|个月)内)/)
  if (match) {
    profileDraft.deadline = match[0].replace(/\s+/g, '')
    pushExtracted(extracted, '截止时间', profileDraft.deadline, text, 84)
  }
}

function detectWeakPoints(text: string, normalized: string, extracted: ExtractedItem[]) {
  const weakRules = [
    { keys: ['pv', '信号量'], value: 'PV 操作' },
    { keys: ['进程同步', '同步互斥'], value: '进程同步' },
    { keys: ['动态规划', 'dp'], value: '动态规划' },
    { keys: ['指针'], value: '指针与内存' },
    { keys: ['听力'], value: '英语听力' },
    { keys: ['极限', '洛必达'], value: '极限与洛必达法则' },
    { keys: ['总是错', '老是错', '不会', '看不懂', '薄弱', '卡住'], value: '存在稳定薄弱点' },
  ]
  weakRules.forEach(rule => {
    if (rule.keys.some(key => normalized.includes(key.toLowerCase()))) {
      addUnique(profileDraft.weakPoints, rule.value)
      pushExtracted(extracted, '薄弱点', rule.value, text, 88)
    }
  })
}

function detectDailyTime(text: string, extracted: ExtractedItem[]) {
  const match = text.match(/每天.{0,6}?(\d+)\s*(分钟|小时|h|min)|(\d+)\s*(分钟|小时|h|min).{0,6}?每天/)
  if (!match) return
  const amount = match[1] || match[3]
  const unit = match[2] || match[4]
  profileDraft.dailyTime = `每天 ${amount}${unit}`
  pushExtracted(extracted, '时间节奏', profileDraft.dailyTime, text, 90)
}

function detectLevel(text: string, normalized: string, extracted: ExtractedItem[]) {
  const rules = [
    { keys: ['零基础', '刚开始', '入门'], value: '入门阶段' },
    { keys: ['基础一般', '不系统', '学过一点'], value: '基础不稳定' },
    { keys: ['系统学过', '上过课'], value: '有课程基础' },
    { keys: ['熟练', '有项目经验'], value: '已有实践经验' },
  ]
  const hit = rules.find(rule => rule.keys.some(key => normalized.includes(key.toLowerCase())))
  if (hit) {
    profileDraft.level = hit.value
    pushExtracted(extracted, '知识基础', hit.value, text, 78)
  } else if (profileDraft.weakPoints.length && !profileDraft.level) {
    profileDraft.level = '概念理解不稳定'
    pushExtracted(extracted, '知识基础', profileDraft.level, text, 66)
  }
}

function detectPreference(text: string, normalized: string, extracted: ExtractedItem[]) {
  const rules = [
    { keys: ['图解', '画图', '可视化'], value: '图解驱动' },
    { keys: ['例题', '案例'], value: '例题驱动' },
    { keys: ['做题', '练习'], value: '练习巩固' },
    { keys: ['讲慢', '慢一点'], value: '慢节奏讲解' },
    { keys: ['短', '碎片'], value: '短时高频' },
  ]
  rules.forEach(rule => {
    if (rule.keys.some(key => normalized.includes(key.toLowerCase()))) {
      addUnique(profileDraft.preference, rule.value)
      pushExtracted(extracted, '学习偏好', rule.value, text, 80)
    }
  })
}

function detectResourcePreference(text: string, normalized: string, extracted: ExtractedItem[]) {
  const rules = [
    { keys: ['文档', '讲义'], value: '讲解文档' },
    { keys: ['ppt', '课件'], value: 'PPT' },
    { keys: ['题', '练习', '测试'], value: '专项练习' },
    { keys: ['代码', '实操'], value: '代码案例' },
    { keys: ['视频', '动画'], value: '视频动画' },
    { keys: ['思维导图', '脑图'], value: '思维导图' },
  ]
  rules.forEach(rule => {
    if (rule.keys.some(key => normalized.includes(key.toLowerCase()))) {
      addUnique(profileDraft.resourcePreference, rule.value)
      pushExtracted(extracted, '资源偏好', rule.value, text, 78)
    }
  })
  if (profileDraft.preference.includes('图解驱动')) {
    addUnique(profileDraft.resourcePreference, '思维导图')
  }
  if (profileDraft.preference.includes('例题驱动')) {
    addUnique(profileDraft.resourcePreference, '专项练习')
  }
}

function detectPressure(text: string, normalized: string, extracted: ExtractedItem[]) {
  if (/下周|明天|后天|一周内|急|冲刺|马上/.test(text)) {
    profileDraft.pressure = '高优先级冲刺'
    pushExtracted(extracted, '紧急程度', profileDraft.pressure, text, 76)
  } else if (normalized.includes('三周') || normalized.includes('两周')) {
    profileDraft.pressure = '中高优先级'
    pushExtracted(extracted, '紧急程度', profileDraft.pressure, text, 70)
  }
}

function pushExtracted(list: ExtractedItem[], dimension: string, value: string, evidence: string, confidence: number) {
  if (!value) return
  if (list.some(item => item.dimension === dimension && item.value === value)) return
  list.push({ dimension, value, evidence: shortenEvidence(evidence), confidence })
}

function mergeEvidence(items: ExtractedItem[]) {
  items.forEach(item => {
    const exists = evidenceList.value.some(
      old => old.dimension === item.dimension && old.value === item.value,
    )
    if (!exists) {
      evidenceList.value.unshift(item)
    }
  })
  evidenceList.value = evidenceList.value.slice(0, 8)
}

function shortenEvidence(text: string) {
  const value = text.trim().replace(/\s+/g, ' ')
  return value.length > 34 ? `${value.slice(0, 34)}...` : value
}

function addUnique(target: string[], value: string) {
  if (!target.includes(value)) target.push(value)
}

function buildAgentReply(extracted: ExtractedItem[]) {
  if (!extracted.length) {
    return `我还没有识别到足够的画像信息。你可以补充：${missingSlots.value.join('、') || '你的学习目标和时间安排'}。`
  }
  if (readyToConfirm.value) {
    return '我已经形成初始画像草稿：目标、薄弱点、偏好、时间节奏和资源偏好都比较清楚了。你可以确认保存，也可以继续补充更多细节。'
  }
  return `已更新 ${extracted.length} 条画像证据。为了让计划更准，还想确认：${missingSlots.value.join('、') || '是否需要立即创建学习空间'}。`
}

function addAgentNudge() {
  const question = missingSlots.value.length
    ? `我还需要确认：${missingSlots.value.join('、')}。你可以用一句话补充，不需要填表。`
    : '画像已经比较完整。你还可以补充喜欢的资源形式，例如 PPT、代码案例、短视频或专项题。'
  messages.value.push({
    id: `agent-nudge-${Date.now()}`,
    role: 'agent',
    text: question,
  })
  scrollToBottom()
}

async function handleSkip() {
  try {
    await studentProfileApi.initProfile({})
    await userStore.fetchUserInfo()
  } catch {
    if (userStore.userInfo) {
      userStore.userInfo.profileInitialized = true
    }
  }
  router.push('/dashboard')
}

async function handleComplete() {
  loading.value = true
  try {
    await studentProfileApi.initProfile({
      identity: profileDraft.identity || undefined,
      grade: mapGrade(profileDraft.grade) || undefined,
      direction: mapDirection(profileDraft.direction) || undefined,
      directionDetail: buildDirectionDetail(),
      level: mapLevel(profileDraft.level) || undefined,
      goal: mapGoal(profileDraft.goal) || undefined,
      dailyStudyTime: mapDailyTime(profileDraft.dailyTime) || undefined,
    })
    await userStore.fetchUserInfo()
    cacheSpaceLaunchProfile()
    ElMessage.success('画像创建成功，Agent 已准备为你规划学习任务')
    router.push('/space-launch')
  } catch (error: any) {
    ElMessage.error(error?.message || '画像创建失败，请重试')
  } finally {
    loading.value = false
  }
}

function cacheSpaceLaunchProfile() {
  window.sessionStorage.setItem('smartorder:spaceLaunchProfile', JSON.stringify({
    goal: profileDraft.goal,
    direction: profileDraft.direction,
    deadline: profileDraft.deadline,
    weakPoints: profileDraft.weakPoints,
    preference: profileDraft.preference,
    dailyTime: profileDraft.dailyTime,
    resourcePreference: profileDraft.resourcePreference,
    pressure: profileDraft.pressure,
  }))
}

function buildDirectionDetail() {
  return [
    profileDraft.direction,
    profileDraft.deadline && `截止：${profileDraft.deadline}`,
    profileDraft.weakPoints.length && `薄弱点：${profileDraft.weakPoints.join('、')}`,
    profileDraft.preference.length && `偏好：${profileDraft.preference.join('、')}`,
    profileDraft.resourcePreference.length && `资源：${profileDraft.resourcePreference.join('、')}`,
    profileDraft.pressure && `紧急程度：${profileDraft.pressure}`,
  ].filter(Boolean).join('；')
}

function mapDirection(direction: string) {
  if (/人工智能/.test(direction)) return 'ai'
  if (/Java|操作系统|算法|数据结构/.test(direction)) return 'cs'
  if (/高等数学/.test(direction)) return 'other'
  if (/英语/.test(direction)) return 'humanities'
  return direction ? 'other' : ''
}

function mapGoal(goal: string) {
  if (/找工作|求职|面试|就业|实习/.test(goal)) return 'job'
  if (/考试|备考|冲刺|四级|六级|蓝桥杯/.test(goal)) return 'exam'
  if (/项目/.test(goal)) return 'project'
  if (/竞赛/.test(goal)) return 'competition'
  return goal ? 'skill' : ''
}

function mapLevel(level: string) {
  if (/入门|零基础/.test(level)) return 'beginner'
  if (/不稳定|一般|一点/.test(level)) return 'some'
  if (/课程|学过/.test(level)) return 'course'
  if (/实践|熟练/.test(level)) return 'advanced'
  return level ? 'some' : ''
}

function mapDailyTime(value: string) {
  if (!value) return ''
  const minute = value.match(/(\d+)分钟/)
  if (minute) {
    const n = Number(minute[1])
    if (n < 30) return 'lt30'
    if (n <= 60) return '30to60'
    if (n <= 120) return '1to2'
    if (n <= 180) return '2to3'
    return 'gt3'
  }
  const hour = value.match(/(\d+)小时|(\d+)h/i)
  if (hour) {
    const n = Number(hour[1] || hour[2])
    if (n <= 1) return '30to60'
    if (n <= 2) return '1to2'
    if (n <= 3) return '2to3'
    return 'gt3'
  }
  return ''
}

function mapGrade(grade: string) {
  const map: Record<string, string> = {
    大一: 'freshman',
    大二: 'sophomore',
    大三: 'junior',
    大四: 'senior',
    研一: 'g1',
    研二: 'g2',
    研三: 'g3',
  }
  return map[grade] || ''
}

function wait(ms: number) {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

function scrollToBottom() {
  void nextTick(() => {
    if (!messageListRef.value) return
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  })
}

const iconTarget = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>'
const iconBook = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/></svg>'
const iconAlert = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.3 3.3 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>'
const iconChart = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-7"/></svg>'
const iconSpark = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 3 14h8l-1 8 10-12h-8l1-8z"/></svg>'
const iconClock = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
const iconLayers = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></svg>'
const iconPulse = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>'
</script>

<style scoped>
.onboarding-page {
  height: 100vh;
  position: relative;
  overflow-x: hidden;
  overflow-y: hidden;
  background: #f6f8fb;
  color: #0f172a;
  box-sizing: border-box;
}

.onboarding-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 8%, rgba(11, 183, 170, 0.16), transparent 28%),
    radial-gradient(circle at 86% 16%, rgba(59, 130, 246, 0.13), transparent 30%),
    linear-gradient(135deg, #f8fafc 0%, #eef6f8 52%, #f7fbff 100%);
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(15, 23, 42, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(15, 23, 42, 0.045) 1px, transparent 1px);
  background-size: 34px 34px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), transparent 78%);
}

.onboarding-shell {
  position: relative;
  z-index: 1;
  width: min(1440px, calc(100% - 48px));
  height: 100%;
  margin: 0 auto;
  padding: 28px 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  box-sizing: border-box;
}

.onboarding-topbar {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
  margin-bottom: 22px;
  flex-shrink: 0;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  color: #0a9e94;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.onboarding-topbar h1 {
  margin: 4px 0 8px;
  color: #0f172a;
  font-size: clamp(1.8rem, 3vw, 2.75rem);
  line-height: 1.08;
  letter-spacing: 0;
}

.onboarding-topbar p {
  max-width: 760px;
  margin: 0;
  color: #64748b;
  font-size: 0.98rem;
  line-height: 1.7;
}

.skip-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.78);
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  backdrop-filter: blur(12px);
  transition: border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.skip-link:hover {
  color: #0a9e94;
  border-color: rgba(11, 183, 170, 0.32);
  transform: translateY(-1px);
}

.onboarding-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 430px;
  gap: 20px;
  align-items: stretch;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.chat-panel,
.profile-card {
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(18px);
}

.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border-radius: 22px;
}

.panel-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  background: linear-gradient(135deg, rgba(236, 253, 251, 0.78), rgba(239, 246, 255, 0.68));
}

.agent-avatar {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  color: white;
  box-shadow: 0 14px 24px rgba(11, 183, 170, 0.24);
}

.agent-avatar svg {
  width: 24px;
  height: 24px;
}

.panel-head h2,
.profile-card h2,
.profile-card h3 {
  margin: 0;
  color: #0f172a;
}

.panel-head h2 {
  font-size: 1rem;
}

.panel-head p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.45;
}

.message-list {
  flex: 1;
  min-height: 0;
  padding: 22px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.message-row {
  display: flex;
  margin-bottom: 16px;
}

.message-row.user {
  justify-content: flex-end;
}

.message-bubble {
  max-width: min(680px, 82%);
  padding: 13px 15px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
}

.message-row.agent .message-bubble {
  border-top-left-radius: 6px;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
}

.message-row.user .message-bubble {
  border-top-right-radius: 6px;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  color: white;
  box-shadow: 0 12px 26px rgba(11, 183, 170, 0.22);
}

.message-bubble p {
  margin: 0;
  font-size: 0.93rem;
  line-height: 1.7;
}

.extracted-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.extracted-strip span {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.72rem;
  font-weight: 700;
}

.typing {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 64px;
}

.typing span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #0bb7aa;
  animation: typing-dot 1s ease-in-out infinite;
}

.typing span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typing-dot {
  0%, 100% { opacity: 0.35; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-3px); }
}

.quick-prompts {
  display: flex;
  gap: 8px;
  padding: 0 18px 12px;
  overflow-x: auto;
  scrollbar-width: none;
}

.quick-prompts::-webkit-scrollbar {
  display: none;
}

.quick-prompts button {
  flex: 0 0 auto;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 999px;
  background: #ffffff;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.quick-prompts button:hover {
  border-color: rgba(11, 183, 170, 0.34);
  background: #ecfdfb;
  color: #0a9e94;
}

.composer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 42px;
  gap: 10px;
  padding: 14px 18px 18px;
  border-top: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(248, 250, 252, 0.8);
}

.composer textarea {
  width: 100%;
  min-height: 42px;
  max-height: 120px;
  padding: 10px 12px;
  resize: vertical;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 13px;
  outline: none;
  color: #0f172a;
  background: #ffffff;
  font-family: inherit;
  font-size: 0.92rem;
  line-height: 1.5;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.composer textarea:focus {
  border-color: rgba(11, 183, 170, 0.5);
  box-shadow: 0 0 0 4px rgba(11, 183, 170, 0.1);
}

.composer button {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: end;
  border: 0;
  border-radius: 13px;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  color: white;
  cursor: pointer;
  box-shadow: 0 12px 22px rgba(11, 183, 170, 0.24);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.composer button:disabled {
  opacity: 0.42;
  cursor: not-allowed;
  box-shadow: none;
}

.composer button:not(:disabled):hover {
  transform: translateY(-1px);
}

.composer svg {
  width: 18px;
  height: 18px;
}

.profile-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding-right: 2px;
  scrollbar-gutter: stable;
}

.profile-panel::-webkit-scrollbar,
.message-list::-webkit-scrollbar,
.evidence-list::-webkit-scrollbar {
  width: 8px;
}

.profile-panel::-webkit-scrollbar-thumb,
.message-list::-webkit-scrollbar-thumb,
.evidence-list::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.22);
  border-radius: 999px;
}

.profile-panel::-webkit-scrollbar-track,
.message-list::-webkit-scrollbar-track,
.evidence-list::-webkit-scrollbar-track {
  background: transparent;
}

.profile-card {
  border-radius: 20px;
  padding: 18px;
}

.draft-card {
  flex: 1;
}

.card-head,
.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 14px;
}

.profile-card h2 {
  margin-top: 2px;
  font-size: 1.08rem;
  line-height: 1.35;
}

.profile-card h3 {
  font-size: 0.96rem;
}

.card-title-row span {
  color: #0a9e94;
  font-size: 0.78rem;
  font-weight: 800;
}

.readiness-ring {
  width: 62px;
  height: 62px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  padding: 5px;
}

.readiness-ring strong {
  width: 100%;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: white;
  color: #0f172a;
  font-size: 0.9rem;
}

.dimension-list {
  display: grid;
  gap: 9px;
}

.dimension-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 12px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.72);
  transition: border-color 0.18s ease, background 0.18s ease;
}

.dimension-item.filled {
  border-color: rgba(11, 183, 170, 0.2);
  background: linear-gradient(135deg, #ffffff, #ecfdfb);
}

.dimension-main {
  display: flex;
  min-width: 0;
  gap: 10px;
}

.dimension-icon {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 10px;
  background: #eef6ff;
  color: #0284c7;
}

.dimension-item.filled .dimension-icon {
  background: #dffaf5;
  color: #0a9e94;
}

.dimension-icon :deep(svg) {
  width: 17px;
  height: 17px;
}

.dimension-main strong {
  display: block;
  color: #0f172a;
  font-size: 0.8rem;
  line-height: 1.25;
}

.dimension-main p {
  display: -webkit-box;
  margin: 3px 0 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: #64748b;
  font-size: 0.74rem;
  line-height: 1.42;
}

.dimension-confidence {
  align-self: flex-start;
  flex-shrink: 0;
  padding: 3px 7px;
  border-radius: 999px;
  background: #ecfdfb;
  color: #0a9e94;
  font-size: 0.68rem;
  font-weight: 900;
}

.evidence-list {
  display: grid;
  gap: 8px;
  max-height: 184px;
  overflow-y: auto;
}

.evidence-item {
  padding: 10px 11px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.evidence-item strong {
  display: block;
  color: #334155;
  font-size: 0.78rem;
}

.evidence-item p,
.empty-evidence,
.ready-copy {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.74rem;
  line-height: 1.5;
}

.empty-evidence {
  margin: 0;
  padding: 18px;
  border-radius: 14px;
  background: #f8fafc;
  text-align: center;
}

.missing-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.missing-list span {
  padding: 5px 9px;
  border-radius: 999px;
  background: #fff7ed;
  color: #c2410c;
  font-size: 0.76rem;
  font-weight: 800;
}

.ready-copy {
  margin-bottom: 14px;
}

.confirm-actions {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 10px;
}

.secondary-btn,
.primary-btn {
  min-height: 42px;
  border-radius: 13px;
  font-size: 0.84rem;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, opacity 0.18s ease;
}

.secondary-btn {
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #ffffff;
  color: #475569;
}

.secondary-btn:hover {
  border-color: rgba(11, 183, 170, 0.34);
  color: #0a9e94;
  transform: translateY(-1px);
}

.primary-btn {
  border: 0;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  color: white;
  box-shadow: 0 14px 28px rgba(11, 183, 170, 0.24);
}

.primary-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.primary-btn:not(:disabled):hover {
  transform: translateY(-1px);
}

@media (max-width: 1120px) {
  .onboarding-page {
    min-height: 100vh;
    height: auto;
    overflow-y: auto;
  }

  .onboarding-shell {
    height: auto;
    min-height: 100vh;
  }

  .onboarding-workspace {
    grid-template-columns: 1fr;
    flex: none;
    overflow: visible;
  }

  .chat-panel {
    height: auto;
    min-height: min(620px, calc(100vh - 160px));
  }

  .profile-panel {
    overflow: visible;
    padding-right: 0;
  }
}

@media (max-width: 720px) {
  .onboarding-shell {
    width: min(100% - 28px, 1440px);
    padding: 18px 0;
  }

  .onboarding-topbar {
    flex-direction: column;
  }

  .skip-link {
    width: 100%;
    justify-content: center;
  }

  .chat-panel {
    min-height: min(600px, calc(100vh - 146px));
    border-radius: 18px;
  }

  .message-list {
    padding: 16px;
  }

  .message-bubble {
    max-width: 92%;
  }

  .composer {
    grid-template-columns: minmax(0, 1fr) 40px;
    padding: 12px;
  }

  .confirm-actions {
    grid-template-columns: 1fr;
  }
}
</style>
