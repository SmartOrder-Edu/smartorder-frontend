<template>
  <div class="insight-tab">
    <!-- 顶部说明带 -->
    <div class="insight-intro">
      <div class="insight-intro-main">
        <span class="insight-eyebrow">Agent 学情洞察</span>
        <h3>本空间学习数据全景</h3>
        <p>由 Profile / Assessment / Memory Agent 联合给出，覆盖时长、能力、知识、资源、专注、完成率六个维度。</p>
      </div>
      <div class="insight-intro-stats">
        <div>
          <strong>{{ summary.totalMinutes }}h</strong>
          <span>累计学时</span>
        </div>
        <div>
          <strong>{{ summary.avgFocus }}</strong>
          <span>平均专注</span>
        </div>
        <div>
          <strong>{{ summary.masteryPercent }}%</strong>
          <span>平均掌握</span>
        </div>
      </div>
      <button class="report-entry-btn" type="button" @click="emit('openReport')">
        查看完整报告
      </button>
    </div>

    <div class="insight-action-strip">
      <div class="action-strip-main">
        <span class="insight-eyebrow">可行动建议</span>
        <h4>{{ primaryActionTitle }}</h4>
        <p>{{ primaryActionReason }}</p>
      </div>
      <div class="action-suggestion-list">
        <div
          v-for="item in actionableSuggestions"
          :key="item.title"
          class="action-suggestion"
          :class="[item.tone, { active: selectedInsightKey === item.key }]"
          role="button"
          tabindex="0"
          @click="selectedInsightKey = item.key"
          @keydown.enter="selectedInsightKey = item.key"
        >
          <span>{{ item.kicker }}</span>
          <strong>{{ item.title }}</strong>
          <p>{{ item.detail }}</p>
        </div>
      </div>
    </div>

    <div class="insight-drilldown">
      <div class="drilldown-main">
        <span class="insight-eyebrow">下钻解释</span>
        <h4>{{ selectedInsight.title }}</h4>
        <p>{{ selectedInsight.reason }}</p>
      </div>
      <div class="drilldown-evidence">
        <div v-for="item in selectedInsight.evidence" :key="item.label">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
      <div class="drilldown-actions">
        <span v-for="action in selectedInsight.actions" :key="action">{{ action }}</span>
      </div>
    </div>

    <!-- 图表网格 -->
    <div class="insight-grid">
      <!-- 1. 7日学习时长趋势 -->
      <section class="insight-card" :class="{ active: selectedInsightKey === 'time' }" @click="selectedInsightKey = 'time'">
        <header class="insight-card-head">
          <div>
            <h4>7 日学习时长趋势</h4>
            <span>最近一周每日学习时长（小时）</span>
          </div>
          <span class="insight-tag trend" :class="weeklyTrendTag.cls">{{ weeklyTrendTag.label }}</span>
        </header>
        <BaseChart :options="weeklyTrendOptions" height="260px" />
      </section>

      <!-- 2. 能力雷达图 -->
      <section class="insight-card" :class="{ active: selectedInsightKey === 'ability' }" @click="selectedInsightKey = 'ability'">
        <header class="insight-card-head">
          <div>
            <h4>能力雷达</h4>
            <span>当前学生 vs 同级平均（5 分制）</span>
          </div>
          <span class="insight-tag neutral">6 维</span>
        </header>
        <BaseChart :options="abilityRadarOptions" height="260px" />
      </section>

      <!-- 3. 知识点掌握分布 -->
      <section class="insight-card" :class="{ active: selectedInsightKey === 'knowledge' }" @click="selectedInsightKey = 'knowledge'">
        <header class="insight-card-head">
          <div>
            <h4>知识点掌握分布</h4>
            <span>本空间 8 个核心知识点的掌握度</span>
          </div>
          <span class="insight-tag" :class="knowledgeTag.cls">{{ knowledgeTag.label }}</span>
        </header>
        <BaseChart :options="knowledgeBarOptions" height="260px" />
      </section>

      <!-- 4. 资源类型分布 -->
      <section class="insight-card" :class="{ active: selectedInsightKey === 'resource' }" @click="selectedInsightKey = 'resource'">
        <header class="insight-card-head">
          <div>
            <h4>资源类型分布</h4>
            <span>本空间已生成的学习资料构成</span>
          </div>
          <span class="insight-tag neutral">{{ resourceTotal }} 项</span>
        </header>
        <BaseChart :options="resourcePieOptions" height="260px" />
      </section>

      <!-- 5. 日均专注度趋势 -->
      <section class="insight-card" :class="{ active: selectedInsightKey === 'focus' }" @click="selectedInsightKey = 'focus'">
        <header class="insight-card-head">
          <div>
            <h4>近 14 日专注度趋势</h4>
            <span>每日平均专注度评分（1-5）</span>
          </div>
          <span class="insight-tag" :class="focusTrendTag.cls">{{ focusTrendTag.label }}</span>
        </header>
        <BaseChart :options="focusTrendOptions" height="260px" />
      </section>

      <!-- 6. 任务完成率仪表盘 -->
      <section class="insight-card" :class="{ active: selectedInsightKey === 'task' }" @click="selectedInsightKey = 'task'">
        <header class="insight-card-head">
          <div>
            <h4>任务完成率</h4>
            <span>已完成 {{ taskSummary.completed }} / 进行中 {{ taskSummary.inProgress }} / 待开始 {{ taskSummary.pending }}</span>
          </div>
          <span class="insight-tag neutral">本周</span>
        </header>
        <BaseChart :options="taskGaugeOptions" height="260px" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from '@/views/Profile/components/BaseChart.vue'

