<template>
  <main ref="reportRoot" class="learning-report-page" @scroll.passive="handleScroll">
    <header class="report-topbar">
      <button class="back-button" @click="goBack" aria-label="返回任务日程">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15,18 9,12 15,6" />
        </svg>
        返回任务日程
      </button>
      <div class="brand-mark">
        <img src="/logo.png" alt="知序智学" />
        <span>知序智学</span>
      </div>
      <div class="report-range">{{ report.range }}</div>
    </header>

    <nav class="section-nav" aria-label="学习报告分页导航">
      <button
        v-for="(section, index) in sections"
        :key="section.id"
        class="section-nav-item"
        :class="{ active: activeSection === index }"
        @click="scrollToSection(index)"
      >
        <span class="section-dot"></span>
        <span class="section-title">{{ section.label }}</span>
      </button>
    </nav>

    <section :id="sections[0].id" class="report-section cover-section">
      <div class="cover-orbit orbit-a"></div>
      <div class="cover-orbit orbit-b"></div>
      <div class="cover-content">
        <p class="eyebrow">最近 7 天学习报告</p>
        <h1>{{ report.studentName }} 的专属学习周报</h1>
        <p class="cover-summary">{{ report.mainConclusion }}</p>
        <div class="metric-grid">
          <article v-for="metric in report.metrics" :key="metric.label" class="metric-card">
            <span class="metric-value">{{ metric.value }}</span>
            <span class="metric-label">{{ metric.label }}</span>
          </article>
        </div>
      </div>
      <div class="scroll-hint">
        <span>向下滑动</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </div>
    </section>

    <section :id="sections[1].id" class="report-section split-section mastery-section">
      <div class="section-copy">
        <p class="eyebrow">知识掌握变化</p>
        <h2>你的知识掌握正在发生变化</h2>
        <p>
          系统综合本周测评表现、学习行为、答题耗时与连续表现，评估关键知识点的掌握状态。
        </p>
      </div>
      <div class="section-panel chart-panel">
        <div class="chart-header">
          <div>
            <span class="panel-kicker">掌握度趋势</span>
            <h3>核心知识点变化</h3>
          </div>
          <span class="confidence-badge">判断可靠度 86%</span>
        </div>
        <svg class="trend-chart" viewBox="0 0 720 360" role="img" aria-label="知识掌握度趋势图">
          <defs>
            <linearGradient id="trendArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#0bb7aa" stop-opacity="0.28" />
              <stop offset="100%" stop-color="#0bb7aa" stop-opacity="0" />
            </linearGradient>
          </defs>
          <g class="chart-grid">
            <line v-for="tick in 5" :key="tick" x1="56" x2="684" :y1="tick * 58" :y2="tick * 58" />
          </g>
          <path class="trend-area" :d="trendAreaPath" />
          <polyline class="trend-line" :points="trendPolyline" />
          <g v-for="point in masteryPoints" :key="point.day">
            <circle class="trend-point" :cx="point.x" :cy="point.y" r="6" />
            <text class="trend-label" :x="point.x" y="330">{{ point.day }}</text>
          </g>
        </svg>
        <div class="knowledge-cards">
          <article v-for="item in report.mastery" :key="item.name" class="knowledge-card">
            <div class="knowledge-main">
              <span>{{ item.name }}</span>
              <strong :class="item.delta >= 0 ? 'positive' : 'negative'">{{ formatDelta(item.delta) }}</strong>
            </div>
            <div class="mini-track">
              <span :style="{ width: `${item.current}%` }"></span>
            </div>
            <div class="knowledge-meta">
              <span>周初 {{ item.start }}%</span>
              <span>当前 {{ item.current }}%</span>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section :id="sections[2].id" class="report-section split-section weakness-section">
      <div class="section-copy">
        <p class="eyebrow">薄弱点与错因</p>
        <h2>你的问题，不只是做错了</h2>
        <p>
          报告会把错题背后的原因拆开，帮助你区分“概念没懂”“条件误用”和“过程遗漏”。
        </p>
      </div>
      <div class="section-panel weakness-panel">
        <div class="weakness-list">
          <article v-for="item in report.weaknesses" :key="item.name" class="weakness-card" :class="item.risk">
            <div class="weakness-rank">{{ item.rank }}</div>
            <div class="weakness-body">
              <div class="weakness-title-row">
                <h3>{{ item.name }}</h3>
                <span>{{ riskLabel(item.risk) }}</span>
              </div>
              <p>{{ item.reason }}</p>
              <div class="weakness-meta">
                <span>出现 {{ item.count }} 次</span>
                <span>{{ item.trend }}</span>
              </div>
            </div>
          </article>
        </div>
        <div class="cause-board">
          <h3>错因解释</h3>
          <div v-for="cause in report.causes" :key="cause.title" class="cause-row">
            <span>{{ cause.title }}</span>
            <p>{{ cause.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <section :id="sections[3].id" class="report-section adjustments-section">
      <div class="section-copy centered">
        <p class="eyebrow">系统智能调整</p>
        <h2>这一周，系统为你做了这些智能调整</h2>
        <p>每一次调整都来自真实学习证据，并继续落到任务、复习和测评安排里。</p>
      </div>
      <div class="timeline-panel">
        <article v-for="(item, index) in report.adjustments" :key="item.title" class="timeline-item">
          <div class="timeline-index">{{ String(index + 1).padStart(2, '0') }}</div>
          <div class="timeline-copy">
            <span>{{ item.time }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.action }}</p>
          </div>
          <div class="timeline-status">{{ item.status }}</div>
        </article>
      </div>
    </section>

    <section :id="sections[4].id" class="report-section split-section review-section">
      <div class="section-copy">
        <p class="eyebrow">遗忘风险与下周建议</p>
        <h2>哪些内容该复习了？下周该怎么学？</h2>
        <p>系统结合掌握度、复习记录和遗忘风险，为下周生成优先建议。</p>
      </div>
      <div class="section-panel review-panel">
        <div class="risk-table">
          <div class="risk-row risk-head">
            <span>知识点</span>
            <span>遗忘风险</span>
            <span>建议</span>
            <span>状态</span>
          </div>
          <div v-for="item in report.reviewRisks" :key="item.name" class="risk-row">
            <strong>{{ item.name }}</strong>
            <span class="risk-pill" :class="item.risk">{{ riskLabel(item.risk) }}</span>
            <span>{{ item.advice }}</span>
            <span class="status-pill">{{ item.status }}</span>
          </div>
        </div>
        <div class="next-plan">
          <h3>下周优先策略</h3>
          <ol>
            <li v-for="item in report.nextWeek" :key="item">{{ item }}</li>
          </ol>
          <p>{{ report.nextWeekSummary }}</p>
        </div>
      </div>
    </section>

    <section :id="sections[5].id" class="report-section summary-section">
      <div class="summary-panel">
        <p class="eyebrow">行动入口</p>
        <h2>你的下一周，已经准备好了</h2>
        <p class="agent-summary">{{ report.agentSummary }}</p>
        <div class="grade-row">
          <article v-for="grade in report.grades" :key="grade.label" class="grade-card">
            <span>{{ grade.label }}</span>
            <strong>{{ grade.value }}</strong>
          </article>
        </div>
        <div class="summary-actions">
          <button class="primary-action" @click="goTasks">查看下周计划</button>
          <button class="secondary-action" @click="goStudy">继续学习</button>
          <button class="secondary-action" @click="goProfile">查看成长画像</button>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const reportRoot = ref<HTMLElement | null>(null)
const activeSection = ref(0)

const sections = [
  { id: 'overview', label: '总览' },
  { id: 'mastery', label: '提升' },
  { id: 'weakness', label: '问题' },
  { id: 'adjustments', label: '调整' },
  { id: 'review', label: '建议' },
  { id: 'summary', label: '行动' },
]

const report = {
  studentName: '谢同学',
  range: '07/10 - 07/16',
  mainConclusion: '本周你的“链表基础”掌握明显提升，但“递归调用栈”仍存在步骤缺失问题。',
  metrics: [
    { label: '学习天数', value: '6 天' },
    { label: '累计时长', value: '8.5 h' },
    { label: '完成任务', value: '18' },
    { label: '完成练习', value: '64' },
    { label: '掌握知识点', value: '12' },
    { label: '待巩固', value: '4' },
  ],
  trend: [
    { day: 'D1', value: 42 },
    { day: 'D2', value: 48 },
    { day: 'D3', value: 54 },
    { day: 'D4', value: 57 },
    { day: 'D5', value: 63 },
    { day: 'D6', value: 71 },
    { day: 'D7', value: 76 },
  ],
  mastery: [
    { name: '链表遍历', start: 46, current: 82, delta: 36 },
    { name: '链表反转', start: 38, current: 69, delta: 31 },
    { name: '递归调用栈', start: 44, current: 41, delta: -3 },
    { name: '二叉树遍历', start: 52, current: 60, delta: 8 },
  ],
  weaknesses: [
    { rank: '01', name: '递归调用栈', reason: '主要错因：步骤缺失。能说出大方向，但容易漏掉返回过程。', count: 4, trend: '仍需加强', risk: 'high' },
    { rank: '02', name: 'SQL 多表连接', reason: '主要错因：条件误用。连接条件和筛选条件混在一起。', count: 3, trend: '较上周减少 40%', risk: 'medium' },
    { rank: '03', name: '链表指针更新', reason: '主要错因：细节遗漏。更新顺序偶尔导致断链。', count: 2, trend: '已明显改善', risk: 'low' },
  ],
  causes: [
    { title: '步骤缺失', desc: '你知道解题方向，但在执行链路中容易跳过关键中间状态。' },
    { title: '条件误用', desc: '你对知识点有基本理解，但在具体适用条件上判断不稳定。' },
    { title: '细节遗漏', desc: '不是不会，而是编码或推导时缺少最后一轮校验。' },
  ],
  adjustments: [
    { time: '周一 20:12', title: '补齐前置缺口', action: '检测到“递归调用栈”影响二叉树遍历，已插入 15 分钟复习任务。', status: '已执行' },
    { time: '周二 18:40', title: '增加验证题', action: '“链表反转”掌握度提升但证据不足，已增加 1 道过程追踪题。', status: '已完成' },
    { time: '周三 21:05', title: '调整题目难度', action: '连续答对 3 道基础题后，后续题目难度从 2 级调整到 3 级。', status: '生效中' },
    { time: '周五 09:30', title: '安排遗忘复习', action: '“数据库事务”进入高遗忘风险，已安排周四轻量复习。', status: '已加入计划' },
    { time: '周六 22:16', title: '修正任务时长', action: '编程题实际用时偏长，下周同类任务估时已从 25 分钟修正为 35 分钟。', status: '已更新' },
  ],
  reviewRisks: [
    { name: '数据库事务', risk: 'high', advice: '建议明天复习', status: '已加入计划' },
    { name: '链表反转', risk: 'medium', advice: '3 天后轻量验证', status: '待确认' },
    { name: '栈和队列', risk: 'low', advice: '暂不安排', status: '观察中' },
  ],
  nextWeek: [
    '优先修复递归调用栈的步骤执行问题',
    '完成链表反转验证练习，确认掌握稳定性',
    '对数据库事务进行一次短时复习，降低遗忘风险',
  ],
  nextWeekSummary: '下周前两天将以“补前置 + 验证练习”为主，后半周恢复正常学习推进。',
  agentSummary: '本周你的链表基础掌握明显提升，说明你在基础结构理解上进步很快。当前最需要继续修复的是递归调用栈的步骤执行问题，系统已经为你安排好了下周前两天的重点任务。',
  grades: [
    { label: '学习状态', value: '稳步进步' },
    { label: '计划执行度', value: '较高' },
    { label: '节奏建议', value: '补弱后推进' },
  ],
}

const chartWidth = 628
const chartHeight = 250
const chartLeft = 56
const chartTop = 42

const masteryPoints = computed(() =>
  report.trend.map((point, index) => ({
    ...point,
    x: chartLeft + (chartWidth / (report.trend.length - 1)) * index,
    y: chartTop + chartHeight - (point.value / 100) * chartHeight,
  }))
)

const trendPolyline = computed(() =>
  masteryPoints.value.map(point => `${point.x},${point.y}`).join(' ')
)

const trendAreaPath = computed(() => {
  const points = masteryPoints.value
  const first = points[0]
  const last = points[points.length - 1]
  return `M ${first.x} ${chartTop + chartHeight} L ${trendPolyline.value} L ${last.x} ${chartTop + chartHeight} Z`
})

function formatDelta(value: number) {
  return value >= 0 ? `+${value}%` : `${value}%`
}

function riskLabel(risk: string) {
  const labels: Record<string, string> = {
    high: '高风险',
    medium: '中风险',
    low: '低风险',
  }
  return labels[risk] || risk
}

function handleScroll() {
  const root = reportRoot.value
  if (!root) return
  const next = Math.round(root.scrollTop / root.clientHeight)
  activeSection.value = Math.min(sections.length - 1, Math.max(0, next))
}

function scrollToSection(index: number) {
  const root = reportRoot.value
  if (!root) return
  root.scrollTo({ top: root.clientHeight * index, behavior: 'smooth' })
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'PageDown') {
    event.preventDefault()
    scrollToSection(Math.min(sections.length - 1, activeSection.value + 1))
  }
  if (event.key === 'ArrowUp' || event.key === 'PageUp') {
    event.preventDefault()
    scrollToSection(Math.max(0, activeSection.value - 1))
  }
}

