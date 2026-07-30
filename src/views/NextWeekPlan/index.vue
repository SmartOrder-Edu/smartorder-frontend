<template>
  <AppLayout>
    <div class="next-week-plan-page">
      <!-- ==================== Section 1: Hero Banner ==================== -->
      <section class="hero-banner glass">
        <div class="hero-left">
          <div class="agent-avatar-ring">
            <svg viewBox="0 0 72 72" fill="none" class="agent-avatar-svg">
              <circle cx="36" cy="36" r="34" stroke="url(#avatarGrad)" stroke-width="2.5" fill="none" class="avatar-track" />
              <circle cx="36" cy="36" r="34" stroke="url(#avatarGrad)" stroke-width="2.5" fill="none" stroke-dasharray="214" stroke-dashoffset="54" stroke-linecap="round" class="avatar-progress" />
              <defs>
                <linearGradient id="avatarGrad" x1="0" y1="0" x2="72" y2="72">
                  <stop offset="0%" stop-color="#0bb7aa" />
                  <stop offset="100%" stop-color="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <span class="agent-letter">序</span>
          </div>
          <div class="agent-greeting-block">
            <div class="agent-status-row">
              <span class="agent-dot"></span>
              <span class="agent-status-text">{{ agentInfo.statusText }}</span>
            </div>
            <h1 class="greeting-title">{{ agentInfo.greeting }}</h1>
            <p class="greeting-brief">{{ agentInfo.briefing }}</p>
            <span class="updated-at">更新于 {{ agentInfo.updatedAt }}</span>
          </div>
        </div>
        <div class="hero-stats">
          <div
            v-for="(stat, i) in heroStats"
            :key="stat.key"
            class="hero-stat-card"
            :style="{ animationDelay: `${0.1 + i * 0.1}s` }"
          >
            <div class="stat-icon" :style="{ color: stat.color }">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22">
                <component :is="'g'" v-html="stat.icon" />
              </svg>
            </div>
            <div class="stat-body">
              <span class="stat-value" :style="{ color: stat.color }">
                {{ displayValues[stat.key]?.toFixed(0) || 0 }}
              </span>
              <span class="stat-unit">{{ stat.unit }}</span>
            </div>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
        </div>
      </section>

      <!-- ==================== Section 2: Weekly Timeline ==================== -->
      <section class="timeline-section">
        <div class="section-header">
          <h2 class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20" class="section-icon">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            一周学习节奏
          </h2>
          <span class="section-badge">Agent 编排</span>
        </div>
        <div class="timeline-strip">
          <div
            v-for="(day, i) in weekDays"
            :key="day.date"
            class="day-card"
            :class="{
              'is-highlight': day.highlight,
              'is-rest': day.highlightReason === '休息日',
              'is-today': day.isToday
            }"
            :style="{ animationDelay: `${0.15 + i * 0.06}s` }"
          >
            <div class="day-top">
              <span class="day-name">{{ day.day }}</span>
              <span class="day-date">{{ day.date }}</span>
            </div>
            <div class="day-badge" v-if="day.highlightReason">{{ day.highlightReason }}</div>
            <div class="day-task-count">
              <span class="count-num">{{ day.taskCount }}</span>
              <span class="count-label">个任务</span>
            </div>
            <div class="day-time">{{ day.totalMinutes >= 60 ? `${Math.floor(day.totalMinutes / 60)}h${day.totalMinutes % 60 > 0 ? day.totalMinutes % 60 + 'm' : ''}` : day.totalMinutes + 'm' }}</div>
            <div class="day-space-dots">
              <span v-for="(c, di) in day.spaceColors" :key="di" class="space-dot" :style="{ background: c }"></span>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== Section 3: Time Allocation Donut ==================== -->
      <section class="donut-section">
        <div class="section-header">
          <h2 class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20" class="section-icon">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
            </svg>
            时间分配策略
          </h2>
          <span class="section-badge">共 {{ timeSegments.reduce((s, t) => s + t.hours, 0) }} 小时</span>
        </div>
        <div class="donut-layout">
          <div class="donut-chart-wrap">
            <svg viewBox="0 0 200 200" class="donut-svg">
              <circle cx="100" cy="100" r="70" fill="none" stroke="var(--border-soft)" stroke-width="14" class="donut-track" />
              <g transform="rotate(-90 100 100)">
                <circle
                  v-for="(seg, i) in timeSegments"
                  :key="seg.name"
                  cx="100" cy="100" r="70"
                  fill="none"
                  :stroke="seg.color"
                  stroke-width="14"
                  stroke-linecap="round"
                  :stroke-dasharray="`${seg.arcLength} ${totalCircumference}`"
                  :stroke-dashoffset="donutAnimated ? seg.dashOffsetTarget : seg.dashOffsetInitial"
                  :style="{ transition: `stroke-dashoffset 0.9s cubic-bezier(0.34, 1.4, 0.64, 1) ${0.1 * i}s`, opacity: hoveredSegment === null || hoveredSegment === i ? 1 : 0.34 }"
                  class="donut-segment"
                  @mouseenter="hoveredSegment = i"
                  @mouseleave="hoveredSegment = null"
                />
              </g>
              <text x="100" y="94" text-anchor="middle" class="donut-center-value">
                {{ displayTotalHours.toFixed(1) }}
              </text>
              <text x="100" y="114" text-anchor="middle" class="donut-center-label">总小时</text>
            </svg>
          </div>
          <div class="donut-legend">
            <div
              v-for="(seg, i) in timeSegments"
              :key="seg.name"
              class="legend-item"
              :class="{ 'is-active': hoveredSegment === null || hoveredSegment === i }"
              :style="{ animationDelay: `${0.5 + i * 0.1}s` }"
              @mouseenter="hoveredSegment = i"
              @mouseleave="hoveredSegment = null"
            >
              <span class="legend-dot" :style="{ background: seg.color }"></span>
              <span class="legend-name">{{ seg.name }}</span>
              <span class="legend-hours">{{ seg.hours }}h</span>
              <span class="legend-reason">{{ seg.reason }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== Section 4: Priority Tasks Spotlight ==================== -->
      <section class="priority-section">
        <div class="section-header">
          <h2 class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20" class="section-icon">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
            Agent 重点标记
          </h2>
          <span class="section-badge">优先执行</span>
        </div>
        <div class="priority-cards">
          <div
            v-for="(task, i) in priorityTasks"
            :key="task.id"
            class="priority-card glass"
            :class="{ 'is-expanded': task.expanded, 'is-top': i === 0 }"
            :style="{ animationDelay: `${0.1 + i * 0.1}s` }"
            @click="task.expanded = !task.expanded"
          >
            <div class="priority-bar" :style="{ background: task.spaceColor }"></div>
            <div class="priority-content">
              <div class="priority-header">
                <div class="priority-tags">
                  <span class="priority-rank" :class="`rank-${i + 1}`">#{{ i + 1 }}</span>
                  <span class="space-tag" :style="{ background: task.spaceColor + '20', color: task.spaceColor }">{{ task.spaceName }}</span>
                  <span class="type-tag">{{ task.typeName }}</span>
                </div>
                <span class="priority-day">{{ task.day }}</span>
              </div>
              <h3 class="priority-title">{{ task.title }}</h3>
              <div class="priority-meta">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                <span>{{ task.duration }}</span>
              </div>
              <div class="priority-reason" :class="{ 'is-open': task.expanded }">
                <div class="reason-header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" class="reason-bulb"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <span class="reason-label">Agent 推荐理由</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" class="expand-arrow" :class="{ 'is-open': task.expanded }"><polyline points="6,9 12,15 18,9" /></svg>
                </div>
                <p class="reason-text">{{ task.agentReason }}</p>
                <div class="reason-detail" v-if="task.expanded">
                  <p>{{ task.agentDetail }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== Section 5: Learning Path Preview ==================== -->
      <section class="path-section">
        <div class="section-header">
          <h2 class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20" class="section-icon">
              <circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" /><line x1="12" y1="7" x2="5" y2="17" /><line x1="12" y1="7" x2="19" y2="17" />
            </svg>
            知识路径预览
          </h2>
          <span class="section-badge">路径规划</span>
        </div>
        <div class="path-nodes">
          <template v-for="(node, i) in knowledgeNodes" :key="node.id">
            <div
              class="path-node"
              :class="`status-${node.status}`"
              :style="{ animationDelay: `${0.15 * i}s` }"
            >
              <div class="node-ring">
                <svg viewBox="0 0 48 48" class="node-svg">
                  <circle cx="24" cy="24" r="20" fill="none" class="node-circle" />
                  <circle v-if="node.status === 'in-progress'" cx="24" cy="24" r="20" fill="none" stroke="url(#pathGrad)" stroke-width="2.5" stroke-dasharray="126" :stroke-dashoffset="pathAnimated ? 31 : 126" class="node-progress" />
                  <g v-if="node.status === 'mastered'" class="node-check">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="#22c55e" stroke-width="2.5" />
                    <polyline points="16,24 21,29 32,19" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                  </g>
                  <text x="24" y="28" text-anchor="middle" class="node-emoji">{{ node.emoji }}</text>
                </svg>
                <defs>
                  <linearGradient id="pathGrad" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stop-color="#0bb7aa" />
                    <stop offset="100%" stop-color="#3b82f6" />
                  </linearGradient>
                </defs>
              </div>
              <span class="node-name">{{ node.name }}</span>
              <span class="node-target">{{ node.weekTarget }}</span>
            </div>
            <div
              v-if="i < knowledgeNodes.length - 1"
              class="path-connector"
              :class="{ 'is-drawn': pathAnimated }"
              :style="{ animationDelay: `${0.15 * i + 0.3}s` }"
            >
              <svg viewBox="0 0 60 4" class="connector-svg">
                <line x1="0" y1="2" x2="60" y2="2" stroke="var(--border-soft)" stroke-width="4" stroke-linecap="round" />
                <line x1="0" y1="2" x2="60" y2="2" stroke="url(#connGrad)" stroke-width="4" stroke-linecap="round" stroke-dasharray="60" :stroke-dashoffset="pathAnimated ? 0 : 60" class="connector-line" />
                <defs>
                  <linearGradient id="connGrad" x1="0" y1="0" x2="60" y2="0">
                    <stop offset="0%" stop-color="#0bb7aa" />
                    <stop offset="100%" stop-color="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </template>
        </div>
      </section>

      <!-- ==================== Section 6: Agent Strategy ==================== -->
      <section class="strategy-section">
        <div class="section-header">
          <h2 class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20" class="section-icon">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            规划策略
          </h2>
          <div class="agent-indicator">
            <span class="agent-pulse-dot"></span>
            <span class="agent-indicator-text">Agent 决策中</span>
          </div>
        </div>
        <div class="strategy-cards">
          <div
            v-for="(s, i) in strategies"
            :key="s.priority"
            class="strategy-card glass"
            :style="{ animationDelay: `${0.1 + i * 0.1}s` }"
          >
            <div class="strategy-icon" :style="{ background: s.color + '18', color: s.color }">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                <component :is="'g'" v-html="s.icon" />
              </svg>
            </div>
            <div class="strategy-body">
              <span class="strategy-priority">{{ s.priority }}</span>
              <h3 class="strategy-title">{{ s.title }}</h3>
              <p class="strategy-desc">{{ s.description }}</p>
            </div>
          </div>
        </div>
        <div class="strategy-actions">
          <button class="replan-btn" :class="{ 'is-loading': isReplanning, 'is-done': replanDone }" @click="handleReplan" :disabled="isReplanning">
            <span v-if="!isReplanning && !replanDone" class="btn-content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="1,4 1,10 7,10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
              重新规划
            </span>
            <span v-else-if="isReplanning" class="btn-content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" class="spin-icon"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="10" /></svg>
              Agent 分析中...
            </span>
            <span v-else class="btn-content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="20,6 9,17 4,12" /></svg>
              规划已更新
            </span>
          </button>
        </div>
      </section>

      <!-- ==================== Section 7: Action Footer ==================== -->
      <section class="action-footer">
        <div class="footer-inner glass">
          <p class="footer-callout">准备好了吗？让这一周成为你的成长加速器</p>
          <div class="footer-buttons">
            <button class="footer-btn primary-btn" @click="handleStartWeek">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><polygon points="5,3 19,12 5,21" /></svg>
              开始本周学习
            </button>
            <button class="footer-btn secondary-btn" @click="handleAdjust">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
              调整计划
            </button>
            <button class="footer-btn tertiary-btn" @click="goToReport">
              查看学习周报
            </button>
          </div>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useCountUp } from '@/composables/useCountUp'

const router = useRouter()

// ======================== Mock Data ========================

const agentInfo = reactive({
  name: '小序',
  statusText: '规划完成 · 已优化 3 轮',
  greeting: '谢同学，你下周的学习计划已经准备就绪',
  briefing: '基于你最近 7 天的学习报告，我重新调整了时间分配策略。上周你在递归调用栈和洛必达法则上出现了反复错误，下周前 2 天集中补弱，第 3 天测评检验，之后恢复正常节奏推进。',
  updatedAt: '2026-07-30 22:15',
})

const heroStats = [
  { key: 'totalTasks', label: '总任务数', value: 18, unit: '个', color: '#0bb7aa', icon: '<rect x="4" y="3" width="16" height="18" rx="2"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>' },
  { key: 'totalHours', label: '预计学习时长', value: 8.5, unit: '小时', color: '#3b82f6', icon: '<circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>' },
  { key: 'totalSpaces', label: '涉及学习空间', value: 3, unit: '个空间', color: '#8b5cf6', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>' },
  { key: 'consolidatePoints', label: '复习巩固点', value: 5, unit: '个', color: '#f59e0b', icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>' },
]

const weekDays = [
  { day: '周一', date: '08/03', taskCount: 4, totalMinutes: 120, highlight: true, highlightReason: '补弱日', spaceColors: ['#0bb7aa', '#3b82f6'], isToday: false },
  { day: '周二', date: '08/04', taskCount: 3, totalMinutes: 90, highlight: false, highlightReason: '', spaceColors: ['#0bb7aa', '#8b5cf6'], isToday: false },
  { day: '周三', date: '08/05', taskCount: 2, totalMinutes: 60, highlight: true, highlightReason: '测评日', spaceColors: ['#f59e0b'], isToday: false },
  { day: '周四', date: '08/06', taskCount: 3, totalMinutes: 90, highlight: false, highlightReason: '', spaceColors: ['#3b82f6', '#0bb7aa'], isToday: false },
  { day: '周五', date: '08/07', taskCount: 2, totalMinutes: 90, highlight: true, highlightReason: '项目日', spaceColors: ['#8b5cf6'], isToday: false },
  { day: '周六', date: '08/08', taskCount: 2, totalMinutes: 30, highlight: false, highlightReason: '轻量复习', spaceColors: ['#06b6d4'], isToday: false },
  { day: '周日', date: '08/09', taskCount: 1, totalMinutes: 30, highlight: false, highlightReason: '休息日', spaceColors: ['#06b6d4'], isToday: false },
]

const totalCircumference = 2 * Math.PI * 70 // ~439.8

const timeSegmentsRaw = [
  { name: '专项练习', hours: 5.5, color: '#0bb7aa', reason: '递归调用栈与洛必达法则需要集中强化' },
  { name: '知识复习', hours: 4, color: '#3b82f6', reason: '巩固本周所学，形成长期记忆' },
  { name: '项目实践', hours: 3, color: '#8b5cf6', reason: '用户故事地图绘制实战练习' },
  { name: '测评检验', hours: 2, color: '#f59e0b', reason: '通过测评验证补弱效果' },
  { name: '自由探索', hours: 1.5, color: '#06b6d4', reason: '弹性时间，探索兴趣方向' },
]

const totalHours = timeSegmentsRaw.reduce((s, t) => s + t.hours, 0)

const timeSegments = timeSegmentsRaw.map((seg) => {
  const percent = seg.hours / totalHours
  const arcLength = percent * totalCircumference
  const startOffset = timeSegmentsRaw
    .slice(0, timeSegmentsRaw.indexOf(seg))
    .reduce((s, t) => s + (t.hours / totalHours) * totalCircumference, 0)
  return {
    ...seg,
    arcLength,
    dashOffsetTarget: -startOffset,
    dashOffsetInitial: -startOffset - arcLength,
  }
})

const priorityTasks = reactive([
  {
    id: 'p1',
    title: '递归调用栈步骤追踪专项练习',
    spaceName: '高等数学',
    spaceColor: '#0bb7aa',
    typeName: '练习',
    day: '周一',
    duration: '45 分钟',
    priority: 1,
    agentReason: '你在递归调用栈上连续 3 次作业出错，是本周最需要修复的薄弱点。',
    agentDetail: '根据上周的作业批改记录，你在"递归调用栈的步骤追踪"题型上正确率仅为 42%（全班平均 71%）。这个知识点是后续二叉树遍历、动态规划等章节的前置依赖，如果不及时修复，会形成连锁薄弱。建议从最基础的 2 层递归开始，逐步增加到 4 层，每种类型完成 5 道题后进入下一难度。',
    expanded: false,
  },
  {
    id: 'p2',
    title: '洛必达法则综合练习 8 题',
    spaceName: '高等数学',
    spaceColor: '#0bb7aa',
    typeName: '练习',
    day: '周二',
    duration: '35 分钟',
    priority: 2,
    agentReason: '洛必达法则在 0/0 型和 ∞/∞ 型判断上存在混淆，需要针对性训练。',
    agentDetail: '上周测评中，你在判断是否可以使用洛必达法则时，有 3 次在不符合条件的场景下错误应用了该法则。本周重点练习：先判断条件（0/0 或 ∞/∞），再应用法则。每道题都必须先写出判断过程，再计算。',
    expanded: false,
  },
  {
    id: 'p3',
    title: '用户故事地图绘制实战',
    spaceName: '软件工程',
    spaceColor: '#8b5cf6',
    typeName: '项目',
    day: '周五',
    duration: '60 分钟',
    priority: 3,
    agentReason: '软件工程课程的期末项目已启动，用户故事地图是第一阶段核心交付物。',
    agentDetail: '你的软件工程期末项目"校园二手书交易平台"已经进入需求分析阶段。用户故事地图需要在周五前完成初稿，以便下周进行用户访谈验证。建议按照"用户角色 → 用户活动 → 用户任务 → 用户故事"的层次来组织。',
    expanded: false,
  },
  {
    id: 'p4',
    title: '四级听力真题精听 2 篇',
    spaceName: '英语四级',
    spaceColor: '#f59e0b',
    typeName: '复习',
    day: '周四',
    duration: '25 分钟',
    priority: 4,
    agentReason: '距四级考试还有 6 周，听力模块需要每周保持 2 次精听训练。',
    agentDetail: '按照你的四级备考计划，听力模块目前进度 35%，落后于阅读（52%）和写作（48%）。本周需要追赶进度。精听方法：第一遍盲听做题，第二遍逐句听写，第三遍对照原文标记生词和连读。',
    expanded: false,
  },
])

const knowledgeNodes = [
  { id: 'k1', name: '链表基础', status: 'mastered' as const, weekTarget: '已掌握', emoji: '✓' },
  { id: 'k2', name: '递归调用栈', status: 'in-progress' as const, weekTarget: '完成步骤追踪练习', emoji: '🔁' },
  { id: 'k3', name: '二叉树遍历', status: 'planned' as const, weekTarget: '理解前中后序遍历', emoji: '🌳' },
  { id: 'k4', name: '用户故事地图', status: 'in-progress' as const, weekTarget: '完成项目初稿', emoji: '🗺️' },
  { id: 'k5', name: '听力精听', status: 'in-progress' as const, weekTarget: '完成 2 篇真题精听', emoji: '🎧' },
]

const strategies = [
  {
    priority: '首要策略',
    title: '补弱优先',
    description: '分析学习报告中的薄弱点，前 2 天集中资源修复。周一专注递归调用栈，周二攻克洛必达法则，确保缺陷在知识链传播前被隔离修复。',
    color: '#0bb7aa',
    icon: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  },
  {
    priority: '节奏策略',
    title: '难度渐进',
    description: '第 1-2 天高强度补弱 → 第 3 天测评检验效果 → 第 4-5 天恢复正常推进 + 项目实践 → 第 6-7 天轻量复习与弹性缓冲。',
    color: '#3b82f6',
    icon: '<polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />',
  },
  {
    priority: '保障策略',
    title: '弹性缓冲',
    description: '周六仅安排 30 分钟轻量复习，周日保留为弹性日。如果前半周补弱任务超时，可用弹性日追赶；如果进度正常，则用于自由探索。',
    color: '#8b5cf6',
    icon: '<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/>',
  },
]

// ======================== Animation State ========================

const donutAnimated = ref(false)
const pathAnimated = ref(false)
const isReplanning = ref(false)
const replanDone = ref(false)
const hoveredSegment = ref<number | null>(null)

// Count-up targets
const statTargets = computed(() => ({
  totalTasks: 18,
  totalHours: 8.5,
  totalSpaces: 3,
  consolidatePoints: 5,
}))

const displayValues = reactive({
  totalTasks: useCountUp(() => statTargets.value.totalTasks),
  totalHours: useCountUp(() => statTargets.value.totalHours),
  totalSpaces: useCountUp(() => statTargets.value.totalSpaces),
  consolidatePoints: useCountUp(() => statTargets.value.consolidatePoints),
})

const displayTotalHours = useCountUp(() => totalHours)

// ======================== Actions ========================

function handleReplan() {
  if (isReplanning.value) return
  isReplanning.value = true
  replanDone.value = false
  setTimeout(() => {
    isReplanning.value = false
    replanDone.value = true
    setTimeout(() => {
      replanDone.value = false
    }, 2500)
  }, 1500)
}

function handleStartWeek() {
  router.push('/tasks')
}

function handleAdjust() {
  router.push('/tasks')
}

function goToReport() {
  router.push('/learning-report/weekly')
}

// ======================== Lifecycle ========================

onMounted(() => {
  nextTick(() => {
    // Trigger donut animation
    setTimeout(() => { donutAnimated.value = true }, 300)
    // Trigger path animation
    setTimeout(() => { pathAnimated.value = true }, 600)
  })
})
</script>

<style scoped lang="scss">
// ======================== Page Layout ========================
.next-week-plan-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg) var(--spacing-3xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xl);
}

// ======================== Shared: Section Header ========================
.section-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0;
}