interface WeakPointLike {
  name: string
  mastery?: number
  confidence?: number
  assessmentCount?: number
  explanationFacts?: string | null
}

const props = defineProps<{
  weakPoints?: WeakPointLike[]
  nextActionReason?: string
  todayTaskTitle?: string
}>()

const emit = defineEmits<{
  openReport: []
}>()

const selectedInsightKey = ref('knowledge')

/* ---------------- Mock 数据 ---------------- */

const weeklyTrendData = {
  dates: ['7/13', '7/14', '7/15', '7/16', '7/17', '7/18', '7/19'],
  values: [1.2, 1.8, 0.9, 2.4, 1.6, 2.1, 1.9],
}

const abilityDimensions = [
  { name: '基础概念', score: 4.2, peer: 3.6 },
  { name: '计算能力', score: 3.8, peer: 3.4 },
  { name: '应用能力', score: 3.2, peer: 3.3 },
  { name: '逻辑推理', score: 3.6, peer: 3.5 },
  { name: '综合分析', score: 2.9, peer: 3.1 },
  { name: '解题速度', score: 3.4, peer: 3.2 },
]

const knowledgePoints = [
  { name: '极限定义', mastery: 88 },
  { name: '连续性', mastery: 76 },
  { name: '导数定义', mastery: 92 },
  { name: '求导法则', mastery: 68 },
  { name: '微分中值定理', mastery: 42 },
  { name: '洛必达法则', mastery: 58 },
  { name: '泰勒公式', mastery: 35 },
  { name: '函数极值', mastery: 81 },
]

const resourceBreakdown = [
  { name: '文档', value: 12, color: '#3b5bdb' },
  { name: 'HTML', value: 6, color: '#14b8a6' },
  { name: '思维导图', value: 8, color: '#f59e0b' },
  { name: '练习', value: 14, color: '#8b5cf6' },
  { name: '图解', value: 5, color: '#ec4899' },
  { name: 'B站推荐', value: 7, color: '#10b981' },
]

const focusTrendData = {
  dates: Array.from({ length: 14 }, (_, i) => `7/${i + 6}`),
  values: [3, 4, 3, 5, 4, 2, 4, 5, 4, 3, 5, 4, 5, 4],
}

const taskSummary = {
  completed: 24,
  inProgress: 6,
  pending: 8,
  get total() {
    return this.completed + this.inProgress + this.pending
  },
  get rate() {
    return Math.round((this.completed / this.total) * 100)
  },
}

/* ---------------- 顶部摘要 ---------------- */

const summary = computed(() => {
  const totalMinutes = weeklyTrendData.values.reduce((a, b) => a + b, 0)
  const avgFocus = (focusTrendData.values.reduce((a, b) => a + b, 0) / focusTrendData.values.length).toFixed(1)
  const masteryPercent = Math.round(
    knowledgePoints.reduce((a, b) => a + b.mastery, 0) / knowledgePoints.length
  )
  return {
    totalMinutes: totalMinutes.toFixed(1),
    avgFocus,
    masteryPercent,
  }
})