function goBack() {
  router.push('/tasks')
}

function goTasks() {
  router.push('/tasks')
}

function goStudy() {
  router.push('/tasks')
}

function goProfile() {
  router.push('/profile')
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.learning-report-page {
  position: relative;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  color: #102033;
  background:
    linear-gradient(135deg, rgba(11, 183, 170, 0.1), transparent 26%),
    linear-gradient(225deg, rgba(245, 158, 11, 0.12), transparent 24%),
    linear-gradient(180deg, #f7fbff 0%, #eef6f8 52%, #f9fbf7 100%);
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
}

.report-topbar {
  position: fixed;
  top: 18px;
  left: 26px;
  right: 26px;
  z-index: 20;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  pointer-events: none;
}

.back-button,
.brand-mark,
.report-range {
  pointer-events: auto;
}

.back-button {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(16, 32, 51, 0.12);
  background: rgba(255, 255, 255, 0.78);
  color: #1f3a52;
  border-radius: 999px;
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(40, 70, 90, 0.08);
  backdrop-filter: blur(16px);
}

.back-button svg {
  width: 16px;
  height: 16px;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-self: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.66);
  border: 1px solid rgba(16, 32, 51, 0.1);
  font-weight: 700;
  color: #102033;
  backdrop-filter: blur(16px);
}

.brand-mark img {
  width: 22px;
  height: 22px;
}

.report-range {
  justify-self: end;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.66);
  border: 1px solid rgba(16, 32, 51, 0.1);
  color: #516274;
  font-size: 13px;
  font-weight: 600;
  backdrop-filter: blur(16px);
}