.section-icon {
  color: var(--primary-color);
  flex-shrink: 0;
}

.section-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--primary-color);
  background: rgba(11, 183, 170, 0.1);
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  letter-spacing: 0.03em;
}

// ======================== Section 1: Hero Banner ========================
.hero-banner {
  display: flex;
  gap: var(--spacing-2xl);
  padding: 2.4rem 2.2rem;
  border-radius: var(--radius-xl);
  animation: fadeInUp 0.6s ease both;
  flex-wrap: wrap;
}

.hero-left {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-lg);
  flex: 1;
  min-width: 320px;
}

.agent-avatar-ring {
  position: relative;
  width: 72px;
  height: 72px;
  flex-shrink: 0;
}

.agent-avatar-svg {
  width: 100%;
  height: 100%;
}

.avatar-track {
  opacity: 0.2;
}

.avatar-progress {
  animation: avatarPulse 2.5s ease-in-out infinite;
}

@keyframes avatarPulse {
  0%, 100% { stroke-dashoffset: 54; }
  50% { stroke-dashoffset: 20; }
}

.agent-letter {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  font-weight: 800;
  background: linear-gradient(135deg, #0bb7aa, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.agent-greeting-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.agent-status-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.agent-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  animation: pulse 2s ease-in-out infinite;
}

.agent-status-text {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 600;
  letter-spacing: 0.03em;
}

.greeting-title {
  margin: 0;
  font-family: 'Noto Serif SC', 'Noto Sans SC', serif;
  font-size: clamp(22px, 3.5vw, 32px);
  font-weight: 700;
  color: var(--text-dark);
  line-height: 1.3;
}

.greeting-brief {
  margin: 0;
  font-size: 0.92rem;
  color: var(--text-secondary);
  line-height: 1.7;
  max-width: 520px;
}

.updated-at {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  flex: 0 0 340px;
}

.hero-stat-card {
  background: var(--panel-bg);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  animation: fadeInUp 0.5s ease both;
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-glow);
  }
}