/* ---------------- 趋势小标签 ---------------- */

function buildTrendTag(values: number[]) {
  if (values.length < 2) return { label: '持平', cls: 'neutral' }
  const half = Math.floor(values.length / 2)
  const firstAvg = values.slice(0, half).reduce((a, b) => a + b, 0) / half
  const secondAvg = values.slice(half).reduce((a, b) => a + b, 0) / (values.length - half)
  const diff = secondAvg - firstAvg
  if (diff > 0.1) return { label: `↑ 上升 ${diff.toFixed(1)}`, cls: 'up' }
  if (diff < -0.1) return { label: `↓ 下降 ${Math.abs(diff).toFixed(1)}`, cls: 'down' }
  return { label: '→ 持平', cls: 'neutral' }
}

const weeklyTrendTag = computed(() => buildTrendTag(weeklyTrendData.values))
const focusTrendTag = computed(() => buildTrendTag(focusTrendData.values))

const knowledgeTag = computed(() => {
  const weakCount = knowledgePoints.filter((k) => k.mastery < 60).length
  if (weakCount === 0) return { label: '全部掌握', cls: 'up' }
  if (weakCount <= 2) return { label: `${weakCount} 个薄弱`, cls: 'warn' }
  return { label: `${weakCount} 个薄弱`, cls: 'down' }
})

const resourceTotal = computed(() => resourceBreakdown.reduce((a, b) => a + b.value, 0))

const mergedWeakPoints = computed(() => {
  const runtimeWeakPoints = (props.weakPoints || []).map(point => ({
    name: point.name,
    mastery: point.mastery == null ? 0 : Math.round(Math.min(Math.max(Number(point.mastery), 0), 1) * 100),
    reason: point.explanationFacts || '',
  }))
  if (runtimeWeakPoints.length) return runtimeWeakPoints.slice(0, 3)
  return knowledgePoints
    .filter(point => point.mastery < 60)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 3)
    .map(point => ({ name: point.name, mastery: point.mastery, reason: '' }))
})

const primaryWeakPoint = computed(() => mergedWeakPoints.value[0] || null)
const primaryActionTitle = computed(() => {
  if (primaryWeakPoint.value) return `先处理「${primaryWeakPoint.value.name}」`
  return props.todayTaskTitle ? `继续完成「${props.todayTaskTitle}」` : '保持当前学习节奏'
})
const primaryActionReason = computed(() =>
  props.nextActionReason
  || primaryWeakPoint.value?.reason
  || 'Agent 会优先把薄弱知识点拆成讲义、图解和小题组，让学生马上知道下一步该做什么。'
)
const actionableSuggestions = computed(() => {
  const weak = mergedWeakPoints.value
  const first = weak[0]
  const second = weak[1]
  return [
    {
      key: 'knowledge',
      kicker: '补弱',
      title: first ? `${first.name} 掌握度 ${first.mastery}%` : '完成一次诊断测评',
      detail: first ? '建议先完成 2 个基础例题，再看 1 份图解资源。' : '用 10 道题快速建立知识点证据。',
      tone: first && first.mastery < 45 ? 'danger' : 'warn',
    },
    {
      key: 'resource',
      kicker: '资源',
      title: second ? `为「${second.name}」补齐资料包` : '生成今日任务资料包',
      detail: '组合讲义、思维导图、专项练习和视频推荐，控制在 30 分钟内。',
      tone: 'info',
    },
    {
      key: 'task',
      kicker: '验证',
      title: props.todayTaskTitle || '完成今日高优任务',
      detail: '学习后做一次 5 题验证，答错题会进入下一轮复盘。',
      tone: 'success',
    },
  ]
})

