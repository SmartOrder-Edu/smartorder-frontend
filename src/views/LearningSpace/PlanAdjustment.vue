<template>
  <AppLayout>
    <div v-if="loading" class="adjust-shell">
      <div class="skeleton hero"></div>
      <div class="skeleton body"></div>
    </div>

    <div v-else-if="!dashboard" class="adjust-shell">
      <el-empty description="学习空间数据加载失败" :image-size="120">
        <el-button type="primary" @click="goSpace">返回学习空间</el-button>
      </el-empty>
    </div>

    <div v-else class="adjust-shell">
      <section class="adjust-hero">
        <button class="back-btn" type="button" @click="goSpace">‹</button>
        <div>
          <span class="eyebrow">Agent 调整计划</span>
          <h1>{{ dashboard.space.name }}</h1>
          <p>{{ adjustmentReason }}</p>
        </div>
        <div class="hero-state" :class="{ confirmed }">
          <strong>{{ confirmed ? '已生成待确认方案' : '演示调整方案' }}</strong>
          <span>{{ riskLabel(dashboard.riskStatus) }} · {{ summaryText }}</span>
        </div>
      </section>

      <div class="adjust-grid">
        <section class="plan-panel">
          <header>
            <span class="eyebrow">调整前</span>
            <h2>当前今日任务</h2>
          </header>
          <div class="task-stack" v-if="beforePlan.length">
            <article v-for="task in beforePlan" :key="task.id" class="task-card">
              <span>{{ taskStatusLabel(task.status) }}</span>
              <strong>{{ task.title }}</strong>
              <p>{{ task.aiSuggestion || task.description || '按原计划推进。' }}</p>
            </article>
          </div>
          <el-empty v-else description="今日暂无任务" :image-size="80" />
        </section>

        <section class="agent-panel">
          <header>
            <span class="eyebrow">决策过程</span>
            <h2>证据读取时间线</h2>
          </header>
          <div class="timeline">
            <div
              v-for="(step, index) in decisionSteps"
              :key="step.title"
              class="timeline-step"
              :class="{ active: index <= activeStepIndex }"
            >
              <span>{{ index + 1 }}</span>
              <div>
                <strong>{{ step.title }}</strong>
                <p>{{ step.detail }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="plan-panel after">
          <header>
            <span class="eyebrow">调整后</span>
            <h2>建议执行队列</h2>
          </header>
          <div class="task-stack">
            <article v-for="item in afterPlan" :key="item.title" class="task-card proposed">
              <span>{{ item.kicker }}</span>
              <strong>{{ item.title }}</strong>
              <p>{{ item.detail }}</p>
            </article>
          </div>
        </section>
      </div>

      <section class="evidence-band">
        <div v-for="item in evidenceStats" :key="item.label">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <p>{{ item.detail }}</p>
        </div>
      </section>

      <div class="adjust-actions">
        <button class="secondary" type="button" @click="goKnowledge" :disabled="!focusedNode">查看知识点详情</button>
        <button class="secondary" type="button" @click="goSpace">继续观察</button>
        <button class="primary" type="button" @click="confirmAdjustment">确认调整</button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import { fetchLearningState } from '@/api/algorithm'
import type { LearningAlgorithmState } from '@/api/algorithm'
import { useSpaceDashboardStore } from '@/stores/spaceDashboard'
import {
  allDashboardTasks,
  buildMockLearningRecords,
  findKnowledgeStateForNode,
  formatMinutes,
  nodeMasteryPercent,
  reportSummary,
  riskLabel,
  taskStatusLabel,
} from './utils/detailData'

const route = useRoute()
const router = useRouter()
const dashStore = useSpaceDashboardStore()

const algorithmState = ref<LearningAlgorithmState | null>(null)
const algorithmLoading = ref(false)
const activeStepIndex = ref(0)
const confirmed = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const spaceId = computed(() => String(route.params.spaceId || ''))
const dashboard = computed(() => dashStore.dashboard)
const loading = computed(() => dashStore.loading || algorithmLoading.value)
const records = computed(() => dashboard.value?.recentRecords?.length ? dashboard.value.recentRecords : buildMockLearningRecords())
const report = computed(() => reportSummary(dashboard.value, records.value, algorithmState.value))
const weakPoint = computed(() => algorithmState.value?.weakPoints?.[0] || null)
const focusedNode = computed(() => {
  const nodes = dashboard.value?.pathNodes || []
  const queryNodeId = String(route.query.nodeId || '')
  if (queryNodeId) return nodes.find(node => node.id === queryNodeId) || null
  const weak = weakPoint.value
  if (weak) {
    const weakName = String(weak.name || '').toLowerCase()
    return nodes.find(node => node.title.toLowerCase().includes(weakName) || weakName.includes(node.title.toLowerCase())) || null
  }
  return nodes.find(node => node.status === 'current') || nodes[0] || null
})
const focusedKnowledgeState = computed(() => findKnowledgeStateForNode(focusedNode.value, algorithmState.value))
const focusedMastery = computed(() => nodeMasteryPercent(focusedNode.value, focusedKnowledgeState.value, dashboard.value?.progress || 0))
const beforePlan = computed(() => {
  const tasks = dashboard.value?.todayTasks?.length ? dashboard.value.todayTasks : allDashboardTasks(dashboard.value)
  return tasks.slice(0, 4)
})
const weakName = computed(() => weakPoint.value?.name || focusedNode.value?.title || algorithmState.value?.nextAction?.knowledgeName || '当前薄弱点')
const adjustmentReason = computed(() =>
  algorithmState.value?.nextAction?.reason
  || dashboard.value?.agentInsight
  || `Agent 会优先读取学习记录、测评证据和任务完成情况，判断是否需要先补「${weakName.value}」。`
)
const summaryText = computed(() => `${report.value.weakCount || 1} 个薄弱点 · 平均掌握 ${report.value.masteryPercent}%`)
const afterPlan = computed(() => [
  {
    kicker: '补弱',
    title: `先补「${weakName.value}」基础讲义`,
    detail: `掌握度约 ${focusedMastery.value}%，先用 ${formatMinutes(focusedNode.value?.estimatedDurationMinutes, '12 分钟')} 建立概念框架。`,
  },
  {
    kicker: '练习',
    title: `插入「${weakName.value}」专项小题组`,
    detail: '控制在 5-8 题，题型从基础到变式，避免直接推进新知识。',
  },
  {
    kicker: '验证',
    title: '完成 5 题验证测评',
    detail: '若正确率达标，回到原计划；若仍薄弱，自动进入错因复盘。',
  },
])
const decisionSteps = computed(() => [
  {
    title: '读取最近学习记录',
    detail: `近 ${records.value.length} 条记录，平均专注 ${report.value.avgFocus}/5。`,
  },
  {
    title: '读取测评与错题证据',
    detail: algorithmState.value?.assessedCount ? `已评估 ${algorithmState.value.assessedCount} 个知识点。` : '当前证据不足，保留诊断入口。',
  },
  {
    title: '定位薄弱知识点',
    detail: `优先关注「${weakName.value}」，当前掌握度 ${focusedMastery.value}%。`,
  },
  {
    title: '判断任务负荷',
    detail: `今日原计划 ${beforePlan.value.length} 项任务，完成率参考 ${report.value.taskCompletionRate}%。`,
  },
  {
    title: '生成调整方案',
    detail: '把补弱讲义、专项练习和验证测评插入到今日任务队列前段。',
  },
])
const evidenceStats = computed(() => [
  { label: '平均掌握度', value: `${report.value.masteryPercent}%`, detail: '来自算法状态或空间进度降级估算' },
  { label: '任务完成率', value: `${report.value.taskCompletionRate}%`, detail: '由近期学习记录和任务状态综合计算' },
  { label: '薄弱数量', value: `${report.value.weakCount || 1} 个`, detail: weakName.value },
  { label: '建议时长', value: '25-35 分钟', detail: '补弱讲义 + 小题组 + 验证题' },
])

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

function startTimeline() {
  activeStepIndex.value = 0
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    activeStepIndex.value = Math.min(activeStepIndex.value + 1, decisionSteps.value.length - 1)
    if (activeStepIndex.value >= decisionSteps.value.length - 1 && timer) {
      clearInterval(timer)
      timer = null
    }
  }, 520)
}