.stat-icon {
  opacity: 0.8;
}

.stat-body {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.stat-unit {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 600;
}

.stat-label {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 500;
}

// ======================== Section 2: Weekly Timeline ========================
.timeline-section {
  animation: fadeInUp 0.6s ease 0.15s both;
}

.timeline-strip {
  display: flex;
  gap: var(--spacing-sm);
  overflow-x: auto;
  padding-bottom: var(--spacing-sm);
  scroll-snap-type: x proximity;

  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background: var(--border-soft); border-radius: 4px; }
}

.day-card {
  flex: 1;
  min-width: 110px;
  background: var(--panel-bg);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  padding: 1rem 0.9rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  animation: fadeInUp 0.5s ease both;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  scroll-snap-align: start;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }

  &.is-highlight {
    border-color: rgba(11, 183, 170, 0.4);
    box-shadow: 0 0 16px rgba(11, 183, 170, 0.12);
  }

  &.is-rest {
    opacity: 0.6;
    border-style: dashed;
  }

  &.is-today {
    border-color: var(--primary-color);
    border-width: 2px;
    box-shadow: 0 0 20px rgba(11, 183, 170, 0.2);
  }
}

.day-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
}

.day-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-dark);
}

.day-date {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-weight: 500;
}

.day-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: rgba(11, 183, 170, 0.12);
  color: var(--primary-color);
  letter-spacing: 0.04em;

  .is-rest & {
    background: rgba(148, 163, 184, 0.12);
    color: var(--text-muted);
  }
}