const selectedInsight = computed(() => {
  const first = primaryWeakPoint.value
  const weakText = first ? `「${first.name}」当前掌握度 ${first.mastery}%` : '当前缺少明确薄弱点证据'
  const map: Record<string, {
    title: string
    reason: string
    evidence: { label: string; value: string }[]
    actions: string[]
  }> = {
    time: {
      title: '学习时长是否稳定',
      reason: 'Agent 会比较最近一周前后半段投入变化，判断今天适合推进新内容还是安排轻量复盘。',
      evidence: [
        { label: '7日累计', value: `${summary.value.totalMinutes}h` },
        { label: '趋势', value: weeklyTrendTag.value.label },
      ],
      actions: ['低时长日拆小任务', '高时长日安排综合题', '保持每日最小学习量'],
    },
    ability: {
      title: '能力雷达差距',
      reason: '当前学生在综合分析和应用能力上低于基础概念，说明不能只看讲义，需要增加场景题和错题复盘。',
      evidence: [
        { label: '最低维度', value: '综合分析 2.9/5' },
        { label: '优势维度', value: '基础概念 4.2/5' },
      ],
      actions: ['增加综合题讲解', '保留基础概念复盘', '用同类题验证迁移能力'],
    },
    knowledge: {
      title: weakText,
      reason: props.nextActionReason || first?.reason || '薄弱知识点会优先进入今日任务和资料包生成队列，避免学生继续堆新内容。',
      evidence: [
        { label: '薄弱点', value: first?.name || '待诊断' },
        { label: '掌握度', value: first ? `${first.mastery}%` : `${summary.value.masteryPercent}%` },
      ],
      actions: ['先做 2 个基础例题', '看 1 份图解资源', '完成 5 题验证'],
    },
    resource: {
      title: '资源是否覆盖当前薄弱点',
      reason: '资源不只是数量展示，Agent 会检查讲义、图解、练习和视频是否能覆盖当前学习动作。',
      evidence: [
        { label: '资源总量', value: `${resourceTotal.value} 项` },
        { label: '练习资源', value: `${resourceBreakdown.find(item => item.name === '练习')?.value || 0} 项` },
      ],
      actions: ['补齐图解资源', '生成专项练习', '筛选 1 个短视频讲解'],
    },
    focus: {
      title: '专注度决定任务粒度',
      reason: '当专注度波动时，Agent 会把大任务拆小，优先安排低负担但能产生证据的学习动作。',
      evidence: [
        { label: '平均专注', value: summary.value.avgFocus },
        { label: '趋势', value: focusTrendTag.value.label },
      ],
      actions: ['拆成 15 分钟任务', '减少新知识输入', '保留验证题'],
    },
    task: {
      title: '任务完成率驱动下一轮计划',
      reason: '完成率高时推进新节点，完成率低或逾期时先压缩任务量并补弱。',
      evidence: [
        { label: '完成率', value: `${taskSummary.rate}%` },
        { label: '已完成', value: `${taskSummary.completed}/${taskSummary.total}` },
      ],
      actions: ['完成后触发验证', '错题进入复盘', '明日计划自动微调'],
    },
  }
  return map[selectedInsightKey.value] || map.knowledge
})

/* ---------------- 通用 tooltip 风格 ---------------- */

const tooltipStyle = {
  backgroundColor: '#fff',
  borderColor: '#e8edf5',
  borderWidth: 1,
  borderRadius: 10,
  padding: [10, 14],
  textStyle: { color: '#344054', fontSize: 12 },
  extraCssText: 'box-shadow: 0 1px 3px rgba(16,24,40,0.04), 0 6px 16px rgba(30,64,175,0.06);',
}

/* ---------------- 1. 7 日学习时长趋势 ---------------- */

