<template>
  <AppLayout>
    <div v-if="loading" class="report-shell">
      <div class="skeleton hero"></div>
      <div class="skeleton body"></div>
    </div>

    <div v-else-if="!dashboard" class="report-shell">
      <el-empty description="学习报告数据加载失败" :image-size="120">
        <el-button type="primary" @click="goSpace">返回学习空间</el-button>
      </el-empty>
    </div>

    <div v-else class="report-shell">
      <section class="report-hero">
        <button class="back-btn" type="button" @click="goSpace">‹</button>
        <div>
          <span class="eyebrow">学情报告</span>
          <h1>{{ dashboard.space.name }}</h1>
          <p>{{ reportCopy }}</p>
        </div>
        <div class="period-switch">
          <button type="button" :class="{ active: period === 'week' }" @click="period = 'week'">周报</button>
          <button type="button" :class="{ active: period === 'month' }" @click="period = 'month'">月报</button>
        </div>
      </section>

      <section class="metric-grid">
        <div v-for="item in metricCards" :key="item.label" class="metric-card" :class="item.tone">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <p>{{ item.detail }}</p>
        </div>
      </section>

      <section class="report-grid">
        <article class="chart-panel">
          <header>
            <span class="eyebrow">学习投入</span>
            <h2>{{ periodLabel }}学习时长趋势</h2>
          </header>
          <BaseChart :options="durationOptions" height="280px" />
        </article>
        <article class="chart-panel">
          <header>
            <span class="eyebrow">状态变化</span>
            <h2>{{ periodLabel }}专注度趋势</h2>
          </header>
          <BaseChart :options="focusOptions" height="280px" />
        </article>
      </section>

      <section class="weak-panel">
        <header class="panel-row">
          <div>
            <span class="eyebrow">薄弱知识点变化</span>
            <h2>新增、改善与仍需关注</h2>
          </div>
          <button type="button" @click="goPlanAdjustment">让 Agent 调整计划</button>
        </header>
        <div class="weak-columns">
          <div v-for="group in weakGroups" :key="group.title" class="weak-column" :class="group.tone">
            <span>{{ group.title }}</span>
            <article v-for="item in group.items" :key="item.name">
              <strong>{{ item.name }}</strong>
              <p>{{ item.detail }}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="summary-panel">
        <div class="summary-copy">
          <span class="eyebrow">Agent 总结</span>
          <h2>{{ agentSummaryTitle }}</h2>
          <p>{{ agentSummary }}</p>
        </div>
        <div class="next-actions">
          <div v-for="item in nextActions" :key="item" class="next-action">
            <span></span>
            <strong>{{ item }}</strong>
          </div>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { EChartsOption } from 'echarts'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseChart from '@/views/Profile/components/BaseChart.vue'
import { fetchLearningState } from '@/api/algorithm'
import type { LearningAlgorithmState } from '@/api/algorithm'
import { useSpaceDashboardStore } from '@/stores/spaceDashboard'
import {
  buildMockLearningRecords,
  clampNumber,
  percentFromRatio,
  reportSummary,
  riskLabel,
} from './utils/detailData'

const route = useRoute()
const router = useRouter()
const dashStore = useSpaceDashboardStore()

const algorithmState = ref<LearningAlgorithmState | null>(null)
const algorithmLoading = ref(false)
const period = ref<'week' | 'month'>('week')

