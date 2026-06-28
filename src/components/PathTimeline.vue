<template>
  <div class="path-timeline">
    <div
      v-for="(stage, idx) in stageNodes"
      :key="stage.id"
      class="path-node-wrapper"
      :class="[stage.status, { 'is-last': idx === stageNodes.length - 1 }]"
    >
      <div class="path-node" :class="{ 'has-children': expandedNodes.has(stage.id) }">
        <div class="node-marker">
          <div class="node-dot" :class="stage.status" @click="toggleNode(stage)">
            <svg v-if="stage.status === 'completed'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
            <svg v-else-if="stage.status === 'current'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="10" y1="11" x2="14" y2="11"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
            </svg>
          </div>
        </div>

        <div class="node-content" @click="toggleNode(stage)">
          <div class="node-header">
            <span class="node-index" v-if="stage.isMilestone">阶段 {{ idx + 1 }}</span>
            <span class="node-index sub" v-else>阶段 {{ idx + 1 }}</span>
            <span class="node-type-badge" v-if="stage.nodeType">{{ nodeTypeLabel(stage.nodeType) }}</span>
            <span class="node-milestone" v-if="stage.isMilestone">里程碑</span>
          </div>
          <h4 class="node-title">{{ stage.title }}</h4>
          <p class="node-desc" v-if="stage.description">{{ stage.description }}</p>
          <div class="node-meta">
            <span class="node-duration" v-if="stage.plannedDurationDays">计划 {{ stage.plannedDurationDays }} 天</span>
            <span class="node-duration" v-else-if="stage.estimatedDurationMinutes">{{ stage.estimatedDurationMinutes }} 分钟</span>
            <span class="node-difficulty" v-if="stage.difficultyLevel">难度 {{ stage.difficultyLevel }}</span>
            <span class="node-status-tag" :class="stage.status">{{ statusLabel(stage.status) }}</span>
            <span class="node-kp-count" v-if="getChildKps(stage.id).length">{{ getChildKps(stage.id).length }} 个知识点</span>
          </div>
        </div>

        <div class="node-chevron" :class="{ open: expandedNodes.has(stage.id) }">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="6,9 12,15 18,9"/>
          </svg>
        </div>
      </div>

      <!-- Expanded children: KPs (with their own resources) + stage tasks/resources -->
      <div class="node-children" v-if="expandedNodes.has(stage.id)">
        <!-- 子知识点列表 -->
        <div class="kp-list" v-if="getChildKps(stage.id).length">
          <span class="children-label">知识点</span>
          <div
            v-for="kp in getChildKps(stage.id)"
            :key="kp.id"
            class="kp-item"
            :class="kp.status"
          >
            <span class="kp-marker" :class="kp.status"></span>
            <div class="kp-body">
              <div class="kp-title">{{ kp.title }}</div>
              <div class="kp-meta" v-if="getNodeResources(kp.id).length || getNodeTasks(kp.id).length">
                <span v-if="getNodeTasks(kp.id).length">任务 {{ getNodeTasks(kp.id).length }}</span>
                <span v-if="getNodeResources(kp.id).length">资源 {{ getNodeResources(kp.id).length }}</span>
              </div>
            </div>
            <span class="kp-script-tag" :class="scriptStatusClass(scriptStatusOf(kp.id))">
              {{ scriptStatusLabel(scriptStatusOf(kp.id)) }}
            </span>
            <el-button
              class="kp-script-btn"
              size="small"
              :loading="scriptLoadingOf(kp.id)"
              :disabled="scriptStatusOf(kp.id) === 'generating'"
              @click.stop="generateScript(kp)"
            >
              {{ scriptActionLabel(scriptStatusOf(kp.id)) }}
            </el-button>
            <el-button
              class="kp-start-btn"
              size="small"
              type="primary"
              @click.stop="startNodeStudy(kp)"
            >
              开始学习
            </el-button>
            <span class="kp-status-tag" :class="kp.status">{{ statusLabel(kp.status) }}</span>
          </div>
        </div>

        <!-- 阶段任务 -->
        <div class="node-tasks" v-if="getNodeTasks(stage.id).length">
          <span class="children-label">阶段任务</span>
          <div class="node-task-item" v-for="t in getNodeTasks(stage.id)" :key="t.id">
            <span class="mini-dot" :class="t.status"></span>
            <span>{{ t.title }}</span>
            <span class="mini-status" :class="t.status">{{ miniStatusLabel(t.status) }}</span>
          </div>
        </div>

        <!-- 阶段资源 -->
        <div class="node-resources" v-if="getNodeResources(stage.id).length">
          <span class="children-label">阶段资源</span>
          <div class="node-resource-item" v-for="r in getNodeResources(stage.id)" :key="r.id">
            <span class="res-type-icon" :class="r.resourceType">{{ resourceIcon(r.resourceType) }}</span>
            <span>{{ r.title }}</span>
            <span class="res-source">{{ r.isAiGenerated ? 'AI生成' : '精选' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { lessonBundleApi } from '@/api/lessonBundle'
import { useStudyEntry } from '@/composables/useStudyEntry'
import type { PathNodeVO, TaskVO, ResourceVO } from '@/types/learningSpace'
import type { LessonBundleStatus, LessonBundleStatusVO } from '@/types/study'

const props = defineProps<{
  nodes: PathNodeVO[]
  tasks: TaskVO[]
  resources: ResourceVO[]
}>()

const { enterPathNodeStudy } = useStudyEntry()
const expandedNodes = ref(new Set<string>())
const scriptStates = ref<Record<string, {
  status: LessonBundleStatus
  loading: boolean
  bundleId?: string
}>>({})
const statusRefreshToken = ref(0)
let refreshTimer: ReturnType<typeof window.setTimeout> | null = null

// 顶层只展示 stage 节点（按 sortOrder 升序）
const stageNodes = computed(() =>
  [...props.nodes]
    .filter(n => n.nodeType === 'stage' || n.parentNodeId == null)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
)

function getChildKps(stageId: string): PathNodeVO[] {
  return props.nodes
    .filter(n => n.parentNodeId === stageId && n.nodeType === 'knowledge_point')
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

watch(
  () => props.nodes.map(n => `${n.id}:${n.status}`).join('|'),
  () => {
    scheduleScriptStatusRefresh()
  },
  { immediate: true }
)

onMounted(() => {
  window.addEventListener('focus', handleWindowFocus)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('focus', handleWindowFocus)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  if (refreshTimer) {
    window.clearTimeout(refreshTimer)
  }
})

function toggleNode(node: PathNodeVO) {
  const next = new Set(expandedNodes.value)
  if (next.has(node.id)) {
    next.delete(node.id)
  } else {
    next.add(node.id)
  }
  expandedNodes.value = next
}

function nodeTypeLabel(t: string) {
  const m: Record<string, string> = { module: '模块', stage: '阶段', objective: '目标', knowledge_point: '知识点' }
  return m[t] || t
}

function statusLabel(s: string) {
  const m: Record<string, string> = { completed: '已完成', current: '学习中', locked: '未解锁' }
  return m[s] || s
}

function scriptStatusOf(nodeId: string): LessonBundleStatus {
  return scriptStates.value[nodeId]?.status || 'not_generated'
}

function scriptLoadingOf(nodeId: string): boolean {
  return scriptStates.value[nodeId]?.loading || false
}

function scriptStatusLabel(status: LessonBundleStatus): string {
  const m: Record<LessonBundleStatus, string> = {
    not_generated: '未备课',
    generating: '生成中',
    ready: '已备课',
    failed: '生成失败',
    expired: '已过期',
    needs_refresh: '需更新',
  }
  return m[status] || '未备课'
}

function scriptStatusClass(status: LessonBundleStatus): string {
  if (status === 'ready') return 'ready'
  if (status === 'failed') return 'failed'
  if (status === 'expired' || status === 'needs_refresh') return 'stale'
  if (status === 'generating') return 'generating'
  return 'empty'
}

function scriptActionLabel(status: LessonBundleStatus): string {
  const m: Record<LessonBundleStatus, string> = {
    not_generated: '生成脚本',
    generating: '生成中',
    ready: '重新生成',
    failed: '重试生成',
    expired: '更新脚本',
    needs_refresh: '更新脚本',
  }
  return m[status] || '生成脚本'
}

function normalizeScriptStatus(status?: string): LessonBundleStatus {
  if (
    status === 'generating' ||
    status === 'ready' ||
    status === 'failed' ||
    status === 'expired' ||
    status === 'needs_refresh'
  ) {
    return status
  }
  return 'not_generated'
}

function applyScriptStatus(nodeId: string, status?: LessonBundleStatusVO) {
  scriptStates.value = {
    ...scriptStates.value,
    [nodeId]: {
      ...scriptStates.value[nodeId],
      status: normalizeScriptStatus(status?.status),
      loading: false,
      bundleId: status?.bundleId,
    }
  }
}

function setScriptState(nodeId: string, patch: Partial<{ status: LessonBundleStatus; loading: boolean; bundleId?: string }>) {
  scriptStates.value = {
    ...scriptStates.value,
    [nodeId]: {
      status: scriptStatusOf(nodeId),
      loading: scriptLoadingOf(nodeId),
      bundleId: scriptStates.value[nodeId]?.bundleId,
      ...patch,
    }
  }
}

function scheduleScriptStatusRefresh(delayMs = 120) {
  if (refreshTimer) {
    window.clearTimeout(refreshTimer)
  }
  refreshTimer = window.setTimeout(() => {
    refreshTimer = null
    loadScriptStatuses()
  }, delayMs)
}

function handleWindowFocus() {
  scheduleScriptStatusRefresh(0)
}

function handleVisibilityChange() {
  if (!document.hidden) {
    scheduleScriptStatusRefresh(0)
  }
}

async function loadScriptStatuses() {
  const token = statusRefreshToken.value + 1
  statusRefreshToken.value = token
  const knowledgeNodes = props.nodes.filter(n => n.nodeType === 'knowledge_point')
  await Promise.all(knowledgeNodes.map(async (node) => {
    try {
      const status = await lessonBundleApi.getByTarget({
        pathNodeId: node.id,
        mode: 'learn',
      })
      if (token !== statusRefreshToken.value) {
        return
      }
      applyScriptStatus(node.id, status)
    } catch {
      if (token !== statusRefreshToken.value) {
        return
      }
      applyScriptStatus(node.id)
    }
  }))
}

async function generateScript(node: PathNodeVO) {
  if (scriptLoadingOf(node.id)) {
    return
  }
  const previousStatus = scriptStatusOf(node.id)
  setScriptState(node.id, { status: 'generating', loading: true })
  try {
    const status = await lessonBundleApi.generate({
      pathNodeId: node.id,
      mode: 'learn',
      forceRegenerate: previousStatus === 'ready',
      generationTrigger: 'manual',
      generationReason: '用户在学习空间路径中提前生成知识点学习脚本',
    }, { showError: false })
    applyScriptStatus(node.id, status)
    ElMessage.success('学习脚本已准备好')
    scheduleScriptStatusRefresh(300)
  } catch (error) {
    setScriptState(node.id, { status: 'failed', loading: false })
    ElMessage.error('学习脚本生成失败，请稍后重试')
  } finally {
    setScriptState(node.id, { loading: false })
  }
}

function startNodeStudy(node: PathNodeVO) {
  enterPathNodeStudy(node.id, {
    mode: 'learn',
    source: 'path_node',
  })
}

function miniStatusLabel(s: string) {
  const m: Record<string, string> = { completed: '已完成', in_progress: '进行中', pending: '待开始', overdue: '已逾期' }
  return m[s] || s
}

function resourceIcon(t: string) {
  const m: Record<string, string> = { doc: '📄', video: '🎬', mind_map: '🧠', quiz: '📝', case_study: '📋', flashcard_set: '🃏', image: '🖼', audio: '🎵', link: '🔗', ppt: '📊' }
  return m[t] || '📄'
}

function getNodeTasks(nodeId: string) {
  return props.tasks.filter(t => t.pathNodeId === nodeId)
}

function getNodeResources(nodeId: string) {
  return props.resources.filter(r => r.pathNodeId === nodeId)
}
</script>

<script lang="ts">
export default { name: 'PathTimeline' }
</script>

<style scoped lang="scss">
.path-timeline {
  padding-left: 4px;
}

.path-node-wrapper {
  position: relative;

  &.locked { opacity: 0.45; }

  &::before {
    content: '';
    position: absolute;
    left: 13px;
    top: 28px;
    bottom: 0;
    width: 2px;
    background: #e5e7eb;
  }

  &.is-last::before {
    display: none;
  }

  &.completed::before {
    background: #10b981;
  }

  &.current::before {
    background: linear-gradient(to bottom, #3b82f6 50%, #e5e7eb 50%);
  }
}

.path-node {
  display: flex;
  gap: 16px;
  padding-bottom: 8px;
}

.node-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.node-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #e5e7eb;
  background: white;
  cursor: pointer;
  z-index: 1;
  transition: all 0.2s;

  &.completed { background: #10b981; border-color: #10b981; color: white; }
  &.current {
    background: #eff6ff;
    border-color: #3b82f6;
    color: #3b82f6;
    animation: pulse-ring 2s infinite;
  }
  &.locked { border-color: #d1d5db; color: #d1d5db; }

  &:hover { transform: scale(1.1); }
}

.node-content {
  flex: 1;
  min-width: 0;
  cursor: pointer;
  padding-bottom: 20px;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.node-index {
  font-size: 0.6875rem;
  color: #8c8ca1;
  font-weight: 600;

  &.sub { font-weight: 400; }
}

.node-type-badge {
  font-size: 0.625rem;
  padding: 1px 6px;
  border-radius: 99px;
  background: #f3f4f6;
  color: #6b7280;
}

.node-milestone {
  font-size: 0.625rem;
  padding: 1px 6px;
  border-radius: 99px;
  background: #fef3c7;
  color: #d97706;
}

.node-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 2px 0;
}

.node-desc {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0 0 8px;
  line-height: 1.4;
}

.node-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.node-duration {
  font-size: 0.75rem;
  color: #9ca3af;
}

.node-difficulty {
  font-size: 0.6875rem;
  padding: 1px 8px;
  border-radius: 99px;
  background: #f3f4f6;
  color: #6b7280;
}

.node-status-tag {
  font-size: 0.6875rem;
  padding: 1px 8px;
  border-radius: 99px;

  &.completed { background: #ecfdf5; color: #10b981; }
  &.current { background: #eff6ff; color: #3b82f6; }
  &.locked { background: #f3f4f6; color: #9ca3af; }
}

.node-kp-count {
  font-size: 0.6875rem;
  padding: 1px 8px;
  border-radius: 99px;
  background: #ede9fe;
  color: #7c3aed;
}

.node-chevron {
  display: flex;
  align-items: flex-start;
  padding-top: 6px;
  color: #9ca3af;
  cursor: pointer;
  transition: transform 0.2s;

  &.open { transform: rotate(180deg); }
}

/* Expanded children */
.node-children {
  margin-left: 44px;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
}

.children-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 8px;
  margin-top: 4px;
}

.kp-list { margin-bottom: 12px; }

.kp-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  font-size: 0.8125rem;
  color: #374151;
  background: white;
  border-radius: 8px;
  margin-bottom: 6px;
  border: 1px solid #f0f0f0;

  &.locked { opacity: 0.6; }
}

.kp-marker {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #d1d5db;

  &.completed { background: #10b981; }
  &.current { background: #3b82f6; }
}

.kp-body {
  flex: 1;
  min-width: 0;
}

.kp-title {
  font-weight: 500;
  color: #1a1a2e;
}

.kp-meta {
  display: flex;
  gap: 10px;
  font-size: 0.6875rem;
  color: #9ca3af;
  margin-top: 2px;
}

.kp-status-tag {
  font-size: 0.6875rem;
  padding: 1px 8px;
  border-radius: 99px;
  white-space: nowrap;

  &.completed { background: #ecfdf5; color: #10b981; }
  &.current { background: #eff6ff; color: #3b82f6; }
  &.locked { background: #f3f4f6; color: #9ca3af; }
}

.kp-script-tag {
  font-size: 0.6875rem;
  padding: 1px 8px;
  border-radius: 99px;
  white-space: nowrap;
  font-weight: 600;

  &.ready { background: #ecfdf5; color: #059669; }
  &.generating { background: #eff6ff; color: #2563eb; }
  &.failed { background: #fef2f2; color: #dc2626; }
  &.stale { background: #fffbeb; color: #d97706; }
  &.empty { background: #f3f4f6; color: #6b7280; }
}

.kp-script-btn,
.kp-start-btn {
  flex-shrink: 0;
}

.node-task-item, .node-resource-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 0.8125rem;
  color: #374151;
}

.mini-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.completed { background: #10b981; }
  &.in_progress { background: #3b82f6; }
  &.pending { background: #d1d5db; }
  &.overdue { background: #ef4444; }
}

.mini-status {
  font-size: 0.6875rem;
  margin-left: auto;
  color: #9ca3af;
}

.res-type-icon { font-size: 14px; }

.res-source {
  font-size: 0.6875rem;
  margin-left: auto;
  color: #9ca3af;
}

@keyframes pulse-ring {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
}
</style>