const weeklyTrendOptions = computed<EChartsOption>(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    ...tooltipStyle,
    formatter: (params: any) => {
      const p = params[0]
      const prev = weeklyTrendData.values[p.dataIndex - 1]
      const diff = prev !== undefined ? p.value - prev : 0
      const diffStr =
        diff > 0
          ? `<span style="color:#10b981">↑ +${diff.toFixed(1)}h</span>`
          : diff < 0
            ? `<span style="color:#ef4444">↓ ${diff.toFixed(1)}h</span>`
            : `<span style="color:#98a2b3">→ 持平</span>`
      return `<div style="font-weight:600;margin-bottom:4px">📅 ${p.name}</div>
              <div>学习时长: <b style="color:#172033;font-size:14px">${p.value} h</b></div>
              <div style="margin-top:4px">较前日: ${diffStr}</div>`
    },
  },
  grid: { top: 30, right: 20, bottom: 28, left: 40, containLabel: true },
  xAxis: {
    type: 'category',
    data: weeklyTrendData.dates,
    boundaryGap: false,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#98a2b3', fontSize: 11 },
  },
  yAxis: {
    type: 'value',
    name: '小时',
    nameTextStyle: { color: '#98a2b3', fontSize: 11 },
    splitLine: { lineStyle: { color: '#edf1f7' } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#98a2b3', fontSize: 11 },
  },
  series: [
    {
      type: 'line',
      smooth: 0.3,
      symbol: 'circle',
      symbolSize: 7,
      data: weeklyTrendData.values,
      lineStyle: { color: '#2563eb', width: 2.5 },
      itemStyle: { color: '#fff', borderColor: '#2563eb', borderWidth: 2 },
      label: {
        show: true,
        position: 'top',
        fontSize: 10,
        color: '#667085',
        formatter: '{c}h',
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(37,99,235,0.22)' },
            { offset: 1, color: 'rgba(37,99,235,0)' },
          ],
        },
      },
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { color: '#e8edf5', type: 'dashed', width: 1 },
        data: [{ type: 'average', name: '周均值' }],
        label: { fontSize: 10, color: '#98a2b3', formatter: '均值 {c}h' },
      },
    },
  ],
}))

/* ---------------- 2. 能力雷达 ---------------- */

const abilityRadarOptions = computed<EChartsOption>(() => ({
  backgroundColor: 'transparent',
  tooltip: { ...tooltipStyle },
  legend: {
    bottom: 0,
    icon: 'circle',
    itemWidth: 9,
    itemHeight: 9,
    textStyle: { color: '#526079', fontSize: 12 },
    data: ['当前学生', '同级平均'],
  },
  radar: {
    center: ['50%', '48%'],
    radius: '60%',
    splitNumber: 4,
    axisName: { color: '#526079', fontSize: 11 },
    splitLine: { lineStyle: { color: '#edf1f7' } },
    splitArea: { areaStyle: { color: ['#fafbfc', '#ffffff'] } },
    axisLine: { lineStyle: { color: '#edf1f7' } },
    indicator: abilityDimensions.map((d) => ({ name: d.name, max: 5 })),
  },
  series: [
    {
      type: 'radar',
      symbolSize: 5,
      data: [
        {
          value: abilityDimensions.map((d) => d.score),
          name: '当前学生',
          areaStyle: { color: 'rgba(15,118,110,0.18)' },
          lineStyle: { color: '#0f766e', width: 2 },
          itemStyle: { color: '#0f766e' },
        },
        {
          value: abilityDimensions.map((d) => d.peer),
          name: '同级平均',
          areaStyle: { color: 'rgba(245,158,11,0.10)' },
          lineStyle: { color: '#f59e0b', width: 2, type: 'dashed' },
          itemStyle: { color: '#f59e0b' },
        },
      ],
    },
  ],
}))

/* ---------------- 3. 知识点掌握分布 ---------------- */

function masteryColor(mastery: number) {
  if (mastery >= 80) return '#10b981'
  if (mastery >= 60) return '#3b5bdb'
  if (mastery >= 40) return '#f59e0b'
  return '#ef4444'
}

const knowledgeBarOptions = computed<EChartsOption>(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    ...tooltipStyle,
    formatter: (params: any) => {
      const p = params[0]
      return `<b>${p.name}</b><br/>掌握度: <b style="color:${masteryColor(p.value)}">${p.value}%</b>`
    },
  },
  grid: { top: 24, right: 20, bottom: 50, left: 40, containLabel: true },
  xAxis: {
    type: 'category',
    data: knowledgePoints.map((k) => k.name),
    axisLine: { lineStyle: { color: '#edf1f7' } },
    axisTick: { show: false },
    axisLabel: {
      color: '#526079',
      fontSize: 10,
      interval: 0,
      rotate: 28,
    },
  },
  yAxis: {
    type: 'value',
    max: 100,
    name: '%',
    nameTextStyle: { color: '#98a2b3', fontSize: 11 },
    splitLine: { lineStyle: { color: '#edf1f7' } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#98a2b3', fontSize: 11 },
  },
  series: [
    {
      type: 'bar',
      data: knowledgePoints.map((k) => ({
        value: k.mastery,
        itemStyle: {
          color: masteryColor(k.mastery),
          borderRadius: [6, 6, 0, 0],
        },
      })),
      barWidth: '52%',
      label: {
        show: true,
        position: 'top',
        fontSize: 10,
        color: '#667085',
        formatter: '{c}%',
      },
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { color: '#ef4444', type: 'dashed', width: 1 },
        data: [{ yAxis: 60, name: '及格线' }],
        label: { fontSize: 10, color: '#ef4444', formatter: '及格 60%' },
      },
    },
  ],
}))