.day-task-count {
  display: flex;
  align-items: baseline;
  gap: 0.15rem;
}

.count-num {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-dark);
  line-height: 1;
}

.count-label {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.day-time {
  font-size: 0.72rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.day-space-dots {
  display: flex;
  gap: 3px;
}

.space-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

// ======================== Section 3: Time Allocation Donut ========================
.donut-section {
  animation: fadeInUp 0.6s ease 0.25s both;
}

.donut-layout {
  display: flex;
  align-items: center;
  gap: var(--spacing-2xl);
  flex-wrap: wrap;
}

.donut-chart-wrap {
  flex: 0 0 220px;
}

.donut-svg {
  width: 220px;
  height: 220px;
}

.donut-track {
  opacity: 0.15;
}

.donut-segment {
  cursor: pointer;
  transition: opacity 0.25s ease;
}

.donut-center-value {
  font-size: 1.6rem;
  font-weight: 800;
  fill: var(--text-dark);
  font-variant-numeric: tabular-nums;
}

.donut-center-label {
  font-size: 0.72rem;
  fill: var(--text-muted);
  font-weight: 600;
}

.donut-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  min-width: 240px;
}

.legend-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto auto;
  align-items: center;
  gap: 0.3rem 0.5rem;
  padding: 0.55rem 0.8rem;
  border-radius: var(--radius-md);
  animation: fadeInUp 0.4s ease both;
  transition: background 0.2s ease, opacity 0.2s ease;
  cursor: pointer;

  &.is-active {
    opacity: 1;
  }

  &:not(.is-active) {
    opacity: 0.45;
  }

  &:hover {
    background: var(--panel-bg);
  }
}