const spaceId = computed(() => String(route.params.spaceId || ''))
const dashboard = computed(() => dashStore.dashboard)
const loading = computed(() => dashStore.loading || algorithmLoading.value)
const allRecords = computed(() => dashboard.value?.recentRecords?.length ? dashboard.value.recentRecords : buildMockLearningRecords())
const displayRecords = computed(() => period.value === 'week' ? allRecords.value.slice(-7) : allRecords.value.slice(-30))
const summary = computed(() => reportSummary(dashboard.value, displayRecords.value, algorithmState.value))
const periodLabel = computed(() => period.value === 'week' ? '近 7 天' : '近 30 天')
const reportCopy = computed(() =>
  `${periodLabel.value}累计学习 ${summary.value.totalMinutes} 分钟，任务完成率 ${summary.value.taskCompletionRate}%，风险状态 ${riskLabel(dashboard.value?.riskStatus)}。`
)
const metricCards = computed(() => [
  { label: '学习时长', value: `${summary.value.totalMinutes} 分钟`, detail: `${periodLabel.value}累计投入`, tone: 'primary' },
  { label: '任务完成率', value: `${summary.value.taskCompletionRate}%`, detail: `已完成 ${summary.value.completedTasks} 个任务`, tone: 'success' },
  { label: '平均掌握度', value: `${summary.value.masteryPercent}%`, detail: '结合算法掌握度和空间进度', tone: summary.value.masteryPercent < 60 ? 'warn' : 'info' },
  { label: '薄弱点数量', value: `${summary.value.weakCount} 个`, detail: summary.value.weakCount ? '建议进入补弱队列' : '保持验证复盘', tone: summary.value.weakCount ? 'danger' : 'success' },
])
const weakPoints = computed(() => algorithmState.value?.weakPoints || [])
const knowledgeStates = computed(() => algorithmState.value?.knowledgeStates || [])
const weakGroups = computed(() => {
  const weakest = weakPoints.value.slice(0, 3)
  const improving = knowledgeStates.value
    .filter(item => clampNumber(item.mastery, 0, 1) >= 0.6 && clampNumber(item.mastery, 0, 1) < 0.8)
    .slice(0, 3)
  const stable = knowledgeStates.value
    .filter(item => clampNumber(item.mastery, 0, 1) >= 0.8)
    .slice(0, 3)
  return [
    {
      title: '仍薄弱',
      tone: 'danger',
      items: (weakest.length ? weakest : [{ name: '待诊断知识点', mastery: 0.4, explanationFacts: '建议先补一次诊断测评。' }]).map(item => ({
        name: item.name,
        detail: `掌握度 ${percentFromRatio(item.mastery)}%，${item.explanationFacts || '需要补基础题和错因复盘。'}`,
      })),
    },
    {
      title: '正在改善',
      tone: 'warn',
      items: (improving.length ? improving : weakest.slice(0, 2)).map(item => ({
        name: item.name,
        detail: `掌握度 ${percentFromRatio(item.mastery)}%，适合继续做变式练习。`,
      })),
    },
    {
      title: '相对稳定',
      tone: 'success',
      items: (stable.length ? stable : knowledgeStates.value.slice(0, 2)).map(item => ({
        name: item.name,
        detail: `掌握度 ${percentFromRatio(item.mastery)}%，下周保留间隔复习即可。`,
      })),
    },
  ]
})
const agentSummaryTitle = computed(() => {
  if (summary.value.weakCount >= 2) return '本周期需要先控风险，再推进新内容'
  if (summary.value.taskCompletionRate < 70) return '任务完成率偏低，计划需要拆小'
  return '学习节奏稳定，可以进入验证与进阶'
})
const agentSummary = computed(() =>
  algorithmState.value?.nextAction?.reason
  || dashboard.value?.agentInsight
  || 'Agent 建议下周保持稳定学习投入，把薄弱点拆成讲义、练习、验证三段，避免只增加资源数量。'
)
const nextActions = computed(() => {
  const weakName = weakPoints.value[0]?.name || algorithmState.value?.nextAction?.knowledgeName || '当前薄弱点'
  return [
    `为「${weakName}」安排 1 次基础讲义学习`,
    '生成 5-8 题专项练习并记录错因',
    '完成后做一次验证测评，决定是否回到原计划',
  ]
})

const chartLabels = computed(() => displayRecords.value.map(record => record.recordDate.slice(5)))
const durationOptions = computed<EChartsOption>(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { top: 26, right: 18, bottom: 28, left: 38, containLabel: true },
  xAxis: { type: 'category', data: chartLabels.value, axisTick: { show: false }, axisLabel: { color: '#64748b', fontSize: 11 } },
  yAxis: { type: 'value', axisLabel: { color: '#64748b', fontSize: 11 }, splitLine: { lineStyle: { color: '#e2e8f0' } } },
  series: [{
    type: 'bar',
    data: displayRecords.value.map(record => record.studyDurationMinutes),
    barWidth: '46%',
    itemStyle: { color: '#0bb7aa', borderRadius: [7, 7, 0, 0] },
  }],
}))
const focusOptions = computed<EChartsOption>(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { top: 26, right: 18, bottom: 28, left: 38, containLabel: true },
  xAxis: { type: 'category', data: chartLabels.value, axisTick: { show: false }, axisLabel: { color: '#64748b', fontSize: 11 } },
  yAxis: { type: 'value', min: 0, max: 5, axisLabel: { color: '#64748b', fontSize: 11 }, splitLine: { lineStyle: { color: '#e2e8f0' } } },
  series: [{
    type: 'line',
    smooth: 0.35,
    data: displayRecords.value.map(record => record.focusLevel),
    symbolSize: 7,
    lineStyle: { color: '#3b82f6', width: 3 },
    itemStyle: { color: '#ffffff', borderColor: '#3b82f6', borderWidth: 2 },
    areaStyle: { color: 'rgba(59, 130, 246, 0.12)' },
  }],
}))