/* ---------------- 4. 资源类型分布饼图 ---------------- */

const resourcePieOptions = computed<EChartsOption>(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    ...tooltipStyle,
    formatter: (p: any) => `<b>${p.name}</b><br/>数量: ${p.value} 项<br/>占比: ${p.percent}%`,
  },
  legend: {
    orient: 'vertical',
    right: 8,
    top: 'center',
    itemWidth: 9,
    itemHeight: 9,
    itemGap: 12,
    icon: 'circle',
    textStyle: { color: '#526079', fontSize: 12 },
  },
  graphic: [
    {
      type: 'text',
      left: '30%',
      top: '42%',
      style: {
        text: String(resourceTotal.value),
        textAlign: 'center',
        fill: '#172033',
        fontSize: 24,
        fontWeight: 700,
      },
    },
    {
      type: 'text',
      left: '29%',
      top: '55%',
      style: {
        text: '总资源',
        textAlign: 'center',
        fill: '#98a2b3',
        fontSize: 11,
      },
    },
  ],
  series: [
    {
      type: 'pie',
      radius: ['52%', '74%'],
      center: ['34%', '50%'],
      avoidLabelOverlap: true,
      padAngle: 3,
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 3,
        borderRadius: 8,
      },
      label: { show: false },
      labelLine: { show: false },
      data: resourceBreakdown.map((r) => ({
        value: r.value,
        name: r.name,
        itemStyle: { color: r.color },
      })),
    },
  ],
}))

/* ---------------- 5. 专注度趋势 ---------------- */

const focusTrendOptions = computed<EChartsOption>(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    ...tooltipStyle,
    formatter: (params: any) => {
      const p = params[0]
      let level = '一般'
      let color = '#98a2b3'
      if (p.value >= 5) { level = '极佳'; color = '#10b981' }
      else if (p.value >= 4) { level = '专注'; color = '#3b5bdb' }
      else if (p.value <= 2) { level = '偏低'; color = '#ef4444' }
      return `<div style="font-weight:600;margin-bottom:4px">📅 ${p.name}</div>
              <div>专注度: <b style="color:${color}">${p.value} / 5</b> · ${level}</div>`
    },
  },
  grid: { top: 30, right: 20, bottom: 28, left: 36, containLabel: true },
  xAxis: {
    type: 'category',
    data: focusTrendData.dates,
    boundaryGap: false,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#98a2b3', fontSize: 10 },
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 5,
    splitNumber: 5,
    splitLine: { lineStyle: { color: '#edf1f7' } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#98a2b3', fontSize: 11 },
  },
  series: [
    {
      type: 'line',
      smooth: 0.35,
      symbol: 'circle',
      symbolSize: 6,
      data: focusTrendData.values,
      lineStyle: { color: '#8b5cf6', width: 2.5 },
      itemStyle: { color: '#fff', borderColor: '#8b5cf6', borderWidth: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(139,92,246,0.22)' },
            { offset: 1, color: 'rgba(139,92,246,0)' },
          ],
        },
      },
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { color: '#e8edf5', type: 'dashed', width: 1 },
        data: [{ type: 'average', name: '平均' }],
        label: { fontSize: 10, color: '#98a2b3', formatter: '均值 {c}' },
      },
    },
  ],
}))

/* ---------------- 6. 任务完成率仪表盘 ---------------- */