function confirmAdjustment() {
  confirmed.value = true
  ElMessage.success('已生成待确认方案，暂未直接改写后端计划。')
}

function goSpace() {
  router.push({ path: `/space/${spaceId.value}`, query: { tab: 'today' } })
}

function goKnowledge() {
  if (!focusedNode.value) return
  router.push(`/space/${spaceId.value}/knowledge/${focusedNode.value.id}`)
}

onMounted(async () => {
  await loadPage()
  startTimeline()
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
watch(() => route.params.spaceId, async () => {
  await loadPage()
  startTimeline()
})
</script>

<style scoped lang="scss">
.adjust-shell {
  width: min(1260px, calc(100% - 32px));
  margin: 0 auto;
  padding: 22px 0 34px;
}

.adjust-hero,
.plan-panel,
.agent-panel,
.evidence-band {
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: #ffffff;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
}

.adjust-hero {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  padding: 24px;
  border-radius: 18px;
  background: linear-gradient(135deg, #ffffff, #f0f9ff 55%, #ecfdfb);
}

.back-btn {
  width: 38px;
  height: 38px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 10px;
  background: #ffffff;
  color: #475569;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.back-btn:hover,
.back-btn:focus-visible {
  border-color: rgba(10, 158, 148, 0.35);
  color: #0a9e94;
  outline: none;
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

.hero-state {
  min-width: 190px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #f8fafc;
}

.hero-state.confirmed {
  background: #ecfdf5;
}

.hero-state strong,
.hero-state span {
  display: block;
}

.hero-state strong {
  color: #0f172a;
  font-size: 0.88rem;
}

.hero-state span {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.74rem;
}

.adjust-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(310px, 0.9fr) minmax(0, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.plan-panel,
.agent-panel {
  min-width: 0;
  padding: 18px;
  border-radius: 16px;
}

.task-stack,
.timeline {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.task-card,
.timeline-step,
.evidence-band > div {
  min-width: 0;
  padding: 13px;
  border-radius: 13px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.task-card.proposed {
  background: #ecfdfb;
  border-color: rgba(11, 183, 170, 0.18);
}

.task-card span {
  display: inline-flex;
  padding: 3px 9px;
  border-radius: 999px;
  background: #ffffff;
  color: #0a9e94;
  font-size: 0.68rem;
  font-weight: 900;
}

.task-card strong,
.timeline-step strong,
.evidence-band strong {
  display: block;
  margin: 7px 0 5px;
  color: #0f172a;
  line-height: 1.35;
}

.timeline-step {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 11px;
  opacity: 0.48;
  transition: opacity 0.22s ease, transform 0.22s ease, border-color 0.22s ease;
}

.timeline-step.active {
  opacity: 1;
  transform: translateX(2px);
  border-color: rgba(11, 183, 170, 0.28);
}

.timeline-step > span {
  display: inline-grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #ecfdfb;
  color: #0a9e94;
  font-size: 0.76rem;
  font-weight: 900;
}

.evidence-band {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
  padding: 14px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
}

.evidence-band span {
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 900;
}

.evidence-band strong {
  font-size: 1.05rem;
}

.adjust-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.adjust-actions button {
  min-height: 38px;
  padding: 0 16px;
  border-radius: 11px;
  border: 1px solid rgba(11, 183, 170, 0.24);
  background: #ffffff;
  color: #0a9e94;
  font-weight: 900;
  cursor: pointer;
}

.adjust-actions button.primary {
  border-color: transparent;
  background: linear-gradient(135deg, #0bb7aa, #0284c7);
  color: #ffffff;
}

.adjust-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
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
  height: 460px;
  margin-top: 16px;
}

@keyframes shimmer {
  to { background-position: -220% 0; }
}

@media (max-width: 980px) {
  .adjust-hero,
  .adjust-grid,
  .evidence-band {
    grid-template-columns: 1fr;
  }
}
</style>