.section-nav {
  position: fixed;
  top: 50%;
  right: 24px;
  z-index: 22;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transform: translateY(-50%);
}

.section-nav-item {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  border: 0;
  background: transparent;
  color: rgba(31, 58, 82, 0.56);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.section-dot {
  order: 2;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: rgba(31, 58, 82, 0.24);
  transition: all 0.2s ease;
}

.section-title {
  opacity: 0;
  transform: translateX(6px);
  transition: all 0.2s ease;
}

.section-nav-item:hover .section-title,
.section-nav-item.active .section-title {
  opacity: 1;
  transform: translateX(0);
}

.section-nav-item.active {
  color: #0b7d76;
}

.section-nav-item.active .section-dot {
  height: 24px;
  border-radius: 999px;
  background: #0bb7aa;
}

.report-section {
  position: relative;
  min-height: 100vh;
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  padding: 96px 9vw 72px;
  overflow: hidden;
}

.eyebrow {
  margin: 0 0 14px;
  color: #0b7d76;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0;
}

.cover-section {
  justify-content: center;
  text-align: center;
}

.cover-content {
  position: relative;
  z-index: 2;
  width: min(980px, 100%);
  animation: rise-in 0.7s ease both;
}

.cover-content h1 {
  margin: 0;
  color: #0d1f2e;
  font-size: clamp(40px, 6vw, 76px);
  line-height: 1.05;
  letter-spacing: 0;
}

.cover-summary {
  width: min(760px, 100%);
  margin: 26px auto 34px;
  color: #365267;
  font-size: clamp(18px, 2vw, 24px);
  line-height: 1.7;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
}

.metric-card {
  min-height: 112px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  border: 1px solid rgba(16, 32, 51, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 18px 42px rgba(44, 70, 90, 0.08);
  backdrop-filter: blur(16px);
  animation: rise-in 0.7s ease both;
}

.metric-card:nth-child(2) { animation-delay: 0.06s; }
.metric-card:nth-child(3) { animation-delay: 0.12s; }
.metric-card:nth-child(4) { animation-delay: 0.18s; }
.metric-card:nth-child(5) { animation-delay: 0.24s; }
.metric-card:nth-child(6) { animation-delay: 0.3s; }

.metric-value {
  color: #102033;
  font-size: 30px;
  font-weight: 800;
}

.metric-label {
  color: #68788a;
  font-size: 13px;
  font-weight: 700;
}

.cover-orbit {
  position: absolute;
  border: 1px solid rgba(11, 183, 170, 0.18);
  border-radius: 50%;
  pointer-events: none;
}

.orbit-a {
  width: 720px;
  height: 720px;
  left: -220px;
  top: -180px;
}

.orbit-b {
  width: 520px;
  height: 520px;
  right: -120px;
  bottom: -130px;
  border-color: rgba(245, 158, 11, 0.18);
}

.scroll-hint {
  position: absolute;
  bottom: 26px;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 8px;
  transform: translateX(-50%);
  color: #637486;
  font-size: 13px;
  font-weight: 700;
}

.scroll-hint svg {
  width: 16px;
  height: 16px;
  animation: hint-down 1.4s ease-in-out infinite;
}

.split-section {
  display: grid;
  grid-template-columns: minmax(260px, 0.72fr) minmax(560px, 1.28fr);
  gap: 54px;
}

.section-copy {
  max-width: 440px;
  animation: rise-in 0.7s ease both;
}

.section-copy.centered {
  max-width: 820px;
  margin: 0 auto 26px;
  text-align: center;
}

.section-copy h2,
.summary-panel h2 {
  margin: 0;
  color: #0d1f2e;
  font-size: clamp(32px, 4.2vw, 56px);
  line-height: 1.12;
  letter-spacing: 0;
}

.section-copy p:not(.eyebrow) {
  margin: 22px 0 0;
  color: #52687c;
  font-size: 16px;
  line-height: 1.8;
}

.section-panel,
.timeline-panel,
.summary-panel {
  border: 1px solid rgba(16, 32, 51, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.74);
  box-shadow: 0 24px 60px rgba(44, 70, 90, 0.1);
  backdrop-filter: blur(18px);
}

.chart-panel {
  padding: 26px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
}

.panel-kicker {
  color: #758396;
  font-size: 12px;
  font-weight: 800;
}

.chart-header h3,
.cause-board h3,
.next-plan h3 {
  margin: 6px 0 0;
  color: #102033;
  font-size: 20px;
}

.confidence-badge {
  height: fit-content;
  border-radius: 999px;
  padding: 7px 10px;
  background: rgba(11, 183, 170, 0.1);
  color: #0b7d76;
  font-size: 12px;
  font-weight: 800;
}

.trend-chart {
  width: 100%;
  height: 320px;
}

.chart-grid line {
  stroke: rgba(71, 85, 105, 0.12);
}

.trend-area {
  fill: url(#trendArea);
}

.trend-line {
  fill: none;
  stroke: #0bb7aa;
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 860;
  animation: draw-line 1.1s ease both;
}

.trend-point {
  fill: #ffffff;
  stroke: #0bb7aa;
  stroke-width: 4;
}

.trend-label {
  fill: #718096;
  font-size: 13px;
  font-weight: 700;
  text-anchor: middle;
}

.knowledge-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.knowledge-card {
  padding: 16px;
  border: 1px solid rgba(16, 32, 51, 0.08);
  border-radius: 8px;
  background: #ffffff;
}

.knowledge-main,
.knowledge-meta,
.weakness-title-row,
.weakness-meta,
.risk-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.knowledge-main span {
  color: #102033;
  font-weight: 800;
}

.positive {
  color: #059669;
}

.negative {
  color: #dc2626;
}

.mini-track {
  height: 8px;
  margin: 12px 0 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #e6edf2;
}

.mini-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0bb7aa, #3b82f6);
}

.knowledge-meta {
  color: #758396;
  font-size: 12px;
  font-weight: 700;
}

.weakness-panel {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 18px;
  padding: 22px;
}

.weakness-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.weakness-card {
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 14px;
  padding: 18px;
  border-radius: 8px;
  background: #ffffff;
  border-left: 4px solid #94a3b8;
}

.weakness-card.high {
  border-left-color: #ef4444;
}

.weakness-card.medium {
  border-left-color: #f59e0b;
}

.weakness-card.low {
  border-left-color: #0bb7aa;
}

.weakness-rank {
  color: rgba(16, 32, 51, 0.28);
  font-size: 26px;
  font-weight: 900;
}

.weakness-title-row h3 {
  margin: 0;
  color: #102033;
  font-size: 18px;
}

.weakness-title-row span,
.risk-pill {
  border-radius: 999px;
  padding: 4px 9px;
  background: #f1f5f9;
  color: #516274;
  font-size: 12px;
  font-weight: 800;
}

.weakness-body p {
  margin: 10px 0;
  color: #52687c;
  line-height: 1.7;
}

.weakness-meta {
  justify-content: flex-start;
  color: #758396;
  font-size: 12px;
  font-weight: 700;
}

.cause-board {
  padding: 20px;
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(11, 183, 170, 0.08), rgba(255, 255, 255, 0.9));
}

.cause-row {
  padding: 16px 0;
  border-bottom: 1px solid rgba(16, 32, 51, 0.08);
}

.cause-row:last-child {
  border-bottom: 0;
}

.cause-row span {
  display: block;
  color: #0b7d76;
  font-weight: 900;
  margin-bottom: 6px;
}

.cause-row p {
  margin: 0;
  color: #52687c;
  line-height: 1.7;
}

.adjustments-section {
  flex-direction: column;
  justify-content: center;
}

.timeline-panel {
  width: min(1040px, 100%);
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 12px;
}

.timeline-item {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  align-items: center;
  gap: 18px;
  padding: 20px;
  border-radius: 8px;
  animation: rise-in 0.7s ease both;
}

.timeline-item + .timeline-item {
  border-top: 1px solid rgba(16, 32, 51, 0.08);
}

.timeline-index {
  color: rgba(11, 183, 170, 0.24);
  font-size: 32px;
  font-weight: 900;
}

.timeline-copy span {
  color: #758396;
  font-size: 12px;
  font-weight: 800;
}

.timeline-copy h3 {
  margin: 6px 0;
  color: #102033;
  font-size: 18px;
}

.timeline-copy p {
  margin: 0;
  color: #52687c;
  line-height: 1.6;
}

.timeline-status,
.status-pill {
  border-radius: 999px;
  padding: 7px 11px;
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.review-panel {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 18px;
  padding: 22px;
}

.risk-table {
  overflow: hidden;
  border: 1px solid rgba(16, 32, 51, 0.08);
  border-radius: 8px;
  background: #ffffff;
}

.risk-row {
  display: grid;
  grid-template-columns: 1fr 100px 1.1fr 104px;
  padding: 15px 16px;
  border-bottom: 1px solid rgba(16, 32, 51, 0.08);
  color: #52687c;
  font-size: 13px;
}

.risk-row:last-child {
  border-bottom: 0;
}

.risk-head {
  background: #f4f8fb;
  color: #758396;
  font-weight: 900;
}

.risk-row strong {
  color: #102033;
}

.risk-pill {
  width: fit-content;
}

.risk-pill.high {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.risk-pill.medium {
  background: rgba(245, 158, 11, 0.12);
  color: #b45309;
}

.risk-pill.low {
  background: rgba(11, 183, 170, 0.1);
  color: #0b7d76;
}

.next-plan {
  padding: 22px;
  border-radius: 8px;
  background: #102033;
  color: #ffffff;
}

.next-plan h3 {
  color: #ffffff;
}

.next-plan ol {
  margin: 18px 0;
  padding-left: 20px;
  color: rgba(255, 255, 255, 0.86);
  line-height: 1.8;
}

.next-plan p {
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.7;
}

.summary-section {
  justify-content: center;
  text-align: center;
}

.summary-panel {
  width: min(920px, 100%);
  padding: 52px;
}

.agent-summary {
  width: min(760px, 100%);
  margin: 22px auto 30px;
  color: #52687c;
  font-size: 17px;
  line-height: 1.85;
}

.grade-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 30px;
}

.grade-card {
  padding: 18px;
  border-radius: 8px;
  background: #f4f8fb;
}

.grade-card span {
  display: block;
  color: #758396;
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 8px;
}

.grade-card strong {
  color: #102033;
  font-size: 18px;
}

.summary-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.primary-action,
.secondary-action {
  min-width: 132px;
  height: 42px;
  border-radius: 999px;
  padding: 0 18px;
  font-weight: 800;
  cursor: pointer;
}

.primary-action {
  border: 0;
  background: #0bb7aa;
  color: #ffffff;
  box-shadow: 0 14px 28px rgba(11, 183, 170, 0.24);
}

.secondary-action {
  border: 1px solid rgba(16, 32, 51, 0.12);
  background: #ffffff;
  color: #294057;
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes hint-down {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(5px);
  }
}

@keyframes draw-line {
  from {
    stroke-dashoffset: 860;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@media (max-width: 1080px) {
  .split-section {
    grid-template-columns: 1fr;
    align-content: center;
    gap: 26px;
  }

  .section-copy {
    max-width: 760px;
  }

  .metric-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .weakness-panel,
  .review-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .learning-report-page {
    scroll-snap-type: none;
  }

  .report-topbar {
    left: 12px;
    right: 12px;
    grid-template-columns: 1fr auto;
  }

  .brand-mark {
    display: none;
  }

  .report-range {
    font-size: 12px;
  }

  .section-nav {
    display: none;
  }

  .report-section {
    min-height: auto;
    padding: 94px 18px 54px;
  }

  .cover-content h1,
  .section-copy h2,
  .summary-panel h2 {
    font-size: 34px;
  }

  .metric-grid,
  .knowledge-cards,
  .grade-row {
    grid-template-columns: 1fr;
  }

  .chart-panel,
  .weakness-panel,
  .review-panel,
  .summary-panel {
    padding: 18px;
  }

  .trend-chart {
    height: 230px;
  }

  .risk-row {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .timeline-item {
    grid-template-columns: 1fr;
  }
}
</style>
