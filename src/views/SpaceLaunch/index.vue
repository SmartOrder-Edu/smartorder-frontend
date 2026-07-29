<template>
  <div class="launch-page">
    <div class="launch-bg">
      <div class="bg-grid"></div>
      <div class="bg-glow"></div>
    </div>

    <main class="launch-shell">
      <header class="launch-header">
        <div>
          <span class="eyebrow">Multi-Agent Learning Space</span>
          <h1>Agent 正在为你创建专属学习空间</h1>
          <p>系统会把刚刚构建的学习画像转成路径、任务、资源和测评入口，让评委直观看到“画像驱动学习闭环”。</p>
        </div>
        <button class="ghost-btn" type="button" @click="goDashboard">跳过动画</button>
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

          <div class="signal-card">
            <div class="signal-line">
              <span>画像完整度</span>
              <strong>{{ profileReadiness }}%</strong>
            </div>
            <div class="signal-track">
              <i :style="{ width: `${profileReadiness}%` }"></i>
            </div>
            <p>每个维度都会作为后续 Agent 决策的证据，不再是孤立表单。</p>
          </div>
        </aside>

        <section class="agent-orchestration">
          <div class="orchestration-head">
            <div>
              <span class="eyebrow">协同编排</span>
              <h2>{{ activeStep?.name || '学习空间已创建' }}</h2>
            </div>
            <div class="progress-chip" :style="{ '--progress': `${progress * 3.6}deg` }">
              <strong>{{ progress }}%</strong>
              <span>{{ completed ? '已完成' : '生成中' }}</span>
            </div>
          </div>

          <div class="agent-flow">
            <div
              v-for="(step, index) in agentSteps"
              :key="step.id"
              class="agent-node"
              :class="stepStatus(index)"
            >
              <div class="node-icon">
                <span>{{ index + 1 }}</span>
              </div>
              <div>
                <strong>{{ step.name }}</strong>
                <p>{{ step.role }}</p>
              </div>
            </div>
          </div>

          <div class="workbench">
            <div class="workbench-main">
              <div class="pulse-orbit">
                <div class="core-dot"></div>
                <span v-for="index in 4" :key="index"></span>
              </div>
              <div>
                <h3>{{ activeStep?.verb || '学习空间准备完成' }}</h3>
                <p>{{ activeStep?.output || '路径、资源、测评与今日任务已经组合为可执行学习空间。' }}</p>
              </div>
            </div>

            <div class="console-panel">
              <div v-for="log in visibleLogs" :key="log" class="console-line">
                <span></span>
                <p>{{ log }}</p>
              </div>
            </div>
          </div>
        </section>

        <aside class="result-preview">
          <div class="section-head">
            <span class="eyebrow">生成结果</span>
            <h2>学习空间预览</h2>
          </div>

          <div class="result-list">
            <div
              v-for="(result, index) in resultCards"
              :key="result.title"
              class="result-card"
              :class="{ visible: index <= unlockedResultIndex }"
            >
              <span>{{ result.type }}</span>
              <strong>{{ result.title }}</strong>
              <p>{{ result.desc }}</p>
            </div>
          </div>

          <button class="primary-btn" type="button" :disabled="!completed" @click="goDashboard">
            {{ completed ? '进入学习指挥台' : '等待 Agent 完成生成' }}
          </button>
        </aside>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

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

interface AgentStep {
  id: string
  name: string
  role: string
  verb: string
  output: string
  log: string
}

const router = useRouter()
const activeIndex = ref(0)
let timer: number | undefined

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
    output: `确认目标为“${profile.goal}”，优先处理 ${profile.weakPoints.join('、') || '核心薄弱点'}。`,
    log: 'Profile Agent 已将自然语言访谈转成可追踪画像证据。',
  },
  {
    id: 'planner',
    name: 'Planning Agent',
    role: '拆解学习路径',
    verb: '正在生成分阶段学习路径',
    output: `依据 ${profile.dailyTime || '每天可用时间'} 安排概念补强、例题演练和错因复盘。`,
    log: 'Planning Agent 已生成 3 阶段学习路径和今日任务骨架。',
  },
  {
    id: 'resource',
    name: 'Resource Agent',
    role: '匹配多模态资源',
    verb: '正在匹配讲解、练习与可视化资源',
    output: `优先选择 ${profile.resourcePreference.join('、') || '讲解文档、专项练习'}，贴合用户学习偏好。`,
    log: 'Resource Agent 已完成资源筛选，并按薄弱点建立索引。',
  },
  {
    id: 'assessment',
    name: 'Assessment Agent',
    role: '生成诊断测评',
    verb: '正在生成首轮诊断题与检查点',
    output: `围绕 ${profile.weakPoints[0] || profile.direction} 设置 5 个测评点，后续用于动态更新画像。`,
    log: 'Assessment Agent 已创建首轮测评和掌握度回写规则。',
  },
  {
    id: 'tutor',
    name: 'Tutor Agent',
    role: '安排执行入口',
    verb: '正在组合今日任务与学习空间入口',
    output: '学习路径、资源、测评和反馈规则已经合并为一个可执行空间。',
    log: 'Tutor Agent 已完成今日学习任务编排，学习空间可以进入。',
  },
]