.legend-dot {
  grid-row: 1;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-name {
  grid-row: 1;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-dark);
}

.legend-hours {
  grid-row: 1;
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-dark);
  font-variant-numeric: tabular-nums;
}

.legend-reason {
  grid-column: 2 / 4;
  font-size: 0.72rem;
  color: var(--text-muted);
  line-height: 1.4;
}

// ======================== Section 4: Priority Tasks ========================
.priority-section {
  animation: fadeInUp 0.6s ease 0.35s both;
}

.priority-cards {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.priority-card {
  display: flex;
  border-radius: var(--radius-lg);
  overflow: hidden;
  animation: fadeInUp 0.5s ease both;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  &.is-top .priority-bar {
    animation: priorityGlow 2s ease-in-out infinite;
  }
}

@keyframes priorityGlow {
  0%, 100% { box-shadow: 0 0 8px rgba(11, 183, 170, 0.3); }
  50% { box-shadow: 0 0 20px rgba(11, 183, 170, 0.6); }
}

.priority-bar {
  width: 4px;
  flex-shrink: 0;
}

.priority-content {
  flex: 1;
  padding: 1.2rem 1.3rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.priority-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.priority-tags {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.priority-rank {
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.12);
  color: var(--text-muted);

  &.rank-1 { background: rgba(11, 183, 170, 0.15); color: var(--primary-color); }
  &.rank-2 { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
  &.rank-3 { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; }
  &.rank-4 { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
}

.space-tag {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
}

.type-tag {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.08);
}

.priority-day {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 600;
}

.priority-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-dark);
  line-height: 1.4;
}

.priority-meta {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-weight: 600;

  svg { opacity: 0.6; }
}

.priority-reason {
  margin-top: 0.2rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--border-soft);
}

