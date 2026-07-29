<template>
  <AppLayout>
    <div v-if="loading" class="detail-shell">
      <div class="skeleton hero"></div>
      <div class="skeleton grid"></div>
    </div>

    <div v-else-if="!dashboard || !node" class="detail-shell">
      <el-empty description="未找到该知识点" :image-size="120">
        <el-button type="primary" @click="goBack">返回学习空间</el-button>
      </el-empty>
    </div>

    <div v-else class="detail-shell">
      <section class="detail-hero">
        <button class="back-btn" type="button" @click="goBack">‹</button>
        <div class="hero-main">
          <span class="eyebrow">知识点详情</span>
          <h1>{{ node.title }}</h1>
          <p>{{ node.description || 'Agent 会结合任务、资源和测评证据补全该知识点的学习重点。' }}</p>
          <div class="hero-tags">
            <span>{{ statusLabel }}</span>
            <span>难度 {{ node.difficultyLevel || '待评估' }}</span>
            <span>{{ formatMinutes(node.estimatedDurationMinutes) }}</span>
          </div>
        </div>
        <div class="mastery-panel">
          <div class="mastery-ring" :style="masteryRingStyle">
            <strong>{{ masteryPercent }}%</strong>
            <span>掌握度</span>
          </div>
          <p>置信度 {{ confidencePercent }}%</p>
        </div>
      </section>

      <section class="reason-band" :class="{ weak: isWeak }">
        <div>
          <span class="eyebrow">为什么需要关注</span>
          <h2>{{ weakTitle }}</h2>
          <p>{{ weakReason }}</p>
        </div>
        <button type="button" @click="goPlanAdjustment">让 Agent 调整计划</button>
      </section>

      <div class="detail-grid">
        <section class="panel">
          <header>
            <span class="eyebrow">最近证据</span>
            <h3>测评与错题线索</h3>
          </header>
          <div v-if="evidenceList.length" class="evidence-list">
            <div v-for="item in evidenceList" :key="item.key" class="evidence-item">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <p>{{ item.detail }}</p>
            </div>
          </div>
          <el-empty v-else description="暂无测评证据，建议先做一次诊断题" :image-size="80" />
        </section>

        <section class="panel">
          <header>
            <span class="eyebrow">Agent 3 步补弱方案</span>
            <h3>学完后立刻验证</h3>
          </header>
          <div class="step-list">
            <div v-for="(step, index) in repairSteps" :key="step.title" class="repair-step">
              <span>{{ index + 1 }}</span>
              <div>
                <strong>{{ step.title }}</strong>
                <p>{{ step.detail }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="panel wide">
          <header class="panel-head-row">
            <div>
              <span class="eyebrow">关联任务</span>
              <h3>{{ relatedTasks.length }} 个任务</h3>
            </div>
            <button type="button" @click="goSpaceTab('today')">回到今日任务</button>
          </header>
          <div v-if="relatedTasks.length" class="task-list">
            <article v-for="task in relatedTasks" :key="task.id" class="task-row">
              <div>
                <strong>{{ task.title }}</strong>
                <p>{{ task.aiSuggestion || task.description || '完成后会为该知识点补充新的学习证据。' }}</p>
              </div>
              <span>{{ taskStatusLabel(task.status) }}</span>
              <button type="button" @click="startTask(task)">开始</button>
            </article>
          </div>
          <el-empty v-else description="暂无直接关联任务" :image-size="80" />
        </section>

        <section class="panel wide">
          <header class="panel-head-row">
            <div>
              <span class="eyebrow">推荐资源</span>
              <h3>{{ relatedResources.length }} 项资料</h3>
            </div>
            <button type="button" @click="goSpaceTab('resources')">查看资源工坊</button>
          </header>
          <div v-if="relatedResources.length" class="resource-grid">
            <article v-for="resource in relatedResources" :key="resource.id" class="resource-card">
              <span>{{ resourceTypeLabel(resource.resourceType) }}</span>
              <strong>{{ resource.title }}</strong>
              <p>{{ resource.agentReason || resource.description || '用于当前知识点的理解、练习或复盘。' }}</p>
              <button type="button" @click="openResource(resource)">查看资源</button>
            </article>
          </div>
          <el-empty v-else description="暂无资源，建议在资源工坊生成资料包" :image-size="80" />
        </section>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import { fetchLearningState } from '@/api/algorithm'
import type { LearningAlgorithmState } from '@/api/algorithm'
import { useStudyEntry } from '@/composables/useStudyEntry'
import { useSpaceDashboardStore } from '@/stores/spaceDashboard'
import type { ResourceVO, TaskVO } from '@/types/learningSpace'
import {
  allDashboardTasks,
  findKnowledgeStateForNode,
  findWeakPointForNode,
  formatMinutes,
  linkedResources,
  linkedTasks,
  nodeMasteryPercent,
  percentFromRatio,
  resourceTypeLabel,
  taskStatusLabel,
} from './utils/detailData'

const route = useRoute()
const router = useRouter()
const dashStore = useSpaceDashboardStore()
const { enterTask } = useStudyEntry()

const algorithmState = ref<LearningAlgorithmState | null>(null)
const algorithmLoading = ref(false)

const spaceId = computed(() => String(route.params.spaceId || ''))
const nodeId = computed(() => String(route.params.nodeId || ''))
const dashboard = computed(() => dashStore.dashboard)
const loading = computed(() => dashStore.loading || algorithmLoading.value)
const node = computed(() => dashboard.value?.pathNodes.find(item => item.id === nodeId.value) || null)
const knowledgeState = computed(() => findKnowledgeStateForNode(node.value, algorithmState.value))
const weakPoint = computed(() => findWeakPointForNode(node.value, algorithmState.value))
const masteryPercent = computed(() => nodeMasteryPercent(node.value, knowledgeState.value, dashboard.value?.progress || 0))
const confidencePercent = computed(() => percentFromRatio(knowledgeState.value?.confidence, node.value?.status === 'completed' ? 86 : 42))
const isWeak = computed(() => Boolean(weakPoint.value) || masteryPercent.value < 60)
const statusLabel = computed(() => {
  const map: Record<string, string> = { completed: '已完成', current: '学习中', locked: '未解锁' }
  return map[node.value?.status || ''] || '学习中'
})
const masteryRingStyle = computed(() => ({
  background: `conic-gradient(#0bb7aa ${masteryPercent.value * 3.6}deg, #e2e8f0 0deg)`,
}))
const allTasks = computed(() => allDashboardTasks(dashboard.value))
const relatedTasks = computed(() => node.value ? linkedTasks(allTasks.value, dashboard.value?.pathNodes || [], node.value.id) : [])
const relatedResources = computed(() => node.value ? linkedResources(dashboard.value?.resources || [], dashboard.value?.pathNodes || [], node.value.id) : [])
const weakTitle = computed(() => isWeak.value ? `「${node.value?.title}」是当前补弱优先级` : `「${node.value?.title}」适合做验证复盘`)
const weakReason = computed(() =>
  weakPoint.value?.explanationFacts
  || knowledgeState.value?.explanationFacts
  || algorithmState.value?.nextAction?.reason
  || '当前节点的掌握度证据还不完整，建议通过一次短练习或验证题补充判断依据。'
)
const evidenceList = computed(() => {
  const evidence = knowledgeState.value?.recentEvidence || weakPoint.value?.recentEvidence || []
  return evidence.slice(0, 4).map((item, index) => ({
    key: `${item.sourceType || 'evidence'}-${index}`,
    label: item.sourceType || '学习证据',
    value: item.score != null ? `${Math.round(Number(item.score) * 100)} 分` : item.isCorrect === true || item.isCorrect === 1 ? '答对' : '待复盘',
    detail: item.errorType || item.createdAt || 'Agent 会把这条证据纳入后续计划调整。',
  }))
})
const repairSteps = computed(() => [
  {
    title: relatedResources.value[0]?.title || `先看「${node.value?.title}」结构化讲义`,
    detail: '用 8-12 分钟建立概念边界，明确公式、条件和常见误区。',
  },
  {
    title: relatedTasks.value[0]?.title || '完成 2 组专项练习',
    detail: '优先选择基础题和错因相近题，避免直接跳到综合题。',
  },
  {
    title: '做 5 题验证测评',
    detail: '完成后把正确率、耗时和错因回写到学情报告，决定是否解除薄弱标记。',
  },
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

function goBack() {
  router.push({ path: `/space/${spaceId.value}`, query: { tab: 'path' } })
}

function goSpaceTab(tab: string) {
  router.push({ path: `/space/${spaceId.value}`, query: { tab } })
}

function goPlanAdjustment() {
  router.push({ path: `/space/${spaceId.value}/plan-adjustment`, query: { nodeId: nodeId.value } })
}

async function startTask(task: TaskVO) {
  if (task.status === 'pending') {
    await dashStore.startTask(task.id)
  }
  enterTask(task, { spaceId: spaceId.value, source: 'space_task' })
}

function openResource(resource: ResourceVO) {
  if (!resource.id) {
    ElMessage.info('该资源还在生成队列中')
    return
  }
  router.push(`/resources/${resource.id}`)
}

onMounted(loadPage)
watch(() => [route.params.spaceId, route.params.nodeId], loadPage)
</script>

<style scoped lang="scss">
.detail-shell {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 22px 0 34px;
}

.detail-hero,
.reason-band,
.panel {
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: #ffffff;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
}

.detail-hero {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  padding: 24px;
  border-radius: 18px;
  background: linear-gradient(135deg, #ffffff, #ecfdfb 58%, #f0f9ff);
}

.back-btn {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 12px;
  background: #0f172a;
  color: #ffffff;
  font-size: 30px;
  line-height: 1;
  cursor: pointer;
}

.eyebrow {
  color: #0a9e94;
  font-size: 0.72rem;
  font-weight: 900;
}

.hero-main h1,
.reason-band h2,
.panel h3 {
  margin: 5px 0 7px;
  color: #0f172a;
  line-height: 1.3;
}

.hero-main h1 {
  font-size: 1.7rem;
}

.hero-main p,
.reason-band p,
.panel p {
  margin: 0;
  color: #64748b;
  font-size: 0.86rem;
  line-height: 1.6;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.hero-tags span,
.task-row span,
.resource-card span {
  padding: 4px 10px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 800;
}

.mastery-panel {
  min-width: 150px;
  text-align: center;
}

.mastery-ring {
  position: relative;
  display: grid;
  place-items: center;
  width: 106px;
  height: 106px;
  margin: 0 auto 8px;
  border-radius: 50%;
}

.mastery-ring::before {
  content: '';
  position: absolute;
}

.mastery-ring strong,
.mastery-ring span {
  grid-area: 1 / 1;
  z-index: 1;
}

.mastery-ring strong {
  margin-top: -12px;
  color: #0f172a;
  font-size: 1.5rem;
}

.mastery-ring span {
  margin-top: 36px;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
}

.mastery-ring::after {
  content: '';
  grid-area: 1 / 1;
  width: 78px;
  height: 78px;
  border-radius: 50%;
  background: #ffffff;
  z-index: 0;
}

.reason-band {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  margin-top: 16px;
  padding: 18px 20px;
  border-radius: 16px;
}

.reason-band.weak {
  border-color: rgba(245, 158, 11, 0.25);
  background: linear-gradient(135deg, #fffbeb, #ffffff);
}

.reason-band button,
.panel-head-row button,
.task-row button,
.resource-card button {
  min-height: 34px;
  padding: 0 13px;
  border: 1px solid rgba(11, 183, 170, 0.24);
  border-radius: 10px;
  background: #ffffff;
  color: #0a9e94;
  font-size: 0.76rem;
  font-weight: 900;
  cursor: pointer;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.panel {
  min-width: 0;
  padding: 18px;
  border-radius: 16px;
}

.panel.wide {
  grid-column: 1 / -1;
}

.panel-head-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.evidence-list,
.step-list,
.task-list,
.resource-grid {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.evidence-item,
.repair-step,
.task-row,
.resource-card {
  min-width: 0;
  padding: 13px;
  border-radius: 13px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.evidence-item strong,
.repair-step strong,
.task-row strong,
.resource-card strong {
  display: block;
  margin: 5px 0;
  color: #0f172a;
  line-height: 1.35;
}

.repair-step {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
}

.repair-step > span {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ecfdfb;
  color: #0a9e94;
  font-weight: 900;
}

.task-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
}

.resource-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.resource-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resource-card button {
  margin-top: auto;
}

.skeleton {
  border-radius: 18px;
  background: linear-gradient(90deg, #f1f5f9, #e2e8f0, #f1f5f9);
  background-size: 220% 100%;
  animation: shimmer 1.2s linear infinite;
}

.skeleton.hero {
  height: 190px;
}

.skeleton.grid {
  height: 420px;
  margin-top: 16px;
}

@keyframes shimmer {
  to { background-position: -220% 0; }
}

@media (max-width: 820px) {
  .detail-hero,
  .reason-band,
  .task-row {
    grid-template-columns: 1fr;
  }

  .reason-band {
    flex-direction: column;
  }

  .detail-grid,
  .resource-grid {
    grid-template-columns: 1fr;
  }
}
</style>