async function loadPage() {
  if (!spaceId.value) return
  await dashStore.fetchDashboard(spaceId.value)
  algorithmLoading.value = true
  try {
    algorithmState.value = await fetchLearningState(spaceId.value)
  } catch {
    algorithmState.value = null
  } finally {
    algorithmLoading.value = false
  }
}

function goSpace() {
  router.push({ path: `/space/${spaceId.value}`, query: { tab: 'insight' } })
}

function goPlanAdjustment() {
  router.push(`/space/${spaceId.value}/plan-adjustment`)
}

onMounted(loadPage)
watch(() => route.params.spaceId, loadPage)
</script>

<style scoped lang="scss">
.report-shell {
  width: min(1260px, calc(100% - 32px));
  margin: 0 auto;
  padding: 22px 0 34px;
}

.report-hero,
.metric-card,
.chart-panel,
.weak-panel,
.summary-panel {
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: #ffffff;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
}

.report-hero {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  padding: 24px;
  border-radius: 18px;
  background: linear-gradient(135deg, #ffffff, #f0fdf4 52%, #f0f9ff);
}

.back-btn {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 12px;
  background: #0f172a;
  color: #ffffff;
  font-size: 30px;
  cursor: pointer;
}

.eyebrow {
  color: #0a9e94;
  font-size: 0.72rem;
  font-weight: 900;
}

h1,
h2 {
  margin: 5px 0 7px;
  color: #0f172a;
  line-height: 1.3;
}

h1 {
  font-size: 1.65rem;
}

h2 {
  font-size: 1rem;
}

p {
  margin: 0;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.55;
}

.period-switch {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border-radius: 12px;
  background: #f1f5f9;
}

.period-switch button,
.panel-row button {
  min-height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 900;
  cursor: pointer;
}

.period-switch button.active {
  background: #ffffff;
  color: #0a9e94;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.metric-grid,
.report-grid,
.weak-columns {
  display: grid;
  gap: 16px;
}

.metric-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 16px;
}

.metric-card {
  min-width: 0;
  padding: 16px;
  border-radius: 16px;
}

.metric-card span,
.weak-column > span {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
}

.metric-card strong {
  display: block;
  margin: 7px 0 5px;
  color: #0f172a;
  font-size: 1.18rem;
}

.metric-card.warn {
  border-color: rgba(245, 158, 11, 0.26);
}

.metric-card.danger {
  border-color: rgba(239, 68, 68, 0.24);
}

.metric-card.success {
  border-color: rgba(16, 185, 129, 0.22);
}

.report-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 16px;
}

.chart-panel,
.weak-panel,
.summary-panel {
  min-width: 0;
  padding: 18px;
  border-radius: 16px;
}

.weak-panel,
.summary-panel {
  margin-top: 16px;
}

.panel-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.panel-row button {
  border: 1px solid rgba(11, 183, 170, 0.24);
  background: #ffffff;
  color: #0a9e94;
}

.weak-columns {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 14px;
}

.weak-column {
  min-width: 0;
  padding: 13px;
  border-radius: 13px;
  background: #f8fafc;
}

.weak-column article {
  margin-top: 10px;
  padding: 11px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.weak-column strong {
  display: block;
  color: #0f172a;
  font-size: 0.86rem;
}

.summary-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 0.78fr);
  gap: 16px;
  background: linear-gradient(135deg, #ffffff, #ecfdfb);
}

.next-actions {
  display: grid;
  gap: 10px;
}

.next-action {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: center;
  padding: 11px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.88);
}

.next-action span {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #0bb7aa;
}

.next-action strong {
  color: #0f172a;
  font-size: 0.84rem;
  line-height: 1.4;
}

.skeleton {
  border-radius: 18px;
  background: linear-gradient(90deg, #f1f5f9, #e2e8f0, #f1f5f9);
  background-size: 220% 100%;
  animation: shimmer 1.2s linear infinite;
}

.skeleton.hero {
  height: 170px;
}

.skeleton.body {
  height: 520px;
  margin-top: 16px;
}

@keyframes shimmer {
  to { background-position: -220% 0; }
}

@media (max-width: 980px) {
  .report-hero,
  .metric-grid,
  .report-grid,
  .weak-columns,
  .summary-panel {
    grid-template-columns: 1fr;
  }
}
</style>