.reason-header {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.reason-bulb { color: #f59e0b; flex-shrink: 0; }

.reason-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.03em;
  flex: 1;
}

.expand-arrow {
  color: var(--text-muted);
  transition: transform 0.3s ease;

  &.is-open {
    transform: rotate(180deg);
  }
}

.reason-text {
  margin: 0.4rem 0 0;
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.reason-detail {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s ease, margin-top 0.35s ease;

  .is-expanded & {
    max-height: 200px;
    margin-top: 0.5rem;
  }

  p {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-muted);
    line-height: 1.65;
    padding: 0.7rem 0.8rem;
    background: rgba(11, 183, 170, 0.04);
    border-radius: var(--radius-sm);
    border-left: 2px solid rgba(11, 183, 170, 0.3);
  }
}

// ======================== Section 5: Learning Path ========================
.path-section {
  animation: fadeInUp 0.6s ease 0.45s both;
}

.path-nodes {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  flex-wrap: wrap;
  padding: var(--spacing-lg) 0;
}

.path-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  animation: fadeInUp 0.5s ease both;
  width: 110px;
}

.node-ring {
  width: 56px;
  height: 56px;
}

.node-svg {
  width: 100%;
  height: 100%;
}

.node-circle {
  stroke: var(--border-soft);
  stroke-width: 2.5;

  .status-mastered & { stroke: #22c55e; }
  .status-in-progress & { stroke: #0bb7aa; stroke-dasharray: 6 3; }
  .status-planned & { stroke: var(--border-color); stroke-dasharray: 4 4; }
}

.node-progress {
  transition: stroke-dashoffset 1s cubic-bezier(0.34, 1.4, 0.64, 1) 0.5s;
}

.node-check {
  polyline {
    stroke-dasharray: 20;
    stroke-dashoffset: 0;
  }
}

.node-emoji {
  font-size: 0.9rem;
}

.node-name {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-dark);
  text-align: center;
  line-height: 1.3;
}

.node-target {
  font-size: 0.65rem;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.3;
  max-width: 100px;
}

.path-connector {
  width: 60px;
  flex-shrink: 0;
}

.connector-svg {
  width: 100%;
  height: 4px;
  display: block;
}

.connector-line {
  transition: stroke-dashoffset 0.8s cubic-bezier(0.34, 1.4, 0.64, 1);
}

// ======================== Section 6: Agent Strategy ========================
.strategy-section {
  animation: fadeInUp 0.6s ease 0.55s both;
}

.agent-indicator {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-left: auto;
}

.agent-pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #0bb7aa;
  animation: glowPulse 2s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 4px rgba(11, 183, 170, 0.4); }
  50% { box-shadow: 0 0 12px rgba(11, 183, 170, 0.8); }
}