const completed = computed(() => activeIndex.value >= agentSteps.length)
const activeStep = computed(() => completed.value ? null : agentSteps[activeIndex.value])
const progress = computed(() => {
  if (completed.value) return 100
  return Math.min(96, Math.round(((activeIndex.value + 0.35) / agentSteps.length) * 100))
})
const unlockedResultIndex = computed(() => Math.max(0, activeIndex.value - 1))
const visibleLogs = computed(() => agentSteps.slice(0, Math.min(activeIndex.value + 1, agentSteps.length)).map(item => item.log))

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

const resultCards = computed(() => [
  {
    type: '学习路径',
    title: `${profile.direction || '核心课程'}三阶段路径`,
    desc: '先补概念模型，再做典型例题，最后用错题复盘巩固。',
  },
  {
    type: '今日任务',
    title: `${profile.dailyTime || '45分钟'}冲刺任务`,
    desc: '把学习任务拆成可执行的小步，避免计划停在口号层面。',
  },
  {
    type: '资源推荐',
    title: profile.resourcePreference.join(' + ') || '讲解文档 + 专项练习',
    desc: '资源不是平铺列表，而是围绕薄弱点和偏好筛选。',
  },
  {
    type: '诊断测评',
    title: `${profile.weakPoints[0] || '核心薄弱点'}专项检查`,
    desc: '测评结果会反向更新画像，形成持续个性化闭环。',
  },
])

function stepStatus(index: number) {
  if (index < activeIndex.value || completed.value) return 'done'
  if (index === activeIndex.value) return 'running'
  return 'waiting'
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
  router.push('/dashboard')
}

onMounted(() => {
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
})
</script>

<style scoped>
.launch-page {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  background: #f6f8fb;
  color: #0f172a;
}

.launch-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
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
    radial-gradient(circle at 82% 8%, rgba(14, 165, 233, 0.16), transparent 28%),
    linear-gradient(135deg, #f8fafc 0%, #eef6f8 52%, #f7fbff 100%);
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
  color: #0a9e94;
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.launch-header h1 {
  margin: 4px 0 8px;
  color: #0f172a;
  font-size: clamp(1.8rem, 3vw, 2.8rem);
  line-height: 1.08;
  letter-spacing: 0;
}

.launch-header p {
  max-width: 780px;
  margin: 0;
  color: #64748b;
  font-size: 0.98rem;
  line-height: 1.7;
}

.ghost-btn,
.primary-btn {
  min-height: 42px;
  border-radius: 13px;
  font-size: 0.86rem;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.18s ease, opacity 0.18s ease, border-color 0.18s ease;
}

.ghost-btn {
  flex-shrink: 0;
  padding: 0 16px;
  border: 1px solid rgba(148, 163, 184, 0.26);
  background: rgba(255, 255, 255, 0.8);
  color: #475569;
  backdrop-filter: blur(12px);
}

.ghost-btn:hover {
  color: #0a9e94;
  border-color: rgba(11, 183, 170, 0.34);
  transform: translateY(-1px);
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
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.08);
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
  color: #0f172a;
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
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 700;
}