const taskGaugeOptions = computed<EChartsOption>(() => ({
  backgroundColor: 'transparent',
  tooltip: { ...tooltipStyle, formatter: `任务完成率: <b>${taskSummary.rate}%</b>` },
  series: [
    {
      type: 'gauge',
      startAngle: 210,
      endAngle: -30,
      min: 0,
      max: 100,
      radius: '92%',
      center: ['50%', '58%'],
      progress: {
        show: true,
        width: 16,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#10b981' },
              { offset: 1, color: '#14b8a6' },
            ],
          },
        },
      },
      axisLine: {
        lineStyle: { width: 16, color: [[1, '#edf1f7']] },
      },
      pointer: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      anchor: { show: false },
      detail: {
        valueAnimation: true,
        fontSize: 32,
        fontWeight: 800,
        color: '#172033',
        offsetCenter: [0, '8%'],
        formatter: '{value}%',
      },
      title: {
        offsetCenter: [0, '38%'],
        color: '#98a2b3',
        fontSize: 12,
      },
      data: [
        {
          value: taskSummary.rate,
          name: `已完成 ${taskSummary.completed} / 共 ${taskSummary.total}`,
        },
      ],
    },
  ],
}))
</script>

<style scoped lang="scss">
.insight-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 顶部说明带 */
.insight-intro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 18px 22px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.08), rgba(59, 91, 219, 0.06));
  border: 1px solid rgba(20, 184, 166, 0.18);
}

.insight-intro-main {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .insight-eyebrow {
    font-size: 11px;
    font-weight: 700;
    color: #0f766e;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }

  h3 {
    margin: 0;
    font-size: 17px;
    font-weight: 800;
    color: #07172f;
  }

  p {
    margin: 0;
    font-size: 12px;
    color: #526079;
    line-height: 1.5;
  }
}

.insight-eyebrow {
  font-size: 11px;
  font-weight: 700;
  color: #0f766e;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.insight-intro-stats {
  display: flex;
  gap: 28px;

  > div {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }

  strong {
    font-size: 1.55rem;
    font-weight: 800;
    color: #07172f;
    line-height: 1.1;
    letter-spacing: -0.5px;
  }

  span {
    font-size: 11px;
    color: #8d99ad;
    font-weight: 600;
  }
}

.report-entry-btn {
  flex: 0 0 auto;
  min-height: 34px;
  padding: 0 13px;
  border: 1px solid rgba(11, 183, 170, 0.24);
  border-radius: 10px;
  background: #ffffff;
  color: #0a9e94;
  font-size: 0.76rem;
  font-weight: 900;
  cursor: pointer;
  transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(11, 183, 170, 0.42);
    box-shadow: 0 8px 18px rgba(11, 183, 170, 0.1);
  }
}

.insight-action-strip {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(420px, 1.25fr);
  gap: 14px;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(59, 130, 246, 0.16);
  background:
    radial-gradient(circle at 8% 0%, rgba(20, 184, 166, 0.12), transparent 34%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(240, 249, 255, 0.9));
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  animation: actionStripEnter 0.42s ease both;
}

.action-strip-main {
  min-width: 0;

  h4 {
    margin: 5px 0 6px;
    color: #07172f;
    font-size: 16px;
    line-height: 1.35;
  }

  p {
    margin: 0;
    color: #526079;
    font-size: 12px;
    line-height: 1.55;
  }
}