.agent-indicator-text {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--primary-color);
  letter-spacing: 0.04em;
}

.strategy-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.strategy-card {
  display: flex;
  gap: var(--spacing-md);
  padding: 1.3rem;
  border-radius: var(--radius-lg);
  animation: fadeInUp 0.5s ease both;
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
}

.strategy-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.strategy-body {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.strategy-priority {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--primary-color);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.strategy-title {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-dark);
}

.strategy-desc {
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.strategy-actions {
  display: flex;
  justify-content: center;
}

.replan-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.7rem 1.5rem;
  border: 1px solid var(--primary-color);
  border-radius: 999px;
  background: transparent;
  color: var(--primary-color);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover:not(:disabled) {
    background: rgba(11, 183, 170, 0.08);
    box-shadow: 0 0 16px rgba(11, 183, 170, 0.2);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  &.is-loading {
    border-color: #f59e0b;
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.06);
  }

  &.is-done {
    border-color: #22c55e;
    color: #22c55e;
    background: rgba(34, 197, 94, 0.06);
    animation: successPop 0.4s cubic-bezier(0.34, 1.4, 0.64, 1);
  }
}

@keyframes successPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// ======================== Section 7: Action Footer ========================
.action-footer {
  animation: fadeInUp 0.6s ease 0.65s both;
}