.snapshot-item strong {
  display: block;
  margin-top: 4px;
  color: #0f172a;
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
  color: #0a9e94;
  font-size: 0.76rem;
  font-weight: 800;
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
  background: linear-gradient(90deg, #0bb7aa, #0284c7);
}

.signal-card p {
  margin: 0;
  color: #64748b;
  font-size: 0.76rem;
  line-height: 1.55;
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
  margin-bottom: 16px;
}

.progress-chip {
  width: 76px;
  height: 76px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  flex-shrink: 0;
  border-radius: 50%;
  background: conic-gradient(#0bb7aa var(--progress, 240deg), #e2e8f0 0deg);
  box-shadow: inset 0 0 0 7px white;
}

.progress-chip strong {
  color: #0f172a;
  font-size: 1rem;
}

.progress-chip span {
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 800;
}

.agent-flow {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 18px;
}

.agent-node {
  min-height: 126px;
  position: relative;
  padding: 14px 12px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: #f8fafc;
  transition: background 0.22s ease, border-color 0.22s ease, transform 0.22s ease;
}

.agent-node.done,
.agent-node.running {
  border-color: rgba(11, 183, 170, 0.24);
  background: linear-gradient(135deg, #ffffff, #ecfdfb);
}

.agent-node.running {
  transform: translateY(-3px);
  box-shadow: 0 14px 26px rgba(11, 183, 170, 0.14);
}

.node-icon {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  border-radius: 12px;
  background: #e2e8f0;
  color: #64748b;
  font-weight: 900;
}

.agent-node.done .node-icon,
.agent-node.running .node-icon {
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  color: white;
}

.agent-node strong {
  display: block;
  color: #0f172a;
  font-size: 0.86rem;
  line-height: 1.25;
}

.agent-node p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 0.74rem;
  line-height: 1.45;
}

.workbench {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 14px;
}

.workbench-main,
.console-panel {
  min-height: 314px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.workbench-main {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(236, 253, 251, 0.86), rgba(239, 246, 255, 0.78)),
    #ffffff;
}

.pulse-orbit {
  width: 190px;
  height: 190px;
  position: relative;
  flex-shrink: 0;
  border-radius: 50%;
  background: radial-gradient(circle, #ffffff 0 28%, rgba(11, 183, 170, 0.12) 29% 100%);
}

.core-dot {
  width: 66px;
  height: 66px;
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 50%;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  box-shadow: 0 18px 38px rgba(11, 183, 170, 0.28);
  transform: translate(-50%, -50%);
}

.pulse-orbit span {
  width: 42px;
  height: 42px;
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid rgba(11, 183, 170, 0.18);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  animation: orbit 7s linear infinite;
}

.pulse-orbit span:nth-child(2) { animation-delay: -1.75s; }
.pulse-orbit span:nth-child(3) { animation-delay: -3.5s; }
.pulse-orbit span:nth-child(4) { animation-delay: -5.25s; }

@keyframes orbit {
  from { transform: translate(-50%, -50%) rotate(0deg) translateX(82px) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg) translateX(82px) rotate(-360deg); }
}

.workbench-main h3 {
  margin: 0 0 10px;
  color: #0f172a;
  font-size: 1.22rem;
  line-height: 1.35;
}

.workbench-main p {
  margin: 0;
  color: #475569;
  font-size: 0.92rem;
  line-height: 1.7;
}

.console-panel {
  display: grid;
  align-content: start;
  gap: 10px;
  padding: 16px;
  background: #0f172a;
  overflow: hidden;
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
  background: #22c55e;
  box-shadow: 0 0 14px rgba(34, 197, 94, 0.75);
}

.console-line p {
  margin: 0;
  color: #dbeafe;
  font-size: 0.78rem;
  line-height: 1.6;
}

.result-preview {
  display: flex;
  flex-direction: column;
}

.result-list {
  display: grid;
  gap: 10px;
  margin-bottom: 16px;
}

.result-card {
  padding: 13px;
  border-radius: 15px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: #f8fafc;
  opacity: 0.45;
  transform: translateY(4px);
  transition: opacity 0.22s ease, transform 0.22s ease, background 0.22s ease, border-color 0.22s ease;
}

.result-card.visible {
  opacity: 1;
  transform: translateY(0);
  border-color: rgba(11, 183, 170, 0.2);
  background: linear-gradient(135deg, #ffffff, #ecfdfb);
}

.result-card span {
  color: #0a9e94;
  font-size: 0.72rem;
  font-weight: 900;
}

.result-card strong {
  display: block;
  margin-top: 4px;
  color: #0f172a;
  font-size: 0.88rem;
  line-height: 1.35;
}

.result-card p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 0.76rem;
  line-height: 1.55;
}

.primary-btn {
  width: 100%;
  margin-top: auto;
  border: 0;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
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

@media (max-width: 1220px) {
  .launch-grid {
    grid-template-columns: 1fr;
  }

  .workbench {
    grid-template-columns: minmax(0, 1fr);
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

  .ghost-btn {
    width: 100%;
  }

  .agent-flow,
  .snapshot-list,
  .result-list {
    grid-template-columns: 1fr;
  }

  .workbench-main {
    flex-direction: column;
    align-items: flex-start;
  }

  .pulse-orbit {
    width: 150px;
    height: 150px;
  }

  @keyframes orbit {
    from { transform: translate(-50%, -50%) rotate(0deg) translateX(62px) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg) translateX(62px) rotate(-360deg); }
  }
}
</style>