.action-suggestion-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.action-suggestion {
  min-width: 0;
  padding: 11px 12px;
  border-radius: 13px;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.16);
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;

  &:hover,
  &.active {
    transform: translateY(-1px);
    border-color: rgba(11, 183, 170, 0.28);
    box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
  }

  span {
    display: inline-flex;
    margin-bottom: 6px;
    padding: 2px 7px;
    border-radius: 999px;
    background: #f1f5f9;
    color: #526079;
    font-size: 10px;
    font-weight: 800;
  }

  strong {
    display: block;
    overflow: hidden;
    color: #07172f;
    font-size: 12px;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  p {
    display: -webkit-box;
    margin: 5px 0 0;
    overflow: hidden;
    color: #667085;
    font-size: 11px;
    line-height: 1.45;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  &.danger {
    border-color: rgba(239, 68, 68, 0.2);
    span { background: #fef2f2; color: #b91c1c; }
  }

  &.warn {
    border-color: rgba(245, 158, 11, 0.22);
    span { background: #fffbeb; color: #b45309; }
  }

  &.info {
    border-color: rgba(59, 130, 246, 0.18);
    span { background: #eff6ff; color: #1d4ed8; }
  }

  &.success {
    border-color: rgba(16, 185, 129, 0.2);
    span { background: #ecfdf5; color: #047857; }
  }
}

.insight-drilldown {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(220px, 0.55fr);
  gap: 14px;
  align-items: center;
  padding: 15px 16px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  animation: drilldownEnter 0.36s ease both;
}

.drilldown-main {
  min-width: 0;

  h4 {
    margin: 5px 0 6px;
    color: #07172f;
    font-size: 15px;
    line-height: 1.35;
  }

  p {
    margin: 0;
    color: #526079;
    font-size: 12px;
    line-height: 1.55;
  }
}

.drilldown-evidence {
  display: grid;
  grid-template-columns: repeat(2, minmax(86px, 1fr));
  gap: 8px;

  div {
    min-width: 0;
    padding: 8px 10px;
    border-radius: 12px;
    background: #f8fafc;
  }

  span {
    display: block;
    color: #98a2b3;
    font-size: 10px;
    font-weight: 800;
  }

  strong {
    display: block;
    margin-top: 3px;
    color: #172033;
    font-size: 12px;
    line-height: 1.3;
  }
}

.drilldown-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;

  span {
    padding: 4px 9px;
    border-radius: 999px;
    background: #ecfdfb;
    color: #0a9e94;
    font-size: 11px;
    font-weight: 800;
  }
}

/* 图表网格 */
.insight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.insight-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 20px 16px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #dfe7f1;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.045);
  animation: chartCardEnter 0.48s cubic-bezier(0.22, 1, 0.36, 1) both;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;

  &:hover,
  &.active {
    transform: translateY(-2px);
    border-color: rgba(11, 183, 170, 0.28);
    box-shadow: 0 16px 32px rgba(15, 23, 42, 0.075);
  }
}

.insight-card:nth-child(1) { animation-delay: 80ms; }
.insight-card:nth-child(2) { animation-delay: 180ms; }
.insight-card:nth-child(3) { animation-delay: 280ms; }
.insight-card:nth-child(4) { animation-delay: 380ms; }
.insight-card:nth-child(5) { animation-delay: 480ms; }
.insight-card:nth-child(6) { animation-delay: 580ms; }

@keyframes actionStripEnter {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes chartCardEnter {
  from { opacity: 0; transform: translateY(14px) scale(0.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes drilldownEnter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.insight-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 800;
    color: #07172f;
    line-height: 1.3;
  }

  span {
    display: block;
    font-size: 11px;
    color: #8d99ad;
    margin-top: 2px;
    line-height: 1.4;
  }
}

.insight-tag {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  background: #f1f5fa;
  color: #526079;
  border: 1px solid #e2e8f0;

  &.up {
    background: rgba(16, 185, 129, 0.1);
    color: #047857;
    border-color: rgba(16, 185, 129, 0.25);
  }

  &.down {
    background: rgba(239, 68, 68, 0.1);
    color: #b91c1c;
    border-color: rgba(239, 68, 68, 0.25);
  }

  &.warn {
    background: rgba(245, 158, 11, 0.12);
    color: #b45309;
    border-color: rgba(245, 158, 11, 0.28);
  }

  &.neutral {
    background: #f1f5fa;
    color: #526079;
    border-color: #e2e8f0;
  }

  &.trend {
    background: rgba(37, 99, 235, 0.08);
    color: #1d4ed8;
    border-color: rgba(37, 99, 235, 0.22);
  }
}

/* 窄屏单列 */
@media (max-width: 960px) {
  .insight-grid {
    grid-template-columns: 1fr;
  }

  .insight-action-strip {
    grid-template-columns: 1fr;
  }

  .action-suggestion-list {
    grid-template-columns: 1fr;
  }

  .insight-drilldown {
    grid-template-columns: 1fr;
  }

  .drilldown-evidence {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .insight-intro {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .insight-intro-stats {
    width: 100%;
    justify-content: space-between;
    gap: 12px;

    > div {
      align-items: flex-start;
    }
  }
}
</style>