.footer-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
  padding: 2.5rem 2rem;
  border-radius: var(--radius-xl);
  text-align: center;
}

.footer-callout {
  margin: 0;
  font-family: 'Noto Serif SC', 'Noto Sans SC', serif;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text-dark);
}

.footer-buttons {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  justify-content: center;
}

.footer-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1.6rem;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
  border: none;
}

.primary-btn {
  background: var(--gradient-primary);
  color: #fff;
  box-shadow: var(--shadow-glow), 0 10px 24px rgba(11, 183, 170, 0.28);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 24px rgba(11, 183, 170, 0.32), 0 14px 32px rgba(11, 183, 170, 0.36);
  }

  &:active { transform: translateY(0); }
}

.secondary-btn {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);

  &:hover {
    color: var(--primary-color);
    border-color: var(--primary-color);
    background: rgba(11, 183, 170, 0.05);
  }
}

.tertiary-btn {
  background: transparent;
  color: var(--text-muted);
  border: none;
  font-weight: 600;

  &:hover {
    color: var(--primary-color);
  }
}

// ======================== Keyframes ========================
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

// ======================== Responsive ========================
@media (max-width: 768px) {
  .next-week-plan-page {
    padding: var(--spacing-md) var(--spacing-sm) var(--spacing-2xl);
    gap: var(--spacing-xl);
  }

  .hero-banner {
    flex-direction: column;
    padding: 1.5rem 1.2rem;
  }

  .hero-left {
    min-width: 0;
  }

  .hero-stats {
    flex: 1;
    width: 100%;
  }

  .greeting-title {
    font-size: 1.2rem;
  }

  .donut-layout {
    flex-direction: column;
    align-items: center;
  }

  .donut-legend {
    width: 100%;
  }

  .strategy-cards {
    grid-template-columns: 1fr;
  }

  .path-nodes {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .path-connector {
    width: 4px;
    height: 24px;

    .connector-svg {
      width: 4px;
      height: 24px;
    }
  }

  .footer-inner {
    padding: 1.8rem 1.2rem;
  }

  .footer-buttons {
    flex-direction: column;
    width: 100%;

    .footer-btn {
      width: 100%;
      justify-content: center;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .next-week-plan-page *,
  .next-week-plan-page *::before,
  .next-week-plan-page *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>